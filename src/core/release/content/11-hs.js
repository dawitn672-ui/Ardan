// The release's event pack 11 of 30 (192 events, mostly hs_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-027). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  (function(){
    const C = A.C,
      F = p=>A.family(p),
      K = p=>{const f=A.family(p);return f?A.famKindOf(f):""},
      end = s=>(s=String(s||"").trim(),s&&(/[.!?"]$/.test(s)?s:s+".")),
      hash = s=>{let h=7;s=String(s||"");for(let i=0;i<s.length;i++)h=h*31+s.charCodeAt(i)|0;return Math.abs(h)},
      hpick = (arr,key)=>arr[hash(key)%arr.length],
      KT = (p,map)=>map[K(p)]!=null?map[K(p)]:map.def,
      MULT = {slave:.5,serf:.5,peasant:1,artisan:1.5,merchant:3,gentry:5,noble:12,royal:25},
      sc = (p,b)=>Math.max(1,Math.round(b*(MULT[p.status]||1))),
      pay = (p,n)=>{n=Math.max(0,Math.round(n||0)),!A.isAdult(p)&&A.S.family?A.S.family.wealth=Math.max(0,A.S.family.wealth-n):p.coin=Math.max(0,p.coin-n)},
      gain = (p,n)=>{n=Math.max(0,Math.round(n||0)),!A.isAdult(p)&&A.S.family?A.S.family.wealth+=n:p.coin+=n},
      X = (fn,decl)=>(p,ctx)=>{const a=fn?fn(p,ctx||{}):"",b=decl?A.applyFx(p,decl,ctx||{}):"";return[a,b].filter(s=>typeof s=="string"&&s).join(" ")},
      rs = (p,ctx,s)=>A.T(String(s),A.ctxTokens(p,ctx)),
      T = ctx=>ctx&&ctx.pid?A.P(ctx.pid):null,
      NOB = p=>C.famKind(p,"noble","gentry_mil","gentry"),
      AD = p=>C.adult(p)&&C.family(p)&&!C.ruler(p),
      ADK = (...k)=>p=>AD(p)&&C.famKind(p,...k),
      KID = p=>C.family(p)&&(C.child(p)||C.teen(p))&&C.ageAdj(p)>=5,
      CH = p=>C.family(p)&&C.child(p)&&C.ageAdj(p)>=5,
      TEEN = p=>C.family(p)&&C.teen(p),
      KIDK = (...k)=>p=>KID(p)&&C.famKind(p,...k),
      notHead = p=>!C.famHead(p),
      nm = s=>String(s||"").replace(/^The /,"the "),
      famName = p=>{const f=F(p);if(!f||!f.name)return"your family";const n=nm(f.name),m=n.match(/^the ([A-Z][\w'-]+?)s$/);return m?"the "+m[1]+" family":n},
      surFrom = name=>{let n=String(name||"").replace(/^(the|house|clan)\s+/i,"").replace(/^(hall|watch-hall|line|kin|chiefs|keepers|household) of /i,"");return n=n.replace(/,.*$/,"").replace(/\s+of\s+.*$/,"").replace(/\s+(line|kin|family|clan|chiefs|hall|house|household)$/i,"").trim(),/^[A-Z][\w'-]*( [A-Z][\w'-]*)?$/.test(n)?n:""},
      surOf = p=>{const f=F(p);for(const c of[p.sur,f&&f.sur])if(c&&/^[A-Z][\w'-]*( [A-Z][\w'-]*)?$/.test(c))return c;return surFrom(f&&f.name)||A.cultHouse(p.cult)},
      seatOf = p=>{const f=F(p);return f&&f.seat?f.seat:A.provName(p.home)},
      titleOf = p=>{const f=F(p);return f&&(f.great===!1?f.title:f.local||f.title)||"the head of the family"},
      WORDS = [
        "Hold Fast",
        "Ours by Right",
        "We Endure",
        "Faith and Iron",
        "Steady Hands",
        "Remember",
        "First In, Last Out",
        "Nothing Owed",
        "The Root Holds",
      ],
      wordsOf = p=>{const f=F(p);return f&&f.words?String(f.words).replace(/[.!]$/,""):hpick(WORDS,f?f.id||f.name:p.sur)},
      ARMS = [
        "a black tower on grey",
        "a red stag on white",
        "three gold wheat sheaves on green",
        "a silver fish on blue",
        "a white horse on red",
        "a black raven on gold",
        "a green oak on white",
        "a blue key on silver",
      ],
      armsOf = p=>{const f=F(p);return f&&f.arms?f.arms:hpick(ARMS,f?f.id||f.name:p.sur)},
      headP = p=>{const f=F(p),h=f&&f.headPid?A.P(f.headPid):null;return h&&h.alive&&h.id!==p.id?h:null},
      headTxt = p=>{const h=headP(p);if(!h)return"the head of the family";if((p.parents||[]).includes(h.id))return"your "+(h.sex==="M"?"father":"mother")+" "+h.given;const r=p.rel[h.id];return r&&["grandparent","uncle","sibling","cousin"].includes(r.type)?"your "+A.relLabel(h,r).toLowerCase()+" "+h.given:A.fullName(h)},
      liegeTxt = p=>{const f=F(p),l=f&&f.liege?A.house(f.liege):null;if(l&&l.name&&l.id!==f.id)return nm(l.name);const r=A.realm(p.realm),ru=r?A.P(r.ruler):null;return ru&&ru.id!==p.id?A.rulerStyle(ru,r):"your liege"},
      hName = id=>{const h=id?A.house(id):null;return h&&h.name?nm(h.name):null},
      otherHouse = (p,list)=>{const ids=(F(p)&&Array.isArray(list)?list:[]).filter(id=>hName(id)&&id!==p.house);if(ids.length)return hName(A.pick(ids));const loc=Object.values(LORE.houses).filter(h=>h.realm===p.realm&&h.id!==p.house&&h.kind!=="royal"&&h.great!==!1&&!/extinct/.test(h.title||""));if(loc.length&&C.famKind(p,"noble","royal","clan","clergy"))return nm(A.pick(loc).name);const s=A.cultHouse(p.cult);return KT(p,{noble:"House "+s,gentry_mil:"House "+s,royal:"House "+s,clan:"Clan "+s,def:"the "+s+" family"})},
      rivalOf = p=>{const f=F(p);return otherHouse(p,f&&f.rivals)},
      allyOf = p=>{const f=F(p);return otherHouse(p,f&&f.allies)},
      HOOKS = {
        noble: [
          "The liege wants more lances than the house can field this year.",
          "A neighbor house has moved a boundary stone on the high pasture.",
          "The bankers want the interest on the old war loan by Harvest Home.",
          "A match with a richer house is being talked of, and nobody has asked the bride.",
        ],
        gentry_mil: [
          "The muster rolls are short, and the family post depends on filling them.",
          "A young officer of another family wants the post your family has held for three generations.",
        ],
        merchant: [
          "A cargo is three weeks overdue and the insurers are asking questions.",
          "A rival house is undercutting the family on every bale.",
          "The counting-house books do not balance, and someone in the family knows why.",
        ],
        guild: [
          "The guild votes on the master's chair at the next feast.",
          "A journeyman has walked off with the family pattern-book.",
          "The town council wants to cut the guild's charter in half.",
        ],
        clergy: [
          "The bishop wants the family living for his own nephew.",
          "Pilgrims have stopped coming to the family shrine.",
        ],
        scholar: [
          "A treatise in the grandfather's hand has gone missing on the road.",
          "A rival family claims the house's best cure as its own.",
        ],
        sea: [
          "A ship is overdue and the wives are on the quay every morning.",
          "The yard needs new oak and the price has doubled.",
        ],
        horse: [
          "The crown wants more remounts than the studs can breed.",
          "A prize stallion has gone lame before the fair.",
        ],
        hunt: [
          "Poachers are in the lord's wood, and some of them are cousins.",
          "Something big is killing deer on the north ridge.",
        ],
        outlaw: [
          "The reeve has a new informer, and he drinks in your alehouse.",
          "A cousin sits in the lockup waiting for the assize.",
        ],
        clan: [
          "The grazing is thin, and another clan is moving its herds closer.",
          "Two cousins are feuding over a girl and a horse, in that order.",
        ],
        royal: ["Every cousin at court is counting the steps to the throne."],
        def: [
          "An old quarrel over land has woken up again.",
          "Money is short, and everyone is pretending it is not.",
        ],
      },
      hookOf = p=>{const f=F(p);return f&&Array.isArray(f.hooks)&&f.hooks.length?end(A.pick(f.hooks)):end(A.pick(HOOKS[K(p)]||HOOKS.def))},
      SECRETS = {
        noble: [
          "Your great-grandfather bought the title with a forged charter, and the original is still in a chest at the seat.",
          "The house's founder was not a knight at all, but a horse thief who married well.",
        ],
        merchant: [
          "The family fortune began with a cargo that was not the family's to sell.",
          "There is a second ledger, and it is not kept for the tax-farmers.",
        ],
        guild: [
          "The family masterpiece in the guildhall was made by an apprentice, not the master whose name is on it.",
          "The family's famous glaze is bought from a foreigner, not mixed at home.",
        ],
        clergy: [
          "The family relic was carved forty years ago by a cousin with a good knife.",
          "A great-aunt in holy orders bore a child, and the child is your grandfather.",
        ],
        scholar: [
          "Grandfather's famous cure killed more patients than it saved, and the family burned the case notes.",
        ],
        sea: ["The family's first ship was bought with a wrecker's lantern."],
        horse: ["The famous bloodline was crossed with a stolen mare from across the border."],
        hunt: ["The family has let outlaws winter in the deep wood for years, for a share of the game."],
        outlaw: [
          "Someone in the family has been selling names to the reeve.",
          "The old man buried a strongbox under the mill, and only he knows where.",
        ],
        def: [
          "Your grandmother was married to another man when she married your grandfather.",
          "The family fortune began with a debt that was never paid.",
        ],
      },
      secretOf = p=>{const f=F(p);return f&&f.secret?end(f.secret):end(A.pick(SECRETS[K(p)]||SECRETS.def))},
      ancestor = (p,ctx)=>{const f=F(p),d=f&&Array.isArray(f.famousDead)&&f.famousDead.length?A.pick(f.famousDead):null;if(d&&d[0]){ctx.anc=String(d[0]),ctx.ancDeed=end(d[2]||"Remembered at every feast");return}ctx.anc=A.givenName(p.cult,"M")+(p.sur?" "+p.sur:" the Elder"),ctx.ancDeed=A.pick(["Held the ford against three times his number.","Built the hall with his own hands and his neighbors' oxen.","Paid off the family debts in one great year and never said how.","Walked to the capital barefoot to plead for the family land, and won."])},
      histLine = p=>{const f=F(p),h=f&&(f.history||f.notes)||"",m=String(h).match(/^[^.]{20,220}\./);return m?m[0]:"The family has been here longer than anyone can remember."},
      milOf = p=>{const f=F(p);return f&&f.military?f.military:null},
      JOBK = {
        noble: "courtier",
        gentry_mil: "courtier",
        gentry: "courtier",
        royal: "courtier",
        merchant: "merchant",
        clergy: "clergy",
        sea: "sailor",
        horse: "herd",
        hunt: "hunter",
        outlaw: "thief",
        clan: "herd",
      },
      jobOf = p=>{const k=K(p),t=String(titleOf(p)).toLowerCase();return k==="guild"?/weav|dye|cloth|silk/.test(t)?"weaver":/brew|ale|beer/.test(t)?"brewer":/mason|stone|carv/.test(t)?"mason":/bow|arrow|fletch/.test(t)?"bowyer":/carpent|wood|joiner|cooper|ship/.test(t)?"carpenter":"smith":k==="scholar"?/bone|physic|heal|surgeon|doctor|herb|leech/.test(t)?"healer":"scribe":JOBK[k]||"servant"},
      TRADE = {
        noble: "the running of the estates",
        gentry_mil: "drill and the muster rolls",
        gentry: "the running of the estates",
        royal: "the ways of the court",
        merchant: "the ledger and the scales",
        guild: "the craft",
        clergy: "the rites",
        scholar: "letters and learning",
        sea: "boats and weather",
        horse: "horses",
        hunt: "the wood and its beasts",
        outlaw: "the family business",
        clan: "the herds and the old law",
        def: "the family trade",
      },
      SKK = {
        noble: "stewardship",
        gentry_mil: "command",
        gentry: "stewardship",
        royal: "etiquette",
        merchant: "trade",
        guild: "craft",
        clergy: "faith",
        scholar: "learning",
        sea: "sea",
        horse: "husbandry",
        hunt: "tracking",
        outlaw: "stealth",
        clan: "husbandry",
        def: "stewardship",
      },
      skillOf = p=>SKK[K(p)]||SKK.def,
      fill = (p,ctx)=>(ctx.fam=famName(p),ctx.Fam=A.cap(ctx.fam),ctx.seat=seatOf(p),ctx.lg=liegeTxt(p),ctx.Lg=A.cap(ctx.lg),ctx.head=headTxt(p),ctx.Head=A.cap(ctx.head),ctx.words=wordsOf(p),ctx.arms=armsOf(p),ctx.ftitle=titleOf(p),ctx.trade=TRADE[K(p)]||TRADE.def,ctx.sur=surOf(p),ctx),
      mkKin = (p,o)=>{o=o||{};const R=GD.RACES[p.race]||GD.RACES.human,sex=o.sex||(A.chance(.5)?"M":"F"),adj=Math.max(1,o.adj!=null?o.adj:C.ageAdj(p)+A.ri(-4,6)),age=Math.max(1,Math.round(adj*R.adult/16)),status=p.status==="royal"?"noble":p.status,x=A.newPerson({given:A.givenName(p.cult,sex),sex,race:p.race,realm:p.realm,cult:p.cult,faith:p.faith,born:A.S.year-age,status,home:p.home,house:p.house||null});return x.sur=p.sur,x.surMode=p.surMode,x.occ=o.occ||(A.isAdult(x)?A.pick(A.OCC[status]||A.OCC.peasant):"a child of the family"),x},
      mkOther = (p,house,o)=>{o=o||{};const R=GD.RACES[p.race]||GD.RACES.human,sex=o.sex||(A.chance(.5)?"M":"F"),adj=Math.max(1,o.adj!=null?o.adj:C.ageAdj(p)+A.ri(-4,6)),age=Math.max(1,Math.round(adj*R.adult/16)),status=o.status||(p.status==="royal"?"noble":p.status),x=A.newPerson({given:A.givenName(p.cult,sex),sex,race:p.race,realm:p.realm,cult:p.cult,faith:p.faith,born:A.S.year-age,status,home:p.home}),sur=house?surFrom(house):"";if(sur)x.sur=sur,x.surMode="house";else{const fn=A.familyName({cult:p.cult,realm:p.realm,status,home:p.home,sex});x.sur=fn.sur,x.surMode=fn.mode}return x.occ=o.occ||(A.isAdult(x)?A.pick(A.OCC[status]||A.OCC.peasant):"a child"),x},
      sexWords = (ctx,x)=>{if(!x)return;const m=x.sex==="M";ctx.cz="cousin",ctx.ua=m?"uncle":"aunt",ctx.bs=m?"brother":"sister",ctx.sd=m?"son":"daughter",ctx.mw=m?"man":"woman",ctx.ln=m?"nephew":"niece",ctx.He=m?"He":"She",ctx.His=m?"His":"Her"},
      kinPid = (p,ctx,o)=>{const x=mkKin(p,o);return ctx.pid=x.id,sexWords(ctx,x),x},
      headPid = (p,ctx)=>{const h=headP(p);return h?(ctx.pid=h.id,sexWords(ctx,h),h):kinPid(p,ctx,{adj:Math.max(C.ageAdj(p)+20,45),occ:"head of the family"})},
      sibElder = p=>A.relsOf(p,["sibling"]).some(x=>x.p&&x.p.alive&&x.p.born<p.born),
      kidsOf = p=>(p.children||[]).map(A.P).filter(c=>c&&c.alive),
      // [X1 baked patch events/79-beast-scenes BEAST-NEAR-HELPER] The hs_* scenes' beastNear helper fell back to a cave
      // bear (CRE-25) when no beast lives near home; cave bears live in two regions. The scene is now skipped there
      // instead.
      beastNear = (p,ctx)=>{let b=[];try{b=A.beastsNear(p)||[]}catch{b=[]}b.length?ctx.beast=A.pick(b):(ctx.beast="CRE-25",ctx.skip=1),A.BEASTS[ctx.beast]||(ctx.beast="CRE-25");const c=(LORE.creatures||[]).find(x=>x.id===ctx.beast),n=c?String(c.name):"a great bear";ctx.bname=c?/^The /.test(n)?"the"+n.slice(3):(/^[AEIOU]/.test(n)?"an ":"a ")+n:n},
      realmCap = p=>{const r=A.realm(p.realm);return r&&r.capital?r.capital:"the capital"};
    A.defEvents([
      {
        id: "hs_secret_out",
        cond: AD,
        w: .8,
        cool: 20,
        title: "The family secret",
        setup: (p,ctx)=>{fill(p,ctx),ctx.secret=secretOf(p),ctx.who=A.pick(["a drunk old servant","a sacked clerk","a jilted suitor","a cousin who has nothing left to lose","a ballad-seller with a long memory"])},
        text: "Every family has one. Yours is out. {who} is telling anyone in {home} who will listen: {secret} People stop talking when you walk into the alehouse.",
        choices: [
          {
            t: "Deny it, loudly and well",
            check: {s:"deception",s2:"wil",d:48},
            win: {
              r: "You laugh it off so well that people start to doubt the teller. In a month it is just a story.",
              fx: {skill:{deception:2},wil:.4},
            },
            lose: {r:"You protest too much. Now people believe it twice over.",fx:{fame:-1,honor:-3,happy:-4}},
          },
          {
            t: 'Own it: "Yes. And we are still here."',
            r: "The truth, said plainly, takes the fun out of the gossip. Some respect you for it. Some never will.",
            fx: {honor:4,happy:-2,wil:1},
          },
          {
            t: "Pay the teller to go quiet",
            r: (p,ctx)=>`Money changes hands behind the tannery. The talk dies down. You will wonder for years whether ${A.pick(["the money was enough","it will come back","someone else heard it first"])}.`,
            fx: X((p,ctx)=>pay(p,sc(p,15)),{honor:-2}),
          },
          {
            t: "Go to {head} and ask what is true",
            req: p=>!C.famHead(p),
            r: "A long, quiet talk by the fire. You learn more than the gossip knew, and you are trusted with it now.",
            fx: {int:.3,skill:{intrigue:2},flag:"hs_knows_secret"},
          },
        ],
      },
      {
        id: "hs_black_sheep",
        cond: AD,
        cool: 12,
        title: "The black sheep comes home",
        setup: (p,ctx)=>{fill(p,ctx),kinPid(p,ctx,{adj:C.ageAdj(p)+A.ri(2,12)}),ctx.past=A.pick(["ran off with the strongbox key","was thrown out after the business with the miller's wife","went soldiering and was reported dead","lost a farm at dice in one night","turned up drunk at a funeral and has not been seen since"])},
        text: 'Your {cz} {them}, the one who {past}, is back at {seat}. Thinner, grey at the temples, hat in hand. {He} asks to stay "just until spring".',
        choices: [
          {
            t: "Take {themHim} in",
            r: "{them} chops wood, fixes the gate, and tells the best stories at supper. Some of the family will not speak to you for it.",
            fx: {them:{type:"cousin",op:30},happy:3,honor:1},
          },
          {
            t: "Give {themHim} work, and watch {themHim}",
            check: {s:"ins",s2:"stewardship",d:42},
            win: {
              r: "You catch {them} once with a hand near the cashbox, and say nothing. {He} never tries again, and works hard for you.",
              fx: {them:{type:"cousin",op:20},skill:{stewardship:2}},
            },
            lose: {
              r: "By spring {them} has gone again, and so has a good cloak and a silver cup.",
              fx: p=>(pay(p,sc(p,6)),A.willGrow(p,.4),""),
            },
          },
          {
            t: "Turn {themHim} away at the gate",
            r: '"The family has had enough of you." {them} nods as if {theyHe} expected it, and walks back down the road.',
            fx: {them:{type:"cousin",op:-30},wil:.5,happy:-2},
          },
        ],
      },
      {
        id: "hs_will",
        cond: AD,
        w: .8,
        cool: 15,
        title: "The reading of the will",
        setup: (p,ctx)=>{fill(p,ctx),ctx.dead=A.pick(["great-uncle","great-aunt","grandmother's cousin","old bachelor uncle"]),ctx.gift=A.pick(["a locked chest nobody can open","a bad-tempered horse","a field that floods every spring","a bundle of letters and a silver spoon","the old dog and his debts"]),ctx.sum=sc(p,20)},
        text: p=>`Your ${A.pick(["great-uncle","great-aunt"])} has died, and the family gathers at {seat} to hear the will ${A.pick(["read by a notary in black","spoken by the eldest from memory","carved on a slate and read aloud"])}. The cousins get money. You get {gift}. Somebody snorts.`,
        choices: [
          {
            t: "Contest the will",
            check: {s:"persuasion",s2:"learning",d:50},
            win: {
              r: "You find a clause the notary skipped. A share of the money is yours, and so is the cousins' hatred.",
              fx: X((p,ctx)=>gain(p,ctx.sum),{newRel:{type:"rival",op:-25}}),
            },
            lose: {
              r: "The judge reads the will twice and rules against you. The cousins buy each other drinks.",
              fx: X(p=>pay(p,sc(p,4)),{happy:-4}),
            },
          },
          {
            t: "Accept it with good grace",
            r: p=>A.chance(.35)?"You take your strange gift home. Inside it, months later, you find something worth far more than the cousins got.":"You take your strange gift home. It is exactly as useless as it looked. The family thinks better of you for not whining.",
            fx: (p,ctx)=>{A.chance(.35)&&gain(p,ctx.sum*2),p.honor=A.clamp(p.honor+2,0,100)},
          },
          {
            t: "Give your share to the poorest cousin",
            r: "The poorest cousin cries. The rest look ashamed of themselves, which is a gift too.",
            fx: {honor:4,piety:2,newRel:{type:"friend",op:35}},
          },
        ],
      },
      {
        id: "hs_reunion",
        cond: AD,
        cool: 9,
        title: "Everyone comes home",
        setup: (p,ctx)=>{fill(p,ctx),ctx.fest=A.pick(GD.FESTIVALS)[0],kinPid(p,ctx,{adj:C.ageAdj(p)+A.ri(-3,3)})},
        text: "For {fest} every branch of {fam} comes home to {familySeat}: forty people, three tables, one roast that will not be enough. Your {cz} {them} has grown up loud and handsome, and wants to know what you have done with your life.",
        choices: [
          {
            t: "Challenge {them} to wrestle, like when you were small",
            check: {s:"unarmed",s2:"str",d:40},
            win: {
              r: "You pin {themHim} in the mud before the whole family. The old men cheer. {them} laughs and demands a rematch next year.",
              fx: {them:{type:"cousin",op:15},fame:1,happy:5,str:.3},
            },
            lose: {
              r: "{them} throws you into the duck pond. The story will be told at every reunion until you die.",
              fx: {them:{type:"cousin",op:10},happy:-1,wil:.3},
            },
          },
          {
            t: "Sit with the old folk and hear the family stories",
            r: p=>`You hear how the family came to {seat}, who married whom, who fell out with whom. ${end(histLine(p))}`,
            fx: {skill:{diplomacy:1,learning:1},int:.2,happy:3},
          },
          {
            t: "Raise a cup to the family words",
            check: {s:"persuasion",s2:"wil",d:36},
            win: {
              r: 'Forty cups go up: "{words}!" For one evening the whole family is one thing, and you started it.',
              fx: {honor:2,fame:1,happy:6},
            },
            lose: {r:"You forget how the toast goes halfway through. An aunt finishes it for you.",fx:{happy:-2}},
          },
          {
            t: "Slip away early",
            r: "You ride home under the stars, alone and glad of it. The family will say you have got proud.",
            fx: {happy:1,them:{type:"cousin",op:-5}},
          },
        ],
      },
      {
        id: "hs_cousin_betrayal",
        cond: AD,
        w: .8,
        cool: 14,
        title: "A cousin's betrayal",
        setup: (p,ctx)=>{fill(p,ctx),kinPid(p,ctx),ctx.rv=rivalOf(p),ctx.Rv=A.cap(ctx.rv),ctx.what=KT(p,{merchant:"the family's prices for next season",guild:"the family's pattern-book",outlaw:"where the family keeps its stores",sea:"the family's sailing dates",horse:"which mares carry the best line",noble:"the house's letters to the liege",def:"family business that was not theirs to sell"})},
        text: "You learn it from a friend who owes you: your {cz} {them} has sold {what} to {rv}. For money, or spite, or both. {them} still eats at the family table.",
        choices: [
          {
            t: "Confront {themHim} in the yard",
            r: "Words, then shoving, then fists.",
            fx: {
              them: {type:"enemy",op:-35},
              duel: {
                foe: "them",
                opts: {kind:"brawl",place:"the yard at {seat}",lethal:!1,toYield:!0,title:"A cousin's betrayal"},
              },
            },
          },
          {
            t: "Bring the proof to {head}",
            req: p=>!C.famHead(p),
            check: {s:"intrigue",s2:"int",d:44},
            win: {
              r: "{them} is sent away from {seat} in disgrace. The family knows who kept faith.",
              fx: {them:{type:"enemy",op:-40},honor:3,fame:1},
            },
            lose: {
              r: "Your proof is thin. {them} weeps, swears, and is believed. Now you are the one who accused family.",
              fx: {them:{type:"enemy",op:-30},honor:-2,happy:-4},
            },
          },
          {
            t: "Feed {themHim} false news to sell next time",
            check: {s:"deception",s2:"intrigue",d:46},
            win: {
              r: "{Rv} pays good money for a lie and acts on it. They lose far more than {them} ever earned them.",
              fx: {skill:{intrigue:3,deception:2},fame:1},
            },
            lose: {
              r: "{them} smells the trap and stops selling. {He} also stops speaking to you.",
              fx: {them:{type:"rival",op:-20},skill:{intrigue:1}},
            },
          },
          {
            t: "Forgive {themHim}, quietly",
            r: "You tell {them} you know, and that it ends now. {He} weeps. Whether it ends is up to {themHim}.",
            fx: {them:{type:"cousin",op:15},honor:2,wil:.6},
          },
        ],
      },
      {
        id: "hs_name_mud",
        cond: AD,
        cool: 12,
        title: "The name in the mud",
        setup: (p,ctx)=>{fill(p,ctx),ctx.sin=KT(p,{merchant:"short weights and watered wine",guild:"shoddy work sold dear",outlaw:"thieving, which is fair, and murder, which is not",clergy:"fat priests and thin sermons",noble:"cowardice at the last war",gentry_mil:"cowardice at the last war",sea:"wrecking ships for salvage",def:"meanness, pride and a bad smell"})},
        text: 'A song is going round the alehouses of {home}. It is about {fam}, it rhymes "{sur}" with something rude, and it accuses the family of {sin}. Children sing it at you in the street.',
        choices: [
          {
            t: "Answer with a better song",
            check: {s:"music",s2:"int",d:45},
            win: {
              r: "Your song is funnier and it is about the man who wrote the first one. By the fair, his is forgotten.",
              fx: {skill:{music:3},fame:2,happy:5},
            },
            lose: {
              r: "Your song is earnest and nobody sings it. The first one gets a new verse, about you.",
              fx: {happy:-5,wil:.6},
            },
          },
          {
            t: "Find the singer and thrash him",
            r: "He is behind the alehouse, and he has friends.",
            fx: {
              honor: -1,
              duel: {
                tier: 1,
                title: "a ballad-singer",
                opts: {kind:"brawl",place:"behind the alehouse",lethal:!1,toYield:!0,title:"A matter of a song"},
              },
            },
          },
          {
            t: "Pay the minstrels to stop singing it",
            r: p=>"They stop, in your hearing. The song goes underground, which only makes it more popular.",
            fx: X(p=>pay(p,sc(p,4)),{happy:-2}),
          },
          {
            t: "Laugh, and sing along",
            r: "You know all the words by Midsummer. The joke stops being funny when its target enjoys it.",
            fx: {happy:2,wil:.8,honor:1},
          },
        ],
      },
      {
        id: "hs_connections",
        cond: p=>AD(p)&&!C.job(p)&&!C.soldier(p)&&!C.unfree(p),
        w: 1.2,
        cool: 8,
        title: "A word in the right ear",
        setup: (p,ctx)=>{fill(p,ctx),ctx.job=jobOf(p),ctx.jn=(GD.CAREERS[ctx.job]||{}).name||ctx.job},
        text: "{Head} has written a letter for you. With the family name on it, there is a place waiting: {trade}, under someone who owes {fam} a favor. You only have to say yes.",
        choices: [
          {
            t: "Take the place the family found you",
            r: (p,ctx)=>"You start next week. Everyone knows how you got the place, and you will have to work twice as hard to prove you deserve it.",
            fx: (p,ctx)=>(GD.CAREERS[ctx.job]&&(p.job={c:ctx.job,r:0,y:0,perf:58}),A.trainSkill(p,skillOf(p),1),""),
          },
          {
            t: "Burn the letter. You will make your own way",
            r: "The family calls it pride. You call it the only thing that is yours.",
            fx: {wil:1,honor:2,trait:"stubborn"},
          },
          {
            t: "Ask for a purse instead of a post",
            check: {s:"persuasion",s2:"diplomacy",d:42},
            win: {r:"A purse it is, with a sigh and a lecture.",fx:p=>(gain(p,sc(p,15)),"")},
            lose: {r:"The answer is no, and the letter is taken back too.",fx:{happy:-3,rel:{who:"father",op:-5}}},
          },
        ],
      },
      {
        id: "hs_colors",
        cond: AD,
        cool: 12,
        title: "The family colors",
        setup: (p,ctx)=>{fill(p,ctx),ctx.occ=A.pick(["the Midsummer procession","the town's holy-day parade","the guild and kin muster at the fair","a funeral of a great neighbor"])},
        text: "You are chosen to carry the colors of {fam} at {occ}: {arms}, freshly stitched by the women of the house. It is heavy, the wind is high, and everyone will be watching.",
        choices: [
          {
            t: "Carry it high the whole way",
            check: {s:"sta",s2:"wil",d:40},
            win: {
              r: "The banner never dips, not even in the gusts at the bridge. Old men nod. That is a true {sur} for you.",
              fx: {fame:2,honor:3,sta:.4},
            },
            lose: {
              r: "A gust takes it at the bridge and you go down with it into the gutter. The colors are muddy for the rest of the day.",
              fx: {happy:-5,honor:-1,wil:.5},
            },
          },
          {
            t: "Add a flourish: dip it to the crowd",
            check: {s:"etiquette",s2:"spd",d:44},
            win: {r:"The crowd cheers the dip. A pretty stranger asks who you are.",fx:{fame:2,happy:5,looks:1}},
            lose: {r:"You dip it into a brazier. A singed banner is a bad omen, the aunts say.",fx:{happy:-4}},
          },
          {
            t: "Hand it to a younger cousin who wants it more",
            r: "The child glows all day. You walk behind, which is a fine place to see a parade from.",
            fx: {honor:2,happy:2,newRel:{type:"friend",op:25}},
          },
        ],
      },
      {
        id: "hs_ancestor_truth",
        cond: AD,
        w: .8,
        once: !0,
        title: "What really happened",
        setup: (p,ctx)=>{fill(p,ctx),ancestor(p,ctx)},
        text: 'Every child of {fam} grows up on the tale of {anc}. The plaque at {seat} says: "{ancDeed}" Now an old woman in {town} tells you how it really happened, and it is a smaller, uglier story.',
        choices: [
          {
            t: "Write the true story down",
            req: p=>p.literate,
            r: "You write it plainly and put it with the family papers. One day somebody will thank you, or burn it.",
            fx: {honor:3,skill:{learning:2},wil:.5},
          },
          {
            t: "Keep the legend. Families need legends",
            r: "You never repeat what she told you. At the next feast you raise your cup to {anc} like everyone else.",
            fx: {happy:1,wil:.3},
          },
          {
            t: "Tell the cousins, for the fun of it",
            check: {s:"persuasion",s2:"int",d:40},
            win: {
              r: "Half of them are horrified and half of them laugh till they cry. The family is a little less stiff afterwards.",
              fx: {happy:4,skill:{persuasion:1}},
            },
            lose: {
              r: "Nobody believes you, and an aunt calls you a disgrace to the blood.",
              fx: {happy:-3,rel:{who:"mother",op:-5}},
            },
          },
        ],
      },
      {
        id: "hs_hook",
        cond: p=>AD(p)&&notHead(p),
        w: 1.2,
        cool: 6,
        title: "Trouble in the house",
        setup: (p,ctx)=>{fill(p,ctx),ctx.hook=hookOf(p),headPid(p,ctx)},
        text: 'At {seat} there is only one thing anyone talks about this year. {hook} {Head} takes you aside: "You have a head on your shoulders. Help me with this."',
        choices: [
          {
            t: "Talk to the people who matter",
            check: {s:"diplomacy",s2:"persuasion",d:48},
            win: {
              r: "Three visits, two dinners and one long walk. It is not solved, but it is no longer getting worse, and the family knows who did that.",
              fx: {them:{op:15},skill:{diplomacy:3},fame:1,honor:2},
            },
            lose: {
              r: "You say the wrong thing to the wrong person. The trouble is now a little worse.",
              fx: {them:{op:-8},skill:{diplomacy:1},happy:-3},
            },
          },
          {
            t: "Dig into it quietly",
            check: {s:"intrigue",s2:"int",d:46},
            win: {
              r: "You find who is behind it and what they want. Knowledge is half of any fix.",
              fx: {them:{op:12},skill:{intrigue:3},int:.3},
            },
            lose: {
              r: "Your questions are noticed, and someone starts asking questions about you.",
              fx: {skill:{intrigue:1},happy:-2},
            },
          },
          {
            t: "Put your own money into it",
            r: "Money fixes most things for a while. The family remembers that you paid when it counted.",
            fx: X(p=>pay(p,sc(p,20)),{them:{op:18},honor:2}),
          },
          {
            t: "Say it is not your problem",
            r: "{them} nods slowly. You will not be asked again, about this or much else.",
            fx: {them:{op:-15},happy:1},
          },
        ],
      },
      {
        id: "hs_rival_insult",
        cond: AD,
        cool: 8,
        title: "An insult at the fair",
        setup: (p,ctx)=>{fill(p,ctx),ctx.rv=rivalOf(p),ctx.Rv=A.cap(ctx.rv);const x=mkOther(p,ctx.rv,{adj:C.ageAdj(p)+A.ri(-3,4)});ctx.pid=x.id,sexWords(ctx,x),ctx.jab=rs(p,ctx,A.pick(['"Is that a {sur}? I thought I smelled something."',`"Your family's word is worth less than a clipped penny."`,'"How is your grandfather? Still lying in the same churchyard he stole?"','"Tell {head} we have not forgotten. Or forgiven."']))},
        text: "At the fair in {home} you come face to face with {themFull} of {rv}, the family your people have hated since before you were born. {them} looks you up and down and says, loud enough for the stalls to hear: {jab}",
        choices: [
          {
            t: "Answer with steel",
            r: "The crowd backs away into a ring.",
            fx: {
              them: {type:"enemy",op:-40},
              honor: 1,
              duel: {foe:"them",opts:{kind:"duel",place:"the fairground",lethal:!1,toYield:!0,title:"A family quarrel"}},
            },
          },
          {
            t: "Answer with a sharper tongue",
            check: {s:"persuasion",s2:"int",d:44},
            win: {
              r: "Your reply is so cutting that the crowd laughs at {them}, not you. {He} goes red and walks off.",
              fx: {them:{type:"rival",op:-20},fame:1,happy:4},
            },
            lose: {
              r: "You stumble over your reply. {them} laughs. So do the stalls.",
              fx: {them:{type:"rival",op:-15},happy:-4},
            },
          },
          {
            t: "Ignore {themHim} and buy your cheese",
            r: "It costs you to walk away. It costs {them} more: {theyHe} came for a fight and got nothing.",
            fx: {them:{type:"rival",op:-10},wil:.8},
          },
          {
            t: "Offer {themHim} a drink and a truce",
            check: {s:"diplomacy",s2:"wil",d:52},
            win: {
              r: "Astonished, {them} accepts. Over cider you find you hate the same people. Not a friendship yet, but a start.",
              fx: {them:{type:"acquaint",op:20},honor:2,skill:{diplomacy:2}},
            },
            lose: {
              r: '{them} pours the cider on the ground. "My family does not drink with yours."',
              fx: {them:{type:"rival",op:-15},happy:-2},
            },
          },
        ],
      },
      {
        id: "hs_feud_match",
        cond: p=>AD(p)&&!C.married(p)&&C.ageAdj(p)<40,
        cool: 12,
        title: "A match to end a feud",
        setup: (p,ctx)=>{fill(p,ctx),ctx.rv=rivalOf(p),ctx.Rv=A.cap(ctx.rv);const x=mkOther(p,ctx.rv,{sex:p.flags.likes||(p.sex==="M"?"F":"M"),adj:C.ageAdj(p)+A.ri(-3,3)});ctx.pid=x.id,sexWords(ctx,x)},
        text: "Two old enemies, {fam} and {rv}, are tired of burying sons. The elders have a plan: a wedding. Yours, to {themFull}, {themAge}, whom you have only ever seen across a courtroom.",
        choices: [
          {
            t: "Agree, for the peace",
            r: "A wedding with half the guests armed. But the knives stay sheathed, and two families sit at one table for the first time in living memory.",
            fx: (p,ctx)=>{const t=T(ctx);return t&&!C.married(p)&&A.marry(p,t),p.honor=A.clamp(p.honor+5,0,100),A.fame(p,2),""},
          },
          {
            t: "Ask to meet {themHim} first, alone",
            check: {s:"diplomacy",s2:"int",d:42,bonus:p=>p.looks/5-10},
            win: {
              r: "An hour by the river. {them} is funny, and furious about the same things you are. You might, possibly, like {themHim}.",
              fx: {them:{type:"lover",op:30,back:"lover"},happy:6},
            },
            lose: {
              r: "The hour is cold and full of old grievances. You both report back that it will never work.",
              fx: {them:{type:"rival",op:-10},happy:-2},
            },
          },
          {
            t: "Refuse. Some things cannot be mended by a wedding",
            r: "The elders are furious. The feud goes on, and the next funeral will be on your conscience, they say.",
            fx: {rel:{who:"father",op:-10},honor:-2,wil:.5,trait:"stubborn"},
          },
        ],
      },
      {
        id: "hs_cousin_loan",
        cond: AD,
        cool: 8,
        title: "A cousin needs money",
        setup: (p,ctx)=>{fill(p,ctx),kinPid(p,ctx),ctx.why=A.pick(["the roof fell in on the children's room","a debt to a man with a scarred face","a daughter's dowry","seed corn after a bad year","a lawsuit over a boundary hedge"]),ctx.sum=sc(p,12)},
        text: 'Your {cz} {them} comes to your door, ashamed, and asks for {sum} suns for {why}. "We are family. I will pay it back by Harvest Home. I swear on the name."',
        choices: [
          {
            t: "Lend it (and write it down)",
            r: p=>A.chance(.55)?"Paid back at Harvest Home, with a cheese for interest. Family is family.":"Harvest Home comes and goes. So does the next one.",
            fx: (p,ctx)=>{const t=T(ctx);A.chance(.55)?t&&A.link(p,t,"cousin",30,"cousin"):(pay(p,ctx.sum),t&&A.link(p,t,"cousin",10,"cousin"),A.willGrow(p,.3))},
          },
          {
            t: "Give it, as a gift",
            req: (p,C2,ctx)=>p.coin>=(ctx&&ctx.sum||0),
            r: '"No talk of paying back." {them} hugs you so hard your ribs ache.',
            fx: X((p,ctx)=>pay(p,ctx.sum),{them:{type:"cousin",op:35},honor:2,happy:3}),
          },
          {
            t: "Refuse",
            r: "{them} goes white and leaves without another word. You tell yourself you had good reasons.",
            fx: {them:{type:"cousin",op:-25},happy:-2},
          },
        ],
      },
      {
        id: "hs_blood_price",
        cond: AD,
        w: .6,
        cool: 18,
        title: "A cousin killed",
        setup: (p,ctx)=>{fill(p,ctx),ctx.rv=rivalOf(p),ctx.Rv=A.cap(ctx.rv),ctx.dead=A.givenName(p.cult,"M");const x=mkOther(p,ctx.rv,{sex:"M",adj:C.ageAdj(p)+A.ri(-2,6)});ctx.pid=x.id,sexWords(ctx,x)},
        text: "Your cousin {dead} is dead, knifed at a crossroads in a quarrel nobody can quite explain. The killer is {themFull} of {rv}. At the burial the young men of {fam} look at you. The old women look at you harder.",
        choices: [
          {
            t: "Demand the blood-price before the law",
            check: {s:"persuasion",s2:"diplomacy",d:48},
            win: {
              r: "The court sets the price and {rv} pays it in full. The widow is fed for years. The young men grumble that money is not blood.",
              fx: X(p=>gain(p,sc(p,10)),{honor:3,them:{type:"enemy",op:-30}}),
            },
            lose: {
              r: "The court rules it a fair fight. {Rv} pays nothing. The young men stop grumbling and start sharpening.",
              fx: {them:{type:"enemy",op:-40},happy:-5,flag:"hs_feud"},
            },
          },
          {
            t: "Hunt {them} down yourself",
            r: "You find {themHim} on the road at dusk. Neither of you says anything.",
            fx: {
              them: {type:"enemy",op:-60},
              flag: "hs_feud",
              duel: {foe:"them",opts:{kind:"duel",place:"the dusk road",lethal:!0,toYield:!1,title:"Blood for blood"}},
            },
          },
          {
            t: "Speak at the grave against more killing",
            check: {s:"wil",s2:"persuasion",d:50},
            win: {
              r: "You say it plainly: one grave is enough. Somehow, they listen. The feud does not end, but it sleeps.",
              fx: {honor:4,wil:1.5,fame:1},
            },
            lose: {
              r: "They call you a coward to your face, at your cousin's grave. Two of them ride out that night anyway.",
              fx: {honor:-3,happy:-6,wil:1.2,flag:"hs_feud"},
            },
          },
        ],
      },
      {
        id: "hs_matriarch",
        cond: p=>AD(p)&&C.ageAdj(p)<45,
        cool: 12,
        title: "Summoned by the old one",
        setup: (p,ctx)=>{fill(p,ctx);const x=kinPid(p,ctx,{sex:"F",adj:72,occ:"the family's eldest"});ctx.gran=x.given},
        text: 'Great-aunt {gran} is the oldest of {fam} and frightens everyone, including {head}. She has sent for you. She sits by the fire at {seat}, looks you up and down for a long time, and says: "Well. Tell me what you have done with our name."',
        choices: [
          {
            t: "Tell her the truth, all of it",
            r: 'She listens without a word. Then she laughs, coughs, and presses a purse into your hand. "At least you are not boring."',
            fx: X(p=>gain(p,sc(p,10)),{them:{type:"uncle",op:30},honor:2}),
          },
          {
            t: "Make yourself sound grander",
            check: {s:"deception",s2:"persuasion",d:55},
            win: {
              r: "She believes every word, or pretends to. Either way she tells the whole family how well you are doing.",
              fx: {them:{type:"uncle",op:15},fame:1},
            },
            lose: {
              r: '"I was lying to my elders before your grandfather was born." She sends you away with a flea in your ear.',
              fx: {them:{type:"uncle",op:-15},happy:-4},
            },
          },
          {
            t: "Ask her about the old days instead",
            r: "Her eyes light up. Three hours later you know where the family silver was buried in the bad war, and why nobody speaks to the cousins at {town}.",
            fx: {them:{type:"uncle",op:25},skill:{intrigue:2},int:.3},
          },
        ],
      },
      {
        id: "hs_chronicle",
        cond: p=>AD(p)&&p.literate,
        cool: 15,
        title: "The family book",
        setup: (p,ctx)=>{fill(p,ctx)},
        text: 'At {seat} there is a book, bound in calfskin, where each generation of {fam} writes down what it did. Births, deaths, lawsuits, a few great deeds. {Head} hands you the pen. "Your turn. Write your part."',
        choices: [
          {
            t: "Write it plainly and honestly",
            r: "A short entry. The next generation will find it dull and true.",
            fx: {honor:2,skill:{learning:1}},
          },
          {
            t: "Make yourself a hero",
            check: {s:"learning",s2:"deception",d:42},
            win: {
              r: "Your entry is the best-written in the book. In a hundred years, it will be the only version anyone knows.",
              fx: {fame:1,skill:{learning:2},happy:4},
            },
            lose: {r:"An uncle reads over your shoulder and crosses half of it out.",fx:{happy:-3,honor:-1}},
          },
          {
            t: "Read the old entries first, all night",
            r: "You read until the candle drowns. Your family has been brave, petty, generous and foolish, sometimes in one page.",
            fx: {int:.4,skill:{learning:2},wil:.3,happy:3},
          },
        ],
      },
      {
        id: "hs_words",
        cond: AD,
        cool: 10,
        title: '"{words}"',
        setup: (p,ctx)=>{fill(p,ctx),ctx.test=A.pick(["A neighbor's barn is burning and the wind is blowing toward it from yours.","A man the family wronged long ago comes to ask for justice.","You could win a lawsuit by a lie nobody would ever catch.","A child of a family your people hate has fallen through the ice."])},
        text: 'The family words, "{words}", are carved over the door at {seat}. You have walked under them a thousand times. Today, at {familySeat}, they mean something. {test}',
        choices: [
          {
            t: "Do what the words ask, whatever it costs",
            r: "It costs you. You do it anyway. That night you walk under the carving and it feels like it is yours, not just your ancestors'.",
            fx: {honor:5,wil:1.2,happy:2,health:-2},
          },
          {
            t: "Do the sensible thing",
            r: "Nobody blames you. Nobody quite looks you in the eye, either.",
            fx: {happy:-1,honor:-2},
          },
          {
            t: "Find a clever third way",
            check: {s:"int",s2:"persuasion",d:46},
            win: {
              r: "You find a way that honors the words and costs you little. Your grandfather would have called it a lawyer's trick. He would have been proud.",
              fx: {honor:3,int:.4,fame:1},
            },
            lose: {r:"Your clever way satisfies nobody, least of all you.",fx:{honor:-1,happy:-3}},
          },
        ],
      },
      {
        id: "hs_cut_off",
        cond: p=>AD(p)&&notHead(p)&&(C.hasRel(p,"lover")||C.trait(p,"reckless")||C.trait(p,"impetuous")||C.job(p,"minstrel")||C.job(p,"thief")||C.flag(p,"hs_rebel")),
        cool: 12,
        title: "The threat",
        setup: (p,ctx)=>{fill(p,ctx),headPid(p,ctx),ctx.charge=C.hasRel(p,"lover")?"the company you keep":C.job(p,"minstrel")?"singing for coppers like a beggar":C.job(p,"thief")?"thieving, which shames even this family":"your wild ways"},
        text: "A letter from {head}, sealed with the family arms. It is short. Unless you give up {charge}, your name will be struck from the family and your share of {fam} with it.",
        choices: [
          {
            t: "Give in",
            r: "You write back a humble letter. You are forgiven. It tastes like ashes for a year.",
            fx: {them:{op:15},happy:-8,wil:1,unflag:"hs_rebel"},
          },
          {
            t: "Go and plead your case in person",
            check: {s:"persuasion",s2:"wil",d:50},
            win: {
              r: 'You talk until dawn. In the end {them} throws up {theirHis} hands. "Live as you like. But keep it quiet."',
              fx: {them:{op:10},happy:4,skill:{persuasion:2}},
            },
            lose: {
              r: "The more you talk, the colder {them} gets. The letter stands.",
              fx: {them:{op:-20},happy:-6,flag:"hs_cut_off"},
            },
          },
          {
            t: "Tear up the letter. Strike me out, then",
            r: "Free of the name, and of everything that came with it. The road ahead is yours, and it is wide and cold.",
            fx: {them:{op:-40},wil:2,happy:-4,honor:1,flag:"hs_cut_off",trait:"stubborn"},
          },
        ],
      },
      {
        id: "hs_name_bought",
        cond: p=>AD(p)&&C.famKind(p,"noble","gentry","gentry_mil","merchant","guild","scholar","horse","royal","clergy"),
        cool: 14,
        title: "A price for the name",
        setup: (p,ctx)=>{fill(p,ctx),ctx.buyer=rs(p,ctx,A.pick(["a wine merchant from {town}","a newly rich wool dealer","a moneylender with a gold tooth","a foreign trader who has heard of the family"])),ctx.Buyer=A.cap(ctx.buyer),ctx.sum=sc(p,25)},
        text: '{Buyer} offers you {sum} suns for one thing: to paint "By appointment to {fam}" over his door. He will send the family a cask a month. He seems to think the name is worth a great deal.',
        choices: [
          {
            t: "Take the money",
            r: "His sign goes up. His trade doubles. The family hears of it, and opinions differ.",
            fx: X((p,ctx)=>gain(p,ctx.sum),{honor:-2,happy:2}),
          },
          {
            t: "Haggle him up",
            check: {s:"trade",s2:"persuasion",d:46},
            win: {
              r: "Double the price, and the cask. He pays and thinks he got a bargain.",
              fx: X((p,ctx)=>gain(p,ctx.sum*2),{skill:{trade:2},honor:-2}),
            },
            lose: {r:"He walks away and buys a better family's name down the street.",fx:{happy:-2}},
          },
          {t:"The name is not for sale",r:"He leaves puzzled. You leave proud, and poorer.",fx:{honor:3}},
        ],
      },
      {
        id: "hs_graves",
        cond: AD,
        cool: 12,
        title: "The family graves",
        setup: (p,ctx)=>{fill(p,ctx),ctx.harm=A.pick(["the floods have opened two of the old graves","grave robbers have dug at your great-grandfather's resting place","a neighbor has ploughed right up to the family stones","the old marker has cracked and fallen"]),ctx.place={"REL-01":"graves by the temple wall","REL-02":"graves facing east","REL-03":"mounds by the hall-yard","REL-04":"trees in the family grove","REL-05":"vaults in the deep rock","REL-07":"stones by the cistern","REL-11":"platforms on the hill","REL-12":"cairns above the shore"}[p.faith]||"graves on the hill"},
        text: "The dead of {fam} lie in their {place} near {seat}. Word comes that {harm}. Somebody of the blood must see to it, and it is you.",
        choices: [
          {
            t: "Mend it with your own hands",
            r: "Two days of digging, lifting and praying. Your back aches and your heart is lighter.",
            fx: {str:.3,piety:3,honor:2,health:-2},
          },
          {
            t: "Pay for it to be done properly",
            r: "Masons, a priest, new markers. It looks better than it ever did.",
            fx: X(p=>pay(p,sc(p,8)),{piety:2,honor:1}),
          },
          {
            t: "Find who did it",
            check: {s:"tracking",s2:"int",d:45},
            win: {
              r: "You find the culprit and drag him before the local court. The family hears of it.",
              fx: {honor:3,fame:1,skill:{tracking:2}},
            },
            lose: {r:"The trail leads nowhere. You put the stones back yourself.",fx:{wil:.5,piety:1}},
          },
        ],
      },
      {
        id: "hs_impostor",
        cond: AD,
        w: .6,
        cool: 20,
        title: "The long-lost cousin",
        setup: (p,ctx)=>{fill(p,ctx),kinPid(p,ctx,{adj:C.ageAdj(p)+A.ri(-2,8)}),ctx.story=rs(p,ctx,A.pick(["taken by pirates as a baby","raised in a foreign temple","the child of a {sur} who went to the wars and never came back","carried off by a wet-nurse who fled the plague"]))},
        text: "A stranger arrives at {seat} calling {themHim}self {themFull}: a lost child of the family, {story}. {He} knows the names of dead aunts and the shape of the old well. {He} also wants a share of the land.",
        choices: [
          {
            t: "Question {themHim} carefully",
            check: {s:"int",s2:"intrigue",d:48},
            win: {
              r: p=>A.chance(.5)?"One detail is wrong, the one only family would know. The impostor is gone by morning.":"Every answer is right, even the ones nobody else would know. Whoever {them} is, {theyHe} is family.",
              fx: (p,ctx)=>{const t=T(ctx);t&&A.link(p,t,A.chance(.5)?"cousin":"acquaint",15,"cousin"),A.trainSkill(p,"intrigue",2)},
            },
            lose: {
              r: "You cannot decide. Neither can anyone else. The family splits over it.",
              fx: {happy:-3,them:{type:"acquaint",op:0}},
            },
          },
          {
            t: "Welcome {themHim} home",
            r: "A feast, tears, a room at the seat. Some cousins never stop counting the spoons.",
            fx: {them:{type:"cousin",op:35},honor:1,happy:3},
          },
          {
            t: "Run {themHim} off as a fraud",
            r: "{them} goes, cursing you. Late at night you sometimes wonder if you were wrong.",
            fx: {them:{type:"enemy",op:-30},wil:.4},
          },
        ],
      },
      {
        id: "hs_heirloom",
        cond: AD,
        cool: 14,
        title: "The heirloom",
        setup: (p,ctx)=>{fill(p,ctx),ctx.thing=KT(p,{noble:"the old sword of the house",gentry_mil:"the first captain's sword",merchant:"the founder's brass scales",guild:"the master's first hammer",clergy:"the family's silver altar bell",scholar:"the great book with the family notes in the margins",sea:"the first captain's compass-stone",horse:"the silver bit of the first stallion",hunt:"the great horn of the wood",outlaw:"the old man's lucky knife",clan:"the clan's carved drinking horn",def:"the family cup"}),kinPid(p,ctx)},
        text: "Your {cz} {them} has pawned {thing} in {town} to pay a gambling debt. If the pawnbroker sells it, it is gone forever. The family does not yet know.",
        choices: [
          {
            t: "Redeem it with your own money",
            r: "You bring it home wrapped in a cloak. You never tell anyone who pawned it. {them} knows, and owes you for life.",
            fx: X(p=>pay(p,sc(p,10)),{them:{type:"cousin",op:30},honor:3}),
          },
          {
            t: "Steal it back from the pawnshop",
            check: {s:"stealth",s2:"spd",d:46},
            win: {
              r: "In and out through the back window before the bells. The heirloom is home and nobody paid a penny.",
              fx: {skill:{stealth:3},them:{type:"cousin",op:15},happy:4},
            },
            lose: {
              r: "The pawnbroker's dog catches you halfway out. The watch are called.",
              fx: {wound:"bite",punish:"theft"},
            },
          },
          {
            t: "Tell the family",
            r: "{them} is shamed before everyone. The family pays to redeem it, and makes sure {theyHe} never forgets.",
            fx: {them:{type:"cousin",op:-25},honor:1},
          },
        ],
      },
      {
        id: "hs_poor_relation",
        cond: p=>AD(p)&&p.coin<sc(p,15)&&!C.famHead(p),
        cool: 10,
        title: "The poor relation",
        setup: (p,ctx)=>{fill(p,ctx),kinPid(p,ctx,{adj:C.ageAdj(p)+A.ri(0,10)})},
        text: 'Your {cz} {them} has done very well and does not let anyone forget it. At {theirHis} table you are seated below the salt, next to the chaplain and a deaf aunt. {them} asks, loudly, how you are "managing".',
        choices: [
          {
            t: "Swallow your pride and ask for work",
            r: "{them} gives you a post, and reminds you of it weekly. But the pay is real.",
            fx: X(p=>gain(p,sc(p,10)),{them:{type:"cousin",op:10},wil:1,happy:-3}),
          },
          {
            t: "Answer with wit",
            check: {s:"persuasion",s2:"int",d:44},
            win: {
              r: "The whole table laughs, at {them}. Even the deaf aunt.",
              fx: {them:{type:"rival",op:-15},happy:6,fame:1},
            },
            lose: {r:"Your joke falls flat and {them} looks at you with pity, which is worse.",fx:{happy:-5,wil:.6}},
          },
          {
            t: "Leave before the pudding",
            r: "Your stomach growls the whole way home. Your pride, at least, is fed.",
            fx: {them:{type:"cousin",op:-10},honor:1,wil:.6},
          },
        ],
      },
      {
        id: "hs_heir_dying",
        cond: p=>AD(p)&&!!headP(p)&&C.old(headP(p)),
        w: .8,
        cool: 10,
        title: "The head is failing",
        setup: (p,ctx)=>{fill(p,ctx);const h=headP(p);ctx.pid=h?h.id:"",sexWords(ctx,h),h||kinPid(p,ctx,{adj:70}),ctx.ca=A.givenName(p.cult,"M"),ctx.cb=A.givenName(p.cult,"F")},
        text: "{Head} has taken to bed at {seat}, and everyone knows what that means. In the corridors the family is already choosing sides: {ca}, the eldest by law, or {cb}, who has actually run things for ten years.",
        choices: [
          {
            t: "Back {ca}: the law is the law",
            r: "You stand with the old rule. If {ca} wins, you will be remembered. If not, also remembered.",
            fx: {honor:2,newRel:{type:"friend",op:30},skill:{diplomacy:1}},
          },
          {
            t: "Back {cb}: the house needs a steward",
            check: {s:"intrigue",s2:"diplomacy",d:48},
            win: {
              r: "You bring three cousins over to {cb}. When the day comes, {cb} will owe you a great deal.",
              fx: {skill:{intrigue:3},newRel:{type:"friend",op:40},fame:1},
            },
            lose: {
              r: "Your scheming is overheard by {ca}'s wife. Whoever wins, you have an enemy.",
              fx: {newRel:{type:"enemy",op:-30},happy:-3},
            },
          },
          {
            t: "Sit with {them} and stay out of it",
            r: "You read to the old one and hold the cup. Whoever wins, you were there when it mattered.",
            fx: {them:{op:25},honor:3,piety:2,wil:.6},
          },
        ],
      },
      {
        id: "hs_branches",
        cond: AD,
        cool: 12,
        title: "Senior and cadet",
        setup: (p,ctx)=>{fill(p,ctx),ctx.prize=KT(p,{merchant:"the warehouse on the quay",guild:"the old shop with the good street front",sea:"the second boat",horse:"the river paddock",hunt:"the keeper's lodge",outlaw:"the safe house by the ford",def:"the mill at the ford"}),ctx.br=rs(p,ctx,A.pick(["the {town} branch","the cousins over the hill","the younger line"])),ctx.Br=A.cap(ctx.br)},
        text: "{Fam} has split into two branches, and they are quarrelling over {prize}. The senior line says it is theirs by right; {br} says by use. Both sides want you to say which.",
        choices: [
          {
            t: "Side with the senior line",
            r: "Right is right. {Br} will remember your choice at every feast.",
            fx: {honor:1,newRel:{type:"rival",op:-20}},
          },
          {
            t: "Side with {br}",
            r: "Use is use. The senior line call you a traitor to the blood.",
            fx: {newRel:{type:"friend",op:30},rel:{who:"father",op:-5}},
          },
          {
            t: "Propose they share it, with you as judge",
            check: {s:"diplomacy",s2:"int",d:50},
            win: {
              r: "Odd months to one, even months to the other, and a feast each Midsummer. It is absurd. It works.",
              fx: {honor:4,fame:1,skill:{diplomacy:3}},
            },
            lose: {
              r: "Both sides hate the plan, and you. The quarrel goes to the courts.",
              fx: {happy:-4,skill:{diplomacy:1}},
            },
          },
        ],
      },
      {
        id: "hs_family_debt",
        cond: p=>AD(p)&&C.famKind(p,"noble","gentry","gentry_mil","merchant","guild","clergy","scholar","sea","horse","royal"),
        cool: 10,
        title: "The family owes",
        setup: (p,ctx)=>{fill(p,ctx),ctx.bank=A.pick(["House Lunetti of Ostra","a Lucernan counting-house","the Hold Bank of Stonehold","a moneylender of Kesh","the Temple treasury","a goldsmith in "+realmCap(p)]),ctx.share=sc(p,18)},
        text: "{Fam} borrowed from {bank} when times were bad, and times did not get better. Now the loan has come due. {Head} has divided the debt among the whole family. Your share is {share} suns.",
        choices: [
          {
            t: "Pay your share",
            r: "It hurts. But the family name stays off the debtors' roll, and you did your part.",
            fx: X((p,ctx)=>pay(p,ctx.share),{honor:2}),
          },
          {
            t: "Go to the bankers and renegotiate for everyone",
            check: {s:"trade",s2:"diplomacy",d:52},
            win: {
              r: "You come back with three more years and a lower rate. The family looks at you differently now.",
              fx: {skill:{trade:3},fame:1,honor:2},
            },
            lose: {
              r: "The bankers are polite and immovable. You pay your share, plus the cost of the trip.",
              fx: (p,ctx)=>{pay(p,ctx.share*1.2),A.trainSkill(p,"trade",1)},
            },
          },
          {
            t: "Refuse: it was not your debt",
            r: "Legally you may be right. The family will not forget it.",
            fx: {honor:-3,rel:{who:"father",op:-10},happy:-1},
          },
        ],
      },
      {
        id: "hs_ally_call",
        cond: AD,
        cool: 12,
        title: "An old friendship called in",
        setup: (p,ctx)=>{fill(p,ctx),ctx.al=allyOf(p),ctx.Al=A.cap(ctx.al);const x=mkOther(p,ctx.al,{adj:C.ageAdj(p)+A.ri(0,15)});ctx.pid=x.id,sexWords(ctx,x),ctx.ask=A.pick(["hide a son of theirs for a season, no questions asked","stand surety for a loan","speak for them at a hearing in "+realmCap(p),"lend them twenty good men for a month"])},
        text: "{Fam} and {al} have stood by each other for generations. Now {themFull} of {al} comes to you with a request: {ask}. It is not a small thing.",
        choices: [
          {
            t: "Do it. Friendship is friendship",
            r: "It costs you a season of worry and some money. {Al} will not forget.",
            fx: X(p=>pay(p,sc(p,6)),{them:{type:"friend",op:35},honor:3}),
          },
          {
            t: "Do it, but name your price",
            check: {s:"trade",s2:"diplomacy",d:44},
            win: {
              r: "They agree, a little coldly. A favor bought is still a favor done.",
              fx: X(p=>gain(p,sc(p,6)),{them:{type:"friend",op:10}}),
            },
            lose: {
              r: '"We did not think {fam} kept a price list for friends." The friendship cools.',
              fx: {them:{type:"acquaint",op:-15},honor:-2},
            },
          },
          {
            t: "Refuse politely",
            r: "{them} bows and leaves. The alliance will survive. It is thinner now.",
            fx: {them:{type:"acquaint",op:-10}},
          },
        ],
      },
      {
        id: "hs_bastard_kin",
        cond: AD,
        w: .7,
        cool: 15,
        title: "A bastard of the blood",
        setup: (p,ctx)=>{fill(p,ctx);const x=kinPid(p,ctx,{adj:C.ageAdj(p)+A.ri(-6,4)});x.flags.bastard=1,x.sur=A.familyName({cult:p.cult,realm:p.realm,status:"peasant",home:p.home,sex:x.sex}).sur},
        text: "{themFull}, {themAge}, {themOcc}, has the {sur} nose and the {sur} temper. Everybody knows whose child {theyHe} is, and nobody says it. Now {theyHe} asks you, plainly, to speak for {themHim} to the family.",
        choices: [
          {
            t: "Speak for {themHim}",
            check: {s:"persuasion",s2:"diplomacy",d:50},
            win: {
              r: "{them} is given a place at the foot of the family table. Small, but {theyHe} weeps. You have a friend for life.",
              fx: {them:{type:"cousin",op:40},honor:3},
            },
            lose: {
              r: "The family will not hear it. {them} thanks you anyway, which is somehow worse.",
              fx: {them:{type:"friend",op:25},happy:-3},
            },
          },
          {
            t: "Help {themHim} quietly, with money",
            r: "No name, but a purse. {them} takes it with tight lips.",
            fx: X(p=>pay(p,sc(p,5)),{them:{type:"friend",op:15}}),
          },
          {
            t: "Refuse: it is not your business",
            r: "{them} goes. You hear later {theyHe} left for {town}, and changed {theirHis} name for good.",
            fx: {them:{type:"acquaint",op:-20}},
          },
        ],
      },
      {
        id: "hs_inherit_dispute",
        cond: AD,
        w: .8,
        cool: 15,
        title: "A disputed inheritance",
        setup: (p,ctx)=>{fill(p,ctx),kinPid(p,ctx),ctx.prize=KT(p,{noble:"a manor and its three villages",gentry_mil:"a manor and the right to the family post",merchant:"a share in the counting-house",guild:"a shop and its master's mark",sea:"a fishing boat and its berth",horse:"twelve good mares",hunt:"the keeper's lodge and its rights",outlaw:"the old man's hidden stash",clan:"a summer pasture and its herd",def:"a house and a field"})},
        text: "A childless uncle has died, and two people claim {prize}: you, and your {cz} {them}. The will is unclear, the witnesses disagree, and the family is split down the middle.",
        choices: [
          {
            t: "Take it to the court",
            check: {s:"persuasion",s2:"learning",d:50},
            win: {
              r: "The judge rules for you. {them} leaves the court without a word to you, ever again.",
              fx: X(p=>gain(p,sc(p,25)),{them:{type:"rival",op:-30}}),
            },
            lose: {
              r: "The judge rules for {them}, and you pay the costs.",
              fx: X(p=>pay(p,sc(p,5)),{them:{type:"rival",op:-20},happy:-5}),
            },
          },
          {
            t: "Split it, and stay family",
            r: "Half each. Neither of you is happy, which the old judges say is the sign of a fair deal.",
            fx: X(p=>gain(p,sc(p,12)),{them:{type:"cousin",op:20},honor:3}),
          },
          {
            t: "Let {them} have it",
            r: "{them} is amazed. Your family thinks you a saint or a fool, depending on the cousin.",
            fx: {them:{type:"cousin",op:40},honor:4,happy:-2},
          },
        ],
      },
      {
        id: "hs_name_abroad",
        cond: p=>AD(p)&&C.famKind(p,"noble","gentry_mil","merchant","royal","clergy","sea","horse","guild","scholar"),
        cool: 12,
        title: "They know the name",
        setup: (p,ctx)=>{fill(p,ctx),ctx.inn=A.pick(["The Golden Pear","The Drowned Bell","The Three Crowns","The Black Ox","The Laughing Goose"])},
        text: 'At an inn called {inn} in {town}, the landlord hears your name and freezes. "{Fam}? Of {seat}?" Everyone in the room turns to look. You cannot tell yet whether this is good.',
        choices: [
          {
            t: "Admit it proudly",
            r: p=>A.chance(.6)?"The landlord clasps your hand. Your grandfather once did him a kindness. You eat and sleep for free.":"The landlord's face darkens. Your family once ruined his. You eat elsewhere, and sleep with a knife.",
            fx: p=>{A.chance(.6)?(p.happy=A.clamp(p.happy+5,0,100),gain(p,2)):(p.happy=A.clamp(p.happy-4,0,100),A.willGrow(p,.4))},
          },
          {
            t: "Say he has the wrong family",
            check: {s:"deception",s2:"wil",d:38},
            win: {
              r: "He shrugs, and the room goes back to its ale. Sometimes it is good to be nobody.",
              fx: {skill:{deception:1}},
            },
            lose: {
              r: '"You have the {sur} chin," says an old man in the corner. Now everyone thinks you are ashamed of the name.',
              fx: {honor:-2,happy:-2},
            },
          },
          {
            t: "Ask what he knows of the family",
            r: "He knows a great deal, some of it true. You learn what {fam} looks like from outside.",
            fx: {int:.3,skill:{intrigue:1}},
          },
        ],
      },
      {
        id: "hs_grand_old_debt",
        cond: AD,
        w: .7,
        cool: 15,
        title: "Your grandfather's debt",
        setup: (p,ctx)=>{fill(p,ctx);const x=mkOther(p,"",{adj:60,status:"peasant"});ctx.pid=x.id,sexWords(ctx,x),ctx.sum=sc(p,10)},
        text: '{themFull}, {themOcc}, old and bent, stops you in the street with a scrap of paper, brown with age. "Your grandfather borrowed {sum} suns from my father, on the honor of {fam}. My father died waiting. I am not going to."',
        choices: [
          {
            t: "Pay it, on the family's honor",
            r: '{them} counts the coins twice, then weeps. "My father always said the {sur} name was good."',
            fx: X((p,ctx)=>pay(p,ctx.sum),{honor:5,them:{type:"friend",op:25}}),
          },
          {
            t: "Check the paper first",
            check: {s:"learning",s2:"int",d:42},
            win: {
              r: p=>A.chance(.5)?"The seal is real. You pay. It feels better than you expected.":"The seal is a clumsy copy. You send {them} off with a warning and a loaf of bread.",
              fx: (p,ctx)=>{A.trainSkill(p,"learning",1),A.chance(.5)&&pay(p,ctx.sum)},
            },
            lose: {r:"You cannot tell. You pay half, and nobody is satisfied.",fx:(p,ctx)=>pay(p,ctx.sum/2)},
          },
          {
            t: "Send {themHim} away",
            r: "{them} shouts after you down the street. The whole market hears what a {sur}'s word is worth.",
            fx: {honor:-4,them:{type:"enemy",op:-25}},
          },
        ],
      },
      {
        id: "hs_arranged",
        cond: p=>AD(p)&&!C.married(p)&&C.ageAdj(p)<32&&notHead(p)&&C.famKind(p,"noble","gentry","gentry_mil","merchant","guild","clan","sea","horse","scholar","royal"),
        cool: 8,
        title: "The family has chosen",
        setup: (p,ctx)=>{fill(p,ctx),ctx.al=allyOf(p),ctx.Al=A.cap(ctx.al);const x=mkOther(p,ctx.al,{sex:p.flags.likes||(p.sex==="M"?"F":"M"),adj:C.ageAdj(p)+A.ri(-4,6)});ctx.pid=x.id,sexWords(ctx,x),ctx.gain=KT(p,{merchant:"a share of their ships",guild:"their votes in the guild",noble:"their lances in the next war",gentry_mil:"their lances in the next war",clan:"their summer grazing",sea:"their berths at the quay",horse:"their best stallion",def:"their friendship"})},
        text: "{Head} has settled it with {al}: you will marry {themFull}, {themOcc}, and {fam} will gain {gain}. Nobody asked you. Nobody ever asks.",
        choices: [
          {
            t: "Do your duty",
            r: "The wedding is grand. {them} is a stranger in your bed and at your table, but you have years to fix that.",
            fx: (p,ctx)=>{const t=T(ctx);return t&&!C.married(p)&&A.marry(p,t),p.honor=A.clamp(p.honor+3,0,100),""},
          },
          {
            t: "Ask for a year to court {themHim}",
            check: {s:"persuasion",s2:"diplomacy",d:45},
            win: {
              r: "A year of letters and visits. {them} is kinder than you feared. The wedding, when it comes, is not a sentence.",
              fx: {them:{type:"betrothed",op:30,back:"betrothed"},happy:4},
            },
            lose: {
              r: '"A year? The contract is signed." You are married in a month.',
              fx: (p,ctx)=>{const t=T(ctx);return t&&!C.married(p)&&A.marry(p,t),p.happy=A.clamp(p.happy-5,0,100),""},
            },
          },
          {
            t: "Refuse to the family's face",
            r: "There is shouting, then silence. {Al} takes it as an insult. So does {head}.",
            fx: {rel:{who:"father",op:-20},happy:-3,trait:"stubborn",flag:"hs_rebel"},
          },
        ],
      },
      {
        id: "hs_sibling_heir",
        cond: p=>AD(p)&&notHead(p)&&C.ageAdj(p)<35&&A.relsOf(p,["sibling"]).some(x=>x.p.alive),
        cool: 12,
        title: "The favorite",
        setup: (p,ctx)=>{fill(p,ctx);const s=A.relsOf(p,["sibling"]).filter(x=>x.p.alive),t=A.pick(s).p;ctx.pid=t.id,sexWords(ctx,t)},
        text: "At supper {head} announces that your {bs} {them} will take over {trade} for the family. It is not unexpected. It still lands like a slap.",
        choices: [
          {
            t: "Congratulate {themHim} and mean it",
            r: "You raise your cup. {them} looks at you with a gratitude {theyHe} cannot quite say.",
            fx: {them:{op:20},honor:2,wil:.6},
          },
          {
            t: "Make your case to {head}",
            check: {s:"persuasion",s2:"int",d:54},
            win: {
              r: "You are given a share of the work, and a share of the say. {them} is not pleased.",
              fx: {them:{op:-10},skill:{persuasion:2},flag:"hs_shares"},
            },
            lose: {r:'"It is decided." You are sent from the table like a child.',fx:{them:{op:-10},happy:-6,wil:.8}},
          },
          {
            t: "Leave and build something of your own",
            r: "You pack in the morning. The road is long and the family is behind you. So is the bitterness, mostly.",
            fx: {wil:1.2,happy:-2,trait:"ambitious"},
          },
        ],
      },
      {
        id: "hs_godparent",
        cond: AD,
        cool: 10,
        title: "Stand for the child",
        setup: (p,ctx)=>{fill(p,ctx),kinPid(p,ctx,{adj:C.ageAdj(p)+A.ri(-3,5)}),ctx.baby=A.givenName(p.cult,A.chance(.5)?"M":"F")},
        text: "Your {cz} {them} has a new baby, {baby}, and asks you to stand for the child at the naming: to answer for the child before {god} and the family, and to look after {baby} if the worst comes.",
        choices: [
          {
            t: "Accept, gladly",
            r: "You hold the baby, who is sick on your best shirt. You say the words. You mean them.",
            fx: {them:{type:"cousin",op:25},piety:2,honor:2,happy:4},
          },
          {
            t: "Accept, and give a silver gift",
            r: "A silver cup with {baby}'s name on it. The whole family talks about it.",
            fx: X(p=>pay(p,sc(p,5)),{them:{type:"cousin",op:35},honor:2,fame:1}),
          },
          {
            t: "Decline: you cannot promise that",
            r: "{them} understands, or says so. The child is named without you.",
            fx: {them:{type:"cousin",op:-10}},
          },
        ],
      },
      {
        id: "hs_portrait",
        cond: p=>AD(p)&&C.famKind(p,"noble","gentry","gentry_mil","merchant","royal","guild","scholar"),
        cool: 15,
        title: "Sitting for the painter",
        setup: (p,ctx)=>{fill(p,ctx),ctx.art=KT(p,{merchant:"a portrait for the counting-house wall",guild:"a carved panel for the guildhall",def:"a portrait for the great hall"})},
        text: 'The family is paying for {art}, and you are to be in it. The painter is a sharp little man from {capital} who keeps asking you to look "more noble". Your nose itches.',
        choices: [
          {
            t: "Sit still for six days",
            check: {s:"wil",s2:"sta",d:40},
            win: {
              r: "The finished picture is better looking than you, and you do not complain.",
              fx: {looks:1,happy:3,wil:.4},
            },
            lose: {r:"You fidget. The painter gives you a squint, forever.",fx:{happy:-3}},
          },
          {
            t: "Bribe him to make you heroic",
            r: "You are painted with a sword you have never owned and a jaw you do not have. The family laughs. Their grandchildren will not.",
            fx: X(p=>pay(p,sc(p,3)),{fame:1,happy:2}),
          },
          {
            t: "Charm him into talking about {capital}",
            r: "Six days of gossip about the court, the guilds and the price of blue paint. Better than a schooling.",
            fx: {skill:{intrigue:1,diplomacy:1},int:.2},
          },
        ],
      },
      {
        id: "hs_feud_burn",
        cond: p=>AD(p)&&C.flag(p,"hs_feud"),
        w: 1.2,
        cool: 6,
        title: "The feud goes on",
        setup: (p,ctx)=>{fill(p,ctx),ctx.rv=rivalOf(p),ctx.Rv=A.cap(ctx.rv),ctx.harm=A.pick(["your hayricks burned","two of your cousins beaten on the road","your dog poisoned","a dead crow nailed to the family door"])},
        text: "The feud with {rv} has not slept. This month it was {harm}. Everyone at {seat} waits to see what you will do.",
        choices: [
          {
            t: "Strike back, hard",
            check: {s:"tactics",s2:"stealth",d:50},
            win: {
              r: "Your night raid leaves them poorer and frightened. The feud gets hotter, but {fam} looks strong.",
              fx: {fame:1,honor:-1,skill:{tactics:2}},
            },
            lose: {r:"They were waiting. You come home bloody.",fx:{health:-15,cause:"a feud",wound:"deep_cut",wil:1}},
          },
          {
            t: "Go to the law",
            r: "The lord's court fines {rv}. They pay with a sneer. It is something.",
            fx: {honor:2},
          },
          {
            t: "Ask the priests to broker a peace",
            check: {s:"diplomacy",s2:"faith",d:52},
            win: {
              r: "Before the altar, the two heads clasp hands. The feud is over, for now.",
              fx: {unflag:"hs_feud",honor:4,piety:3,fame:2},
            },
            lose: {
              r: "The priests try. The heads of the two families will not even stand in the same temple.",
              fx: {piety:1,happy:-3},
            },
          },
        ],
      },
      {
        id: "hs_k_words",
        cond: CH,
        once: !0,
        title: "The family words",
        setup: (p,ctx)=>{fill(p,ctx),ctx.elder=A.pick(["grandmother","grandfather","great-aunt","old nurse"])},
        text: 'Your {elder} sits you on a stool by the fire at {familySeat} and makes you say it back, again and again: "{words}." Every child of {fam} learns it before they learn their letters. "Say it like you mean it."',
        choices: [
          {
            t: "Shout it at the top of your lungs",
            r: 'The dogs bark, the cook drops a pan, and your {elder} laughs till she wheezes. "That is a true {sur}."',
            fx: {happy:4,wil:.3,honor:1},
          },
          {
            t: "Ask what it means",
            check: {s:"int",s2:"wil",d:20},
            win: {
              r: "You get the whole story, and understand most of it. You will remember it when the words matter.",
              fx: {int:.4,skill:{learning:1},honor:1},
            },
            lose: {r:"You fall asleep halfway through the story. The words stick anyway.",fx:{happy:1}},
          },
          {
            t: "Make up a rude version",
            r: "You get a clip round the ear and a week of no honey cakes. Your cousins think you are a hero.",
            fx: {happy:2,newRel:{type:"friend",op:20}},
          },
        ],
      },
      {
        id: "hs_k_arms",
        cond: CH,
        cool: 6,
        title: "Paint on the banner",
        setup: (p,ctx)=>{fill(p,ctx)},
        text: "The women of the house are freshening the family arms on the great banner: {arms}. They leave the paint pots out while they eat. Nobody is watching you.",
        choices: [
          {
            t: "Help, very carefully",
            check: {s:"craft",s2:"int",d:20},
            win: {
              r: "Your bit is so neat that they let you finish the border. You are proud of that banner for the rest of your life.",
              fx: {skill:{craft:2},happy:4},
            },
            lose: {
              r: `A blob of red where no red should be. It is still there, and the family calls it "the child's mark".`,
              fx: {happy:-2,family:-1},
            },
          },
          {
            t: "Paint the dog in the family colors instead",
            r: "The dog is very handsome and very angry. So is your mother.",
            fx: {happy:3,rel:{who:"mother",op:-3}},
          },
          {
            t: "Leave it alone",
            r: "You watch from the doorway. The colors look like a story you do not yet know the end of.",
            fx: {int:.2},
          },
        ],
      },
      {
        id: "hs_k_ancestor",
        cond: CH,
        cool: 5,
        title: "Bedtime stories",
        setup: (p,ctx)=>{fill(p,ctx),ancestor(p,ctx)},
        text: 'Every night the story is the same, because it is the one you beg for: {anc}, the great one of {fam}. On the wall at {seat} there is a plaque that says: "{ancDeed}"',
        choices: [
          {
            t: "Play at being {anc} with a stick sword",
            r: "You hold the woodpile against three cousins and the goat. The goat wins.",
            fx: {str:.3,ins:.3,happy:4},
          },
          {
            t: "Ask whether it is all true",
            r: 'Your father goes quiet, then says, "Most of it." You think about that "most" for years.',
            fx: {int:.4,wil:.2},
          },
          {
            t: "Swear to do something greater",
            r: "You swear it in the dark, very seriously. Nobody hears. That does not make it less of a promise.",
            fx: {wil:.5,trait:"ambitious"},
          },
        ],
      },
      {
        id: "hs_k_cousins",
        cond: KID,
        cool: 4,
        title: "The cousins come to stay",
        setup: (p,ctx)=>{fill(p,ctx),kinPid(p,ctx,{adj:C.ageAdj(p)+A.ri(1,3)})},
        text: "The cousins have come to {seat} for the summer, and the eldest, {them}, decides at once that {theyHe} is in charge. There are rules. You are not allowed on the hay. You are the enemy in every war game.",
        choices: [
          {
            t: "Challenge {them} to a fight",
            check: {s:"str",s2:"ins",d:22},
            win: {
              r: "You knock {themHim} into the nettles. After that you are a general too.",
              fx: {str:.3,ins:.3,them:{type:"cousin",op:10},happy:4},
            },
            lose: {
              r: "You end up in the nettles. You spend the evening in vinegar and fury.",
              fx: {health:-2,wil:.5,them:{type:"cousin",op:5}},
            },
          },
          {
            t: "Out-think {themHim}: start your own army",
            check: {s:"int",s2:"persuasion",d:22},
            win: {
              r: "The little cousins follow you. By August your army holds the barn and {them} is negotiating terms.",
              fx: {skill:{command:1,persuasion:1},them:{type:"cousin",op:10},happy:5},
            },
            lose: {r:"Your army deserts to {them} for a bag of plums.",fx:{happy:-3,wil:.3}},
          },
          {
            t: "Make friends with {themHim}",
            r: "You show {them} the secret hole in the orchard wall. By the end of summer you are inseparable.",
            fx: {them:{type:"cousin",op:30},happy:4},
          },
        ],
      },
      {
        id: "hs_k_overheard",
        cond: KID,
        once: !0,
        w: .7,
        title: "Through the wall",
        setup: (p,ctx)=>{fill(p,ctx),ctx.secret=secretOf(p)},
        text: 'You are supposed to be asleep. Through the wall, the grown-ups are arguing in low voices, and you catch a sentence you will never forget: {secret} Then someone says, "The children must never know."',
        choices: [
          {
            t: "Keep it to yourself forever",
            r: "You carry it like a stone in your pocket. It makes you older than you are.",
            fx: {wil:.8,flag:"hs_knows_secret"},
          },
          {
            t: "Tell your best friend",
            r: "Your friend swears not to tell. Your friend tells. A week later you are taken aside and spoken to in a terrible quiet voice.",
            fx: {happy:-5,rel:{who:"father",op:-5}},
          },
          {
            t: "Ask your mother about it, alone",
            r: "She is quiet a long time. Then she tells you the truth, as much as a child can carry, and makes you promise.",
            fx: {rel:{who:"mother",op:10},int:.3,flag:"hs_knows_secret"},
          },
        ],
      },
      {
        id: "hs_k_rival_kids",
        cond: KID,
        cool: 5,
        title: "The other family's children",
        setup: (p,ctx)=>{fill(p,ctx),ctx.rv=rivalOf(p),ctx.Rv=A.cap(ctx.rv);const x=mkOther(p,ctx.rv,{adj:C.ageAdj(p)+A.ri(-1,2)});ctx.pid=x.id,sexWords(ctx,x)},
        text: "The children of {rv} are on the other side of the stream, and they are throwing stones and shouting what their parents say about {fam}. The loudest is {them}.",
        choices: [
          {
            t: "Throw back",
            check: {s:"throwing",s2:"spd",d:20},
            win: {
              r: "You hit {them} on the backside and the whole gang runs. Glory.",
              fx: {skill:{throwing:2},happy:5,them:{type:"rival",op:-15}},
            },
            lose: {
              r: "A stone catches you over the eye. You go home bleeding and proud.",
              fx: {health:-4,wil:.5,them:{type:"rival",op:-10}},
            },
          },
          {
            t: "Wade across and make peace",
            check: {s:"persuasion",s2:"wil",d:24},
            win: {
              r: "By sunset you and {them} are building a dam together. Your parents must never find out.",
              fx: {them:{type:"friend",op:25},happy:4,flag:"hs_rival_friend"},
            },
            lose: {
              r: "You get pushed in the stream. Wet and furious, you go home to cry where nobody sees.",
              fx: {happy:-3,wil:.4},
            },
          },
          {
            t: "Walk away with your head up",
            r: "The stones fall short. So do the insults. You feel very grown up.",
            fx: {wil:.4},
          },
        ],
      },
      {
        id: "hs_k_head_visit",
        cond: p=>KID(p)&&notHead(p),
        cool: 6,
        title: "Inspected",
        setup: (p,ctx)=>{fill(p,ctx),headPid(p,ctx)},
        text: '{Head} is coming to look at the children. You are scrubbed until you shine and put in a row. When it is your turn, {them} looks down at you for a long moment and asks: "And what will you be?"',
        choices: [
          {
            t: '"The best of us"',
            r: '{them} laughs, a short bark. "We shall see." But {theyHe} remembers your name after that.',
            fx: {them:{op:10},trait:"ambitious",happy:3},
          },
          {
            t: "Say something clever",
            check: {s:"int",s2:"persuasion",d:22},
            win: {
              r: "The whole room laughs, and {them} pats your head and slips you a coin.",
              fx: X(p=>gain(p,2),{them:{op:15},happy:5}),
            },
            lose: {
              r: "It sounded clever in your head. Out loud, it is rude. You are sent to bed without supper.",
              fx: {them:{op:-5},happy:-4},
            },
          },
          {
            t: "Hide behind your mother",
            r: '{them} sighs. "Shy. That will pass." It does not pass for a while.',
            fx: {trait:"shy",happy:-1},
          },
        ],
      },
      {
        id: "hs_k_heirloom",
        cond: CH,
        cool: 8,
        title: "Something broken",
        setup: (p,ctx)=>{fill(p,ctx),ctx.thing=KT(p,{noble:"the painted plate the old queen once ate from",merchant:"the glass scales from the founder's day",guild:"the master's first carving",clergy:"the little ivory saint",sea:"the model of the first ship",horse:"the clay stallion from the first stud",outlaw:"Granny's lucky jar",def:"the old blue jug"})},
        text: "You were not supposed to be playing in that room. Now {thing} lies in three pieces on the floor, and footsteps are coming down the passage.",
        choices: [
          {
            t: "Own up straight away",
            r: 'There is shouting. Then, oddly, a hug. "At least you did not lie." You are still not allowed in that room.',
            fx: {honor:2,rel:{who:"father",op:3},wil:.3},
          },
          {
            t: "Blame the cat",
            check: {s:"deception",s2:"int",d:22},
            win: {
              r: "The cat is banished to the barn. You feel terrible for a month, and slip it scraps.",
              fx: {skill:{deception:1},honor:-1},
            },
            lose: {
              r: "The cat was asleep on your father's lap the whole time. Two punishments: one for the breaking, one for the lie.",
              fx: {happy:-5,honor:-1},
            },
          },
          {
            t: "Try to glue it back together",
            check: {s:"craft",s2:"int",d:25},
            win: {r:"Nobody notices for years. When they do, it is a funny story.",fx:{skill:{craft:2},happy:2}},
            lose: {r:"The glue does not hold. You are found with sticky hands and no excuse.",fx:{happy:-3}},
          },
        ],
      },
      {
        id: "hs_k_trade",
        cond: p=>KID(p)&&C.ageAdj(p)>=8,
        cool: 5,
        title: "Learning the family trade",
        setup: (p,ctx)=>{fill(p,ctx),ctx.sk=skillOf(p),ctx.lesson=KT(p,{noble:"sit beside the steward while he reads the rent rolls",gentry_mil:"stand in the yard while the sergeant drills the men",gentry:"ride the bounds of the family land",royal:"stand through a whole audience without fidgeting",merchant:"count the day's coin on the counting board",guild:"sweep the shop and watch the master's hands",clergy:"learn the morning rite by heart",scholar:"copy a page without a blot",sea:"mend nets on the quay",horse:"muck out the foaling stalls and watch the mares",hunt:"read the tracks along the stream",outlaw:"stand at the corner and whistle if the watch comes",clan:"walk the herd to the upper pasture",def:"help with the family's work"})},
        text: "You are old enough now. Every morning you {lesson}. This is {trade}, the thing {fam} has always done. The grown-ups say you will be good at it, or else.",
        choices: [
          {
            t: "Work hard and pay attention",
            check: {s:"int",s2:"wil",d:22},
            win: {
              r: "You learn faster than anyone expected. The old hands nod at each other.",
              fx: (p,ctx)=>{A.trainSkill(p,ctx.sk||"stewardship",3),A.willGrow(p,.3)},
            },
            lose: {
              r: "You try hard and get it wrong anyway, over and over. Slowly, it starts to stick.",
              fx: (p,ctx)=>{A.trainSkill(p,ctx.sk||"stewardship",1.5),A.willGrow(p,.5)},
            },
          },
          {
            t: "Sneak off to play",
            r: "A glorious summer of rivers and orchards. A cold autumn of catching up.",
            fx: {happy:5,rel:{who:"father",op:-4}},
          },
          {
            t: "Ask to learn something else",
            r: '"Something else?" They look at you as if you had sprouted a tail. But a seed is planted.',
            fx: {int:.3,flag:"hs_rebel"},
          },
        ],
      },
      {
        id: "hs_k_high_table",
        cond: p=>KID(p)&&C.famKind(p,"noble","gentry","gentry_mil","royal","merchant","clergy"),
        once: !0,
        title: "At the high table",
        setup: (p,ctx)=>{fill(p,ctx),ctx.guest=A.pick(["a bishop","an envoy from a far court","a great lady from {capital}","a famous old captain with one eye"]),ctx.guest=rs(p,ctx,ctx.guest)},
        text: "For the first time, you are allowed to sit at the high table for a family feast at {seat}. You are seated next to {guest}. There are four knives, three cups and a swan with its feathers put back on.",
        choices: [
          {
            t: "Mind your manners perfectly",
            check: {s:"etiquette",s2:"wil",d:24},
            win: {
              r: "Not a single wrong knife. The guest tells your parents you are a credit to the house.",
              fx: {skill:{etiquette:3},happy:4,honor:1},
            },
            lose: {
              r: "You knock over the gravy boat onto the guest's lap. The swan survives.",
              fx: {skill:{etiquette:1},happy:-5},
            },
          },
          {
            t: "Talk to the guest about everything",
            check: {s:"persuasion",s2:"int",d:22},
            win: {
              r: "The guest is delighted and answers every question. You learn more in one dinner than in a year of lessons.",
              fx: {int:.4,skill:{diplomacy:1},happy:4},
            },
            lose: {r:"You ask the one-eyed captain how he lost his eye, loudly, during the blessing.",fx:{happy:-3}},
          },
          {
            t: "Eat as much swan as you can",
            r: "Swan is disappointing. The almond cakes are not. You are sick in the courtyard.",
            fx: {happy:3,health:-1},
          },
        ],
      },
      {
        id: "hs_k_cousin_friend",
        cond: KID,
        once: !0,
        title: "A cousin for a friend",
        setup: (p,ctx)=>{fill(p,ctx),kinPid(p,ctx,{adj:C.ageAdj(p)+A.ri(-1,1)})},
        text: 'Your {cz} {them} is the same age as you, and has been sent to live at your house for a while because of "trouble at home". {He} cries at night and pretends not to.',
        choices: [
          {
            t: "Share your secret places",
            r: "The loft, the hollow oak, the warm spot behind the bakehouse. By midsummer {them} laughs again.",
            fx: {them:{type:"bestfriend",op:45,back:"bestfriend"},happy:5},
          },
          {
            t: "Tease {themHim}",
            r: "{them} fights back, hard. You end up bloody-nosed and, somehow, friends.",
            // [X1 baked patch events/33-no-obvious-choices CHOICE-HS-K-COUSIN-FRIEND] hs_k_cousin_friend: the fight in "Tease"
            // ("fights back, hard") now hardens you a little.
            fx: {them:{type:"cousin",op:20},health:-1,wil:.5},
          },
          {
            t: "Leave {themHim} alone",
            r: "{them} finds other friends. Years later you wonder what you missed.",
            fx: {them:{type:"cousin",op:0}},
          },
        ],
      },
      {
        id: "hs_t_expected",
        cond: p=>TEEN(p)&&C.ageAdj(p)>=13,
        once: !0,
        title: "What the family expects",
        setup: (p,ctx)=>{fill(p,ctx),ctx.dream=A.pick(["go to sea","become a minstrel","join a temple","run off with the soldiers","learn the healer's art","see the capital"])},
        text: "Everyone has always known what you will do: {trade}, like every {sur} before you. But you want to {dream}, and lately you cannot think of anything else.",
        choices: [
          {
            t: "Tell the family, straight out",
            check: {s:"persuasion",s2:"wil",d:26},
            win: {
              r: 'There is a long silence. Then {head} says, "Well. Somebody in this family had to." You are not forbidden.',
              fx: {wil:.6,happy:6,flag:"hs_free_path"},
            },
            lose: {r:"The answer is a flat no, and a year of being watched.",fx:{happy:-6,wil:.8,flag:"hs_rebel"}},
          },
          {
            t: "Do your duty, and dream at night",
            r: "You learn {trade}, and learn it well. The dream does not die. It just waits.",
            fx: p=>{A.trainSkill(p,skillOf(p),2),A.willGrow(p,.5)},
          },
          {
            t: "Plan to run away",
            r: "You save every coin and hide a bundle under the floor. Not yet. But soon.",
            fx: {trait:"impetuous",flag:"hs_rebel"},
          },
        ],
      },
      {
        id: "hs_t_first_task",
        cond: TEEN,
        cool: 4,
        title: "Your first real task",
        setup: (p,ctx)=>{fill(p,ctx),ctx.task=KT(p,{noble:"carry a sealed letter to the steward of "+ctx.lg,gentry_mil:"take the muster list to the captain at {town}",merchant:"collect a debt from a shopkeeper in {town}",guild:"deliver a finished piece to a fussy customer",clergy:"lead the morning prayer when the priest is ill",scholar:"take the family's medicines to a sick house",sea:"take the small boat round the point alone",horse:"walk a valuable mare to a buyer in {town}",hunt:"mark the deer for the lord's hunt",outlaw:"carry a parcel and not look inside",clan:"take the herd across the river ford",def:"carry the family's message to {town}"}),ctx.task=rs(p,ctx,ctx.task)},
        text: "{Head} thinks you are ready. Your first real task for {fam}: {task}. If it goes well, they will trust you with more. If not, you will hear about it for years.",
        choices: [
          {
            t: "Do it exactly as told",
            check: {s:"wil",s2:"int",d:26},
            win: {
              r: 'Done, and done well. Someone says "good" in a way you will hear in your head for a month.',
              fx: p=>(A.trainSkill(p,skillOf(p),2),p.happy=A.clamp(p.happy+5,0,100),""),
            },
            lose: {
              r: "It goes wrong in a way nobody could have predicted, and you get the blame anyway.",
              fx: {happy:-4,wil:.6},
            },
          },
          {
            t: "Do it your own way",
            check: {s:"int",s2:"spd",d:30},
            win: {
              r: "Your way is faster and better. They grumble, then copy it.",
              fx: p=>(A.trainSkill(p,skillOf(p),3),A.train(p,"int",.3),""),
            },
            lose: {r:"Your way is a disaster. A lesson learned the hard way.",fx:{happy:-5,wil:.6,family:-2}},
          },
          {
            t: "Get a friend to help",
            r: "Two heads, one task. It gets done, and the friend gets half the praise.",
            fx: {newRel:{type:"friend",op:25},happy:2},
          },
        ],
      },
      {
        id: "hs_t_forbidden_love",
        cond: p=>TEEN(p)&&C.ageAdj(p)>=13,
        cool: 6,
        title: "The wrong family",
        setup: (p,ctx)=>{fill(p,ctx),ctx.rv=rivalOf(p),ctx.Rv=A.cap(ctx.rv);const x=mkOther(p,ctx.rv,{sex:p.flags.likes||(p.sex==="M"?"F":"M"),adj:C.ageAdj(p)+A.ri(-1,1)});ctx.pid=x.id,sexWords(ctx,x)},
        text: "{themFull} has the brightest eyes in {home}, and {theyHe} smiled at you at the well. There is just one problem: {theyHe} is one of {rv}, and your families have hated each other for three generations.",
        choices: [
          {
            t: "Meet {themHim} in secret",
            r: "Notes under a loose stone, walks by the river at dusk. It is the most exciting thing that has ever happened to you.",
            fx: {them:{type:"friend",op:35,back:"friend"},happy:8,flag:"hs_secret_love"},
          },
          {
            t: "Tell your family you want to court {themHim}",
            check: {s:"persuasion",s2:"wil",d:30},
            win: {
              r: "Shouting, then thinking. Nobody says yes. But nobody says never.",
              fx: {them:{type:"friend",op:20,back:"friend"},wil:.5},
            },
            lose: {
              r: "You are forbidden to go to the well. You are forbidden to go anywhere.",
              fx: {happy:-6,wil:.8,flag:"hs_rebel"},
            },
          },
          {
            t: "Look away. It could never work",
            r: "You stop going to the well. It hurts more than you thought anything could.",
            fx: {happy:-4,wil:.6},
          },
        ],
      },
      {
        id: "hs_t_taunted",
        cond: p=>KID(p)&&C.famKind(p,"outlaw","clergy","scholar","merchant","noble","gentry_mil","guild"),
        cool: 6,
        title: "What they say about your family",
        setup: (p,ctx)=>{fill(p,ctx),ctx.taunt=KT(p,{outlaw:`"Thief's brat! Where did you steal those shoes?"`,clergy:`"Priest's pet! Say a prayer for us!"`,scholar:'"Bookworm! Leech! Your grandfather killed my grandfather!"',merchant:'"Money-grubber! What does your soul cost?"',noble:'"Little lord! Make us bow, then!"',gentry_mil:'"Your father hides behind his men!"',guild:`"Your family's work falls apart in a week!"`,def:'"We know what your family is!"'})},
        text: "The other children in {home} have a new game, and the game is you. Wherever you go, someone shouts: {taunt} Today they have followed you to the well.",
        choices: [
          {
            t: "Fight the biggest one",
            check: {s:"str",s2:"ins",d:24},
            win: {r:"He goes down. The shouting stops, at least near you.",fx:{str:.3,ins:.3,happy:3,wil:.3}},
            lose: {
              r: "You go down. They laugh. You get up again, which they did not expect.",
              fx: {health:-3,wil:1,happy:-3},
            },
          },
          {
            t: "Shout back something worse",
            check: {s:"persuasion",s2:"int",d:22},
            win: {
              r: "Your answer is so good that the others laugh at him instead. You have a reputation now.",
              fx: {skill:{persuasion:1},happy:4},
            },
            lose: {r:"Your answer comes out squeaky. The game goes on.",fx:{happy:-3,wil:.5}},
          },
          {
            t: "Tell your family",
            r: "Your family hears you out. What they say about the family, and about pride, stays with you.",
            fx: {rel:{who:"father",op:5},wil:.4,honor:1},
          },
        ],
      },
      {
        id: "hs_k_old_retainer",
        cond: p=>KID(p)&&C.famKind(p,"noble","gentry","gentry_mil","royal","merchant","clan","horse"),
        cool: 8,
        title: "The old retainer",
        setup: (p,ctx)=>{fill(p,ctx);const x=mkOther(p,"",{adj:68,status:"peasant",occ:"an old servant of the family"});ctx.pid=x.id,sexWords(ctx,x),ctx.job=A.pick(["the old groom","the one-legged gatekeeper","the cook who has cooked for three generations","the deaf old steward"])},
        text: "{them}, {job} at {seat}, has served {fam} since before your parents were born. {He} lets you sit in {theirHis} corner while {theyHe} works and tells you things nobody else will.",
        choices: [
          {
            t: "Ask about the family's old days",
            r: p=>`{them} tells you how things really were. ${end(histLine(p))} And then a lot of things that are not written anywhere.`,
            fx: {them:{type:"friend",op:25},int:.3,skill:{intrigue:1}},
          },
          {
            t: "Ask {themHim} to teach you a skill",
            check: {s:"int",s2:"wil",d:22},
            win: {
              r: "Rope knots, horse care, how to tell when someone is lying. {them} is a better teacher than any tutor.",
              fx: {them:{type:"mentor",op:30,back:"student"},skill:{husbandry:2,intrigue:1}},
            },
            lose: {
              r: "You are not patient enough, and {them} sends you off to play. Gently.",
              fx: {them:{type:"friend",op:10}},
            },
          },
          {
            t: "Steal {theirHis} pipe for a joke",
            r: "{them} is not angry. Just sad. That is worse, and you give it back.",
            fx: {them:{type:"friend",op:-5},happy:-2},
          },
        ],
      },
      {
        id: "hs_k_graves",
        cond: CH,
        cool: 6,
        title: "Visiting the dead",
        setup: (p,ctx)=>{fill(p,ctx),ctx.day={"REL-01":"Ash Night","REL-03":"the grave-ale day"}[p.faith]||"the day of the dead"},
        text: 'On {day} your family walks out to where the dead of {fam} lie. Your parent points out the names: this one fought, this one drowned, this one built the barn. "One day you will bring your children here."',
        choices: [
          {
            t: "Ask about every single one",
            r: "It takes all afternoon. You learn that your family is a long story and you are in the middle of it.",
            fx: {int:.3,piety:2,wil:.3},
          },
          {
            t: "Leave a flower on the smallest grave",
            r: "Nobody tells you whose it is. Your mother squeezes your hand very hard.",
            fx: {piety:3,rel:{who:"mother",op:6}},
          },
          {
            t: "Get scared and want to go home",
            r: "You hold your father's hand all the way back. That night you dream of long rows of names.",
            fx: {happy:-2,wil:.4},
          },
        ],
      },
      {
        id: "hs_t_page",
        cond: p=>TEEN(p)&&C.famKind(p,"noble","gentry","gentry_mil"),
        once: !0,
        title: "Sent to serve",
        setup: (p,ctx)=>{fill(p,ctx),ctx.al=allyOf(p),ctx.Al=A.cap(ctx.al)},
        text: "By custom, the children of {fam} are sent away at your age to serve in a greater house. You are to go to {al}, as a page: carry cups, learn manners, learn the sword, and be a pledge of the friendship between the houses.",
        choices: [
          {
            t: "Throw yourself into it",
            check: {s:"etiquette",s2:"wil",d:28},
            win: {
              r: "Two years of service. You come home with good manners, a sword arm and friends in a great house.",
              fx: {skill:{etiquette:3,sword:2,riding:2},newRel:{type:"friend",op:35},honor:2},
            },
            lose: {
              r: "You are homesick and clumsy, and the older pages make your life a misery. You learn to endure.",
              fx: {skill:{etiquette:1,sword:1},wil:1.2,happy:-4},
            },
          },
          {
            t: "Learn the sword above all",
            check: {s:"sword",s2:"str",d:26},
            win: {
              r: "The master-at-arms notices you. You come home a real swordsman for your age.",
              fx: {skill:{sword:4,shield:2},str:.4},
            },
            lose: {
              r: "You spend more time on your back in the sawdust than on your feet. You learn anyway.",
              fx: {skill:{sword:2},health:-2,wil:.5},
            },
          },
          {
            t: "Listen at doors",
            check: {s:"stealth",s2:"int",d:26},
            win: {
              r: "Nobody notices a page. You learn more about how great houses really work than any lesson could teach.",
              fx: {skill:{intrigue:3,stealth:2}},
            },
            lose: {
              r: "Caught behind a tapestry. You are beaten and sent home early, in disgrace.",
              fx: {happy:-6,honor:-2,rel:{who:"father",op:-8}},
            },
          },
        ],
      },
      {
        id: "hs_n_homage",
        cond: p=>AD(p)&&NOB(p)&&C.ageAdj(p)<40,
        once: !0,
        title: "Homage",
        setup: (p,ctx)=>{fill(p,ctx),ctx.mw=p.sex==="M"?"man":"woman"},
        text: `Every grown member of {fam} must kneel once to {lg}. Today it is your turn. Bareheaded, hands between the liege's hands, before the whole court: "I become your {mw}, of life and limb and earthly honor." It is old, and it binds.`,
        choices: [
          {
            t: "Swear it plainly, and mean it",
            r: "The liege raises you and gives you the kiss of peace. You belong to something larger now, for better or worse.",
            fx: {honor:4,favor:8,piety:1},
          },
          {
            t: "Swear it with flourish, for the court",
            check: {s:"etiquette",s2:"persuasion",d:44},
            win: {
              r: "Your words ring through the hall. Ladies whisper. The liege smiles and remembers your face.",
              fx: {fame:2,favor:10,skill:{etiquette:2}},
            },
            lose: {
              r: "You trip on your cloak on the way up. The court titters. The oath counts all the same.",
              fx: {happy:-4,favor:2},
            },
          },
          {
            t: "Swear, but cross your fingers in your sleeve",
            r: "Nobody sees. You will know, every time you bow.",
            fx: {honor:-3,trait:"deceitful",favor:4},
          },
        ],
      },
      {
        id: "hs_n_court_day",
        cond: p=>AD(p)&&NOB(p)&&notHead(p),
        cool: 6,
        title: "Court day at the seat",
        setup: (p,ctx)=>{fill(p,ctx),ctx.case=A.pick(["two tenants and a pig that each says is his","a widow who says the miller cheats her on every sack","a boy caught snaring rabbits in the lord's warren","a brawl at the harvest feast that left a man without teeth","a moved boundary stone between two strips of barley"])},
        text: "{Head} is away, and you must hold the family's court at {seat} in the absent head's place. The hall is full of tenants in their best clothes, and every one of them will tell {familyHead} how you did. The first case: {case}. Everyone is watching how you judge.",
        choices: [
          {
            t: "Judge by the law, strictly",
            check: {s:"learning",s2:"int",d:44},
            win: {
              r: "Your judgment is clear and correct. Nobody loves you for it, but nobody can argue.",
              fx: {honor:3,skill:{learning:2,stewardship:1}},
            },
            lose: {
              r: "You get the custom wrong, and an old tenant corrects you in front of everyone.",
              fx: {happy:-4,skill:{learning:1}},
            },
          },
          {
            t: "Judge with mercy",
            r: "A small fine, a warning, a handshake. The tenants go home talking about the kind young one of the {sur} blood. The steward grumbles about lost fines.",
            fx: {honor:2,happy:3,piety:1},
          },
          {
            t: "Judge for whatever profits the house",
            r: "Heavy fines all round. The family coffers are fuller. The tenants' faces are not friendly.",
            fx: X(p=>gain(p,sc(p,3)),{honor:-3,skill:{stewardship:2}}),
          },
        ],
      },
      {
        id: "hs_n_lance_owed",
        cond: p=>AD(p)&&NOB(p)&&notHead(p)&&!C.soldier(p),
        cool: 8,
        title: "The family owes a lance",
        setup: (p,ctx)=>{fill(p,ctx),ctx.fee=sc(p,20)},
        text: '{Fam} holds its land from {lg} for the service of so many lances, forty days a year. This year there is one lance short, and {head} looks at you. "You ride, or the family pays shield-money: {fee} suns. Your choice."',
        choices: [
          {
            t: "Ride the forty days",
            r: "Forty days of guard duty in a draughty border fort, in the family colors. You come back harder and a little proud.",
            fx: {sta:.5,skill:{riding:2,lance:2,command:1},honor:3,favor:4,wil:.5},
          },
          {
            t: "Pay the shield-money yourself",
            r: "Your purse is lighter. The family is grateful in the way families are, which is briefly.",
            fx: X((p,ctx)=>pay(p,ctx.fee),{honor:1}),
          },
          {
            t: "Hire a landless knight to ride in your place",
            check: {s:"trade",s2:"persuasion",d:40},
            win: {
              r: "A grizzled knight rides for a third of the price. He even brings back a captured horse, which he sells you.",
              fx: X((p,ctx)=>pay(p,ctx.fee/3),{skill:{trade:1}}),
            },
            lose: {
              r: "Your hired knight takes the money and vanishes. You pay the shield-money anyway.",
              fx: (p,ctx)=>{pay(p,ctx.fee*1.3),A.willGrow(p,.4)},
            },
          },
        ],
      },
      {
        id: "hs_n_landless",
        cond: p=>AD(p)&&NOB(p)&&notHead(p)&&C.ageAdj(p)>=24&&C.ageAdj(p)<45&&sibElder(p)&&!p.noble,
        cool: 10,
        title: "No land of your own",
        setup: (p,ctx)=>{fill(p,ctx)},
        text: "Your elder sibling has the land, the hall and the say. You have a horse, a sword, a good name and a room at {seat} that is getting smaller every year. Younger children of noble houses have always had to find their own way.",
        choices: [
          {
            t: "Ride the tourney circuit for prizes",
            check: {s:"lance",s2:"riding",d:52},
            win: {
              r: "A season of jousts. You win a purse, a horse and a name. Heiresses start asking who you are.",
              fx: X(p=>gain(p,sc(p,15)),{fame:3,skill:{lance:3,riding:2}}),
            },
            lose: {
              r: "Knocked flat at the first three tourneys. You sell your second horse to pay the armorer.",
              fx: X(p=>pay(p,sc(p,5)),{health:-8,cause:"a tourney fall",wil:1}),
            },
          },
          {
            t: "Court a rich heiress (or heir)",
            check: {s:"persuasion",s2:"etiquette",d:50,bonus:p=>p.looks/5-10},
            win: {r:"A widow with three manors finds you charming. Things are moving.",fx:{lover:!0,happy:5}},
            lose: {
              r: "Every rich match in the county has a mother who has heard of younger sons.",
              fx: {happy:-4,wil:.5},
            },
          },
          {
            t: "Make yourself the family steward",
            r: "You run the estates while your sibling hunts. Unthanked, but in the end everyone needs the one who knows where the money is.",
            fx: {skill:{stewardship:4,trade:1},int:.3},
          },
          {
            t: "Sell your sword abroad",
            r: "You ride for a foreign company. It is hard, poor and dangerous. It is yours.",
            fx: p=>{if(!p.mil){const r=A.enlist(p,!1);if(r&&r.ok)return"You sign on with the host."}return A.willGrow(p,.8),""},
          },
        ],
      },
      {
        id: "hs_n_disputed",
        cond: p=>AD(p)&&NOB(p),
        w: .7,
        cool: 18,
        title: "The empty seat",
        setup: (p,ctx)=>{fill(p,ctx),ctx.place=A.provName(A.pick(A.S.prov.filter(x=>x.owner===p.realm).map(x=>x.id).concat([p.home]))),ctx.rv=rivalOf(p),ctx.Rv=A.cap(ctx.rv)},
        text: "A cousin's line has died out, and with it the holder of the manor at {place}. By blood you have a claim. So does someone from {rv}, through a great-grandmother. {Lg} will decide, and {lg} likes gifts.",
        choices: [
          {
            t: "Press your claim at court",
            check: {s:"diplomacy",s2:"learning",d:52},
            win: {
              r: "The heralds read the pedigrees and find for you. A manor, rents and a seat at the lesser table. You are someone now.",
              fx: p=>(gain(p,sc(p,30)),p.assets.some(a=>a.k==="manor")||p.assets.push({k:"manor",name:GD.PROPERTY.manor.name,y:A.S.year}),A.fame(p,2),""),
            },
            lose: {
              r: "The court finds for {rv}. Their claimant smirks at you across the hall.",
              fx: {happy:-6,newRel:{type:"rival",op:-25},wil:.8},
            },
          },
          {
            t: "Send the liege a handsome gift",
            r: "The gift is admired. The judgment is put off. The gift is not returned.",
            fx: X(p=>pay(p,sc(p,15)),{favor:10}),
          },
          {
            t: "Let it go",
            r: "Lawsuits eat families. You keep your money and your peace, and {rv} gets the manor.",
            fx: {happy:-1,wil:.4},
          },
        ],
      },
      {
        id: "hs_n_neighbor_feud",
        cond: p=>AD(p)&&NOB(p),
        cool: 8,
        title: "The neighbors",
        setup: (p,ctx)=>{fill(p,ctx),ctx.rv=rivalOf(p),ctx.Rv=A.cap(ctx.rv),ctx.harm=A.pick(["driven off forty head of your cattle","burned the family mill on the boundary stream","beaten your bailiff half to death","cut down the old oaks on the disputed hill","dammed the stream that waters your tenants' fields"])},
        text: "The men of {rv} have {harm}. Everyone at {seat} knows who gave the order. Your tenants are frightened, your cousins are furious, and {head} is waiting to hear what you think.",
        choices: [
          {
            t: "Lead a raid back across the boundary",
            check: {s:"command",s2:"tactics",d:50},
            win: {
              r: "You hit their barns at dawn and drive off twice what they took. The family drinks to you.",
              fx: X(p=>gain(p,sc(p,6)),{fame:2,skill:{command:2,tactics:1},flag:"hs_feud"}),
            },
            lose: {
              r: "They were ready. You lose two men and come home with an arrow in you.",
              fx: {health:-18,cause:"a border raid",wound:"arrow_wound",wil:1.2,flag:"hs_feud"},
            },
          },
          {
            t: "Take it to {lg}'s court",
            check: {s:"diplomacy",s2:"persuasion",d:46},
            win: {
              r: "{Rv} is ordered to pay damages, and does, with ill grace. The law has teeth sometimes.",
              fx: X(p=>gain(p,sc(p,5)),{honor:2,favor:3}),
            },
            lose: {
              r: "The liege does not want trouble between his vassals and tells both houses to behave. Nothing is paid.",
              fx: {happy:-4},
            },
          },
          {
            t: "Challenge their champion to settle it",
            r: "A field at the boundary stone, at noon, with both houses watching.",
            fx: {
              honor: 3,
              duel: {
                tier: 3,
                title: "the champion of the neighbor house",
                opts: {kind:"duel",place:"the boundary stone",lethal:!1,toYield:!0,title:"A champion for the house"},
              },
            },
          },
        ],
      },
      {
        id: "hs_n_honor",
        cond: p=>AD(p)&&NOB(p),
        w: .8,
        cool: 14,
        title: "The honor of the house",
        setup: (p,ctx)=>{fill(p,ctx),kinPid(p,ctx,{sex:"M"}),ctx.where=A.pick(["in the last border fight","at the siege","when the levy broke on the river crossing"])},
        text: "A herald says it in the liege's hall, where everyone can hear: your {cz} {them} turned his horse and ran {where}. A knight of {fam}, running. The other houses smile into their cups.",
        choices: [
          {
            t: "Challenge the herald to prove it",
            check: {s:"persuasion",s2:"wil",d:50},
            win: {
              r: "Three men who were there swear that {them} was carrying a wounded friend. The herald apologizes on his knees.",
              fx: {honor:5,fame:2,them:{type:"cousin",op:30}},
            },
            lose: {
              r: "The witnesses agree with the herald. Now the whole court has heard it twice.",
              fx: {honor:-4,happy:-5,wil:1},
            },
          },
          {
            t: "Find {them} and make {themHim} redeem it",
            r: "{them} rides with you to the next fight and holds the line until dark. Shame washed out in mud and blood, the old way.",
            fx: {them:{type:"cousin",op:15},honor:3,health:-6,cause:"a hard fight",skill:{melee:2}},
          },
          {
            t: "Disown {themHim} publicly",
            r: "You strike {them} from the house before the court. Honor is saved. A man is ruined. You will dream about it.",
            fx: {them:{type:"enemy",op:-50},honor:2,happy:-5,wil:.8},
          },
        ],
      },
      {
        id: "hs_n_relief",
        cond: p=>AD(p)&&NOB(p)&&C.famHead(p),
        cool: 20,
        title: "The relief",
        setup: (p,ctx)=>{fill(p,ctx),ctx.fee=sc(p,40)},
        text: `When a vassal house gets a new head, the liege takes a "relief": a year's rents, by old custom, to let the heir enter into his own. {Lg}'s clerk has arrived at {seat} with the bill: {fee} suns.`,
        choices: [
          {
            t: "Pay it in full",
            r: "The bill is paid. Your title is confirmed on the chancery roll. You are the head of {fam} in law, not just in name.",
            fx: X((p,ctx)=>pay(p,ctx.fee),{favor:8,honor:2}),
          },
          {
            t: "Argue the custom down",
            check: {s:"learning",s2:"diplomacy",d:50},
            win: {
              r: "You find the old charter: the relief is half a year, not a year. The clerk takes half, and is impressed.",
              fx: X((p,ctx)=>pay(p,ctx.fee/2),{skill:{learning:2}}),
            },
            lose: {
              r: "The clerk finds a newer charter. You pay in full and a fee for wasting his time.",
              fx: (p,ctx)=>{pay(p,ctx.fee*1.1),A.applyFx(p,{favor:-3},ctx)},
            },
          },
          {
            t: "Pay late, in wool and wine",
            r: "The liege's steward grumbles but accepts. Your name is written down in a book of slow payers.",
            fx: X((p,ctx)=>pay(p,ctx.fee*.7),{favor:-5}),
          },
        ],
      },
      {
        id: "hs_n_wardship",
        cond: p=>AD(p)&&NOB(p),
        w: .6,
        cool: 18,
        title: "An orphaned heir",
        setup: (p,ctx)=>{fill(p,ctx),kinPid(p,ctx,{adj:8}),ctx.fee=sc(p,25)},
        text: "Your {cz} and his wife died of the same fever, leaving a child of eight, {them}, heir to a small manor. By law the child is now a ward of {lg}, who may sell the wardship and the child's marriage to whoever pays. A stranger is bidding.",
        choices: [
          {
            t: "Buy the wardship yourself",
            r: "You pay {fee} suns. {them} comes to live with you, and the manor stays in the family.",
            fx: X((p,ctx)=>pay(p,ctx.fee),{them:{type:"nephew",op:35,back:"uncle"},honor:3}),
          },
          {
            t: "Petition the liege to let the family raise the child",
            check: {s:"diplomacy",s2:"persuasion",d:50},
            win: {
              r: "The liege is moved, or wants your goodwill. The family keeps the child, for a small fee.",
              fx: X((p,ctx)=>pay(p,ctx.fee/4),{them:{type:"nephew",op:30,back:"uncle"},favor:3}),
            },
            lose: {
              r: "The wardship goes to the stranger. You see {them} once, years later, married to the stranger's son.",
              fx: {happy:-5,wil:.8},
            },
          },
          {
            t: "Let the law take its course",
            r: "The child goes to a household of strangers. It is the way of things. It does not feel like it.",
            fx: {happy:-3},
          },
        ],
      },
      {
        id: "hs_n_castellan",
        cond: p=>AD(p)&&NOB(p)&&notHead(p),
        cool: 12,
        title: "Keeper of the castle",
        setup: (p,ctx)=>{fill(p,ctx),ctx.fault=A.pick(["the east wall has a crack you can put a fist in","the well is half silted up","the garrison has not been paid since spring","the gate timbers are rotten through"])},
        text: "{Head} makes you castellan of the family's keep near {seat}. You ride in proudly, and the sergeant shows you round. Within an hour you know the truth: {fault}.",
        choices: [
          {
            t: "Fix it properly, whatever it costs",
            r: "Masons, timber, back pay. Your purse bleeds, but the keep could hold now.",
            fx: X(p=>pay(p,sc(p,12)),{skill:{siegecraft:2,stewardship:2},honor:2}),
          },
          {
            t: "Make do with what you have",
            check: {s:"stewardship",s2:"siegecraft",d:46},
            win: {
              r: "Clever patching and hard work. The sergeant says he has never seen it done better on less.",
              fx: {skill:{stewardship:3,siegecraft:2},fame:1},
            },
            lose: {r:"The patch holds until the first storm. The family hears about it.",fx:{happy:-4,honor:-1}},
          },
          {
            t: "Write to {head} for money",
            r: "A reply comes months later, with half of what you asked and a lecture about thrift.",
            fx: X(p=>gain(p,sc(p,4)),{skill:{stewardship:1}}),
          },
        ],
      },
      {
        id: "hs_n_tourney",
        cond: p=>AD(p)&&NOB(p)&&C.ageAdj(p)<40,
        cool: 6,
        title: "In the family colors",
        setup: (p,ctx)=>{fill(p,ctx),ctx.host=A.pick([ctx.lg,"the count at {town}","a rich neighbor celebrating a wedding"]),ctx.host=rs(p,ctx,ctx.host),ctx.rv=rivalOf(p),ctx.Rv=A.cap(ctx.rv)},
        text: "A tourney given by {host}. You ride out under {arms}, the colors of {fam}, and the herald calls your name. Your first opponent rides for {rv}.",
        choices: [
          {
            t: "Ride hard at the lists",
            check: {s:"lance",s2:"riding",d:50},
            win: {
              r: "Your lance takes him clean on the shield and he goes over his horse's tail. The family's colors are cheered all down the stands.",
              fx: {fame:3,honor:2,skill:{lance:2,riding:1},happy:6},
            },
            lose: {
              r: "You go down in a clatter. The {rv} men laugh loudest of all.",
              fx: {health:-10,cause:"a tourney fall",happy:-5,wil:.6},
            },
          },
          {
            t: "Enter the melee instead",
            r: "Thirty riders, blunted swords and no rules worth the name.",
            fx: {
              duel: {
                tier: 2,
                title: "a knight in the melee",
                opts: {kind:"brawl",place:"the tourney field",lethal:!1,toYield:!0,title:"The melee"},
              },
            },
          },
          {
            t: "Watch from the stands and make friends",
            r: "You spend the tourney in the stands, trading gossip with the young of three houses. Useful, if less glorious.",
            fx: {skill:{diplomacy:2},newRel:{type:"friend",op:25}},
          },
        ],
      },
      {
        id: "hs_n_steward",
        cond: p=>AD(p)&&NOB(p),
        cool: 12,
        title: "The steward's books",
        setup: (p,ctx)=>{fill(p,ctx);const x=mkOther(p,"",{adj:50,status:"gentry",occ:"steward of the family lands"});ctx.pid=x.id,sexWords(ctx,x)},
        text: "The figures in the family rent-rolls do not add up. You go over them three times. {themFull}, the family's steward for twenty years, has been taking a tenth of everything, for years.",
        choices: [
          {
            t: "Confront {themHim} with the books",
            check: {s:"intimidation",s2:"int",d:44},
            win: {
              r: "{them} breaks down and confesses. Some of the money comes back, and {theyHe} leaves {seat} by nightfall.",
              fx: X(p=>gain(p,sc(p,8)),{them:{type:"enemy",op:-30},honor:2}),
            },
            lose: {
              r: "{them} denies everything and says you cannot read figures. Half the family believes {themHim}.",
              fx: {them:{type:"enemy",op:-25},happy:-4},
            },
          },
          {
            t: "Take it to {head}",
            r: "The steward is dismissed and the family is grateful. You have a reputation now for sharp eyes.",
            fx: {them:{type:"enemy",op:-30},skill:{stewardship:2},fame:1},
          },
          {
            t: "Let {themHim} know you know, and keep {themHim}",
            r: "A quiet word. {them} goes pale. From now on, the books are perfect, and {theyHe} is yours.",
            fx: {them:{type:"servant",op:-5},skill:{intrigue:3}},
          },
        ],
      },
      {
        id: "hs_n_liege_visit",
        cond: p=>AD(p)&&NOB(p),
        cool: 12,
        title: "The liege comes to stay",
        setup: (p,ctx)=>{fill(p,ctx),ctx.n=A.pick(["sixty","eighty","a hundred and twenty"])},
        text: "{Lg} is on progress and will stay three nights at {seat}, with {n} people, their horses and their hounds. It is a great honor. It will also eat the family's stores to the bone.",
        choices: [
          {
            t: "Put on the finest feast in living memory",
            r: "Swans, peacocks, a subtlety in the shape of the liege's castle. The liege is delighted. The cellars are empty until spring.",
            fx: X(p=>pay(p,sc(p,25)),{favor:15,fame:2,honor:2}),
          },
          {
            t: "Do it well, but carefully",
            check: {s:"stewardship",s2:"etiquette",d:46},
            win: {
              r: "Good food, good order, not a penny wasted. The liege's steward asks how you did it.",
              fx: X(p=>pay(p,sc(p,10)),{favor:8,skill:{stewardship:2,etiquette:1}}),
            },
            lose: {
              r: "The wine runs out on the second night. The court notices.",
              fx: X(p=>pay(p,sc(p,10)),{favor:-4,happy:-4}),
            },
          },
          {
            t: "Use the visit to ask a favor",
            check: {s:"diplomacy",s2:"persuasion",d:50},
            win: {
              r: "After the second bottle, the liege grants the family a market charter. It will pay for the visit ten times over.",
              fx: X(p=>pay(p,sc(p,10)),{favor:5,fame:1,skill:{diplomacy:2},flag:"hs_market"}),
            },
            lose: {
              r: "The liege does not like being asked for things in a house where he is a guest.",
              fx: X(p=>pay(p,sc(p,10)),{favor:-8}),
            },
          },
        ],
      },
      {
        id: "hs_n_tenants",
        cond: p=>AD(p)&&NOB(p)&&notHead(p),
        cool: 10,
        title: "The tenants' petition",
        setup: (p,ctx)=>{fill(p,ctx);const x=mkOther(p,"",{adj:45,status:"peasant",occ:"a tenant of the family"});ctx.pid=x.id,sexWords(ctx,x)},
        text: "{themFull}, an old tenant of {fam}, waits for you at the gate, hat in hand, with a dozen neighbors behind. They say {head} has raised the rents twice in two years, and the children are going hungry.",
        choices: [
          {
            t: "Promise to speak for them",
            check: {s:"persuasion",s2:"diplomacy",d:48},
            win: {
              r: "You talk {head} round. The second rise is cancelled. The tenants bring you eggs and cheese for a month.",
              fx: {them:{type:"friend",op:30},honor:3,piety:1},
            },
            lose: {
              r: "{Head} tells you to mind your own business. The tenants look at you as if you had lied to them.",
              fx: {them:{type:"acquaint",op:-10},happy:-4},
            },
          },
          {
            t: "Give them grain from your own share",
            r: "It does not solve anything, but nobody starves this winter.",
            fx: X(p=>pay(p,sc(p,6)),{them:{type:"friend",op:25},honor:2,piety:2}),
          },
          {
            t: "Send them back to work",
            r: "They go, silently. On the road home you feel their eyes on your back.",
            fx: {them:{type:"enemy",op:-20},honor:-2},
          },
        ],
      },
      {
        id: "hs_n_arms_dispute",
        cond: p=>AD(p)&&C.famKind(p,"noble","gentry","gentry_mil","royal"),
        cool: 15,
        title: "Who owns the arms",
        setup: (p,ctx)=>{fill(p,ctx),ctx.up=A.pick(["a newly knighted wool merchant","a foreign knight","a cadet line that broke off two hundred years ago"])},
        text: "At the tourney you see it: {up} riding under arms almost exactly like yours, {arms}, with only a little difference. In heraldry that is an insult, and the heralds' court will hear the case if you bring it.",
        choices: [
          {
            t: "Bring the case to the heralds",
            check: {s:"learning",s2:"etiquette",d:48},
            win: {
              r: "The heralds rule for you. The upstart must change his arms. Your family is pleased beyond reason.",
              fx: {honor:3,fame:1,skill:{learning:1}},
            },
            lose: {
              r: "The heralds rule that the difference is enough. You paid the fees for nothing.",
              fx: X(p=>pay(p,sc(p,4)),{happy:-3}),
            },
          },
          {
            t: "Challenge him to a joust for the right to the arms",
            r: "An old custom, and a crowd-pleaser.",
            fx: {
              duel: {
                tier: 2,
                title: "the knight with your arms",
                opts: {kind:"duel",place:"the lists",lethal:!1,toYield:!0,title:"A joust for the arms"},
              },
            },
          },
          {
            t: "Laugh: imitation is flattery",
            r: "You buy the upstart a drink. He is so relieved that he tells you everything about the wool trade.",
            fx: {skill:{trade:2},newRel:{type:"friend",op:20}},
          },
        ],
      },
      {
        id: "hs_n_dowry",
        cond: p=>AD(p)&&C.famKind(p,"noble","gentry","gentry_mil","merchant","guild"),
        cool: 12,
        title: "The dowry",
        setup: (p,ctx)=>{fill(p,ctx),kinPid(p,ctx,{sex:"F",adj:18}),ctx.fee=sc(p,25)},
        text: "Your young {cz} {them} is promised to a good house, but the dowry is not ready. {Fam} cannot pay it all, and the other family will not wait past Midsummer. {Head} asks every grown member to put in. Your share would be {fee} suns.",
        choices: [
          {
            t: "Pay your share",
            r: "The dowry is paid. {them} goes off to her wedding in a cloud of ribbons and gratitude.",
            fx: X((p,ctx)=>pay(p,ctx.fee),{them:{type:"cousin",op:30},honor:2}),
          },
          {
            t: "Bargain the dowry down with the groom's family",
            check: {s:"trade",s2:"diplomacy",d:48},
            win: {
              r: "Land instead of coin, and less of it. Both families are satisfied, which almost never happens.",
              fx: {skill:{trade:2,diplomacy:1},them:{type:"cousin",op:20},fame:1},
            },
            lose: {
              r: "The groom's mother takes offense. The wedding is put off a year.",
              fx: {them:{type:"cousin",op:-10},happy:-3},
            },
          },
          {
            t: "Refuse: not your daughter, not your debt",
            r: "The wedding goes ahead, poorer. {them} knows who did not help.",
            fx: {them:{type:"cousin",op:-20},honor:-2},
          },
        ],
      },
      {
        id: "hs_n_hostage",
        cond: p=>AD(p)&&NOB(p)&&kidsOf(p).some(c=>!A.isAdult(c)),
        w: .6,
        cool: 15,
        title: "A child for the liege",
        setup: (p,ctx)=>{fill(p,ctx);const k=kidsOf(p).filter(c2=>!A.isAdult(c2)),c=A.pick(k);ctx.pid=c.id,sexWords(ctx,c)},
        text: `{Lg} does not quite trust {fam} since the last troubles, and asks for a child of the house to be raised at court, "as an honor". Everyone knows what that means. The liege's letter names your {them}.`,
        choices: [
          {
            t: "Send {them}, with your blessing",
            r: "{them} goes, with a new cloak and a brave face. At court {theyHe} will learn much. If the house stays loyal, {theyHe} will come home.",
            fx: {favor:12,them:{op:-10},happy:-6,wil:1.5,honor:2},
          },
          {
            t: "Offer a nephew instead",
            check: {s:"diplomacy",s2:"intrigue",d:48},
            win: {
              r: "The liege accepts the substitute. Your child stays home. Your brother does not speak to you for a year.",
              fx: {favor:4,newRel:{type:"enemy",op:-20}},
            },
            lose: {
              r: "The liege is insulted. Your child goes anyway, and you are watched more closely.",
              fx: {favor:-6,them:{op:-10},happy:-6},
            },
          },
          {
            t: "Refuse",
            r: "A dangerous answer. The liege says nothing. The silence goes on a long time.",
            fx: {favor:-15,honor:1,flag:"hs_suspect"},
          },
        ],
      },
      {
        id: "hs_n_charter",
        cond: p=>AD(p)&&C.famKind(p,"noble","gentry","gentry_mil","guild","merchant","clergy"),
        w: .6,
        once: !0,
        title: "The lost charter",
        setup: (p,ctx)=>{fill(p,ctx),ctx.rv=rivalOf(p),ctx.Rv=A.cap(ctx.rv)},
        text: "The charter that gives {fam} its rights, old parchment and a wax seal, has gone from the strongbox at {seat}. Without it, any lawyer could challenge the family's claim. And {rv} has very good lawyers.",
        choices: [
          {
            t: "Search the house from cellar to roof",
            check: {s:"int",s2:"tracking",d:44},
            win: {
              r: "You find it in a dead aunt's prayer book, used as a page marker. Everybody laughs too loudly, from relief.",
              fx: {honor:2,happy:5,int:.3},
            },
            lose: {r:"Three days of dust and spiders. Nothing.",fx:{happy:-3,flag:"hs_charter_lost"}},
          },
          {
            t: "Ride to the chancery for a copy",
            r: p=>`A week of waiting in ${realmCap(p)}, bribing clerks. You come home with a copy, sealed and expensive.`,
            fx: X(p=>pay(p,sc(p,10)),{skill:{learning:1}}),
          },
          {
            t: "Find out who took it",
            check: {s:"intrigue",s2:"int",d:50},
            win: {
              r: "A servant was paid by {rv}. You get the charter back, and something to hold over them.",
              fx: {skill:{intrigue:3},honor:2,fame:1},
            },
            lose: {
              r: "Your questions frighten the servants. The thief, whoever it was, stays hidden.",
              fx: {happy:-3,flag:"hs_charter_lost"},
            },
          },
        ],
      },
      {
        id: "hs_n_sell_manor",
        cond: p=>AD(p)&&NOB(p)&&notHead(p),
        cool: 15,
        title: "Selling the old land",
        setup: (p,ctx)=>{fill(p,ctx);const x=mkOther(p,"",{adj:45,status:"merchant",occ:"a rich merchant"});ctx.pid=x.id,sexWords(ctx,x)},
        text: "{Head} means to sell the oldest manor of {fam}, the one with the family's first hall, to {themFull}, a merchant from {town} who wants to be a gentleman. The money would clear the family's debts. The graves would go with the land.",
        choices: [
          {
            t: "Argue against it",
            check: {s:"persuasion",s2:"wil",d:50},
            win: {
              r: "You talk {head} out of it, for now. You will have to find the money some other way.",
              fx: {honor:3,them:{type:"acquaint",op:-10}},
            },
            lose: {r:"The sale goes through. You walk through the old hall one last time, alone.",fx:{happy:-6,wil:1}},
          },
          {
            t: "Try to buy it yourself",
            req: p=>p.coin>=sc(p,40),
            r: "Your own money, your own manor. The family is astonished. So is the merchant.",
            fx: p=>(pay(p,sc(p,40)),p.assets.some(a=>a.k==="manor")||p.assets.push({k:"manor",name:GD.PROPERTY.manor.name,y:A.S.year}),p.honor=A.clamp(p.honor+4,0,100),""),
          },
          {
            t: "Make sure the merchant pays top price",
            check: {s:"trade",s2:"persuasion",d:46},
            win: {
              r: "He pays a fifth more than he meant to. The family gives you a share.",
              fx: X(p=>gain(p,sc(p,8)),{skill:{trade:2}}),
            },
            lose: {r:"He is a better haggler than you. The family is not pleased.",fx:{happy:-2}},
          },
        ],
      },
      {
        id: "hs_n_merchant_match",
        cond: p=>AD(p)&&NOB(p)&&!C.married(p)&&C.ageAdj(p)<40,
        cool: 10,
        title: "Marrying money",
        setup: (p,ctx)=>{fill(p,ctx);const x=mkOther(p,"",{sex:p.flags.likes||(p.sex==="M"?"F":"M"),adj:C.ageAdj(p)+A.ri(-3,5),status:"merchant",occ:"the heir of a great merchant house"});ctx.pid=x.id,sexWords(ctx,x),ctx.sum=sc(p,60)},
        text: "{Fam} is old, proud and nearly broke. {themFull}, {themOcc}, is new, rich and wants an old name. The marriage would bring {sum} suns. Your aunts call it a disgrace. Your uncles call it a miracle.",
        choices: [
          {
            t: "Marry for money",
            r: "A splendid wedding, paid for by the bride's side. The family debts vanish. Some cousins never forgive you.",
            fx: (p,ctx)=>{const t=T(ctx);return t&&!C.married(p)&&(A.marry(p,t),gain(p,ctx.sum)),p.honor=A.clamp(p.honor-2,0,100),""},
          },
          {
            t: "Get to know {themHim} first",
            check: {s:"diplomacy",s2:"int",d:40},
            win: {
              r: "{them} is sharp, funny and tired of being sneered at. You like {themHim} more than you expected.",
              fx: {them:{type:"lover",op:30,back:"lover"},happy:4},
            },
            lose: {r:"{them} thinks you are a snob. {He} may be right.",fx:{them:{type:"acquaint",op:-10}}},
          },
          {
            t: "Refuse: the name is not for sale",
            r: "The family stays proud and poor. You go to bed feeling noble and hungry.",
            fx: {honor:3,happy:-2},
          },
        ],
      },
      {
        id: "hs_n_elevation",
        cond: p=>AD(p)&&NOB(p)&&C.famHead(p),
        w: .5,
        cool: 25,
        title: "A higher rung",
        setup: (p,ctx)=>{fill(p,ctx),ctx.fee=sc(p,120)},
        text: `A friend at court whispers: {lg} would raise {fam} a rung higher, a step up the ladder of titles and a seat nearer the throne, for a "gift" of {fee} suns and the house's support in the coming council.`,
        choices: [
          {
            t: "Pay and rise",
            req: (p,C2,ctx)=>p.coin>=(ctx&&ctx.fee||0),
            r: "A new title, new arms, a new place in the procession. The old families sneer. Their grandfathers did the same.",
            fx: X((p,ctx)=>pay(p,ctx.fee),{fame:5,favor:10,honor:-1,deed:"Raised the house a rung"}),
          },
          {
            t: "Offer support, not coin",
            check: {s:"diplomacy",s2:"intrigue",d:55},
            win: {
              r: "Your votes and your lances are worth more than gold this year. The title comes cheap.",
              fx: X((p,ctx)=>pay(p,ctx.fee/4),{fame:4,favor:6,skill:{diplomacy:2}}),
            },
            lose: {r:"The liege wanted gold. The offer is withdrawn and somebody else rises.",fx:{favor:-4,happy:-3}},
          },
          {
            t: "Decline: titles bought are titles mocked",
            r: "You stay where you are, with your pride and your purse intact.",
            fx: {honor:3},
          },
        ],
      },
      {
        id: "hs_n_cadet",
        cond: p=>AD(p)&&NOB(p)&&notHead(p)&&C.ageAdj(p)>=22&&(p.assets||[]).some(a=>["manor","castle","farm"].includes(a.k)),
        once: !0,
        title: "A branch of your own",
        setup: (p,ctx)=>{fill(p,ctx),ctx.diff=A.pick(["a border","a small star","a crescent","a silver ring"])},
        text: "With land of your own, you could found a cadet branch of {fam}: your own seat, your own heirs, the old arms with {diff} added for difference. {Head} has opinions about this.",
        choices: [
          {
            t: "Found the branch",
            r: (p,ctx)=>`The heralds record it. You are ${A.fullName(p)}, of a new line of an old house. Your children will grow up proud of both.`,
            fx: {fame:2,honor:1,flag:"hs_cadet",deed:"Founded a cadet branch of the house"},
          },
          {
            t: "Ask {head}'s blessing first",
            check: {s:"diplomacy",s2:"etiquette",d:42},
            win: {
              r: "The blessing is given at a family feast. The new branch begins in friendship, which is rare.",
              fx: {fame:2,honor:3,flag:"hs_cadet",rel:{who:"father",op:8}},
            },
            lose: {r:"{Head} refuses. Found it anyway, and there will be a quarrel for a generation.",fx:{happy:-3}},
          },
          {
            t: "Stay one house. Splitting weakens",
            r: "You keep the old arms and the old loyalty. The family is stronger for it, they say.",
            fx: {honor:2},
          },
        ],
      },
      {
        id: "hs_n_turncoat",
        cond: p=>AD(p)&&NOB(p)&&C.ageAdj(p)>=20,
        w: .6,
        cool: 15,
        title: "A different liege",
        setup: (p,ctx)=>{fill(p,ctx);const x=mkOther(p,otherHouse(p,null),{adj:45,status:"noble",occ:"an envoy of a greater lord"});ctx.pid=x.id,sexWords(ctx,x)},
        text: "{themFull} comes to {seat} with a soft voice and a heavy purse. {Fam} has served {lg} badly rewarded for long enough, {theyHe} says. Another lord would pay better, and protect better, if the house changed its allegiance.",
        choices: [
          {
            t: "Report the offer to {lg}",
            r: "Your loyalty is noted at court. The envoy leaves {seat} in a hurry, and you have made an enemy of a great lord.",
            fx: {favor:12,honor:3,them:{type:"enemy",op:-30}},
          },
          {
            t: "Listen, and keep talking",
            check: {s:"intrigue",s2:"deception",d:52},
            win: {
              r: "You learn a great deal and promise nothing. Both lords now think you might be theirs.",
              fx: X(p=>gain(p,sc(p,10)),{skill:{intrigue:3},honor:-2}),
            },
            lose: {
              r: "Word gets back to {lg} that you entertained the envoy. Explaining will take years.",
              fx: {favor:-15,flag:"hs_suspect"},
            },
          },
          {
            t: "Send {themHim} away with a hard word",
            r: '"{Fam} keeps its oaths." The envoy bows and goes. The words feel good in your mouth.',
            fx: {honor:3,them:{type:"rival",op:-15}},
          },
        ],
      },
      {
        id: "hs_n_estate_return",
        cond: p=>AD(p)&&NOB(p)&&C.soldier(p),
        cool: 10,
        title: "Home from the wars",
        setup: (p,ctx)=>{fill(p,ctx),kinPid(p,ctx,{adj:C.ageAdj(p)-A.ri(2,6)})},
        text: "You come home on leave to {seat}. In your absence your young {cz} {them} has been running the family estate, and running it very differently: new crops, new tenants, a new mill. The old servants are scandalized.",
        choices: [
          {
            t: "Praise {them} and let {themHim} carry on",
            r: "The new mill is turning a profit by autumn. {them} will remember who trusted {themHim}.",
            fx: {them:{type:"cousin",op:30},happy:3},
          },
          {
            t: "Put things back the old way",
            r: "The old servants cheer. {them} sulks. The new mill sits idle.",
            fx: {them:{type:"cousin",op:-15},honor:1},
          },
          {
            t: "Go over the accounts together",
            check: {s:"stewardship",s2:"int",d:44},
            win: {
              r: "Half the new ideas are good, half are not. Together you keep the best of both.",
              fx: {them:{type:"cousin",op:20},skill:{stewardship:3}},
            },
            lose: {
              r: "You cannot make head or tail of the new books. {them} explains, patiently, which is humiliating.",
              fx: {them:{type:"cousin",op:10},skill:{stewardship:1}},
            },
          },
        ],
      },
      {
        id: "hs_m_office",
        cond: p=>AD(p)&&C.famMil(p)&&!C.soldier(p)&&C.ageAdj(p)<32,
        cool: 10,
        title: "The family post",
        setup: (p,ctx)=>{fill(p,ctx);const m=milOf(p)||{};ctx.office=m.office||"the family command",ctx.unit=m.unit||"the family's men"},
        text: "For generations {fam} has held one office: {office}. The unit, {unit}, expects one of the {sur} blood among its officers. {Head} has arranged a place for you, if you will take it.",
        choices: [
          {
            t: "Take your place in the ranks",
            r: "You ride out to the muster with the family name on your shield. The old sergeants watch to see if you are worth it.",
            fx: p=>{if(!p.mil){const r=A.enlist(p,!1);if(r&&r.ok)return A.trainSkill(p,"command",2),"You take your place in the ranks."}return A.trainSkill(p,"command",2),""},
          },
          {
            t: "Ask to start as a common soldier, not an officer",
            r: "The family thinks you mad. The common soldiers respect you for it. You learn the trade from the mud up.",
            fx: p=>{if(!p.mil){const r=A.enlist(p,!1);if(r&&r.ok)return A.willGrow(p,1),A.trainSkill(p,"melee",2),""}return A.willGrow(p,.6),""},
          },
          {
            t: "Refuse: the family post is not for you",
            r: "Your name is crossed off the muster list. A cousin takes your place. The family will mention it at every feast.",
            fx: {rel:{who:"father",op:-12},honor:-2,flag:"hs_free_path"},
          },
        ],
      },
      {
        id: "hs_m_ties",
        cond: p=>AD(p)&&C.famMil(p),
        cool: 12,
        title: "The family's men",
        setup: (p,ctx)=>{fill(p,ctx);const m=milOf(p)||{};ctx.ties=end(m.ties||"Every captain in the realm wants the family's men in his line."),ctx.Ties="Everyone knows the soldiers of "+ctx.fam+". "+ctx.ties,ctx.unit=m.unit||"the family's men";const x=mkOther(p,"",{adj:50,status:"noble",occ:"a great captain"});ctx.pid=x.id,sexWords(ctx,x)},
        text: "{Ties} Now {themFull}, {themOcc}, wants {unit} for a campaign of {theirHis} own, and comes to you to put in a word with the family.",
        choices: [
          {
            t: "Speak for {themHim}",
            check: {s:"diplomacy",s2:"command",d:48},
            win: {
              r: "The family agrees. {them} owes you, and a captain's debt can open many doors.",
              fx: {them:{type:"friend",op:30},skill:{diplomacy:2},fame:1},
            },
            lose: {
              r: "The family refuses, and {them} thinks you promised more than you could deliver.",
              fx: {them:{type:"rival",op:-15}},
            },
          },
          {
            t: "Ask what is in it for the family",
            check: {s:"trade",s2:"intrigue",d:46},
            win: {
              r: "Pay, plunder rights and a promise of a knighthood for a cousin. A good bargain.",
              fx: X(p=>gain(p,sc(p,8)),{skill:{trade:1,intrigue:1}}),
            },
            lose: {r:"{them} calls you a huckster and goes over your head.",fx:{them:{type:"rival",op:-10}}},
          },
          {
            t: "Refuse: the family's men are not for hire",
            r: "The captain leaves. The family's men stay home, safe and restless.",
            fx: {honor:1},
          },
        ],
      },
      {
        id: "hs_m_banner",
        cond: p=>AD(p)&&C.famMil(p)&&C.soldier(p),
        cool: 12,
        title: "The old banner",
        setup: (p,ctx)=>{fill(p,ctx);const m=milOf(p)||{};ctx.unit=m.unit||"the family's company"},
        text: "The battered banner of {unit} has been carried by one of the {sur} blood in every fight for a hundred years. Its last bearer, your uncle, cannot lift his arm since the winter. It is offered to you.",
        choices: [
          {
            t: "Take it",
            r: "You carry it in the next muster. Men who would not follow you follow the banner, and the banner follows you.",
            fx: {honor:4,fame:2,merit:3,skill:{command:2}},
          },
          {
            t: "Give it to a braver cousin",
            r: "An honest choice, and the family respects it, mostly.",
            fx: {honor:1,wil:.5},
          },
          {
            t: "Have it mended first",
            r: "A seamstress in {town} works on it for a month. It comes back strong and old and a little too clean.",
            fx: X(p=>pay(p,sc(p,3)),{honor:2}),
          },
        ],
      },
      {
        id: "hs_m_rival_post",
        cond: p=>AD(p)&&C.famMil(p),
        cool: 12,
        title: "Someone wants the post",
        setup: (p,ctx)=>{fill(p,ctx),ctx.rv=rivalOf(p),ctx.Rv=A.cap(ctx.rv);const x=mkOther(p,ctx.rv,{adj:C.ageAdj(p)+A.ri(-2,6),status:"gentry",occ:"an ambitious officer"});ctx.pid=x.id,sexWords(ctx,x);const m=milOf(p)||{};ctx.office=m.office||"the family command"},
        text: "{themFull} of {rv} has been telling the generals that {fam} has held {office} too long and grown soft. {He} wants the post for {theirHis} own family, and {theyHe} has friends.",
        choices: [
          {
            t: "Prove the family's worth on the drill field",
            check: {s:"command",s2:"tactics",d:50},
            win: {
              r: "Your men outmarch, outshoot and outlast {theirHis}. The generals stop listening to {them}.",
              fx: {them:{type:"rival",op:-20},fame:2,skill:{command:2,tactics:2}},
            },
            lose: {
              r: "Your men are slower and sloppier. The generals take note.",
              fx: {them:{type:"rival",op:-15},happy:-5,flag:"hs_post_shaky"},
            },
          },
          {
            t: "Dig up dirt on {themHim}",
            check: {s:"intrigue",s2:"int",d:48},
            win: {
              r: "{them} has been selling army horses on the side. A word in the right ear, and {theyHe} is finished.",
              fx: {them:{type:"enemy",op:-40},skill:{intrigue:3}},
            },
            lose: {r:"You find nothing, and {them} learns you were looking.",fx:{them:{type:"enemy",op:-30},honor:-2}},
          },
          {
            t: "Challenge {themHim} to a duel",
            r: "Outside the walls, at dawn, as the law requires.",
            fx: {
              them: {type:"enemy",op:-40},
              duel: {
                foe: "them",
                opts: {kind:"duel",place:"outside the walls",lethal:!1,toYield:!0,title:"A duel for the post"},
              },
            },
          },
        ],
      },
      {
        id: "hs_m_father_shame",
        cond: p=>AD(p)&&C.famMil(p)&&C.soldier(p)&&C.ageAdj(p)<35,
        w: .6,
        once: !0,
        title: "Your father's name",
        setup: (p,ctx)=>{fill(p,ctx),ctx.where=A.pick(["lost the baggage train","gave the order that sent forty men into a bog","was drunk the night the camp was raided"])},
        text: "An old sergeant spits when he hears your name. Years ago one of the {sur} blood {where}, and the men of the unit have never forgotten. They are waiting to see if you are the same.",
        choices: [
          {
            t: "Prove them wrong, slowly",
            r: "You are first up, last to bed and never drunk. In a year the sergeant shares his pipe with you.",
            fx: {honor:3,wil:1.5,merit:3,skill:{command:1}},
          },
          {
            t: "Ask the sergeant what really happened",
            r: "The truth is more complicated, and sadder. You understand your family better, and the sergeant understands you.",
            fx: {int:.3,wil:.8,newRel:{type:"friend",op:20}},
          },
          {
            t: "Have the sergeant flogged for insolence",
            r: "He is flogged. The men obey you and hate you. The old shame is now a new one.",
            fx: {honor:-4,trait:"cruel",skill:{intimidation:2}},
          },
        ],
      },
      {
        id: "hs_mc_ledger",
        cond: ADK("merchant"),
        cool: 8,
        title: "The family ledger",
        setup: (p,ctx)=>{fill(p,ctx),kinPid(p,ctx,{adj:C.ageAdj(p)+A.ri(-2,10)}),ctx.sum=sc(p,20)},
        text: "You are trusted with the great ledger of {fam} for the first time. Late at night, by a stub of candle, you find it: a column that does not add up, {sum} suns gone over three years, always in the hand of your {cz} {them}.",
        choices: [
          {
            t: "Confront {them} alone",
            check: {s:"intimidation",s2:"trade",d:44},
            win: {
              r: "{them} confesses: a gambling debt, a man with a knife. {He} will pay it back, slowly, and owes you everything.",
              fx: {them:{type:"cousin",op:15},skill:{trade:2}},
            },
            lose: {
              r: '{them} laughs and says the column is "an old family arrangement". You are not sure {theyHe} is lying.',
              fx: {them:{type:"rival",op:-15}},
            },
          },
          {
            t: "Bring it to {head}",
            r: "{them} is sent to the family's worst post in a foreign port. You are trusted with the ledger for good.",
            fx: {them:{type:"enemy",op:-35},skill:{trade:2},honor:2,fame:1},
          },
          {
            t: "Balance it quietly from your own purse",
            r: "The column adds up now. Only you know why. It is the kind of secret that costs money every year.",
            fx: X((p,ctx)=>pay(p,ctx.sum/2),{them:{type:"cousin",op:10},wil:.5}),
          },
        ],
      },
      {
        id: "hs_mc_rival",
        cond: ADK("merchant"),
        cool: 7,
        title: "The rival house",
        setup: (p,ctx)=>{fill(p,ctx),ctx.rv=rivalOf(p),ctx.Rv=A.cap(ctx.rv),ctx.good=A.pick(["wool","wine","salt fish","pepper","timber","dyed cloth","grain"])},
        text: "{Rv} is selling {good} in {home} below cost. They mean to starve {fam} out of the market for a season, and then raise prices when you are gone. The family meets around the counting table.",
        choices: [
          {
            t: "Match their prices and outlast them",
            check: {s:"trade",s2:"wil",d:50},
            win: {
              r: "A lean year, but {rv} blinks first. Their factor is seen weeping in a tavern.",
              fx: X(p=>pay(p,sc(p,6)),{skill:{trade:3},fame:2,wil:.6}),
            },
            lose: {
              r: "You bleed money all year. In the end you split the market with them, on their terms.",
              fx: X(p=>pay(p,sc(p,15)),{happy:-5,wil:.8}),
            },
          },
          {
            t: "Buy up their supplier",
            check: {s:"trade",s2:"intrigue",d:52},
            win: {
              r: "Their {good} stops arriving. Their stalls are empty by midsummer.",
              fx: X(p=>pay(p,sc(p,8)),{skill:{trade:2,intrigue:2},fame:1}),
            },
            lose: {
              r: "They hear of it first and outbid you. Now they have the supplier and your plan.",
              fx: X(p=>pay(p,sc(p,4)),{happy:-4}),
            },
          },
          {
            t: "Sell elsewhere this year",
            r: "You load the carts for {town}. Smaller profits, no war.",
            fx: {skill:{trade:1},wil:.3},
          },
        ],
      },
      {
        id: "hs_mc_ship_lost",
        cond: ADK("merchant","sea"),
        cool: 10,
        title: "A ship lost",
        setup: (p,ctx)=>{fill(p,ctx),ctx.ship=A.pick(["the Good Hope","the Saint's Purse","the Grey Heron","the Three Sisters","the Lucky Bell"]),ctx.Ship=A.cap(ctx.ship),ctx.sum=sc(p,30)},
        text: "A sailor comes up from the harbor with his cap in his hands. {Ship}, carrying a fortune of {fam}'s cargo, went down off a rocky coast in the autumn gales. Three men lived. The cargo did not.",
        choices: [
          {
            t: "Pay the widows of the crew",
            r: "It is not the law. It is the right thing. Sailors will want to sail for {fam} for a generation.",
            fx: X((p,ctx)=>pay(p,ctx.sum/3),{honor:4,fame:1,wil:.6}),
          },
          {
            t: "Hire divers to try for the cargo",
            check: {s:"sea",s2:"command",d:52},
            win: {
              r: "The divers bring up half the chests before the sea turns. Half a fortune is still a fortune.",
              fx: X((p,ctx)=>gain(p,ctx.sum/2),{skill:{sea:2,command:1}}),
            },
            lose: {
              r: "A storm, an empty net and a drowned diver. The sea keeps what it takes.",
              fx: X(p=>pay(p,sc(p,4)),{happy:-6,wil:1}),
            },
          },
          {
            t: "Claim on the insurance",
            check: {s:"learning",s2:"persuasion",d:46},
            win: {
              r: "The insurers pay, grumbling. The house is wounded but standing.",
              fx: X((p,ctx)=>gain(p,ctx.sum/3),{skill:{learning:1,trade:1}}),
            },
            lose: {r:'The insurers find a clause about "acts of storm". They pay nothing.',fx:{happy:-6,wil:.8}},
          },
        ],
      },
      {
        id: "hs_mc_factor",
        cond: p=>ADK("merchant")(p)&&C.ageAdj(p)<35,
        once: !0,
        title: "Sent abroad as factor",
        setup: (p,ctx)=>{fill(p,ctx);const o=Object.values(A.S.realms).filter(r2=>r2.alive&&r2.id!==p.realm&&!r2.isRebel),r=o.length?A.pick(o):null;ctx.dest=r?r.capital||r.short:"a foreign port",ctx.dr=r?A.realmName(r.id):"abroad"},
        text: "{Fam} needs a factor in {dest}, in {dr}: someone of the blood to buy, sell, bribe and report, far from home, for years. {Head} looks around the table and stops at you.",
        choices: [
          {
            t: "Go, and make the family rich",
            check: {s:"trade",s2:"diplomacy",d:48},
            win: {
              r: "Three years in a foreign town. You learn the tongue, the prices and which officials take what. You come home with a fortune for the house.",
              fx: X(p=>gain(p,sc(p,30)),{skill:{trade:4,diplomacy:2},fame:2,int:.4}),
            },
            lose: {
              r: "Three years of being cheated by locals who saw you coming. You come home wiser and poorer.",
              fx: X(p=>pay(p,sc(p,6)),{skill:{trade:3},wil:1.2}),
            },
          },
          {
            t: "Go, and see the world",
            r: "You do the work well enough, and spend every spare day exploring. You come home a different person.",
            fx: {int:.6,skill:{trade:2,learning:1},happy:6},
          },
          {
            t: "Refuse: you will not leave home",
            r: "A cousin goes instead and comes back rich and full of airs. The family remembers who stayed.",
            fx: {rel:{who:"father",op:-8},happy:1},
          },
        ],
      },
      {
        id: "hs_mc_credit",
        cond: ADK("merchant"),
        cool: 12,
        title: "A forged letter of credit",
        setup: (p,ctx)=>{fill(p,ctx),ctx.sum=sc(p,25)},
        text: "A banker in {town} writes to ask why {fam} has not honored a letter of credit for {sum} suns, signed and sealed in the family's name. Nobody in the family wrote it. Someone has copied the family seal.",
        choices: [
          {
            t: "Track down the forger",
            check: {s:"intrigue",s2:"int",d:50},
            win: {
              r: "A sacked clerk with a good hand and a grudge. He is taken before the court, and the family's credit is safe.",
              fx: {skill:{intrigue:3},honor:2,fame:1},
            },
            lose: {
              r: "The trail goes cold in a sailors' tavern. The banker is unimpressed.",
              fx: {happy:-3,skill:{intrigue:1}},
            },
          },
          {
            t: "Honor it anyway, to protect the name",
            r: "You pay. The family's word stays good in every counting-house in {realmShort}. That is worth more than the money.",
            fx: X((p,ctx)=>pay(p,ctx.sum),{honor:4,fame:1}),
          },
          {
            t: "Refuse to pay, publicly",
            r: 'The banker swallows the loss. Other bankers hear the house is "difficult" and raise their rates.',
            fx: {honor:-1,skill:{trade:1}},
          },
        ],
      },
      {
        id: "hs_mc_council",
        cond: ADK("merchant","guild"),
        cool: 12,
        title: "A seat on the council",
        setup: (p,ctx)=>{fill(p,ctx),ctx.rv=rivalOf(p),ctx.Rv=A.cap(ctx.rv)},
        text: "A seat has fallen empty on the town council of {home}. {Fam} wants it; so does {rv}. The vote is by the great families and the guild masters, and every vote has a price.",
        choices: [
          {
            t: "Canvass honestly, door to door",
            check: {s:"persuasion",s2:"diplomacy",d:50},
            win: {
              r: "You win by two votes. One of the {sur} blood sits on the council of {home}, and the family is in your debt.",
              fx: {fame:3,honor:2,skill:{persuasion:2},flag:"hs_council"},
            },
            lose: {
              r: "{Rv} wins by three votes. You know exactly which three, and how much each cost.",
              fx: {happy:-5,skill:{persuasion:1}},
            },
          },
          {
            t: "Buy the votes you need",
            check: {s:"intrigue",s2:"trade",d:46},
            win: {
              r: "Expensive, but done. A seat on the council for the {sur} blood, and some debts that will be called in later.",
              fx: X(p=>pay(p,sc(p,20)),{fame:2,honor:-2,flag:"hs_council"}),
            },
            lose: {
              r: "Your bribes are found out. {Rv} wins in a landslide of outrage.",
              fx: X(p=>pay(p,sc(p,10)),{honor:-5,fame:-1}),
            },
          },
          {
            t: "Let a cousin stand instead",
            r: "Your cousin wins and spends years taking the credit for your advice. Still: family.",
            fx: {skill:{diplomacy:1},honor:1},
          },
        ],
      },
      {
        id: "hs_mc_snub",
        cond: ADK("merchant","guild"),
        cool: 10,
        title: "Money, not blood",
        setup: (p,ctx)=>{fill(p,ctx);const x=mkOther(p,otherHouse(p,null),{adj:C.ageAdj(p)+A.ri(0,15),status:"noble",occ:"a lord of an old house"});ctx.pid=x.id,sexWords(ctx,x)},
        text: 'At a feast in {town}, {themFull}, {themOcc}, asks the steward loudly why "shopkeepers" are being seated at the same table. Everyone at the table knows {theirHis} house owes {fam} more than the hall is worth.',
        choices: [
          {
            t: "Mention the debt, sweetly",
            check: {s:"persuasion",s2:"intrigue",d:46},
            win: {
              r: "The table goes very quiet. {them} leaves before the fish course. Nobody calls {fam} shopkeepers again that night.",
              fx: {them:{type:"enemy",op:-30},fame:2,happy:6},
            },
            lose: {
              r: "Mentioning money at a feast is the one thing worse than being a shopkeeper. The table turns on you.",
              fx: {them:{type:"rival",op:-15},happy:-5},
            },
          },
          {
            t: "Smile and say nothing",
            r: "You eat your fish. Next week, {theirHis} steward asks for a loan and finds the rate has gone up.",
            fx: X(p=>gain(p,sc(p,4)),{wil:.5,them:{type:"rival",op:-10}}),
          },
          {
            t: "Make {themHim} laugh, and win {themHim} over",
            check: {s:"diplomacy",s2:"int",d:50},
            win: {
              r: "By the sweets, {them} is telling you about {theirHis} terrible hunting dogs. A friend in an old house.",
              fx: {them:{type:"friend",op:25},skill:{diplomacy:2}},
            },
            lose: {
              r: "Your joke is a little too clever. {them} pretends not to hear.",
              fx: {them:{type:"acquaint",op:-5}},
            },
          },
        ],
      },
      {
        id: "hs_mc_caravan",
        cond: ADK("merchant"),
        cool: 8,
        title: "The family caravan",
        setup: (p,ctx)=>{fill(p,ctx),ctx.road=A.pick(["the high pass","the forest road","the long dry road","the river track"])},
        text: "The family's caravan, forty mules and everything {fam} owns that can be sold, leaves for {town} by {road}. There have been bandits. {Head} wants someone of the {sur} blood riding with it.",
        choices: [
          {
            t: "Ride with the guards",
            r: "On the third night, men come out of the dark.",
            fx: {
              duel: {
                tier: 2,
                title: "a bandit",
                opts: {kind:"duel",place:"the caravan camp",lethal:!0,toYield:!1,title:"Bandits at night"},
              },
              skill: {riding:1},
            },
          },
          {
            t: "Hire better guards, at your own cost",
            r: "Six hard men with crossbows. Nobody troubles the caravan. Good guards are the cheapest kind of luck.",
            fx: X(p=>pay(p,sc(p,6)),{skill:{trade:1,command:1}}),
          },
          {
            t: "Take a longer, safer road",
            check: {s:"survival",s2:"logistics",d:44},
            win: {
              r: "Ten days longer, no trouble, and better prices in a town nobody else bothered to reach.",
              fx: X(p=>gain(p,sc(p,5)),{skill:{logistics:2,survival:1}}),
            },
            lose: {
              r: "The longer road floods. The mules and the profit drown in the same river.",
              fx: X(p=>pay(p,sc(p,6)),{happy:-4,wil:.6}),
            },
          },
        ],
      },
      {
        id: "hs_mc_customs",
        cond: ADK("merchant","sea"),
        cool: 8,
        title: "The toll-reeve",
        setup: (p,ctx)=>{fill(p,ctx);const x=mkOther(p,"",{adj:45,status:"gentry",occ:"the toll-reeve"});ctx.pid=x.id,sexWords(ctx,x),ctx.sum=sc(p,6)},
        text: `{themFull}, {themOcc} at the river gate, has stopped the family's barges for "inspection". It will take weeks, {theyHe} says. Unless, of course, {fam} would like to show its gratitude now: {sum} suns.`,
        choices: [
          {
            t: "Pay. It is the cost of trade",
            r: "The barges move by noon. {them} smiles and will expect the same next time.",
            fx: X((p,ctx)=>pay(p,ctx.sum),{them:{type:"acquaint",op:10}}),
          },
          {
            t: "Report {themHim} to the reeve's master",
            check: {s:"persuasion",s2:"learning",d:50},
            win: {
              r: "{them} is dismissed. The new reeve is honest, and slower.",
              fx: {honor:3,them:{type:"enemy",op:-30}},
            },
            lose: {
              r: "The master is {theirHis} brother-in-law. Your barges wait three weeks.",
              fx: X(p=>pay(p,sc(p,4)),{them:{type:"enemy",op:-25},happy:-3}),
            },
          },
          {
            t: "Get the barges past by night",
            check: {s:"stealth",s2:"sea",d:50},
            win: {
              r: "Muffled oars, no lanterns. You are past the gate before the watch changes.",
              fx: {skill:{stealth:2,sea:1},happy:4},
            },
            lose: {r:"Caught. Smuggling is a crime even for a good family.",fx:{punish:"smuggling"}},
          },
        ],
      },
      {
        id: "hs_mc_heir",
        cond: p=>ADK("merchant","guild")(p)&&C.famHead(p)&&kidsOf(p).some(c=>A.isAdult(c)),
        cool: 12,
        title: "Who gets the counting-house",
        setup: (p,ctx)=>{fill(p,ctx);const k=kidsOf(p).filter(c2=>A.isAdult(c2)),c=A.pick(k);ctx.pid=c.id,sexWords(ctx,c)},
        text: "You are not young. Someone must learn to run the family business, and the family is watching who you choose. Your {sd} {them} is clever but careless. The others are careful but dull.",
        choices: [
          {
            t: "Choose {them}",
            r: "{them} takes the keys with shining eyes. The family mutters. Cleverness can be taught care; dullness cannot be taught wit.",
            fx: {them:{op:25},flag:"hs_heir_named"},
          },
          {
            t: "Choose the most careful child",
            r: "Safe hands for the business. {them} sulks, and then leaves for {town} to start something of {theirHis} own.",
            fx: {them:{op:-15},honor:1,flag:"hs_heir_named"},
          },
          {
            t: "Make them share it",
            check: {s:"stewardship",s2:"diplomacy",d:48},
            win: {
              r: "The children run it together, quarrelling and thriving.",
              fx: {them:{op:10},skill:{stewardship:2},flag:"hs_heir_named"},
            },
            lose: {
              r: "Within a year they are suing each other. The business suffers.",
              fx: X(p=>pay(p,sc(p,10)),{happy:-6}),
            },
          },
        ],
      },
      {
        id: "hs_mc_bankrupt",
        cond: ADK("merchant","guild","sea"),
        w: .7,
        cool: 15,
        title: "A cousin goes bust",
        setup: (p,ctx)=>{fill(p,ctx),kinPid(p,ctx),ctx.sum=sc(p,20)},
        text: "Your {cz} {them} has gone bankrupt in {town}, owing {sum} suns. Because {theyHe} traded under the family name, the creditors are coming to {fam}. If nobody pays, the family's credit will be ruined in every market.",
        choices: [
          {
            t: "Pay the debts and save the name",
            r: "The name is saved. {them} is grateful and ashamed, and works for you for nothing for two years.",
            fx: X((p,ctx)=>pay(p,ctx.sum),{them:{type:"cousin",op:30},honor:3}),
          },
          {
            t: "Negotiate with the creditors",
            check: {s:"trade",s2:"persuasion",d:50},
            win: {
              r: "Half the debt, paid over three years. The creditors take it gladly. The name survives.",
              fx: X((p,ctx)=>pay(p,ctx.sum/3),{skill:{trade:3}}),
            },
            lose: {
              r: "The creditors smell weakness and demand everything.",
              fx: X((p,ctx)=>pay(p,ctx.sum*.8),{happy:-4}),
            },
          },
          {
            t: "Disown {them} publicly",
            r: "The creditors are told {them} is no longer family. Legally clean. In {town} they call {fam} cold.",
            fx: {them:{type:"enemy",op:-40},honor:-2},
          },
        ],
      },
      {
        id: "hs_mc_k_counting",
        cond: KIDK("merchant"),
        cool: 6,
        title: "The counting board",
        setup: (p,ctx)=>{fill(p,ctx)},
        text: "Every afternoon you sit at the counting board of {fam}, moving beads and copper counters while a clerk calls out sums: bales, barrels, pennies, shillings. If you get it wrong, you start again.",
        choices: [
          {
            t: "Get faster than the clerk",
            check: {s:"int",s2:"trade",d:22},
            win: {
              r: "By winter you are faster than the clerk, and he is not happy about it. Your grandfather slips you a silver penny.",
              fx: {skill:{trade:3},int:.4,happy:3},
            },
            lose: {r:"The beads swim before your eyes. You start again. And again.",fx:{skill:{trade:1},wil:.5}},
          },
          {
            t: "Make up a game with the counters",
            r: "Your counting game spreads to all the clerks' children. It is not on the lesson plan.",
            fx: {skill:{trade:1,gambling:1},happy:4},
          },
          {
            t: "Listen to the traders instead",
            r: "The traders who come in talk about ports and prices and pirates. You learn more than sums.",
            fx: {int:.3,skill:{trade:1}},
          },
        ],
      },
      {
        id: "hs_mc_title",
        cond: p=>ADK("merchant")(p)&&p.coin>sc(p,60),
        w: .6,
        cool: 20,
        title: "A name to go with the money",
        setup: (p,ctx)=>{fill(p,ctx),ctx.fee=sc(p,60)},
        text: "A poor noble widow offers to sell {fam} a tumbledown manor that comes with a knight's right to bear arms. Money becomes blood in two generations, they say. The price is {fee} suns.",
        choices: [
          {
            t: "Buy it",
            r: "A ruined hall, a field of thistles and a coat of arms. Your grandchildren will be gentry. Your aunts are already insufferable about it.",
            fx: (p,ctx)=>(pay(p,ctx.fee),p.assets.some(a=>a.k==="manor")||p.assets.push({k:"manor",name:GD.PROPERTY.manor.name,y:A.S.year}),A.fame(p,2),""),
          },
          {
            t: "Haggle hard",
            check: {s:"trade",s2:"persuasion",d:50},
            win: {
              r: "Half the price. The widow cries. You throw in a pension, which helps you sleep.",
              fx: (p,ctx)=>(pay(p,ctx.fee*.6),p.assets.some(a=>a.k==="manor")||p.assets.push({k:"manor",name:GD.PROPERTY.manor.name,y:A.S.year}),""),
            },
            lose: {r:"The widow sells to someone with better manners.",fx:{happy:-2}},
          },
          {
            t: "Keep the money. Money is enough",
            r: "You stay a merchant, rich and plain. Let the nobles borrow from you.",
            fx: {honor:1,wil:.3},
          },
        ],
      },
      {
        id: "hs_g_chair",
        cond: ADK("guild"),
        cool: 10,
        title: "The master's chair",
        setup: (p,ctx)=>{fill(p,ctx),ctx.rv=rivalOf(p),ctx.Rv=A.cap(ctx.rv)},
        text: "The guild of {home} chooses a new warden at its feast. For three generations the chair has belonged to the {sur} blood. This year {rv} has been buying drinks for every master in town.",
        choices: [
          {
            t: "Make your speech at the feast",
            check: {s:"persuasion",s2:"craft",d:50},
            win: {
              r: "You talk about quality, the old ways and the guild's honor, and you show them your best piece. The chair stays in the family.",
              fx: {fame:2,honor:2,skill:{persuasion:2},flag:"hs_warden"},
            },
            lose: {
              r: "Your speech is good. Their drinks were better. The chair leaves the family for the first time in ninety years.",
              fx: {happy:-6,wil:.8},
            },
          },
          {
            t: "Buy more drinks than they did",
            r: "The guild hall drinks itself stupid on your money. You win, narrowly, and everyone has a headache.",
            fx: X(p=>pay(p,sc(p,8)),{fame:1,flag:"hs_warden"}),
          },
          {
            t: "Back the best craftsman, even if not family",
            r: "A stranger gets the chair. The guild respects you more than ever. The family is furious.",
            fx: {honor:4,rel:{who:"father",op:-8}},
          },
        ],
      },
      {
        id: "hs_g_charter",
        cond: ADK("guild"),
        cool: 14,
        title: "The charter",
        setup: (p,ctx)=>{fill(p,ctx)},
        text: "The guild's charter, the paper that gives the masters the sole right to work their craft in {home}, is being challenged. The town council wants to let in outside craftsmen, cheaper ones. {Fam} has the most to lose.",
        choices: [
          {
            t: "Argue for the charter before the council",
            check: {s:"persuasion",s2:"learning",d:50},
            win: {
              r: "You show them the old seal and the old promises. The charter stands, for now.",
              fx: {fame:2,honor:2,skill:{learning:2}},
            },
            lose: {
              r: "The council opens the town to outsiders. Prices fall, and so does the family's income.",
              fx: X(p=>pay(p,sc(p,8)),{happy:-4}),
            },
          },
          {
            t: "Offer the council a deal: lower prices, keep the charter",
            check: {s:"diplomacy",s2:"trade",d:46},
            win: {
              r: "A compromise. The masters grumble at the prices but keep their monopoly.",
              fx: {skill:{diplomacy:2,trade:1},fame:1},
            },
            lose: {
              r: "The masters say you betrayed them. The council takes the deal and wants more.",
              fx: {happy:-4,honor:-1},
            },
          },
          {
            t: "Hire the outsiders yourself",
            r: "If you cannot beat them, employ them. The family's workshop doubles. The guild calls you a traitor.",
            fx: X(p=>gain(p,sc(p,10)),{honor:-3,skill:{trade:2}}),
          },
        ],
      },
      {
        id: "hs_g_apprentice",
        cond: ADK("guild"),
        cool: 8,
        title: "The apprentice",
        setup: (p,ctx)=>{fill(p,ctx);const x=mkOther(p,"",{adj:13,status:"peasant",occ:"an apprentice in the family workshop"});ctx.pid=x.id,sexWords(ctx,x)},
        text: "{them}, {themAge}, is bound to the family workshop for seven years: food, a bed in the attic, and blows. Tonight {theyHe} has run away, after your cousin beat {themHim} for spoiling a piece. {His} parents will want to know why.",
        choices: [
          {
            t: "Go after {themHim} and bring {themHim} back gently",
            check: {s:"tracking",s2:"persuasion",d:40},
            win: {
              r: "You find {them} at the crossroads, crying. You promise no more beatings. You keep the promise. {He} becomes the best hand in the shop.",
              fx: {them:{type:"student",op:35,back:"mentor"},honor:2},
            },
            lose: {
              r: "{them} is gone, and the guild fines the family for losing an apprentice.",
              fx: X(p=>pay(p,sc(p,3)),{happy:-3}),
            },
          },
          {
            t: "Take your cousin to task",
            r: "Your cousin does not like it. The other apprentices do. Something changes in the workshop.",
            fx: {honor:2,newRel:{type:"rival",op:-15}},
          },
          {
            t: "Let the guild deal with it",
            r: "The guild drags {them} back and binds {themHim} again. {He} never looks you in the eye.",
            fx: {them:{type:"acquaint",op:-15}},
          },
        ],
      },
      {
        id: "hs_g_secret",
        cond: ADK("guild"),
        cool: 12,
        title: "Secrets of the craft",
        setup: (p,ctx)=>{fill(p,ctx),ctx.what=A.pick(["the family's glaze","the way the family tempers its steel","the family's blue dye","the old ratio of tin to copper","how the family seasons its timber"]),ctx.sum=sc(p,40);const x=mkOther(p,"",{adj:45,status:"merchant",occ:"a foreign buyer"});ctx.pid=x.id,sexWords(ctx,x)},
        text: "Every guild family has one secret it teaches only its own children. Yours is {what}. {themFull}, {themOcc} with soft hands and a fat purse, offers you {sum} suns to write it down. Leaking a craft secret is treason to the guild.",
        choices: [
          {
            t: "Refuse",
            r: "The buyer bows and leaves. You lock the workshop that night and check the windows twice.",
            fx: {honor:3,them:{type:"acquaint",op:-10}},
          },
          {
            t: "Sell a false recipe",
            check: {s:"deception",s2:"craft",d:48},
            win: {
              r: "He pays, goes home, and ruins a year's work with your recipe. You keep the money and the secret.",
              fx: X((p,ctx)=>gain(p,ctx.sum/2),{skill:{deception:2},them:{type:"enemy",op:-20}}),
            },
            lose: {
              r: "He tests the recipe in front of you. It fails. He leaves, promising to tell the guild you tried to sell something.",
              fx: {honor:-3,them:{type:"enemy",op:-30}},
            },
          },
          {
            t: "Sell it",
            r: "You take the money. Somewhere far away, a workshop begins making something exactly like yours. The family must never know.",
            fx: X((p,ctx)=>gain(p,ctx.sum),{honor:-8,flag:"hs_sold_secret"}),
          },
        ],
      },
      {
        id: "hs_g_masterpiece",
        cond: p=>ADK("guild")(p)&&C.ageAdj(p)<35,
        once: !0,
        title: "The masterpiece",
        setup: (p,ctx)=>{fill(p,ctx),ctx.fee=sc(p,15)},
        text: "To become a master and take your place in the family workshop, you must show the guild wardens a finished piece of your own and pay the entry fee of {fee} suns, then give a feast. Every {sur} before you passed. The wardens know that, and they will look harder.",
        choices: [
          {
            t: "Make the best thing you have ever made",
            check: {s:"craft",s2:"int",d:52},
            win: {
              r: "The wardens pass it around in silence. Then the oldest one nods. You are a master of the guild.",
              fx: X((p,ctx)=>pay(p,ctx.fee),{skill:{craft:4},fame:2,honor:2,flag:"hs_master"}),
            },
            lose: {
              r: "A tiny flaw, and they find it. Another year as a journeyman.",
              fx: {skill:{craft:2},happy:-6,wil:1},
            },
          },
          {
            t: 'Ask your father to "help a little"',
            r: "The piece is perfect. The wardens look at your father's hands, then at yours. They pass you. They will never quite believe it.",
            fx: X((p,ctx)=>pay(p,ctx.fee),{honor:-3,flag:"hs_master"}),
          },
          {
            t: "Make something new, not the family style",
            check: {s:"craft",s2:"wil",d:56},
            win: {
              r: "The wardens argue for an hour. In the end they pass it, and the family style changes forever.",
              fx: X((p,ctx)=>pay(p,ctx.fee),{skill:{craft:5},fame:3,flag:"hs_master"}),
            },
            lose: {
              r: "The wardens call it a mess. Your father calls it worse.",
              fx: {happy:-6,rel:{who:"father",op:-8},wil:1},
            },
          },
        ],
      },
      {
        id: "hs_g_widow",
        cond: ADK("guild"),
        cool: 15,
        title: "The widow's shop",
        setup: (p,ctx)=>{fill(p,ctx),kinPid(p,ctx,{sex:"F",adj:C.ageAdj(p)+A.ri(5,15)})},
        text: `Your {cz} {them} has lost her husband, a master of the guild. By custom a master's widow keeps the shop, but some of the masters want to "help" her by taking it over. {He} has come to {fam} for support.`,
        choices: [
          {
            t: "Stand with her at the guild",
            check: {s:"persuasion",s2:"learning",d:46},
            win: {
              r: "You recite the custom word for word. {them} keeps the shop and her dignity.",
              fx: {them:{type:"cousin",op:35},honor:3},
            },
            lose: {
              r: "The masters find a technicality. {them} loses the shop and moves in with the family.",
              fx: {them:{type:"cousin",op:15},happy:-4},
            },
          },
          {
            t: "Send your best journeyman to help her",
            r: "The shop keeps working, and the masters cannot say it is failing.",
            fx: X(p=>pay(p,sc(p,4)),{them:{type:"cousin",op:25},honor:2}),
          },
          {
            t: "Advise her to sell",
            r: "She sells, and does not forgive you for saying it first.",
            fx: {them:{type:"cousin",op:-15}},
          },
        ],
      },
      {
        id: "hs_g_apprenticed",
        cond: p=>TEEN(p)&&C.famKind(p,"guild"),
        once: !0,
        title: "Bound to the craft",
        setup: (p,ctx)=>{fill(p,ctx),ctx.master=A.givenName(p.cult,"M")},
        text: "At your age every child of {fam} is bound to the craft for seven years. Your father will not teach you himself; family is too soft. You are sent to Master {master}, across the street, who is known for his skill and his temper.",
        choices: [
          {
            t: "Work harder than any apprentice ever",
            check: {s:"wil",s2:"craft",d:28},
            win: {
              r: "The master curses everyone but you. That is the highest praise he has.",
              fx: {skill:{craft:4},wil:.8,newRel:{type:"mentor",op:30,back:"student"}},
            },
            lose: {
              r: "You get as many blows as anyone, and a few more. But your hands learn.",
              fx: {skill:{craft:2},wil:1,health:-2},
            },
          },
          {
            t: "Steal the master's tricks",
            check: {s:"stealth",s2:"int",d:28},
            win: {
              r: "You watch at night through a crack in the wall. In a year you know things your own father does not.",
              fx: {skill:{craft:3,stealth:1},int:.3},
            },
            lose: {r:"Caught at the crack. A beating, and a lecture about trust.",fx:{health:-3,happy:-4}},
          },
          {
            t: "Make friends with the other apprentices",
            r: "The attic is cold but the company is good. You learn the craft, and the town's every secret.",
            fx: {skill:{craft:2},newRel:{type:"friend",op:30},happy:3},
          },
        ],
      },
      {
        id: "hs_g_fine",
        cond: ADK("guild"),
        cool: 8,
        title: "The wardens' visit",
        setup: (p,ctx)=>{fill(p,ctx),ctx.fee=sc(p,5)},
        text: "The guild wardens come to the family workshop for their inspection. They find a piece that is not up to standard, made by a cousin. By guild law it is broken in the street, and the family fined {fee} suns. The whole street comes out to watch.",
        choices: [
          {
            t: "Pay and accept it with dignity",
            r: "The fine is paid. Your bearing is noted. The street goes back indoors.",
            fx: X((p,ctx)=>pay(p,ctx.fee),{honor:2,wil:.4}),
          },
          {
            t: "Argue the piece is sound",
            check: {s:"craft",s2:"persuasion",d:46},
            win: {
              r: "You show them it is better than it looks. The wardens back down, grumbling.",
              fx: {skill:{craft:1,persuasion:1},fame:1},
            },
            lose: {r:"The wardens double the fine for arguing.",fx:(p,ctx)=>{pay(p,ctx.fee*2),A.willGrow(p,.4)}},
          },
          {
            t: "Take the cousin in hand",
            r: "A month of making the same piece over and over, until it is perfect. The cousin hates you, and improves.",
            fx: {skill:{craft:2},newRel:{type:"rival",op:-10}},
          },
        ],
      },
      {
        id: "hs_g_journeyman",
        cond: p=>ADK("guild")(p)&&C.ageAdj(p)<28&&!C.flag(p,"hs_master"),
        once: !0,
        title: "The journeyman years",
        setup: (p,ctx)=>{fill(p,ctx),ctx.dest=A.pick(["the great workshops of {capital}","the dwarf holds, if they will have you","the foreign fairs across the border","the coastal towns"]),ctx.dest=rs(p,ctx,ctx.dest)},
        text: "A journeyman of {fam} should take to the road for a while: work for wages, learn from other masters, see how they do things in other towns. The family says {dest}.",
        choices: [
          {
            t: "Take to the road",
            r: "Three years of strange beds and strange workshops. You come home with new tricks and old friends in many towns.",
            fx: {skill:{craft:4,trade:1},int:.4,sta:.4,happy:4},
          },
          {
            t: "Stay home and work for the family",
            r: "You stay. You get very good at the family way of doing things, and no other.",
            fx: {skill:{craft:3},rel:{who:"father",op:5}},
          },
          {
            t: "Go somewhere nobody suggested",
            check: {s:"survival",s2:"wil",d:42},
            win: {
              r: "You end up far off the family map and learn a craft trick nobody at home has seen.",
              fx: {skill:{craft:3,survival:1},apt:{craft:1.25},wil:.6},
            },
            lose: {
              r: "You are robbed on the road and come home with nothing but a story and a limp.",
              fx: {wound:"bad_knee",wil:1},
            },
          },
        ],
      },
      {
        id: "hs_g_flaw",
        cond: ADK("guild","sea","scholar"),
        w: .7,
        cool: 20,
        title: "The hidden flaw",
        setup: (p,ctx)=>{fill(p,ctx),ctx.work=KT(p,{guild:"the family's most famous piece of work",sea:"the ship the family built for the lord",scholar:"the family's famous treatise",def:"the family's most famous work"})},
        text: "You find out what only a few in the family know: {work} has a hidden flaw. One day it will fail, perhaps in front of everyone, perhaps killing someone. Fixing it means admitting it.",
        choices: [
          {
            t: "Tell the truth and fix it",
            r: "The family is shamed for a season. Nobody dies. In the long run, people trust {fam} more.",
            fx: X(p=>pay(p,sc(p,10)),{honor:5,fame:-1,wil:.8}),
          },
          {
            t: "Fix it quietly, at night",
            check: {s:"craft",s2:"stealth",d:52},
            win: {
              r: "Weeks of secret work. The flaw is gone and nobody ever knew.",
              fx: {skill:{craft:3,stealth:1},happy:4},
            },
            lose: {r:"Caught at night with tools. Now everyone asks what you were hiding.",fx:{honor:-3,happy:-4}},
          },
          {
            t: "Keep the secret, like everyone before you",
            r: "You put it out of your mind, mostly. Some nights it sits on your chest like a cat.",
            fx: {honor:-2,flag:"hs_knows_secret"},
          },
        ],
      },
      {
        id: "hs_g_k_shop",
        cond: KIDK("guild"),
        cool: 5,
        title: "Underfoot in the workshop",
        setup: (p,ctx)=>{fill(p,ctx)},
        text: "You grow up underfoot in the family workshop, among shavings and sparks and swearing. The journeymen let you hold things. Today one of them lets you try.",
        choices: [
          {
            t: "Try, very carefully",
            check: {s:"craft",s2:"int",d:18},
            win: {r:"Not bad. Not bad at all. The journeyman calls the others to look.",fx:{skill:{craft:3},happy:4}},
            lose: {
              r: "You ruin a morning's work and burn your thumb. The journeyman laughs and lets you try again.",
              fx: {skill:{craft:1},wound:"burn",wil:.3},
            },
          },
          {
            t: "Sweep up and watch the master's hands",
            r: "You learn more by watching than anyone guesses.",
            fx: {skill:{craft:2},int:.2},
          },
          {t:"Run off to play",r:"The street is more fun than the shop. For now.",fx:{happy:3}},
        ],
      },
      {
        id: "hs_c_vocation",
        cond: p=>(AD(p)||TEEN(p))&&C.famKind(p,"clergy")&&!C.job(p,"clergy")&&C.ageAdj(p)<30,
        once: !0,
        title: "One for the gods",
        setup: (p,ctx)=>{fill(p,ctx)},
        text: "In {fam}, every generation gives one child to the service of {god}. It has been so since before the family had a name. This generation, the family has chosen you. The robes are already cut to your size.",
        choices: [
          {
            t: "Accept the calling",
            r: "You kneel, the elders lay their hands on you, and a new life begins. The family weeps with pride.",
            fx: p=>(A.isAdult(p)&&(p.job={c:"clergy",r:0,y:0,perf:60}),p.piety=A.clamp(p.piety+10,0,100),A.trainSkill(p,"faith",3),p.literate=!0,""),
          },
          {
            t: "Ask for a year to be sure",
            check: {s:"persuasion",s2:"faith",d:30},
            win: {
              r: "A year is granted. You spend it in prayer, in taverns, and in long walks. At the end you know your answer.",
              fx: {piety:3,wil:.6,int:.3},
            },
            lose: {
              r: '"The gods do not wait on your convenience." The robes are put on you anyway.',
              fx: p=>(A.isAdult(p)&&(p.job={c:"clergy",r:0,y:0,perf:50}),p.happy=A.clamp(p.happy-5,0,100),A.trainSkill(p,"faith",2),""),
            },
          },
          {
            t: "Refuse: let a cousin go",
            r: "Your cousin takes the robes and the family's honor with them. You keep your freedom and their silence.",
            fx: {happy:2,piety:-3,rel:{who:"father",op:-10},flag:"hs_free_path"},
          },
        ],
      },
      {
        id: "hs_c_living",
        cond: ADK("clergy"),
        cool: 12,
        title: "The family living",
        setup: (p,ctx)=>{fill(p,ctx);const x=mkOther(p,"",{adj:C.ageAdj(p)+A.ri(-6,2),status:"gentry",occ:"a young priest with powerful friends"});ctx.pid=x.id,sexWords(ctx,x)},
        text: "For a hundred years {fam} has held the right to name the priest of the temple at {seat}. The office comes with land, tithes and the family's place in the parish. Now the bishop wants it for {themFull}, {themOcc}.",
        choices: [
          {
            t: "Defend the family right before the bishop",
            check: {s:"learning",s2:"faith",d:50},
            win: {
              r: "You bring the old deeds and the old prayers. The bishop sighs and gives way.",
              fx: {honor:3,piety:2,them:{type:"rival",op:-20}},
            },
            lose: {
              r: "The bishop rules that the right lapsed a generation ago. {them} moves into the family's parish house.",
              fx: {happy:-6,them:{type:"rival",op:-20}},
            },
          },
          {
            t: "Share it: {them} preaches, the family keeps the land",
            check: {s:"diplomacy",s2:"trade",d:44},
            win: {
              r: "An awkward bargain that works. {them} turns out to be rather good at sermons.",
              fx: {them:{type:"acquaint",op:15},skill:{diplomacy:2}},
            },
            lose: {r:"Both sides hate the bargain. The bishop takes everything.",fx:{happy:-4}},
          },
          {
            t: "Make a large gift to the bishop's cathedral",
            r: 'The gift is accepted. The family right is confirmed, "for its piety".',
            fx: X(p=>pay(p,sc(p,15)),{piety:2}),
          },
        ],
      },
      {
        id: "hs_c_relic",
        cond: ADK("clergy"),
        w: .8,
        cool: 15,
        title: "The family relic",
        setup: (p,ctx)=>{fill(p,ctx),ctx.relic=A.pick(["a finger bone of a saint","a scrap of a holy banner","a cup a prophet drank from","a stone from the first altar"])},
        text: "{Fam} keeps {relic} in a silver box at {seat}, and pilgrims pay to touch it. While cleaning it, you notice the silver box is older than the thing inside it. Much older.",
        choices: [
          {
            t: "Say nothing. Faith heals, whatever the bone",
            r: "The pilgrims keep coming, and some of them go home well. You decide that is enough.",
            fx: {piety:1,wil:.5,flag:"hs_knows_secret"},
          },
          {
            t: "Tell {head}",
            r: p=>A.chance(.5)?'A long silence. "My grandmother swapped it after the fire. Now you know. Now you keep it."':"{Head} goes white. The family argues about it for a month, and then decides to say nothing.",
            fx: {flag:"hs_knows_secret",int:.2},
          },
          {
            t: "Tell the bishop, and let the truth out",
            r: "The relic is removed. The pilgrims stop. The family is poorer and honest, and half of them blame you.",
            fx: {honor:4,piety:2,rel:{who:"father",op:-10}},
          },
        ],
      },
      {
        id: "hs_c_doubt",
        cond: p=>ADK("clergy")(p)&&C.ageAdj(p)>=20,
        cool: 15,
        title: "A crack in the faith",
        setup: (p,ctx)=>{fill(p,ctx),ctx.why=A.pick(["a child died that every prayer should have saved","you read an old book that says the rites were different once","a good man of another faith was kinder than any priest you know","the family's holiest elder turned out to be a thief"])},
        text: "You were born into {fam}, a family that has served {god} for generations. But this year {why}, and now when you say the old words, they sound hollow.",
        choices: [
          {
            t: "Pray through it",
            check: {s:"faith",s2:"wil",d:46},
            win: {
              r: "It takes a long winter, but the faith comes back. Different. Deeper.",
              fx: {piety:6,wil:1.5,skill:{faith:2}},
            },
            lose: {
              r: "The prayers stay hollow. You keep saying them. It is lonely work.",
              fx: {piety:-3,wil:1.2,happy:-4},
            },
          },
          {
            t: "Talk to the family's eldest priest",
            r: 'The old one listens, then laughs gently. "Child, every one of us has stood where you stand. Some of us still do."',
            fx: {piety:2,wil:.8,newRel:{type:"mentor",op:30,back:"student"}},
          },
          {
            t: "Admit it and walk away from the robes",
            r: "The family is shocked, then cold. You are free, and you do not know what to do with it.",
            fx: {piety:-8,happy:-3,trait:"cynical",flag:"hs_free_path"},
          },
        ],
      },
      {
        id: "hs_c_heretic",
        cond: ADK("clergy"),
        w: .7,
        cool: 15,
        title: "A heretic in the family",
        setup: (p,ctx)=>{fill(p,ctx),kinPid(p,ctx),ctx.idea=A.pick(["the year count is wrong","the priests have hidden the true rites","the gods do not need temples","the old prophecies were forged"])},
        text: "Your {cz} {them} has been preaching in the back rooms of {town} that {idea}. For any family it would be dangerous. For {fam}, a family of priests, it could end everything.",
        choices: [
          {
            t: "Warn {themHim} to stop",
            check: {s:"persuasion",s2:"faith",d:48},
            win: {
              r: "{them} goes quiet, for the family's sake. You hope it lasts.",
              fx: {them:{type:"cousin",op:15},honor:1},
            },
            lose: {r:"{them} calls you a coward and preaches louder.",fx:{them:{type:"cousin",op:-15},happy:-3}},
          },
          {
            t: "Hide {themHim} before the temple court hears",
            r: "You get {them} out of {town} to a farm in the hills. If anyone finds out, you will stand beside {themHim}.",
            fx: {them:{type:"cousin",op:35},honor:2,flag:"hs_hid_heretic"},
          },
          {
            t: "Report {themHim} to the temple court",
            r: "The family is saved. {them} is taken. The family thanks you, and does not meet your eyes.",
            fx: {them:{type:"enemy",op:-60},piety:3,honor:-3,happy:-6},
          },
        ],
      },
      {
        id: "hs_c_rite",
        cond: p=>ADK("clergy")(p),
        cool: 8,
        title: "The family rite",
        setup: (p,ctx)=>{fill(p,ctx),ctx.rite=String(titleOf(p)).replace(/^the /i,"").toLowerCase()},
        text: 'Your family is known by one duty: "{ftitle}." This year, with the elder sick, the rite falls to you, before a great crowd and the eyes of the faith.',
        choices: [
          {
            t: "Perform it exactly as taught",
            check: {s:"faith",s2:"wil",d:46},
            win: {
              r: "Every word, every gesture, just as your grandparents did it. The old women in the crowd weep.",
              fx: {piety:4,fame:2,honor:2,skill:{faith:2}},
            },
            lose: {
              r: "You stumble over the old words. The crowd murmurs. It will be talked about.",
              fx: {piety:1,happy:-5,wil:.6},
            },
          },
          {
            t: "Put your own heart into it",
            check: {s:"persuasion",s2:"faith",d:50},
            win: {
              r: "It is not quite the old way, and it moves the crowd like nothing has for years.",
              fx: {fame:3,piety:3,skill:{persuasion:2}},
            },
            lose: {r:"The elders call it a show, not a rite.",fx:{honor:-2,happy:-3}},
          },
          {
            t: "Ask a cousin to do it instead",
            r: "Your cousin does it beautifully. You watch from the crowd and wonder.",
            fx: {wil:.3},
          },
        ],
      },
      {
        id: "hs_c_k_choir",
        cond: KIDK("clergy"),
        cool: 6,
        title: "In the choir",
        setup: (p,ctx)=>{fill(p,ctx)},
        text: "Like every child of {fam}, you sing in the temple at dawn. It is cold, you are always hungry, and the old priest has a stick for anyone who yawns. Today you have a solo.",
        choices: [
          {
            t: "Sing your heart out",
            check: {s:"music",s2:"wil",d:20},
            win: {
              r: "Your voice fills the temple and the old priest forgets to use his stick.",
              fx: {skill:{music:3},piety:2,happy:4},
            },
            lose: {
              r: "Your voice cracks on the high note. Somebody giggles. You finish anyway.",
              fx: {skill:{music:1},wil:.5},
            },
          },
          {
            t: "Mouth the words and dream",
            r: "Nobody notices. You spend the whole rite planning a raft.",
            fx: {happy:2},
          },
          {
            t: "Ask the priest what the words mean",
            r: "He looks at you as if seeing you for the first time, and begins to explain.",
            fx: {skill:{faith:2,learning:1},literate:!0},
          },
        ],
      },
      {
        id: "hs_s_notes",
        cond: p=>ADK("scholar")(p)&&p.literate,
        cool: 12,
        title: "Grandfather's notes",
        setup: (p,ctx)=>{fill(p,ctx),ctx.topic=A.pick(["fevers and how they spread","old roads nobody has used in three hundred years","the bones of great beasts","a forgotten treaty","a way to set a broken thigh"])},
        text: "In the family library at {seat}, behind the shelf nobody dusts, you find a bundle of notes in your grandfather's hand about {topic}. Half of it is brilliant. Half is madness. You cannot tell which half is which.",
        choices: [
          {
            t: "Spend a winter working through them",
            check: {s:"learning",s2:"int",d:48},
            win: {
              r: "By spring you have found the brilliant half, and made it your own.",
              fx: {skill:{learning:4,medicine:1},int:.6,fame:1},
            },
            lose: {
              r: "By spring you have convinced yourself of the mad half. It takes a year to find out.",
              fx: {skill:{learning:2},happy:-3},
            },
          },
          {
            t: "Publish them under the family name",
            r: "The scholars of {capital} argue about them for years. The family is famous again, for better or worse.",
            fx: {fame:3,skill:{learning:1}},
          },
          {
            t: "Put them back. Some things should rest",
            r: "You put the bundle back exactly where you found it. Some nights you wonder.",
            fx: {wil:.3},
          },
        ],
      },
      {
        id: "hs_s_patient",
        cond: ADK("scholar"),
        cool: 8,
        title: "Called to a sickbed",
        setup: (p,ctx)=>{fill(p,ctx);const x=mkOther(p,otherHouse(p,null),{adj:55,status:"noble",occ:"a great lord"});ctx.pid=x.id,sexWords(ctx,x)},
        text: "A rider comes at midnight. {themFull}, {themOcc}, is sick and asks for a healer of {fam}, because the family's name for medicine is old. If you save {themHim}, the family's fortune is made. If {theyHe} dies under your hands, so is its ruin.",
        choices: [
          {
            t: "Go and do your best",
            check: {s:"medicine",s2:"int",d:50},
            win: {
              r: "Three nights without sleep. On the fourth morning {them} sits up and asks for soup.",
              fx: X(p=>gain(p,sc(p,15)),{them:{type:"friend",op:40},fame:3,skill:{medicine:3}}),
            },
            lose: {
              r: "{them} dies at dawn. {His} family looks at you with cold eyes.",
              fx: (p,ctx)=>{const t=T(ctx);return t&&t.alive&&A.kill(t,"a fever"),A.fame(p,-1),A.willGrow(p,1.2),A.trainSkill(p,"medicine",2),""},
            },
          },
          {
            t: "Send for the family's eldest healer",
            r: "The old one goes and does what can be done. You carry the bag and learn.",
            fx: {skill:{medicine:2},int:.3},
          },
          {
            t: "Refuse: the risk is too great",
            r: "Another healer goes. The family's name for medicine is a little smaller.",
            fx: {honor:-2,fame:-1},
          },
        ],
      },
      {
        id: "hs_s_stolen",
        cond: ADK("scholar"),
        cool: 14,
        title: "Stolen learning",
        setup: (p,ctx)=>{fill(p,ctx),ctx.rv=rivalOf(p),ctx.Rv=A.cap(ctx.rv)},
        text: "A new treatise is being copied in {capital}, and it is causing a stir. You read a copy, and your blood runs cold: whole pages of it are {fam}'s own work, word for word, under a {rv} name.",
        choices: [
          {
            t: "Go to {capital} and prove it",
            check: {s:"learning",s2:"persuasion",d:50},
            win: {
              r: "You lay the family's older copy beside theirs before the masters. The plagiarist is disgraced.",
              fx: {fame:3,honor:2,skill:{learning:2}},
            },
            lose: {r:"The masters say great minds think alike. {Rv} smiles.",fx:{happy:-6,wil:.8}},
          },
          {
            t: "Write a better book",
            check: {s:"learning",s2:"int",d:56},
            win: {
              r: "It takes two years. When it is done, nobody remembers the stolen one.",
              fx: {fame:4,skill:{learning:4},int:.5},
            },
            lose: {r:"Two years, and the book is not better. Just longer.",fx:{skill:{learning:2},happy:-3}},
          },
          {
            t: "Shrug: knowledge should be free",
            r: "Your family is horrified. You sleep fine.",
            fx: {happy:1,rel:{who:"father",op:-6}},
          },
        ],
      },
      {
        id: "hs_s_k_letters",
        cond: p=>KIDK("scholar","clergy")(p)&&!p.literate,
        once: !0,
        title: "Letters before bread",
        setup: (p,ctx)=>{fill(p,ctx)},
        text: 'In {fam}, children learn their letters before they learn to tie their shoes. Your mother puts a slate in front of you and a candle beside it. "We do not stop until you can write your name."',
        choices: [
          {
            t: "Work until you get it",
            check: {s:"int",s2:"wil",d:18},
            win: {
              r: "By midnight you can write your name, and three other words, and you are drunk with it.",
              fx: {literate:!0,skill:{learning:3},happy:4},
            },
            lose: {
              r: "It takes three weeks, many tears and a great deal of chalk. But you get there.",
              fx: {literate:!0,skill:{learning:1},wil:.6},
            },
          },
          {
            t: "Draw pictures instead",
            r: "Your mother sighs, then laughs, and teaches you letters through your pictures.",
            fx: {literate:!0,skill:{craft:1,learning:1}},
          },
        ],
      },
      {
        id: "hs_s_secret_knowledge",
        cond: ADK("scholar","clergy"),
        w: .6,
        cool: 20,
        title: "What the family knows",
        setup: (p,ctx)=>{fill(p,ctx),ctx.secret=secretOf(p);const x=mkOther(p,otherHouse(p,null),{adj:45,status:"noble",occ:"a powerful lord"});ctx.pid=x.id,sexWords(ctx,x)},
        text: "Scholars keep records, and records keep secrets. {secret} Now {themFull}, {themOcc}, has heard that {fam} knows something, and has sent a purse and a polite, dangerous letter.",
        choices: [
          {
            t: "Keep the family's silence",
            check: {s:"wil",s2:"intrigue",d:48},
            win: {
              r: "You return the purse with a dull, polite reply. {them} decides you know nothing worth having.",
              fx: {wil:.6,skill:{intrigue:2},honor:2},
            },
            lose: {
              r: "Your reply is too careful. {them} now knows there is something to know.",
              fx: {them:{type:"enemy",op:-20},happy:-4},
            },
          },
          {
            t: "Sell what you know",
            r: "The purse is heavy. Somewhere, someone's life is about to change. Yours too, perhaps.",
            fx: X(p=>gain(p,sc(p,30)),{honor:-5,them:{type:"friend",op:20}}),
          },
          {
            t: "Tell the family and let them decide",
            r: "A long night at {seat}. The family decides to burn the record. You watch it go.",
            fx: {wil:.5},
          },
        ],
      },
      {
        id: "hs_s_plague",
        cond: p=>ADK("scholar")(p)&&(C.prof(p,"medicine",20)||C.job(p,"healer")),
        cool: 15,
        title: "The sick quarter",
        setup: (p,ctx)=>{fill(p,ctx)},
        text: "A fever has broken out in the poor quarter of {town}. The town council asks {fam}, famous for its healers, to go in. Healers who go in do not always come out.",
        choices: [
          {
            t: "Go in",
            check: {s:"medicine",s2:"sta",d:50},
            win: {
              r: "Six weeks of boiling water, clean rags and no sleep. The fever burns out. The quarter will remember your name for a generation.",
              fx: {fame:4,honor:4,skill:{medicine:4},wil:1.5},
            },
            lose: {
              r: "You save some, and catch it yourself. You live, barely.",
              fx: {health:-30,cause:"a fever caught nursing the sick",skill:{medicine:3},wil:2,honor:3},
            },
          },
          {
            t: "Send medicines and advice, not yourself",
            r: "Your remedies help a little. Nobody blames you. Nobody praises you either.",
            fx: X(p=>pay(p,sc(p,4)),{skill:{medicine:1}}),
          },
          {
            t: "Refuse",
            r: "The family's name for courage takes a hit. The fever burns out on its own, eventually.",
            fx: {honor:-3,fame:-1},
          },
        ],
      },
      {
        id: "hs_s_university",
        cond: p=>(TEEN(p)||AD(p)&&C.ageAdj(p)<22)&&C.famKind(p,"scholar"),
        once: !0,
        title: "Sent to study",
        setup: (p,ctx)=>{fill(p,ctx),ctx.place=A.pick(["the great school in {capital}","a famous master in {town}","the temple library","a foreign academy"]),ctx.place=rs(p,ctx,ctx.place)},
        text: "Every child of {fam} goes to {place} at your age, to learn what the family has always known and what it has not. The fees are high and the expectations higher.",
        choices: [
          {
            t: "Study day and night",
            check: {s:"learning",s2:"wil",d:32},
            win: {
              r: "Your masters write home that you are the best of your year. The family is quietly delighted.",
              fx: {skill:{learning:4,medicine:2},int:.6,literate:!0},
            },
            lose: {
              r: "You work hard, and are middling. It is a hard lesson for one of the {sur} blood.",
              fx: {skill:{learning:2},wil:.8,literate:!0},
            },
          },
          {
            t: "Study, and make friends",
            r: "Your friends at school will be lords, priests and scholars one day. They remember you.",
            fx: {skill:{learning:2,diplomacy:2},newRel:{type:"friend",op:35},literate:!0},
          },
          {
            t: "Mostly drink and argue",
            r: "You learn a great deal, almost none of it on the syllabus.",
            fx: {skill:{persuasion:2,gambling:1},happy:6,literate:!0},
          },
        ],
      },
      {
        id: "hs_sea_first",
        cond: p=>(TEEN(p)||AD(p)&&C.ageAdj(p)<20)&&C.famKind(p,"sea"),
        once: !0,
        title: "First time out",
        setup: (p,ctx)=>{fill(p,ctx),ctx.boat=A.pick(["the family's oldest boat","your uncle's cog","the net-boat","the yard's newest hull"])},
        text: "Every child of {fam} goes to sea before they are grown. Today you go out on {boat}, past the harbor mouth for the first time, into water the color of slate.",
        choices: [
          {
            t: "Work like a grown sailor",
            check: {s:"sea",s2:"sta",d:26},
            win: {
              r: "You haul, coil and climb without complaining. The old hands say you have the family's legs.",
              fx: {skill:{sea:4},sta:.4,happy:4},
            },
            lose: {
              r: "You are sick over the side for two days. On the third, you find your legs.",
              fx: {skill:{sea:2},wil:.8,health:-2},
            },
          },
          {
            t: "Watch the stars with the pilot",
            r: "The pilot shows you how the sky tells you where you are. You never forget it.",
            fx: {skill:{sea:2,learning:1},int:.3},
          },
          {
            t: "Stay in the bow and watch the waves",
            r: "The sea gets into you that day, and never quite leaves.",
            fx: {skill:{sea:1},happy:5},
          },
        ],
      },
      {
        id: "hs_sea_overdue",
        cond: ADK("sea"),
        cool: 10,
        title: "The quay at dawn",
        setup: (p,ctx)=>{fill(p,ctx),kinPid(p,ctx)},
        text: 'Your {cz} {them} took the family boat out ten days ago and should have been home in four. Every dawn the women of {fam} go down to the quay and watch the horizon. Today someone says the word "drowned" out loud.',
        choices: [
          {
            t: "Take a boat out to search",
            check: {s:"sea",s2:"wil",d:50},
            win: {
              r: "Two days out, you find them on a rock, starving, mast gone, alive. You bring them home to a quay full of weeping.",
              fx: {them:{type:"cousin",op:50},fame:3,skill:{sea:3},honor:3},
            },
            lose: {
              r: "Three days of empty sea. You come home with nothing but salt in your eyes.",
              fx: {wil:1.5,happy:-8,skill:{sea:2}},
            },
          },
          {
            t: "Pray at the shrine for {themHim}",
            r: p=>A.chance(.4)?"On the fourth morning, a battered sail comes round the point. Whether it was the prayers, nobody can say.":"The sea does not answer. The family sets an empty place at the table.",
            fx: (p,ctx)=>{if(p.piety=A.clamp(p.piety+3,0,100),!A.chance(.4)){const t=T(ctx);t&&t.alive&&A.kill(t,"the sea"),A.willGrow(p,1.2),p.happy=A.clamp(p.happy-8,0,100)}},
          },
          {
            t: "Look after the family while the others wait",
            r: "Someone has to feed the children and mend the nets. It is you. Nobody thanks you, and everyone notices.",
            fx: {honor:3,wil:.8},
          },
        ],
      },
      {
        id: "hs_sea_launch",
        cond: ADK("sea"),
        cool: 12,
        title: "A new keel",
        setup: (p,ctx)=>{fill(p,ctx),ctx.name=A.pick(["the Swift "+p.given,"the Grey Widow","the "+(p.sur||"Family")+" Pride","the Second Chance","the Bright Herring"])},
        text: "{Fam} is launching a new ship from the family slipway, built with the family's own hands and money. The family has asked you to name her. The whole harbor is watching.",
        choices: [
          {
            t: "Name her after an ancestor",
            r: (p,ctx)=>"She goes down the slipway with a cheer and a splash. The old folk nod. A good name for a good ship.",
            fx: {honor:2,happy:4,piety:1},
          },
          {
            t: 'Name her "{name}"',
            r: "The harbor laughs and cheers. Sailors like a ship with a bit of character.",
            fx: {fame:1,happy:5},
          },
          {
            t: "Ask to captain her",
            check: {s:"sea",s2:"command",d:50},
            win: {
              r: "The family agrees. You stand on her deck as she meets her first wave.",
              fx: p=>(p.assets.some(a=>a.k==="cog")||p.assets.push({k:"cog",name:GD.PROPERTY.cog.name,y:A.S.year}),A.trainSkill(p,"command",2),A.fame(p,2),""),
            },
            lose: {r:'"Next one." An older cousin gets her.',fx:{happy:-3}},
          },
        ],
      },
      {
        id: "hs_sea_wreck",
        cond: ADK("sea","merchant","noble"),
        w: .7,
        cool: 14,
        title: "A wreck on the family shore",
        setup: (p,ctx)=>{fill(p,ctx)},
        text: "A ship has struck the rocks below {seat} in the night. By old custom, the family has the right of wreck: what the sea brings ashore is yours. On the beach are casks, bales, and three half-drowned sailors.",
        choices: [
          {
            t: "Save the sailors first",
            r: "You haul them out of the surf. By the time you get back to the cargo, the villagers have most of it. The sailors swear to tell their captain.",
            fx: {honor:4,piety:2,newRel:{type:"friend",op:30}},
          },
          {
            t: "Claim the cargo by right",
            r: "The family carts away a fortune in wine and wool. The ship's owners will sue. It is legal. It is not loved.",
            fx: X(p=>gain(p,sc(p,15)),{honor:-2}),
          },
          {
            t: "Both: rescue, then claim",
            check: {s:"command",s2:"sta",d:46},
            win: {
              r: "You organize the whole village. Sailors saved, cargo stored, nothing stolen. Even the owners pay you a reward.",
              fx: X(p=>gain(p,sc(p,10)),{honor:2,fame:2,skill:{command:2}}),
            },
            lose: {r:"In the chaos, the cargo and one sailor are lost.",fx:{happy:-5,wil:.6}},
          },
        ],
      },
      {
        id: "hs_sea_charts",
        cond: ADK("sea"),
        cool: 14,
        title: "The family charts",
        setup: (p,ctx)=>{fill(p,ctx);const x=mkOther(p,"",{adj:45,status:"merchant",occ:"a foreign captain"});ctx.pid=x.id,sexWords(ctx,x),ctx.sum=sc(p,30)},
        text: "{Fam} keeps a book of soundings, currents and safe passages, written by generations of the family's pilots. {themFull}, {themOcc}, offers {sum} suns for a single page of it.",
        choices: [
          {
            t: "Refuse",
            r: "The book stays locked in the family chest. Your grandmother would be proud.",
            fx: {honor:3},
          },
          {
            t: "Sell a page with the dangerous rocks left out",
            check: {s:"deception",s2:"sea",d:48},
            win: {
              r: "He pays and sails. You hope he is lucky. You keep the money.",
              fx: X((p,ctx)=>gain(p,ctx.sum),{honor:-4,skill:{deception:2}}),
            },
            lose: {
              r: "He knows the coast better than you thought, and spots the gap. You have made an enemy who sails.",
              fx: {them:{type:"enemy",op:-30},honor:-3},
            },
          },
          {
            t: "Sell him the page honestly",
            r: "He pays well, and sails safe. Somewhere a family secret is a little less secret.",
            fx: X((p,ctx)=>gain(p,ctx.sum),{honor:-2,them:{type:"friend",op:20}}),
          },
        ],
      },
      {
        id: "hs_sea_k_knots",
        cond: KIDK("sea"),
        cool: 5,
        title: "Knots and nets",
        setup: (p,ctx)=>{fill(p,ctx)},
        text: "On the quay below {seat}, the old men of {fam} sit mending nets and talking about storms. They teach you the knots one by one: the bowline, the sheet bend, the one that holds a drowning man.",
        choices: [
          {
            t: "Learn them all",
            check: {s:"int",s2:"craft",d:18},
            win: {
              r: "By the end of summer you can tie them in the dark. The old men pass you a pipe you are too young for.",
              fx: {skill:{sea:3,craft:1},happy:3},
            },
            lose: {
              r: "The knots slip and tangle. One of the old men just keeps showing you, over and over, without a word.",
              fx: {skill:{sea:1},wil:.4},
            },
          },
          {
            t: "Listen to the storm stories",
            r: "Drowned uncles, lucky escapes, the night the whole fleet came home. You know your family now.",
            fx: {skill:{sea:1},int:.2,happy:3},
          },
          {
            t: "Swim off the end of the quay",
            check: {s:"athletics",s2:"sta",d:20},
            win: {
              r: "You swim like a seal. The old men nod: the sea will not take this one easily.",
              fx: {skill:{athletics:2},sta:.3},
            },
            lose: {r:"A wave knocks you under. An old man fishes you out with a boathook.",fx:{health:-4,wil:.5}},
          },
        ],
      },
      {
        id: "hs_h_foal",
        cond: p=>(AD(p)||TEEN(p))&&C.famKind(p,"horse"),
        cool: 6,
        title: "A hard foaling",
        setup: (p,ctx)=>{fill(p,ctx),ctx.mare=A.pick(["Old Smoke","the grey queen","Lady Hazel","the best mare of the line"])},
        text: "It is midnight in the foaling barn and {mare} is in trouble: the foal is turned wrong. The family's horse-master is drunk in {town}. Everyone looks at you.",
        choices: [
          {
            t: "Turn the foal yourself",
            check: {s:"husbandry",s2:"str",d:38},
            win: {
              r: "An hour of sweat and blood up to your shoulder, and a wet black colt slides into the straw, alive. The mare too.",
              fx: {skill:{husbandry:4},fame:1,happy:6},
            },
            lose: {
              r: "The mare lives. The foal does not. You sit in the straw until dawn.",
              fx: {skill:{husbandry:2},wil:1,happy:-5},
            },
          },
          {
            t: "Ride for the horse-master",
            check: {s:"riding",s2:"spd",d:34},
            win: {r:"You drag him back half-sober, and he does what he does. Both live.",fx:{skill:{riding:2}}},
            lose: {r:"By the time you get back, it is too late.",fx:{happy:-5,wil:.6}},
          },
          {
            t: "Pray to the horse-gods",
            r: p=>A.chance(.4)?"Something shifts in the mare, and the foal comes on its own. You will never tell anyone you prayed.":"The prayers do not turn the foal. The family loses a good line.",
            fx: p=>{p.piety=A.clamp(p.piety+2,0,100)},
          },
        ],
      },
      {
        id: "hs_h_remounts",
        cond: ADK("horse"),
        cool: 10,
        title: "The army wants horses",
        setup: (p,ctx)=>{fill(p,ctx),ctx.n=A.pick(["three hundred","five hundred","a thousand"])},
        text: "The crown's remount officers have come to {fam} with a demand: {n} horses by spring, at the crown's price. The family studs do not have them. If the order is not filled, the family's charter as royal breeders may go.",
        choices: [
          {
            t: "Buy horses from neighbors to fill the order",
            check: {s:"trade",s2:"husbandry",d:48},
            win: {
              r: "You scour three counties and fill the order. The officers are impressed. So is the treasury.",
              fx: X(p=>pay(p,sc(p,10)),{skill:{trade:2,husbandry:2},favor:6}),
            },
            lose: {
              r: "The neighbors' horses are poor stock. The officers notice.",
              fx: X(p=>pay(p,sc(p,10)),{favor:-6,happy:-4}),
            },
          },
          {
            t: "Negotiate the number down",
            check: {s:"diplomacy",s2:"persuasion",d:48},
            win: {
              r: "Fewer horses, better ones. The officers agree it is a fair bargain.",
              fx: {skill:{diplomacy:2},favor:3},
            },
            lose: {r:"The officers refuse and report the family as difficult.",fx:{favor:-8}},
          },
          {
            t: "Send the young mares too",
            r: "The order is filled. The family's breeding stock will take ten years to recover.",
            fx: {favor:5,happy:-4,wil:.5},
          },
        ],
      },
      {
        id: "hs_h_poison",
        cond: ADK("horse"),
        w: .7,
        cool: 15,
        title: "Poison in the stables",
        setup: (p,ctx)=>{fill(p,ctx),ctx.rv=rivalOf(p),ctx.Rv=A.cap(ctx.rv)},
        text: "The family's best stallion, the sire of half the studs' foals, is dead in his stall, foaming. The groom swears he saw a stranger by the water trough. Everyone at {seat} thinks of {rv}.",
        choices: [
          {
            t: "Find out who did it",
            check: {s:"intrigue",s2:"tracking",d:50},
            win: {
              r: "The poisoner was paid by {rv}. You have proof, and a hold over them.",
              fx: {skill:{intrigue:3},honor:2,fame:1},
            },
            lose: {r:"The trail goes cold. The groom quits.",fx:{happy:-5}},
          },
          {
            t: "Ride to {rv} and accuse them",
            r: "Words, then swords.",
            fx: {
              duel: {
                tier: 3,
                title: "a rider of the rival house",
                opts: {kind:"duel",place:"the stable yard",lethal:!1,toYield:!0,title:"For the dead stallion"},
              },
            },
          },
          {
            t: "Mourn him and rebuild the line",
            r: "You bury him under the old oak, as the family buries its great horses. Then you start the long work of breeding again.",
            fx: {skill:{husbandry:3},wil:1,happy:-4},
          },
        ],
      },
      {
        id: "hs_h_fair",
        cond: ADK("horse"),
        cool: 8,
        title: "The horse fair",
        setup: (p,ctx)=>{fill(p,ctx)},
        text: "You take the family's best young horses to the great horse fair at {town}. Buyers crowd round, and so do horse thieves, and the line between them is thin.",
        choices: [
          {
            t: "Sell hard",
            check: {s:"trade",s2:"husbandry",d:46},
            win: {
              r: "Top prices, and a lord orders six more for next year.",
              fx: X(p=>gain(p,sc(p,12)),{skill:{trade:2},fame:1}),
            },
            lose: {r:"A dealer talks you down on every horse.",fx:X(p=>gain(p,sc(p,4)),{skill:{trade:1}})},
          },
          {
            t: "Guard the horses at night",
            r: "On the second night, you catch a shape in the horse lines.",
            fx: {
              duel: {
                tier: 1,
                title: "a horse thief",
                opts: {kind:"brawl",place:"the horse lines",lethal:!1,toYield:!0,title:"A thief in the lines"},
              },
            },
          },
          {
            t: "Race the best colt for the prize",
            check: {s:"riding",s2:"spd",d:48},
            win: {
              r: "The colt wins by a length. His price triples on the spot.",
              fx: X(p=>gain(p,sc(p,15)),{fame:2,skill:{riding:3}}),
            },
            lose: {r:"The colt loses, and goes lame. You sell him cheap.",fx:{happy:-4,skill:{riding:1}}},
          },
        ],
      },
      {
        id: "hs_h_bloodline",
        cond: ADK("horse"),
        cool: 15,
        title: "The line",
        setup: (p,ctx)=>{fill(p,ctx);const x=mkOther(p,"",{adj:50,status:"noble",occ:"a foreign horse-lord"});ctx.pid=x.id,sexWords(ctx,x),ctx.sum=sc(p,50)},
        text: "The family's horses are known by their line: generations of careful breeding that no other stud can match. {themFull}, {themOcc}, offers {sum} suns for two mares and a stallion. It would make the family rich. It would end the family's monopoly.",
        choices: [
          {
            t: "Sell",
            r: "The money is very welcome. In ten years, the foreign stud will be breeding horses as good as yours.",
            fx: X((p,ctx)=>gain(p,ctx.sum),{honor:-2,them:{type:"friend",op:20}}),
          },
          {
            t: "Sell geldings and an old mare instead",
            check: {s:"deception",s2:"husbandry",d:48},
            win: {
              r: "The foreigner pays for horses that will never breed the line. You feel clever and a little dirty.",
              fx: X((p,ctx)=>gain(p,ctx.sum/2),{honor:-3,skill:{deception:2}}),
            },
            lose: {
              r: "The foreigner knows horses better than that. He leaves in a fury.",
              fx: {them:{type:"enemy",op:-30}},
            },
          },
          {t:"Refuse",r:"The line stays in the family, where it belongs.",fx:{honor:2}},
        ],
      },
      {
        id: "hs_h_k_pony",
        cond: KIDK("horse","clan"),
        cool: 6,
        title: "Your first horse",
        setup: (p,ctx)=>{fill(p,ctx),ctx.pony=A.pick(["a fat grey pony with an evil eye","a little chestnut mare","a shaggy dun who bites","a foal you saw born"])},
        text: 'In {fam}, children ride before they can walk properly. Today you are given your own: {pony}. "Fall off a hundred times," your grandfather says, "and you will be a rider."',
        choices: [
          {
            t: "Ride until dark",
            check: {s:"riding",s2:"spd",d:18},
            win: {
              r: "By sunset you are galloping round the paddock and screaming with joy.",
              fx: {skill:{riding:4},happy:6},
            },
            lose: {
              r: "Ninety-nine falls. Bruises everywhere. But you are still on at sunset.",
              fx: {skill:{riding:2},health:-3,wil:.8},
            },
          },
          {
            t: "Groom and feed it first",
            r: "You spend the day getting to know it. Tomorrow it lets you on without a fight.",
            fx: {skill:{husbandry:3,riding:1}},
          },
          {
            t: "Try to ride it backwards",
            r: "You end up in the water trough. Your grandfather laughs so hard he has to sit down.",
            fx: {happy:4,skill:{riding:1}},
          },
        ],
      },
      {
        id: "hs_h_race",
        cond: p=>(AD(p)||TEEN(p))&&C.famKind(p,"horse","clan"),
        cool: 6,
        title: "The family race",
        setup: (p,ctx)=>{fill(p,ctx),ctx.rv=rivalOf(p),ctx.Rv=A.cap(ctx.rv)},
        text: "Once a year, at the summer fair, {fam} and {rv} race their best horses across the long meadow for a silver bowl. It is the most important thing in the world to both families. This year you ride.",
        choices: [
          {
            t: "Ride flat out from the start",
            check: {s:"riding",s2:"spd",d:44},
            win: {
              r: "You win by a nose. The family carries you on their shoulders. The bowl sits on the family table all year.",
              fx: {fame:2,skill:{riding:3},happy:8},
            },
            lose: {
              r: "You lead until the last furlong, then fade. {Rv} takes the bowl.",
              fx: {happy:-5,skill:{riding:2},wil:.5},
            },
          },
          {
            t: "Hold back, then sprint",
            check: {s:"riding",s2:"int",d:42},
            win: {
              r: "Your horse has more left at the end. You win by two lengths.",
              fx: {fame:2,skill:{riding:3,tactics:1},happy:8},
            },
            lose: {r:"You hold back too long. You finish a close second.",fx:{happy:-3,skill:{riding:2}}},
          },
          {
            t: "Box the other rider in, dirty",
            check: {s:"riding",s2:"deception",d:40},
            win: {
              r: "You win, and the other side cries foul. The judges are family friends.",
              fx: {fame:1,honor:-3,happy:4},
            },
            lose: {r:"The judges see it. You are disqualified, and the family is shamed.",fx:{honor:-5,happy:-6}},
          },
        ],
      },
      {
        id: "hs_hu_poachers",
        cond: ADK("hunt"),
        cool: 8,
        title: "Poachers in the wood",
        setup: (p,ctx)=>{fill(p,ctx),kinPid(p,ctx)},
        text: "{Fam} keeps the lord's wood, and you have caught poachers at dawn with a deer between them. One of them is your {cz} {them}, who has five children and no work since the frost.",
        choices: [
          {
            t: "Let them go, deer and all",
            r: "{them} weeps. The lord will never know. You will.",
            fx: {them:{type:"cousin",op:35},honor:-1,piety:2},
          },
          {
            t: "Take the deer, let them go",
            r: "A hard lesson, without the noose. {them} takes it.",
            fx: {them:{type:"cousin",op:10},honor:1},
          },
          {
            t: "Bring them before the lord's court",
            r: "The law is the law, even for family. {them} is fined and branded. {Fam} keeps its post.",
            fx: {them:{type:"enemy",op:-40},favor:6,honor:2,happy:-5},
          },
        ],
      },
      {
        id: "hs_hu_beast",
        cond: p=>ADK("hunt","horse","clan")(p),
        cool: 10,
        title: "Something in the wood",
        setup: (p,ctx)=>{fill(p,ctx),beastNear(p,ctx)},
        text: "Deer are being killed on the north ridge, and a shepherd boy has gone missing. The tracks belong to {bname}. Hunting it down is {fam}'s duty, and everyone in the valley is watching.",
        choices: [
          {
            t: "Track it to its lair and fight",
            r: "Down the ridge, into the thick wood.",
            fx: {beast:{place:"the family wood"},skill:{tracking:2}},
          },
          {
            t: "Build a pit trap",
            check: {s:"survival",s2:"int",d:48},
            win: {
              r: "Three days of digging, two nights of waiting. On the third night, it falls in.",
              fx: {fame:3,skill:{survival:3},honor:2},
            },
            lose: {r:"The beast walks around the trap, almost scornfully.",fx:{happy:-4,skill:{survival:1}}},
          },
          {
            t: "Call out the whole family for a drive",
            check: {s:"command",s2:"tracking",d:46},
            win: {
              r: "Twenty men and their dogs drive it into the open. It dies under a dozen spears, and you strike the first.",
              fx: {fame:2,skill:{command:2,tracking:2}},
            },
            lose: {r:"The drive breaks up. Two cousins are hurt and the beast escapes.",fx:{happy:-5,wil:.8}},
          },
        ],
      },
      {
        id: "hs_hu_royal_hunt",
        cond: ADK("hunt"),
        cool: 10,
        title: "The great hunt",
        setup: (p,ctx)=>{fill(p,ctx)},
        text: "{Lg} is coming to hunt in the wood your family keeps. {Fam} must find the game, place the hounds and make sure the great ones get their kill. If it goes wrong, it is your family's fault.",
        choices: [
          {
            t: "Find the finest stag in the wood",
            check: {s:"tracking",s2:"survival",d:48},
            win: {
              r: "A twelve-pointer, right where you said. The great ones are delighted.",
              fx: {favor:10,fame:2,skill:{tracking:3}},
            },
            lose: {
              r: "The stag you found is gone by morning. The great ones are bored and cold.",
              fx: {favor:-6,happy:-4},
            },
          },
          {
            t: "Make sure the liege gets the kill",
            check: {s:"etiquette",s2:"tracking",d:46},
            win: {
              r: "The liege takes the stag with one arrow, and talks about it for years.",
              fx: {favor:12,skill:{etiquette:2}},
            },
            lose: {r:"The liege misses, and a young cousin of yours takes the shot. Awkward.",fx:{favor:-4}},
          },
          {
            t: "Show off your own skill",
            req: p=>C.prof(p,"bow",40),
            r: "You drop a running hart at a hundred paces. The court gasps. The liege is not entirely pleased.",
            fx: {fame:3,favor:-2,skill:{bow:2}},
          },
        ],
      },
      {
        id: "hs_hu_forest_law",
        cond: ADK("hunt"),
        cool: 10,
        title: "The forest law",
        setup: (p,ctx)=>{fill(p,ctx);const x=mkOther(p,"",{adj:C.ageAdj(p)+A.ri(-5,10),status:"peasant",occ:"a starving peasant"});ctx.pid=x.id,sexWords(ctx,x)},
        text: "You catch {themFull}, {themOcc}, cutting wood in the lord's forest. {He} has three children and no fire. The forest law says {theyHe} must be brought to court; for a second offense, branded.",
        choices: [
          {
            t: "Let {themHim} take the wood",
            r: "{them} stares, then goes home with the wood. You go home with a lighter heart and a heavier conscience.",
            fx: {them:{type:"friend",op:30},piety:2,honor:-1},
          },
          {
            t: "Bring {themHim} in",
            r: "You do your duty. The lord fines {themHim}. The family keeps its post.",
            fx: {them:{type:"enemy",op:-30},favor:3,honor:1,happy:-3},
          },
          {
            t: "Show {themHim} where the deadwood lies",
            r: "Dead wood is not forbidden. You show {them} where to find it. Everyone is warm, and nobody broke the law.",
            fx: {them:{type:"friend",op:25},honor:2,int:.2},
          },
        ],
      },
      {
        id: "hs_hu_secret",
        cond: ADK("hunt"),
        w: .7,
        cool: 15,
        title: "What lives deeper in",
        setup: (p,ctx)=>{fill(p,ctx),ctx.secret=secretOf(p)},
        text: "The deep wood has its secrets and so does {fam}. {secret} Now a sheriff's man has come asking questions about the wood.",
        choices: [
          {
            t: "Lead him in circles",
            check: {s:"survival",s2:"deception",d:46},
            win: {
              r: "Three days of thorns and bogs. He goes home with nothing but scratches.",
              fx: {skill:{survival:2,deception:2}},
            },
            lose: {r:"He is a better woodsman than he looks. He finds something.",fx:{happy:-5,favor:-6}},
          },
          {
            t: "Pay him to go away",
            r: 'He takes the money and writes "nothing found". He may come back for more.',
            fx: X(p=>pay(p,sc(p,6)),{honor:-1}),
          },
          {
            t: "Tell him the truth",
            r: "The family is ruined, or saved, depending on who you ask. You sleep well, at least.",
            fx: {honor:3,favor:4,rel:{who:"father",op:-15}},
          },
        ],
      },
      {
        id: "hs_hu_k_tracks",
        cond: KIDK("hunt"),
        cool: 5,
        title: "Reading the ground",
        setup: (p,ctx)=>{fill(p,ctx)},
        text: 'Your grandfather takes you into the wood at dawn, as every child of {fam} is taken. He crouches by the stream and points at the mud. "What walked here? When? Was it hungry?"',
        choices: [
          {
            t: "Look closely and answer",
            check: {s:"tracking",s2:"int",d:18},
            win: {
              r: '"A doe, this morning, limping." Your grandfather grunts, which from him is high praise.',
              fx: {skill:{tracking:3},happy:3},
            },
            lose: {r:'"A dog?" It was a boar. He shows you the difference, again and again.',fx:{skill:{tracking:1}}},
          },
          {
            t: "Follow the tracks into the wood",
            check: {s:"stealth",s2:"spd",d:20},
            win: {
              r: "You find the doe at a spring and watch her drink, so close you could touch her.",
              fx: {skill:{stealth:2,tracking:1},happy:5},
            },
            lose: {r:"You crash through the bracken and scare everything for a mile.",fx:{skill:{stealth:1}}},
          },
          {
            t: "Ask about the beasts of the deep wood",
            r: "He tells you what is true and what is only believed, and which is which. You do not sleep that night.",
            fx: {int:.3,skill:{survival:1}},
          },
        ],
      },
      {
        id: "hs_hu_hounds",
        cond: ADK("hunt","noble","horse"),
        cool: 10,
        title: "The family hounds",
        setup: (p,ctx)=>{fill(p,ctx),ctx.hound=A.pick(["Bellsong","Old Grip","Thunder","Ash","the black bitch nobody dares to name"])},
        text: "The hounds of {fam} are famous in three counties. The best of them, {hound}, is old now and failing. The kennel-master says it is time. The family looks to you.",
        choices: [
          {
            t: "Do it yourself, gently",
            r: "You take the old hound to the place where it first ran. It is quick. You sit there a long time.",
            fx: {wil:1,happy:-5,honor:2},
          },
          {
            t: "Let it live out its days by the fire",
            r: "The old hound sleeps by the hearth and dreams of running. The kennel-master grumbles.",
            fx: {happy:2,piety:1},
          },
          {
            t: "Breed one last litter from it",
            check: {s:"husbandry",s2:"int",d:44},
            win: {
              r: "Five pups, and one of them has the old hound's nose. The line goes on.",
              fx: {skill:{husbandry:3},happy:4},
            },
            lose: {r:"The litter is weak. Only one survives, and it is afraid of rabbits.",fx:{happy:-2}},
          },
        ],
      },
      {
        id: "hs_o_first_job",
        cond: p=>(AD(p)||TEEN(p))&&C.famKind(p,"outlaw")&&C.ageAdj(p)<24,
        once: !0,
        title: "The family business",
        setup: (p,ctx)=>{fill(p,ctx),ctx.job=A.pick(["lift a fat purse at the fair","carry a sack of something across the river at night","keep watch while the uncles empty a warehouse","sweet-talk a guard while the cousins slip past"])},
        text: 'You are old enough now. Tonight {fam} wants you to {job}. Everyone in the family started this way. Your grandmother pats your cheek. "Do not get caught, and do not get clever."',
        choices: [
          {
            t: "Do it, and do it well",
            check: {s:"stealth",s2:"spd",d:34},
            win: {
              r: "Clean, quick, nobody hurt. The uncles slap your back and give you your first share.",
              fx: X(p=>gain(p,4),{skill:{stealth:3},happy:4,flag:"hs_blooded"}),
            },
            lose: {
              r: "A shout, a chase, and you get away by the skin of your teeth over a wall. The family laughs about it for a year.",
              fx: {skill:{stealth:1,athletics:1},health:-3,wil:.6,flag:"hs_blooded"},
            },
          },
          {
            t: "Do it your own way",
            check: {s:"deception",s2:"int",d:36},
            win: {
              r: "You talk your way in and out without lifting a finger. Your grandmother narrows her eyes: this one is dangerous.",
              fx: X(p=>gain(p,5),{skill:{deception:3},flag:"hs_blooded"}),
            },
            lose: {
              r: "Your clever plan collapses. The uncles have to rescue you, and they are not pleased.",
              fx: {happy:-4,rel:{who:"father",op:-5}},
            },
          },
          {
            t: "Refuse",
            r: 'Silence around the table. Then your grandmother says, "Well. Every family needs one honest fool." Nobody asks again, for now.',
            fx: {honor:3,flag:"hs_honest_one",happy:-2},
          },
        ],
      },
      {
        id: "hs_o_leave",
        cond: p=>ADK("outlaw")(p)&&C.ageAdj(p)>=18,
        cool: 12,
        title: "Loyalty, or a way out",
        setup: (p,ctx)=>{fill(p,ctx),ctx.out=A.pick(["an honest master in {town} who would take you on","a sweetheart who will not marry into a thieving family","a captain recruiting for the army","a temple that takes in anyone who asks"]),ctx.out=rs(p,ctx,ctx.out)},
        text: "There is a door out of {fam}: {out}. Walk through it and you leave the family's trade behind, and the family too. They will not stop you. They may never forgive you.",
        choices: [
          {
            t: "Walk through the door",
            r: "You leave at dawn with a bundle and a clean name. Your mother does not come to the door. Your grandmother does, and nods once.",
            fx: {honor:4,wil:1.5,happy:-3,flag:"hs_left_family",rel:{who:"mother",op:-15}},
          },
          {
            t: "Stay. Family is family",
            r: "You close the door. The family closes round you, warm and dangerous.",
            fx: {happy:2,rel:{who:"mother",op:10}},
          },
          {
            t: "Keep a foot in both worlds",
            check: {s:"deception",s2:"wil",d:48},
            win: {
              r: "Honest by day, family by night. It is exhausting, and for now it works.",
              fx: {skill:{deception:2},wil:.6},
            },
            lose: {r:"The honest world finds out about the other one. The door slams shut.",fx:{honor:-3,happy:-5}},
          },
        ],
      },
      {
        id: "hs_o_noose",
        cond: ADK("outlaw"),
        w: .8,
        cool: 12,
        title: "The tall widow",
        setup: (p,ctx)=>{fill(p,ctx),kinPid(p,ctx)},
        text: "Your {cz} {them} has been taken by the watch and tried in a day. {He} hangs at noon tomorrow in the market square at {home}. The family meets in the back room. Somebody has to do something.",
        choices: [
          {
            t: "Break {themHim} out tonight",
            check: {s:"stealth",s2:"tactics",d:55},
            win: {
              r: "A bribed guard, a rope, a fast boat. {them} is three counties away by dawn. The family will tell this story for a century.",
              fx: {them:{type:"cousin",op:50},fame:2,skill:{stealth:3}},
            },
            lose: {
              r: "The guard was not bribed enough. You get away. {them} does not.",
              fx: (p,ctx)=>{const t=T(ctx);return t&&t.alive&&A.kill(t,"the gallows"),A.willGrow(p,2),p.happy=A.clamp(p.happy-12,0,100),""},
            },
          },
          {
            t: "Buy a pardon",
            r: "Every coin the family has. The pardon comes at the last hour, the rope already round {theirHis} neck.",
            fx: X(p=>pay(p,sc(p,30)),{them:{type:"cousin",op:40}}),
          },
          {
            t: "Be there at the end, in the crowd",
            r: "{them} sees you in the crowd and stands straighter. Afterwards you carry {themHim} home.",
            fx: (p,ctx)=>{const t=T(ctx);return t&&t.alive&&A.kill(t,"the gallows"),A.willGrow(p,2.5),p.happy=A.clamp(p.happy-10,0,100),""},
          },
        ],
      },
      {
        id: "hs_o_informer",
        cond: ADK("outlaw"),
        cool: 12,
        title: "A lamp in the family",
        setup: (p,ctx)=>{fill(p,ctx),kinPid(p,ctx,{adj:C.ageAdj(p)+A.ri(-2,15)})},
        text: "Two raids in a month, and both times the watch knew exactly where to look. Someone is a lamp, an informer. Every sign points to your {cz} {them}.",
        choices: [
          {
            t: "Set a trap with false news",
            check: {s:"intrigue",s2:"int",d:48},
            win: {
              r: "You tell {them} a lie, and the watch raids an empty barn. Now you know.",
              fx: {skill:{intrigue:3},them:{type:"enemy",op:-40},flag:"hs_found_lamp"},
            },
            lose: {
              r: "The watch raids nothing. Either {them} is innocent, or clever.",
              fx: {skill:{intrigue:1},happy:-3},
            },
          },
          {
            t: "Confront {themHim}",
            r: "{them} goes pale, then furious.",
            fx: {
              them: {type:"enemy",op:-35},
              duel: {foe:"them",opts:{kind:"brawl",place:"the back room",lethal:!1,toYield:!0,title:"The lamp"}},
            },
          },
          {
            t: "Warn the family and lie low",
            r: "The family stops all work for a season. Hungry, but nobody hangs.",
            fx: {happy:-3,wil:.6},
          },
        ],
      },
      {
        id: "hs_o_turn",
        cond: ADK("outlaw"),
        w: .7,
        cool: 14,
        title: "An offer from the reeve",
        setup: (p,ctx)=>{fill(p,ctx);const x=mkOther(p,"",{adj:45,status:"gentry",occ:"the reeve"});ctx.pid=x.id,sexWords(ctx,x)},
        text: "{themFull}, {themOcc}, catches you alone in a lane. {He} knows everything about {fam}. {He} will forget it all, and pay you besides, if you tell {themHim} where the family keeps its goods.",
        choices: [
          {
            t: "Spit at {theirHis} feet",
            r: '{them} wipes {theirHis} boot and smiles. "I will ask again."',
            fx: {them:{type:"enemy",op:-20},honor:2,wil:.5},
          },
          {
            t: "Agree, and feed {themHim} lies",
            check: {s:"deception",s2:"intrigue",d:52},
            win: {
              r: "Lies with a crumb of truth. The reeve pays, and the family is safer than before.",
              fx: X(p=>gain(p,sc(p,5)),{skill:{deception:3,intrigue:2}}),
            },
            lose: {
              r: "The reeve checks your story, and it does not hold. Now you are on the wrong side of both.",
              fx: {them:{type:"enemy",op:-30},happy:-5,flag:"hs_suspect"},
            },
          },
          {
            t: "Sell the family out",
            r: "You take the reeve's money. The raids begin. You will never be safe again, from either side.",
            fx: X(p=>gain(p,sc(p,20)),{honor:-10,trait:"deceitful",flag:"hs_lamp"}),
          },
        ],
      },
      {
        id: "hs_o_law",
        cond: ADK("outlaw"),
        cool: 8,
        title: "The law closes in",
        setup: (p,ctx)=>{fill(p,ctx),ctx.sign=A.pick(["new soldiers in the town","a wanted notice with a face that looks a lot like your uncle","a stranger asking too many questions at the inn","the watch searching houses on your street"])},
        text: "You notice {sign}. Every member of {fam} knows the signs. The law is closing in. The family must decide what to do.",
        choices: [
          {
            t: "Scatter until it blows over",
            r: "Everyone goes to cousins in different towns. A lonely season, but nobody hangs.",
            fx: {wil:.8,happy:-3,sta:.3},
          },
          {
            t: "Bribe the right people",
            check: {s:"intrigue",s2:"persuasion",d:46},
            win: {
              r: "Money changes hands. The soldiers move on to the next town.",
              fx: X(p=>pay(p,sc(p,8)),{skill:{intrigue:2}}),
            },
            lose: {r:"The new captain is honest. He arrests the man you tried to bribe.",fx:{punish:"theft"}},
          },
          {
            t: "Lay a false trail to another gang",
            check: {s:"deception",s2:"intrigue",d:50},
            win: {
              r: "The law turns on a rival gang across the river. Two problems solved.",
              fx: {skill:{deception:2,intrigue:2},fame:1},
            },
            lose: {
              r: "The false trail is too obvious. The law looks harder at your family.",
              fx: {happy:-5,flag:"hs_suspect"},
            },
          },
        ],
      },
      {
        id: "hs_o_fence",
        cond: ADK("outlaw"),
        cool: 8,
        title: "Uncle's shop",
        setup: (p,ctx)=>{fill(p,ctx),ctx.thing=A.pick(["a jeweled cup with a lord's arms on it","a bolt of silk still in its customs wrapper","a gold ring with a name engraved inside","a box of crossbow bolts with a royal mark"])},
        text: "Your uncle runs the family's fence: a little pawnshop in {town} where stolen goods go out the back door. Today a stranger brings in {thing}. It is worth a fortune, and it is far too hot to touch.",
        choices: [
          {
            t: "Buy it cheap and sit on it",
            check: {s:"trade",s2:"intrigue",d:46},
            win: {
              r: "A year later, you sell it in another town for ten times the price.",
              fx: X(p=>gain(p,sc(p,12)),{skill:{trade:2}}),
            },
            lose: {r:"The owner's men come looking. You throw it in the river.",fx:{happy:-4}},
          },
          {
            t: "Refuse it",
            r: "The stranger leaves, cursing. Three days later he is hanged. You sleep well.",
            fx: {wil:.4,honor:1},
          },
          {
            t: "Return it to its owner, for a reward",
            check: {s:"persuasion",s2:"deception",d:48},
            win: {
              r: "The owner is grateful, and asks no questions. A reward and a friend in high places.",
              fx: X(p=>gain(p,sc(p,6)),{newRel:{type:"friend",op:20},honor:2}),
            },
            lose: {
              r: "The owner asks a great many questions. Your uncle is not pleased.",
              fx: {happy:-3,flag:"hs_suspect"},
            },
          },
        ],
      },
      {
        id: "hs_o_k_lookout",
        cond: KIDK("outlaw"),
        cool: 5,
        title: "Lookout",
        setup: (p,ctx)=>{fill(p,ctx)},
        text: "In {fam}, children earn their keep early. You are the lookout: sit on the wall by the alley, play with your knucklebones, and whistle twice if you see the watch. Tonight, a lantern comes round the corner.",
        choices: [
          {
            t: "Whistle, loud and clear",
            check: {s:"ins",s2:"spd",d:18},
            win: {
              r: "Your cousins are gone before the lantern reaches the alley. They pinch your cheek and give you a honey cake.",
              fx: {skill:{stealth:1},ins:.3,happy:4},
            },
            lose: {
              r: "You whistle too late. The cousins scatter, one is caught. Nobody blames you out loud.",
              fx: {happy:-4,wil:.5},
            },
          },
          {
            t: "Distract the watch",
            check: {s:"deception",s2:"int",d:20},
            win: {
              r: "You ask the watchman for directions to a street that does not exist. By the time he gives up, the job is done.",
              fx: {skill:{deception:2},happy:5},
            },
            lose: {r:"The watchman sees straight through you, and hauls you home by the ear.",fx:{happy:-4}},
          },
          {
            t: "Run away from it all",
            r: "You run to the river and sit there until dawn. Nobody is caught. Nobody trusts you with a wall again.",
            fx: {wil:.3,happy:-2},
          },
        ],
      },
      {
        id: "hs_o_share",
        cond: ADK("outlaw"),
        cool: 8,
        title: "Dividing the take",
        setup: (p,ctx)=>{fill(p,ctx),kinPid(p,ctx)},
        text: "After a good job, the family divides the take on the kitchen table. Your {cz} {them} is counting, and you notice that {theirHis} pile somehow grows faster than everyone else's.",
        choices: [
          {
            t: "Call it out in front of everyone",
            check: {s:"intimidation",s2:"wil",d:44},
            win: {
              r: "The family counts again. {them} is short-changed for a year, and remembers who called it.",
              fx: X(p=>gain(p,sc(p,3)),{them:{type:"rival",op:-25},honor:2}),
            },
            lose: {
              r: "{them} laughs and calls you a fool who cannot count. The family laughs too.",
              fx: {them:{type:"rival",op:-15},happy:-4},
            },
          },
          {
            t: "Have a quiet word later",
            r: "{them} goes red and gives you half the extra. A secret between you now.",
            fx: X(p=>gain(p,sc(p,2)),{them:{type:"cousin",op:5},skill:{intrigue:1}}),
          },
          {
            t: "Say nothing",
            r: "There will be other jobs. There will be other piles. You will watch them all.",
            fx: {wil:.5},
          },
        ],
      },
      {
        id: "hs_o_rival_gang",
        cond: ADK("outlaw"),
        cool: 10,
        title: "Another crew",
        setup: (p,ctx)=>{fill(p,ctx),ctx.rv=rivalOf(p),ctx.Rv=A.cap(ctx.rv)},
        text: "{Rv} has moved into the family's streets: their pickpockets in your market, their fences buying your goods for less. Nobody can call the watch. This gets settled the old way.",
        choices: [
          {
            t: "Lead the family to push them out",
            r: "Cudgels and fists in an alley behind the fish market.",
            fx: {
              duel: {
                tier: 2,
                title: "a rival crew's bruiser",
                opts: {kind:"brawl",place:"the alley behind the fish market",lethal:!1,toYield:!0,title:"Whose streets"},
              },
              flag: "hs_feud",
            },
          },
          {
            t: "Negotiate the streets",
            check: {s:"diplomacy",s2:"intimidation",d:48},
            win: {
              r: "This side of the river is yours, that side theirs. A truce, sealed with bad wine.",
              fx: {skill:{diplomacy:2,intimidation:1},fame:1},
            },
            lose: {r:"They laugh at you and send you back with a black eye.",fx:{health:-4,happy:-4}},
          },
          {
            t: "Tip off the watch about them",
            r: "The watch takes three of them. The rest know who talked. It is a dangerous way to win.",
            fx: {honor:-3,flag:"hs_feud",skill:{intrigue:2}},
          },
        ],
      },
      {
        id: "hs_o_pardon",
        cond: p=>ADK("outlaw")(p)&&C.atWar(p)&&!C.soldier(p),
        cool: 12,
        title: "A pardon for a sword",
        setup: (p,ctx)=>{fill(p,ctx)},
        text: "The crown is at war with {enemy} and needs men badly. The heralds cry it in the market: any outlaw who serves a year in the host will be pardoned, and their family's old crimes forgotten.",
        choices: [
          {
            t: "Take the king's shilling",
            r: "You march with the host. If you live, {fam} will have one clean name.",
            fx: p=>{if(!p.mil){const r=A.enlist(p,!1);if(r&&r.ok)return p.honor=A.clamp(p.honor+3,0,100),"You enlist."}return""},
          },
          {
            t: "Send a younger cousin instead",
            r: "The cousin goes. Some families in {home} spit when you pass.",
            fx: {honor:-2,newRel:{type:"rival",op:-10}},
          },
          {
            t: "Stay. War is worse than the noose",
            r: "The family business goes on. With half the watch at the war, it is a good year for business.",
            fx: X(p=>gain(p,sc(p,5)),{skill:{stealth:1}}),
          },
        ],
      },
      {
        id: "hs_o_gran",
        cond: p=>(AD(p)||TEEN(p))&&C.famKind(p,"outlaw")&&notHead(p),
        cool: 10,
        title: "Granny's chair",
        setup: (p,ctx)=>{fill(p,ctx),headPid(p,ctx)},
        text: "{Head} sits in the best chair by the fire and runs {fam} like a captain runs a ship. Tonight {theyHe} wants to see you alone. Everyone gets very quiet when you are called.",
        choices: [
          {
            t: "Go in with your head up",
            r: p=>A.chance(.5)?"{them} wants to know if you can keep your mouth shut. You can. {He} gives you a job only the trusted get.":"{them} has heard you have been careless. A long, cold talking-to. You will not be careless again.",
            fx: p=>{A.chance(.5)?(A.trainSkill(p,"intrigue",2),gain(p,3)):A.willGrow(p,.8)},
          },
          {
            t: "Bring a gift",
            r: "A bottle of good brandy, liberated from a wine merchant. {them} laughs, and pours two cups.",
            fx: {them:{op:15},skill:{diplomacy:1}},
          },
          {
            t: "Ask {themHim} how the family began",
            r: "{them} tells you, and it is not a story you have heard before. It is better.",
            fx: p=>(A.train(p,"int",.3),end(histLine(p))),
          },
        ],
      },
      {
        id: "hs_o_hideout",
        cond: ADK("outlaw"),
        w: .7,
        cool: 14,
        title: "The hideout is found",
        setup: (p,ctx)=>{fill(p,ctx)},
        text: "At dawn a cousin comes running: the watch has found the family's hiding place, everything the family has saved and stolen for three years. Soldiers are already digging.",
        choices: [
          {
            t: "Grab what you can before they reach it",
            check: {s:"spd",s2:"stealth",d:50},
            win: {
              r: "You get in through the back and out with a sack of the best of it, under their noses.",
              fx: X(p=>gain(p,sc(p,10)),{skill:{stealth:2}}),
            },
            lose: {
              r: "A soldier sees you. You run, empty-handed and bleeding.",
              fx: {health:-10,cause:"a soldier's blade",wound:"deep_cut"},
            },
          },
          {
            t: "Let it go. Things can be stolen again",
            r: "Three years of work gone. The family starts again, poorer and angrier.",
            fx: {wil:1.2,happy:-6},
          },
          {
            t: "Find out who told",
            check: {s:"intrigue",s2:"int",d:48},
            win: {
              r: "A drunk cousin talked to the wrong barmaid. He is sent away. The family is safer.",
              fx: {skill:{intrigue:3}},
            },
            lose: {r:"Everyone suspects everyone. It poisons the family for a year.",fx:{happy:-5}},
          },
        ],
      },
      {
        id: "hs_o_marry_out",
        cond: p=>ADK("outlaw")(p)&&!C.married(p)&&C.ageAdj(p)<36,
        cool: 10,
        title: "An honest suitor",
        setup: (p,ctx)=>{fill(p,ctx);const x=mkOther(p,"",{sex:p.flags.likes||(p.sex==="M"?"F":"M"),adj:C.ageAdj(p)+A.ri(-3,3),status:"artisan",occ:"a respectable craftsman"});ctx.pid=x.id,sexWords(ctx,x)},
        text: '{themFull}, {themOcc}, wants to marry you. {He} knows what {fam} is, and does not care. But {theirHis} family does, and so does yours: "You will bring the watch to their door, or they will bring it to ours."',
        choices: [
          {
            t: "Marry {themHim}, and leave the trade",
            r: "You marry quietly in a temple far from home. You never steal again, and you miss it every day.",
            fx: (p,ctx)=>{const t=T(ctx);return t&&!C.married(p)&&A.marry(p,t),p.honor=A.clamp(p.honor+4,0,100),p.flags.hs_left_family=A.S.year,""},
          },
          {
            t: "Marry {themHim}, and keep both lives",
            r: "A wedding, and a secret. You will have to be very careful.",
            fx: (p,ctx)=>{const t=T(ctx);return t&&!C.married(p)&&A.marry(p,t),p.flags.hs_double_life=A.S.year,""},
          },
          {
            t: "Let {themHim} go. It would ruin {themHim}",
            r: "You tell {them} it is over. {He} weeps. You go back to the family and say nothing.",
            fx: {them:{type:"ex",op:-10},happy:-8,wil:1.2},
          },
        ],
      },
      {
        id: "hs_cl_council",
        cond: p=>AD(p)&&(C.famKind(p,"clan")||C.family(p)&&C.cult(p,"CUL-03","CUL-05")),
        cool: 8,
        title: "The clan council",
        setup: (p,ctx)=>{fill(p,ctx),ctx.issue=A.pick(["which valley the herds go to in summer","whether to take a feud to the next valley","who will speak for the clan at the great gathering","whether to let a family of outsiders settle"])},
        text: "The elders of {fam} sit in a ring at the gathering-place, and the question is {issue}. Anyone of the blood may speak. The young usually do not.",
        choices: [
          {
            t: "Stand and speak",
            check: {s:"persuasion",s2:"wil",d:46},
            win: {
              r: "You speak plainly and well. The elders nod. The decision goes your way.",
              fx: {fame:2,skill:{persuasion:2,diplomacy:1},honor:1},
            },
            lose: {
              r: 'An elder cuts you off. "When you have buried a father, you may speak." Silence.',
              fx: {happy:-4,wil:.6},
            },
          },
          {
            t: "Speak through an elder who likes you",
            r: "Your idea comes out of an old mouth. It is adopted. Nobody knows it was yours, except the elder.",
            fx: {skill:{intrigue:2},newRel:{type:"mentor",op:25,back:"student"}},
          },
          {
            t: "Listen and learn",
            r: "You learn more about the clan in one night than in a year of herding.",
            fx: {int:.3,skill:{diplomacy:1}},
          },
        ],
      },
      {
        id: "hs_cl_raid",
        cond: p=>AD(p)&&C.ageAdj(p)<40&&(C.famKind(p,"clan","horse")||C.family(p)&&C.cult(p,"CUL-03","CUL-05","CUL-09")),
        cool: 7,
        title: "A raid for cattle",
        setup: (p,ctx)=>{fill(p,ctx),ctx.rv=rivalOf(p),ctx.Rv=A.cap(ctx.rv),ctx.beast=C.cult(p,"CUL-05")?"camels":C.cult(p,"CUL-03")?"horses":"cattle"},
        text: "The young of {fam} are riding out tonight to take {beast} from {rv}. It is half a sport and half a war, and a hundred years old. If you do not ride, the girls will laugh at you. If you ride, you may not come back.",
        choices: [
          {
            t: "Ride with them",
            check: {s:"riding",s2:"stealth",d:46},
            win: {
              r: "You cut out a dozen of the best and drive them home at a gallop. The clan sings your name.",
              fx: X(p=>gain(p,sc(p,6)),{fame:2,skill:{riding:2,stealth:1},happy:6}),
            },
            lose: {
              r: "They were waiting. You come home with nothing but a cracked rib and a bruised name.",
              fx: {health:-10,cause:"a raid gone wrong",wound:"broken_ribs",wil:.8},
            },
          },
          {
            t: "Lead the raid",
            req: p=>C.prof(p,"command",30),
            check: {s:"command",s2:"tactics",d:50},
            win: {
              r: "Your plan works perfectly. A great haul, no blood. The elders take notice.",
              fx: X(p=>gain(p,sc(p,10)),{fame:3,skill:{command:2,tactics:2}}),
            },
            lose: {
              r: "Your plan falls apart. Two young men are hurt, and the elders blame you.",
              fx: {happy:-6,honor:-2},
            },
          },
          {t:"Stay home",r:"You stay. The girls do laugh. You live.",fx:{happy:-2}},
        ],
      },
      {
        id: "hs_cl_wallrun",
        cond: p=>AD(p)&&C.family(p)&&C.realm(p,"POL-13")&&C.ageAdj(p)<36,
        cool: 10,
        title: "The wall-run",
        setup: (p,ctx)=>{fill(p,ctx),ctx.rv=rivalOf(p),ctx.Rv=A.cap(ctx.rv)},
        text: "A quarrel between {fam} and {rv} has gone to the valley court, and by old Highland custom it will be settled by the wall-run: two champions race along the top of Highcastle's wall, and whoever falls loses. The clan has chosen you.",
        choices: [
          {
            t: "Run for the clan",
            check: {s:"athletics",s2:"spd",d:52},
            win: {
              r: "You run the wall like a goat and touch the far tower first. The clan carries you home on a door.",
              fx: {fame:4,honor:3,skill:{athletics:3},deed:"Won the wall-run for the clan"},
            },
            lose: {
              r: "A loose stone, a lurch, a fall into the soft earth below. The case is lost and so is your ankle.",
              fx: {health:-12,cause:"a fall from the wall",wound:"limp",wil:1.2},
            },
          },
          {
            t: "Run carefully, and trust your feet",
            check: {s:"sta",s2:"wil",d:46},
            win: {
              r: "Slow and steady. The other champion rushes and slips. You win by not falling.",
              fx: {fame:2,honor:2,skill:{athletics:2}},
            },
            lose: {r:"Too slow. The other champion touches the tower first.",fx:{happy:-6,wil:.6}},
          },
          {
            t: "Find a faster cousin",
            r: "Your cousin runs and wins. You hold the clan banner at the bottom, which is something.",
            fx: {honor:-1},
          },
        ],
      },
      {
        id: "hs_cl_youngest",
        cond: p=>AD(p)&&C.family(p)&&(C.cult(p,"CUL-03")||C.realm(p,"POL-12"))&&C.male(p)&&A.relsOf(p,["sibling"]).some(x=>x.p.alive&&x.p.sex==="M"),
        once: !0,
        title: "The youngest keeps the hearth",
        setup: (p,ctx)=>{fill(p,ctx),ctx.youngest=!A.relsOf(p,["sibling"]).some(x=>x.p.alive&&x.p.sex==="M"&&x.p.born>p.born)},
        text: (p,ctx)=>ctx.youngest?"Among the Wind Riders, the youngest son keeps the family hearth and the tent; the older sons take their herds and go. Your brothers are leaving. The hearth of {fam} will be yours, and your parents with it.":"Among the Wind Riders, the youngest son keeps the family hearth; the older sons take their herds and go. Your father has counted out your share of the horses. It is time to ride off and make a tent of your own.",
        choices: [
          {
            t: "Accept the old way",
            r: (p,ctx)=>ctx.youngest?"You stay by the fire as your brothers ride away. The tent is yours, and so are your parents' old bones.":"You ride out with your horses and your blessing. The steppe is wide.",
            fx: (p,ctx)=>(A.trainSkill(p,"husbandry",2),gain(p,sc(p,ctx.youngest?4:10)),A.willGrow(p,.6),""),
          },
          {
            t: "Ask for a bigger share",
            check: {s:"persuasion",s2:"wil",d:44},
            win: {
              r: "Your father grumbles and adds ten more mares. The family respects a bold tongue.",
              fx: X(p=>gain(p,sc(p,10)),{skill:{persuasion:1}}),
            },
            lose: {
              r: "Your father is offended. Your share is smaller for asking.",
              fx: {rel:{who:"father",op:-10},happy:-3},
            },
          },
          {
            t: "Swap places with a brother",
            r: "Unusual, but the family agrees. You get the life you wanted, and your brother gets the one he wanted.",
            fx: {happy:5,rel:{who:"sibling",op:15}},
          },
        ],
      },
      {
        id: "hs_cl_horse_feast",
        cond: p=>AD(p)&&C.family(p)&&(C.realm(p,"POL-12")||C.cult(p,"CUL-03"))&&C.ageAdj(p)<40,
        cool: 6,
        title: "The Horse Feast",
        setup: (p,ctx)=>{fill(p,ctx),ctx.game=A.pick(["the wrestling","the archery shoot","the long race"])},
        text: "It is the Horse Feast at Kharsa, 21 June: races, wrestling, the archery shoot and the kurultai. Each tribe and family sends its best. {Fam} has put your name down for {game}.",
        choices: [
          {
            t: "Wrestle",
            check: {s:"unarmed",s2:"str",d:50},
            win: {
              r: "Three throws, three wins. The khan himself drinks to your family.",
              fx: {fame:3,skill:{unarmed:3},str:.4},
            },
            lose: {r:"Thrown in the second round by a giant of a herder.",fx:{health:-4,happy:-3}},
          },
          {
            t: "Shoot from the saddle",
            check: {s:"bow",s2:"riding",d:52},
            win: {r:"Three arrows, three targets, at a gallop. The crowd roars.",fx:{fame:3,skill:{bow:3,mounted:2}}},
            lose: {r:"Two hits, one miss. Honorable. Forgettable.",fx:{skill:{bow:1}}},
          },
          {
            t: "Ride the long race",
            check: {s:"riding",s2:"sta",d:50},
            win: {
              r: "Thirty miles of steppe, and your horse is the first to the post. A horse that wins the long race is worth a herd.",
              fx: X(p=>gain(p,sc(p,10)),{fame:3,skill:{riding:3}}),
            },
            lose: {r:"Your horse tires at the twentieth mile. You walk him home.",fx:{skill:{riding:1},wil:.5}},
          },
        ],
      },
      {
        id: "hs_cl_feud_mare",
        cond: p=>AD(p)&&C.family(p)&&(C.famKind(p,"clan")||C.race(p,"orc","halforc")||C.cult(p,"CUL-03","CUL-05")),
        cool: 10,
        title: "Three mares",
        setup: (p,ctx)=>{fill(p,ctx),ctx.rv=rivalOf(p),ctx.Rv=A.cap(ctx.rv)},
        text: "Three mares have been stolen from the herd of {fam}. The tracks lead toward {rv}. The young riders are already saddling. Theft is half a sport among the herders, but this time the herd was the family's best.",
        choices: [
          {
            t: "Ride after the thieves",
            check: {s:"tracking",s2:"riding",d:48},
            win: {
              r: "You find the mares in a hidden gully and bring them home, with a fourth for your trouble.",
              fx: X(p=>gain(p,sc(p,6)),{fame:2,skill:{tracking:2,riding:1}}),
            },
            lose: {
              r: "The trail splits on hard ground and you lose it. You come home with empty ropes.",
              fx: {happy:-4,wil:.5},
            },
          },
          {
            t: "Demand payment in horses at the council",
            check: {s:"persuasion",s2:"diplomacy",d:46},
            win: {
              r: "By the old law: horses for horses. {Rv} pays, grumbling, and the feud does not start.",
              fx: X(p=>gain(p,sc(p,4)),{honor:2,skill:{diplomacy:2}}),
            },
            lose: {r:"They deny it, and the council cannot prove it.",fx:{happy:-3,flag:"hs_feud"}},
          },
          {
            t: "Find out who really took them",
            check: {s:"intrigue",s2:"int",d:48},
            win: {
              r: "It was not {rv} at all, but a wandering rider who meant to start a feud. A war avoided.",
              fx: {fame:2,honor:3,skill:{intrigue:2}},
            },
            lose: {r:"You ask too many questions, and the family says you are soft.",fx:{happy:-3}},
          },
        ],
      },
      {
        id: "hs_orc_wintercount",
        cond: p=>AD(p)&&C.family(p)&&C.race(p,"orc","halforc")&&C.realm(p,"POL-11","POL-34"),
        cool: 8,
        title: "The winter-count",
        setup: (p,ctx)=>{fill(p,ctx),ctx.pic=A.pick(["the winter the lake froze to the bottom","the winter of the great horse theft","the winter the war-chief died","the winter the wolves came into camp"])},
        text: "Each winter, the shaman of {fam} paints one picture on the clan's winter-count, the great hide that holds the clan's years. Last winter will be {pic}. Unless something greater happens before the thaw.",
        choices: [
          {
            t: "Do something worthy of the hide",
            check: {s:"wil",s2:"ins",d:50},
            win: {
              r: "You ride into the snow and come back with a deed the whole clan talks about. The shaman paints you on the hide.",
              fx: {fame:4,deed:"Painted on the clan's winter-count",wil:1},
            },
            lose: {
              r: "You ride into the snow and come back frostbitten. The shaman paints the wolves.",
              fx: {wound:"frostbite",wil:1},
            },
          },
          {
            t: "Ask the shaman to read the old winters",
            r: "Two hundred pictures, one for every winter of the clan. You learn the story of your people.",
            fx: {int:.4,piety:2,skill:{learning:1}},
          },
          {
            t: "Help paint it",
            check: {s:"craft",s2:"int",d:40},
            win: {r:"Your line is steady. The shaman lets you paint the next one too.",fx:{skill:{craft:2},piety:2}},
            lose: {r:"A smudge on the clan's history. The shaman sighs deeply.",fx:{happy:-3}},
          },
        ],
      },
      {
        id: "hs_orc_mother",
        cond: p=>C.family(p)&&C.race(p,"orc","halforc")&&C.realm(p,"POL-11","POL-34")&&C.ageAdj(p)>=12,
        cool: 10,
        title: "Before the clan-mother",
        setup: (p,ctx)=>{fill(p,ctx),ctx.why=A.pick(["you won a fight you should not have started","a herd went missing on your watch","you are old enough to be counted","you were seen with a human trader"])},
        text: "The clan-mother of {fam} owns the herds and the tents and holds the law by heart. She has sent for you because {why}. She sits by the fire, and the fire makes you her guest: nobody may harm you here. Nobody needs to.",
        choices: [
          {
            t: "Tell her everything",
            r: "She listens, then speaks. It is not a punishment. It is a lesson, and it stings worse.",
            fx: {wil:.8,honor:2,skill:{diplomacy:1}},
          },
          {
            t: "Make her laugh",
            check: {s:"persuasion",s2:"int",d:38},
            win: {
              r: "She laughs until she coughs. You get off lightly, and she remembers your name.",
              fx: {happy:4,fame:1,newRel:{type:"mentor",op:25,back:"student"}},
            },
            lose: {r:"She does not laugh. You do not try again.",fx:{happy:-4}},
          },
          {
            t: "Ask her to teach you the law",
            r: "Her eyes narrow. Then she begins to recite: the Law of the Grass, the Law of the Fire. It takes all night.",
            fx: {int:.5,skill:{learning:2,diplomacy:1}},
          },
        ],
      },
      {
        id: "hs_orc_guest",
        cond: p=>AD(p)&&C.family(p)&&C.race(p,"orc","halforc"),
        cool: 10,
        title: "An enemy at the fire",
        setup: (p,ctx)=>{fill(p,ctx),ctx.rv=rivalOf(p),ctx.Rv=A.cap(ctx.rv);const x=mkOther(p,ctx.rv,{adj:C.ageAdj(p)+A.ri(-4,8),occ:"a rider of a feuding clan"});ctx.pid=x.id,sexWords(ctx,x)},
        text: "A storm, and a rider staggers to your fire: {themFull} of {rv}, the clan your family has been feuding with for two winters. By the Law of the Fire, anyone at your fire is your guest. To harm a guest is to become clanless.",
        choices: [
          {
            t: "Feed {themHim} and give {themHim} the best place",
            r: "You share meat and blood-milk. In the morning {them} rides away without a word. A week later, three of your stolen mares come home.",
            fx: {them:{type:"acquaint",op:20},honor:5,piety:2},
          },
          {
            t: "Feed {themHim}, and talk peace",
            check: {s:"diplomacy",s2:"wil",d:48},
            win: {
              r: "By dawn you have worked out a price in horses that ends the feud. The clan-mothers will be pleased.",
              fx: {them:{type:"friend",op:30},honor:4,fame:2,unflag:"hs_feud"},
            },
            lose: {r:"{them} eats, sleeps and leaves. The feud goes on, but the law was kept.",fx:{honor:3}},
          },
          {
            t: "Follow {themHim} after {theyHe} leaves the fire",
            r: "Outside the fire, the law does not protect {themHim}.",
            fx: {
              honor: -2,
              them: {type:"enemy",op:-40},
              duel: {foe:"them",opts:{kind:"duel",place:"the open steppe",lethal:!0,toYield:!1,title:"Beyond the fire"}},
            },
          },
        ],
      },
      {
        id: "hs_orc_herd_dowry",
        cond: p=>AD(p)&&C.family(p)&&C.race(p,"orc","halforc")&&!C.married(p)&&C.ageAdj(p)<36,
        cool: 10,
        title: "Horses for a match",
        setup: (p,ctx)=>{fill(p,ctx);const x=mkOther(p,allyOf(p),{sex:p.flags.likes||(p.sex==="M"?"F":"M"),adj:C.ageAdj(p)+A.ri(-3,3),occ:"a strong rider of a friendly clan"});ctx.pid=x.id,sexWords(ctx,x),ctx.n=A.pick(["twenty","thirty","forty"])},
        text: "The clan-mothers have spoken: {themFull}, {themOcc}, is a good match for you. Orc weddings are counted in horses, and the other clan asks {n}. Among orcs a husband joins his wife's clan as often as not.",
        choices: [
          {
            t: "Agree, and pay the horses",
            r: "The horses change hands, the clans feast, and you are wed. The herd is thinner. The clan is stronger.",
            fx: (p,ctx)=>{const t=T(ctx);return t&&!C.married(p)&&A.marry(p,t),pay(p,sc(p,15)),""},
          },
          {
            t: "Bargain the price down",
            check: {s:"trade",s2:"persuasion",d:46},
            win: {
              r: "Half the horses and a promise of grazing. Everyone is happy, mostly.",
              fx: (p,ctx)=>{const t=T(ctx);return t&&!C.married(p)&&A.marry(p,t),pay(p,sc(p,6)),""},
            },
            lose: {r:"The other clan is insulted. The match is off.",fx:{them:{type:"acquaint",op:-10},happy:-3}},
          },
          {
            t: "Refuse the match",
            r: "The clan-mothers are displeased. You will hear about it every winter.",
            fx: {happy:-1,honor:-1},
          },
        ],
      },
      {
        id: "hs_orc_clanless",
        cond: p=>AD(p)&&C.family(p)&&C.race(p,"orc","halforc"),
        w: .6,
        cool: 15,
        title: "Clanless",
        setup: (p,ctx)=>{fill(p,ctx),kinPid(p,ctx),ctx.crime=A.pick(["struck a guest at the fire","refused food to a guest","killed a shaman in a quarrel"])},
        text: "Your {cz} {them} {crime}. The clan-mothers have declared {themHim} clanless: no fire will feed {themHim}, no tent will shelter {themHim}. Tonight {theyHe} is at the edge of the camp, starving, and you are on watch.",
        choices: [
          {
            t: "Bring {themHim} food in secret",
            r: "You leave meat and milk behind a rock. If the clan-mothers find out, you will be next.",
            fx: {them:{type:"cousin",op:40},honor:-2,flag:"hs_fed_clanless"},
          },
          {
            t: "Turn your back",
            r: "You hear {themHim} walk away in the night. The law is the law.",
            fx: {wil:1,happy:-5},
          },
          {
            t: "Plead for {themHim} with the clan-mothers",
            check: {s:"persuasion",s2:"wil",d:55},
            win: {
              r: "A long night of talking. The clan-mothers set a price instead: fifty horses. The family pays.",
              fx: X(p=>pay(p,sc(p,10)),{them:{type:"cousin",op:40},honor:3}),
            },
            lose: {r:"The clan-mothers do not change their minds. They look at you more carefully.",fx:{happy:-4}},
          },
        ],
      },
      {
        id: "hs_orc_k_horse",
        cond: p=>KID(p)&&C.race(p,"orc","halforc"),
        cool: 6,
        title: "A horse from the clan-mother",
        setup: (p,ctx)=>{fill(p,ctx),ctx.horse=A.pick(["a shaggy grey yearling","a black colt with a white blaze","an old mare who has seen three wars"])},
        text: `The clan-mother of {fam} gives every child a horse when they are old enough to keep up with the herd. Today she leads out {horse} and puts the rope in your hand. "It is yours. It is also the clan's. Remember both."`,
        choices: [
          {
            t: "Ride it bareback at once",
            check: {s:"riding",s2:"spd",d:18},
            win: {r:"You gallop round the camp twice, whooping. The old riders cheer.",fx:{skill:{riding:3},happy:6}},
            lose: {r:"Thrown into the dung heap. The old riders cheer louder.",fx:{skill:{riding:1},health:-2,wil:.5}},
          },
          {
            t: "Sleep beside it all night",
            r: "By morning it knows your smell. It will come when you whistle for the rest of its life.",
            fx: {skill:{husbandry:2,riding:1},happy:3},
          },
          {
            t: "Give it a name from the winter-count",
            r: "The clan-mother nods: a good name, an old one. You are part of the story now.",
            fx: {piety:2,honor:1},
          },
        ],
      },
      {
        id: "hs_dw_vault",
        cond: p=>(AD(p)||TEEN(p))&&C.family(p)&&C.race(p,"dwarf"),
        cool: 10,
        title: "The ancestor vault",
        setup: (p,ctx)=>{fill(p,ctx),ancestor(p,ctx)},
        text: 'Deep under the hold, the vault of {fam} holds its dead in rock, each with their tools, and the clan genealogy carved on the walls. You are sent to clean the carving of {anc}, under which it says: "{ancDeed}"',
        choices: [
          {
            t: "Clean it with care and a prayer",
            r: "Hours in the cool dark, scraping soot from your ancestors' names. You come up feeling heavier, and older, and part of the stone.",
            fx: {piety:4,wil:.6,honor:2},
          },
          {
            t: "Read every name on the wall",
            check: {s:"learning",s2:"int",d:32},
            win: {
              r: "Four hundred years of the clan, name by name. You find a branch everyone forgot.",
              fx: {skill:{learning:3},int:.4,flag:"hs_found_branch"},
            },
            lose: {r:"The old runes are worn. You lose your place, and your lamp gutters out.",fx:{wil:.4}},
          },
          {
            t: "Look for the stone turned to the wall",
            r: "There is one: a name ground out, a stone turned face-in. Nobody will tell you who it was.",
            fx: {flag:"hs_knows_secret",int:.2},
          },
        ],
      },
      {
        id: "hs_dw_debt",
        cond: p=>AD(p)&&C.family(p)&&C.race(p,"dwarf"),
        w: .7,
        cool: 20,
        title: "The Debtors' Wall",
        setup: (p,ctx)=>{fill(p,ctx),ctx.age=A.pick(["two hundred","a hundred and forty","two hundred and sixty"]),ctx.sum=sc(p,40)},
        text: "Carved on the Debtors' Wall of the hold, among the names of the shamed, is one from {fam}: an ancestor who failed a contract {age} years ago. By the Deep Law the debt passes to the heirs. The Law-Carvers say {sum} suns would clear it.",
        choices: [
          {
            t: "Pay it and grind the name off the wall",
            req: (p,C2,ctx)=>p.coin>=(ctx&&ctx.sum||0),
            r: "The Law-Carvers smooth the stone with ceremony. Your clan walks a little straighter past the wall now.",
            fx: X((p,ctx)=>pay(p,ctx.sum),{honor:6,fame:2,deed:"Cleared the clan's name from the Debtors' Wall"}),
          },
          {
            t: "Pay a part each year",
            r: "A contract carved in stone: so much each Founding Day. Your grandchildren will finish it.",
            fx: X((p,ctx)=>pay(p,ctx.sum/6),{honor:3}),
          },
          {
            t: "Leave it. It was not your contract",
            r: "The Deep Law does not care what you think. The name stays. People notice that you walk past it.",
            fx: {honor:-2},
          },
        ],
      },
      {
        id: "hs_dw_secret",
        cond: p=>AD(p)&&C.family(p)&&C.race(p,"dwarf"),
        w: .7,
        cool: 15,
        title: "A leaked secret",
        setup: (p,ctx)=>{fill(p,ctx),kinPid(p,ctx)},
        text: "The Law-Carvers have found that a forge secret of {fam} has turned up in a human workshop. The trail leads to your {cz} {them}. If it is proved, {theyHe} will be exiled and {theirHis} name ground out of the vaults.",
        choices: [
          {
            t: "Speak for {themHim} at the hearing",
            check: {s:"persuasion",s2:"learning",d:52},
            win: {
              r: "You prove the human worked it out on his own. {them} is cleared, and the clan's honor with {themHim}.",
              fx: {them:{type:"cousin",op:45},honor:3,skill:{learning:2}},
            },
            lose: {
              r: "The evidence is carved, and carved evidence wins. {them} goes into exile.",
              fx: {them:{type:"cousin",op:20},happy:-6,wil:1},
            },
          },
          {
            t: "Testify against {themHim}",
            r: "You tell what you know. {them} is exiled, and you have to watch the name ground out.",
            fx: {them:{type:"enemy",op:-60},honor:2,happy:-8,wil:1.5},
          },
          {
            t: "Warn {themHim} to flee before the hearing",
            r: "{them} is gone by morning. The Law-Carvers know someone warned {themHim}.",
            fx: {them:{type:"cousin",op:40},honor:-3,flag:"hs_suspect"},
          },
        ],
      },
      {
        id: "hs_dw_naming",
        cond: p=>C.family(p)&&C.race(p,"dwarf")&&A.age(p)>=30&&A.age(p)<40,
        once: !0,
        title: "The name-carving",
        setup: (p,ctx)=>{fill(p,ctx)},
        text: "A dwarf's full name is carved in stone at thirty. Today yours goes on the wall of {fam}, beside your parents and their parents. The whole clan gathers. The carver asks what deed should be cut beneath your name.",
        choices: [
          {
            t: "Name a real deed, however small",
            r: "A small, true thing goes beneath your name. The elders approve: stone should not lie.",
            fx: {honor:3,wil:.6,piety:2},
          },
          {
            t: "Ask for no deed yet",
            r: '"Leave the space," you say. "I will fill it." The clan murmurs. A bold promise, carved in silence.',
            fx: {trait:"ambitious",wil:1,fame:1},
          },
          {
            t: `Name the clan's words instead: "{words}"`,
            r: "The carver nods. The family's words under your name. You are theirs, and they are yours.",
            fx: {honor:2,rel:{who:"father",op:8}},
          },
        ],
      },
      {
        id: "hs_dw_elder_veto",
        cond: p=>AD(p)&&C.family(p)&&C.race(p,"dwarf"),
        cool: 12,
        title: "The elder says no",
        setup: (p,ctx)=>{fill(p,ctx),headPid(p,ctx),ctx.plan=A.pick(["take work with a human merchant","marry outside the clan's chosen families","leave the hold for the surface","open your own forge"])},
        text: `A clan elder must agree to the great choices of a dwarf's life. You want to {plan}. {Head} hears you out, strokes {theirHis} beard, and says the word you were afraid of: "No."`,
        choices: [
          {
            t: "Bring a carved proposal",
            check: {s:"learning",s2:"persuasion",d:48},
            win: {
              r: "A proper contract, carved and witnessed, showing the profit to the clan. The elder reads it twice and agrees.",
              fx: {them:{op:10},skill:{learning:2},flag:"hs_free_path"},
            },
            lose: {r:"The elder finds a flaw in your carving. And in your reasoning.",fx:{happy:-4}},
          },
          {
            t: "Obey",
            r: "You put the plan away. Dwarves are patient. Forty years from now, you may ask again.",
            fx: {wil:1,them:{op:10}},
          },
          {
            t: "Do it anyway",
            r: "You do it. The clan does not forget. Neither does the elder.",
            fx: {them:{op:-30},honor:-2,trait:"stubborn",flag:"hs_rebel"},
          },
        ],
      },
      {
        id: "hs_dw_k_gallery",
        cond: p=>KID(p)&&C.race(p,"dwarf"),
        cool: 6,
        title: "The clan gallery",
        setup: (p,ctx)=>{fill(p,ctx)},
        text: "The family rooms of {fam} open off a long clan gallery cut in the rock, lit by lamps and warmed by the forges below. Every child of the clan plays there, and every adult watches. Today the bigger children dare you to go down the old shaft.",
        choices: [
          {
            t: "Go down the shaft",
            check: {s:"athletics",s2:"wil",d:22},
            win: {
              r: "Down into the dark, and back with a glowing crystal. The big children never dare you again.",
              fx: {skill:{athletics:2},wil:.5,happy:5},
            },
            lose: {
              r: "Your foot slips. A long scramble, a scraped knee, and an uncle with a lamp and a very loud voice.",
              fx: {health:-3,happy:-3,wil:.4},
            },
          },
          {
            t: "Tell them it is forbidden",
            r: "They call you a coward. An elder passing by calls you sensible. You prefer the elder.",
            fx: {honor:1},
          },
          {
            t: "Watch the forge-workers instead",
            r: "You spend the afternoon at the forge-grates, watching the hammers fall. Something about it calls to you.",
            fx: {skill:{craft:2}},
          },
        ],
      },
      {
        id: "hs_elf_tree",
        cond: p=>C.family(p)&&C.race(p,"elf")&&C.ageAdj(p)>=8,
        cool: 12,
        title: "Your birth tree",
        setup: (p,ctx)=>{fill(p,ctx),ctx.ill=A.pick(["beetles under the bark","a split from last winter's storm","a fungus on the north side","a woodcutter's axe-mark"])},
        text: "Every elf of {fam} is named under a birth tree, and the name is carved on its bark. Yours is sick: {ill}. The Keepers say it will live if someone of the blood tends it.",
        choices: [
          {
            t: "Tend it yourself, all season",
            check: {s:"survival",s2:"wil",d:30},
            win: {
              r: "A season of patience. By autumn the tree is putting out new leaves, and so, somehow, are you.",
              fx: {skill:{survival:2},piety:4,wil:.8,happy:4},
            },
            lose: {r:"The tree loses a great limb. It will live, scarred. So will you.",fx:{piety:2,wil:1,happy:-3}},
          },
          {
            t: "Ask a Keeper for help",
            r: "The Keeper works slowly and wordlessly. The tree recovers. The Keeper looks at you as if you should have known how.",
            fx: {piety:2,skill:{survival:1}},
          },
          {
            t: "Hunt down whoever harmed it",
            req: (p,C2,ctx)=>/axe/.test(ctx&&ctx.ill||""),
            r: "Cutting a marked tree is a crime under the Moot. You find the woodcutter and bring him before the grove elders.",
            fx: {honor:2,newRel:{type:"enemy",op:-25}},
          },
        ],
      },
      {
        id: "hs_elf_memory",
        cond: p=>AD(p)&&C.family(p)&&C.race(p,"elf"),
        cool: 12,
        title: "An elder remembers",
        setup: (p,ctx)=>{fill(p,ctx),ancestor(p,ctx);const x=kinPid(p,ctx,{adj:60,occ:"the eldest of the line"});ctx.eld=x.given},
        text: "{eld}, eldest of {fam}, is so old that {theyHe} remembers {anc} not as a story but as a face at the table. You sit with the old one under the oaks while {theyHe} talks, slowly, about people who have been dead for centuries.",
        choices: [
          {
            t: "Listen, for days",
            r: "You learn what the plaques leave out. It changes how you see the family, and the years.",
            fx: {int:.5,wil:.6,them:{type:"grandparent",op:25}},
          },
          {
            t: "Ask what the old one regrets",
            r: "A long silence. Then one story, told quietly. You carry it like a seed.",
            fx: {wil:1,them:{type:"grandparent",op:30}},
          },
          {
            t: "Write it all down",
            req: p=>p.literate,
            r: "Three seasons of writing. The family has a history now, and you are its keeper.",
            fx: {skill:{learning:3},fame:1,them:{type:"grandparent",op:20}},
          },
        ],
      },
      {
        id: "hs_elf_shiphouse",
        cond: p=>AD(p)&&C.family(p)&&C.race(p,"elf")&&C.realm(p,"POL-07"),
        cool: 10,
        title: "Ship-house duty",
        setup: (p,ctx)=>{fill(p,ctx)},
        text: "In Eldergrove the old families are ship-houses: long halls on the shore, a fleet of their own, and timber rights from the Keepers. {Fam} needs a hand on its longship for a season of patrols along the coast.",
        choices: [
          {
            t: "Take an oar",
            check: {s:"sea",s2:"sta",d:44},
            win: {
              r: "A season of salt and stars. You learn the chants and the bow from the deck.",
              fx: {skill:{sea:3,bow:2},sta:.4},
            },
            lose: {r:"Seasick for a month. By the end you are a sailor, of a sort.",fx:{skill:{sea:2},wil:.8}},
          },
          {
            t: "Learn the star-chants from the pilot",
            r: "The pilot sings the way by the stars. You learn a hundred verses and the shape of the coast.",
            fx: {skill:{sea:2,music:1},int:.3},
          },
          {
            t: "Stay ashore and keep the ship-house books",
            r: "Dull work, but you learn where the family's silver really comes from.",
            fx: {skill:{stewardship:2,trade:1}},
          },
        ],
      },
      {
        id: "hs_elf_halfblood",
        cond: p=>AD(p)&&C.family(p)&&C.race(p,"elf","halfelf"),
        cool: 15,
        title: "No tree for the child",
        setup: (p,ctx)=>{fill(p,ctx),kinPid(p,ctx,{adj:10})},
        text: "A half-elf child has been born to a cousin of {fam}: {them}. By custom a half-elf gets no birth tree, and will be buried outside the Oak Line like a stranger. The cousin asks the family to plant one anyway.",
        choices: [
          {
            t: "Plant a tree with your own hands",
            r: "A sapling, a name carved small, a prayer. The Keepers frown. The child will grow up with a tree, whatever anyone says.",
            fx: {them:{type:"nephew",op:40,back:"uncle"},honor:2,piety:-1},
          },
          {
            t: "Petition the Keepers",
            check: {s:"diplomacy",s2:"faith",d:52},
            win: {
              r: "The Keepers allow it, this once. A small change, after a thousand years.",
              fx: {them:{type:"nephew",op:40,back:"uncle"},fame:2,honor:3},
            },
            lose: {r:"The Keepers refuse. The custom stands.",fx:{happy:-5}},
          },
          {
            t: "The custom is the custom",
            r: "The child grows up knowing what you chose. So does the cousin.",
            fx: {them:{type:"nephew",op:-10,back:"uncle"},happy:-1},
          },
        ],
      },
      {
        id: "hs_gi_chant",
        cond: p=>(AD(p)||TEEN(p))&&C.family(p)&&C.race(p,"giant"),
        cool: 10,
        title: "The Mothers' Chant",
        setup: (p,ctx)=>{fill(p,ctx)},
        text: "In the halls, time is counted by the mothers. At the winter gathering the chanter recites every mother of every line of {fam}, back and back, and the whole hall listens in the firelight. This year you are asked to chant your own line.",
        choices: [
          {
            t: "Chant it without a slip",
            check: {s:"int",s2:"wil",d:38},
            win: {
              r: "Forty mothers, in order, in a voice that fills the hall. The eldest nods. That is everything.",
              fx: {fame:2,honor:3,skill:{music:1,learning:1}},
            },
            lose: {r:"You skip a mother. The hall goes cold. Someone has to finish it for you.",fx:{happy:-6,wil:.8}},
          },
          {
            t: "Sing it, not chant it",
            check: {s:"music",s2:"wil",d:40},
            win: {
              r: "A new way of an old thing. The young giants love it. The old ones pretend not to.",
              fx: {fame:2,skill:{music:3}},
            },
            lose: {r:"The old ones do not pretend. You are told to learn it properly.",fx:{happy:-4}},
          },
          {
            t: "Ask the chanter to teach you first",
            r: "A winter of learning by heart. You will never forget a single name.",
            fx: {int:.4,skill:{learning:2},piety:2},
          },
        ],
      },
      {
        id: "hs_gi_eldest",
        cond: p=>AD(p)&&C.family(p)&&C.race(p,"giant")&&notHead(p),
        cool: 10,
        title: "The eldest's test",
        setup: (p,ctx)=>{fill(p,ctx),headPid(p,ctx),ctx.test=A.pick(["carry a stone of the hall's founding to the shore and back","go a winter without eating seal","settle a quarrel between two tribute villages","bring back the tusk of a walrus bull"])},
        text: "The eldest of {fam} rules the hall and decides who is trusted. {Head} has set you a test: {test}. Every grown giant of the hall is watching.",
        choices: [
          {
            t: "Meet it with strength",
            check: {s:"str",s2:"sta",d:50},
            win: {
              r: "Done, and done well. The eldest grunts and gives you a place nearer the fire.",
              fx: {fame:2,str:.5,them:{op:15}},
            },
            lose: {r:"You fail, and the hall knows it. You will be tested again.",fx:{happy:-5,wil:1}},
          },
          {
            t: "Meet it with wit",
            check: {s:"int",s2:"diplomacy",d:48},
            win: {
              r: "You find a way the eldest did not think of. The hall laughs, and the eldest laughs loudest.",
              fx: {fame:2,int:.4,them:{op:15}},
            },
            lose: {r:"Too clever by half. The eldest is not amused.",fx:{them:{op:-10},happy:-3}},
          },
          {
            t: "Ask why",
            r: "The eldest stares, then explains. You learn more from the answer than from any test.",
            fx: {int:.3,them:{op:5}},
          },
        ],
      },
      {
        id: "hs_gi_thing",
        cond: p=>AD(p)&&C.family(p)&&C.race(p,"giant")&&!C.married(p)&&C.ageAdj(p)<40,
        cool: 10,
        title: "A match at the Thing",
        setup: (p,ctx)=>{fill(p,ctx);const x=mkOther(p,allyOf(p),{sex:p.flags.likes||(p.sex==="M"?"F":"M"),adj:C.ageAdj(p)+A.ri(-3,3),occ:"a giant of another hall"});ctx.pid=x.id,sexWords(ctx,x)},
        text: "Giant marriages are made at the Thing, where all the halls meet once every seven years. The elders of {fam} have spoken for you: {themFull}, {themOcc}. Every giant child is precious, and every match is the business of two whole halls.",
        choices: [
          {
            t: "Agree",
            r: "The halls feast for three days. You go home with a spouse and a new hall full of in-laws.",
            fx: (p,ctx)=>{const t=T(ctx);return t&&!C.married(p)&&A.marry(p,t),p.honor=A.clamp(p.honor+2,0,100),""},
          },
          {
            t: "Ask to wrestle {themHim} first, by old custom",
            check: {s:"unarmed",s2:"str",d:48},
            win: {
              r: "You win, and {them} laughs and says now {theyHe} is sure. The halls approve.",
              fx: (p,ctx)=>{const t=T(ctx);return t&&!C.married(p)&&A.marry(p,t),A.fame(p,1),""},
            },
            lose: {
              r: "{them} throws you into the snow. {He} does not seem interested in someone {theyHe} can throw.",
              fx: {them:{type:"acquaint",op:-5},happy:-4},
            },
          },
          {
            t: "Refuse",
            r: "The elders are disappointed. The next Thing is seven years away.",
            fx: {happy:-1,honor:-1},
          },
        ],
      },
      {
        id: "hs_gi_tribute",
        cond: p=>AD(p)&&C.family(p)&&C.race(p,"giant"),
        cool: 10,
        title: "The tribute-folk",
        setup: (p,ctx)=>{fill(p,ctx);const x=mkOther(p,"",{adj:45,occ:"headman of a tribute village"});x.race="human",ctx.pid=x.id,sexWords(ctx,x)},
        text: "The humans who live below the hall of {fam} owe it thirty days of work a year, and fish, and barley. {themFull}, {themOcc}, kneels at your feet, which puts {themHim} about level with your knee. The catch has failed. The village cannot pay.",
        choices: [
          {
            t: "Forgive the tribute this year",
            r: "The village eats. The hall goes a little hungrier. The headman will not forget it.",
            fx: {them:{type:"friend",op:35},honor:3,piety:2},
          },
          {
            t: "Take half, and help with the boats",
            r: "You spend a week wading in the cold surf, hauling nets for small people. They are grateful, and amazed.",
            fx: {them:{type:"friend",op:25},str:.4,sta:.4},
          },
          {
            t: "Demand it in full",
            r: "They pay. Children go hungry in the turf huts below. The hall eats well.",
            fx: {them:{type:"enemy",op:-30},honor:-3},
          },
        ],
      },
      {
        id: "hs_gi_k_shown",
        cond: p=>KID(p)&&C.race(p,"giant"),
        once: !0,
        title: "Shown to the hall",
        setup: (p,ctx)=>{fill(p,ctx)},
        text: "Every giant child is shown to the whole hall of {fam}, so the hall knows its size. You stand on the long table while forty giants look at you, and the eldest measures you with a knotted cord.",
        choices: [
          {
            t: "Stand as tall as you can",
            r: 'The eldest laughs and adds a knot. "This one will be big." The whole hall cheers.',
            fx: {happy:5,wil:.3},
          },
          {
            t: "Wave to everyone",
            r: "Forty giants wave back. You decide you like the hall very much.",
            fx: {happy:4,skill:{diplomacy:1}},
          },
          {
            t: "Hide behind your mother's leg",
            r: "The hall laughs kindly. Every giant child does that. Every one.",
            fx: {happy:1},
          },
        ],
      },
      {
        id: "hs_hd_first",
        cond: p=>AD(p)&&C.famHead(p),
        once: !0,
        w: 2,
        title: "Head of the family",
        setup: (p,ctx)=>{fill(p,ctx),ctx.hook=hookOf(p)},
        text: "The family gathers at {seat}, and for the first time every eye turns to you. You are the head of {fam} now: its purse, its quarrels, its honor and its secrets. The first matter on the table is the old one. {hook}",
        choices: [
          {
            t: "Take it on yourself, at once",
            check: {s:"stewardship",s2:"wil",d:46},
            win: {
              r: "You make a decision before supper and stand by it. The family relaxes. Someone is in charge.",
              fx: {fame:2,honor:2,skill:{stewardship:2},wil:.6},
            },
            lose: {
              r: "Your first decision is a bad one, and everyone knows it by the next morning. You will have to earn them back.",
              fx: {happy:-5,wil:1},
            },
          },
          {
            t: "Ask the elders' counsel first",
            r: "The old ones are flattered and helpful. The young ones think you weak. A head must please both, and cannot.",
            fx: {skill:{diplomacy:2},honor:1},
          },
          {
            t: "Throw a feast and leave business for tomorrow",
            r: "A great feast in your honor. The family drinks to you, and tomorrow the matter is still there, waiting.",
            fx: X(p=>pay(p,sc(p,8)),{happy:6,fame:1}),
          },
        ],
      },
      {
        id: "hs_hd_purse",
        cond: p=>AD(p)&&C.famHead(p),
        cool: 6,
        title: "The family purse",
        setup: (p,ctx)=>{fill(p,ctx),ctx.a=A.pick(["a cousin wants money for a new boat","an aunt wants a new roof","a nephew wants to study abroad","the old retainers want their pensions raised"]),ctx.b=A.pick(["the debts to the bankers are due","the family hall needs repairs","the dowry chest is empty","the lawyers want their fee"]),ctx.sum=sc(p,10)},
        text: "As head of {fam}, the family's money passes through your hands. This year, {a}, and also {b}. There is enough for one, not both: about {sum} suns either way.",
        choices: [
          {
            t: "Pay the debts and repairs first",
            r: "The sensible choice. The cousin, the aunt or the nephew sulks for a year.",
            fx: X((p,ctx)=>pay(p,ctx.sum),{honor:2,skill:{stewardship:2}}),
          },
          {
            t: "Help the family member",
            r: "They are overjoyed. The debts wait, and grow.",
            fx: X((p,ctx)=>pay(p,ctx.sum),{newRel:{type:"friend",op:30},flag:"hs_debts_wait"}),
          },
          {
            t: "Find the money for both",
            check: {s:"stewardship",s2:"trade",d:50},
            win: {
              r: "A clever loan, a sale of old silver, some hard bargaining. Both are done.",
              fx: X((p,ctx)=>pay(p,ctx.sum/2),{skill:{stewardship:3,trade:2},fame:1}),
            },
            lose: {r:"You try to do both and do neither well.",fx:X((p,ctx)=>pay(p,ctx.sum),{happy:-4})},
          },
        ],
      },
      {
        id: "hs_hd_discipline",
        cond: p=>AD(p)&&C.famHead(p),
        cool: 8,
        title: "A wayward member",
        setup: (p,ctx)=>{fill(p,ctx),kinPid(p,ctx,{adj:Math.max(16,C.ageAdj(p)-A.ri(5,15))}),ctx.sin=A.pick(["gambled away a farm","been brawling in every tavern in {town}","insulted the liege's steward","run up debts in the family name","been seen with a married woman"]),ctx.sin=rs(p,ctx,ctx.sin)},
        text: "Your young {cz} {them} has {sin}. The family expects you, as head, to deal with it. {them} stands before you, sullen and frightened.",
        choices: [
          {
            t: "Punish {themHim} severely",
            r: "Cut off, sent to the worst family post. {them} hates you. The family respects you.",
            fx: {them:{type:"cousin",op:-30},honor:2,skill:{intimidation:2}},
          },
          {
            t: "Talk to {themHim}, and give a second chance",
            check: {s:"persuasion",s2:"diplomacy",d:44},
            win: {
              r: "Something gets through. {them} straightens out, and is loyal to you for life.",
              fx: {them:{type:"cousin",op:40},honor:1},
            },
            lose: {
              r: "{them} nods and promises, and is back in the taverns by Midsummer.",
              fx: {them:{type:"cousin",op:10},happy:-3},
            },
          },
          {
            t: "Pay off the damage and say nothing",
            r: "The problem goes away. {them} learns that the family will always pay.",
            fx: X(p=>pay(p,sc(p,6)),{them:{type:"cousin",op:20}}),
          },
        ],
      },
      {
        id: "hs_hd_peace",
        cond: p=>AD(p)&&C.famHead(p),
        cool: 12,
        title: "An end to it",
        setup: (p,ctx)=>{fill(p,ctx),ctx.rv=rivalOf(p),ctx.Rv=A.cap(ctx.rv);const x=mkOther(p,ctx.rv,{adj:C.ageAdj(p)+A.ri(-5,10),occ:"head of the rival family"});ctx.pid=x.id,sexWords(ctx,x)},
        text: "{themFull}, {themOcc}, has sent word: {theyHe} is tired, the feud between {fam} and {rv} has cost both families too much, and {theyHe} will meet you at the temple, alone and unarmed.",
        choices: [
          {
            t: "Go, and make peace",
            check: {s:"diplomacy",s2:"wil",d:48},
            win: {
              r: "Two old enemies clasp hands. Some of your family call you a traitor. Their grandchildren will call you wise.",
              fx: {them:{type:"friend",op:30},honor:5,fame:3,unflag:"hs_feud",deed:"Ended an old family feud"},
            },
            lose: {
              r: "You meet and talk, and the old grievances come up one by one until there is nothing left to say.",
              fx: {them:{type:"rival",op:-10},happy:-4},
            },
          },
          {
            t: "Go, but bring men",
            r: "{them} sees your men and leaves without a word. The feud will go on.",
            fx: {them:{type:"enemy",op:-30},honor:-3,flag:"hs_feud"},
          },
          {
            t: "Do not go",
            r: "The temple waits for you all day. {them} goes home and tells everyone that {fam} wanted war.",
            fx: {them:{type:"enemy",op:-20},honor:-2},
          },
        ],
      },
      {
        id: "hs_hd_secret",
        cond: p=>AD(p)&&C.famHead(p),
        w: .8,
        cool: 15,
        title: "Keeper of the secret",
        setup: (p,ctx)=>{fill(p,ctx),ctx.secret=secretOf(p);const x=mkOther(p,"",{adj:C.ageAdj(p)+A.ri(-5,10),occ:"someone who knows too much"});ctx.pid=x.id,sexWords(ctx,x),ctx.sum=sc(p,25)},
        text: "Every head of {fam} learns the family secret on the day they take the chair. {secret} Now {themFull} has found it out, and wants {sum} suns to keep quiet.",
        choices: [
          {
            t: "Pay",
            r: "{them} takes the money. {He} will be back. They always come back.",
            fx: X((p,ctx)=>pay(p,ctx.sum),{them:{type:"enemy",op:-10},flag:"hs_blackmailed"}),
          },
          {
            t: "Find something on {themHim} in return",
            check: {s:"intrigue",s2:"int",d:50},
            win: {
              r: "{them} has secrets too. A quiet conversation, and you both agree to forget.",
              fx: {skill:{intrigue:3},them:{type:"enemy",op:-20}},
            },
            lose: {
              r: "{them} has no secrets you can find. {He} names a higher price.",
              fx: X((p,ctx)=>pay(p,ctx.sum*1.5),{happy:-4}),
            },
          },
          {
            t: "Let it come out, on your terms",
            r: "You tell the truth yourself, before {them} can. The family is shaken. The blackmailer is left with nothing.",
            fx: {honor:4,fame:-1,wil:1.2},
          },
        ],
      },
      {
        id: "hs_hd_petitions",
        cond: p=>AD(p)&&C.famHead(p),
        cool: 5,
        title: "Cousins at the door",
        setup: (p,ctx)=>{fill(p,ctx)},
        text: "Being head of {fam} means every cousin with a problem comes to your door: a quarrel over a hedge, a child who needs a place, a sick mother, a lawsuit, a wedding. This week there are seven of them.",
        choices: [
          {
            t: "Hear every one, patiently",
            r: "Seven days, seven problems, seven grateful cousins. You are exhausted, and the family is a little more whole.",
            fx: {honor:3,skill:{diplomacy:2,stewardship:1},happy:-2},
          },
          {
            t: "Hand them to a steward",
            r: "The steward is efficient and cold. The cousins grumble that you have grown too grand.",
            fx: {happy:2,honor:-1},
          },
          {
            t: "Solve them with money",
            r: "Everything gets solved. The family purse is lighter, and the cousins learn to bring more problems.",
            fx: X(p=>pay(p,sc(p,10)),{newRel:{type:"friend",op:20}}),
          },
        ],
      },
      {
        id: "hs_hd_matches",
        cond: p=>AD(p)&&C.famHead(p)&&C.ageAdj(p)>=30,
        cool: 8,
        title: "Matchmaking",
        setup: (p,ctx)=>{fill(p,ctx),kinPid(p,ctx,{adj:18}),ctx.al=allyOf(p),ctx.Al=A.cap(ctx.al),ctx.rv=rivalOf(p),ctx.Rv=A.cap(ctx.rv)},
        text: "Your young {cz} {them} is of an age to marry, and as head of {fam} it is for you to arrange it. {Al} would strengthen an old friendship. {Rv} would end a feud. And {them} has made it very clear that {theyHe} loves a miller's child.",
        choices: [
          {
            t: "Match {themHim} with {al}",
            r: "A good match, and {them} accepts it gracefully enough.",
            fx: {them:{type:"cousin",op:-5},honor:2,skill:{diplomacy:1}},
          },
          {
            t: "Match {themHim} with {rv}",
            check: {s:"diplomacy",s2:"persuasion",d:50},
            win: {
              r: "A wedding that ends a feud. Both families weep, for different reasons.",
              fx: {fame:2,honor:3,unflag:"hs_feud"},
            },
            lose: {r:"The other family refuses. The feud is worse for being offered.",fx:{happy:-3,flag:"hs_feud"}},
          },
          {
            t: "Let {themHim} marry for love",
            r: "The family is scandalized. {them} is radiant. The miller's child turns out to be very good with money.",
            fx: {them:{type:"cousin",op:40},honor:-1,happy:4},
          },
        ],
      },
      {
        id: "hs_hd_legacy",
        cond: p=>C.famHead(p)&&C.old(p),
        cool: 10,
        title: "What they will say",
        setup: (p,ctx)=>{fill(p,ctx)},
        text: "You are old now, and you have been head of {fam} for a long time. One evening the younger ones ask you what you want to leave behind. It is a good question. It keeps you awake.",
        choices: [
          {
            t: "A family that is richer than you found it",
            check: {s:"stewardship",s2:"trade",d:46},
            win: {
              r: "You spend your last years putting the family's affairs in perfect order. The next head will bless your name.",
              fx: X(p=>gain(p,sc(p,10)),{fame:2,skill:{stewardship:2}}),
            },
            lose: {r:"The affairs are tangled beyond untangling. You do what you can.",fx:{wil:.8}},
          },
          {
            t: "A family that is kinder than you found it",
            r: "You make peace with old enemies and help the poorest cousins. The family remembers a kind head.",
            fx: {honor:5,piety:3,happy:5},
          },
          {
            t: "A great deed in the family book",
            r: "You write it all down, the good and the bad. The next generation will read it and know who you were.",
            fx: {fame:1,wil:.6,deed:"Wrote the family's history"},
          },
        ],
      },
      {
        id: "hs_hd_liege",
        cond: p=>AD(p)&&C.famHead(p)&&C.famKind(p,"noble","gentry_mil","gentry","merchant","clergy","horse","hunt","sea"),
        cool: 10,
        title: "The liege's demand",
        setup: (p,ctx)=>{fill(p,ctx),ctx.want=KT(p,{noble:"twice the usual levy",gentry_mil:"every man of the family unit, at once",merchant:"a loan without interest",clergy:"prayers and a tithe for the war",horse:"the whole year's foals",hunt:"every hunter in the family for a war",sea:"every family ship for a season",def:"more than the family can give"})},
        text: "A letter from {lg}, to you as head of {fam}: the realm needs {want}. Refusing a liege is dangerous. Agreeing could break the family.",
        choices: [
          {
            t: "Give what is asked",
            r: "The family is stretched thin. The liege is pleased, and will remember.",
            fx: X(p=>pay(p,sc(p,15)),{favor:15,honor:2}),
          },
          {
            t: "Bargain for less",
            check: {s:"diplomacy",s2:"persuasion",d:50},
            win: {
              r: "Half of what was asked, and a promise of reward later. A head's first duty is to the family.",
              fx: X(p=>pay(p,sc(p,6)),{favor:5,skill:{diplomacy:2}}),
            },
            lose: {
              r: "The liege is offended. You give everything, and get no thanks.",
              fx: X(p=>pay(p,sc(p,15)),{favor:-5}),
            },
          },
          {
            t: "Refuse",
            r: "A dangerous answer. The liege does not reply. The silence lasts all winter.",
            fx: {favor:-15,honor:1,flag:"hs_suspect"},
          },
        ],
      },
      {
        id: "hs_hd_successor",
        cond: p=>C.famHead(p)&&C.ageAdj(p)>=40&&(kidsOf(p).filter(c=>A.isAdult(c)).length>=2||kidsOf(p).length===0&&C.ageAdj(p)>=50),
        cool: 15,
        title: "Who comes after",
        setup: (p,ctx)=>{fill(p,ctx);const k=kidsOf(p).filter(c=>A.isAdult(c));if(k.length){const c=A.pick(k);ctx.pid=c.id,sexWords(ctx,c),ctx.who="your "+ctx.sd+" "+c.given}else kinPid(p,ctx,{adj:28}),ctx.who="your "+ctx.ln+" "+T(ctx).given},
        text: "You will not be head of {fam} forever. By law and custom, the next head should be the eldest. But {who} is the one you trust. Choosing openly will split the family. Not choosing may split it worse.",
        choices: [
          {
            t: "Name {them} your heir openly",
            r: "There is shouting at {seat}. Then grumbling. Then, slowly, acceptance. {them} will be ready.",
            fx: {them:{op:30},honor:1,flag:"hs_heir_named"},
          },
          {
            t: "Follow the law and name the eldest",
            r: "No surprises. The family is calm. {them} is quietly disappointed.",
            fx: {them:{op:-10},honor:3},
          },
          {
            t: "Train {them} without saying anything",
            r: "You give {them} more and more to do. When the day comes, everyone will already know.",
            fx: {them:{op:20},skill:{intrigue:1,stewardship:1}},
          },
        ],
      },
    ]);
  })();
})();
