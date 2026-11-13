// The release's event pack 20 of 30 (159 events, mostly sc_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-027). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  (function(){
    const R = (p,...ids)=>ids.includes(p.realm),
      home = p=>A.provName(p.home),
      capOf = p=>{const r=A.realm(p.realm);return r&&r.capital||"the capital"},
      rTitle = p=>{const r=A.realm(p.realm);return r&&r.title?r.title.split(" / ")[0]:"lord"},
      nm = (p,sex)=>{try{return A.givenName(p.cult,sex||(A.chance(.5)?"M":"F"))||"Tam"}catch{return"Tam"}},
      enemyOf = p=>{try{const e=A.enemyRealmOf(p.realm);return e&&e!==p.realm?A.realmShort(e):"the next realm"}catch{return"the next realm"}},
      SUNLAND = ["POL-02","POL-03","POL-04","POL-15","POL-16","POL-31"],
      WELL = ["POL-17","POL-19","POL-24","POL-32"],
      ORC = ["POL-11","POL-34"],
      STEPPE = ["POL-11","POL-12","POL-34"],
      DWARF = ["POL-10","POL-28","POL-29"],
      ELF = ["POL-06","POL-07"],
      GIANT = ["POL-09","POL-23"],
      F = (p,ctx,fx)=>{const s=A.applyFx(p,fx,ctx||{});return typeof s=="string"?s:""},
      J = (p,...k)=>!!p.job&&k.includes(p.job.c);
    function who(p,ctx,kind,occ,sex){const q=A.makeAcquaintance(p,kind||"acquaint");if(occ&&(q.occ=occ),sex&&q.sex!==sex){q.sex=sex;try{q.given=A.givenName(q.cult,sex)||q.given}catch{}}return ctx.pid=q.id,ctx.They=A.cap(A.he(q)),ctx.Their=A.cap(A.his(q)),ctx.they=A.he(q),ctx.their=A.his(q),q}
    function greatHouse(p,q,ctx){let hs=[];try{hs=Object.values(A.S&&A.S.houses||{}).filter(h2=>h2&&h2.realm===p.realm&&!h2.extinct&&h2.great!==!1&&h2.id!==p.house&&["noble","military","royal"].includes(h2.kind))}catch{hs=[]}const h=hs.length?A.pick(hs):null;if(h&&q){q.house=h.id;try{q.sur=A.houseSurname(h),q.surMode="house"}catch{}q.status=h.kind==="royal"?"royal":"noble"}return ctx.house=h?h.name:A.pick(["an old house of the realm","one of the great houses","a house older than the crown"]),ctx.hof=q?hofOf(q):"",h}
    function bout(p,ctx,o){let foe=null;if(o.them&&ctx&&ctx.pid){const t=A.P(ctx.pid);t&&t.alive&&t.id!==p.id&&A.isAdult(t)&&(foe=t)}const mounted=!!o.joust&&!!(p.gear&&p.gear.mount);return foe||(foe=A.makeOpponent(p,o.champ?"champion":o.spar?"spar":"foe",o.tier),o.occ&&(foe.occ=o.occ),mounted&&(foe.gear.mount="destrier",foe.gear.weapon="lance",foe.skills.lance=A.ri(25,55)+(o.tier||2)*5,foe.skills.riding=A.ri(30,60)),o.weapon&&(foe.gear.weapon=o.weapon)),A.startDuelFront(p,foe,{kind:o.k||"duel",place:o.place||"the yard",lethal:!!o.lethal,toYield:o.toYield!==!1,mounted,title:o.title||"",foeMods:o.foeMods||null}),""}
    const beastOf = (p,ctx)=>{let b=null;try{const n=A.beastsNear(p);b=n&&n.length?A.pick(n):null}catch{b=null}ctx.beast=b||"CRE-25";const c=(LORE.creatures||[]).find(x=>x.id===ctx.beast);return ctx.bname=c&&c.name?c.name:"a great beast",ctx.bwhere=(A.BEASTS[ctx.beast]||{}).where||"the wilds",ctx.beast},
      hofOf = q=>{const h=q&&q.house&&A.house(q.house)?A.house(q.house):null;return h?q.sur&&String(h.name).indexOf(q.sur)>=0?", of the great house of that name,":`, of ${h.name},`:""},
      GANG = {
        "POL-01": ["the Quay Dogs","Wat Hallam","the Horsefair"],
        "POL-02": ["the Brass Badge men","Nico of the Saltings","the Pilgrims' Quarter"],
        "POL-03": ["the Shears","","Bluewater"],
        "POL-04": ["the Pile-Rats","Old Benno Marin","the warehouse piles"],
        "POL-05": ["Old Tib Marrow's lads","Old Tib Marrow","the Wool Market"],
        "POL-08": ["the Boathouse Strand crews","Hakon Gull","the Boathouse Strand"],
        "POL-14": ["the Galley Strand wreckers","Hawise Tapper","the Galley Strand"],
        "POL-15": ["the Lantern Lads","","the Harbor Town"],
        "POL-16": ["the pickpockets of the Exchange","","the Exchange"],
        "POL-17": ["the Sieve's people","Samira the Sieve","the Rag Market"],
        "POL-18": ["the Granary Mice","","the Boatmen's Quay"],
        "POL-20": ["the Salt Cats","Ekon Saltfoot","the East Gate"],
        "POL-21": ["the Wet Hands","Old Mwita","Stilt Town"],
        "POL-24": ["the Ropewalk Brothers","","the harbor"],
        "POL-25": ["the Marten Boys","Ivo Shortcoat","the Staple yard"],
        "POL-26": ["the Shore Town crews","","the Wax Market"],
        "POL-30": ["the Lotus Knives","","the Cotton Bazaar"],
        "POL-31": ["the Leontine Men","Mother Agna Coyle","the Refugee Field"],
        "POL-32": ["the Creek Boys","","the back channels"],
      };
    function gangOf(p,ctx){const g=GANG[p.realm];return ctx.gang=g?g[0]:A.pick(["the Lamp Street crew","the Bridge Rats","the Mill-race boys","the Tallow Lane lot","the Gutter Saints","the Tanners' Yard crew"]),ctx.boss=g&&g[1]?g[1]:nm(p,A.chance(.7)?"M":"F"),ctx.Gang=A.cap(ctx.gang),ctx.quarter=g?g[2]:A.pick(["the fish market","the river stairs","the tanners' quarter","the horse market","the street of the coopers"]),ctx}
    const neutralGround = p=>R(p,...SUNLAND)?"the steps of the sun temple, within reach of the bell-rope":R(p,...WELL)?"the public well, where no feud may be pursued":R(p,...ORC)?"a clan fire, where every guest is safe":R(p,...DWARF)?"the tally hall, before a Law-Carver":"the guildhall floor on a feast day",
      WEBM = {
        "POL-01": "Lady Ysolde Ravenscar",
        "POL-03": "Oria Vantes",
        "POL-04": "Nerio Doravelli",
        "POL-05": "Faelan Greyholt",
        "POL-12": "Duran the Oil-Master",
        "POL-14": "Merrick Fenn",
        "POL-17": "Rafiq the Quiet",
        "POL-21": "Faraji Keshari",
        "POL-24": "Faisal the Broker",
        "POL-25": "Vera Belak",
        "POL-26": "Nadia Lark",
        "POL-31": "Simeon Hark",
        "POL-34": "Dorn Twotongue",
      };
    function webOf(p,ctx){return ctx.spymaster=WEBM[p.realm]||`the ${rTitle(p)}'s master of whispers`,p.job&&p.job.r>=2?(ctx.handler=ctx.spymaster,ctx.hdesc=`who answers only to the ${rTitle(p)}`):(ctx.handler="your handler",ctx.hdesc=A.pick(["a grey clerk who calls himself the Notary","a widow who sells candles","a one-eyed ferryman","a priest who never blesses anyone"])),ctx.Handler=A.cap(ctx.handler),ctx.foreign=enemyOf(p),ctx}
    const SECRET = {
        "POL-12": ["where the fire-oil seeps lie","Betraying the seeps is death, and banishment for the family."],
        "POL-14": ["the pilots' lodestone needle","A pilot who shows the lodestone is drowned."],
        "POL-17": ["how Qadira makes its paper","A paper worker who goes abroad is outlawed and his family fined."],
        "POL-29": ["the making of crucible steel","A leaked forge secret means exile, and a name turned to the wall."],
        "POL-10": [
          "the forge-marks of the deep smiths",
          "A leaked forge secret means exile and a name ground out of the vaults.",
        ],
        "POL-28": [
          "the gem ledgers of the lower gates",
          "A leaked secret means a name carved on a stone turned to the wall.",
        ],
        "POL-24": ["the Oil Shore, and the Emir's gate token","Entering the Oil Shore without the token is death."],
        "POL-32": ["the clove and nutmeg seedlings","Seedlings off the Isles mean death."],
        "POL-03": ["the Palella spinning wheel","Teaching the spinning wheel abroad hangs a man."],
        "POL-33": ["the dragon of the Strait","Telling the dragon's secret means drowning with a stone."],
        "POL-30": [
          "the Chanari steel",
          "The Chanari smiths teach only their own sons, and the crown hangs anyone who sells their secret.",
        ],
      },
      LISTS = {
        "POL-01": "the Lance Yard of Kingsmere",
        "POL-03": "the Hall of the Lion in Varenna",
        "POL-31": "the Calossa Lance Yard",
        "POL-02": "Noon Hall at Solenne",
      },
      lists = p=>LISTS[p.realm]||`the great lists at ${capOf(p)}`,
      PIT = {
        "POL-33": "the beach below the Dice Yard",
        "POL-11": "the wrestling ground at the Drum Stones",
        "POL-34": "the wrestling ring at Grakmar",
        "POL-12": "the wrestling ground of the kurultai",
        "POL-04": "a cellar under the fish market",
        "POL-16": "the cellar pit behind the Exchange",
        "POL-21": "a sand ring in Stilt Town",
        "POL-17": "a ring of rag bales by the Rag Market",
        "POL-08": "the shingle below the boathouses",
      },
      pit = p=>PIT[p.realm]||A.pick(["the pit behind the tannery","the cellar under the Bell","a ring of hay bales in the horse market","the old cockpit by the river stairs"]),
      punch = p=>R(p,...ORC)?"an orc of the relay riders, blown after ten minutes and terrible before":p.race==="giant"?"a tribute-folk strongman half your size":A.pick(["a half-orc docker with a broken nose","a quarryman with forearms like hams","a deserter who fights dirty","a farmhand who thinks he can box"]),
      AC_HEAD = {
        war: "the Commandant",
        letters: "the Master of the College",
        medicine: "the Senior Physician",
        faith: "the Rector",
        trade: "the Warden of the Hall",
        crafts: "the guild master",
        sea: "the Master Pilot",
        arts: "the Master of Song",
      },
      WPN = {
        sword: "sword",
        spear: "spear",
        axe: "axe",
        lance: "lance",
        bow: "bow",
        xbow: "crossbow",
        unarmed: "bare hands",
        shield: "shield",
        dagger: "knife",
        dualwield: "two blades",
        mounted: "horse and lance",
        riding: "horse",
        stealth: "silence",
        sea: "oar",
        tactics: "drum",
        command: "voice",
        throwing: "javelin",
        athletics: "rope",
        tracking: "trail",
        siegecraft: "pick",
        melee: "staff",
      },
      theName = n=>(n=String(n||""),/^The /.test(n)?"the "+n.slice(4):/^the /.test(n)?n:"the "+n),
      stOf = p=>{try{return p.school&&p.school.style?A.style(p.school.style):null}catch{return null}},
      fightSch = (p,C)=>C.atSchool(p,"style")||C.atSchool(p,"chain")||C.atSchool(p)&&!p.school.kind,
      acad = (p,C,...k)=>C.atSchool(p,"academy")&&(!k.length||k.includes(p.school.academy)),
      sk = p=>{const st=stOf(p),s=p.school;return st&&st.prof&&GD.SKILLS[st.prof]?st.prof:s&&s.skill&&GD.SKILLS[s.skill]?s.skill:"melee"},
      acP = p=>{const T=p.school&&GD.ACADEMY_TYPES[p.school.academy];return T?T.profs:["learning","persuasion"]},
      myRank = p=>{const st=stOf(p);return st&&p.styles&&p.styles[st.id]?p.styles[st.id].rank||1:p.school&&p.school.rank||1};
    function scx(p,ctx){const s=p.school||{},st=stOf(p),n=theName(s.name||(s.kind==="academy"?"the college":"the school"));ctx.school=n,ctx.School=A.cap(n);const m=s.master||st&&st.school&&st.school.master||(s.kind==="academy"?AC_HEAD[s.academy]||"the Master":"the master");ctx.master=m,ctx.Master=A.cap(m);const k=sk(p);ctx.art=st?String(st.name).replace(/^The /,"the "):String(GD.SKILLS[k]||"the art").toLowerCase(),ctx.wpn=WPN[k]||"blade",ctx.seat=st&&st.school&&st.school.seat||s.seat||home(p);const r=myRank(p);ctx.srank=st?A.styleRankName(st,r):GD.STYLE_RANKS[r-1]||"Student",ctx.nrank=st?A.styleRankName(st,Math.min(5,r+1)):GD.STYLE_RANKS[Math.min(4,r)]||"Adept";const ny=(s.years||0)+1;return ctx.years=String(ny),ctx.yrs=ny===1?"a single year":`${ny} years`,ctx}
    function classmate(p,ctx,type,house){let q=null;try{const id=p.school&&p.school.id,xs=A.relsOf(p,[type]).filter(x=>x.p.alive&&x.p.flags&&x.p.flags.classmate&&x.p.flags.classmate===id);xs.length&&(q=A.pick(xs).p)}catch{q=null}q||(q=A.makeAcquaintance(p,type==="rival"?"rival":"friend"),house&&greatHouse(p,q,ctx),q.occ="a student at "+(ctx.school||"the school"),p.school&&p.school.id&&(q.flags.classmate=p.school.id));const hh=q.house&&A.house(q.house)?A.house(q.house):null;return ctx.house=hh?hh.name:ctx.house||"a family of the town",ctx.hof=hofOf(q),ctx.pid=q.id,ctx.They=A.cap(A.he(q)),ctx.Their=A.cap(A.his(q)),ctx.they=A.he(q),ctx.their=A.his(q),q}
    function teachTech(p,fb){const st=stOf(p);if(!st||!(st.techniques||[]).length)return A.trainSkill(p,sk(p),3),fb||"";let known=new Set;try{known=new Set(A.techsOf(p).map(x=>x.t.id))}catch{known=new Set}const r=myRank(p),cand=st.techniques.filter(t2=>!known.has(t2.id)&&t2.rank<=r+1);if(!cand.length)return A.styleXp(p,st.id,20),fb||"";const t=A.pick(cand);return p.techs=p.techs||[],p.techs.push({sid:st.id,tid:t.id}),`You learn ${t.name}${t.desc?": "+String(t.desc).replace(/\.$/,""):""}.`}
    function learnOther(p,fb){let c=[];try{c=A.allStyles().filter(s2=>s2&&s2.realm===p.realm&&s2.kind!=="household"&&!(p.school&&s2.id===p.school.style)&&!(p.styles&&p.styles[s2.id]))}catch{c=[]}if(!c.length)return A.trainSkill(p,A.pick(["dagger","unarmed","spear","shield"]),3),fb||"";const s=A.pick(c);return A.learnStyle(p,s.id,1),`It is ${String(s.name).replace(/^The /,"the ")}, and now you have its first move.`}
    const isFight = p=>!!p.school&&p.school.kind!=="academy",
      SB = (p,w)=>{const k=sk(p);return k==="melee"?0:Math.max(0,(A.skill(p,k)-A.skill(p,"melee"))*w)},
      houseStyleOf = p=>{try{for(const id in p.styles||{}){const s=A.style(id);if(s&&s.kind==="household")return s}}catch{return null}return null},
      SCHOICE = {
        war: [
          ["the engineers' course: sieges and mines",{siegecraft:6,craft:1}],
          ["the cavalry course: horse and command",{riding:3,command:4}],
          ["the quartermasters: roads, carts and bread",{logistics:6}],
        ],
        letters: [
          ["the law",{learning:4,persuasion:3}],
          ["the forms of the court",{etiquette:4,diplomacy:3}],
          ["the chronicles and the old tongues",{learning:5,diplomacy:1}],
        ],
        medicine: [
          ["surgery: the knife, the saw and the needle",{medicine:6}],
          ["physic: herbs, pulses and the old books",{medicine:4,learning:2}],
          ["the infirmary: births and fevers",{medicine:4,faith:1,persuasion:1}],
        ],
        faith: [
          ["preaching",{persuasion:4,faith:3}],
          ["the canon and the courts of the faith",{learning:4,faith:2}],
          ["the missions to far peoples",{faith:3,diplomacy:3}],
        ],
        trade: [
          ["accounts and banking",{stewardship:4,trade:3}],
          ["the sea routes and the caravans",{logistics:4,trade:2,sea:1}],
          ["contracts and the Law Merchant",{persuasion:3,trade:3,learning:1}],
        ],
        crafts: [
          ["the forge",{craft:6}],
          ["the stone yard and the engines",{craft:4,siegecraft:2}],
          ["the loom and the dye-vats",{craft:5,trade:1}],
        ],
        sea: [
          ["pilotage and the stars",{sea:6}],
          ["command of a deck",{sea:3,command:3}],
          ["ship's accounts and cargoes",{logistics:4,trade:2}],
        ],
        arts: [
          ["verse",{music:3,persuasion:3}],
          ["the instruments",{music:6}],
          ["the court masque and dance",{music:3,etiquette:3}],
        ],
      };
    function schoolPath(p,ctx,i){if(ctx.k==="fight")return i===0?(A.trainSkill(p,sk(p),4),[F(p,ctx,{styleXp:30,wil:.5}),"The long way is slow, and it goes deep."].filter(Boolean).join(" ")):i===1?(A.trainSkill(p,ctx.w2&&GD.SKILLS[ctx.w2]?ctx.w2:"shield",6),[F(p,ctx,{styleXp:10,ins:.4}),"A second weapon makes you harder to read."].filter(Boolean).join(" ")):(p.school&&(p.school.fee=0),[F(p,ctx,{skill:{command:3},styleXp:12,honor:1}),"You teach the beginners in the mornings and learn from the master in the evenings."].filter(Boolean).join(" "));const O=(SCHOICE[ctx.k]||SCHOICE.letters)[i];return O?(p.flags.sc_path=O[0],[F(p,ctx,{skill:O[1],int:.4}),`You give your last years at ${ctx.school} to ${O[0]}.`].filter(Boolean).join(" ")):""}
    const leaveSchool = p=>{const n=p.school?String(p.school.name||"the school").replace(/^The /,"the "):"the school";return p.school=null,n},
      halveFee = p=>{p.school&&(p.school.fee=Math.max(0,Math.round((p.school.fee||20)/2)))},
      heirOf = (p,ctx)=>{const r=A.realm(p.realm);let q=null;try{for(const id of[r&&r.heir,r&&r.ruler]){const x=id?A.P(id):null;if(x&&x.alive&&x.id!==p.id&&A.isAdult(x)&&A.age(x)*16/GD.RACES[x.race].adult<40){q=x;break}}}catch{q=null}if(q)if(r&&q.id===r.ruler){const full=A.fullName(q,!1),st=A.rulerStyle(q,r),t=st.endsWith(full)?st.slice(0,st.length-full.length).trim():rTitle(p);ctx.royal=`the ${t||"ruler"} ${q.sex==="F"?"herself":"himself"}`}else ctx.royal=`the ${rTitle(p)}'s heir`;else{q=A.makeAcquaintance(p,"acquaint"),q.status="royal",q.born=A.S.year-A.ri(GD.RACES[q.race].adult,GD.RACES[q.race].adult+6);try{const h=r&&r.house?A.house(r.house):null;h&&(q.house=h.id,q.sur=A.houseSurname(h),q.surMode="house")}catch{}q.occ=`a kinsman of the ${rTitle(p)}`,ctx.royal=`a ${q.sex==="F"?"kinswoman":"kinsman"} of the ${rTitle(p)}`}return ctx.pid=q.id,ctx.They=A.cap(A.he(q)),ctx.Their=A.cap(A.his(q)),ctx.they=A.he(q),ctx.their=A.his(q),q},
      BATTLES = [
        [
          "the Matazi Ford, 1016",
          "thirty elephants that would not cross a ford under arrows",
          ["POL-20","POL-22"],
        ],
        [
          "the Gordush Bend, 1049",
          "an army caught astride a river by sixteen thousand riders",
          ["POL-01","POL-11"],
        ],
        ["Zorek, 1064","a charge broken by drums, and two princes dead",["POL-26","POL-34"]],
        ["the siege of Tessar, 1064","a city held by an engine behind the wall",["POL-31","POL-25"]],
        [
          "the Lost March, 1079",
          "three thousand men lost eleven days under the trees to six hundred rangers",
          ["POL-06","POL-01"],
        ],
        [
          "Tiravi, 1083",
          "sixty elephants stopped by pits, caltrops and four thousand dwarves",
          ["POL-28","POL-30"],
        ],
        ["the Stagflow, 1091","a column of twelve thousand broken in the fog",["POL-08","POL-01"]],
        [
          "the siege of Kelfast, 1002",
          "the war under the rock: mine against counter-mine",
          ["POL-28","POL-31"],
        ],
        [
          "the burning at Yarbek, 882",
          "the chain and the tide, and two hundred boats burned",
          ["POL-14","POL-12"],
        ],
      ];
    A.defEvents([
      {
        id: "sc_th_wedding",
        trigger: !0,
        opp: ["thief"],
        maxRank: 1,
        cool: 3,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{ctx.groom=nm(p,"M"),ctx.trade=A.pick(["wool merchant","salt factor","master dyer","moneychanger","timber merchant"])},
        title: "A rich wedding",
        text: "{groom}, the {trade}'s son, weds today. The procession crosses {home} market throwing pennies to the crowd, and every guest is drunk by noon. On a wedding day a purse is a fat fish.",
        choices: [
          {
            t: "Lift the bride's father's purse in the crush",
            check: {s:"stealth",s2:"dagger",d:44},
            win: {
              r: "Two fingers, a slit string, gone. The purse holds eleven suns and a silver ring.",
              fx: {coin:14,rep:3,skill:{stealth:1}},
            },
            lose: {
              r: 'A guest grabs your wrist and shouts "Fish!" The crowd beats you before the watch arrives to do the rest.',
              fx: {health:-8,punish:"theft",rep:-2,wil:.5},
            },
          },
          {
            t: "Work the penny-scramble with the street children as cover",
            check: {s:"deception",s2:"spd",d:36},
            win: {
              r: "While the children dive for pennies, you dive for pockets. Six suns in small coin, and nobody saw a thing.",
              fx: {coin:6,rep:2},
            },
            lose: {
              r: "A little girl bites your hand when you reach past her. You come away with a penny and a lesson.",
              fx: {coin:1,happy:-2},
            },
          },
          {
            t: "Sell the guest list to a crew of housebreakers",
            check: {s:"intrigue",s2:"persuasion",d:46},
            win: {
              r: "Half the guests will sleep at the feast, and their houses will be empty. The housebreakers pay you a tenth of the night.",
              fx: {coin:18,rep:3,honor:-2},
            },
            lose: {
              r: "The housebreakers take the list, and forget to pay. You cannot exactly complain to the watch.",
              fx: {rep:-1,wil:.3},
            },
          },
          {
            t: "Catch the thrown pennies like everyone else",
            r: "Three pennies and a blessing from the bride's grandmother. Some days that is enough.",
            fx: {coin:1,happy:2},
          },
        ],
      },
      {
        id: "sc_th_lamp",
        trigger: !0,
        opp: ["thief"],
        maxRank: 3,
        cool: 5,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{gangOf(p,ctx),who(p,ctx,"acquaint","a new face in your crew")},
        title: "A lamp in the crew",
        text: "Three of your crew taken in a month, each the night after a job was planned. Someone is a lamp, as the cant says: an informer. The crew looks at the newest face, {themFull}. One or two of them look at you.",
        choices: [
          {
            t: "Find the real lamp",
            check: {s:"intrigue",s2:"ins",d:50},
            win: {
              r: "You tell three men about three different nights. The watch comes on the second one. It was the old fence's nephew, and the crew knows you found him.",
              fx: {rep:6,skill:{intrigue:2},them:{type:"friend",op:20}},
            },
            lose: {
              r: "You point at the wrong man. He is beaten and thrown out, and the arrests go on.",
              fx: {rep:-4,wil:1},
            },
          },
          {
            t: "Stand with {them}",
            r: "You vouch for {them} in front of everyone. If you are wrong, it is your neck too.",
            fx: {them:{type:"friend",op:30},honor:2,rep:-1},
          },
          {
            t: "Let the crew have {them}",
            r: "{They} is beaten and run out of {home}. The arrests stop, for a while. You never ask whether it was really {themHim}.",
            fx: {them:{type:"enemy",op:-40},honor:-3,rep:2},
          },
          {
            t: "Lie low until it blows over",
            r: "You stay home for a month, drink too much and earn nothing. When you come back, the crew is smaller.",
            fx: {coin:-4,happy:-2},
          },
        ],
      },
      {
        id: "sc_th_roofs",
        trigger: !0,
        opp: ["thief"],
        minRank: 1,
        maxRank: 3,
        cool: 4,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{ctx.take=A.ri(45,95),R(p,"POL-21")?(ctx.mark="a spice factor's coral-stone house in Kesh",ctx.how="The door is barred and the dogs are loose, so you go up: three storeys of coral by rope, the way the Rope Hall teaches."):R(p,"POL-04")?(ctx.mark="a warehouse on piles off the Grand Canal",ctx.how="The Pile-Rats' way: a flat boat under the floor at low water, and a saw through the boards."):R(p,...DWARF)?(ctx.mark="a factor's room on the Shelf where the human porters lodge",ctx.how="The doors are dwarf-made and laugh at picks, so it must be the chimney."):(ctx.mark=`a cloth merchant's upper room in ${home(p)}`,ctx.how="The street door is iron-bound. The roof is not.")},
        title: "Over the roofs",
        text: "The mark: {mark}. Inside, they say, {take} suns in a chest under the bed. {how}",
        choices: [
          {
            t: "Go over the roofs tonight",
            check: {s:"athletics",s2:"stealth",d:50},
            win: {
              r: "Tile, gutter, shutter, chest, and back the way you came before the bell. Nobody wakes.",
              fx: (p,ctx)=>F(p,ctx,{coin:ctx.take,rep:5,skill:{athletics:1,stealth:1}}),
            },
            lose: {
              r: "A tile slides. You fall two storeys into a midden and limp home with nothing but the smell.",
              fx: {health:-14,wound:"bad_knee",rep:-2,wil:1,cause:"a fall from a roof"},
            },
          },
          {
            t: "Take the hard way in, through the skylight (climber)",
            req: (p,C)=>C.prof(p,"athletics",50)||C.prof(p,"stealth",55),
            check: {s:"stealth",s2:"athletics",d:44},
            win: {
              r: "You hang by your fingertips over a sleeping man and lift the chest key off his belt. They will talk about this one in the cant.",
              fx: (p,ctx)=>F(p,ctx,{coin:ctx.take+25,rep:8,fame:1}),
            },
            lose: {
              r: "The skylight frame is rotten and comes away in your hands. You get out, barely, and the house doubles its dogs.",
              fx: {health:-6,rep:-2},
            },
          },
          {
            t: "Pay the night servant to leave a shutter open (10 suns)",
            req: p=>p.coin>=10,
            check: {s:"persuasion",s2:"deception",d:45},
            win: {
              r: "The shutter is open, the servant is at his mother's, and the chest is lighter than they said, but full enough.",
              fx: (p,ctx)=>F(p,ctx,{coin:Math.round(ctx.take*.7)-10,rep:3}),
            },
            lose: {
              r: "The servant takes your coin and tells his master. The shutter is open, and so is a man with a cudgel.",
              fx: {coin:-10,health:-8,rep:-2},
            },
          },
          {
            t: "Pass on it",
            r: "Some marks are bad luck. You let a younger crew have it, and hear later that they are in the ledger.",
            fx: {rep:-1},
          },
        ],
      },
      {
        id: "sc_th_shrine",
        trigger: !0,
        opp: ["thief"],
        minRank: 1,
        cool: 6,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{R(p,"POL-30")?(ctx.loot="the gold leaf on a roadside shrine of the Thousand Names",ctx.risk="The Lotus Knives strip such shrines and sell the leaf in the Cotton Bazaar. Ranpur takes a thief's hand."):R(p,"POL-18")?(ctx.loot="the grave goods of a rich tomb on the Night Bank",ctx.risk="Tamar drowns tomb robbers. The dead do not complain."):R(p,...SUNLAND)?(ctx.loot="a silver reliquary in a village sun-chapel",ctx.risk="Inside, they say, is a saint's knuckle. Most such knuckles are a pig's."):(ctx.loot=`the offering box at the shrine of ${A.godWord(p)} by the ${home(p)} bridge`,ctx.risk="The priest counts it on feast days. Between feast days nobody counts it at all.")},
        title: "The little shrine",
        text: "Easy money: {loot}. {risk}",
        choices: [
          {
            t: "Take all of it",
            check: {s:"stealth",s2:"ins",d:44},
            win: {
              r: "It sells for thirty-five suns. You sleep badly for a week, then not at all badly.",
              fx: {coin:35,piety:-6,rep:3},
            },
            lose: {
              r: "The keeper sleeps in the shrine these days. He raises the cry, and the whole street answers it.",
              fx: {punish:"theft",piety:-3,rep:-3},
            },
          },
          {
            t: "Take a little, and leave the god their share",
            check: {s:"stealth",s2:"faith",d:36},
            win: {
              r: "A third of it. Nobody notices a third, and the god, you tell yourself, does not need the rest.",
              fx: {coin:12,piety:-2,rep:1},
            },
            lose: {
              r: "Your hand shakes on the lid. You leave with nothing and an odd feeling of being watched.",
              fx: {piety:1,wil:.5},
            },
          },
          {
            t: "Leave it. Some things you do not rob",
            r: "The crew laughs at you. Your grandmother would not have.",
            fx: {piety:3,honor:2,rep:-2},
          },
        ],
      },
      {
        id: "sc_th_ring",
        trigger: !0,
        opp: ["thief"],
        minRank: 2,
        cool: 5,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{who(p,ctx,"acquaint","a frightened street boy","M"),ctx.victim=nm(p,"M")+" the "+A.pick(["factor","tax-farmer","shipowner","grain-dealer"])},
        title: "A dead man's ring",
        text: "A boy named {them} brings a seal ring wrapped in a rag to your back room. You know the seal: {victim}, pulled out of the river last week. Marked goods are worth a quarter, or nothing, or a rope. The boy wants ten suns, and he is shaking.",
        choices: [
          {
            t: "Pay four suns and melt it down",
            check: {s:"craft",s2:"trade",d:40},
            win: {
              r: "The seal goes into the crucible and comes out a lump of honest silver. Thirty suns, and no questions.",
              fx: {coin:26,rep:3},
            },
            lose: {
              r: "The ring is gilt over lead. You paid four suns for a lesson in your own trade.",
              fx: {coin:-4,rep:-1},
            },
          },
          {
            t: "Sell the ring, and the boy's name, to the dead man's kin",
            check: {s:"intrigue",s2:"persuasion",d:48},
            win: {
              r: "The kin pay sixty suns for the ring and the name. You do not ask what they do with the boy.",
              fx: {coin:60,honor:-6,rep:4,them:{type:"enemy",op:-30}},
            },
            lose: {
              r: "The kin take the ring and look at you as if you killed the man yourself. Perhaps they think you did.",
              fx: {rep:-4,them:{type:"enemy",op:-20}},
            },
          },
          {
            t: "Refuse it and send the boy away",
            r: '"Throw it in the river where you found it." He runs. Some goods are not worth any price.',
            fx: {rep:1,honor:1},
          },
          {
            t: "Take the boy in, and the ring with him",
            r: "You give {them} a meal and a corner of the loft. The ring goes in a jar under the floor until people forget. {They} will remember you.",
            fx: {coin:-10,them:{type:"student",op:35,back:"mentor"},honor:2},
          },
        ],
      },
      {
        id: "sc_th_clerk",
        trigger: !0,
        opp: ["thief"],
        minRank: 2,
        cool: 6,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{who(p,ctx,"acquaint","the reeve's clerk"),ctx.shop=R(p,"POL-17")?"rag-buyer's stall":R(p,"POL-26")?"pelt-buyer's stall in the Wax Market":R(p,...SUNLAND)?"second-hand clothier's shop":"pawn-lender's booth"},
        title: "The clerk's cut",
        text: `Your {shop} buys what others steal, at a quarter of its worth. Today {themFull}, the reeve's clerk, stands in it turning over a cloak that is not yours. "Lovely work. Somebody's, I expect. A fifth of your trade, every month, and I keep my eyes on my ledgers."`,
        choices: [
          {
            t: "Pay the fifth",
            r: "A fifth is a fifth. {They} becomes the friendliest man in the reeve's office.",
            fx: {coin:-25,rep:2,them:{type:"friend",op:10}},
          },
          {
            t: "Find out what {they} hides",
            check: {s:"intrigue",s2:"int",d:54},
            win: {
              r: "A clerk who can afford those boots has his own fingers in the tolls. One quiet word and {they} pays you to stay friends.",
              fx: {coin:20,rep:6,skill:{intrigue:2},them:{type:"rival",op:-10}},
            },
            lose: {
              r: "You find nothing, and {they} finds out you looked. The fifth becomes a quarter.",
              fx: {coin:-35,rep:-2},
            },
          },
          {
            t: "Lean on {them} instead",
            check: {s:"intimidation",s2:"str",d:50},
            win: {
              r: '"Clerks fall down stairs." {They} goes pale and never comes back.',
              fx: {rep:5,them:{type:"enemy",op:-30}},
            },
            lose: {
              r: "{They} laughs at you, and the next week the reeve's men turn your shop upside down.",
              fx: {coin:-30,rep:-4,them:{type:"enemy",op:-30}},
            },
          },
          {
            t: "Close the shop and move it across the river",
            r: "A month lost and a new shopfront. The clerk will find you again, but not this year.",
            fx: {coin:-15,perf:-5},
          },
        ],
      },
      {
        id: "sc_th_gangwar",
        trigger: !0,
        opp: ["thief"],
        minRank: 3,
        cool: 6,
        time: 2,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{gangOf(p,ctx);const canon=!!(GANG[p.realm]&&GANG[p.realm][1]),q=who(p,ctx,"enemy",canon?"right hand of "+ctx.boss:"a gang boss"),nb=neutralGround(p);ctx.offer=canon?`${ctx.boss} sends ${A.fullName(q)}, ${A.his(q)} right hand, to offer talk on ground where no blood may fall: ${nb}.`:`${A.fullName(q)}, who runs them, offers to talk on ground where no blood may fall: ${nb}.`},
        title: "Ground where no blood may fall",
        text: "{Gang} want {quarter}. Two of your people are dead and a warehouse is ash. {offer}",
        choices: [
          {
            t: "Talk, and carve the city in two",
            check: {s:"diplomacy",s2:"intimidation",d:55},
            win: {
              r: "You leave with the river as the line and an oath sworn where oaths are kept. Your crews eat again.",
              fx: {rep:7,coin:60,them:{type:"rival",op:15},skill:{diplomacy:2}},
            },
            lose: {
              r: "You come away with less than you came with. Your own people mutter that the old boss would have fought.",
              fx: {rep:-5,coin:-30},
            },
          },
          {
            t: "Agree to talk, and have {themHim} knifed on the way home",
            check: {s:"intrigue",s2:"stealth",d:56},
            win: {
              r: "The talk goes nowhere. The walk home goes nowhere either, for {them}. Half of {gang} come over to you within the month.",
              fx: {rep:10,coin:80,honor:-10,them:{type:"enemy",op:-60}},
            },
            lose: {
              r: "Your man misses, and gets caught. Now everyone in the city knows you broke the peace of sacred ground.",
              fx: {
                rep: -8,
                honor: -8,
                health: -12,
                wound: "scar_chest",
                cause: "a knife in the dark",
                them: {type:"enemy",op:-60},
              },
            },
          },
          {
            t: "No talk. Settle it in the alley, steel out",
            r: "You send word back: no talk. You meet {them} in the alley behind the market with both crews watching.",
            fx: (p,ctx)=>(A.applyFx(p,{them:{type:"enemy",op:-40}},ctx),bout(p,ctx,{them:!0,k:"duel",lethal:!0,place:"the alley behind the market",title:"Gang war"})),
          },
          {
            t: "Give them the street and keep the rest",
            r: "You give up {quarter}. You keep your life and your other streets, and lose some respect.",
            fx: {rep:-6,happy:-3,wil:.5},
          },
        ],
      },
      {
        id: "sc_th_clippers",
        trigger: !0,
        opp: ["thief"],
        minRank: 1,
        maxRank: 3,
        cool: 6,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{R(p,"POL-03")?(ctx.who="two of the Shears from Bluewater",ctx.law="Varenna hangs coin clippers."):R(p,"POL-31")?(ctx.who="a runner for the Leontine Men, who strike the queen's coin in lead in the Refugee Field",ctx.law="Tessar boils forgers in oil."):R(p,"POL-16")?(ctx.who="a man who says he cuts dies for Lazzaro Fenn",ctx.law="In Ostra the banks hunt forgers harder than murderers."):(ctx.who="a pair of clippers from out of town",ctx.law="Every realm on Ardan has a short way with men who shave its coin."),ctx.Who=A.cap(ctx.who)},
        title: "Shaved suns",
        text: "{Who} want you to pass their clipped coin through your fences and fish-sellers, for a fifth of the face. {law}",
        choices: [
          {
            t: "Pass the coin for a fifth",
            check: {s:"deception",s2:"trade",d:48},
            win: {
              r: "The clipped suns go out into the markets a few at a time, and your fifth comes back whole.",
              fx: {coin:40,rep:3,honor:-2},
            },
            lose: {
              r: "A moneychanger weighs a sun, then another. The watch has your name by evening.",
              fx: {prison:2,why:"passing clipped coin",rep:-5},
            },
          },
          {
            t: "Rob the clippers. Who will they tell?",
            check: {s:"intimidation",s2:"dagger",d:52},
            win: {
              r: "You take their bag of shavings, which is real silver, and their good coin too. They leave town that night.",
              fx: {coin:55,rep:5},
            },
            lose: {
              r: "Clippers carry knives. You find that out the hard way.",
              fx: (p,ctx)=>bout(p,ctx,{k:"brawl",tier:2,place:"a back room",occ:"a coin clipper",title:"Clippers"}),
            },
          },
          {
            t: "Sell them to the watch",
            r: "The watch pays a reward, and the clippers will hang. Thieves have long memories for this kind of thing.",
            fx: {coin:20,rep:-5,honor:1,flag:"sc_lamp"},
          },
          {
            t: "Refuse. Coin is the one thing you do not touch",
            r: "You send them on their way. A thief who lives long knows which crimes the crown never forgives.",
            fx: {rep:1},
          },
        ],
      },
      {
        id: "sc_th_tribute",
        trigger: !0,
        opp: ["thief"],
        minRank: 4,
        cool: 4,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{who(p,ctx,"acquaint","a gang boss under you")},
        title: "Tribute night",
        text: "On {festival} the bosses of {home} come one by one with your share: purses, a bolt of silk, a barrel nobody asks about. {themFull} comes last, with half of what is owed and a story about a bad month.",
        choices: [
          {
            t: "Make an example of {themHim}",
            check: {s:"intimidation",s2:"wil",d:55},
            win: {
              r: "You do it in front of everyone, and you do it slowly. Next year nobody has a bad month.",
              fx: {rep:9,coin:120,honor:-4,them:{type:"enemy",op:-50}},
            },
            lose: {
              r: "You go too far, and the other bosses see a tyrant instead of a king. Two of them start talking to each other.",
              fx: {rep:-6,them:{type:"enemy",op:-50}},
            },
          },
          {
            t: "Forgive the debt, loudly",
            r: '"A bad month comes to all of us." {They} owes you more than coin now. A debt is a leash.',
            fx: {rep:-2,coin:60,them:{type:"friend",op:30}},
          },
          {
            t: "Cut off {their} fence quietly",
            check: {s:"intrigue",s2:"trade",d:50},
            win: {
              r: "Within a month nobody in {home} will buy {their} goods but you, at your price.",
              fx: {rep:7,coin:150,skill:{intrigue:2}},
            },
            lose: {
              r: "{They} finds another fence in {town} and stops coming on tribute night at all.",
              fx: {rep:-4,coin:60,them:{type:"rival",op:-20}},
            },
          },
        ],
      },
      {
        id: "sc_th_strongroom",
        trigger: !0,
        opp: ["thief"],
        minRank: 3,
        cool: 8,
        time: 2,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{ctx.take=A.ri(300,700),ctx.mark=R(p,"POL-16")?"the strong-room of a banking house on the Exchange":R(p,"POL-04")?"a counting house on the Grand Canal":R(p,...DWARF)?"a human factor's steel chest, sealed with poured metal":R(p,"POL-21","POL-32")?"the scale-house where the harbor dues are counted":`the counting house of the richest merchant in ${home(p)}`,who(p,ctx,"acquaint","a clerk with debts")},
        title: "The strong-room",
        text: "The job of a lifetime: {mark}. {take} suns in coin and bills, on the last night of the quarter when the clerks are drunk. {themFull}, a clerk with gambling debts, works inside.",
        choices: [
          {
            t: "Buy the clerk",
            check: {s:"intrigue",s2:"persuasion",d:55},
            win: {
              r: "{They} leaves a door unbarred and a dog drugged. By dawn you are rich and {they} is on a boat.",
              fx: (p,ctx)=>F(p,ctx,{coin:ctx.take,rep:12,fame:3,deed:"Emptied a strong-room and was never caught",them:{type:"friend",op:20}}),
            },
            lose: {
              r: "{They} takes your silver and confesses to the master. The watch is waiting inside.",
              fx: {prison:3,why:"a strong-room robbery",rep:-8,them:{type:"enemy",op:-30}},
            },
          },
          {
            t: "Tunnel in from the cellar next door",
            check: {s:"craft",s2:"sta",d:58},
            win: {
              r: "Six nights of digging, one wall of rubble, and the floor comes up under the chest. Nobody in {home} talks of anything else for a year.",
              fx: (p,ctx)=>F(p,ctx,{coin:ctx.take+100,rep:14,fame:5,skill:{craft:2,siegecraft:1},deed:"Tunnelled into a strong-room"}),
            },
            lose: {
              r: "The cellar wall comes down on you on the fourth night. You crawl out with a broken arm and nothing else.",
              fx: {health:-25,wound:"broken_ribs",rep:-5,cause:"a collapsed tunnel"},
            },
          },
          {
            t: "Go in yourself, alone",
            check: {s:"stealth",s2:"ins",d:62},
            win: {
              r: "In through a privy shaft, out by the roof. You take what you can carry, which is a great deal.",
              fx: (p,ctx)=>F(p,ctx,{coin:Math.round(ctx.take*.8),rep:10,fame:3,skill:{stealth:2}}),
            },
            lose: {
              r: "The night clerk is sober tonight. The hue and cry follows you halfway across {home}.",
              fx: {punish:"theft",rep:-6,health:-8},
            },
          },
          {
            t: "Too big. Pass it on to another crew",
            r: "You sell the plan for a share. The other crew gets caught, and your share never comes.",
            fx: {rep:-2},
          },
        ],
      },
      {
        id: "sc_th_kid",
        trigger: !0,
        opp: ["thief"],
        minRank: 2,
        cool: 8,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{const q=who(p,ctx,"acquaint","a street child");q.born=A.S.year-Math.round(GD.RACES[q.race].adult*.7)},
        title: "Fast hands",
        text: "A child of the streets named {them} tries to lift your purse in the market, and nearly manages it. Nearly. You have {them} by the wrist. Thin arms, old eyes, and the best hands you have seen in years.",
        choices: [
          {
            t: "Teach {themHim} properly",
            r: "You teach {them} the cant, the cut, the run and the rules: never your own street, never a priest, never a child. {They} learns faster than you did.",
            fx: {them:{type:"student",op:40,back:"mentor"},rep:3,skill:{stealth:1}},
          },
          {
            t: "Use {themHim} as a lookout",
            r: "A penny a night to watch corners. {They} is good at it, and nobody looks twice at a child.",
            fx: {them:{type:"acquaint",op:10},coin:10,rep:2},
          },
          {
            t: "Give {themHim} a sun and send {themHim} to the temple school",
            r: "You do not know why you do it. Perhaps because nobody did it for you.",
            fx: {coin:-1,honor:3,happy:3,them:{type:"friend",op:20}},
          },
          {
            t: "Hand {themHim} to the watch",
            r: "The watch takes {them} away by the ear. You tell yourself it was a lesson, not a betrayal.",
            fx: {honor:-2,rep:-1,them:{type:"enemy",op:-40}},
          },
        ],
      },
      {
        id: "sc_th_hound",
        trigger: !0,
        opp: ["thief"],
        minRank: 1,
        maxRank: 3,
        cool: 6,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{ctx.beastie=R(p,...STEPPE)?"a white-footed mare":R(p,...WELL)?"a hunting falcon from the Sand Clans":A.pick(["a brindled wolfhound","a gyrfalcon","a lymer hound with a nose like a priest"]),ctx.lord=A.pick(["the baron","the count's steward","old Lord "+nm(p,"M")]),ctx.Lord=A.cap(ctx.lord)},
        title: "The lord's darling",
        text: "{Lord} loves {beastie} more than his wife, the servants say. When it goes missing, he pays well for its return. It has not gone missing yet.",
        choices: [
          {
            t: 'Steal it, then "find" it for the reward',
            check: {s:"stealth",s2:"deception",d:48},
            win: {
              r: "Two days in a barn, a muddy walk back, and a tearful lord. Thirty suns, and a cup of his wine.",
              fx: {coin:30,rep:4,skill:{deception:1}},
            },
            lose: {
              r: "His huntsman knows the beast's tricks better than you do. He knows yours too.",
              fx: {punish:"theft",rep:-3},
            },
          },
          {
            t: "Steal it and sell it to his neighbor and rival",
            check: {s:"trade",s2:"stealth",d:50},
            win: {
              r: "The neighbor pays fifty suns and promises never to hunt it where the lord can see.",
              fx: {coin:50,rep:4,honor:-2},
            },
            lose: {r:"The neighbor takes it, pays you nothing, and dares you to complain.",fx:{rep:-2,wil:.5}},
          },
          {
            t: "Leave the lord his darling",
            r: "Lords who lose what they love hang people for it. You let this one go.",
            fx: {},
          },
        ],
      },
      {
        id: "sc_th_ledger",
        trigger: !0,
        opp: ["thief"],
        minRank: 2,
        cool: 7,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{who(p,ctx,"friend","a thief in the cells")},
        title: "A friend in the ledger",
        text: "{themFull} is in the ledger, as the cant has it, and the tall widow is waiting for {themHim} on market day. {They} knows every name in your crew, including yours.",
        choices: [
          {
            t: "Bribe the gaoler (40 suns)",
            req: p=>p.coin>=40,
            check: {s:"persuasion",s2:"intrigue",d:46},
            win: {
              r: "A wet watchman, as the cant says, is a friend. The cell door is open at midnight, and {them} is in the next realm by spring.",
              fx: {coin:-40,rep:6,them:{type:"bestfriend",op:40}},
            },
            lose: {
              r: "The gaoler is dry: he takes nothing and reports everything. You lose the silver and almost your freedom.",
              fx: {coin:-40,rep:-3,wil:.5},
            },
          },
          {
            t: "Break {themHim} out",
            check: {s:"stealth",s2:"str",d:58},
            win: {
              r: "A file, a rope, a cart of manure at the gate. The whole quarter sings about it.",
              fx: {rep:9,fame:2,them:{type:"bestfriend",op:45}},
            },
            lose: {
              r: "The watch was waiting. Now there are two of you in the ledger.",
              fx: {prison:2,why:"breaking a prisoner out",rep:-4},
            },
          },
          {
            t: "Let {themHim} hang, and hope {they} keeps quiet",
            r: "{They} does keep quiet, to the end. You stand in the crowd and cannot look at the scaffold.",
            fx: {rep:-3,honor:-3,wil:1.5,happy:-6},
          },
        ],
      },
      {
        id: "sc_th_run",
        trigger: !0,
        opp: ["thief"],
        minRank: 1,
        maxRank: 3,
        cool: 4,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{const G={"POL-01":"amber, past the Kingsmere Amber Guild, which buys every piece by law","POL-08":"short tin bars for the Coldhaven boats, past the Tin Reeves","POL-09":"tin to Kingsmere by night boat","POL-02":"salt past the Temple's salt tax","POL-25":"graded pelts past the toll forts","POL-26":"furs and wax past the Velgradan toll forts","POL-29":"steel in grain sacks down the Shelf road","POL-28":"gems in boot-soles through the lower gates","POL-05":"war bows and yew south toward Varenna, which is treason","POL-20":"gold dust in hollow walking sticks past the Scale","POL-21":"pepper past the Pepper Hall scales","POL-32":"spice out of the Scales by night to Keshi ships","POL-24":"pearls past the Emir's best-pearl men","POL-03":"Palella cloth past the toll in fishing boats","POL-15":"lamp oil that is not lamp oil, landed by night"};ctx.goods=G[p.realm]||"wine and wax past the town gate tax"},
        title: "A run past the toll",
        text: "A smuggler needs a quiet pair of hands: {goods}. Thirty suns for one night's carrying.",
        choices: [
          {
            t: "Carry it",
            check: {s:"stealth",s2:"deception",d:48},
            win: {
              r: "One night, one load, thirty suns. The toll clerk sleeps soundly, and so do you.",
              fx: {coin:30,rep:3},
            },
            lose: {
              r: "The toll men are awake tonight. You drop the load and run, but not fast enough.",
              fx: {punish:"smuggling",rep:-3},
            },
          },
          {
            t: "Guide them by the old track instead",
            check: {s:"survival",s2:"tracking",d:45},
            win: {
              r: "The track is mud and thorns but no toll men. The smugglers pay you as a guide and promise more.",
              fx: {coin:25,rep:3,skill:{survival:1}},
            },
            lose: {
              r: "You lose the track in the dark, and the smugglers lose their patience with you.",
              fx: {coin:5,rep:-2},
            },
          },
          {
            t: "Not your trade. Refuse",
            r: "Smugglers and thieves drink in the same alehouses. They do not have to like each other.",
            fx: {},
          },
        ],
      },
      {
        id: "sc_thd_brand",
        cond: (p,C)=>C.adult(p)&&C.job(p,"thief")&&!C.prison(p),
        w: .9,
        cool: 10,
        setup: (p,ctx)=>{who(p,ctx,"acquaint","an old beggar"),ctx.mark=R(p,"POL-02")?"a small sun branded on the back of his hand":R(p,"POL-25")?"the thief's brand on his cheek":R(p,"POL-30","POL-17","POL-24")?"a stump where a right hand used to be":R(p,"POL-01")?"the brand on his hand, for a theft of less than a mark":"the brand of a twice-caught thief"},
        title: "The brand",
        text: "An old beggar at the gate has {mark}. The crew says {them} was the best hands in {home} once. Now {they} holds out a cup with the other hand.",
        choices: [
          {
            t: "Put a sun in the cup and sit with {themHim}",
            r: "{They} talks for an hour: about the jobs, and about the one mistake. You walk away with a trick worth a year of practice.",
            fx: {coin:-1,skill:{stealth:2,deception:1},them:{type:"friend",op:25}},
          },
          {
            t: "Ask what it was like, getting caught",
            r: '"Like falling. You know it is happening and you cannot stop it." You think about that for a long time.',
            fx: {wil:1,int:.3},
          },
          {t:"Walk past. That will never be you",r:"Everybody says that. {They} said it too.",fx:{happy:-1}},
        ],
      },
      {
        id: "sc_thd_cry",
        cond: (p,C)=>C.adult(p)&&C.job(p,"thief")&&!C.prison(p),
        w: 1,
        cool: 6,
        setup: (p,ctx)=>{ctx.refuge=R(p,...SUNLAND)?"the sun temple, where a fugitive who grips the bell-rope has forty days":R(p,...WELL)?"the house of a Sand Clan trader, where whoever accepts water is protected":R(p,...ORC)?"the nearest clan fire, where a guest may not be harmed":"the old chapel, though nobody honors sanctuary here"},
        title: "The cry goes up",
        text: '"Thief!" The hue and cry goes up behind you, and every neighbor must answer it or pay a fine. Doors open. Someone is already running for a cudgel.',
        choices: [
          {
            t: "Run for {refuge}",
            check: {s:"spd",s2:"athletics",d:46},
            win: {
              r: "You get there first, and they stop at the threshold, cursing. You leave later by a back way with a story.",
              fx: {rep:2,sta:.4},
            },
            lose: {r:"A carter trips you ten paces short. The crowd has you.",fx:{punish:"theft",health:-6}},
          },
          {
            t: "Join the cry, and point the other way",
            check: {s:"deception",s2:"ins",d:48},
            win: {
              r: '"There! He went over the wall!" Twenty people run past you. You shout louder than any of them.',
              fx: {rep:3,skill:{deception:2}},
            },
            lose: {r:"A fishwife looks at you, then at the purse in your sleeve.",fx:{punish:"theft",rep:-2}},
          },
          {
            t: "Drop the purse and stand still",
            r: "They find the purse in the gutter and you looking innocent. They beat you anyway, on principle.",
            fx: {health:-10,wil:.6,rep:-1},
          },
        ],
      },
      {
        id: "sc_thd_kitty",
        cond: (p,C)=>C.adult(p)&&C.job(p,"thief")&&p.job.r>=1&&!C.prison(p),
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{who(p,ctx,"acquaint","the keeper of the crew's kitty")},
        title: "The widows' kitty",
        text: "Every crew keeps a kitty for the families of those who meet the tall widow. {themFull} keeps yours, and lately {they} has new boots, and the widows have less bread.",
        choices: [
          {
            t: "Count the kitty in front of the crew",
            check: {s:"learning",s2:"intimidation",d:42},
            win: {
              r: "Forty suns short. The crew deals with {them}, and they make you keeper instead.",
              fx: {rep:5,honor:3,them:{type:"enemy",op:-40}},
            },
            lose: {
              r: "You cannot prove it, and {they} makes you look like the thief.",
              fx: {rep:-4,them:{type:"enemy",op:-20}},
            },
          },
          {
            t: "Have a quiet word with {themHim}",
            r: "{They} goes red, then grey, then pays it back over the winter. Neither of you speaks of it.",
            fx: {rep:1,them:{type:"acquaint",op:-5},honor:1},
          },
          {t:"Ask for a cut to keep quiet",r:"Ten suns. You are not proud of it.",fx:{coin:10,honor:-4}},
        ],
      },
      {
        id: "sc_thd_cant",
        cond: (p,C)=>C.adult(p)&&C.coast(p)&&!C.flag(p,"sc_cant")&&(J(p,"thief","pirate","sailor")||C.prof(p,"stealth",45)),
        w: .9,
        once: !0,
        title: "The cant",
        text: "On the docks they talk a language nobody is born to. A purse is a fish, a fence an uncle, an informer a lamp. A watchman who takes bribes is wet and one who will not is dry. Prison is the ledger, a gallows the tall widow, and to drink with the Queen is to drown.",
        choices: [
          {
            t: "Learn it properly",
            r: "A season of listening, and you talk like a docker's grandson.",
            fx: (p,ctx)=>{const o=F(p,ctx,{skill:{deception:2,intrigue:1},rep:2,flag:"sc_cant"});return R(p,"POL-33","POL-24")&&GD.LANG_LIST.includes("Corsair cant")?o+" "+F(p,ctx,{lang:"Corsair cant"}):o},
          },
          {
            t: "Learn just enough not to be a fish yourself",
            r: "Enough to know when you are being talked about.",
            fx: {skill:{deception:1},flag:"sc_cant"},
          },
        ],
      },
      {
        id: "sc_thd_mother",
        cond: (p,C)=>C.adult(p)&&C.job(p,"thief")&&C.parentsAlive(p)&&!C.prison(p),
        w: .7,
        cool: 12,
        title: "Where the money comes from",
        text: '{mother} looks at the new shawl you brought her, then at you. "Where does the money come from? Your father earned eleven suns a month and never brought me a shawl."',
        choices: [
          {
            t: 'Lie: "Carrying for a merchant"',
            check: {s:"deception",s2:"persuasion",d:40},
            win: {
              r: "She wants to believe it, so she does. She wears the shawl to the temple.",
              fx: {happy:1,rel:{who:"mother",op:3}},
            },
            lose: {
              r: "She says nothing. She folds the shawl and puts it back in your hands.",
              fx: {happy:-4,rel:{who:"mother",op:-8}},
            },
          },
          {
            t: "Tell her the truth",
            r: "She cries, then asks you to be careful, then makes you eat. Mothers are like that everywhere.",
            fx: {honor:2,wil:.5,rel:{who:"mother",op:4}},
          },
          {
            t: "Change the subject",
            r: "You talk about the weather and your cousin's wedding. The shawl sits between you like a third person.",
            fx: {happy:-1},
          },
        ],
      },
      {
        id: "sc_sp_tongues",
        trigger: !0,
        opp: ["spy"],
        maxRank: 1,
        cool: 3,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{webOf(p,ctx),ctx.inn=A.pick(["Crooked Oar","Three Bells","Drowned Goat","Lantern and Key","Widow's Kettle"]),ctx.topic=A.pick(["the garrison's pay being three months late","a lord's steward buying horses by night",`a ship from ${ctx.foreign} that docked and unloaded nothing`,"the master of the mint drinking with strangers"])},
        title: "Loose tongues",
        text: "A toll clerk at the {inn} drinks more than he earns and talks more than he drinks. Tonight he is talking about {topic}. {Handler}, {hdesc}, pays by the word, if the words are good.",
        choices: [
          {
            t: "Buy him drinks and let him talk",
            check: {s:"persuasion",s2:"ins",d:40},
            win: {
              r: "By the fourth cup he is telling you names. You write them down in your head and repeat them all the way home.",
              fx: {coin:8,rep:4,skill:{intrigue:2}},
            },
            lose: {
              r: "By the fourth cup he is asleep on the table, and you have bought four cups.",
              fx: {coin:-2,rep:-1},
            },
          },
          {
            t: "Report it straight, as you heard it",
            r: "Small news, plainly told. Handlers like informers who do not decorate.",
            fx: {coin:4,rep:2},
          },
          {
            t: "Dress it up to make it worth more",
            check: {s:"deception",s2:"int",d:46},
            win: {
              r: "A little colour, a little worry. {Handler} pays double and asks for more.",
              fx: {coin:12,rep:1,honor:-1},
            },
            lose: {
              r: "{Handler} checks your story against two others. Yours is the only one with a mysterious foreigner in it.",
              fx: {rep:-6,wil:.5},
            },
          },
          {
            t: "Sell it to the other side too",
            check: {s:"intrigue",s2:"deception",d:52},
            win: {
              r: "Two buyers, one story, and neither knows the other paid. This is how informers get rich, briefly.",
              fx: {coin:20,rep:1,skill:{intrigue:1},flag:"sc_two_masters"},
            },
            lose: {
              r: "The other side's man and your handler drink at the same inn. You find that out too late.",
              fx: {rep:-10,health:-10,cause:"a beating in an alley"},
            },
          },
        ],
      },
      {
        id: "sc_sp_cipher",
        trigger: !0,
        opp: ["spy"],
        minRank: 1,
        cool: 5,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{webOf(p,ctx),ctx.nums=[A.ri(10,99),A.ri(10,99),A.ri(10,99),A.ri(100,999)].join(" "),ctx.lore=R(p,"POL-15")?"At the Tower of Far Eyes they teach that every cipher has a lazy clerk somewhere inside it.":R(p,"POL-01")?"Lady Ysolde keeps her own ledger in a cipher nobody has ever read.":"Every cipher, the old hands say, has a lazy clerk somewhere inside it."},
        title: "A letter in numbers",
        text: "A courier's satchel, taken on the road from {foreign}, holds a letter in numbers: {nums}, and on for three pages. {Handler} wants it read by Sunday, and wants the courier never to know it was opened. {lore}",
        choices: [
          {
            t: "Break it by candlelight",
            check: {s:"learning",s2:"int",d:55,bonus:p=>A.hasBlood(p,"memory")?15:0},
            win: {
              r: "The clerk who made it used his mistress's name as the key. By Saturday night you are reading about troop barges.",
              fx: {rep:7,coin:25,int:.6,skill:{learning:2,intrigue:1}},
            },
            lose: {
              r: "Three nights, a hundred candles, nothing. You hand it over unread and hate yourself for a week.",
              fx: {rep:-2,wil:1},
            },
          },
          {
            t: "Lift the seal with a hot knife, copy it, reseal it",
            check: {s:"craft",s2:"stealth",d:48},
            win: {
              r: "The seal goes back so cleanly you cannot tell it was ever lifted. The copy goes to cleverer heads than yours.",
              fx: {rep:5,coin:15,skill:{craft:1,stealth:1}},
            },
            lose: {
              r: "The wax cracks. The courier will know. You burn the whole satchel and report a robbery on the road.",
              fx: {rep:-4},
            },
          },
          {
            t: "Find the clerk who wrote it and buy the key",
            check: {s:"intrigue",s2:"persuasion",d:50},
            win: {
              r: "A clerk with a sick daughter will sell anything, even his master's key. Now you can read every letter that master sends.",
              fx: {rep:9,coin:-10,skill:{intrigue:2},newRel:{type:"friend",op:15}},
            },
            lose: {
              r: "The clerk takes your coin and tells his master someone was asking. The cipher changes next month.",
              fx: {coin:-10,rep:-3},
            },
          },
          {t:"Send it on unread",r:"Ciphers are for clerks. {Handler} sighs and finds a clerk.",fx:{rep:-1}},
        ],
      },
      {
        id: "sc_sp_bottle",
        trigger: !0,
        opp: ["spy"],
        minRank: 1,
        maxRank: 2,
        cool: 8,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{webOf(p,ctx),greatHouse(p,null,ctx),ctx.cook=nm(p)},
        title: "A small glass bottle",
        text: '{Handler}, {hdesc}, puts a small glass bottle in your hand. "For {cook}, the cook at the town house of {house}. You carry. You do not ask." It is no bigger than your thumb. A poisoning in a great house costs hundreds of suns, and the carrier is the one who hangs.',
        choices: [
          {
            t: "Carry it",
            check: {s:"stealth",s2:"deception",d:50},
            win: {
              r: "In by the kitchen gate, out with a basket of onions. Two weeks later the house wears mourning. You never learn who it was for.",
              fx: {coin:60,rep:7,honor:-8,wil:.5},
            },
            lose: {
              r: "They search everyone at the kitchen gate today. You drop the bottle in the gutter and walk away very slowly.",
              fx: {rep:-6,wil:1},
            },
          },
          {
            t: "Swap it for chalk-water and say you delivered it",
            check: {s:"deception",s2:"ins",d:55},
            win: {
              r: "Nobody dies. Nobody ever knows. {Handler} only wonders aloud why the cook's nerve failed.",
              fx: {honor:5,rep:-1,piety:2},
            },
            lose: {
              r: "{Handler} had the cook watched. You are beaten in a cellar and told that this is the gentle lesson.",
              fx: {rep:-12,health:-15,honor:3,cause:"a beating in a cellar"},
            },
          },
          {
            t: "Warn the house",
            check: {s:"persuasion",s2:"etiquette",d:52},
            win: {
              r: "The steward believes you. The cook vanishes before nightfall, and a lord of {house} owes his life to a stranger who will not give a name.",
              fx: {honor:8,rep:-10,newRel:{type:"friend",op:25},flag:"sc_warned_house"},
            },
            lose: {
              r: 'The steward hears "poison" and sees the stranger who said it. You spend a month in a cellar explaining yourself.',
              fx: {prison:1,why:"being found with poison",rep:-8},
            },
          },
          {
            t: "Put it back on the table. Not this",
            r: "{Handler} looks at you for a long time, then pockets the bottle. Someone else will carry it.",
            fx: {rep:-6,honor:3,wil:1},
          },
        ],
      },
      {
        id: "sc_sp_turn",
        trigger: !0,
        opp: ["spy"],
        minRank: 1,
        maxRank: 2,
        cool: 7,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{webOf(p,ctx),who(p,ctx,"acquaint","an agent of "+ctx.foreign)},
        title: "An offer from the other side",
        text: '{themFull} sits down across from you in the bathhouse and speaks without looking at you. "{foreign} pays three times what {spymaster} pays. Tell us what you tell them. Nobody loses."',
        choices: [
          {
            t: "Accept, and tell your own master at once",
            check: {s:"deception",s2:"intrigue",d:55},
            win: {
              r: "Now you are two people. You feed {them} chaff your own master writes, and they pay you for it. It is the most dangerous work you have ever done.",
              fx: {rep:10,coin:40,skill:{deception:3,intrigue:2},flag:"sc_double",them:{type:"acquaint",op:10}},
            },
            lose: {
              r: "They test you with a lie only your master knew. When it comes back to them, so does a man with a knife.",
              fx: {health:-22,wound:"scar_chest",rep:-6,cause:"a knife in the bathhouse",them:{type:"enemy",op:-50}},
            },
          },
          {
            t: "Accept, and keep the money for yourself",
            r: "Three times the pay. Twice the fear. You start sleeping with a knife under the pillow.",
            fx: {coin:80,honor:-8,flag:"sc_turncoat",them:{type:"acquaint",op:15}},
          },
          {
            t: "Refuse, and walk out",
            r: '"Nobody loses," {they} said. You notice {they} never told you who wins.',
            fx: {honor:2,rep:1},
          },
          {
            t: "Sell {themHim} to your own master",
            check: {s:"intrigue",s2:"ins",d:46},
            win: {
              r: "{They} is taken at the bathhouse door the next evening. Your master remembers loyal people.",
              fx: {rep:8,coin:25,them:{type:"enemy",op:-60}},
            },
            lose: {
              r: "{They} was never in the bathhouse again. Someone warned {themHim}. Someone in your own web.",
              fx: {rep:-2,wil:.5,them:{type:"enemy",op:-40}},
            },
          },
        ],
      },
      {
        id: "sc_sp_boot",
        trigger: !0,
        opp: ["spy"],
        maxRank: 1,
        cool: 4,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{webOf(p,ctx),ctx.road=R(p,...WELL)?"caravan road":R(p,...STEPPE)?"horse road":R(p,"POL-31")?"road-station road":"toll road"},
        title: "The letter in the boot",
        text: "A sealed letter must cross the border into {foreign} by the {road}. At the toll they search carts, packs, saddles and boots, and they hang couriers.",
        choices: [
          {
            t: "Sew it into the saddle lining",
            check: {s:"stealth",s2:"craft",d:45},
            win: {
              r: "The toll men turn out your pack and feel your boots and never touch the saddle. You deliver it the next day.",
              fx: {coin:10,rep:4},
            },
            lose: {
              r: "A toll man runs his thumb along the stitching. You burn the letter at the first inn and ride home with nothing.",
              fx: {rep:-4,wil:.5},
            },
          },
          {
            t: "Learn it by heart and burn it",
            check: {s:"int",s2:"learning",d:50,bonus:p=>A.hasBlood(p,"memory")?25:0},
            win: {
              r: "Three hundred words, said back without a slip. There is nothing on you to find.",
              fx: {coin:12,rep:5,int:.5},
            },
            lose: {r:"You get it mostly right. Mostly, in this trade, is how wars start.",fx:{rep:-3}},
          },
          {
            t: "Cross as a pilgrim and smile a lot",
            check: {s:"deception",s2:"etiquette",d:45},
            win: {
              r: "The toll men bless you on your way. The letter was in your prayer book.",
              fx: {coin:10,rep:4,skill:{deception:1}},
            },
            lose: {
              r: "You get a prayer wrong. They tear the book apart and you run for the trees.",
              fx: {rep:-5,health:-6},
            },
          },
          {
            t: "Bribe the toll sergeant (8 suns)",
            req: p=>p.coin>=8,
            r: "Eight suns and he does not even open your pack. Money is the oldest cipher.",
            fx: {coin:-8,rep:2},
          },
        ],
      },
      {
        id: "sc_sp_secretary",
        trigger: !0,
        opp: ["spy"],
        minRank: 1,
        cool: 6,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{webOf(p,ctx),who(p,ctx,"acquaint","secretary to the envoy of "+ctx.foreign)},
        title: "The envoy's secretary",
        text: "The envoy of {foreign} has a secretary, {themFull}, who copies every letter, eats alone and is homesick. {Handler} wants to know what is in those letters.",
        choices: [
          {
            t: "Become {their} friend",
            check: {s:"persuasion",s2:"ins",d:48},
            win: {
              r: "Walks, songs from home, a shared meal on feast days. {They} talks, and never knows {they} is talking. You are not sure you are only pretending.",
              fx: {rep:7,them:{type:"friend",op:35},skill:{persuasion:2}},
            },
            lose: {
              r: "{They} is lonely, not a fool. {They} stops coming to the cookshop where you meet.",
              fx: {rep:-2,them:{type:"acquaint",op:-10}},
            },
          },
          {
            t: "Let it become more than friendship",
            req: (p,C)=>!C.married(p),
            r: "It begins as work. One evening by the river it stops being work. {They} tells you everything, and you tell {themHim} nothing.",
            fx: {rep:6,them:{type:"lover",op:40},honor:-3,happy:4},
          },
          {
            t: "Find what {they} is ashamed of",
            check: {s:"intrigue",s2:"deception",d:52},
            win: {
              r: "A debt at the dice house. {They} copies the letters for you now, white-faced, every Friday.",
              fx: {rep:8,honor:-5,them:{type:"enemy",op:-30},skill:{intrigue:2}},
            },
            lose: {
              r: "{They} goes straight to the envoy, who goes straight to the {rulerTitle}. Your master is not pleased.",
              fx: {rep:-8,them:{type:"enemy",op:-30}},
            },
          },
          {
            t: "Just pay {themHim}",
            r: "Ten suns a letter. Cheaper than friendship, and nobody's heart is broken.",
            fx: {coin:-20,rep:4,them:{type:"acquaint",op:5}},
          },
        ],
      },
      {
        id: "sc_sp_blown",
        trigger: !0,
        opp: ["spy"],
        minRank: 2,
        cool: 6,
        time: 2,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{webOf(p,ctx),who(p,ctx,"acquaint","one of your agents")},
        title: "A chalk mark on the bridge",
        text: "The chalk mark on the third pillar of the bridge means one thing: {themFull}, your agent in {foreign}, is blown and begging to be brought home. {They} has a family, and knows the names of four other agents.",
        choices: [
          {
            t: "Bring {themHim} out yourself",
            check: {s:"logistics",s2:"stealth",d:55},
            win: {
              r: "A fishing boat, a false cargo of salt, three nights without sleep. {They} and the children land at dawn and {they} kisses your hands.",
              fx: {rep:9,them:{type:"bestfriend",op:50},skill:{logistics:2},fame:1},
            },
            lose: {
              r: "The boat is searched at the river mouth. You get away. {They} does not.",
              fx: {rep:-6,wil:2,happy:-8,them:{type:"acquaint",op:-20}},
            },
          },
          {
            t: "Lay a false trail so they chase the wrong man",
            check: {s:"deception",s2:"intrigue",d:56},
            win: {
              r: "A forged letter makes {foreign} hunt a merchant who does not exist. {They} walks out by the front gate while they search.",
              fx: {rep:8,them:{type:"friend",op:35},skill:{deception:2}},
            },
            lose: {r:"They do not take the bait. They take {them} instead.",fx:{rep:-5,wil:1.5,happy:-6}},
          },
          {
            t: "Cut {themHim} loose. The web comes first",
            r: "You rub out the chalk mark and move the four other agents. You never hear of {them} again. You think of {themHim} often.",
            fx: {rep:3,honor:-6,wil:1.5,happy:-5},
          },
        ],
      },
      {
        id: "sc_sp_mole",
        trigger: !0,
        opp: ["spy"],
        minRank: 3,
        cool: 7,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{webOf(p,ctx),ctx.a=nm(p),ctx.b=nm(p),ctx.c=nm(p)},
        title: "Three suspects",
        text: "Someone in your own web is selling you to {foreign}. Only three people knew about the barges: {a}, {b} and {c}. One of them is the mole.",
        choices: [
          {
            t: "Tell each a different lie and see which one comes back",
            check: {s:"intrigue",s2:"int",d:55},
            win: {
              r: "The lie you told {b} turns up in a {foreign} dispatch a month later. {b} is gone by night, and the web is whole again.",
              fx: {rep:11,skill:{intrigue:3},int:.5},
            },
            lose: {
              r: "None of the lies come back. Either the mole is cleverer than you, or there are two.",
              fx: {rep:-4,wil:1,trait:"paranoid"},
            },
          },
          {
            t: "Have all three watched day and night (60 suns)",
            req: p=>p.coin>=60,
            check: {s:"logistics",s2:"intrigue",d:48},
            win: {
              r: "Your watchers see {c} leave a basket at a shrine. You have the mole and the shrine both.",
              fx: {coin:-60,rep:9},
            },
            lose: {r:"Sixty suns of watching shows you three tired people going home to bed.",fx:{coin:-60,rep:-2}},
          },
          {
            t: "Burn all three",
            r: "You dismiss all three on the same day. The leak stops. So does the work of two loyal people.",
            fx: {rep:-3,honor:-4,wil:.5},
          },
        ],
      },
      {
        id: "sc_sp_proof",
        trigger: !0,
        opp: ["spy"],
        minRank: 2,
        cool: 8,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{webOf(p,ctx),ctx.lord="Lord "+nm(p,"M")},
        title: "Proof that does not exist",
        text: "The {rulerTitle} wants proof that {lord} is writing to {foreign}. You have watched {lord} for a year. He writes to his sister and his horse-dealer and nobody else. The {rulerTitle} still wants proof.",
        choices: [
          {
            t: "Make the proof",
            check: {s:"deception",s2:"learning",d:56},
            win: {
              r: "Three letters in a good hand with a good seal. {lord} loses his lands, and you gain the {rulerTitle}'s ear.",
              fx: {favor:15,rep:8,honor:-12,coin:80},
            },
            lose: {
              r: "{lord}'s clerk proves the seal is a copy, in open court. The {rulerTitle} has to pretend never to have asked you.",
              fx: {favor:-15,rep:-10,honor:-6},
            },
          },
          {
            t: "Report the truth: there is nothing",
            r: "The {rulerTitle} is not pleased. But the {rulerTitle} remembers, later, who did not lie.",
            fx: {favor:-5,honor:6,rep:2},
          },
          {
            t: "Dig for something real",
            check: {s:"intrigue",s2:"ins",d:62},
            win: {
              r: "No treason, but a mint-master he paid to clip the crown's coin. Real, provable, and enough.",
              fx: {favor:10,rep:10,skill:{intrigue:2}},
            },
            lose: {r:"A year of digging. He really does only write to his sister.",fx:{favor:-6,rep:-2,wil:.5}},
          },
          {
            t: "Quietly warn {lord}",
            r: "A word at a horse fair. {lord} goes on pilgrimage for a year, and comes back with a friend in your trade.",
            fx: {honor:3,rep:-3,newRel:{type:"friend",op:30},flag:"sc_warned_lord"},
          },
        ],
      },
      {
        id: "sc_sp_graves",
        trigger: !0,
        opp: ["spy"],
        minRank: 3,
        cool: 8,
        time: 2,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{webOf(p,ctx),who(p,ctx,"rival","master of the web of "+ctx.foreign)},
        title: "Among the saints' graves",
        text: "{themFull}, who holds the web of {foreign}, will meet you in the Free Marches among the graves of the Marchland Saints, where no side may draw. Each of you holds two of the other's agents. Each of you came with more men than agreed.",
        choices: [
          {
            t: "A fair exchange, two for two",
            check: {s:"diplomacy",s2:"ins",d:50},
            win: {
              r: "Two for two, at noon, between the graves. You shake hands like old enemies, which you now are.",
              fx: {rep:7,them:{type:"rival",op:15},skill:{diplomacy:2}},
            },
            lose: {
              r: "One of {their} agents turns out to be a corpse in a cart. The exchange goes badly for everyone.",
              fx: {rep:-4,them:{type:"enemy",op:-30}},
            },
          },
          {
            t: "Squeeze {themHim} for a third",
            check: {s:"intimidation",s2:"intrigue",d:60},
            win: {
              r: "You know about {their} own nephew in your capital. Three of yours come home for two of {theirHis}.",
              fx: {rep:11,them:{type:"rival",op:-15},fame:2},
            },
            lose: {
              r: "{They} laughs, gets up and leaves. Your two agents do not come home this year.",
              fx: {rep:-6,them:{type:"rival",op:-20}},
            },
          },
          {
            t: "Break the peace of the graves and take {themHim}",
            check: {s:"command",s2:"tactics",d:60},
            win: {
              r: "Your men come out of the gorse. {They} rides home in your cart. It will be a dark story in {foreign} for a generation.",
              fx: {rep:14,fame:4,honor:-12,piety:-5,them:{type:"enemy",op:-80}},
            },
            lose: {
              r: "{Their} men were in the gorse too. You ride for your life with a bolt in your shoulder.",
              fx: {health:-25,wound:"arrow_wound",rep:-8,honor:-8,cause:"a crossbow bolt",them:{type:"enemy",op:-80}},
            },
          },
        ],
      },
      {
        id: "sc_sp_feast",
        trigger: !0,
        opp: ["spy"],
        maxRank: 2,
        cool: 4,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{webOf(p,ctx),greatHouse(p,null,ctx)},
        title: "A servant at the feast",
        text: "{house} hires extra hands for a feast, and {handler} has made sure one of them is you. Somewhere in the great hall tonight, a lord of {house} will talk too much.",
        choices: [
          {
            t: "Pour wine at the high table and listen",
            check: {s:"etiquette",s2:"ins",d:47},
            win: {
              r: "Nobody sees the servant who pours the wine. You hear about a marriage, a debt and a ride north in spring.",
              fx: {rep:6,coin:15,skill:{etiquette:1,intrigue:1}},
            },
            lose: {
              r: "You spill wine on a lady's sleeve and spend the night scrubbing pots in the scullery.",
              fx: {rep:-2,happy:-2},
            },
          },
          {
            t: "Slip away and search the steward's room",
            check: {s:"stealth",s2:"ins",d:52},
            win: {
              r: "A ledger of loans to half the lords of {realmShort}. You copy two pages before the music stops.",
              fx: {rep:8,coin:20,skill:{stealth:1}},
            },
            lose: {
              r: "The steward's dog finds you before you find anything. You claim you were looking for the privy.",
              fx: {rep:-3,health:-5},
            },
          },
          {
            t: "Make a friend of the steward's boy",
            check: {s:"persuasion",s2:"deception",d:44},
            win: {
              r: "The boy will tell you who comes and goes from that house for a penny a week, for years.",
              fx: {rep:5,newRel:{type:"friend",op:20}},
            },
            lose: {r:"The boy is loyal to his master. You leave him a penny and a bad impression.",fx:{rep:-1}},
          },
        ],
      },
      {
        id: "sc_sp_secret",
        trigger: !0,
        opp: ["spy"],
        minRank: 1,
        cool: 10,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{webOf(p,ctx);const s=SECRET[p.realm];ctx.secret=s?s[0]:`the muster rolls of the ${capOf(p)} garrison`,ctx.law=s?s[1]:"Selling them is treason everywhere on Ardan.",who(p,ctx,"acquaint","a buyer from "+ctx.foreign)},
        title: "What the realm hides",
        text: "A buyer from {foreign}, {themFull}, wants {secret}. {law} The purse on the table is two hundred suns, and that is the first purse.",
        choices: [
          {
            t: "Sell it",
            check: {s:"deception",s2:"stealth",d:56},
            win: {
              r: "Two hundred suns, then two hundred more. You change your lodging every month and never look at the gallows again.",
              fx: {coin:400,honor:-12,rep:3,flag:"sc_traitor",them:{type:"acquaint",op:20}},
            },
            lose: {
              r: "The buyer was the crown's own man, testing loyalty. You find out in a cellar.",
              fx: {punish:"treason",rep:-20},
            },
          },
          {
            t: "Play along, and take the buyer for your own crown",
            check: {s:"intrigue",s2:"ins",d:52},
            win: {
              r: "You take {them} with the purse in {their} hands. The crown is grateful in the only way that matters.",
              fx: {rep:11,favor:10,coin:80,fame:2,them:{type:"enemy",op:-60}},
            },
            lose: {
              r: "{They} smells it, and is gone by morning with your description.",
              fx: {rep:-3,them:{type:"enemy",op:-30}},
            },
          },
          {
            t: "Refuse and walk away",
            r: "Some purses are too heavy to carry. You leave it on the table.",
            fx: {honor:2},
          },
        ],
      },
      {
        id: "sc_sp_drop",
        trigger: !0,
        opp: ["spy"],
        maxRank: 1,
        cool: 4,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{webOf(p,ctx),ctx.drop=R(p,...WELL)?"a loose stone in the wall of the well-house":R(p,...ELF)?"a hollow in an old oak at the grove's edge":R(p,...DWARF)?"a crack behind a tally stone in the lower gallery":"a loose stone behind the shrine at the crossroads"},
        title: "The loose stone",
        text: "Your messages wait in {drop}. Today a man has been sitting in sight of it since dawn, mending the same net for six hours.",
        choices: [
          {
            t: "Collect it anyway, very carefully",
            check: {s:"stealth",s2:"ins",d:46},
            win: {
              r: "You wait for a cart to pass between you and him, and it is done. The net-mender never looks up.",
              fx: {rep:4,coin:6},
            },
            lose: {r:"He looks up. You walk on past the stone and lose the drop for good.",fx:{rep:-4}},
          },
          {
            t: "Send a child to fetch it for a penny",
            r: "The child brings it back with a grin. Nobody suspects a child. You feel strange about it.",
            fx: {rep:2,honor:-1},
          },
          {
            t: "Leave it and warn {handler}",
            r: "Better a lost message than a lost informer. {Handler} moves the drop and says you did right.",
            fx: {rep:3},
          },
        ],
      },
      {
        id: "sc_sp_cellar",
        trigger: !0,
        opp: ["spy"],
        minRank: 2,
        cool: 6,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{webOf(p,ctx),who(p,ctx,"acquaint","a captured agent of "+ctx.foreign)},
        title: "The one in the cellar",
        text: "The watch has taken {themFull}, an agent of {foreign}, and handed {themHim} to you. {They} knows names. You have one night before the {rulerTitle}'s men want {themHim}.",
        choices: [
          {
            t: "Talk. Bread, a blanket, patience",
            check: {s:"persuasion",s2:"ins",d:55},
            win: {
              r: "By dawn {they} is talking about home, then about work. Kindness opens more doors than knives.",
              fx: {rep:9,skill:{persuasion:2},them:{type:"acquaint",op:20}},
            },
            lose: {r:"{They} eats the bread, thanks you politely and tells you nothing at all.",fx:{rep:-2}},
          },
          {
            t: "Frighten {themHim}",
            check: {s:"intimidation",s2:"wil",d:50},
            win: {
              r: "You never touch {themHim}. You describe what the {rulerTitle}'s men will do, slowly. {They} talks before you finish.",
              fx: {rep:7,honor:-2,skill:{intimidation:2},them:{type:"enemy",op:-30}},
            },
            lose: {
              r: "{They} has been frightened by better than you. {They} spits at you, and smiles.",
              fx: {rep:-3,them:{type:"enemy",op:-20}},
            },
          },
          {
            t: "Turn {themHim}: send {themHim} home as yours",
            check: {s:"intrigue",s2:"deception",d:58},
            win: {
              r: "{They} goes home with a story about an escape and a debt to you. Now you have an agent in the {foreign} web.",
              fx: {rep:13,skill:{intrigue:3},them:{type:"acquaint",op:25},flag:"sc_turned_agent"},
            },
            lose: {
              r: "{They} agrees to everything, goes home, and tells them everything. You lose a prisoner and gain a laughing enemy.",
              fx: {rep:-8,them:{type:"enemy",op:-40}},
            },
          },
          {
            t: "Hand {themHim} over untouched",
            r: "You write in the ledger: delivered alive. What happens next is not your trade.",
            fx: {rep:1},
          },
        ],
      },
      {
        id: "sc_spd_face",
        cond: (p,C)=>C.adult(p)&&!C.prison(p)&&(J(p,"spy","thief")||C.prof(p,"intrigue",55)),
        w: 1,
        cool: 6,
        title: "The same face",
        text: "A man with a grey hood. You saw him at the fish market this morning, at the bathhouse at noon, and now he is buying a pie at the corner below your window.",
        choices: [
          {
            t: "Shake him in the crowd",
            check: {s:"stealth",s2:"ins",d:48},
            win: {
              r: "In by the tannery, out by the dye-yard, over a wall. When you look back, the street is empty.",
              fx: {skill:{stealth:2},spd:.3},
            },
            lose: {r:"You lose him. Then, at your own door, you see him again, smiling.",fx:{wil:.5,happy:-3}},
          },
          {
            t: "Lead him somewhere quiet, and turn round",
            check: {s:"dagger",s2:"intimidation",d:50},
            win: {
              r: "In the alley he raises his hands. He is a debt collector who has the wrong man. You let him go, shaking.",
              fx: {skill:{intimidation:1},wil:.5},
            },
            lose: {
              r: "He is no debt collector. You get away, bleeding.",
              fx: {health:-12,wound:"deep_cut",cause:"a knife in an alley"},
            },
          },
          {
            t: "Ignore him. If they wanted you, they would have you",
            r: "You sleep badly for a month. Then he is gone, and you never learn who he was.",
            fx: {wil:1,happy:-2},
          },
        ],
      },
      {
        id: "sc_spd_home",
        cond: (p,C)=>C.adult(p)&&C.job(p,"spy")&&C.married(p)&&!C.prison(p),
        w: .8,
        cool: 10,
        title: "A letter in numbers at home",
        text: '{spouse} has found a letter in numbers in your coat. "What is this? Who writes to you in numbers?"',
        choices: [
          {
            t: 'Lie: "Tally sheets from the warehouse"',
            check: {s:"deception",s2:"persuasion",d:45},
            win: {r:"{spouse} believes you. You hate how easy it was.",fx:{honor:-1,happy:-1}},
            lose: {
              r: "{spouse} does not believe you, and starts wondering what else you lie about.",
              fx: {rel:{who:"spouse",op:-12},happy:-4},
            },
          },
          {
            t: "Tell the truth, or most of it",
            r: 'Silence, then: "Is it dangerous?" You say no. That part is a lie.',
            fx: {rel:{who:"spouse",op:6},honor:2},
          },
          {
            t: "Burn it in front of {spouse}",
            r: '"It is nothing now." It is not an answer, and you both know it.',
            fx: {rel:{who:"spouse",op:-4},wil:.5},
          },
        ],
      },
      {
        id: "sc_spd_friend",
        cond: (p,C)=>C.adult(p)&&C.job(p,"spy")&&C.hasRel(p,"friend","bestfriend")&&!C.prison(p),
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{const f=A.relsOf(p,["friend","bestfriend"]).filter(x=>x.p.alive),q=f.length?A.pick(f).p:A.makeAcquaintance(p,"friend");ctx.pid=q.id,ctx.They=A.cap(A.he(q)),ctx.they=A.he(q)},
        title: "Report on a friend",
        text: 'Your handler slides a name across the table. It is {themFull}, your friend. "We hear {they} talks to the wrong people. You will tell us everything."',
        choices: [
          {
            t: "Report everything, honestly",
            r: "You tell them about the dice debts and the cousin across the border. {They} never learns why the reeve became so interested.",
            fx: {honor:-4,them:{type:"friend",op:-5},wil:.5,rep:3},
          },
          {
            t: "Report the harmless half",
            check: {s:"deception",s2:"int",d:46},
            win: {
              r: "Dull truths, carefully chosen. Your handler loses interest. {They} never knows how close it came.",
              fx: {honor:2,rep:1},
            },
            lose: {r:"Another informer told the other half. Now they watch you too.",fx:{rep:-6,wil:.5}},
          },
          {
            t: "Warn {themHim}",
            r: "A word over a cup. {They} goes pale, then thanks you, then is careful for a year. Friendship is also a kind of treason.",
            fx: {them:{type:"bestfriend",op:25},honor:3,rep:-4},
          },
        ],
      },
      {
        id: "sc_spd_name",
        cond: (p,C)=>C.adult(p)&&C.job(p,"spy")&&!C.prison(p)&&(p.job.y||0)>=2,
        w: .7,
        cool: 15,
        setup: (p,ctx)=>{ctx.hanged=nm(p,"M")},
        title: "The name you gave",
        text: "On market day they hang {hanged}, a man whose name you sold for nine suns two years ago. His mother is in the crowd. So are you.",
        choices: [
          {
            t: "Stay and watch it to the end",
            r: "You owe him that much. You do not sleep that night, or much of the next month.",
            fx: {wil:2,happy:-6},
          },
          {
            t: "Leave money at his mother's door",
            r: "Twenty suns in a cloth, no name. She will never know what it is for. Neither, quite, do you.",
            fx: {coin:-20,honor:2,wil:1},
          },
          {
            t: "Walk away. It was his choice, and yours was the job",
            r: "You tell yourself that all the way home. It works, mostly.",
            fx: {wil:.5,honor:-1},
          },
        ],
      },
      {
        id: "sc_kn_small_lists",
        trigger: !0,
        opp: ["knight"],
        maxRank: 1,
        cool: 3,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{ctx.baron="Lord "+nm(p,"M"),ctx.prize=A.pick(["a bay courser","a mail shirt","a silver cup and twenty suns"])},
        title: "A small tourney",
        text: "{baron} holds lists in a sheep meadow for his daughter's name-day. Twelve knights, most of them as poor as you, a fence of hurdles, and a prize of {prize}. Entry is ten suns.",
        choices: [
          {
            t: "Enter the joust (10 suns)",
            req: p=>p.coin>=10,
            r: "You pay the herald and walk your horse to the end of the lists.",
            fx: (p,ctx)=>(p.coin-=10,A.addRep(p,2),bout(p,ctx,{joust:!0,k:"tourney",tier:2,place:"a sheep meadow at "+home(p),title:"The name-day lists",occ:"a hedge knight"})),
          },
          {
            t: "Enter the sword bouts instead (10 suns)",
            req: p=>p.coin>=10,
            r: "Blunted blades, a judge with a staff, first touch wins.",
            fx: (p,ctx)=>(p.coin-=10,A.addRep(p,1),bout(p,ctx,{k:"tourney",tier:2,place:"the meadow at "+home(p),title:"The name-day bouts",occ:"a hedge knight"})),
          },
          {
            t: "Offer to serve as marshal of the lists",
            check: {s:"etiquette",s2:"riding",d:40},
            win: {
              r: "You run the lists well and fairly. {baron} pays you twelve suns and asks you to stay for supper.",
              fx: {coin:12,rep:3,newRel:{type:"friend",op:20}},
            },
            lose: {
              r: "You call a hit that half the meadow saw differently. Nobody pays you, and two knights want to fight you instead.",
              fx: {rep:-3},
            },
          },
        ],
      },
      {
        id: "sc_kn_retainer",
        trigger: !0,
        opp: ["knight"],
        minRank: 1,
        maxRank: 2,
        cool: 6,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{const q=who(p,ctx,"acquaint","a lord who wants a champion");greatHouse(p,q,ctx),q.status="noble"},
        title: "A lord's livery",
        text: '{themFull}{hof} has watched you ride. "Wear my colours. Two hundred suns a year, a place at my table, and a horse when you kill one." Livery is a leash too, and {their} house has old feuds.',
        choices: [
          {
            t: "Take the livery",
            r: "You ride under {house}'s colours now. The pay is steady, and so are the enemies.",
            fx: {coin:100,rep:5,flag:"sc_livery",them:{type:"lord",op:25,back:"acquaint"}},
          },
          {
            t: "Bargain for more",
            check: {s:"persuasion",s2:"etiquette",d:55},
            win: {
              r: "Three hundred, two horses and the right to ride for yourself at the great lists. {They} laughs and agrees.",
              fx: {coin:150,rep:7,flag:"sc_livery",them:{type:"lord",op:20,back:"acquaint"}},
            },
            lose: {
              r: "{They} finds your price insulting and finds another knight by Sunday.",
              fx: {rep:-2,them:{type:"acquaint",op:-15}},
            },
          },
          {
            t: "Stay your own man",
            r: '"My lance is my own." {They} shrugs. Free knights eat when they win.',
            fx: {honor:2,rep:1},
          },
        ],
      },
      {
        id: "sc_kn_sleeve",
        trigger: !0,
        opp: ["knight"],
        maxRank: 2,
        cool: 6,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{who(p,ctx,"acquaint","a lady of the court","F"),ctx.betrothed="Sir "+nm(p,"M")},
        title: "Her sleeve, his rage",
        text: 'Lady {them} sends her maid with a green silk sleeve. "Wear it in the lists tomorrow." Her betrothed, {betrothed}, is riding too, and everyone at court knows she would rather marry a mule.',
        choices: [
          {
            t: "Wear it, and ride against {betrothed}",
            r: "You tie the green sleeve to your helm. The crowd roars. {betrothed} does not.",
            fx: (p,ctx)=>(A.applyFx(p,{them:{type:"friend",op:25},fame:1},ctx),bout(p,ctx,{joust:!0,k:"tourney",tier:3,place:"the lists at "+capOf(p),title:"For a lady's sleeve",occ:"a jealous betrothed"})),
          },
          {
            t: "Return it with a graceful verse",
            check: {s:"etiquette",s2:"music",d:45},
            win: {
              r: "Four lines about duty and green silk. She laughs, the court repeats it, and nobody is offended.",
              fx: {rep:3,honor:2,them:{type:"friend",op:15},skill:{etiquette:1}},
            },
            lose: {r:"The verse does not scan, and the court repeats that instead.",fx:{rep:-2,happy:-2}},
          },
          {
            t: "Wear it, and quietly tell {betrothed} it means nothing",
            check: {s:"diplomacy",s2:"deception",d:50},
            win: {
              r: "Everyone is satisfied: the lady has her gesture, the betrothed his pride, and you a full purse from both.",
              fx: {coin:30,rep:4,them:{type:"friend",op:10}},
            },
            lose: {
              r: "Both of them hear what you told the other. Now you have two enemies and a sleeve.",
              fx: {rep:-4,them:{type:"enemy",op:-20},newRel:{type:"enemy",op:-30}},
            },
          },
        ],
      },
      {
        id: "sc_kn_beast",
        trigger: !0,
        opp: ["knight"],
        minRank: 1,
        cool: 6,
        time: 2,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{beastOf(p,ctx),ctx.lord="Lord "+nm(p,"M")},
        title: "A lord's quest",
        text: "Something has been killing in {lord}'s lands near {bwhere}: sheep, then a shepherd's dog, then the shepherd. The huntsmen give it a name: {bname}. {lord} offers a horse and a hundred suns to the knight who brings back its head.",
        choices: [
          {
            t: "Ride out at once",
            r: "You ride out before the lord has finished speaking.",
            fx: (p,ctx)=>(A.applyFx(p,{rep:4,coin:50,fame:1},ctx),F(p,ctx,{beast:{place:"the hills near "+home(p)}})),
          },
          {
            t: "Track it for three days first",
            check: {s:"tracking",s2:"survival",d:50},
            win: {
              r: "You find where it drinks and where it sleeps. When you come, you come from downwind.",
              fx: (p,ctx)=>(A.applyFx(p,{rep:5,coin:60,skill:{tracking:2}},ctx),A.startDuelFront(p,{beastId:ctx.beast,mod:.7},{kind:"beast",place:"its own lair",title:"The quest"}),""),
            },
            lose: {
              r: "Three days of following the wrong tracks. It finds you instead, on the fourth.",
              fx: (p,ctx)=>(A.startDuelFront(p,{beastId:ctx.beast,mod:1.1},{kind:"beast",place:"a wet hollow",title:"The quest"}),""),
            },
          },
          {
            t: "Ask half the reward up front",
            check: {s:"persuasion",s2:"etiquette",d:46},
            win: {
              r: "Fifty suns in your purse before you ride. Then the beast, as promised.",
              fx: (p,ctx)=>(A.applyFx(p,{coin:50,rep:2},ctx),F(p,ctx,{beast:{place:"the woods near "+home(p)}})),
            },
            lose: {r:'"A true knight does not haggle." {lord} gives the quest to someone else.',fx:{rep:-3}},
          },
          {
            t: "Decline. You are a knight of the lists, not a huntsman",
            r: "Somebody else rides out. You hear later how it went.",
            fx: {rep:-2},
          },
        ],
      },
      {
        id: "sc_kn_pilgrims",
        trigger: !0,
        opp: ["knight"],
        maxRank: 2,
        cool: 5,
        time: 2,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{const S={"REL-01":"the Shadow Needle at Solenne","REL-07":"the Well of Samar","REL-10":"the Temple City of Ranpur","REL-08":"the flood temple at Tamar","REL-06":"the monasteries of Skyhold"},f=A.faith(p.faith);ctx.shrine=S[p.faith]||`the great shrine of ${A.godWord(p)}`,ctx.n=A.ri(20,40)},
        title: "Escort to the shrine",
        text: "A band of {n} pilgrims bound for {shrine} want a knight to ride with them through the bad country. They can pay twenty suns between them and their prayers. On the third day, men with spears block the road.",
        choices: [
          {
            t: "Ride at the leader",
            r: "You lower your lance and spur your horse. The pilgrims start praying very loudly.",
            fx: (p,ctx)=>(A.applyFx(p,{coin:20,rep:4,piety:3,honor:3},ctx),bout(p,ctx,{k:"duel",tier:2,lethal:!0,place:"the pilgrim road",title:"Bandits on the road",occ:"a bandit"})),
          },
          {
            t: "Face them down from the saddle",
            check: {s:"intimidation",s2:"riding",d:46},
            win: {
              r: "A knight in mail on a big horse is an argument. They melt back into the trees.",
              fx: {coin:20,rep:4,piety:3,honor:2,skill:{intimidation:2}},
            },
            lose: {
              r: "They are hungry enough not to care. The spears come on.",
              fx: (p,ctx)=>bout(p,ctx,{k:"duel",tier:2,lethal:!0,place:"the pilgrim road",title:"Bandits on the road",occ:"a bandit"}),
            },
          },
          {
            t: "Pay the toll out of your own purse",
            req: p=>p.coin>=15,
            r: "Fifteen suns, and the pilgrims bless your name at the shrine. Some knights would call it shameful. The pilgrims call it wise.",
            fx: {coin:-15,piety:4,rep:1},
          },
        ],
      },
      {
        id: "sc_kn_lose",
        trigger: !0,
        opp: ["knight"],
        minRank: 1,
        cool: 5,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{who(p,ctx,"acquaint","a lord with a son in the lists"),ctx.son=nm(p,"M")},
        title: "Lose to my son",
        text: '{themFull} finds you at the horse lines the night before the lists. "My son {son} rides against you tomorrow. He is not good, and his mother is watching. Eighty suns if you fall well."',
        choices: [
          {
            t: "Take the purse and fall well",
            check: {s:"riding",s2:"ins",d:45},
            win: {
              r: "A glancing blow, a long tumble, a groan for the crowd. {son}'s mother weeps with joy.",
              fx: {coin:80,honor:-4,them:{type:"friend",op:20}},
            },
            lose: {
              r: "You fall too well. Your shoulder hits the barrier and something in it gives.",
              fx: {coin:80,honor:-4,health:-14,wound:"back",cause:"a bad fall in the lists"},
            },
          },
          {
            t: "Refuse, and ride to win",
            r: '"I ride to win, my lord." {They} goes white. You will meet {son} as you meet anyone.',
            fx: (p,ctx)=>(A.applyFx(p,{honor:3,them:{type:"enemy",op:-25}},ctx),bout(p,ctx,{joust:!0,k:"tourney",tier:1,place:"the lists at "+home(p),title:"Against the lord's son",occ:"a lord's son"})),
          },
          {
            t: "Tell the marshals of the lists",
            r: "The marshals thank you, fine the lord, and seat him far from the royal stand. He will not forget.",
            fx: {rep:5,honor:4,them:{type:"enemy",op:-40}},
          },
        ],
      },
      {
        id: "sc_kn_great_lists",
        trigger: !0,
        opp: ["knight"],
        minRank: 2,
        cool: 4,
        time: 2,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{ctx.lists=lists(p),ctx.chant=R(p,"POL-03")?"Lion-trained knights ride straight at you and trust the first shock.":R(p,"POL-01")?"Sir Roland Ashby's riders lay the lance inside the rim of the shield, along the grain.":R(p,"POL-02")?"The Knights of the Sun fight with mace and shield from the saddle.":"The crowd stands three deep and bets on everything."},
        title: "The great lists",
        text: "You are invited to ride at {lists}, against the best of the realm, with the {rulerTitle}'s household in the stand. {chant}",
        choices: [
          {
            t: "Ride, and aim for the champion",
            r: "The herald cries your name, and your horse knows what that means before you do.",
            fx: (p,ctx)=>(A.applyFx(p,{rep:5,fame:2},ctx),bout(p,ctx,{joust:!0,champ:!0,k:"tourney",place:ctx.lists,title:"The great lists",occ:"a champion of the lists"})),
          },
          {
            t: "Ride carefully, for a good showing and a patron",
            check: {s:"lance",s2:"etiquette",d:52},
            win: {
              r: "Three clean courses, two lances broken, and a lord of the household asks your name over supper.",
              fx: {rep:8,fame:2,coin:60,newRel:{type:"friend",op:25}},
            },
            lose: {r:"A careful knight is a dull knight. The crowd forgets you before the next course.",fx:{rep:-2}},
          },
          {
            t: "Send your regrets",
            r: "The heralds strike your name. A younger knight rides in your place, and wins.",
            fx: {rep:-5},
          },
        ],
      },
      {
        id: "sc_kn_stand",
        trigger: !0,
        opp: ["knight"],
        minRank: 1,
        cool: 7,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{ctx.old="Lord "+nm(p,"M"),who(p,ctx,"acquaint","a young hothead with a grievance"),ctx.where=R(p,"POL-03")?"outside the walls, since Varenna bans duels inside them":"in a field at dawn"},
        title: "Stand for an old man",
        text: "{old} is sixty and has a bad heart. {themFull}, twenty-two and drunk on an insult, has challenged him to a private fight {where}. No court will stop it; a duel between nobles is no trial, only a private fight. {old}'s daughter asks you to stand in her father's place.",
        choices: [
          {
            t: "Stand for him, to first blood",
            r: "You take the old man's glove and meet {them} on the wet grass.",
            fx: (p,ctx)=>(A.applyFx(p,{honor:4,rep:4,them:{type:"enemy",op:-30}},ctx),bout(p,ctx,{them:!0,k:"duel",lethal:!1,place:"a field at dawn",title:"Standing for an old man"})),
          },
          {
            t: "Talk them both into a tourney bout instead",
            check: {s:"diplomacy",s2:"etiquette",d:54},
            win: {
              r: "Blunted lances at the next lists, and honor satisfied either way. The old lord dies in his bed four years later.",
              fx: {rep:6,honor:3,favor:3,them:{type:"acquaint",op:10}},
            },
            lose: {
              r: "The young man calls you a coward and the old man calls you a meddler. They fight anyway.",
              fx: {rep:-3},
            },
          },
          {
            t: "Refuse. It is not your quarrel",
            r: "The daughter does not speak to you again. Her father wins, somehow, and limps for the rest of his life.",
            fx: {rep:-2},
          },
        ],
      },
      {
        id: "sc_kn_squire",
        trigger: !0,
        opp: ["knight"],
        minRank: 1,
        cool: 8,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{const q=who(p,ctx,"acquaint","a merchant's son who wants to be a knight","M");q.born=A.S.year-Math.round(GD.RACES[q.race].adult*.9),ctx.father=nm(p,"M")},
        title: "A squire for sale",
        text: "{father}, a wool merchant, offers sixty suns a year if you take his son {them} as your squire and make a knight of {themHim}. The boy cannot sit a horse and is frightened of swords. He looks at you with enormous hope.",
        choices: [
          {
            t: "Take the money and the boy, and train {themHim} hard",
            check: {s:"command",s2:"riding",d:50},
            win: {
              r: "A year of mud and bruises. By spring {them} can ride, carry a lance and fall without crying. {They} would die for you.",
              fx: {coin:60,rep:4,them:{type:"student",op:45,back:"mentor"},skill:{command:2}},
            },
            lose: {
              r: "The boy breaks an arm in the first month and goes home. The merchant wants his money back.",
              fx: {rep:-3,them:{type:"student",op:10,back:"mentor"}},
            },
          },
          {
            t: "Take the money and let the boy hold your horse",
            r: "Sixty suns for a horse-holder. {They} never learns a thing, and slowly realizes it.",
            fx: {coin:60,honor:-3,them:{type:"student",op:-5,back:"mentor"}},
          },
          {
            t: 'Refuse kindly: "Your son is a counting-house man"',
            r: "The father is offended. The boy looks relieved.",
            fx: {honor:2,them:{type:"friend",op:10}},
          },
        ],
      },
      {
        id: "sc_kn_destrier",
        trigger: !0,
        opp: ["knight"],
        maxRank: 2,
        cool: 8,
        cond: (p,C)=>C.adult(p)&&!C.gear(p,"mount","destrier"),
        setup: (p,ctx)=>{ctx.horse=A.pick(["a grey stallion from the Varennan studs","a black from the Horse Road","a heavy bay from the Aldmark marches"])},
        title: "A destrier for sale",
        text: "A dealer at the horse fair has {horse}, trained for war: a horse that turns a knight into the heaviest thing on the field short of a giant. He wants eight hundred suns. In the next pen is a half-broken colt of the same blood for two hundred and fifty.",
        choices: [
          {
            t: "Buy the destrier (800 suns)",
            req: p=>p.coin>=800,
            r: "Eight hundred suns. You ride him out of the fair and every head turns.",
            fx: {coin:-800,gear:{mount:"destrier"},rep:5,fame:1},
          },
          {
            t: "Buy the colt and break him yourself (250 suns)",
            req: p=>p.coin>=250,
            check: {s:"riding",s2:"husbandry",d:52},
            win: {
              r: "A summer of falls and patience, and he is yours as no bought horse ever is.",
              fx: {coin:-250,gear:{mount:"destrier"},skill:{riding:3},rep:3},
            },
            lose: {
              r: "He throws you, twice, and the second time you land badly. You sell him back at a loss.",
              fx: {coin:-150,health:-12,wound:"broken_ribs",cause:"a fall from a horse"},
            },
          },
          {
            t: "Walk away. Your old horse knows you",
            r: "Your old horse nuzzles your pocket for an apple. You give him two.",
            fx: {happy:2},
          },
        ],
      },
      {
        id: "sc_kn_crown",
        trigger: !0,
        opp: ["knight"],
        minRank: 3,
        cool: 5,
        time: 2,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{heirOf(p,ctx)},
        title: "The crown's lists",
        text: "You are the first lance of the {realm}. The {rulerTitle} sends for you twice in one week: once to ride against a foreign champion at the court feast, once to teach the lance to {themFull}, {royal}.",
        choices: [
          {
            t: "Ride against the foreign champion",
            r: "A foreign champion in a strange harness, and the whole court leaning forward.",
            fx: (p,ctx)=>(A.applyFx(p,{favor:5,rep:4,fame:2},ctx),bout(p,ctx,{joust:!0,champ:!0,tier:5,k:"tourney",place:"the court lists at "+capOf(p),title:"The crown's lists",occ:"a foreign champion"})),
          },
          {
            t: "Teach {themFull} the lance",
            check: {s:"lance",s2:"command",d:55},
            win: {
              r: "A season of mornings in the yard. {They} learns to keep the lance low and the heel down, and to trust you.",
              fx: {favor:12,rep:8,them:{type:"student",op:35,back:"mentor"},skill:{command:2}},
            },
            lose: {
              r: "{They} falls, hurts a wrist and blames the teacher. Royal blood is never at fault.",
              fx: {favor:-10,rep:-4,them:{type:"acquaint",op:-15}},
            },
          },
          {
            t: "Ask the {rulerTitle} for land instead of praise",
            check: {s:"persuasion",s2:"etiquette",d:58},
            win: {
              r: "A manor and its mills, for the realm's first lance. You will never be a hedge knight again.",
              fx: {asset:"manor",favor:-2,rep:4,fame:2},
            },
            lose: {
              r: '"We had thought you served for glory." The court laughs, and the {rulerTitle} does not.',
              fx: {favor:-10,rep:-5},
            },
          },
        ],
      },
      {
        id: "sc_kn_summons",
        trigger: !0,
        opp: ["knight"],
        cool: 4,
        time: 2,
        cond: (p,C)=>C.adult(p)&&C.atWar(p),
        setup: (p,ctx)=>{ctx.foe=enemyOf(p)},
        title: "The summons",
        text: "War with {foe}. Your lord's summons comes with a herald and a list of names, and yours is on it: knights to ride within the month, with horse, harness and two men.",
        choices: [
          {
            t: "Answer it, and ride",
            r: "You ride with the host. In the first skirmish, an enemy knight picks you out by your shield.",
            fx: (p,ctx)=>(A.applyFx(p,{honor:4,rep:4,favor:3},ctx),bout(p,ctx,{joust:!0,k:"duel",tier:3,lethal:!0,place:"a skirmish by the border",title:"War",occ:"a knight of "+ctx.foe})),
          },
          {
            t: "Pay shield-money instead (60 suns)",
            req: p=>p.coin>=60,
            r: "Sixty suns buys another man's sword in your place. It is lawful. It is not admired.",
            fx: {coin:-60,honor:-3,rep:-2},
          },
          {
            t: "Sell your lance to {foe} for double",
            r: "Double pay and a new set of enemies, including everyone you grew up with.",
            fx: {coin:150,honor:-15,rep:-6,favor:-30,flag:"sc_turncloak"},
          },
        ],
      },
      {
        id: "sc_kn_bridge",
        trigger: !0,
        opp: ["knight"],
        maxRank: 1,
        cool: 5,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{who(p,ctx,"acquaint","a knight holding a bridge")},
        title: "The knight at the bridge",
        text: "{themFull} has hung a shield on a post at the only bridge for a day's ride, and sworn to joust every knight who crosses, for a year. Those who will not ride must leave their spurs. Twelve pairs of spurs hang there already.",
        choices: [
          {
            t: "Strike the shield and ride",
            r: "You strike the shield with your lance butt. {They} smiles and mounts.",
            fx: (p,ctx)=>(A.applyFx(p,{fame:1,rep:2},ctx),bout(p,ctx,{them:!0,joust:!0,k:"tourney",place:"the bridge",title:"The knight at the bridge"})),
          },
          {
            t: "Ford the river upstream",
            check: {s:"riding",s2:"sta",d:44},
            win: {
              r: "Cold water to the saddle, but you keep your spurs and your dignity.",
              fx: {sta:.4,skill:{riding:1}},
            },
            lose: {
              r: "Your horse loses its footing and you lose your helm to the river.",
              fx: {health:-6,coin:-12,happy:-3},
            },
          },
          {
            t: "Hang up your spurs and cross",
            r: "You leave your spurs on the post. The story will follow you to every hall for years.",
            fx: {rep:-4,honor:-2},
          },
        ],
      },
      {
        id: "sc_knd_armorer",
        cond: (p,C)=>C.adult(p)&&!C.prison(p)&&(J(p,"knight","mercenary","bounty")||C.armored(p)&&!C.soldier(p)&&p.coin>=20),
        w: 1,
        cool: 6,
        title: "The armorer's bill",
        text: "The armorer has mended your mail, riveted a hundred rings and straightened your helm. The bill is thirty suns. Without harness, a fighter is only a target.",
        choices: [
          {
            t: "Pay it",
            req: p=>p.coin>=30,
            r: "Thirty suns. You walk out ringing like a temple bell, and twice as safe.",
            fx: {coin:-30,happy:1},
          },
          {
            t: "Haggle",
            check: {s:"trade",s2:"persuasion",d:46},
            win: {
              r: "Twenty, and a story about the time you unhorsed his cousin. He likes the story.",
              fx: {coin:-20,skill:{trade:1}},
            },
            lose: {r:"He raises it to thirty-five for wasting his morning.",fx:{coin:-35}},
          },
          {
            t: "Pawn your helm to pay",
            r: "You go bareheaded for a season. People can see your face, at least.",
            fx: {coin:-5,looks:1,health:-3},
          },
        ],
      },
      {
        id: "sc_knd_old",
        cond: (p,C)=>C.adult(p)&&!C.prison(p)&&(C.job(p,"knight")||C.mounted(p)&&["gentry","noble","royal"].includes(p.status)),
        w: .7,
        cool: 15,
        setup: (p,ctx)=>{who(p,ctx,"acquaint","an old hedge knight")},
        title: "The last of a hedge knight",
        text: "On the road you find an old knight, {themFull}, sitting against a milestone with his horse grazing beside him. He has a fever and no squire, and he knows what that means.",
        choices: [
          {
            t: "Stay with him to the end",
            r: 'Three days. He tells you of forty years of lists and two real fights, and gives you his sword and one piece of advice: "Watch the horse, not the man."',
            fx: {skill:{lance:2,riding:1},wil:1,honor:3,piety:2,deed:"Buried an old knight on the road"},
          },
          {
            t: "Carry him to the nearest monastery",
            check: {s:"sta",s2:"riding",d:40},
            win: {
              r: "The monks nurse him through it. He lives, and owes you a debt he will repay in ways you cannot guess.",
              fx: {honor:4,them:{type:"friend",op:40}},
            },
            lose: {
              r: "He dies on the road, tied to your saddle. You bury him at the monastery gate.",
              fx: {wil:1,honor:2},
            },
          },
          {
            t: "Leave him some water and ride on",
            r: "You leave a flask and a prayer. You look back once.",
            fx: {honor:-2,happy:-2},
          },
        ],
      },
      {
        id: "sc_knd_arms",
        cond: (p,C)=>C.adult(p)&&C.job(p,"knight")&&!C.prison(p),
        w: .8,
        cool: 12,
        title: "Your arms",
        text: "A herald at the lists questions your arms: the charge on your shield is too close to an old house's, and he wants proof of your descent before you may ride under it.",
        choices: [
          {
            t: "Argue your descent from the rolls",
            check: {s:"etiquette",s2:"learning",d:50},
            win: {
              r: "You name your grandfather's grandfather and the battle he bled at. The herald enters you in his roll.",
              fx: {rep:4,skill:{etiquette:2}},
            },
            lose: {
              r: "The herald is unconvinced. You must ride under a plain shield until you can prove it.",
              fx: {rep:-3,honor:-1},
            },
          },
          {
            t: "Change the charge: a new device for a new name",
            r: "You paint a new device. It is yours, and nobody else's. In ten years it might mean something.",
            fx: {coin:-5,rep:1},
          },
          {
            t: "Grease the herald's palm",
            req: p=>p.coin>=15,
            r: "Fifteen suns, and your ancestry is suddenly beyond doubt.",
            fx: {coin:-15,honor:-2},
          },
        ],
      },
      {
        id: "sc_knd_fall",
        cond: (p,C)=>C.adult(p)&&!C.prison(p)&&(C.job(p,"knight")||C.mounted(p)&&C.prof(p,"lance",35)),
        w: .8,
        cool: 8,
        title: "The quintain",
        text: "Practice at the quintain. The bag swings round faster than you expected and takes you out of the saddle. You lie in the mud looking at the sky, and your leg is not right.",
        choices: [
          {
            t: "Rest it a full season",
            r: "A season of sitting still. It heals straight, and you are poorer and stiffer for it.",
            fx: {health:4,coin:-10,happy:-3,wil:.5},
          },
          {
            t: "Ride through it",
            check: {s:"wil",s2:"sta",d:48},
            win: {
              r: "It hurts every day for a month, then less, then not at all. You never fall to that bag again.",
              fx: {wil:1.5,skill:{lance:2}},
            },
            lose: {
              r: "It never heals right. You will feel this knee every winter for the rest of your life.",
              fx: {wound:"bad_knee",wil:1,health:-8,cause:"a fall at the quintain"},
            },
          },
        ],
      },
      {
        id: "sc_knd_inn",
        cond: (p,C)=>C.adult(p)&&C.job(p,"knight")&&p.job.r<=1&&!C.prison(p),
        w: .9,
        cool: 6,
        title: "Hedge knight",
        text: 'In the common room a drunk wool-merchant points at your patched surcoat. "Look, a hedge knight! Sleeps under a hedge, eats from one too!" Half the room laughs.',
        choices: [
          {
            t: "Laugh louder than any of them",
            check: {s:"persuasion",s2:"wil",d:40},
            win: {
              r: '"And fights for one, when the price is right." The room laughs with you now, and someone buys your supper.',
              fx: {happy:3,rep:1},
            },
            lose: {r:"Your laugh comes out wrong. The joke follows you to the next town.",fx:{happy:-3}},
          },
          {
            t: "Teach him manners",
            r: "You stand up. So does he, unwisely.",
            fx: (p,ctx)=>bout(p,ctx,{k:"brawl",tier:1,place:"the common room",title:"Manners",occ:"a drunk wool merchant"}),
          },
          {
            t: "Finish your ale and leave",
            r: "A knight need not answer every dog. Still, it stings.",
            fx: {wil:.5,happy:-1},
          },
        ],
      },
      {
        id: "sc_pt_first",
        trigger: !0,
        opp: ["pitfighter"],
        maxRank: 0,
        cool: 3,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{ctx.pit=pit(p),ctx.foe=punch(p)},
        title: "Your first purse",
        text: "The bout-master of {pit} gives you five suns to step into the ring tonight against {foe}. The crowd stands three deep and bets on everything, including how long you will last.",
        choices: [
          {
            t: "Box him",
            r: "Five suns in your boot, fists up, and the crowd yelling for blood. Yours, mostly.",
            fx: (p,ctx)=>(A.applyFx(p,{coin:5,rep:2},ctx),bout(p,ctx,{k:"brawl",tier:1,place:ctx.pit,title:"Your first purse",occ:"a pit brawler",weapon:"fists"})),
          },
          {
            t: "Get inside and wrestle",
            check: {s:"unarmed",s2:"str",d:42},
            win: {
              r: "He swings, you duck, and then he is on his back in the sawdust. The crowd did not expect that. Neither did he.",
              fx: {coin:9,rep:5,skill:{unarmed:2},fame:1},
            },
            lose: {
              r: "He is heavier than he looks. You spend the bout underneath him and the next week coughing.",
              fx: {coin:5,health:-10,wil:1,wound:"broken_ribs",cause:"a pit bout"},
            },
          },
          {
            t: "Lose on purpose for the bout-master's wager",
            r: "You take two punches and lie down in the third round. The bout-master gives you an extra three suns and a look of respect.",
            fx: {coin:8,honor:-2,health:-4},
          },
        ],
      },
      {
        id: "sc_pt_third",
        trigger: !0,
        opp: ["pitfighter"],
        maxRank: 2,
        cool: 4,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{ctx.pit=pit(p),who(p,ctx,"acquaint","a bout-master"),ctx.purse=20+(p.job?p.job.r:0)*20},
        title: "Fall in the third",
        text: '{themFull}, who runs the bouts at {pit}, counts out {purse} suns on a barrel head. "Your man is the long shot tonight. You go down in the third. Every bout-master knows the price of a stumble, and this is it."',
        choices: [
          {
            t: "Take the purse and go down in the third",
            check: {s:"deception",s2:"unarmed",d:44},
            win: {
              r: "A heavy blow you roll with, a stagger, a long fall. Nobody in the crowd doubts it, and {them} buys you supper.",
              fx: (p,ctx)=>F(p,ctx,{coin:ctx.purse,honor:-4,them:{type:"friend",op:15}}),
            },
            lose: {
              r: "You fall too soon and too pretty. The crowd smells it and throws stones; the bout-master pays half.",
              fx: (p,ctx)=>F(p,ctx,{coin:Math.round(ctx.purse/2),honor:-4,rep:-6,health:-5}),
            },
          },
          {
            t: "Take the purse, and win anyway",
            r: "You take the money, and in the third round you take the fight too. {them} loses a fortune, and the crowd loves you for it.",
            fx: (p,ctx)=>(A.applyFx(p,{coin:ctx.purse,rep:6,fame:2,honor:-2,them:{type:"enemy",op:-50}},ctx),bout(p,ctx,{k:"brawl",tier:2,place:ctx.pit,title:"The bout you were paid to lose",occ:"a pit fighter"})),
          },
          {
            t: "Refuse, and fight it straight",
            r: '"I fall when I am knocked down." {They} shrugs. You will find out how fair the next bouts are.',
            fx: (p,ctx)=>(A.applyFx(p,{honor:3,rep:2,them:{type:"acquaint",op:-15}},ctx),bout(p,ctx,{k:"brawl",tier:2,place:ctx.pit,title:"A straight fight",occ:"a pit fighter"})),
          },
          {
            t: "Tell the crowd, loudly",
            check: {s:"persuasion",s2:"wil",d:50},
            win: {
              r: "You hold the coins over your head and tell them who paid. The crowd turns on {them}, and they chant your name all the way home.",
              fx: {rep:7,fame:3,honor:4,them:{type:"enemy",op:-60}},
            },
            lose: {r:"Nobody believes you. {They} has you banned from {pit}.",fx:{rep:-6,them:{type:"enemy",op:-40}}},
          },
        ],
      },
      {
        id: "sc_pt_bear",
        trigger: !0,
        opp: ["pitfighter"],
        minRank: 1,
        cool: 8,
        cond: (p,C)=>C.adult(p)&&!R(p,...ELF),
        setup: (p,ctx)=>{ctx.pit=pit(p),ctx.beast="CRE-25"},
        title: "The bear",
        text: "The bout-master has bought an old cave bear from a travelling show, half blind and chained by one leg. Forty suns to the fighter who will step in with it for the length of a hymn. The crowd has never paid so much to stand so close.",
        choices: [
          {
            t: "Step in with it",
            r: "The chain is long and the bear is not as old as they said.",
            fx: (p,ctx)=>(A.applyFx(p,{coin:40,rep:6,fame:2},ctx),A.startDuelFront(p,{beastId:"CRE-25",mod:.55},{kind:"beast",place:ctx.pit,title:"The bear"}),""),
          },
          {
            t: "Dance round it and play to the crowd",
            check: {s:"spd",s2:"athletics",d:52},
            win: {
              r: "A hymn is a long time, but you are never where the paw is. The crowd throws coins into the ring.",
              fx: {coin:55,rep:7,fame:2,spd:.4},
            },
            lose: {
              r: "One swipe catches you across the back before they haul you out by the collar.",
              fx: {coin:20,health:-22,wound:"scar_chest",cause:"a bear's claws",rep:2},
            },
          },
          {
            t: "Refuse. Buy the bear a quick end instead",
            req: p=>p.coin>=10,
            r: "Ten suns to a butcher, and the old bear sleeps. The bout-master calls you soft. The crowd is not sure what it thinks.",
            fx: {coin:-10,honor:3,rep:-2},
          },
          {t:"Refuse",r:"Some purses are not worth the arms you would need to carry them.",fx:{rep:-2}},
        ],
      },
      {
        id: "sc_pt_orc",
        trigger: !0,
        opp: ["pitfighter"],
        minRank: 1,
        maxRank: 2,
        cool: 5,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{ctx.pit=pit(p),["orc","halforc"].includes(p.race)?(ctx.foe="a Highland pikeman turned pit fighter, who has seen orcs fight before",ctx.plan="He means to make you fight for ten minutes. Every orc knows what happens at minute ten.",ctx.slow="Make it short"):(ctx.foe="an orc of the relay riders, a head taller than you",ctx.plan="For two minutes an orc is the most dangerous thing on Ardan. After ten he is nearly helpless.",ctx.slow="Make it long: give ground and keep him moving")},
        title: "Two minutes",
        text: "Tonight at {pit} you fight {foe}. {plan}",
        choices: [
          {
            t: "{slow}",
            check: {s:"sta",s2:"wil",d:50},
            win: {
              r: "You fight the clock instead of the man. When the bell comes, the fight has already turned.",
              fx: (p,ctx)=>(A.applyFx(p,{rep:4,sta:.5},ctx),bout(p,ctx,{k:"brawl",tier:3,place:ctx.pit,title:"Two minutes",occ:"a pit fighter",foeMods:{fat:45}})),
            },
            lose: {
              r: "The plan lasts as long as the first blow.",
              fx: (p,ctx)=>(A.applyFx(p,{health:-6},ctx),bout(p,ctx,{k:"brawl",tier:3,place:ctx.pit,title:"Two minutes",occ:"a pit fighter"})),
            },
          },
          {
            t: "Meet him head-on",
            r: "The crowd wants it, so you give it to them.",
            fx: (p,ctx)=>(A.applyFx(p,{rep:3,fame:1},ctx),bout(p,ctx,{k:"brawl",tier:3,place:ctx.pit,title:"Head-on",occ:"a pit fighter"})),
          },
          {
            t: "Ask for a different bout",
            r: "The bout-master gives you a farmhand instead, and half the purse. The crowd notices.",
            fx: {coin:8,rep:-3},
          },
        ],
      },
      {
        id: "sc_pt_name",
        trigger: !0,
        opp: ["pitfighter"],
        minRank: 2,
        cool: 10,
        cond: (p,C)=>C.adult(p)&&!p.epithet,
        setup: (p,ctx)=>{ctx.given=A.pick(["the Butcher of the Pits","Sawdust","the Grinning Bull","Bonebreaker"]),ctx.own=A.pick(["the Anvil","Ironjaw","the Wall","Stonefist","the Ox"])},
        title: "A name for the crowd",
        text: 'The crowd already chants something when you walk in, but it is not your name. The bout-master wants to paint "{given}" on the boards outside. A ring name sells bouts.',
        choices: [
          {
            t: "Take the bout-master's name",
            r: "It is ugly, and it fills the benches.",
            fx: (p,ctx)=>F(p,ctx,{epithet:ctx.given,rep:6,fame:3,coin:20}),
          },
          {
            t: "Choose your own: {own}",
            r: "You tell the painter what to write. It is your name, and you will make it mean something.",
            fx: (p,ctx)=>F(p,ctx,{epithet:ctx.own,rep:5,fame:3}),
          },
          {
            t: "Fight under your own name",
            r: "Your mother gave you a name. The crowd will learn it.",
            fx: {honor:2,rep:1},
          },
        ],
      },
      {
        id: "sc_pt_wedding",
        trigger: !0,
        opp: ["pitfighter"],
        minRank: 1,
        cool: 5,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{greatHouse(p,null,ctx),ctx.purse=30+(p.job?p.job.r:0)*25},
        title: "Blood for the wedding guests",
        text: "A lord of {house} is marrying, and wants a show between the courses: two pit fighters, blunted blades, first blood. A purse of {purse} suns, and the guests will throw more if they like it.",
        choices: [
          {
            t: "Win fast and clean",
            r: "You bow to the high table and go to work.",
            fx: (p,ctx)=>(A.applyFx(p,{coin:ctx.purse,rep:3},ctx),bout(p,ctx,{k:"spar",tier:2,place:"the great hall of "+ctx.house,title:"A wedding show",occ:"a pit fighter"})),
          },
          {
            t: "Make it a show: long, loud, nobody hurt",
            check: {s:"athletics",s2:"persuasion",d:48},
            win: {
              r: "You and the other fighter dance it like a story. The bride laughs, the groom throws a purse, and you are asked back for the christening.",
              fx: (p,ctx)=>F(p,ctx,{coin:ctx.purse+25,rep:7,fame:2,newRel:{type:"friend",op:20}}),
            },
            lose: {
              r: "The show goes wrong and the bride's mother faints. The steward pays half and shows you the door.",
              fx: (p,ctx)=>F(p,ctx,{coin:Math.round(ctx.purse/2),rep:-3}),
            },
          },
          {
            t: "Ask for double, since lords can pay",
            check: {s:"trade",s2:"intimidation",d:52},
            win: {
              r: "The steward pays double to avoid a scene before the wedding. You fight like a man who was paid double.",
              fx: (p,ctx)=>F(p,ctx,{coin:ctx.purse*2,rep:2}),
            },
            lose: {r:"The steward hires someone cheaper.",fx:{rep:-2}},
          },
        ],
      },
      {
        id: "sc_pt_ride",
        trigger: !0,
        opp: ["pitfighter"],
        minRank: 1,
        cool: 4,
        time: 2,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{R(p,"POL-11")?(ctx.where="the Great Ride at the Drum Stones, on 21 June",ctx.lore="Durk Ironarms won it four times, and in 1102 was paid to lose."):R(p,"POL-34")?(ctx.where="the Great Ride wrestling at Grakmar, on 21 June",ctx.lore="The clans bet herds on it."):R(p,"POL-12")?(ctx.where="the kurultai wrestling, standing, in hide jackets, a throw ends it",ctx.lore="Jarak of the Red Wind has won it five times."):R(p,...GIANT)?(ctx.where="the stone-throw and wrestling at the Thing",ctx.lore="A lie at the Thing makes a giant hall-less. A loss only makes him sore."):(ctx.where=`the Midsummer fair wrestling at ${capOf(p)}`,ctx.lore="The prize is a ram, a purse and a year of boasting.")},
        title: "The great wrestling",
        text: "This year you are entered in {where}. {lore} Bout-masters from three towns are watching to see who is worth buying.",
        choices: [
          {
            t: "Wrestle for the title",
            r: "You strip to the waist and walk into the ring.",
            fx: (p,ctx)=>(A.applyFx(p,{rep:4,fame:2},ctx),bout(p,ctx,{k:"brawl",champ:!0,place:ctx.where.split(",")[0],title:"The great wrestling",occ:"a champion wrestler",weapon:"fists"})),
          },
          {
            t: "Wrestle to be seen, not to win",
            check: {s:"unarmed",s2:"ins",d:48},
            win: {
              r: "Three good bouts and a gallant loss in the fourth. Two bout-masters want to talk to you.",
              fx: {rep:8,coin:30,skill:{unarmed:2}},
            },
            lose: {r:"Out in the first round, flat on your back. Nobody wants to talk to you.",fx:{rep:-3,wil:1}},
          },
          {
            t: "Sell your place to a richer fool",
            r: "Twenty-five suns for a place on the list. He loses in the first round. You eat well.",
            fx: {coin:25,rep:-2},
          },
        ],
      },
      {
        id: "sc_pt_plank",
        trigger: !0,
        opp: ["pitfighter"],
        minRank: 1,
        cool: 5,
        cond: (p,C)=>C.adult(p)&&C.coast(p),
        setup: (p,ctx)=>{ctx.where=R(p,"POL-33")?"the boarding contest at the Dice Yard":"the harbor games on Sea Opening"},
        title: "The plank",
        text: "At {where} the fighters meet on a wet plank between two hulls, with the harbor underneath. Knock him off, or be knocked off. The crowd watches from the rigging.",
        choices: [
          {
            t: "Trust your feet",
            check: {s:"athletics",s2:"sea",d:50,bonus:p=>A.hasBlood(p,"seasteady")||A.hasBlood(p,"balance")?20:0},
            win: {
              r: "He slips, you do not. He goes in with a great splash and comes up spitting. The rigging cheers.",
              fx: {coin:25,rep:6,fame:1,skill:{athletics:2}},
            },
            lose: {
              r: "You go in. The water is very cold and very dirty, and the crowd is very loud.",
              fx: {coin:5,happy:-3,health:-3},
            },
          },
          {
            t: "Fight him on the plank",
            r: "Steady, steady, then fists.",
            fx: (p,ctx)=>(A.applyFx(p,{coin:15,rep:3},ctx),bout(p,ctx,{k:"brawl",tier:2,place:"a plank over the harbor",title:"The plank",occ:"a docker"})),
          },
          {
            t: "You cannot swim. Decline",
            req: p=>p.race==="dwarf"||A.hasBlood(p,"ironbone"),
            r: "Some bodies sink like stones. Everyone on the docks knows it, and nobody holds it against you.",
            fx: {},
          },
        ],
      },
      {
        id: "sc_pt_debtor",
        trigger: !0,
        opp: ["pitfighter"],
        maxRank: 1,
        cool: 6,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{ctx.pit=pit(p);const q=who(p,ctx,"acquaint","a debtor's son","M");q.born=A.S.year-(GD.RACES[q.race].adult+1)},
        title: "A debtor's son",
        text: "Your next opponent is {themFull}, seventeen and terrified. {Their} father owes the bout-master forty suns, and the boy is fighting to clear it: three bouts, and the debt is gone. You are the third.",
        choices: [
          {
            t: "Fight him straight. The pit is the pit",
            r: "You do not hold back. It is kinder than letting him think this is a trade for him.",
            fx: (p,ctx)=>(A.applyFx(p,{honor:-1,them:{type:"enemy",op:-20}},ctx),bout(p,ctx,{them:!0,k:"brawl",place:ctx.pit,title:"The debtor's son"})),
          },
          {
            t: "Let him win",
            check: {s:"deception",s2:"unarmed",d:40},
            win: {
              r: "You make it look like a lucky blow. The debt is cleared, and the boy never knows.",
              fx: {honor:4,rep:-1,them:{type:"friend",op:30}},
            },
            lose: {
              r: "You make it look like exactly what it is. The bout-master voids the bout and the debt stands.",
              fx: {rep:-4,them:{type:"friend",op:10}},
            },
          },
          {
            t: "Pay the forty suns yourself, and fight someone else",
            req: p=>p.coin>=40,
            r: "You put forty suns on the barrel, and the boy cries. The crowd tells the story for a month.",
            fx: {coin:-40,honor:6,fame:2,them:{type:"friend",op:45}},
          },
        ],
      },
      {
        id: "sc_pt_title",
        trigger: !0,
        opp: ["pitfighter"],
        minRank: 2,
        cool: 3,
        time: 2,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{ctx.pit=pit(p),who(p,ctx,"rival","champion of the pits")},
        title: "The title bout",
        text: "{themFull} has been champion of {pit} for three years. Tonight it is {themHim} or you. The bout-masters have doubled the benches and the crowd is in the street.",
        choices: [
          {
            t: "Fight for the title",
            r: "You walk out to a noise you will remember on your deathbed.",
            fx: (p,ctx)=>(A.applyFx(p,{rep:6,fame:3,coin:60},ctx),bout(p,ctx,{them:!0,k:"duel",lethal:!1,place:ctx.pit,title:"The title bout"})),
          },
          {
            t: "Study {themHim} for a month first",
            check: {s:"ins",s2:"int",d:52},
            win: {
              r: "{They} drops the left hand after every combination. You wait for it, and the crowd sees you waiting.",
              fx: (p,ctx)=>(A.applyFx(p,{rep:5,fame:2,coin:60,ins:.6},ctx),bout(p,ctx,{them:!0,k:"duel",lethal:!1,place:ctx.pit,title:"The title bout",foeMods:{fat:25}})),
            },
            lose: {
              r: "A month of watching shows you nothing, except that {they} is better than you hoped.",
              fx: (p,ctx)=>bout(p,ctx,{them:!0,k:"duel",lethal:!1,place:ctx.pit,title:"The title bout"}),
            },
          },
          {
            t: "Not yet. Ask for another year",
            r: "The crowd boos. {They} smiles. Next year, they say, there will be another hungry young one.",
            fx: {rep:-5},
          },
        ],
      },
      {
        id: "sc_pt_wage",
        trigger: !0,
        opp: ["pitfighter"],
        minRank: 2,
        cool: 8,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{const q=who(p,ctx,"acquaint","a lord who wants a master-at-arms");greatHouse(p,q,ctx)},
        title: "A steadier wage",
        text: `{themFull}{hof} has watched you fight. "My sons need someone to teach them how a real fight goes, not a fencing master's dance. A hundred suns a year and a room in the tower."`,
        choices: [
          {
            t: "Teach the lord's sons",
            check: {s:"command",s2:"unarmed",d:46},
            win: {
              r: "Three spoiled boys who become, by winter, three boys who can take a punch. Their father pays on time.",
              fx: {coin:100,rep:3,skill:{command:2},them:{type:"friend",op:25}},
            },
            lose: {
              r: "You break the eldest's nose in the first lesson. The lord pays you off and sends you back to the pits.",
              fx: {coin:20,rep:-2,them:{type:"acquaint",op:-15}},
            },
          },
          {
            t: "Bargain: teach, and still fight",
            check: {s:"persuasion",s2:"trade",d:50},
            win: {
              r: "Mornings in the tower yard, nights in the pit. Two purses, little sleep.",
              fx: {coin:140,rep:4,sta:.4,them:{type:"friend",op:15}},
            },
            lose: {r:'"A master-at-arms does not brawl for coppers." The offer is withdrawn.',fx:{rep:-1}},
          },
          {
            t: "Stay in the pits. The crowd is your lord",
            r: "You go back to the sawdust and the roar. It is the only life that feels like yours.",
            fx: {happy:3,fame:1},
          },
        ],
      },
      {
        id: "sc_pt_hand",
        trigger: !0,
        opp: ["pitfighter"],
        minRank: 1,
        cool: 6,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{ctx.pit=pit(p),ctx.dull=R(p,"POL-30","POL-18")?"poppy in wine":R(p,...WELL)?"a bitter powder the barber will not name":"a cup of spirits strong enough to strip paint"},
        title: "A broken hand",
        text: `Your right hand broke on a man's skull last week, and the big bout is tonight. The barber at {pit} offers {dull}: "You won't feel it till morning. Then you'll feel it for a year."`,
        choices: [
          {
            t: "Drink it and fight",
            r: "You feel nothing at all. That is the problem with feeling nothing.",
            fx: (p,ctx)=>(A.applyFx(p,{rep:4,wil:1,health:-6,cause:"fighting on a broken hand"},ctx),bout(p,ctx,{k:"brawl",tier:2,place:ctx.pit,title:"The broken hand",occ:"a pit fighter"})),
          },
          {
            t: "Fight left-handed, clear-headed",
            check: {s:"wil",s2:"ins",d:54},
            win: {
              r: "The other man wastes the first minute guarding against a right that never comes. You win with the hand nobody watched.",
              fx: {coin:30,rep:7,fame:2,wil:1.5,skill:{unarmed:2}},
            },
            lose: {
              r: "He sees the hand in the first exchange and goes for it. You go down screaming.",
              fx: {coin:5,health:-14,wound:"lost_fingers",rep:-2,cause:"a broken hand"},
            },
          },
          {
            t: "Forfeit, and let it heal",
            r: "You give up the purse and the crowd's good opinion. The hand heals straight.",
            fx: {rep:-4,health:3},
          },
        ],
      },
      {
        id: "sc_pt_mask",
        trigger: !0,
        opp: ["pitfighter"],
        minRank: 1,
        cool: 8,
        cond: (p,C)=>C.adult(p),
        setup: (p,ctx)=>{ctx.pit=pit(p);const q=who(p,ctx,"acquaint","a masked fighter");greatHouse(p,q,ctx)},
        title: "The masked fighter",
        text: "A fighter in a leather mask has won six bouts at {pit}. Tonight, wrestling, the mask slips, and you see the face. It is {themFull}{hof} and the last person anyone expected in a pit. {They} sees you see it.",
        choices: [
          {
            t: "Rip the mask off for the crowd",
            r: "The crowd goes wild. A lord in the pits! {They} never comes back, and {their} family does not forget your name.",
            fx: {fame:3,rep:5,them:{type:"enemy",op:-50}},
          },
          {
            t: "Push it back on, and keep the secret",
            r: "You fix the mask with a shove that looks like a blow. Afterwards, in the dark, {they} grips your hand and says nothing at all.",
            fx: {honor:3,them:{type:"friend",op:40}},
          },
          {
            t: "Make {themHim} pay for the secret",
            check: {s:"intimidation",s2:"intrigue",d:48},
            win: {
              r: "A purse arrives at your lodging the next morning, and every month after.",
              fx: {coin:60,honor:-5,them:{type:"enemy",op:-30}},
            },
            lose: {
              r: "Lords have friends with clubs. You find this out on the way home.",
              fx: {health:-15,wound:"broken_nose",cause:"a beating by a lord's men",them:{type:"enemy",op:-40}},
            },
          },
        ],
      },
      {
        id: "sc_ptd_knuckles",
        cond: (p,C)=>C.adult(p)&&!C.prison(p)&&(C.job(p,"pitfighter")||C.prof(p,"unarmed",55)),
        w: 1,
        cool: 7,
        title: "Knuckles",
        text: "Your knuckles are a row of lumps, and two fingers on your left hand will not straighten. The barber says he can set them again, for a sun, but it will hurt more than any fight.",
        choices: [
          {
            t: "Let him set them",
            check: {s:"wil",s2:"sta",d:40},
            win: {
              r: "You bite a strap and do not scream. Six weeks later the hand closes like a hand again.",
              fx: {coin:-1,wil:1,health:4},
            },
            lose: {
              r: "You scream, and he slips. One finger will never be right.",
              fx: {coin:-1,wound:"lost_fingers",wil:1},
            },
          },
          {
            t: "Bind them and fight on",
            r: "A strip of linen and a curse. Fighters' hands all look like this by thirty.",
            fx: {health:-3,wil:.5},
          },
        ],
      },
      {
        id: "sc_ptd_shadow",
        cond: (p,C)=>C.adult(p)&&C.job(p,"pitfighter")&&p.job.r>=1&&!C.prison(p),
        w: .9,
        cool: 10,
        setup: (p,ctx)=>{const q=who(p,ctx,"acquaint","a street child");q.born=A.S.year-Math.round(GD.RACES[q.race].adult*.6)},
        title: "A shadow",
        text: "A child named {them} follows you from the pit to your lodging every night, copying your guard, your walk, the way you spit. {They} has no shoes and very fast feet.",
        choices: [
          {
            t: "Teach {themHim} a little",
            r: "Mornings in the yard behind the tannery. {They} learns the guard, and how to fall, and that you do not hit people for fun.",
            fx: {them:{type:"student",op:40,back:"mentor"},happy:4,skill:{command:1}},
          },
          {
            t: "Buy {themHim} shoes and send {themHim} to a trade",
            r: "A cobbler takes {them} on for your sake. {They} will curse you for it now and thank you in ten years.",
            fx: {coin:-6,honor:3,them:{type:"friend",op:25}},
          },
          {
            t: "Tell {themHim} to go home",
            r: '"I have no home." You walk on. {They} does not follow you again.',
            fx: {happy:-2},
          },
        ],
      },
      {
        id: "sc_ptd_oldchamp",
        cond: (p,C)=>C.adult(p)&&!C.prison(p)&&(C.job(p,"pitfighter")||C.prof(p,"unarmed",50)),
        w: .8,
        cool: 12,
        setup: (p,ctx)=>{who(p,ctx,"acquaint","a former champion of the pits")},
        title: "The old champion",
        text: "{themFull} was champion of the pits when you were a child. Now {they} sits outside the alehouse with a cup and a shaking hand, telling anyone who will listen about the bout in the year of the long winter.",
        choices: [
          {
            t: "Buy {themHim} supper and listen",
            r: "{They} tells you three things about fighting that nobody ever told you, and one about money that you will need more.",
            fx: {coin:-2,skill:{unarmed:2,melee:1},them:{type:"friend",op:30},int:.3},
          },
          {
            t: "Find {themHim} work sweeping the pit",
            r: "The bout-master grumbles and agrees. {They} sweeps the sawdust and watches every bout like a hawk.",
            fx: {honor:3,them:{type:"friend",op:40}},
          },
          {
            t: "Walk past. You will never end like that",
            r: "Every fighter in the pits has said those words. You saw {themHim} say them, years ago.",
            fx: {wil:.5,happy:-2},
          },
        ],
      },
      {
        id: "sc_ptd_dead",
        cond: (p,C)=>C.adult(p)&&C.job(p,"pitfighter")&&C.parentsAlive(p)&&!C.prison(p),
        w: .7,
        cool: 15,
        title: "Word that you are dead",
        text: "A rumor has run all the way home that you were killed in the pit. {mother} has walked two days to find your body, and finds you eating sausages.",
        choices: [
          {
            t: "Hold her while she cries",
            r: "She cries, then hits you, then cries again. She makes you promise to stop. You promise, and both of you know you are lying.",
            fx: {happy:3,rel:{who:"mother",op:10},wil:.5},
          },
          {
            t: "Promise to quit, and mean it this time",
            r: "You mean it for three weeks. Then the bout-master sends word of a purse.",
            fx: {rel:{who:"mother",op:8},rep:-2},
          },
          {
            t: "Laugh it off",
            r: "You laugh. She does not. The walk home will be long for her.",
            fx: {rel:{who:"mother",op:-10},happy:-2},
          },
        ],
      },
      {
        id: "sc_ptd_monk",
        cond: (p,C)=>C.adult(p)&&!C.prison(p)&&!C.flag(p,"sc_ptd_monk")&&(C.job(p,"pitfighter")||C.prof(p,"unarmed",50)),
        w: .7,
        once: !0,
        setup: (p,ctx)=>{ctx.who=R(p,"POL-27")?"a monk of the Hall of Still Hands":R(p,...STEPPE)?"an old steppe wrestler with a broken ear":R(p,"POL-21")?"a climber from the Rope Hall":A.pick(["a wandering monk with a staff","an old soldier with one ear","a fisherwoman who wrestles sailors for coins"])},
        title: "Another school of fists",
        text: 'After a bout, {who} stops you in the street. "You fight like a bull. Bulls die young. Let me show you something." It is offered for nothing, which makes you suspicious.',
        choices: [
          {
            t: "Learn it",
            r: "A throw, a hold, a way of breathing. Small things that make the next ten fights shorter.",
            fx: {skill:{unarmed:4},ins:.6,flag:"sc_ptd_monk"},
          },
          {
            t: "Test it first: fight the teacher",
            r: 'You swing, and you are on your back. "Again?" says the teacher.',
            fx: {skill:{unarmed:3},wil:.8,happy:-1,flag:"sc_ptd_monk"},
          },
          {
            t: "You already know how to fight",
            r: "The stranger shrugs and walks on. You will think of that shrug the next time you lose.",
            fx: {flag:"sc_ptd_monk"},
          },
        ],
      },
      {
        id: "school_rival",
        trigger: !0,
        cond: p=>!!p.school,
        setup: (p,ctx)=>{scx(p,ctx),classmate(p,ctx,"rival",!0),ctx.how=isFight(p)?A.pick(["{They} beats the new students in the yard and calls it teaching.","{They} mocks your footwork in front of the master, and the master does not stop {themHim}.","{They} has had a private teacher since the age of six and wants everyone to know it."]):A.pick(["{They} answers before the master finishes the question, and sneers at your accent.","{They} has bought every book on the list and lends none.","{They} tells the others your fees are paid by charity."]),ctx.how=ctx.how.replace(/\{They\}/g,ctx.They).replace(/\{themHim\}/g,A.him(A.P(ctx.pid))),ctx.beat=isFight(p)?"Beat "+A.him(A.P(ctx.pid))+" in the yard, in front of everyone":"Beat "+A.him(A.P(ctx.pid))+" at the disputation"},
        title: "A rival at the school",
        text: "{themFull}{hof} has decided that you are the one to beat at {school}. {how}",
        choices: [
          {
            t: "{beat}",
            r: (p,ctx)=>isFight(p)?"You ask {themHim} for a bout. The whole yard stops to watch.":"You ask the masters for a public disputation, you against {themHim}.",
            fx: (p,ctx)=>isFight(p)?(A.applyFx(p,{them:{type:"rival",op:-10},styleXp:6},ctx),bout(p,ctx,{them:!0,k:"spar",place:"the yard of "+ctx.school,title:"A bout with your rival"})):(A.trainSkill(p,"learning",1.5),A.chance(A.checkOdds(p,{s:"learning",s2:"int",d:50})/100)?(A.applyFx(p,{int:.6,skill:{[acP(p)[0]]:3,learning:2},fame:1,them:{type:"rival",op:5}},ctx),"You take {their} argument apart in front of the masters, politely, one stone at a time. Even {they} has to nod."):(A.applyFx(p,{wil:1,happy:-3,them:{type:"rival",op:-10}},ctx),"{They} wins, and makes sure you hear about it all week.")),
          },
          {
            t: "Make a friend of {themHim}",
            check: {s:"diplomacy",s2:"persuasion",d:52},
            win: {
              r: "A shared bottle and a shared enemy, the master's cook. By spring you are thick as thieves, and you will be for life.",
              fx: {them:{type:"bestfriend",op:45},happy:4,skill:{diplomacy:1}},
            },
            lose: {
              r: "{They} takes your offer of friendship as a surrender, and treats it like one.",
              fx: {them:{type:"rival",op:-15},wil:.5},
            },
          },
          {
            t: "Find {their} weak spot",
            check: {s:"intrigue",s2:"ins",d:50},
            win: {
              r: "{Their} family is up to its ears in debt. One remark at dinner, and {they} goes very quiet for the rest of the year.",
              fx: {honor:-2,them:{type:"enemy",op:-30},skill:{intrigue:2}},
            },
            lose: {
              r: "{They} finds out you were asking. Now everyone knows you play dirty.",
              fx: {honor:-2,them:{type:"enemy",op:-25},happy:-2},
            },
          },
          {
            t: "Ignore {themHim}, and work twice as hard",
            r: "You let {themHim} talk and you let the work answer. By the end of the year the masters have noticed which of you is better.",
            fx: (p,ctx)=>(A.trainSkill(p,isFight(p)?sk(p):acP(p)[0],3),F(p,ctx,{wil:1,styleXp:8,them:{type:"rival",op:-5}})),
          },
        ],
      },
      {
        id: "school_master_eye",
        trigger: !0,
        cond: p=>!!p.school,
        setup: (p,ctx)=>{scx(p,ctx)},
        title: "The master's eye",
        text: p=>isFight(p)?"{Master} stops beside you in the yard and watches you drill for a long time without a word. That evening a servant brings a message: come to the master's own yard at dawn, alone.":`{Master} hands back your work with a single line written under it: "See me." In the master's room there are two cups of wine and a book you have never heard of.`,
        choices: [
          {
            t: "Go, and work as you never have",
            r: "Dawn after dawn, until your body knows what your head did not.",
            fx: (p,ctx)=>{if(isFight(p)){const t=teachTech(p,"You do not learn a new move, but every old one gets better.");return A.applyFx(p,{styleXp:20,wil:.5,flag:"sc_masters_pupil"},ctx),t}const k=acP(p);return A.trainSkill(p,k[0],6),A.trainSkill(p,k[1]||"learning",3),A.train(p,"int",.6),p.flags.sc_masters_pupil=A.S.year,"You become the master's pupil, and the others notice."},
          },
          {
            t: "Ask to be taught the thing you cannot do",
            check: {s:"wil",s2:"ins",d:50},
            win: {
              r: 'The master smiles for the first time. "Good. Everyone asks for what they are good at." Something in you opens that you did not know was shut.',
              fx: (p,ctx)=>{const k=isFight(p)?sk(p):acP(p)[0];return A.applyFx(p,{apt:{[k]:1.25},styleXp:12,wil:1},ctx),""},
            },
            lose: {
              r: "You fail at it in front of the master for a month. You do not get better, but you get braver.",
              fx: {wil:1.5,styleXp:6},
            },
          },
          {
            t: "Ask that a poorer student be taught instead",
            r: "The master looks at you a long time, and teaches you both. The poorer student never forgets it.",
            fx: {honor:3,styleXp:6,newRel:{type:"friend",op:35}},
          },
          {
            t: "Decline. Favorites are hated",
            r: "You stay one of the many. Safer, slower, and the master does not ask twice.",
            fx: {wil:.3},
          },
        ],
      },
      {
        id: "school_choice",
        trigger: !0,
        cond: p=>!!p.school,
        setup: (p,ctx)=>{if(scx(p,ctx),isFight(p)){const st=stOf(p),w2=st?(st.weapons||[]).find(w=>w!==st.prof&&w!=="any"&&w!=="melee"&&GD.SKILLS[w]):null;ctx.k="fight",ctx.w2=w2||(sk(p)==="shield"?"spear":"shield"),ctx.optA=`go deep in ${ctx.art}, the long way`,ctx.optB=`learn the second weapon, the ${WPN[ctx.w2]||ctx.w2}`,ctx.optC="teach the beginners for your keep, and pay no more fees",ctx.text='{Master} calls your year together. "Some of you will be masters. Some of you will be soldiers. Some of you should go home." Then the master asks each of you what you want.'}else{const k=p.school.academy,O=SCHOICE[k]||SCHOICE.letters;ctx.k=k,ctx.optA=O[0][0],ctx.optB=O[1][0],ctx.optC=O[2][0],ctx.text="At {school} every student must choose a path for the last years. {Master} reads the names out, and waits for yours."}ctx.text=ctx.text.replace(/\{Master\}/g,ctx.Master).replace(/\{master\}/g,ctx.master).replace(/\{school\}/g,ctx.school)},
        title: "Which road",
        text: "{text}",
        choices: [
          {t:"Choose {optA}",r:"You choose the first road.",fx:(p,ctx)=>schoolPath(p,ctx,0)},
          {t:"Choose {optB}",r:"You choose the second road.",fx:(p,ctx)=>schoolPath(p,ctx,1)},
          {t:"Choose {optC}",r:"You choose the third road.",fx:(p,ctx)=>schoolPath(p,ctx,2)},
          {
            t: "Leave now, with what you have",
            r: "You thank the master and pack your things.",
            fx: (p,ctx)=>{const n=leaveSchool(p);return A.willGrow(p,.5),`You walk out of ${n} for the last time. What you learned there walks with you.`},
          },
        ],
      },
      {
        id: "sc_ss_welcome",
        cond: (p,C)=>fightSch(p,C),
        w: 1.1,
        once: !0,
        setup: (p,ctx)=>{scx(p,ctx),ctx.newb=(p.school.years||0)<=1?1:0,ctx.fightT=ctx.newb?"Fight back":"Stand with the new ones against the custom",ctx.rite=R(p,"POL-01","POL-05","POL-08","POL-13","POL-14")?"the new ones carry water for the hall until midwinter and are beaten with straw-stuffed sacks every Sunday":R(p,...SUNLAND)?"the new ones keep a night vigil on their knees in the chapel of arms, and the seniors make sure nobody sleeps":R(p,...ORC)?"the drums beat and the new ones wrestle the seniors one after another until they cannot stand":R(p,...ELF)?"the new ones stand still in the rain until the master remembers them, which can take a day":R(p,...DWARF)?"the new ones carry a senior's shield for a year and may not speak in the gallery":R(p,...STEPPE)?"the new ones ride the course while the seniors' blunt arrows whistle past their ears":"the seniors give the new ones a beating in the dark of the first night, and call it a welcome"},
        title: "The welcome",
        text: (p,ctx)=>ctx.newb?"At {school} there is an old custom for newcomers: {rite}. The master pretends not to know.":"At {school} there is an old custom for newcomers: {rite}. This year you are one of the seniors, and the others expect you to do your part. The master pretends not to know.",
        choices: [
          {
            t: "Take it without a word",
            req: (p,C,ctx)=>!!ctx.newb,
            check: {s:"wil",s2:"sta",d:40},
            win: {
              r: "You take everything they give and come back the next morning. By the end of the month the seniors nod to you.",
              fx: {wil:1.5,sta:.5,styleXp:6,newRel:{type:"friend",op:25}},
            },
            lose: {
              r: "You break before they are done, in front of everyone. It takes a year to live down.",
              fx: {wil:1,happy:-5},
            },
          },
          {
            t: "{fightT}",
            r: (p,ctx)=>ctx.newb?"You pick the biggest senior and go for him.":"You put yourself between the seniors and the new ones. The biggest senior laughs, and stops laughing.",
            fx: (p,ctx)=>(A.applyFx(p,ctx.newb?{styleXp:4}:{honor:3,newRel:{type:"friend",op:35}},ctx),bout(p,ctx,{k:"brawl",tier:2,place:"the dormitory of "+ctx.school,title:"The welcome",occ:"a senior student"})),
          },
          {
            t: "Turn the custom into a real lesson",
            req: (p,C,ctx)=>!ctx.newb,
            check: {s:"command",s2:"persuasion",d:46},
            win: {
              r: "You make the welcome a night of hard drills and a shared meal at the end. The custom changes a little, because of you.",
              fx: {honor:3,skill:{command:2},styleXp:6,newRel:{type:"student",op:30,back:"mentor"}},
            },
            lose: {r:"The other seniors call you soft and do it the old way anyway.",fx:{happy:-2,wil:.5}},
          },
          {
            t: "Keep your head down",
            r: (p,ctx)=>ctx.newb?"You keep your head down and get through it, one Sunday at a time.":"You do your part, as it was done to you. One of the new ones looks at you the way you once looked at your own seniors.",
            fx: (p,ctx)=>F(p,ctx,ctx.newb?{wil:1,styleXp:3}:{honor:-2,styleXp:3}),
          },
        ],
      },
      {
        id: "sc_ss_cannot",
        cond: (p,C)=>fightSch(p,C),
        w: 1,
        cool: 6,
        setup: (p,ctx)=>{scx(p,ctx);const st=stOf(p),t=st&&(st.techniques||[]).length?A.pick(st.techniques.filter(x=>x.rank>=2).concat(st.techniques).slice(0,4)):null;ctx.move=t?t.name:A.pick(["the turning cut","the low guard that becomes a thrust","the draw and cut in one motion","the hip throw from a bind","the backward step that is really an attack"])},
        title: "The move you cannot make",
        text: "Everyone in your year can do {move} now except you. You have tried it a thousand times. Your body will not do it, and {master} has stopped correcting you, which is worse.",
        choices: [
          {
            t: "Drill it alone every night",
            check: {s:"wil",s2:"sta",d:48},
            win: {
              r: "One night in late winter it simply happens, and then it happens every time. You laugh out loud in the empty yard.",
              fx: (p,ctx)=>{const t=teachTech(p,"");return A.applyFx(p,{styleXp:15,wil:1},ctx),t},
            },
            lose: {
              r: "A month of nights, and your knees ache, and it still will not come. Some moves are not for some bodies.",
              fx: {wil:1.5,sta:.4,happy:-2},
            },
          },
          {
            t: "Ask a senior student to show you",
            check: {s:"persuasion",s2:"ins",d:42},
            win: {
              r: '"You are thinking about your feet. Think about his eyes." It works. It was always going to work.',
              fx: (p,ctx)=>{const t=teachTech(p,"");return A.applyFx(p,{styleXp:10,newRel:{type:"friend",op:20}},ctx),t},
            },
            lose: {
              r: "The senior shows you, and laughs, and shows everyone else how you do it wrong.",
              fx: {happy:-3,wil:.5},
            },
          },
          {
            t: "Make your own version of it",
            check: {s:"int",s2:"ins",d:52},
            win: {
              r: "It is not the move they teach. It is a move that works for you. {Master} watches it once and says nothing, which from {master} is high praise.",
              fx: (p,ctx)=>(A.applyFx(p,{ins:1,int:.5,styleXp:12,skill:{[sk(p)]:2}},ctx),""),
            },
            lose: {
              r: "Your version gets you hit in the face in front of the whole year.",
              fx: {health:-5,wound:"broken_nose",wil:.8,cause:"a training bout"},
            },
          },
        ],
      },
      {
        id: "sc_ss_throw",
        cond: (p,C)=>fightSch(p,C)&&C.adult(p),
        w: 1,
        cool: 8,
        setup: (p,ctx)=>{scx(p,ctx);const q=classmate(p,ctx,"acquaint",!0);ctx.go=q.house&&A.house(q.house)?A.house(q.house).name:"a rich family",ctx.purse=A.ri(25,60)},
        title: "Lose the bout",
        text: `On the school's feast day you are drawn against {themFull} in the public bouts. A steward of {go} finds you afterwards. "{them}'s father is in the stand. {purse} suns if {them} wins. {They} need never know."`,
        choices: [
          {
            t: "Take the purse and lose well",
            check: {s:"deception",s2:"melee",d:44,bonus:p=>SB(p,.4)},
            win: {
              r: "A slip, a late guard, a touch to the ribs. The father beams. The master does not, quite.",
              fx: (p,ctx)=>F(p,ctx,{coin:ctx.purse,honor:-4,them:{type:"friend",op:10}}),
            },
            lose: {
              r: "You lose so obviously that the master stops the bout. The purse is paid; your name at the school is not.",
              fx: (p,ctx)=>F(p,ctx,{coin:ctx.purse,honor:-5,styleXp:-5,happy:-4}),
            },
          },
          {
            t: "Refuse, and fight to win",
            r: "You send the steward away and fight {them} as you would anyone.",
            fx: (p,ctx)=>(A.applyFx(p,{honor:3,styleXp:6},ctx),bout(p,ctx,{them:!0,k:"spar",place:"the feast-day bouts at "+ctx.school,title:"Feast-day bouts"})),
          },
          {
            t: "Tell the master",
            r: "The master hears you out, says nothing, and pairs {them} with the best student in the school next morning. Justice, of a kind.",
            fx: {honor:2,styleXp:4,them:{type:"enemy",op:-25}},
          },
        ],
      },
      {
        id: "sc_ss_heir",
        cond: (p,C)=>fightSch(p,C)&&C.adult(p),
        w: .7,
        cool: 12,
        setup: (p,ctx)=>{scx(p,ctx),heirOf(p,ctx)},
        title: "Sparring royal blood",
        text: '{themFull}, {royal}, comes to {school} for a season, and the master chooses you as {their} sparring partner. Everybody has advice. Half of it is "let {themHim} win". The other half is "never let {themHim} win".',
        choices: [
          {
            t: "Fight {themHim} honestly",
            r: "You fight {themHim} as you would anyone. The courtiers along the rail stop breathing.",
            fx: (p,ctx)=>(A.applyFx(p,{styleXp:8,them:{type:"acquaint",op:5}},ctx),bout(p,ctx,{them:!0,k:"spar",place:"the yard of "+ctx.school,title:"Sparring royal blood"})),
          },
          {
            t: "Let {themHim} win, cleverly",
            check: {s:"deception",s2:"etiquette",d:50},
            win: {
              r: "{They} wins three bouts in four and believes every one. You will have a friend at court for life.",
              fx: {favor:6,them:{type:"friend",op:30},styleXp:3},
            },
            lose: {
              r: '{They} knows. "Fight me properly or not at all." It is the first true thing anyone royal has said to you.',
              fx: {them:{type:"acquaint",op:-10},favor:-3},
            },
          },
          {
            t: "Teach {themHim} instead of beating {themHim}",
            check: {s:"melee",s2:"persuasion",d:52,bonus:p=>SB(p,.6)},
            win: {
              r: "You show {themHim} what {they} does wrong, kindly, every day. By the end of the season {they} asks for you by name.",
              fx: {favor:8,them:{type:"friend",op:35},styleXp:6,skill:{command:1}},
            },
            lose: {
              r: "{They} does not like being taught by a commoner. The season ends coldly.",
              fx: {them:{type:"acquaint",op:-10}},
            },
          },
        ],
      },
      {
        id: "sc_ss_night",
        cond: (p,C)=>fightSch(p,C)&&C.adult(p)&&!C.flag(p,"sc_night"),
        w: .8,
        once: !0,
        setup: (p,ctx)=>{scx(p,ctx);const q=who(p,ctx,"mentor","a master turned out of "+ctx.school);q.born=A.S.year-A.ri(GD.RACES[q.race].old-8,GD.RACES[q.race].old+4),ctx.sin=A.pick(["for killing a student in a bout","for teaching the moves the school keeps secret","for drinking","for losing to a foreigner in public","for saying the founder was a liar"])},
        title: "Lessons after dark",
        text: '{themFull} was a master at {school} until {they} was turned out {sin}. Now {they} lives in a room over a stable, and one night {they} stops you in the street. "They teach you the half that is safe. Come at midnight and I will teach you the rest." If the school finds out, you are finished there.',
        choices: [
          {
            t: "Go at midnight",
            check: {s:"stealth",s2:"wil",d:45},
            win: {
              r: "Winter nights over a stable, with a lantern and an old master who swears a great deal. You learn things nobody in the yard knows.",
              fx: (p,ctx)=>{const a=learnOther(p,""),t=teachTech(p,"");return A.applyFx(p,{styleXp:18,ins:.8,flag:"sc_night",them:{type:"mentor",op:40,back:"student"}},ctx),[a,t].filter(Boolean).join(" ")},
            },
            lose: {
              r: "A senior student follows you one night. By morning the whole school knows.",
              fx: (p,ctx)=>{if(A.applyFx(p,{flag:"sc_night",them:{type:"mentor",op:30,back:"student"},skill:{[sk(p)]:3}},ctx),A.chance(.5)){const n=leaveSchool(p);return p.flags.sc_expelled=A.S.year,`You are expelled from ${n}.`}return A.willGrow(p,1),"The master lets you stay, but you scrub the yard for a season and are watched every night."},
            },
          },
          {
            t: "Tell {themHim} you will not go behind the master's back",
            r: '{They} shrugs. "Loyalty. They teach that well, at least."',
            fx: {honor:2,flag:"sc_night"},
          },
          {
            t: "Report {themHim} to the school",
            r: "The school has {themHim} run out of town. The master thanks you. You are not sure you did right.",
            fx: {honor:-2,styleXp:5,flag:"sc_night",them:{type:"enemy",op:-40}},
          },
        ],
      },
      {
        id: "sc_ss_schools",
        cond: (p,C)=>fightSch(p,C)&&C.adult(p),
        w: 1,
        cool: 6,
        setup: (p,ctx)=>{scx(p,ctx);let other=null;try{const xs=(LORE.schools||[]).filter(s=>s.realm===p.realm&&s.name!==(p.school&&p.school.name));other=xs.length?A.pick(xs):null}catch{other=null}ctx.other=other?theName(other.name):A.pick(["the river-yard across town","the old school by the cattle market","the free yard of the guilds"]),ctx.where=R(p,"POL-03")?"outside the gates, since Varenna bans duels inside its walls":"in the square",who(p,ctx,"rival","a student of "+ctx.other)},
        title: "A quarrel between schools",
        text: 'Students of {other} have been calling {school} a dancing school. Tonight one of them, {themFull}, waits {where} with friends and a blade. "Show us what your master teaches."',
        choices: [
          {
            t: "Show {themHim}",
            r: "Your friends make a ring. The quarrel of two schools comes down to two pairs of hands.",
            fx: (p,ctx)=>(A.applyFx(p,{styleXp:10,them:{type:"rival",op:-15}},ctx),bout(p,ctx,{them:!0,k:"duel",lethal:!1,place:"the square",title:"A quarrel between schools"})),
          },
          {
            t: "Propose a proper bout before both masters",
            check: {s:"etiquette",s2:"diplomacy",d:48},
            win: {
              r: "Both masters agree, and the bout is fought on a feast day before half the town. Win or lose, you made it honorable.",
              fx: {honor:3,fame:1,styleXp:8,them:{type:"rival",op:10}},
            },
            lose: {
              r: '"Hiding behind your master." They laugh at you all the way down the street.',
              fx: {happy:-3,wil:.5},
            },
          },
          {
            t: "Walk away",
            r: "The master hears of it and says you did right. Your classmates do not.",
            fx: {wil:.5,happy:-2},
          },
        ],
      },
      {
        id: "sc_ss_expel",
        cond: (p,C)=>fightSch(p,C)&&C.adult(p),
        w: .6,
        cool: 15,
        setup: (p,ctx)=>{scx(p,ctx),ctx.crime=A.pick(["brawling in a tavern with your school's colours on","drawing steel on a townsman","coming back drunk after the gate was shut","losing the school's practice swords at dice"])},
        title: "Before the masters",
        text: "You are called before the masters of {school} for {crime}. The rule is old and short: such students are sent away.",
        choices: [
          {
            t: "Plead your case",
            check: {s:"persuasion",s2:"etiquette",d:50},
            win: {
              r: "You speak plainly and do not grovel. The masters confer, and you stay, on the last of your chances.",
              fx: {wil:.5,skill:{persuasion:1}},
            },
            lose: {
              r: "They hear you out and send you away anyway.",
              fx: (p,ctx)=>{const n=leaveSchool(p);return p.flags.sc_expelled=A.S.year,A.willGrow(p,1.5),p.happy=Math.max(0,p.happy-8),`You are expelled from ${n}. You carry your things out through a yard full of silent faces.`},
            },
          },
          {
            t: "Ask for punishment instead of expulsion",
            r: "A season of scrubbing the yard and guarding the gate at night. You are tired, ashamed and still a student.",
            fx: {wil:1.5,sta:.6,happy:-4},
          },
          {
            t: "Leave before they can throw you out",
            r: "You bow to the masters and walk out.",
            fx: (p,ctx)=>{const n=leaveSchool(p);return p.flags.sc_expelled=A.S.year,`You leave ${n} with your head up. It is cold comfort.`},
          },
        ],
      },
      {
        id: "sc_ss_patron",
        cond: (p,C)=>fightSch(p,C)&&!C.flag(p,"sc_patron_fees")&&!["noble","royal"].includes(p.status),
        w: .7,
        cool: 10,
        setup: (p,ctx)=>{scx(p,ctx);const q=who(p,ctx,"acquaint","a patron");greatHouse(p,q,ctx)},
        title: "A patron in the stand",
        text: `{themFull}{hof} watched you fight on the school's feast day. A letter arrives: {they} will pay your fees until you finish, "in return for a service, later, when I ask." Nothing more is written.`,
        choices: [
          {
            t: "Accept",
            r: "Your fees are paid. Somewhere in a great house, a name is written in a ledger next to yours.",
            fx: (p,ctx)=>(halveFee(p),halveFee(p),A.applyFx(p,{flag:"sc_patron_fees",them:{type:"lord",op:25,back:"acquaint"},happy:3},ctx),""),
          },
          {
            t: "Ask what the service is",
            check: {s:"persuasion",s2:"etiquette",d:46},
            win: {
              r: '"To ride with my son when he goes to war." An honest answer. You accept, and half your fees are paid.',
              fx: (p,ctx)=>(halveFee(p),A.applyFx(p,{flag:"sc_patron_fees",them:{type:"friend",op:25}},ctx),""),
            },
            lose: {r:"The question offends. The offer is withdrawn.",fx:{happy:-2}},
          },
          {
            t: "Refuse. You will owe nobody",
            r: "You pay your own way, and sleep in the stable loft to do it.",
            fx: {honor:2,wil:.5},
          },
        ],
      },
      {
        id: "sc_ss_graduate",
        cond: (p,C)=>fightSch(p,C)&&((p.school.years||0)>=3||myRank(p)>=3)&&!C.flag(p,"sc_graduated"),
        w: 1.4,
        once: !0,
        setup: (p,ctx)=>{scx(p,ctx);const st0=stOf(p);ctx.named=st0&&myRank(p)>=3?A.styleRankName(st0,myRank(p)):"a graduate of the school",ctx.mark=R(p,...ELF)?"a leaf cut into the hilt of your blade":R(p,...DWARF)?"your name carved in runes on the roll of the hall":R(p,...ORC)?"the school's drum-beat added to your name":R(p,...STEPPE)?"a red tassel for your bow":A.pick(["a silver ring with the school's sign","the school's badge on your coat","a line of your own in the school's roll"])},
        title: "The school names you",
        text: "{Master} calls you out in front of the whole of {school}. After {yrs} you are named {named}, and the school's mark is yours: {mark}. Those who know the school will see it in your first move for the rest of your life.",
        choices: [
          {
            t: "Stay on as a junior teacher",
            r: "You teach the beginners and keep learning from the master. Slower pay, deeper roots.",
            fx: (p,ctx)=>{const st=stOf(p);return st&&(p.flags["grad_"+st.id]=p.flags["grad_"+st.id]||A.S.year),A.applyFx(p,{flag:"sc_graduated",styleXp:20,skill:{command:2},fame:2,deed:"Graduated from "+ctx.school},ctx),""},
          },
          {
            t: "Go out into the world",
            r: "You pack your gear and walk out of the gate as a graduate.",
            fx: (p,ctx)=>{const st=stOf(p);return st&&(p.flags["grad_"+st.id]=p.flags["grad_"+st.id]||A.S.year),A.applyFx(p,{flag:"sc_graduated",styleXp:15,fame:2,deed:"Graduated from "+ctx.school},ctx),`You leave ${leaveSchool(p)}. The world will test what the yard taught.`},
          },
          {
            t: "Ask to fight the master, as the old custom allows",
            r: "The yard goes silent. The master smiles, takes up a blunt blade, and steps in.",
            fx: (p,ctx)=>{const st=stOf(p);return st&&(p.flags["grad_"+st.id]=p.flags["grad_"+st.id]||A.S.year),A.applyFx(p,{flag:"sc_graduated",styleXp:15,fame:3,deed:"Graduated from "+ctx.school},ctx),bout(p,ctx,{k:"spar",champ:!0,place:"the yard of "+ctx.school,title:"The graduation bout",occ:"the master of the school"})},
          },
        ],
      },
      {
        id: "sc_ss_feast",
        cond: (p,C)=>fightSch(p,C)&&C.adult(p),
        w: 1.1,
        cool: 4,
        setup: (p,ctx)=>{scx(p,ctx),ctx.fest=A.pick(GD.FESTIVALS)[0]},
        title: "The feast-day bouts",
        text: "On {fest} {school} holds its public bouts: blunted blades, a judge with a staff, a stop at first blood. Townsfolk stand three deep to watch and bet. Your name is on the board.",
        choices: [
          {
            t: "Fight to win",
            r: "The judge lifts his staff. The crowd roars.",
            fx: (p,ctx)=>(A.applyFx(p,{styleXp:8},ctx),bout(p,ctx,{k:"spar",tier:2,place:"the feast-day bouts at "+ctx.school,title:"Feast-day bouts",occ:"a student of the school"})),
          },
          {
            t: "Fight to show the style, clean and correct",
            check: {s:"melee",s2:"ins",d:48,bonus:p=>SB(p,.6)},
            win: {
              r: "Every move from the book, every one clean. The master nods. The old men along the rail say it is like watching the founder.",
              fx: {styleXp:14,fame:1},
            },
            lose: {
              r: "Correct, and slow. A farm boy from the next school hits you while you are being correct.",
              fx: {styleXp:6,wil:.5,happy:-2},
            },
          },
          {
            t: "Bet on yourself (10 suns)",
            req: p=>p.coin>=10,
            check: {s:"melee",s2:"wil",d:46,bonus:p=>SB(p,.6)},
            win: {
              r: "You win, and the purse doubles. Nothing tastes like money won on your own hands.",
              fx: {coin:12,styleXp:6,fame:1},
            },
            lose: {r:"You lose the bout and the bet. The bookmaker thanks you warmly.",fx:{coin:-10,wil:.5}},
          },
        ],
      },
      {
        id: "sc_ss_torch",
        cond: (p,C)=>fightSch(p,C)&&C.adult(p),
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{scx(p,ctx),ctx.why=R(p,"POL-06")?"In Sylvaran the schools forbid bouts by torchlight, and nobody will say why.":"The old rule of the yard is that bouts stop at dusk. The young students think it is superstition.",ctx.lord="Lord "+nm(p,"M")},
        title: "One more bout, by torchlight",
        text: "The feast-day bouts run late. {lord} wants one more, by torchlight, so his guests can see. {why} The master has gone home.",
        choices: [
          {
            t: "Fight by torchlight",
            check: {s:"ins",s2:"melee",d:50,bonus:p=>SB(p,.4)},
            win: {
              r: "Shadows jump and the blade comes out of nowhere, but you are faster than the shadows. {lord} sends you a purse.",
              fx: {coin:20,fame:1,styleXp:6},
            },
            lose: {
              r: "A torch gutters at the wrong moment and you take a blade in the face. The master is waiting when you come back.",
              fx: {health:-10,wound:"scar_face",wil:1,cause:"a bout by torchlight"},
            },
          },
          {
            t: "Refuse: the rule is the rule",
            r: "The guests boo. In the morning the master tells you why: a great master once died in a fit after a bout was moved into torchlight so more people could watch, and pride kills more swordsmen than steel.",
            fx: {honor:2,wil:1,int:.3,styleXp:6},
          },
          {
            t: "Offer to fight at dawn instead",
            check: {s:"etiquette",s2:"persuasion",d:44},
            win: {
              r: "{lord} laughs and agrees, and comes back at dawn with his guests in their cloaks. Everyone remembers the dawn bout.",
              fx: {fame:2,styleXp:8,honor:1},
            },
            lose: {r:"{lord} finds someone else to fight by torchlight. That one is carried home.",fx:{wil:.5}},
          },
        ],
      },
      {
        id: "sc_ss_hurt",
        cond: (p,C)=>fightSch(p,C),
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{scx(p,ctx),ctx.part=A.pick(["your knee","your wrist","your shoulder","two ribs"])},
        title: "Hurt in the yard",
        text: "A drill goes wrong, and {part} goes with it. The school's bonesetter says rest for a season. The trials are in a month.",
        choices: [
          {
            t: "Rest it properly",
            r: "A season of watching from the bench. You learn more by watching than you expected.",
            fx: {health:5,ins:.8,int:.3,styleXp:4,happy:-2},
          },
          {
            t: "Train through it",
            check: {s:"wil",s2:"sta",d:50},
            win: {
              r: "It hurts every day, then less, then not at all. You pass the trials with it strapped tight.",
              fx: {wil:1.5,styleXp:12},
            },
            lose: {
              r: "It never heals properly. You will fight around it for the rest of your life.",
              fx: {wound:"bad_knee",wil:1,health:-8,styleXp:4,cause:"a training injury"},
            },
          },
          {
            t: "Train the other side while it heals",
            check: {s:"int",s2:"ins",d:44},
            win: {
              r: "A season of off-hand drills. When you come back, you are the only one in your year who fights well from both sides.",
              fx: {skill:{dualwield:3},styleXp:8,ins:.4},
            },
            lose: {r:"Your off hand is clumsy and stays clumsy. At least you kept moving.",fx:{sta:.3,styleXp:3}},
          },
        ],
      },
      {
        id: "sc_ss_succession",
        cond: (p,C)=>fightSch(p,C)&&C.adult(p)&&(p.school.years||0)>=1,
        w: .6,
        cool: 15,
        setup: (p,ctx)=>{scx(p,ctx),ctx.a=nm(p),ctx.b=nm(p)},
        title: "Who comes after",
        text: "{Master} is old now, and slower every season. The senior students are dividing in two: those for {a}, the best blade in the school, and those for {b}, the best teacher. Both have asked for you.",
        choices: [
          {
            t: "Stand with {a}, the blade",
            r: "You stand with the blade. The school is a fighting school, after all.",
            fx: {styleXp:8,skill:{melee:1},newRel:{type:"friend",op:25}},
          },
          {
            t: "Stand with {b}, the teacher",
            r: "You stand with the teacher. A school is a chain, and a chain is made by teaching.",
            fx: {styleXp:8,skill:{command:1},newRel:{type:"friend",op:25}},
          },
          {
            t: "Bring them together before it splits the school",
            check: {s:"diplomacy",s2:"persuasion",d:55},
            win: {
              r: "One will lead the yard, the other the teaching. The old master hears of it and asks to see you.",
              fx: {styleXp:14,honor:3,skill:{diplomacy:2},fame:1},
            },
            lose: {r:"Both sides decide you are a fool, and the school splits anyway.",fx:{happy:-3,wil:.5}},
          },
        ],
      },
      {
        id: "sc_ss_steel",
        cond: (p,C)=>fightSch(p,C)&&C.adult(p)&&p.coin>=60,
        w: .6,
        cool: 12,
        setup: (p,ctx)=>{scx(p,ctx);const d={"POL-30":["a Chanari blade from the Blade Hall",400,"chanari"],"POL-29":["a dwarf-forged blade, sold once in a lifetime to an outsider",350,"dwarfblade"],"POL-06":["an elven blade ground thin as a leaf",300,"elfblade"],"POL-07":["an elven blade ground thin as a leaf",300,"elfblade"]}[p.realm]||["a good sword of crucible steel, come from Ranpur by three hands",250,"goodsword"];ctx.blade=d[0],ctx.price=d[1],ctx.g=d[2]},
        title: "Good steel",
        text: "The difference between a village blade and good steel is often the fight. A dealer who sells to {school} has {blade}. {price} suns. Your old blade cost ten.",
        choices: [
          {
            t: "Buy it",
            req: (p,C,ctx)=>p.coin>=(ctx.price||9999),
            r: "It sits in your hand like it was made for it. Perhaps it was.",
            fx: (p,ctx)=>(p.coin-=ctx.price,p.gear.weapon=GD.GEAR[ctx.g]?ctx.g:"goodsword",A.applyFx(p,{happy:5,styleXp:4},ctx),""),
          },
          {
            t: "Haggle",
            check: {s:"trade",s2:"persuasion",d:55},
            win: {
              r: "He comes down a third, cursing your family. You buy it.",
              fx: (p,ctx)=>{const c=Math.round(ctx.price*.67);return p.coin<c?"Even at a third off, it is more than you have. You walk away with the price in your head.":(p.coin-=c,p.gear.weapon=GD.GEAR[ctx.g]?ctx.g:"goodsword","")},
            },
            lose: {r:"He will not move a sun. You walk away and dream about it.",fx:{happy:-2}},
          },
          {
            t: "A blade is only a blade",
            r: '"The hand, not the steel," your master says. You keep your old blade and practise harder.',
            fx: {styleXp:4,wil:.3},
          },
        ],
      },
      {
        id: "sc_ss_winter",
        cond: (p,C)=>fightSch(p,C)&&!C.terr(p,"desert"),
        w: 1,
        cool: 6,
        setup: (p,ctx)=>{scx(p,ctx),ctx.cold=R(p,"POL-08","POL-09","POL-23")?"on the ice, in shirts":R(p,...DWARF)?"in the cold upper gallery where the wind comes through the shafts":"in the frozen yard before dawn, barefoot"},
        title: "Winter drill",
        text: "All through the dark weeks, {master} drills you {cold}. Students fall out every week. The ones who stay are the ones the school will remember.",
        choices: [
          {
            t: "Stay to the last day",
            check: {s:"sta",s2:"wil",d:46},
            win: {
              r: "You are one of six who finish. You never feel cold the same way again.",
              fx: {sta:1,wil:1.5,styleXp:10},
            },
            lose: {
              r: "A fever takes you in the last week. You finish in bed, which does not count.",
              fx: {health:-10,wil:1,cause:"a winter fever"},
            },
          },
          {
            t: "Do what is asked, no more",
            r: "You keep up, and keep your toes. Good enough.",
            fx: {sta:.5,styleXp:5},
          },
        ],
      },
      {
        id: "sc_ss_bully",
        cond: (p,C)=>fightSch(p,C)&&C.adult(p)&&(p.school.years||0)>=1,
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{scx(p,ctx),classmate(p,ctx,"acquaint",!0),ctx.kid=nm(p)},
        title: "The youngest",
        text: '{themFull}, a senior, has picked the youngest student, {kid}, to torment: sand in the porridge, a blade "accidentally" across the knuckles. The others look away. {kid} has started crying at night.',
        choices: [
          {
            t: "Stop it, in front of everyone",
            r: "You step between them in the yard. {They} smiles and reaches for a practice blade.",
            fx: (p,ctx)=>(A.applyFx(p,{honor:4,them:{type:"enemy",op:-30},newRel:{type:"friend",op:40}},ctx),bout(p,ctx,{them:!0,k:"spar",place:"the yard",title:"For the youngest"})),
          },
          {
            t: "Tell the master",
            r: "The master puts {them} on gate duty for a month. {They} knows who talked.",
            fx: {honor:2,them:{type:"enemy",op:-20},newRel:{type:"friend",op:25}},
          },
          {
            t: "Teach {kid} to fight back",
            check: {s:"melee",s2:"command",d:46,bonus:p=>SB(p,.6)},
            win: {
              r: "A month of nights. The next time, {kid} puts {them} on the ground, and the whole yard sees it.",
              fx: {honor:3,skill:{command:2},styleXp:6,newRel:{type:"bestfriend",op:50}},
            },
            lose: {
              r: "{kid} fights back, and gets worse for it. You were not a good enough teacher yet.",
              fx: {wil:.8,happy:-3},
            },
          },
          {
            t: "Look away like everyone else",
            r: "It is not your business. You tell yourself that for years.",
            fx: {honor:-3,happy:-2},
          },
        ],
      },
      {
        id: "sc_ss_foreigner",
        cond: (p,C)=>fightSch(p,C)&&C.adult(p),
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{scx(p,ctx);const F2=[["an elf from the Sylvaran groves","Sylvari","the parry and the answer in one movement","POL-06","elf"],["a rider of the Nine Winds","Wind Rider","the backward shot from the saddle","POL-12","human"],["a Zanari runner","Zanari","how to run a horseman down over a day of heat","POL-20","human"],["a Keshi climber from the Rope Hall","Keshi","how to fall without breaking","POL-21","human"],["a half-orc from the Tusk Clans","Orcish","the rhino spear","POL-34","halforc"],["a pike-fighter from the Highland League","Northfolk","how to stand in a pike block","POL-13","human"],["a Ranpuri from Chanari","Ranpuri","the draw and the first cut","POL-30","human"],["a Sabran from the camel school","Sabran","the lance from a camel in the heat","POL-24","human"]].filter(x=>x[3]!==p.realm),f=A.pick(F2);ctx.from=f[0],ctx.lng=f[1],ctx.knows=f[2];const q=who(p,ctx,"acquaint","a foreign student at "+ctx.school);try{const r2=A.realm(f[3]);if(r2&&r2.cult){q.realm=f[3],q.race=f[4],q.cult=r2.cult,q.born=A.S.year-(GD.RACES[f[4]].adult+A.ri(1,4)),q.given=A.givenName(q.cult,q.sex)||q.given;const fn=A.familyName({cult:q.cult,realm:f[3],status:q.status,sex:q.sex});q.sur=fn.sur,q.surMode=fn.mode}}catch{}ctx.They=A.cap(A.he(q)),ctx.they=A.he(q)},
        title: "A stranger in the yard",
        text: "A new student has come from very far: {themFull}, {from}. {They} fights like nobody you have seen, and speaks your language badly. In the yard the others call {themHim} names behind {their} back. {They} knows {knows}.",
        choices: [
          {
            t: "Trade: your art for {theirHis}",
            r: "Evenings behind the stables, two strangers teaching each other. You learn something your own school does not know exists.",
            fx: (p,ctx)=>(A.applyFx(p,{ins:1,them:{type:"friend",op:35},styleXp:6},ctx),A.trainSkill(p,A.pick(["bow","athletics","spear","riding","sword","lance"]),3),""),
          },
          {
            t: "Teach {themHim} your language",
            r: "Words for food, then for weapons, then for home. By spring you are friends, and you know some of {their} words too.",
            fx: (p,ctx)=>(A.applyFx(p,{them:{type:"friend",op:40},int:.4},ctx),GD.LANG_LIST.includes(ctx.lng)&&A.chance(.6)?F(p,ctx,{lang:ctx.lng}):""),
          },
          {
            t: "Test {themHim} in a bout",
            r: "Two chains that have never met. The first exchange is a coin.",
            fx: (p,ctx)=>(A.applyFx(p,{styleXp:8},ctx),bout(p,ctx,{them:!0,k:"spar",place:"the yard",title:"Two chains that never met"})),
          },
        ],
      },
      {
        id: "sc_ss_roll",
        cond: (p,C)=>fightSch(p,C)&&(p.school.years||0)>=1&&C.literate(p),
        w: .7,
        once: !0,
        setup: (p,ctx)=>{scx(p,ctx)},
        title: "The roll of masters",
        text: "In a chest in the master's room is the roll of {school}: every master, in order, back to the founder, and beside each name what they added and how they died. Most chains on Ardan are two or three centuries of hands. The master leaves the chest unlocked, perhaps on purpose.",
        choices: [
          {
            t: "Read it, every name",
            r: "Night after night by a stub of candle. You learn why each move is the way it is, and which master paid for it in blood.",
            fx: {int:.8,styleXp:14,skill:{learning:2}},
          },
          {
            t: "Look for how the masters died",
            r: "Most of them died of the thing they were best at. You think about that for a long time.",
            fx: {wil:1,ins:.5,styleXp:8},
          },
          {
            t: "Leave it shut. It is not yours yet",
            r: "The master notices the chest was not opened, and the next week shows you one page of it, personally.",
            fx: {honor:2,styleXp:10},
          },
        ],
      },
      {
        id: "sc_ss_love",
        cond: (p,C)=>fightSch(p,C)&&C.adult(p)&&!C.married(p),
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{scx(p,ctx),classmate(p,ctx,"friend",!1)},
        title: "Bruises and something else",
        text: "You and {themFull} have been paired in drill all year. Lately neither of you asks for another partner, and lately the bruises do not seem to matter.",
        choices: [
          {
            t: "Say something",
            check: {s:"persuasion",s2:"wil",d:40},
            win: {
              r: "You say it badly, in the armory, with a practice blade in your hand. {They} laughs, and kisses you. The rest is nobody's business.",
              fx: {them:{type:"lover",op:50},happy:8},
            },
            lose: {
              r: "{They} goes red and says {they} thinks of you as a sister in arms. You both pretend it never happened.",
              fx: {happy:-4,them:{type:"friend",op:5}},
            },
          },
          {
            t: "Keep it in the yard",
            r: "Nothing is said. Years later you will both remember that year.",
            fx: {them:{type:"friend",op:20},styleXp:5},
          },
        ],
      },
      {
        id: "sc_ss_war",
        cond: (p,C)=>fightSch(p,C)&&C.adult(p)&&C.atWar(p),
        w: 1.2,
        cool: 6,
        setup: (p,ctx)=>{scx(p,ctx),ctx.foe=enemyOf(p)},
        title: "The school goes to war",
        text: "War with {foe}. A captain comes to {school} with a writ: the senior students may march with the army as a company of their own. {Master} says each must choose.",
        choices: [
          {
            t: "March with the school's company",
            r: "You march out behind the school's banner. In the first skirmish, a {foe} soldier comes straight at you.",
            fx: (p,ctx)=>(A.applyFx(p,{honor:3,styleXp:10,favor:3,deed:"Marched to war with the company of "+ctx.school},ctx),bout(p,ctx,{k:"duel",tier:3,lethal:!0,place:"a skirmish on the border",title:"The school goes to war",occ:"a soldier of "+ctx.foe})),
          },
          {
            t: "Stay and finish your training",
            r: "Half the seniors march. The yard is very quiet. Not all of them come back.",
            fx: {styleXp:10,happy:-3,wil:.5},
          },
          {
            t: "Help the master train the levies instead",
            check: {s:"command",s2:"melee",d:48,bonus:p=>SB(p,.4)},
            win: {
              r: "A month of turning farm boys into something like soldiers. Some of them live because of you.",
              fx: {skill:{command:3},favor:4,styleXp:6},
            },
            lose: {r:"The farm boys do not listen to a student. The sergeant takes over.",fx:{skill:{command:1}}},
          },
        ],
      },
      {
        id: "sc_ss_fees",
        cond: (p,C)=>fightSch(p,C)&&p.coin<(p.school.fee||20)+10&&!C.flag(p,"sc_patron_fees"),
        w: 1,
        cool: 8,
        setup: (p,ctx)=>{scx(p,ctx)},
        title: "The fees fall due",
        text: "The steward of {school} reminds you, politely, that next year's fees fall due at {festival}. You do not have them, and your purse says you will not.",
        choices: [
          {
            t: "Work as the school's yard-servant for your keep",
            r: "You sweep the yard, haul water and mend the practice dummies. Your fees are halved, and you see every lesson from the edge.",
            fx: (p,ctx)=>(halveFee(p),A.applyFx(p,{sta:.6,styleXp:6,wil:.5,happy:-2},ctx),""),
          },
          {
            t: "Win the money in town bouts",
            check: {s:"melee",s2:"wil",d:50,bonus:p=>SB(p,.6)},
            win: {
              r: "Three bouts in the market for coins. You pay the steward on the day, with bruises.",
              fx: {coin:25,styleXp:6,fame:1},
            },
            lose: {r:"You lose two of three. The steward accepts half, this once.",fx:{coin:5,health:-6,wil:.8}},
          },
          {
            t: "Write home for money",
            req: (p,C)=>C.parentsAlive(p),
            r: "Your family sells a cow to pay. Their letter does not mention the cow. Your cousin's letter does.",
            fx: {family:-20,coin:20,happy:-2},
          },
        ],
      },
      {
        id: "sc_ss_pet",
        cond: (p,C)=>fightSch(p,C),
        w: .8,
        cool: 8,
        setup: (p,ctx)=>{scx(p,ctx),classmate(p,ctx,"rival",!0)},
        title: "The master's favorite",
        text: "{themFull}{hof} is the master's favorite: the best partners, the private lessons, the front of every line. {They} is good, but not that good, and everyone knows {their} family paid for the new roof.",
        choices: [
          {
            t: "Outwork {themHim} until the master has to see it",
            check: {s:"wil",s2:"melee",d:52,bonus:p=>SB(p,.4)},
            win: {
              r: "A year of first in, last out. One morning the master puts you at the front of the line and {them} behind you.",
              fx: {styleXp:16,wil:1,them:{type:"rival",op:-10}},
            },
            lose: {
              r: "A year of first in, last out, and the master still sees only {them}. You are stronger for it, and bitter.",
              fx: {styleXp:8,wil:1.5,happy:-3},
            },
          },
          {
            t: "Make {themHim} an ally",
            check: {s:"diplomacy",s2:"etiquette",d:48},
            win: {
              r: "Favorites are lonely. {They} is glad of a friend, and the private lessons start to include you.",
              fx: {styleXp:12,them:{type:"friend",op:30}},
            },
            lose: {r:"{They} thinks you want something. {They} is right.",fx:{them:{type:"rival",op:-10}}},
          },
          {
            t: "Let it go. Your fight is with yourself",
            r: "You stop watching {themHim} and start watching your own feet. It helps.",
            fx: {styleXp:6,wil:.5},
          },
        ],
      },
      {
        id: "sc_ss_stranger",
        cond: (p,C)=>fightSch(p,C)&&C.adult(p)&&myRank(p)>=2,
        w: .8,
        cool: 8,
        setup: (p,ctx)=>{scx(p,ctx);let s=null;try{const xs=(LORE.schools||[]).filter(x=>x.realm!==p.realm);s=xs.length?A.pick(xs):null}catch{s=null}ctx.chain=s?theName(s.name):"a school beyond the mountains",ctx.from=s?s.realmName:"lands beyond the mountains"},
        title: "A blade from another chain",
        text: "A travelling fighter from {chain}, in the {from}, asks to cross blades with the best student at {school}, and {master} points at you. Nobody here has ever seen that chain fight. Nobody there has seen yours.",
        choices: [
          {
            t: "Fight carefully: let the first exchange teach you",
            check: {s:"ins",s2:"int",d:52},
            win: {
              r: "You give ground for a minute and watch. Then you see it: the shoulder moves before the blade. You win the second exchange and every one after.",
              fx: (p,ctx)=>(A.applyFx(p,{ins:1,styleXp:15,fame:1},ctx),bout(p,ctx,{k:"spar",tier:3,place:"the yard of "+ctx.school,title:"A blade from another chain",occ:"a fighter of "+ctx.chain,foeMods:{fat:20}})),
            },
            lose: {
              r: "The first exchange teaches you that you know nothing.",
              fx: (p,ctx)=>bout(p,ctx,{k:"spar",tier:3,place:"the yard of "+ctx.school,title:"A blade from another chain",occ:"a fighter of "+ctx.chain}),
            },
          },
          {
            t: "Attack at once: strangers guess too",
            r: "You go in on the first breath. Strangers guess too.",
            fx: (p,ctx)=>(A.applyFx(p,{styleXp:10},ctx),bout(p,ctx,{k:"spar",tier:3,place:"the yard of "+ctx.school,title:"A blade from another chain",occ:"a fighter of "+ctx.chain})),
          },
          {
            t: "Ask to train with the stranger instead",
            r: "A week of drills with a man from the other side of the world. You learn a little of the other chain's answers.",
            fx: (p,ctx)=>{const a=learnOther(p,"");return A.applyFx(p,{ins:.6,styleXp:6},ctx),a},
          },
        ],
      },
      {
        id: "sc_ss_blind",
        cond: (p,C)=>fightSch(p,C),
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{scx(p,ctx),ctx.drill=R(p,...ELF)?"by starlight under the trees, with no lamp at all":A.pick(["blindfolded, against a partner who wears a bell","in the dark of the cellar, by sound alone","with your eyes shut, while the master throws pebbles"])},
        title: "Fighting without eyes",
        text: 'This month {master} drills you {drill}. "The unseen kills the best," says the master. "So learn to fight what you cannot see."',
        choices: [
          {
            t: "Trust your ears and your skin",
            check: {s:"ins",s2:"wil",d:50,bonus:p=>A.hasBlood(p,"listener")?20:0},
            win: {
              r: "By the last week you hear the breath before the cut. Your instincts are sharper than they have ever been.",
              fx: {ins:1.5,styleXp:12},
            },
            lose: {
              r: "You spend a month being hit by things you never heard coming. You learn humility, if nothing else.",
              fx: {wil:1,health:-4,styleXp:4},
            },
          },
          {
            t: "Peek",
            r: "You peek under the blindfold and win every bout. The master knows, and makes you do it for two months.",
            fx: {honor:-1,styleXp:3,sta:.4},
          },
        ],
      },
      {
        id: "sc_ss_teach",
        cond: (p,C)=>fightSch(p,C)&&(p.school.years||0)>=2,
        w: .9,
        cool: 6,
        setup: (p,ctx)=>{scx(p,ctx)},
        title: "Teaching the beginners",
        text: `{Master} gives you the beginners for a season: twelve farm boys and two clerks' daughters who cannot hold a {wpn}. "If you cannot teach it, you do not know it."`,
        choices: [
          {
            t: "Teach them patiently",
            check: {s:"command",s2:"persuasion",d:44},
            win: {
              r: "By the end of the season they can stand, move and strike. You understand your own art for the first time.",
              fx: {skill:{command:3},styleXp:14,int:.4,newRel:{type:"student",op:30,back:"mentor"}},
            },
            lose: {
              r: "They learn little and you lose your temper often. You learn more than they do, mostly about yourself.",
              fx: {skill:{command:1},styleXp:6,wil:.5},
            },
          },
          {
            t: "Drill them hard, the way you were drilled",
            r: "Half of them quit. The other half are very good, and terrified of you.",
            fx: {skill:{command:2,intimidation:1},styleXp:10},
          },
        ],
      },
      {
        id: "sc_ss_tavern",
        cond: (p,C)=>fightSch(p,C)&&C.adult(p),
        w: 1,
        cool: 6,
        setup: (p,ctx)=>{scx(p,ctx),ctx.inn=A.pick(["the Black Dog","the Three Bells","the Ox and Plough","the Drowned Goat"])},
        title: "Never outside the yard",
        text: `In {inn}, three carters recognize the colours of {school}. "Students! Show us how they teach you to dance." One of them throws a cup. The school's oldest rule is that steel is never drawn outside the yard.`,
        choices: [
          {
            t: "Fists only, then",
            r: "You keep your blade in its sheath and your rule intact, more or less.",
            fx: (p,ctx)=>(A.applyFx(p,{wil:.3},ctx),bout(p,ctx,{k:"brawl",tier:1,place:ctx.inn,title:"Tavern brawl",occ:"a carter",weapon:"fists"})),
          },
          {
            t: "Buy them a round and laugh",
            check: {s:"persuasion",s2:"etiquette",d:40},
            win: {
              r: "By the end of the night the carters are toasting your school, and one of them is your friend.",
              fx: {coin:-2,newRel:{type:"friend",op:20},happy:2},
            },
            lose: {r:"They drink your round and throw the cups anyway.",fx:{coin:-2,health:-5}},
          },
          {
            t: "Leave",
            r: "They jeer you out of the door. The master, hearing of it, buys you a drink.",
            fx: {honor:1,styleXp:3},
          },
        ],
      },
      {
        id: "sc_ss_hunt",
        cond: (p,C)=>fightSch(p,C)&&C.adult(p)&&myRank(p)>=2,
        w: .6,
        cool: 15,
        setup: (p,ctx)=>{scx(p,ctx),beastOf(p,ctx),ctx.lore=R(p,"POL-32")?"At the Spear Yard of Aming, the wyrm hunt is how a student becomes a spear.":R(p,"POL-34")?"At the Rhino Spear Lodge, no student is named until the hunt.":"It is the school's oldest trial: a real beast, a real weapon, and nobody to help."},
        title: "The hunt",
        text: "{lore} {Master} has chosen you. The quarry: {bname}, seen near {bwhere}.",
        choices: [
          {
            t: "Go alone, as the custom says",
            r: "You go out at first light with your weapon and nothing else.",
            fx: (p,ctx)=>(A.applyFx(p,{styleXp:16,fame:2,honor:2},ctx),A.startDuelFront(p,{beastId:ctx.beast,mod:.85},{kind:"beast",place:(A.BEASTS[ctx.beast]||{}).where||"the wilds",title:"The school's hunt"}),""),
          },
          {
            t: "Track it for days and choose your ground",
            check: {s:"tracking",s2:"survival",d:52},
            win: {
              r: "You find a narrow place it must pass through, and you wait there.",
              fx: (p,ctx)=>(A.applyFx(p,{styleXp:14,skill:{tracking:2}},ctx),A.startDuelFront(p,{beastId:ctx.beast,mod:.65},{kind:"beast",place:"ground of your choosing",title:"The school's hunt"}),""),
            },
            lose: {
              r: "It finds you first.",
              fx: (p,ctx)=>(A.startDuelFront(p,{beastId:ctx.beast,mod:1},{kind:"beast",place:"a thicket",title:"The school's hunt"}),""),
            },
          },
          {
            t: "Refuse the hunt",
            r: "The master says nothing. Next year someone else is chosen, and is named before you.",
            fx: {happy:-3,wil:-.2},
          },
        ],
      },
      {
        id: "sc_ss_veteran",
        cond: (p,C)=>fightSch(p,C),
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{scx(p,ctx),who(p,ctx,"acquaint","an old soldier who trained at "+ctx.school)},
        title: "An old student comes back",
        text: '{themFull} trained at {school} forty years ago, and has fought in three wars since. {They} watches the yard with a face like a closed door, then says: "Most knights alive have fought fewer than five real fights. I have fought fifty. Shall I tell you what the yard does not teach?"',
        choices: [
          {
            t: "Listen to every word",
            r: '"The first second decides. Most men freeze. Be the one who does not." {They} talks until dark, and you remember all of it.',
            fx: {wil:1,ins:.8,styleXp:8,them:{type:"friend",op:25}},
          },
          {
            t: "Ask {themHim} to spar",
            r: "{They} is old and slow and beats you twice in a row with things that are not in any book.",
            fx: (p,ctx)=>(A.applyFx(p,{styleXp:10,ins:.6,them:{type:"friend",op:15}},ctx),bout(p,ctx,{them:!0,k:"spar",place:"the yard",title:"An old soldier"})),
          },
          {
            t: "Ask about the friends who did not come back",
            r: "{They} goes quiet, then tells you their names, one by one. You will not forget them either.",
            fx: {wil:1.5,honor:1,them:{type:"friend",op:35}},
          },
        ],
      },
      {
        id: "sc_ss_rank",
        cond: (p,C)=>fightSch(p,C)&&myRank(p)<5,
        w: 1.1,
        cool: 3,
        setup: (p,ctx)=>{scx(p,ctx)},
        title: "The rank trial",
        text: "Twice a year {school} tests its students. You are a {srank}. To be named {nrank} you must pass the trial: three bouts against those already named, and the master's questions on {art}.",
        choices: [
          {
            t: "Sit the trial",
            check: {s:"melee",s2:"ins",d:52,bonus:p=>SB(p,.6)},
            win: {
              r: "Three bouts, three touches, and the master's questions answered without a stammer. Your name goes up on the board.",
              fx: (p,ctx)=>{const st=stOf(p);let out="";if(st&&p.styles&&p.styles[st.id]){const s=p.styles[st.id],r0=s.rank;s.xp=Math.max(s.xp||0,GD.STYLE_XP[Math.min(4,s.rank)]||0),A.styleXp(p,st.id,1),s.rank===r0&&(out="But the master holds the new name back until your hands are as ready as your head.")}else A.trainSkill(p,sk(p),4),p.school&&p.school.kind&&(p.school.rank=Math.min(5,(p.school.rank||1)+1)),A.applyFx(p,{styleXp:10},ctx);return A.applyFx(p,{fame:1,wil:.5},ctx),out},
            },
            lose: {
              r: "You lose the second bout and freeze on the third question. Next time.",
              fx: {styleXp:8,wil:1,happy:-3},
            },
          },
          {
            t: "Wait until you are surer",
            r: "Another half-year of drill. You will be ready when you are ready.",
            fx: {styleXp:12},
          },
        ],
      },
      {
        id: "sc_ss_household",
        cond: (p,C)=>fightSch(p,C)&&!!houseStyleOf(p),
        w: .9,
        once: !0,
        setup: (p,ctx)=>{scx(p,ctx);const hs=houseStyleOf(p);ctx.hs=hs?String(hs.name).replace(/^The /,"the "):"your family's way"},
        title: "Two ways of fighting",
        text: 'Your family taught you {hs} before you could read. At {school} the master keeps correcting the very things your father praised. "Unlearn it," says the master. "Never forget it," says your blood.',
        choices: [
          {
            t: "Unlearn it, and learn the school's way",
            r: "It is like learning to walk again. But when you have it, you have two ways to move instead of one.",
            fx: {styleXp:16,ins:.6,happy:-2},
          },
          {
            t: "Keep your family's way and take only what fits",
            check: {s:"int",s2:"ins",d:50},
            win: {
              r: "You find where the two ways meet, and fight from there. Nobody else alive fights quite like you.",
              fx: (p,ctx)=>{const hs=houseStyleOf(p);return hs&&p.styles&&p.styles[hs.id]&&A.styleXp(p,hs.id,20),A.applyFx(p,{styleXp:8,ins:.8},ctx),""},
            },
            lose: {r:"You end up fighting like neither, and the master is not amused.",fx:{styleXp:4,wil:.6}},
          },
          {
            t: "Show the master your family's way",
            r: 'The master watches, frowning, then laughs. "So that is where that comes from." You are the first of your blood to teach a master something.',
            fx: (p,ctx)=>{const hs=houseStyleOf(p);return hs&&p.styles&&p.styles[hs.id]&&A.styleXp(p,hs.id,10),A.applyFx(p,{styleXp:8,fame:1,honor:1},ctx),""},
          },
        ],
      },
      {
        id: "sc_ss_family",
        cond: (p,C)=>fightSch(p,C)&&C.parentsAlive(p),
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{scx(p,ctx)},
        title: "Your family in the stand",
        text: "{father} and {mother} have come all the way to {school} to watch you in the feast-day bouts. Your mother has a new shawl. Your father has told the whole inn that you are the best in the school.",
        choices: [
          {
            t: "Fight for them",
            r: "You look up at the stand once, and then not again.",
            fx: (p,ctx)=>(A.applyFx(p,{styleXp:8,rel:{who:"father",op:5}},ctx),bout(p,ctx,{k:"spar",tier:2,place:"the feast-day bouts at "+ctx.school,title:"Your family is watching",occ:"a student of the school"})),
          },
          {
            t: "Ask the master to pair you with someone you can beat",
            check: {s:"persuasion",s2:"etiquette",d:46},
            win: {
              r: "The master smiles and gives you a nervous first-year. Your father cheers until he is hoarse. You are a little ashamed.",
              fx: {rel:{who:"father",op:8},honor:-1,happy:3},
            },
            lose: {
              r: 'The master gives you the best senior in the school instead, "since your father says you are the best."',
              fx: (p,ctx)=>bout(p,ctx,{k:"spar",tier:4,place:"the feast-day bouts at "+ctx.school,title:"Your family is watching",occ:"the best senior in the school"}),
            },
          },
        ],
      },
      {
        id: "sc_ss_copy",
        cond: (p,C)=>fightSch(p,C)&&C.adult(p)&&myRank(p)>=2,
        w: .7,
        cool: 12,
        setup: (p,ctx)=>{scx(p,ctx),ctx.move=A.pick(["a low hook that takes the shield","a stamp and turn","a cut that starts as a bow","a throw from the bind"])},
        title: "A stolen move",
        text: "You saw a student of the rival school use {move} in the square, and you have been doing it in the yard ever since. Now their master has sent a letter to yours: you are a thief of other men's teaching.",
        choices: [
          {
            t: "Say you saw it, and the eyes are free",
            check: {s:"persuasion",s2:"int",d:48},
            win: {
              r: 'Your master agrees. "A move seen in the street belongs to the street." The other master never writes again.',
              fx: (p,ctx)=>(A.trainSkill(p,sk(p),2),F(p,ctx,{styleXp:10,ins:.5})),
            },
            lose: {r:"Your master forbids the move in the yard. You keep it for the street.",fx:{styleXp:4,honor:-1}},
          },
          {
            t: "Go and apologise to the other master",
            r: 'The old man looks at you a long while, then shows you how the move is really done. "Now you have stolen it properly."',
            fx: (p,ctx)=>{const a=learnOther(p,"");return A.applyFx(p,{honor:3,styleXp:6},ctx),a},
          },
          {t:"Stop using it",r:"You drop the move. Something in you remembers it anyway.",fx:{ins:.3}},
        ],
      },
      {
        id: "sc_ss_ground",
        cond: (p,C)=>fightSch(p,C),
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{scx(p,ctx),ctx.ground=R(p,...DWARF)?"a tunnel two paces wide":R(p,...ELF)?"a branch-walk between two oaks":R(p,"POL-33","POL-04","POL-14")?"a wet deck rocking on ropes":A.pick(["a narrow stair in the old tower","ankle-deep mud behind the stables","the gap between two carts"])},
        title: "The lesson of the ground",
        text: '"Every fighter alive is unbeatable somewhere and a fool somewhere else," says {master}, and takes the class to fight on {ground}. The best student in the school loses three bouts in a row.',
        choices: [
          {
            t: "Learn to use the ground",
            check: {s:"ins",s2:"int",d:46},
            win: {
              r: "You stop fighting the man and start fighting the place. It changes everything.",
              fx: {ins:1,int:.4,styleXp:12,skill:{tactics:1}},
            },
            lose: {
              r: "The ground beats you as thoroughly as it beat everyone else. That is the lesson.",
              fx: {wil:.8,styleXp:6},
            },
          },
          {
            t: "Fight as if the ground were not there",
            r: 'You slip, fall and lose. The master nods: "Now you know."',
            fx: {wil:.5,styleXp:4,health:-3},
          },
        ],
      },
      {
        id: "sc_ss_mail",
        cond: (p,C)=>fightSch(p,C)&&C.adult(p),
        w: .8,
        cool: 8,
        setup: (p,ctx)=>{scx(p,ctx),ctx.heat=R(p,...WELL,"POL-18","POL-20","POL-30")?"under a noon sun that would kill a man in wool":"on the hottest day of summer"},
        title: "A day in mail",
        text: '{master} makes the senior students fight in full mail and padded coats {heat}, from dawn to dusk. "In a real fight you will be tired and hot and frightened. Get used to two of them."',
        choices: [
          {
            t: "Endure it",
            check: {
              s: "sta",
              s2: "wil",
              d: 50,
              bonus: p=>(A.hasBlood(p,"saltskin")||A.hasBlood(p,"runner")?15:0)-(["orc","halforc"].includes(p.race)?8:0),
            },
            win: {
              r: "You are standing at dusk. Many are not. Fatigue rules every fight, and you have just learned how far yours goes.",
              fx: {sta:1.2,wil:1.5,styleXp:10},
            },
            lose: {r:"You faint before noon and wake under a bucket of water.",fx:{health:-6,wil:1,cause:"heat"}},
          },
          {
            t: "Pace yourself and save your breath",
            check: {s:"int",s2:"sta",d:44},
            win: {
              r: "Slow, steady, never all-out. You finish fresher than the strong ones. The master notices.",
              fx: {sta:.8,int:.3,styleXp:10},
            },
            lose: {r:"Pacing becomes resting. The master notices that too.",fx:{styleXp:3,happy:-2}},
          },
        ],
      },
      {
        id: "sc_ss_master_bout",
        cond: (p,C)=>fightSch(p,C)&&myRank(p)>=2,
        w: .7,
        cool: 10,
        setup: (p,ctx)=>{scx(p,ctx)},
        title: "Touch the master",
        text: "Once a year {master} fights every senior student, one after another, with a blunt blade. Nobody has touched the master in nine years. It is your turn.",
        choices: [
          {
            t: "Go for the touch",
            r: "You salute. The master does not.",
            fx: (p,ctx)=>(A.applyFx(p,{styleXp:12},ctx),bout(p,ctx,{k:"spar",champ:!0,place:"the yard of "+ctx.school,title:"Touch the master",occ:"the master of "+ctx.school})),
          },
          {
            t: "Watch the master's breath, and wait",
            check: {s:"ins",s2:"wil",d:62},
            win: {
              r: "One breath too long. Your blade brushes the master's sleeve. The yard goes silent, and then the master laughs out loud.",
              fx: (p,ctx)=>F(p,ctx,{styleXp:25,fame:3,ins:1,deed:"Touched the master of "+ctx.school+" in the yearly bouts"}),
            },
            lose: {r:"You wait, and wait, and are touched four times while waiting.",fx:{styleXp:8,wil:1}},
          },
        ],
      },
      {
        id: "sc_ss_fever",
        cond: (p,C)=>fightSch(p,C),
        w: .6,
        cool: 15,
        setup: (p,ctx)=>{scx(p,ctx)},
        title: "Fever in the dormitory",
        text: "A fever runs through the dormitory of {school}. Six students are down, two are dying, and the master has sent the healthy ones home until it passes.",
        choices: [
          {
            t: "Stay and nurse the sick",
            check: {s:"sta",s2:"medicine",d:46,bonus:p=>A.hasBlood(p,"feverproof")?30:0},
            win: {
              r: "Willow bark, broth, clean water, cool cloths. Both the dying ones live. Nobody at the school forgets who stayed.",
              fx: {honor:5,skill:{medicine:3},newRel:{type:"bestfriend",op:50}},
            },
            lose: {r:"You catch it yourself and nearly join them.",fx:{health:-25,wil:1.5,honor:3,cause:"a fever"}},
          },
          {
            t: "Go home as the master says",
            r: "You go home and wait. When you come back, there are two empty beds.",
            fx: {happy:-4,wil:.5},
          },
        ],
      },
      {
        id: "sc_ss_court",
        cond: (p,C)=>fightSch(p,C)&&C.adult(p)&&myRank(p)>=2,
        w: .6,
        cool: 12,
        setup: (p,ctx)=>{scx(p,ctx)},
        title: "Before the court",
        text: "{School} is asked to show its art before the {rulerTitle} at {capital}. {Master} chooses six students. You are one of them, and you are to fight the last bout.",
        choices: [
          {
            t: "Fight the last bout",
            r: "The hall is full of silk and silence.",
            fx: (p,ctx)=>(A.applyFx(p,{styleXp:10,fame:2,favor:2},ctx),bout(p,ctx,{k:"spar",tier:3,place:"the great hall at "+capOf(p),title:"Before the court",occ:"a student of the school"})),
          },
          {
            t: "Make it beautiful rather than fast",
            check: {s:"melee",s2:"etiquette",d:52,bonus:p=>SB(p,.6)},
            win: {
              r: "Every move clean and slow enough to see. The court applauds, and the {rulerTitle} asks your name.",
              fx: {fame:3,favor:6,styleXp:10},
            },
            lose: {r:"Beautiful, slow and hit. The court laughs kindly, which is worse.",fx:{styleXp:4,happy:-3}},
          },
        ],
      },
      {
        id: "sc_ss_letter",
        cond: (p,C)=>C.atSchool(p)&&C.parentsAlive(p),
        w: .7,
        cool: 12,
        setup: (p,ctx)=>{scx(p,ctx),ctx.par=A.pick(["father","mother"])},
        title: "A letter from home",
        text: "A letter from home, in a neighbor's hand: your {par} is ill, and asks for you. The examinations at {school} are in a week, and {master} does not give second chances.",
        choices: [
          {
            t: "Go home at once",
            r: "You ride through the night. Whatever happens at the school, you were there when it mattered.",
            fx: (p,ctx)=>F(p,ctx,{honor:3,rel:{who:ctx.par,op:10},happy:2,wil:.5}),
          },
          {
            t: "Stay for the examinations, then go",
            check: {s:"wil",s2:"sta",d:48},
            win: {
              r: "You pass and ride home the same night. You are in time.",
              fx: (p,ctx)=>(A.trainSkill(p,isFight(p)?sk(p):acP(p)[0],3),F(p,ctx,{styleXp:10,wil:1,rel:{who:ctx.par,op:3}})),
            },
            lose: {r:"You fail with your mind elsewhere, and you are late home too.",fx:{wil:1.5,happy:-6}},
          },
          {
            t: "Send money instead",
            req: p=>p.coin>=10,
            r: "Ten suns for the physician. A letter comes back: better now. And a second line: we missed you.",
            fx: {coin:-10,styleXp:6,happy:-1},
          },
        ],
      },
      {
        id: "sc_ss_brother",
        cond: (p,C)=>fightSch(p,C)&&C.adult(p)&&(p.school.years||0)>=1,
        w: .8,
        cool: 12,
        setup: (p,ctx)=>{scx(p,ctx),classmate(p,ctx,"friend",!1)},
        title: "Blood in the yard",
        text: "In a bout that went wrong you opened {themFull}'s arm to the bone, and then carried {themHim} to the bonesetter yourself. {They} has not stopped making jokes about it since. You have shared bread, bruises and one very bad winter.",
        choices: [
          {
            t: "Swear the old oath of the yard together",
            r: "Blades crossed, palms cut, a few words older than the school. Whatever happens, wherever you go, you are bound.",
            // [X1 baked patch events/33-no-obvious-choices CHOICE-SC-SS-BROTHER] sc_ss_brother: the oath of the yard ("palms
            // cut") now costs a little health.
            fx: {them:{type:"bestfriend",op:60},honor:2,happy:5,wil:.5,health:-1},
          },
          {
            t: "Keep it a friendship",
            r: "No oaths. You do not need them. Years later you will still write to each other.",
            fx: {them:{type:"friend",op:35},happy:3},
          },
        ],
      },
      {
        id: "sc_ac_disputation",
        cond: (p,C)=>acad(p,C),
        w: 1.2,
        cool: 3,
        setup: (p,ctx)=>{scx(p,ctx),ctx.q={war:"whether a general should ever fight with a river at his back",letters:"whether an oath sworn under fear binds the one who swore it",medicine:"whether a fever should be bled or cooled",faith:"whether a sin confessed at noon weighs less than one confessed at night",trade:"whether a merchant may charge for the time his money is away",crafts:"why a guild must fix the price of a nail",sea:"how to find the noon line with a cloudy sky",arts:"whether a song must be true to be good"}[p.school.academy]||"a question nobody has answered in two hundred years"},
        title: "The disputation",
        text: "The year ends at {school} with a public disputation. You must argue {q}, before {master} and anyone in {home} who cares to listen.",
        choices: [
          {
            t: "Prepare for weeks and argue from the books",
            check: {s:"learning",s2:"int",d:48},
            win: {
              r: "You quote three authorities and demolish a fourth. {Master} writes your name in the book of the year.",
              fx: (p,ctx)=>(A.trainSkill(p,acP(p)[0],4),F(p,ctx,{int:.8,skill:{learning:2},fame:1})),
            },
            lose: {
              r: "Your opponent knows a book you did not. The hall laughs at the right moment, for him.",
              fx: {wil:1,skill:{learning:1},happy:-3},
            },
          },
          {
            t: "Argue from life, not books",
            check: {s:"persuasion",s2:"ins",d:50},
            win: {
              r: "You tell them about a real fever, a real river, a real oath. The townsfolk cheer. The masters frown, then nod.",
              fx: {skill:{persuasion:3},fame:1,int:.4},
            },
            lose: {
              r: '"Anecdote is not argument." The masters agree with each other, at length.',
              fx: {wil:.6,skill:{persuasion:1}},
            },
          },
          {
            t: "Buy last year's winning argument from a graduate (15 suns)",
            req: p=>p.coin>=15,
            check: {s:"deception",s2:"learning",d:46},
            win: {
              r: "Nobody notices. You win with someone else's words and feel strangely hollow.",
              fx: {coin:-15,honor:-3,skill:{learning:1}},
            },
            lose: {r:"{Master} recognizes the argument. The master wrote it.",fx:{coin:-15,honor:-5,happy:-5,wil:1}},
          },
        ],
      },
      {
        id: "sc_ac_lowborn",
        cond: (p,C)=>acad(p,C)&&!["noble","royal","gentry"].includes(p.status),
        w: 1,
        cool: 8,
        setup: (p,ctx)=>{scx(p,ctx),classmate(p,ctx,"rival",!0)},
        title: "Low birth",
        text: '{themFull}{hof} has noticed that you eat in the kitchen to save money and that your boots are mended with string. "Did they let the stable boys in this year?" The table laughs.',
        choices: [
          {
            t: "Answer with wit",
            check: {s:"persuasion",s2:"int",d:48},
            win: {
              r: '"They let in anyone who can read. They must have made an exception for you." The table laughs again, the other way.',
              fx: {happy:4,them:{type:"rival",op:-10},skill:{persuasion:1}},
            },
            lose: {r:"Your answer comes out a stammer. The table laughs harder.",fx:{happy:-4,wil:1}},
          },
          {
            t: "Beat {themHim} in the examinations instead",
            check: {s:"learning",s2:"wil",d:52},
            win: {
              r: "Your name sits above {theirHis} on the list at the year's end. You never mention it. You do not need to.",
              fx: (p,ctx)=>(A.trainSkill(p,acP(p)[0],4),F(p,ctx,{wil:1,int:.5,them:{type:"rival",op:-5}})),
            },
            lose: {r:"{They} has had tutors since childhood. Not this year.",fx:{wil:1.5,happy:-3}},
          },
          {
            t: "Say nothing, and remember",
            r: "You swallow it. You will meet {themHim} again, in twenty years, in a very different room.",
            fx: {wil:1,trait:"vengeful",them:{type:"enemy",op:-20}},
          },
        ],
      },
      {
        id: "sc_ac_library",
        cond: (p,C)=>acad(p,C)&&C.literate(p),
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{scx(p,ctx),ctx.book=R(p,...SUNLAND)?"an old Solen book that counts the years differently from the Temple":R(p,...WELL)?"a Qadiri book on the eye, copied on Qadira's own paper":R(p,...DWARF)?"a carved contract-book older than the hold":R(p,...ELF)?"a grove-record of the Oak Line wars, in a hand five centuries old":"a chronicle the crown had burned, all but this copy"},
        title: "The locked cupboard",
        text: "In the library of {school} one cupboard is always locked. A porter who likes you says it holds {book}, and that the key hangs in the master's room on feast days.",
        choices: [
          {
            t: "Borrow the key on a feast day",
            check: {s:"stealth",s2:"learning",d:46},
            win: {
              r: "One night, one candle, one book. You understand something about the world that most people never will.",
              fx: {int:1.2,skill:{learning:3},flag:"sc_forbidden_book"},
            },
            lose: {
              r: "The master comes back early from the feast. You are scrubbing floors for a month and the cupboard has a new lock.",
              fx: {happy:-3,wil:.8},
            },
          },
          {
            t: "Ask the master for leave to read it",
            check: {s:"persuasion",s2:"etiquette",d:52},
            win: {
              r: 'The master looks at you a long time. "Read it here, in front of me, and ask me questions." You do.',
              fx: {int:1,skill:{learning:3},newRel:{type:"mentor",op:30,back:"student"}},
            },
            lose: {r:'"Some books are locked for a reason." The master does not say what the reason is.',fx:{int:.2}},
          },
          {
            t: "Leave it locked",
            r: "There are enough unlocked books to keep you busy for ten years.",
            fx: {skill:{learning:1}},
          },
        ],
      },
      {
        id: "sc_ac_dullard",
        cond: (p,C)=>acad(p,C),
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{scx(p,ctx),classmate(p,ctx,"acquaint",!0),ctx.pay=A.ri(20,45)},
        title: "A rich fool",
        text: "{themFull}{hof} is pleasant, generous and as thick as a castle wall. {Their} father will pay {pay} suns if you get {themHim} through the year's examinations.",
        choices: [
          {
            t: "Tutor {themHim} honestly",
            check: {s:"learning",s2:"persuasion",d:46},
            win: {
              r: "A year of patient evenings. {They} scrapes through, and {their} father pays and writes you a letter you keep for life.",
              fx: (p,ctx)=>F(p,ctx,{coin:ctx.pay,them:{type:"friend",op:35},skill:{learning:2,persuasion:1}}),
            },
            lose: {
              r: 'Nothing goes in. {They} fails, and {their} father pays half "for your trouble".',
              fx: (p,ctx)=>F(p,ctx,{coin:Math.round(ctx.pay/2),them:{type:"friend",op:15}}),
            },
          },
          {
            t: "Write {their} work for {themHim}",
            check: {s:"deception",s2:"learning",d:48},
            win: {
              r: "{They} passes with honors in a hand that looks a great deal like yours. Nobody checks.",
              fx: (p,ctx)=>F(p,ctx,{coin:ctx.pay+10,honor:-4,them:{type:"friend",op:20}}),
            },
            lose: {
              r: "The master recognizes your turns of phrase. You both stand before the masters.",
              fx: {honor:-5,happy:-5,wil:1,them:{type:"acquaint",op:-10}},
            },
          },
          {
            t: "Refuse. Your own work is enough",
            r: "You need the money. You need the time more.",
            fx: (p,ctx)=>(A.trainSkill(p,acP(p)[0],2),""),
          },
        ],
      },
      {
        id: "sc_ac_answers",
        cond: (p,C)=>acad(p,C),
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{scx(p,ctx),who(p,ctx,"acquaint","a porter at "+ctx.school)},
        title: "Answers for sale",
        text: "{themFull}, a porter at {school}, sells the examination questions a week early, at five suns a paper. Half your year has bought them. The other half is thinking about it.",
        choices: [
          {
            t: "Buy them (5 suns)",
            req: p=>p.coin>=5,
            r: "You pass easily. You also learn nothing, which you discover later at a bad time.",
            fx: {coin:-5,honor:-3},
          },
          {
            t: "Report the porter",
            r: "The porter is dismissed. Half your year knows who talked, and some of them will not forget.",
            fx: {honor:3,them:{type:"enemy",op:-30},newRel:{type:"rival",op:-20}},
          },
          {
            t: "Study the honest way",
            check: {s:"learning",s2:"wil",d:46},
            win: {
              r: "You pass on your own, and two places above people who bought the answers.",
              fx: (p,ctx)=>(A.trainSkill(p,acP(p)[0],4),F(p,ctx,{wil:.8,honor:1})),
            },
            lose: {
              r: "You fail, honestly, while worse students pass. It is a lesson about the world.",
              fx: {wil:1.5,happy:-4},
            },
          },
        ],
      },
      {
        id: "sc_ac_bursary",
        cond: (p,C)=>acad(p,C)&&!C.flag(p,"sc_bursary")&&!["noble","royal"].includes(p.status),
        w: .7,
        cool: 10,
        setup: (p,ctx)=>{scx(p,ctx),ctx.from={war:"the Captains' Fund, which pays for poor officers",letters:"a judge who was poor once himself",medicine:"the sun-sisters' infirmary, which needs physicians",faith:"the temple of your home town",trade:"a trading house that wants clerks who owe it a favor",crafts:"the guild's widows' chest",sea:"a shipowner who wants mates who owe him a voyage",arts:"a lady who wants a poet of her own"}[p.school.academy]||"a patron of the college"},
        title: "A bursary",
        text: "You are offered a bursary by {from}. Half your fees, for as long as you study. There is a condition, of course: when you graduate, you serve them for three years.",
        choices: [
          {
            t: "Accept",
            r: "Your fees are halved. Three years of your future have been sold, at a fair price.",
            fx: (p,ctx)=>(halveFee(p),p.flags.sc_bursary=A.S.year,A.applyFx(p,{happy:4},ctx),""),
          },
          {
            t: "Bargain for the fees without the service",
            check: {s:"persuasion",s2:"trade",d:55},
            win: {
              r: "One year of service instead of three. They agree, a little surprised.",
              fx: (p,ctx)=>(halveFee(p),p.flags.sc_bursary=A.S.year,A.applyFx(p,{happy:5,skill:{persuasion:1}},ctx),""),
            },
            lose: {r:"They withdraw the offer, and give it to someone less difficult.",fx:{happy:-3}},
          },
          {
            t: "Refuse. You will owe nobody",
            r: "You keep your future your own, and your purse empty.",
            fx: {honor:2,wil:.5},
          },
        ],
      },
      {
        id: "sc_ac_clerk",
        cond: (p,C)=>acad(p,C)&&C.literate(p),
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{scx(p,ctx)},
        title: "The master's clerk",
        text: "{Master} is writing a great book and needs a clerk with a clean hand and a closed mouth, and has chosen you, which means long nights, no pay, and the best education in the realm.",
        choices: [
          {
            t: "Accept gladly",
            r: "A year of copying, arguing and being shouted at. You learn more than in all your lectures.",
            fx: (p,ctx)=>{const k=acP(p);return A.trainSkill(p,k[0],5),A.trainSkill(p,"learning",3),F(p,ctx,{int:.8,newRel:{type:"mentor",op:35,back:"student"},happy:-1})},
          },
          {
            t: "Accept, and fix the master's mistakes quietly",
            check: {s:"learning",s2:"int",d:54},
            win: {
              r: "The master notices, and puts your name in the preface. It is the first time your name has been written in a book.",
              fx: (p,ctx)=>(A.trainSkill(p,acP(p)[0],5),F(p,ctx,{int:1,fame:2,newRel:{type:"mentor",op:45,back:"student"}})),
            },
            lose: {r:'You "fix" something that was right. The master is not amused.',fx:{happy:-3,skill:{learning:2}}},
          },
          {
            t: "Decline: you need paid work",
            r: "You copy contracts for a notary instead, at four pence a page.",
            fx: {coin:12,skill:{learning:1}},
          },
        ],
      },
      {
        id: "sc_ac_curfew",
        cond: (p,C)=>acad(p,C),
        w: .6,
        cool: 12,
        setup: (p,ctx)=>{scx(p,ctx),ctx.crime=A.pick(["coming back over the wall after the gate was shut","a brawl with townsmen in a wine shop","singing a rude song about the master under the master's window","losing a borrowed book in a river"])},
        title: "Before the masters",
        text: "You are called before the masters of {school} for {crime}. It is the third such matter this year. The rule says a student who brings shame on the college is sent home.",
        choices: [
          {
            t: "Plead your case",
            check: {s:"persuasion",s2:"etiquette",d:50},
            win: {
              r: "You are honest, brief and sorry. The masters let you stay, on your last warning.",
              fx: {wil:.5,skill:{persuasion:1}},
            },
            lose: {
              r: "The masters vote, and send you home.",
              fx: (p,ctx)=>{const n=leaveSchool(p);return p.flags.sc_expelled=A.S.year,A.willGrow(p,1.5),p.happy=Math.max(0,p.happy-8),`You are sent down from ${n}.`},
            },
          },
          {
            t: "Take your punishment",
            r: "A month confined to the college, copying the statutes. You know them by heart now, which is the idea.",
            fx: {wil:1,skill:{learning:1},happy:-3},
          },
          {
            t: "Blame a richer student",
            check: {s:"deception",s2:"intrigue",d:52},
            win: {
              r: "The masters fine his father and forget you. He knows, though.",
              fx: {honor:-4,newRel:{type:"enemy",op:-30}},
            },
            lose: {
              r: "The richer student has witnesses. You are sent home.",
              fx: (p,ctx)=>{const n=leaveSchool(p);return p.flags.sc_expelled=A.S.year,A.addTrait(p,"deceitful"),`You are sent down from ${n}, and the reason follows you.`},
            },
          },
        ],
      },
      {
        id: "sc_ac_winter",
        cond: (p,C)=>acad(p,C),
        w: .8,
        cool: 12,
        setup: (p,ctx)=>{scx(p,ctx),classmate(p,ctx,"friend",!1)},
        title: "The long winter",
        text: "The firewood runs out at {school} in the dark weeks, and you and {themFull} share a blanket, a candle and one book between you, reading aloud to keep warm. By spring you have argued about everything.",
        choices: [
          {
            t: "Promise to stay friends, whatever comes",
            r: "You shake hands on it by the last of the candle. Forty years later, you will still be writing to each other.",
            fx: {them:{type:"bestfriend",op:55},happy:5,int:.4},
          },
          {
            t: "Make it a rivalry of minds",
            r: "You agree to disagree for life, and to keep score. It will make you both better.",
            fx: {them:{type:"rival",op:25},int:.6,skill:{learning:2}},
          },
        ],
      },
      {
        id: "sc_ac_gown",
        cond: (p,C)=>acad(p,C)&&C.town(p),
        w: .7,
        cool: 10,
        setup: (p,ctx)=>{scx(p,ctx)},
        title: "Town and gown",
        text: "A student cheated a baker, or a baker cheated a student, and now the apprentices of {home} are outside the gate of {school} with clubs, and the students inside are arming themselves with benches.",
        choices: [
          {
            t: "Join the defense of the gate",
            r: "Benches against clubs, and a long night.",
            fx: (p,ctx)=>bout(p,ctx,{k:"brawl",tier:1,place:"the gate of "+ctx.school,title:"Town and gown",occ:"an angry apprentice",weapon:"club"}),
          },
          {
            t: "Go out and talk to the apprentices",
            check: {s:"diplomacy",s2:"wil",d:50},
            win: {
              r: "You find the baker, pay him from your own purse, and send everyone home. The masters do not know whether to punish or praise you.",
              fx: {coin:-3,honor:4,skill:{diplomacy:2},fame:1},
            },
            lose: {r:"A clod of earth hits you in the face before your second sentence.",fx:{health:-5,wil:.8}},
          },
          {
            t: "Stay in the library",
            r: "You read through the whole riot. The book was very good.",
            fx: {skill:{learning:1}},
          },
        ],
      },
      {
        id: "sc_ac_candles",
        cond: (p,C)=>acad(p,C)&&p.coin<25,
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{scx(p,ctx),ctx.coinNow=p.coin>0?A.coin(p.coin):"nothing"},
        title: "No money for candles",
        text: "Books cost more than food, candles cost more than books, and the fees fall due at {festival}. You have {coinNow} in your purse.",
        choices: [
          {
            t: "Copy books for the booksellers at night",
            req: (p,C)=>C.literate(p),
            check: {s:"learning",s2:"sta",d:40},
            win: {
              r: "Four pence a page, a thousand pages. Your hand aches and your purse fills, a little.",
              fx: {coin:18,skill:{learning:2},sta:.3},
            },
            lose: {
              r: "You fall asleep over the pages and blot three of them. The bookseller docks your pay.",
              fx: {coin:6,happy:-2},
            },
          },
          {
            t: "Sell your good coat",
            r: "Twelve suns. A cold winter, but a warm mind.",
            fx: {coin:12,health:-3,wil:.5},
          },
          {
            t: "Read by the light of the chapel lamps",
            r: "The keeper lets you sit by the altar. You learn a great deal of scripture without meaning to.",
            fx: {skill:{learning:1,faith:1},piety:2},
          },
        ],
      },
      {
        id: "sc_ac_final",
        cond: (p,C)=>acad(p,C)&&(p.school.years||0)>=2&&!C.diploma(p,p.school.academy),
        w: 1.2,
        cool: 3,
        setup: (p,ctx)=>{scx(p,ctx)},
        title: "The final examinations",
        text: "The masters of {school} offer you the final examinations a year early. Three days of questions, a written work, and an oral before {master}. Pass, and you leave with the college's seal. Fail, and everyone knows you tried.",
        choices: [
          {
            t: "Sit them now",
            check: {s:"learning",s2:"int",d:54},
            win: {
              r: "Three days, and on the fourth the masters stand when you come in. You have the seal.",
              fx: (p,ctx)=>{const k=p.school&&p.school.academy,nm2=ctx.school;return A.trainSkill(p,acP(p)[0],4),k&&(p.flags["dip_"+k]=A.S.year,p.deeds.push({y:A.S.year,t:"Graduated from "+nm2}),A.fame(p,2),p.school=null),`You graduate from ${nm2}. ${A.DIPLOMA_TEXT&&A.DIPLOMA_TEXT[k]||""}`.trim()},
            },
            lose: {
              r: 'You falter on the second day. "Next year," says {master}, not unkindly.',
              fx: {wil:1.5,happy:-4,skill:{learning:2}},
            },
          },
          {
            t: "Wait, and finish properly",
            r: "Another year of study. The seal will mean more for it.",
            fx: (p,ctx)=>(A.trainSkill(p,acP(p)[0],3),F(p,ctx,{int:.4})),
          },
        ],
      },
      {
        id: "sc_wc_ford",
        cond: (p,C)=>acad(p,C,"war"),
        w: 1.2,
        cool: 3,
        setup: (p,ctx)=>{scx(p,ctx),classmate(p,ctx,"rival",!0),ctx.board=R(p,...DWARF)?"a carved stone board of Gates":"the great sand table"},
        title: "The map exercise",
        text: "On {board} the Commandant sets a problem: you hold a ford with two thousand foot and a hundred horse; {themFull}{hof} comes on with six thousand. The exercise runs three days, and the whole college watches.",
        choices: [
          {
            t: "Hold the ford: stakes, crossbows, and patience",
            check: {s:"tactics",s2:"int",d:50},
            win: {
              r: "Stakes in the shallows, crossbows behind them, horse hidden in the alders. {They} breaks {their} army on your ford and the Commandant calls it a lesson for the college.",
              fx: {skill:{tactics:4,command:1},int:.5,fame:1,them:{type:"rival",op:-10}},
            },
            lose: {
              r: "{They} finds a second ford you never scouted. The Commandant asks, in front of everyone, whether you have heard of scouts.",
              fx: {skill:{tactics:2},wil:1,happy:-3},
            },
          },
          {
            t: "Cross the river and strike first",
            check: {s:"tactics",s2:"ins",d:56},
            win: {
              r: "Nobody expects the smaller army to attack. {Their} baggage burns on the sand table, and the masters argue about it for weeks.",
              fx: {skill:{tactics:5},ins:.6,fame:2,them:{type:"rival",op:-15}},
            },
            lose: {
              r: "An army caught astride a river, the Commandant says, is the oldest disaster in the book.",
              fx: {skill:{tactics:2},wil:1,happy:-4},
            },
          },
          {
            t: "Withdraw and burn the bridges behind you",
            check: {s:"logistics",s2:"tactics",d:46},
            win: {
              r: 'You give up the ford and keep the army. "Dull," says the Commandant, "and correct."',
              fx: {skill:{logistics:3,tactics:2}},
            },
            lose: {
              r: "Your retreat becomes a rout on the sand. Little wooden men everywhere.",
              fx: {skill:{logistics:1},wil:.6},
            },
          },
        ],
      },
      {
        id: "sc_wc_battle",
        cond: (p,C)=>acad(p,C,"war","letters"),
        w: 1,
        cool: 4,
        setup: (p,ctx)=>{scx(p,ctx);const own=BATTLES.filter(b2=>b2[2].includes(p.realm)),b=own.length?A.pick(own):A.pick(BATTLES);ctx.battle=b[0],ctx.what=b[1]},
        title: "A battle that teaches",
        text: 'This term {school} studies {battle}: {what}. {Master} points at you. "You command the losing side. What do you do differently?"',
        choices: [
          {
            t: "Give a bold answer",
            check: {s:"tactics",s2:"int",d:52},
            win: {
              r: 'You find the hour where it turned, and what could have been done in it. {Master} says nothing for a long moment, then: "Write that down."',
              fx: {skill:{tactics:4},int:.6,fame:1},
            },
            lose: {
              r: "Your bold answer loses the battle faster than the real general did.",
              fx: {skill:{tactics:2},wil:.6},
            },
          },
          {
            t: "Say you would not have fought there at all",
            check: {s:"logistics",s2:"learning",d:48},
            win: {
              r: '"The best battle is the one you do not fight." {Master} smiles. It is the answer the old ones always give.',
              fx: {skill:{logistics:2,learning:2},int:.4},
            },
            lose: {r:'"Easy to say from a classroom." {Master} moves on to someone braver.',fx:{skill:{learning:1}}},
          },
          {
            t: "Ask who wrote the account, and why",
            r: "The room goes quiet. Most battle accounts are written by the winners, and you have just said so out loud. {Master} gives you extra reading.",
            fx: {int:.8,skill:{learning:2,tactics:1}},
          },
        ],
      },
      {
        id: "sc_wc_bread",
        cond: (p,C)=>acad(p,C,"war"),
        w: 1,
        cool: 4,
        setup: (p,ctx)=>{scx(p,ctx),ctx.n=A.pick(["four thousand","six thousand","nine thousand"])},
        title: "Bread for an army",
        text: "The master of supply sets your problem: {n} men and their horses, a month's march, in autumn, through land that has already been foraged. Show your carts, your bread, your water and your latrines.",
        choices: [
          {
            t: "Count every loaf and every cart",
            check: {s:"logistics",s2:"int",d:50},
            win: {
              r: 'You even put the latrines downwind and move the camp every two weeks. "Camp fever kills more than battles," says the quartermaster. "You will lose fewer men than most."',
              fx: {skill:{logistics:5,stewardship:1},int:.5},
            },
            lose: {
              r: "Your army starves in the third week, on paper. Better on paper.",
              fx: {skill:{logistics:2},wil:.6},
            },
          },
          {
            t: "Live off the land and march fast",
            check: {s:"logistics",s2:"ins",d:55},
            win: {
              r: 'A bold plan that would have worked, just. The master marks it "dangerous, and possible".',
              fx: {skill:{logistics:3,tactics:2}},
            },
            lose: {
              r: '"Land that has been foraged," the master repeats slowly. "Read the question."',
              fx: {skill:{logistics:1},happy:-2},
            },
          },
        ],
      },
      {
        id: "sc_wc_engine",
        cond: (p,C)=>acad(p,C,"war"),
        w: .9,
        cool: 6,
        setup: (p,ctx)=>{scx(p,ctx),ctx.lore=R(p,"POL-31")?"Silas Vane built one from the timber at hand and called its throw within ten paces at two hundred and fifty.":R(p,...DWARF)?"The Dragon Watch's engines are built to a carved pattern older than the hold.":"The engineers say the counterweight engine is the most important thing built in a hundred years."},
        title: "The model engine",
        text: "Each student must build a model counterweight engine and throw a stone at a mark across the yard. {lore}",
        choices: [
          {
            t: "Build it carefully and calculate the throw",
            check: {s:"siegecraft",s2:"int",d:50},
            win: {
              r: "Your stone lands a hand from the mark. The engineers come over to look at your sling release.",
              fx: {skill:{siegecraft:4,craft:2},int:.5},
            },
            lose: {
              r: "The arm breaks on the first throw. The stone goes backward into the Commandant's window.",
              fx: {skill:{siegecraft:2,craft:1},happy:-2},
            },
          },
          {
            t: "Make it bigger than anyone's",
            check: {s:"craft",s2:"str",d:52},
            win: {
              r: "It throws twice as far as the mark and through a wall nobody liked. They talk about it for years.",
              fx: {skill:{siegecraft:3,craft:3},fame:1},
            },
            lose: {
              r: "It is too big to wind. The others finish while you are still looking for a bigger rope.",
              fx: {skill:{craft:2}},
            },
          },
        ],
      },
      {
        id: "sc_wc_levies",
        cond: (p,C)=>acad(p,C,"war")&&C.adult(p),
        w: 1,
        cool: 5,
        setup: (p,ctx)=>{scx(p,ctx)},
        title: "Real men, wooden swords",
        text: "For the field exercise the college borrows a company of levies: two hundred farm boys who want to go home. You are given fifty of them and told to take a hill held by a rival student's fifty.",
        choices: [
          {
            t: "Lead from the front",
            check: {s:"command",s2:"wil",d:48},
            win: {
              r: "They follow you because you are in front. You take the hill with mud to your knees and fifty friends.",
              fx: {skill:{command:4},wil:.8,fame:1},
            },
            lose: {r:"You charge the hill. Twelve of your fifty follow you.",fx:{skill:{command:2},wil:1,happy:-3}},
          },
          {
            t: "Win with a trick: half go round the back",
            check: {s:"tactics",s2:"command",d:52},
            win: {
              r: "The rival student watches your twenty-five in front and never sees the twenty-five behind.",
              fx: {skill:{tactics:3,command:2}},
            },
            lose: {
              r: "The twenty-five who went round get lost and go home for supper.",
              fx: {skill:{tactics:1,command:1},happy:-2},
            },
          },
          {
            t: "Feed them first, then fight",
            r: "You buy bread and ale out of your own purse. They take the hill for you singing.",
            fx: {coin:-6,skill:{command:3,logistics:1}},
          },
        ],
      },
      {
        id: "sc_wc_plans",
        cond: (p,C)=>acad(p,C,"war","letters")&&C.adult(p)&&(p.school.years||0)>=1,
        w: .7,
        cool: 10,
        setup: (p,ctx)=>{scx(p,ctx),ctx.foe=enemyOf(p)},
        title: "Over wine",
        text: "After dinner {master} asks a few senior students what they think of the realm's plans against {foe}. A courtier from {capital} is at the table, listening very hard.",
        choices: [
          {
            t: "Say what you really think",
            check: {s:"tactics",s2:"diplomacy",d:54},
            win: {
              r: "Sharp, honest and polite. The courtier writes something down, and a month later you are asked to {capital} to say it again.",
              fx: {favor:6,skill:{tactics:2,diplomacy:2},fame:1},
            },
            lose: {
              r: "Sharp, honest and not polite enough. The courtier writes something down, and it is not a compliment.",
              fx: {favor:-6,wil:.5},
            },
          },
          {t:"Praise the plans",r:"The courtier smiles. {Master} does not, quite.",fx:{favor:3,honor:-1}},
          {
            t: "Ask a question instead of answering",
            check: {s:"int",s2:"etiquette",d:46},
            win: {
              r: "Your question is the one nobody at court has dared to ask. {Master} raises a glass to you.",
              fx: {int:.6,skill:{tactics:1,etiquette:1},favor:2},
            },
            lose: {
              r: "Your question is answered at length by the courtier. The evening is very long.",
              fx: {skill:{etiquette:1}},
            },
          },
        ],
      },
      {
        id: "sc_md_dissection",
        cond: (p,C)=>acad(p,C,"medicine"),
        w: 1.2,
        cool: 6,
        setup: (p,ctx)=>{scx(p,ctx),ctx.body=R(p,...SUNLAND)?"a hanged man given to the college by the town court, by old leave of the Temple":R(p,...WELL)?"a criminal's body, washed and prayed over first, by leave of the Well-Keepers":R(p,...ELF)?"a deer, since the groves forbid such work on any person":"an unclaimed body from the paupers' cart"},
        title: "The dissection room",
        text: 'Once a year {school} opens the cold room under the hall. On the table is {body}. {Master} holds out the knife. "Who will show us where the great vessels run?"',
        choices: [
          {
            t: "Take the knife",
            check: {s:"medicine",s2:"wil",d:46},
            win: {
              r: "Your hands are steady. You find the great vessels, the nerve of the arm and why a thigh wound kills in minutes. You will save lives with this.",
              fx: {skill:{medicine:5},int:.6,wil:.6},
            },
            lose: {
              r: "Your hands shake, and then your knees. You wake on the floor with smelling salts under your nose. The others are kind about it, mostly.",
              fx: {skill:{medicine:2},wil:1,happy:-3},
            },
          },
          {
            t: "Watch closely and draw what you see",
            check: {s:"craft",s2:"learning",d:44},
            win: {
              r: "Your drawings are so good the master keeps a copy for the college.",
              fx: {skill:{medicine:4,learning:1},fame:1},
            },
            lose: {
              r: "Your drawing of the liver looks like a map of somewhere you would not visit.",
              fx: {skill:{medicine:2}},
            },
          },
          {
            t: "Refuse, as your faith forbids it",
            r: "You stand by the door with your eyes shut and pray for the dead man. Some of the others follow your example.",
            fx: {piety:4,skill:{medicine:1}},
          },
        ],
      },
      {
        id: "sc_md_ward",
        cond: (p,C)=>acad(p,C,"medicine"),
        w: 1,
        cool: 5,
        setup: (p,ctx)=>{scx(p,ctx),ctx.ward=R(p,...SUNLAND)?"the sun-sisters' infirmary":R(p,"POL-27")?"the monastery infirmary":"the fever house by the river"},
        title: "The fever ward",
        text: "The students of {school} take turns in {ward}. This month it is full: the flux, the sweating fever, a child with burns. The older physicians are tired and short with everyone.",
        choices: [
          {
            t: "Work the night shifts",
            check: {s:"sta",s2:"medicine",d:48,bonus:p=>A.hasBlood(p,"feverproof")?25:0},
            win: {
              r: "Clean water, broth, willow bark, cool cloths, and knowing when to do nothing. The child lives.",
              fx: {skill:{medicine:5},honor:2,wil:.6},
            },
            lose: {
              r: "The fever takes you too. You lie in the ward you were working in.",
              fx: {health:-20,skill:{medicine:2},wil:1.5,cause:"a ward fever"},
            },
          },
          {
            t: "Watch the oldest physician and do as she does",
            r: "She talks to every patient by name, and never bleeds anyone. You do not understand why yet.",
            fx: {skill:{medicine:3},ins:.4},
          },
        ],
      },
      {
        id: "sc_md_bleeding",
        cond: (p,C)=>acad(p,C,"medicine"),
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{scx(p,ctx)},
        title: "Bleed the fever?",
        text: "{Master} teaches that a fever is too much hot blood, and must be bled. You have watched the herbwife in your village give willow bark and broth, and her patients live more often than the master's.",
        choices: [
          {
            t: "Say so, in the lecture",
            check: {s:"persuasion",s2:"medicine",d:56},
            win: {
              r: "The master is furious, then curious, then quietly stops bleeding the weakest patients. Nobody will ever say it was you.",
              fx: {skill:{medicine:4},int:.6,honor:2},
            },
            lose: {
              r: "The master asks whether the herbwife has read Galenus of Solen. The class laughs. You know you were right.",
              fx: {skill:{medicine:2},wil:1,happy:-3},
            },
          },
          {
            t: "Keep a private record of what works",
            check: {s:"learning",s2:"int",d:48},
            win: {
              r: "Two years of notes. Willow bark and broth, every time. One day this notebook will matter.",
              fx: {skill:{medicine:4,learning:2},int:.8,flag:"sc_fever_notes"},
            },
            lose: {r:"Your notes are a muddle. The truth is in there somewhere.",fx:{skill:{medicine:2}}},
          },
          {
            t: "Learn the master's way. You need the seal",
            r: "You learn to bleed a fever. You hope you will never have to.",
            fx: {skill:{medicine:3}},
          },
        ],
      },
      {
        id: "sc_md_saw",
        cond: (p,C)=>acad(p,C,"medicine")&&C.adult(p),
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{scx(p,ctx),ctx.who=A.pick(["a carter whose wheel went over his knee","a mason who fell from the scaffold","a soldier home from the border"])},
        title: "Above the knee",
        text: `On the table before {master} lies {who}, the knee smashed. It must come off today, or he dies by the end of the week. The master's hands are not what they were. "You. Hold the saw."`,
        choices: [
          {
            t: "Hold the saw, and do it fast",
            check: {s:"medicine",s2:"str",d:52},
            win: {
              r: "Strap, cut, saw, stitch, iron, in the time it takes to say a prayer. He lives. Two in three do, when it is done fast.",
              fx: {skill:{medicine:6},wil:1,fame:1},
            },
            lose: {
              r: "You are too slow, and he bleeds too much. He dies in the night. The master says it was not your fault. You do not believe him.",
              fx: {skill:{medicine:3},wil:2,happy:-6},
            },
          },
          {
            t: "Hold him down while the master cuts",
            r: "He screams and then he does not. The master is slow but sure. You learn what courage looks like from both of them.",
            fx: {skill:{medicine:3},wil:.8},
          },
        ],
      },
      {
        id: "sc_md_horn",
        cond: (p,C)=>acad(p,C,"medicine"),
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{scx(p,ctx),ctx.lady="Lady "+nm(p,"F")},
        title: "A unicorn's horn",
        text: "{lady}, rich and frightened of poison, wants a cup of unicorn horn and a student physician to vouch for it. A dealer has one for three hundred suns. You know what it really is: a whale's tusk from the cold seas.",
        choices: [
          {
            t: "Vouch for it and take a fee",
            r: "Thirty suns for your word. She drinks from it every night and feels very safe.",
            fx: {coin:30,honor:-4},
          },
          {
            t: "Tell her the truth",
            check: {s:"persuasion",s2:"etiquette",d:48},
            win: {
              r: "She is angry, then grateful, then hires you to taste her food instead. That one actually works.",
              fx: {honor:3,coin:15,newRel:{type:"friend",op:25}},
            },
            lose: {
              r: "She buys the horn anyway and tells everyone you are an ignorant boy from the country.",
              fx: {honor:2,happy:-3},
            },
          },
          {
            t: "Sell her willow bark and a good cook instead",
            check: {s:"trade",s2:"medicine",d:46},
            win: {
              r: "A cook you trust and a jar of willow bark for her headaches. She thinks you are a genius, and she is not entirely wrong.",
              fx: {coin:25,skill:{medicine:2,trade:1}},
            },
            lose: {r:"She wants a miracle, not a cook.",fx:{happy:-1}},
          },
        ],
      },
      {
        id: "sc_fa_heresy",
        cond: (p,C)=>acad(p,C,"faith","letters")&&C.adult(p),
        w: 1,
        cool: 8,
        setup: (p,ctx)=>{scx(p,ctx),ctx.trade=A.pick(["weaver","schoolmaster","ferryman","copyist","dyer"]),who(p,ctx,"acquaint","a "+ctx.trade+" tried for heresy");const h={"REL-01":["says the Temple counts the years wrong","Needle heretics are never killed: they are walled up for life in a dark cell under the Shadow Needle."],"REL-02":["says the Dawn Church was founded by a forger","In Velgrad men have been hanged for less."],"REL-07":["carved an image of the Giver","The Book forbids any image of the Giver."],"REL-10":["says one of the Thousand Names is a bandit king","The temple courts take such things very seriously."]}[p.faith]||["preaches that the gods do not hear prayers","The court of the faith will decide what that costs him."];ctx.charge=h[0],ctx.law=h[1],ctx.role=p.school&&p.school.academy==="letters"?"The law students are sent to keep the record, and you hold the pen.":"The seminarians are made to sit in the front row, and you are asked to speak."},
        title: "A heresy trial",
        text: "{themFull}, a {trade}, stands before the court of the faith because {they} {charge}. {law} {role}",
        choices: [
          {
            t: "Speak for {themHim}, or record {their} defense in full",
            check: {s:"persuasion",s2:"faith",d:55},
            win: {
              r: "You find the old text that says doubt is not denial. The sentence is penance, not the cell. {They} weeps when it is read.",
              fx: {honor:5,skill:{faith:2,persuasion:2,learning:1},them:{type:"friend",op:40},piety:-1},
            },
            lose: {
              r: "Your words change nothing, except how the masters look at you from now on.",
              fx: {honor:3,wil:1,skill:{faith:1},flag:"sc_suspect"},
            },
          },
          {
            t: "Speak against {themHim}, as the faith requires",
            r: "You speak well, and the sentence is heavy. The masters are pleased. You do not sleep easily for a while.",
            fx: {piety:4,skill:{faith:3,persuasion:1},honor:-1,them:{type:"enemy",op:-30}},
          },
          {
            t: "Keep silent, and keep an honest record",
            r: "You say nothing and write everything. Years later, someone reads your record and is grateful it exists.",
            fx: {skill:{learning:2,faith:1},honor:1},
          },
        ],
      },
      {
        id: "sc_fa_vigil",
        cond: (p,C)=>acad(p,C,"faith"),
        w: 1,
        cool: 5,
        setup: (p,ctx)=>{scx(p,ctx),ctx.vigil=p.faith==="REL-01"?"the Midwinter Vigil, when no hearth may go out before dawn":p.faith==="REL-02"?"the last night of the four Dark Weeks":p.faith==="REL-07"?"a night of washing and prayer facing the Well of Samar":p.faith==="REL-06"?"a night on the roof of the monastery under the open sky":"the long night vigil of your faith"},
        title: "The vigil",
        text: "The seminarians keep {vigil} on their knees in the cold chapel of {school}. No food, no sleep, no talking. The Rector walks the rows with a candle.",
        choices: [
          {
            t: "Keep it perfectly",
            check: {s:"wil",s2:"faith",d:48},
            win: {
              r: "Somewhere past midnight the cold stops mattering, and you are somewhere else. At dawn you are not quite the same person.",
              fx: {piety:6,wil:1.5,skill:{faith:3}},
            },
            lose: {
              r: "You fall asleep on your knees at the darkest hour, and wake with the Rector's candle in your face.",
              fx: {piety:1,wil:1,happy:-2},
            },
          },
          {
            t: "Pray for someone who needs it",
            r: "You spend the whole night on one name. Whether anyone heard, you will never know. You did.",
            fx: {piety:4,honor:1,skill:{faith:2}},
          },
        ],
      },
      {
        id: "sc_fa_sermon",
        cond: (p,C)=>acad(p,C,"faith")&&C.adult(p),
        w: 1,
        cool: 5,
        setup: (p,ctx)=>{scx(p,ctx),ctx.place=R(p,...WELL)?"by the town well":R(p,...STEPPE)?"at the horse fair":"in the market square of "+home(p)},
        title: "Your first sermon",
        text: "Each seminarian must preach once {place}, to whoever stops. Today it is you. A fishwife, two drunks, a dog and a very old woman are listening, and the Rector is watching from a doorway.",
        choices: [
          {
            t: "Preach from the scriptures",
            check: {s:"faith",s2:"persuasion",d:46},
            win: {
              r: "By the end there are forty people, and the old woman is crying. The Rector nods once.",
              fx: {skill:{faith:3,persuasion:2},piety:2,fame:1},
            },
            lose: {
              r: "The drunks heckle and the dog leaves. The fishwife stays out of pity.",
              fx: {skill:{faith:1,persuasion:1},wil:1},
            },
          },
          {
            t: "Tell them a story instead",
            check: {s:"persuasion",s2:"music",d:48},
            win: {
              r: "A story about a farmer and a flood. Everybody understands it. The Rector says it was not doctrine, and smiles.",
              fx: {skill:{persuasion:3,faith:1},fame:1},
            },
            lose: {
              r: "You lose the thread of your own story. The old woman finishes it for you, better.",
              fx: {skill:{persuasion:1},happy:-2},
            },
          },
        ],
      },
      {
        id: "sc_fa_doubt",
        cond: (p,C)=>acad(p,C,"faith","letters")&&C.literate(p),
        w: .8,
        cool: 12,
        setup: (p,ctx)=>{scx(p,ctx),ctx.doubt=p.faith==="REL-01"?"the old tax rolls: they count seven years of ash where the Temple counts six":p.faith==="REL-07"?"two copies of the Book that disagree about a single word":"an old chronicle that tells a holy story very differently"},
        title: "A doubt",
        text: "Copying in the archive, you find {doubt}. It is a small thing. Men have been walled up for small things.",
        choices: [
          {
            t: "Take it to the Rector",
            check: {s:"faith",s2:"etiquette",d:50},
            win: {
              r: "The Rector reads it, burns it, and then talks to you all night about faith that does not need the numbers to be right. You never forget that night.",
              fx: {piety:3,int:.6,skill:{faith:2},newRel:{type:"mentor",op:30,back:"student"}},
            },
            lose: {
              r: "The Rector reads it, burns it, and has you watched for a year.",
              fx: {piety:-1,wil:1,flag:"sc_suspect"},
            },
          },
          {
            t: "Copy it secretly and keep it",
            r: "It sits in the lining of your bag. You do not know what you will do with it. You do know you will not forget it.",
            fx: {int:.8,piety:-2,flag:"sc_kept_doubt"},
          },
          {
            t: "Put it back and pray",
            r: "Faith is not arithmetic. You tell yourself that until you believe it, and then you do.",
            fx: {piety:3,wil:.5},
          },
        ],
      },
      {
        id: "sc_fa_badges",
        cond: (p,C)=>acad(p,C,"faith")&&C.adult(p),
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{scx(p,ctx),classmate(p,ctx,"acquaint",!1),ctx.ware=R(p,"POL-02")?"false sun badges and forged receipts for the five-sun pilgrim fee, bought from the Brass Badge men,":"false relics, saints' knuckles from the butcher's yard,"},
        title: "Holy goods",
        text: "{themFull}, a seminarian of your year, is selling {ware} to pilgrims at the gate. {They} makes more in a week than the Rector earns in a month, and offers you a share for looking the other way.",
        choices: [
          {
            t: "Take the share",
            r: "Ten suns a week for not seeing. You are a very good not-seer.",
            fx: {coin:30,piety:-5,honor:-3,them:{type:"friend",op:15}},
          },
          {
            t: "Report {themHim}",
            r: "{They} is sent home. Several pilgrims are spared a swindle. You are not thanked by anyone in your year.",
            fx: {piety:3,honor:3,them:{type:"enemy",op:-40}},
          },
          {
            t: "Shame {themHim} into stopping",
            check: {s:"persuasion",s2:"faith",d:50},
            win: {
              r: "You talk for an hour about what pilgrims walk a thousand miles for. {They} stops, and gives the money to the poor box.",
              fx: {piety:4,honor:2,them:{type:"friend",op:25},skill:{persuasion:2}},
            },
            lose: {
              r: '{They} laughs at you. "Pilgrims want to be fooled. I am doing them a service."',
              fx: {piety:1,them:{type:"rival",op:-15}},
            },
          },
        ],
      },
      {
        id: "sc_tr_venture",
        cond: (p,C)=>acad(p,C,"trade"),
        w: 1.2,
        cool: 3,
        setup: (p,ctx)=>{scx(p,ctx),ctx.goods=R(p,...WELL)?"dates and indigo":R(p,"POL-21","POL-32","POL-30")?"pepper and cotton":R(p,"POL-25","POL-26")?"wax and squirrel pelts":R(p,...DWARF)?"nails and hinges":R(p,"POL-05","POL-01")?"wool and cheese":"wine and salt fish"},
        title: "The first venture",
        text: "Every student of {school} is given twenty suns of the Hall's money and one season. Buy, carry, sell, and bring back more than you took, or explain why. Most of your year is buying {goods}.",
        choices: [
          {
            t: "Do what everyone does, but better",
            check: {s:"trade",s2:"int",d:46},
            win: {
              r: "You buy early and sell late, and bring back thirty-eight suns. The Warden writes your name on the slate.",
              fx: {coin:18,skill:{trade:4,logistics:1}},
            },
            lose: {
              r: "Everyone sells {goods} in the same week. Prices fall. You bring back sixteen and a lesson.",
              fx: {coin:-4,skill:{trade:2},wil:.5},
            },
          },
          {
            t: "Buy what nobody else is buying",
            check: {s:"trade",s2:"ins",d:54},
            win: {
              r: "You buy rope. The fleet comes in short of rope. You bring back sixty suns and the Warden's curiosity.",
              fx: {coin:40,skill:{trade:5},fame:1},
            },
            lose: {
              r: "Nobody else is buying it for a reason. You bring back nine suns and a cart of something nobody wants.",
              fx: {coin:-11,skill:{trade:2},happy:-3},
            },
          },
          {
            t: "Lend the twenty to a trader at interest",
            check: {s:"persuasion",s2:"stewardship",d:50},
            win: {
              r: "He pays back twenty-six. You did nothing all season except choose the right man. The Warden calls it banking.",
              fx: {coin:6,skill:{stewardship:3,persuasion:1}},
            },
            lose: {
              r: "He goes bankrupt. You report to the Warden that the Hall's money is in a ditch near Tessar.",
              fx: {coin:-20,skill:{stewardship:1},wil:1},
            },
          },
        ],
      },
      {
        id: "sc_tr_ledger",
        cond: (p,C)=>acad(p,C,"trade")&&C.literate(p),
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{scx(p,ctx),ctx.firm=nm(p,"M")+" and Sons"},
        title: "The second ledger",
        text: "As an exercise, the students of {school} audit the books of a real trading house, {firm}. You find that the house keeps two ledgers, and the second one has the tolls in it that the crown never sees.",
        choices: [
          {
            t: "Report it to the Warden",
            r: "The Warden goes white, thanks you, and the exercise is quietly ended. You have learned what the Hall is really for: keeping its members out of trouble.",
            fx: {skill:{stewardship:3,trade:1},honor:2,int:.4},
          },
          {
            t: "Visit the house privately",
            check: {s:"intrigue",s2:"trade",d:52},
            win: {
              r: "The old man pours you wine and offers you a clerkship when you graduate, at twice the usual pay. Everybody understands everybody.",
              fx: {coin:30,honor:-3,flag:"sc_house_secret",newRel:{type:"friend",op:20}},
            },
            lose: {
              r: "The old man's sons walk you to the door, and one of them steps on your foot very hard.",
              fx: {health:-3,newRel:{type:"enemy",op:-25}},
            },
          },
          {
            t: "Say nothing and pass the exercise",
            r: "You audit the first ledger perfectly. The second is not your business, yet.",
            fx: {skill:{stewardship:2}},
          },
        ],
      },
      {
        id: "sc_tr_scales",
        cond: (p,C)=>acad(p,C,"trade","crafts"),
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{scx(p,ctx),ctx.where=R(p,"POL-21")?"the Pepper Hall":R(p,"POL-32")?"the Scales of Amberport":"the market of "+home(p)},
        title: "A heavy thumb",
        text: "On your day of practice at {where} you notice that a grain-dealer's weights are short, a little, every time. He sees you notice.",
        choices: [
          {
            t: "Report him to the market wardens",
            r: "He is fined and his weights are broken in the square. The other dealers watch you all day.",
            fx: {honor:3,skill:{trade:2},newRel:{type:"enemy",op:-20}},
          },
          {
            t: "Let him buy your silence",
            r: "He presses five suns into your hand, and every week after. You are a merchant now, the Warden would say. Or something else.",
            fx: {coin:15,honor:-3},
          },
          {
            t: "Learn the trick, to spot it again",
            check: {s:"trade",s2:"ins",d:44},
            win: {
              r: "Wax under the pan, a bent beam, a thumb on the cord. You will never be cheated at the scales in your life.",
              fx: {skill:{trade:4},ins:.4},
            },
            lose: {r:"You watch for a week and cannot see how he does it. He winks at you.",fx:{skill:{trade:1}}},
          },
        ],
      },
      {
        id: "sc_tr_banker",
        cond: (p,C)=>acad(p,C,"trade","letters"),
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{scx(p,ctx),ctx.who=R(p,"POL-16")?"Cosimo Lunetti, who holds the debts of sixty houses and six crowns in his head,":R(p,"POL-04")?"Giulia Bassan, who knows the grain in every Sunland port to a tenth,":R(p,...DWARF)?"a banker of the Hold Bank, who speaks only in carved figures,":"a great banker from Ostra, who lends to kings and sleeps very little,",ctx.Who=A.cap(ctx.who)},
        title: "A lecture by a banker",
        text: "{Who} comes to lecture at {school}. The hall is packed. At the end there is time for one question from the students, and {master} looks at you.",
        choices: [
          {
            t: "Ask how a banker knows a default before it happens",
            check: {s:"int",s2:"etiquette",d:50},
            win: {
              r: '"I watch what a man buys when he is frightened." Then the banker asks your name, and writes it down.',
              fx: {skill:{stewardship:3,trade:2},int:.6,fame:1,newRel:{type:"friend",op:15}},
            },
            lose: {
              r: "The banker answers politely and says nothing at all. You realize that was also the answer.",
              fx: {skill:{trade:1},int:.3},
            },
          },
          {
            t: "Ask whether lending to kings is ever wise",
            r: 'The hall laughs. The banker does not. "Never. But they are the only ones who can protect you from other kings."',
            fx: {int:.5,skill:{stewardship:2}},
          },
        ],
      },
      {
        id: "sc_tr_debt",
        cond: (p,C)=>acad(p,C,"trade")&&C.adult(p),
        w: .7,
        cool: 12,
        setup: (p,ctx)=>{scx(p,ctx),classmate(p,ctx,"friend",!1),ctx.hound=R(p,"POL-16")?"the Debt-Hounds of the Ostran banks":"the creditors' men",ctx.Hound=A.cap(ctx.hound)},
        title: "A family fails",
        text: "{themFull}'s family house has failed: ships lost, loans called. Tonight {they} comes to your room with {their} things in a sack. {Hound} are looking for every member of the family.",
        choices: [
          {
            t: "Hide {themHim}",
            r: "A week under your bed and a dawn barge out of town. {They} sends you one letter, years later, from very far away.",
            // [X1 baked patch events/33-no-obvious-choices CHOICE-SC-TR-DEBT] sc_tr_debt: hiding a debtor "a week under your
            // bed" now costs a week of fear at every knock.
            fx: {honor:4,them:{type:"bestfriend",op:50},wil:.5,happy:-3},
          },
          {
            t: "Lend {themHim} what you can",
            req: p=>p.coin>=20,
            r: "Twenty suns, which is most of what you have. {They} promises to repay it. {They} does, in the end, with interest.",
            fx: {coin:-20,them:{type:"bestfriend",op:40}},
          },
          {
            t: "Turn {themHim} away. Debt is contagious",
            r: "You close the door. The Warden would call it prudence. You will call it something else, later.",
            fx: {honor:-3,them:{type:"enemy",op:-30}},
          },
        ],
      },
      {
        id: "sc_le_moot",
        cond: (p,C)=>acad(p,C,"letters"),
        w: 1.1,
        cool: 4,
        setup: (p,ctx)=>{scx(p,ctx),ctx.case=R(p,"POL-01","POL-08","POL-05","POL-14","POL-13")?"a man who cleared himself with twelve oath-helpers, and the thirteenth witness who says they lied":R(p,...WELL)?"a dispute over water shares in a dry year":R(p,...DWARF)?"a contract sealed in poured metal that one party says was misread":"a widow whose dowry her late husband's brother has taken"},
        title: "The moot court",
        text: "The students of {school} try a mock case before the masters: {case}. You are given the side nobody wanted.",
        choices: [
          {
            t: "Argue the law",
            check: {s:"learning",s2:"persuasion",d:50},
            win: {
              r: 'You win the side nobody wanted. The masters exchange looks that mean "this one".',
              fx: {skill:{learning:3,persuasion:2},int:.5,fame:1},
            },
            lose: {
              r: "You lose, as everyone expected. You lose well, which the masters also notice.",
              fx: {skill:{learning:2,persuasion:1}},
            },
          },
          {
            t: "Argue the people",
            check: {s:"persuasion",s2:"ins",d:52},
            win: {
              r: "You make the masters feel sorry for the man with the weaker case. One of them is wiping his eyes.",
              fx: {skill:{persuasion:4}},
            },
            lose: {r:'"This is a court, not a theatre." You lose on the law.',fx:{skill:{persuasion:1},wil:.5}},
          },
          {
            t: "Find a forgotten precedent",
            check: {s:"learning",s2:"int",d:56},
            win: {
              r: "Two hundred years old, in a book nobody has opened since. You win, and the masters argue about it for a month.",
              fx: {skill:{learning:4},int:.8,fame:1},
            },
            lose: {
              r: "Your precedent was overturned a hundred years ago. A master points this out, kindly.",
              fx: {skill:{learning:2}},
            },
          },
        ],
      },
      {
        id: "sc_le_forms",
        cond: (p,C)=>acad(p,C,"letters"),
        w: 1,
        cool: 5,
        setup: (p,ctx)=>{scx(p,ctx)},
        title: "The forms of address",
        text: "The examination in forms: how to address a duke, a Well-Keeper, a War-Mother, an elf of the Moot, the Captain-General of Blackreef and the High Luminary, in writing and in person, without causing a war.",
        choices: [
          {
            t: "Learn them all by heart",
            check: {s:"etiquette",s2:"learning",d:46,bonus:p=>A.hasBlood(p,"memory")?20:0},
            win: {
              r: "Thirty-four courts, and you can greet every one of them. It will save your life one day, abroad.",
              fx: {skill:{etiquette:4,diplomacy:2}},
            },
            lose: {
              r: 'You address the War-Mother as "my lord". In the examination this is a mistake. Abroad it would be your last.',
              fx: {skill:{etiquette:2},happy:-2},
            },
          },
          {
            t: "Learn the principle, not the list",
            check: {s:"int",s2:"diplomacy",d:48},
            win: {
              r: "Respect what they respect. With that, you get most of them right and the rest charming.",
              fx: {skill:{diplomacy:3,etiquette:2},int:.4},
            },
            lose: {
              r: "Principles do not tell you whether a dwarf wants to be bowed to. (He does not.)",
              fx: {skill:{etiquette:1}},
            },
          },
        ],
      },
      {
        id: "sc_le_charter",
        cond: (p,C)=>acad(p,C,"letters")&&C.literate(p),
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{scx(p,ctx),greatHouse(p,null,ctx)},
        title: "A clause that was not there",
        text: "Copying an old charter of {house} for the archive, you notice a clause in a different ink: a mill and two villages, added perhaps fifty years later. The original, in the same chest, does not have it.",
        choices: [
          {
            t: "Report it to the Master of the College",
            r: "The Master reads both, goes pale and locks them away. A month later, a lawsuit begins that will last ten years.",
            fx: {honor:3,skill:{learning:2},int:.4,favor:2},
          },
          {
            t: "Go to the villages' lord, who lost them",
            check: {s:"intrigue",s2:"persuasion",d:52},
            win: {
              r: "He pays you a hundred suns for a copy, and a great deal of trouble begins for {house}.",
              fx: {coin:100,honor:-2,newRel:{type:"friend",op:25},skill:{intrigue:2}},
            },
            lose: {
              r: "{house} hears that a student has been asking. A large man visits your room.",
              fx: {health:-10,newRel:{type:"enemy",op:-30},cause:"a beating"},
            },
          },
          {
            t: "Copy it as it is",
            r: "Not your forgery, not your business. You write the clause in your best hand.",
            fx: {skill:{learning:1},honor:-1},
          },
        ],
      },
      {
        id: "sc_cr_piece",
        cond: (p,C)=>acad(p,C,"crafts"),
        w: 1.1,
        cool: 4,
        setup: (p,ctx)=>{scx(p,ctx),ctx.piece=R(p,...DWARF)?"a hinge that will still swing in three hundred years":R(p,"POL-05")?"a bow stave that the bowyers will draw to a hundred pounds":R(p,"POL-03","POL-04")?"a bolt of cloth with no flaw in forty ells":A.pick(["a lock with no key but yours","a chair that a fat abbot can lean back in","a kettle that does not leak"])},
        title: "The test piece",
        text: "Before the guild school will call you journeyman, you must make {piece}, alone, and show it to the masters of the guild.",
        choices: [
          {
            t: "Make it slowly and perfectly",
            check: {s:"craft",s2:"wil",d:50},
            win: {
              r: 'Six weeks, and not a flaw in it. The oldest master runs a thumb along it and says, "Yes."',
              fx: {skill:{craft:5},wil:.5,flag:"sc_testpiece"},
            },
            lose: {
              r: "A flaw in the last week, and no time to start again. The masters see it at once.",
              fx: {skill:{craft:3},wil:1,happy:-3},
            },
          },
          {
            t: "Add something of your own",
            check: {s:"craft",s2:"int",d:56},
            win: {
              r: "A small improvement nobody asked for. The masters argue about it for an hour, and then two of them copy it.",
              fx: {skill:{craft:6},int:.5,fame:1,flag:"sc_testpiece"},
            },
            lose: {
              r: '"A test piece is a test of obedience, not genius." You make it again, the guild way.',
              fx: {skill:{craft:3},happy:-2},
            },
          },
        ],
      },
      {
        id: "sc_cr_secret",
        cond: (p,C)=>acad(p,C,"crafts")&&C.adult(p),
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{scx(p,ctx),ctx.secret=R(p,"POL-03")?"how the Palella spinning wheel is built, which the law says hangs anyone who teaches it abroad":R(p,...DWARF)?"a forge-mark of the hold, which no outsider may learn":"the guild's secret of the dye-vats",ctx.foe=enemyOf(p)},
        title: "A stranger's question",
        text: "A stranger from {foe} buys you dinner three nights running, and on the third asks about {secret}. There is a purse on the table that would pay your fees for five years.",
        choices: [
          {
            t: "Sell it",
            check: {s:"deception",s2:"stealth",d:54},
            win: {
              r: "You draw it on a napkin and burn the napkin after he copies it. Five years of fees, and a secret you will carry to the grave.",
              fx: {coin:150,honor:-10,flag:"sc_sold_secret"},
            },
            lose: {
              r: "The stranger is the guild's own man, testing apprentices. You are expelled, and lucky that is all.",
              fx: (p,ctx)=>{const n=leaveSchool(p);return p.flags.sc_expelled=A.S.year,A.applyFx(p,{honor:-8,wil:1},ctx),`You are thrown out of ${n}.`},
            },
          },
          {
            t: "Report him to the guild",
            r: "The guild's men take him at the city gate. The guild master shakes your hand in front of the school.",
            fx: {honor:3,skill:{craft:2},fame:1},
          },
          {
            t: "Eat the dinner and say nothing useful",
            r: "Three good dinners, and he leaves with a recipe for porridge.",
            fx: {happy:3,skill:{deception:1}},
          },
        ],
      },
      {
        id: "sc_se_stars",
        cond: (p,C)=>acad(p,C,"sea"),
        w: 1.1,
        cool: 4,
        setup: (p,ctx)=>{scx(p,ctx)},
        title: "The star night",
        text: 'On a cloudless night the Master Pilot takes the students out of sight of land and puts out every lamp. "Bring us home." No coast, no needle, only the stars and the swell.',
        choices: [
          {
            t: "Read the stars",
            check: {s:"sea",s2:"int",d:50},
            win: {
              r: "You find the steering star and hold it, and at dawn the harbor mouth is dead ahead. The Master Pilot pretends to be asleep.",
              fx: {skill:{sea:5},int:.5},
            },
            lose: {
              r: "At dawn you are looking at a coast nobody recognizes. It takes two days to find home.",
              fx: {skill:{sea:2},wil:.8},
            },
          },
          {
            t: "Read the swell and the wind",
            check: {s:"sea",s2:"ins",d:52},
            win: {
              r: "The long swell comes from the open sea, always. Keep it on the quarter. You bring her home by feel.",
              fx: {skill:{sea:5},ins:.5},
            },
            lose: {r:"The wind turns in the night and so do you, without knowing it.",fx:{skill:{sea:2}}},
          },
        ],
      },
      {
        id: "sc_se_squall",
        cond: (p,C)=>acad(p,C,"sea"),
        w: 1,
        cool: 5,
        setup: (p,ctx)=>{scx(p,ctx)},
        title: "Squall",
        text: "The school's training cog is caught by a squall off the point, with the Master Pilot ashore and a crew of students. The sail is flogging itself to pieces and the youngest boy is frozen at the halyard.",
        choices: [
          {
            t: "Take command",
            check: {s:"command",s2:"sea",d:50,bonus:p=>A.hasBlood(p,"seasteady")?15:0},
            win: {
              r: "Your voice carries over the wind. Sail down, head to sea, everyone tied on. You bring her in at dusk with nobody lost.",
              fx: {skill:{command:3,sea:3},wil:1,fame:1},
            },
            lose: {
              r: "Nobody hears you. The boom takes a boy over the side, and you go in after him.",
              fx: {health:-12,skill:{sea:2,athletics:1},wil:1.5,honor:3,cause:"the cold sea"},
            },
          },
          {
            t: "Climb up and cut the sail free yourself",
            check: {s:"athletics",s2:"sea",d:52},
            win: {
              r: "Up the mast in the rain, knife in your teeth. The sail goes, and the cog rights herself.",
              fx: {skill:{athletics:3,sea:2},fame:1},
            },
            lose: {
              r: "The mast whips and throws you onto the deck. Someone else cuts the sail.",
              fx: {health:-10,wound:"broken_ribs",cause:"a fall from a mast"},
            },
          },
        ],
      },
      {
        id: "sc_ar_recital",
        cond: (p,C)=>acad(p,C,"arts","letters"),
        w: 1.1,
        cool: 4,
        setup: (p,ctx)=>{scx(p,ctx),greatHouse(p,null,ctx);const inst=R(p,"POL-20")?"the twenty-one-string harp":R(p,...STEPPE)?"the horse-head fiddle":R(p,...WELL)?"the reed flute":R(p,...DWARF)?"the hammer-song":"the lute";ctx.perf=p.school&&p.school.academy==="letters"?"recite the old verse":"play "+inst},
        title: "Before the great house",
        text: "{Master} sends three students to {perf} at a feast of {house}. You are the youngest, and you will go last, when the guests are drunk and the lord is bored.",
        choices: [
          {
            t: "Give them something old that everyone knows",
            check: {s:"music",s2:"etiquette",d:46},
            win: {
              r: "By the second verse the whole hall is singing, and the lord is thumping the table.",
              fx: {skill:{music:4},coin:10,fame:1},
            },
            lose: {
              r: "They know it too well. They sing it louder than you, and in a different key.",
              fx: {skill:{music:2},happy:-2},
            },
          },
          {
            t: "Give them something of your own",
            check: {s:"music",s2:"int",d:54},
            win: {
              r: "The hall goes quiet, which in a drunk hall means everything. A lady asks for the words.",
              fx: {skill:{music:5},fame:2,coin:15,newRel:{type:"friend",op:20}},
            },
            lose: {
              r: "The hall talks through it. One man asks if you know anything cheerful.",
              fx: {skill:{music:2},wil:1},
            },
          },
        ],
      },
      {
        id: "sc_ar_satire",
        cond: (p,C)=>acad(p,C,"arts","letters")&&C.adult(p),
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{scx(p,ctx),ctx.lord="Lord "+nm(p,"M")},
        title: "A song about a lord",
        text: "You wrote a song about {lord}, his debts, his horses and his wig. It was for your friends. Now the whole of {home} is singing it, and {lord} wants to know who wrote it.",
        choices: [
          {
            t: "Admit it, with a bow",
            check: {s:"persuasion",s2:"music",d:54},
            win: {
              r: "He stares, then roars with laughter and pays you to write one about his enemy.",
              fx: {coin:25,fame:2,skill:{music:2}},
            },
            lose: {
              r: "He does not laugh. His men take you to the cells for a week to think about wigs.",
              fx: {prison:1,why:"a song about a lord",fame:2},
            },
          },
          {
            t: "Let a friend take the blame",
            r: "Your friend is fined, and never quite forgives you. The song is still sung.",
            fx: {honor:-4,fame:1,newRel:{type:"rival",op:-20}},
          },
          {
            t: "Write a second verse, anonymously",
            check: {s:"music",s2:"stealth",d:50},
            win: {
              r: "The second verse is better than the first. {lord} goes to his country estate until spring.",
              fx: {fame:2,skill:{music:3},happy:4},
            },
            lose: {r:"Your handwriting gives you away.",fx:{prison:1,why:"a song about a lord",fame:1}},
          },
        ],
      },
      {
        id: "sc_gr_classmates",
        cond: (p,C)=>C.adult(p)&&C.diploma(p)&&!C.atSchool(p),
        w: .7,
        cool: 12,
        setup: (p,ctx)=>{const q=who(p,ctx,"friend","an old classmate of yours");greatHouse(p,q,ctx),ctx.now=A.pick(["a captain of the border fort","a judge in the provinces","secretary to a great lord","a merchant with three ships","a prior with ambitions"])},
        title: "An old classmate",
        text: '{themFull}, who shared a bench with you at the college, is {now} these days. {They} writes: "Come and dine. I may have something for you, and you may have something for me."',
        choices: [
          {
            t: "Go and dine",
            r: "Old jokes, old names, and over the cheese a favor asked and a favor offered. That is what colleges are for.",
            fx: {them:{type:"friend",op:30},coin:20,skill:{diplomacy:1}},
          },
          {
            t: "Ask {themHim} for a place",
            check: {s:"persuasion",s2:"etiquette",d:48},
            win: {
              r: "{They} finds you a place, or a commission, or a word in the right ear. Old benches are strong.",
              fx: {them:{type:"friend",op:20},favor:3,coin:40},
            },
            lose: {
              r: "{They} smiles and changes the subject. Some old benches are rotten.",
              fx: {them:{type:"acquaint",op:-5}},
            },
          },
          {
            t: "Decline. You have outgrown all that",
            r: "You send a polite note. Later you hear that half your year was there.",
            fx: {happy:-1},
          },
        ],
      },
      {
        id: "sc_gr_mark",
        cond: (p,C)=>C.adult(p)&&!C.atSchool(p)&&(C.flag(p,"sc_graduated")||C.flag(p,"chain")||Object.keys(p.flags).some(k=>k.indexOf("grad_")===0)),
        w: .8,
        cool: 12,
        setup: (p,ctx)=>{who(p,ctx,"acquaint","a stranger at an inn")},
        title: "Your first move",
        text: 'At an inn on the road, a stranger watches you deal with a drunk who has a knife. Afterwards {they} sits down across from you. "I know that first move. I learned the same one, thirty years ago, from the same school."',
        choices: [
          {
            t: "Drink to the old school",
            r: "Names of masters, names of bruises, a song you both half remember. Strangers from the same chain are never quite strangers.",
            fx: {them:{type:"friend",op:35},happy:4,styleXp:6},
          },
          {
            t: "Ask {themHim} to show you what the school taught later",
            check: {s:"ins",s2:"int",d:46},
            win: {
              r: "In the inn yard, by lantern-light, {they} shows you a move the school added after you left.",
              fx: (p,ctx)=>{const st=Object.keys(p.styles||{})[0];return st&&A.styleXp(p,st,15),F(p,ctx,{them:{type:"friend",op:25},ins:.5})},
            },
            lose: {
              r: "{They} shows you, and you do not see it. Age, or wine, or both.",
              fx: {them:{type:"friend",op:15}},
            },
          },
        ],
      },
    ]);
  })();
})();
