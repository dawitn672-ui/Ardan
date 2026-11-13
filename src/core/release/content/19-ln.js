// The release's event pack 19 of 30 (167 events, mostly ln_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-027). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  (function(){
    const J = (p,...ks)=>!!(p&&p.job&&ks.includes(p.job.c)),
      rk = p=>p&&p.job?p.job.r:-1,
      cl = v=>A.clamp(v,0,100),
      RM = p=>A.realm(p.realm),
      capOf = p=>{const r=RM(p);return r&&r.capital?r.capital:"the capital"},
      lawOf = p=>A.lawOf?A.lawOf(p.realm):"other",
      rankName = p=>{const j=p.job,C=j&&GD.CAREERS[j.c];return C&&C.ranks[j.r]?C.ranks[j.r][0]:"clerk"},
      lit = p=>!!p.literate,
      has = (p,t)=>A.has(p,t),
      speaks = (p,l)=>!!(l&&p.langs&&p.langs.includes(l)),
      fee = (p,f,min)=>{const j=p.job,C=j&&GD.CAREERS[j.c],base=C&&C.ranks[j.r]?C.ranks[j.r][2]:60;return Math.max(min||3,Math.round(Math.max(base,30)*f*A.rf(.85,1.15)))},
      setFee = (p,ctx,f,min)=>(ctx.fee=fee(p,f,min),ctx.pay=A.coin(ctx.fee),ctx.fee),
      fx = o=>(p,ctx)=>A.applyFx(p,o,ctx||{})||"",
      both = (...fs)=>(p,ctx)=>fs.map(f=>typeof f=="function"?f(p,ctx||{}):A.applyFx(p,f,ctx||{})).filter(x=>typeof x=="string"&&x).join(" "),
      earn = (m,extra)=>(p,ctx)=>{ctx=ctx||{};const n=Math.round((ctx.fee||fee(p,.12))*(m??1));n>0&&(p.coin+=n);const t=extra?typeof extra=="function"?extra(p,ctx):A.applyFx(p,extra,ctx):"";return[n>0?`(+${A.coin(n)})`:"",t||""].filter(Boolean).join(" ")},
      spend = (m,extra)=>(p,ctx)=>{ctx=ctx||{};const n=Math.min(p.coin,Math.round((ctx.fee||fee(p,.12))*(m??1)));p.coin=Math.max(0,p.coin-n);const t=extra?typeof extra=="function"?extra(p,ctx):A.applyFx(p,extra,ctx):"";return[n>0?`(−${A.coin(n)})`:"",t||""].filter(Boolean).join(" ")},
      up = extra=>(p,ctx)=>{let s="";const j=p.job,C=j&&GD.CAREERS[j.c];C&&C.ranks[j.r+1]&&(j.r++,j.y=Math.max(j.y||0,C.ranks[j.r][1]),A.addRep(p,3),s=`(You are now ${C.ranks[j.r][0]}.)`,A.log(`Promoted: you are now ${C.ranks[j.r][0]}.`,"good"),j.c==="clergy"&&!C.ranks[j.r+1]&&A.ach("patriarch"));const t=extra?typeof extra=="function"?extra(p,ctx||{}):A.applyFx(p,extra,ctx||{}):"";return[s,t||""].filter(Boolean).join(" ")},
      T = ctx=>ctx&&ctx.pid?A.P(ctx.pid):null,
      kill = cause=>(p,ctx)=>{const t=T(ctx);return t&&t.alive&&!t.ruler&&t.id!==p.id&&A.kill(t,cause||"a fever",!0),""},
      // [X1 baked patch events/99999-v2-content V2C-FX-PARTS] The soldier packs build 227 choices as both({ honor: 2,
      // ... }, op2(-30)): a closure whose source shows only "applyFx(p, obj, ctx)", so the card could read none of what
      // they do (playtest 2, old 18 and 19: "It will be remembered", "• changes regard" naming nobody). The closures now
      // carry their parts (A.V2C.parts: f.v2parts, and op2's regard and messmate as f.v2meta), which the chips read as
      // written. Nothing they do changes. In the source: write these effects as data, or give the helpers a way to say
      // what they hold.
      rel = d=>(A.V2C&&A.V2C.parts||(f=>f))((p,ctx)=>(ctx&&ctx.destId&&A.realm(ctx.destId)&&ctx.destId!==p.realm&&A.addRel(p.realm,ctx.destId,d),""),null,{rel:d}),
      tre = n=>p=>{const r=RM(p);return r&&(r.treasury+=n),""},
      hop = (ctx,d)=>{const h=ctx&&ctx.hid&&A.S.houses?A.S.houses[ctx.hid]:null;h&&(h.op=cl((h.op!=null?h.op:50)+d))},
      hp = d=>(p,ctx)=>(hop(ctx,d),""),
      deed = str=>(p,ctx)=>(p.deeds.push({y:A.S.year,t:A.T(str,A.ctxTokens(p,ctx||{}))}),""),
      flag = k=>p=>(p.flags[k]=A.S.year,""),
      learnLang = (p,ctx)=>{const l=ctx&&ctx.destLang;return!l||!GD.LANG_LIST.includes(l)||speaks(p,l)?"":(p.langs.push(l),p.langs.length>=4&&A.ach("polyglot"),`(You learn ${l}.)`)},
      mk = (p,occ,o)=>{o=o||{};const t=A.makeAcquaintance(p,"acquaint");return o.sex&&t.sex!==o.sex&&(t.sex=o.sex,t.given=A.givenName(t.cult,o.sex)),o.status&&(t.status=o.status),o.ageAdj&&(t.born=A.S.year-Math.max(1,Math.round(o.ageAdj*GD.RACES[t.race].adult/16))),occ&&(t.occ=occ),t},
      who = (p,ctx,occ,o)=>{const t=mk(p,occ,o);return ctx.pid=t.id,t},
      LORDLY = ["noble","gentry_mil","gentry","military"],
      pickHouse = (p,ctx,rid,kinds)=>{const id=rid||p.realm,all=Object.values(A.S.houses||{}).filter(h2=>h2.realm===id&&!h2.extinct&&h2.id!==p.house&&(kinds||LORDLY).includes(h2.kind)),h=all.length?A.pick(all):null;return ctx.hid=h?h.id:"",ctx.house=h?h.name.replace(/^The /,"the "):"a great house of "+A.realmShort(id),ctx.House=A.cap(ctx.house),ctx.seat=h&&h.seat?h.seat:A.provName(p.home),h},
      lordOf = (p,ctx,occ)=>{const h=pickHouse(p,ctx);let t=h&&A.houseHead?A.houseHead(h.id):null;return(!t||!t.alive||t.id===p.id||t.ruler)&&(t=mk(p,occ||"a lord",{status:"noble"})),ctx.pid=t.id,ctx.lord=A.fullName(t),t},
      royalChild = (p,ctx)=>{const r=RM(p),ru=r?A.P(r.ruler):null,kids=ru?(ru.children||[]).map(A.P).filter(k2=>k2&&k2.alive&&!A.isAdult(k2)&&A.age(k2)>=6):[],k=kids.length?A.pick(kids):mk(p,"a child of the royal blood",{status:"royal",ageAdj:A.ri(8,13)});return ctx.pid=k.id,ctx.prince=k.sex==="F"?"princess":"prince",k},
      courts = p=>Object.values(A.S.realms).filter(r=>r.alive&&r.id!==p.realm&&!r.isRebel&&r.ruler&&A.P(r.ruler)),
      setDest = (p,ctx,pref)=>{const l=courts(p),me=RM(p);if(!l.length)return ctx.destId="",ctx.dest="a far court",ctx.destFull="a far realm",ctx.destCap="a far capital",ctx.destRuler="a foreign sovereign",ctx.destLang="",null;let pool=l;const near=me?l.filter(r2=>me.rivals.includes(r2.id)||me.allies.includes(r2.id)):[];if(pref==="rival"){const rv=l.filter(r2=>me&&me.rivals.includes(r2.id)||A.relBetween(p.realm,r2.id)<-20);rv.length&&(pool=rv)}else if(pref==="friendly"){const fr=l.filter(r2=>A.relBetween(p.realm,r2.id)>-25&&!(me&&me.rivals.includes(r2.id)));fr.length&&(pool=fr)}else near.length&&A.chance(.7)&&(pool=near);const r=A.pick(pool);ctx.destId=r.id,ctx.dest=/^(Amber Isles|Sand Clans|Nine Winds|Tusk Clans|Spice Coast|Free Marches)$/.test(r.short)?"the "+r.short:r.short,ctx.destFull=r.name,ctx.destCap=r.capital||r.short;const ru=A.P(r.ruler);return ctx.destRuler=ru?A.rulerStyle(ru,r):"its sovereign",ctx.destLang=GD.LANG[GD.REALM_CULTURE[r.id]]||"",ctx.destLaw=A.lawOf?A.lawOf(r.id):"other",r},
      setForeignTongue = (p,ctx)=>{for(let i=0;i<8;i++)if(setDest(p,ctx),ctx.destLang&&GD.LANG_LIST.includes(ctx.destLang)&&!speaks(p,ctx.destLang))return;ctx.destLang=speaks(p,"Old Solen")&&GD.LANG_LIST.find(l=>!speaks(p,l))||"Old Solen"},
      leadWar = p=>A.atWar(p.realm).find(w=>(w.leadA===p.realm||w.leadD===p.realm)&&w.cb!=="throne"&&A.realm(w.leadA===p.realm?w.leadD:w.leadA)&&A.realm(w.leadA===p.realm?w.leadD:w.leadA).alive),
      LAWNAME = {
        "POL-01": "the oath law of the Seven Halls",
        "POL-02": "the Solen Code",
        "POL-03": "the Solen Code and the Lion Laws",
        "POL-04": "the sea-partnership law of 726",
        "POL-05": "the king's law of Ashmere",
        "POL-06": "the law of the Moot of Leaves",
        "POL-07": "the law of the Grey Veil",
        "POL-08": "the spoken law of the Thing",
        "POL-09": "the chanted hall law",
        "POL-10": "the carved Deep Law",
        "POL-11": "the Law of the Grass",
        "POL-12": "the Saddle Law",
        "POL-13": "the Charter of 336",
        "POL-14": "the Channel Law",
        "POL-15": "the Solen Code and the Falcone Edicts",
        "POL-16": "the Law Merchant",
        "POL-17": "the Book of Wells",
        "POL-18": "the flood law",
        "POL-19": "clan law and the Book of Wells",
        "POL-20": "the governors' custom",
        "POL-21": "the merchant law of the council",
        "POL-22": "the custom of the two courts",
        "POL-23": "the law of the Thing",
        "POL-24": "the Book of Wells",
        "POL-25": "the Code of Radoslav",
        "POL-26": "Ludmila's Code",
        "POL-27": "the monastic law of the Stair",
        "POL-28": "the carved Deep Law",
        "POL-29": "the carved Deep Law",
        "POL-30": "the royal and temple law",
        "POL-31": "the Solen Code",
        "POL-32": "the Book of Wells",
        "POL-33": "the Articles",
        "POL-34": "the Law of the Grass",
      },
      codeOf = p=>LAWNAME[p.realm]||"the old custom",
      JUDGE = {
        sun: "the lord's justice",
        north: "the lord's court",
        east: "the lord and his priest",
        well: "the Well-Keeper",
        deep: "the Law-Carvers",
        orc: "the clan-mothers at the fire",
        elf: "the grove elders",
        pirate: "the Captains' Table",
        other: "the governor's court",
      },
      judgeOf = p=>JUDGE[lawOf(p)]||JUDGE.other,
      TRIAL = {
        sun: "Evidence is heard at noon, when a lie is a sin; two witnesses outweigh one, and a priest outweighs a peasant.",
        north: "A man of good name clears himself with twelve oath-helpers who swear on the iron ring.",
        east: "The lord judges by the written Code, with a priest at his elbow.",
        well: "Two washed witnesses face toward the Well and swear before the Well-Keeper.",
        deep: "The carved contract and the weigh-book speak louder than any mouth.",
        orc: "The clan-mothers hear it at the fire, where no one present may be harmed.",
        elf: "The grove elders hear it under the trees, and they are in no hurry at all.",
        pirate: "The Captains' Table hears it, and the quartermaster's share-book is the only witness that matters.",
        other: "The court hears oaths and witnesses and judges by old custom.",
      },
      trialOf = p=>TRIAL[lawOf(p)]||TRIAL.other,
      BLOOD = {
        "POL-01": "two hundred marks for a knight, less down the ranks, and a serf's price paid to his lord",
        "POL-08": "a blood-price, or outlawry for the killer if it goes unpaid",
        "POL-13": "a blood-price, or the dead man's kin answer for themselves",
        "POL-25": "sixty sables for a free man",
        "POL-11": "fifty to a hundred horses",
        "POL-34": "fifty to a hundred horses",
        "POL-10": "metal, weighed out by the Law-Carvers",
        "POL-28": "metal, weighed out by the Law-Carvers",
        "POL-20": "cattle, as the governor sets",
        "POL-22": "cattle, as the lord sets",
        "POL-06": "years of labor given to the grove",
        "POL-07": "ship-shares",
        "POL-23": "ivory and meat",
      },
      DEBTPEN = {
        "POL-16": "the Debtors' Tower",
        "POL-25": "the toll galleys",
        "POL-26": "the Dobin whaling boats",
        "POL-30": "the temple fields until it is paid",
        "POL-18": "seven years of debt-slavery",
        "POL-28": "the Debtors' Wall, where his name will stay for three hundred years",
        "POL-08": "a year and a day of bound work",
        "POL-32": "seven years of bound labor",
        "POL-15": "the Temple court",
      },
      debtPen = p=>DEBTPEN[p.realm]||"the cells under the town gate",
      LENDER = {
        "POL-01": "the Hold Bank of Stonehold",
        "POL-16": "House Lunetti of Ostra",
        "POL-03": "the bankers of Ostra",
        "POL-30": "the Great Temple, at twelve in a hundred",
        "POL-17": "a merchant house that calls its interest a fee",
        "POL-24": "a merchant house that calls its interest a fee",
        "POL-25": "the bankers of Ostra",
        "POL-31": "two banks at once, one for each crown",
      },
      lenderOf = p=>LENDER[p.realm]||A.pick(["the Hold Bank of Stonehold","House Lunetti of Ostra","a moneylender of "+capOf(p)]),
      FW = {
        "REL-01": {
          priest: "dawnkeeper",
          prior: "prior",
          bishop: "Luminary",
          head: "High Luminary",
          see: "see",
          heretic: "Needle Heretic",
          heresy: "that the year count of the Needle is wrong",
          pen: "A Needle Heretic is walled up for life in a dark cell under the Shadow Needle; heretics are never killed.",
          tithe: "a tenth of every harvest",
        },
        "REL-02": {
          priest: "priest",
          prior: "abbot",
          bishop: "Lesser Patriarch",
          head: "Patriarch of Dawn",
          see: "patriarchate",
          heretic: "Temple-minded preacher",
          heresy: "that the Light is the sun itself, as Solenne says, and that the liturgy belongs in Old Solen",
          pen: "The church sends such men to an island monastery and forgets them.",
          tithe: "a tithe paid partly in furs and wax",
        },
        "REL-03": {
          priest: "hall-priest",
          prior: "Keeper of a great hall",
          bishop: "High Hall-Keeper",
          head: "",
          see: "great hall",
          heretic: "Free Hall preacher",
          heresy: "that no emperor may name the priests of the Halls",
          pen: "A priest who breaks his oath on the iron ring is an oath-breaker, and oath-breakers are outlawed.",
          tithe: "the gods' tenth of war spoils and the hall-land rents",
        },
        "REL-04": {
          priest: "Grove Keeper",
          prior: "Eldest Keeper of a grove",
          bishop: "Eldest Keeper",
          head: "",
          see: "grove",
          heretic: "Sea Covenant teacher",
          heresy: "that a ship may be cut from a living oak",
          pen: "The Moot can exile a Keeper from the forest for a century.",
          tithe: "gifts of honey, wax and furs",
        },
        "REL-05": {
          priest: "Law-Carver",
          prior: "Master Carver",
          bishop: "Eldest Carver",
          head: "",
          see: "hold",
          heretic: "Open Forge talker",
          heresy: "that forge secrets belong to whoever pays",
          pen: "A name can be ground out of the ancestor vaults.",
          tithe: "a tithe in metal from every forge",
        },
        "REL-06": {
          priest: "monk",
          prior: "master of a hall",
          bishop: "abbot",
          head: "Abbot of the White Stair",
          see: "monastery",
          heretic: "Red Stair monk",
          heresy: "that the Red Stair's claimant is the true abbot, and the great dragons are sky-kings",
          pen: "Grave offenders walk the 280 km circuit of Lake Bluespire in penance.",
          tithe: "butter, salt and yak",
        },
        "REL-07": {
          priest: "Well-Keeper",
          prior: "Keeper of a great well",
          bishop: "Chief Well-Keeper",
          head: "Keeper of the First Well",
          see: "province",
          heretic: "Rider preacher",
          heresy: "that the towns betrayed Hazir and only the desert keeps the Path",
          pen: "The Book has hard words for those who split the Path.",
          tithe: "the water-tax",
        },
        "REL-08": {
          priest: "flood-priest",
          prior: "Keeper of the Stairs",
          bishop: "High Flood-Priest",
          head: "",
          see: "nome",
          heretic: "river preacher",
          heresy: "that the king is a man and not the Mother's son",
          pen: "The temple has long memories and deep stores.",
          tithe: "the flood-tax read off the Stairs",
        },
        "REL-09": {
          priest: "Rememberer",
          prior: "Chief Rememberer",
          bishop: "High Rememberer",
          head: "",
          see: "land",
          heretic: "half-hearted teacher",
          heresy: "that the dead need no names spoken for them",
          pen: "A Rememberer who sings false is never asked to sing again.",
          tithe: "gold offerings at the ancestor houses",
        },
        "REL-10": {
          priest: "temple priest",
          prior: "head of a temple family",
          bishop: "High Priest",
          head: "",
          see: "temple",
          heretic: "One Face preacher",
          heresy: "that the thousand gods are only one god",
          pen: "The temple courts judge faith and temple land.",
          tithe: "temple-field rents",
        },
        "REL-11": {
          priest: "shaman",
          prior: "drum-master",
          bishop: "Chief Shaman",
          head: "Eldest Grey Mother",
          see: "drum lodge",
          heretic: "Storm-son preacher",
          heresy: "that a living chief is the Storm-Father's son",
          pen: "The Grey Mothers decide, and their word is law.",
          tithe: "gifts of horses and herds",
        },
        "REL-14": {
          priest: "shaman",
          prior: "elder shaman",
          bishop: "chief shaman",
          head: "",
          see: "tribe",
          heretic: "Well convert",
          heresy: "that the sky is not the highest power",
          pen: "The khan's shamans deal with such things themselves.",
          tithe: "milk and horses",
        },
      },
      FW0 = {
        priest: "priest",
        prior: "prior",
        bishop: "bishop",
        head: "",
        see: "see",
        heretic: "wandering preacher",
        heresy: "that the priests are thieves and the poor need no priest",
        pen: "The faith has its own ways with those who split it.",
        tithe: "the tithe",
      },
      fw = p=>FW[p.faith]||FW0,
      godOf = p=>A.godWord(p),
      BURY = {
        "REL-01": "buried at dawn facing east, so the soul rises into the next noon sun — never burned",
        "REL-02": "washed, dressed in white linen and buried facing east before the third sunrise",
        "REL-03": "laid in a mound with sword and ring, while the village drinks the grave-ale to his name",
        "REL-04": "buried under a sapling, so his life passes into the tree",
        "REL-05": "laid in the rock vaults with his tools, to join the Ancestors' Hall",
        "REL-06": "given to the sky on the high platforms, with butter lamps burning",
        "REL-07": "washed, wrapped in linen and buried within the day, facing the Well of Samar",
        "REL-08": "dried forty days in natron and wrapped, to sail the Night River",
        "REL-09": "buried under the floor of his house, so the ancestors keep him near",
        "REL-10": "burned on the river bank, his ashes given to the river",
        "REL-11": "laid on a high platform on the hill, with his best horse",
        "REL-12": "given to the sea, to go down under the ice to the Mother",
        "REL-14": "burned, so he rides into the sky on the smoke",
      },
      buryOf = p=>BURY[p.faith]||"buried with the rites of his faith",
      SONGS = [
        {
          t: "The Lay of Hartgate",
          r: ["POL-01"],
          lie: "the Iron King stood in the front rank behind the stakes",
          truth: "three thousand hired crossbowmen did most of the killing while Conrad stayed behind the wagons",
        },
        {
          t: "The Miracle of Morhaven",
          r: ["POL-15"],
          lie: "the noon sun struck the Khan's besiegers with fever",
          truth: "King Tancred paid men to throw carcasses into the stream above the Khan's camp",
        },
        {
          t: "The Lay of the Winter Crossing",
          r: ["POL-08"],
          lie: "eight hundred went over the ice and none knew fear",
          truth: "sixty drowned through a crack on the way home, and thirty carters and grooms burned in a barred barn",
        },
        {
          t: "Elsbeth's Night March",
          r: ["POL-05"],
          lie: "the Wakeful Queen's army never needed sleep",
          truth: "her men were dead on their feet, and she lost nine hundred in an ambush when she chased too far",
        },
        {
          t: "Dragon Night",
          r: ["POL-33"],
          lie: "a fire-dragon rose from the strait at Mag Brine's call",
          truth: "Mag Brine burned Sabran fire-oil on hulks and rafts under sulfur smoke",
        },
        {
          t: "The Thunder Horse",
          r: ["POL-11","POL-34"],
          lie: "Gorath rode the Storm-Father's horse across the sky",
          truth: "his kin drove wild horses past the Drum Stones, and the masked shaman was paid two hundred horses",
        },
        {
          t: "The Unpoisoned",
          r: ["POL-30"],
          lie: "the Raja survived seven poisonings by the gods' favor",
          truth: "three of the later poisonings were staged by his own ministers",
        },
        {
          t: "The Diver and the Chain",
          r: ["POL-14"],
          lie: "Osric cut the Khan's harbor chain alone with a dwarf-steel knife",
          truth: "five divers loosened the anchor stones, and a secret treaty then sold the Khan his crossing",
        },
        {
          t: "The Forty Silent Days",
          r: ["POL-12"],
          lie: "Khan Ulagan died in peace and the sky chose Berek",
          truth: "Saran hid the dead Khan in ice for forty days and stole the succession",
        },
        {
          t: "The Runner Who Never Tires",
          r: ["POL-20"],
          lie: "the old king crowned Mosi because he outran every man",
          truth: "Mosi's runners told the army of the king's illness first, and three thousand spears stood at the palace",
        },
        {
          t: "Durek's Road",
          r: ["POL-10","POL-28","POL-29"],
          lie: "a dragon fell on Durek's pack-train without warning",
          truth: "Durek's party had stolen two of its eggs, and panicked mules dragged most of the forty-one off the ledge",
        },
        {
          t: "The Noon of the Return",
          r: ["POL-02","POL-03","POL-04","POL-16","POL-31"],
          lie: "seven years of ash ended when Corvan raised his hand",
          truth: "the bad summers ran six years, and Corvan won his crown in famine wars fought under a clear sky",
        },
      ],
      songFor = p=>{const own=SONGS.filter(s=>s.r.includes(p.realm));return own.length&&A.chance(.75)?A.pick(own):A.pick(SONGS)},
      instr = p=>({north:"fiddle",sun:"lute",east:"psaltery",well:"reed flute",deep:"hammer-drum",orc:"drum",elf:"harp",pirate:"drum"})[lawOf(p)]||(C2r(p,"POL-12")?"horse-head fiddle":"harp"),
      C2r = (p,...r)=>r.includes(p.realm),
      SUN = ["POL-02","POL-03","POL-04","POL-15","POL-16","POL-31"],
      WELL = ["POL-17","POL-19","POL-24","POL-32"],
      ANCESTOR = ["POL-20","POL-21","POL-22"],
      COMMON = ["slave","serf","peasant","artisan","merchant"],
      gentle = p=>["gentry","noble","royal"].includes(p.status),
      dear = p=>p.sex==="F"?"mistress":"master",
      O = (careers,e)=>{const extra=e.cond;return Object.assign({time:1,cool:4},e,{trigger:!0,opp:careers,cond:(p,C)=>(e.young?C.ageAdj(p)>=10:C.adult(p))&&J(p,...careers)&&(!extra||!!extra(p,C))})},
      // [X1 baked patch events/97-first-life-fixes LF-TIER-GATES] Scenes written for a commoner or a private reached the
      // top of the ladder: a queen was told to "Flee to the woods" and "Turn him in for the bounty" (the home-front war
      // scenes), danced at Harvest Home to be married off by the village, and kept a scribe's duties ("it is only a
      // job"); a General of 62 leading 12,800 was asked "You. Name?" by a passing captain; a carpenter of 68 was offered
      // the dead captain's ring and a sellsword's contract. A reigning ruler or a general (A.lfTop, h-words.core.js) no
      // longer draws the home-front, harvest-dance or learned-duty scenes; the rank-and-file camp scenes stop at rank 3;
      // the mercenary scenes stop at 55 (human years) and the road offers at 60. The guards are helpers, not
      // C.ruler/p.mil in the cond text, so A.evAudience classes the scenes as before.
      D = (careers,e,broad)=>{const extra=e.cond;return Object.assign({cool:6},e,{cond:(p,C)=>C.adult(p)&&!(A.lfTop&&A.lfTop(p))&&(J(p,...careers)||!!broad&&!!broad(p,C))&&(!extra||!!extra(p,C))})};
    A.defEvents([
      O(["lawyer"], {
        id: "ln_law_first_plea",
        maxRank: 0,
        w: 1.3,
        title: "Your first plea",
        setup: (p,ctx)=>{ctx.judge=judgeOf(p),setFee(p,ctx,.12),ctx.charge=A.pick(["selling a lame horse as sound","moving a hedge two paces into his neighbor's field","short-weighting the town's bread","striking a bailiff in the market"])},
        text: "The advocate you clerk for is drunk again, and his case is called before {judge}: a carter accused of {charge}. The bench looks over the advocate's empty bench at you. You have read every paper in the bag twice.",
        choices: [
          {
            t: "Stand up and plead it",
            check: {s:"learning",s2:"persuasion",d:45},
            win: {
              r: "You plead it plainly and without a stammer. The carter walks out free, and the bench asks your name.",
              fx: up(both(earn(1),{rep:5,skill:{persuasion:2},int:.5})),
            },
            lose: {
              r: "You lose the thread halfway through. The bench is kind about it, which is worse.",
              fx: {rep:-2,wil:1,skill:{persuasion:1}},
            },
          },
          {
            t: "Ask for an adjournment",
            r: "The bench grants a week. Your master sobers up, wins the case, and takes the credit.",
            fx: {rep:1,skill:{learning:1}},
          },
          {
            t: "Plead it, and quietly lose the worst witness",
            check: {s:"deception",s2:"intrigue",d:50},
            win: {
              r: "The witness never finds the hall. You win, and you learn something about yourself.",
              fx: up(both(earn(1.5),{rep:4,honor:-3})),
            },
            lose: {
              r: "The witness arrives late and loud, and tells the bench who sent him the wrong way.",
              fx: {rep:-6,honor:-4},
            },
          },
        ],
      }),
      O(["lawyer","scribe"], {
        id: "ln_law_will",
        maxRank: 2,
        w: 1.2,
        title: "A will to draw",
        setup: (p,ctx)=>{who(p,ctx,"a dying tanner",{sex:"M",ageAdj:62}),setFee(p,ctx,.1),ctx.note=lawOf(p)==="deep"?"Here a will is no will until it is carved before the Law-Carvers.":lawOf(p)==="well"?"Two washed witnesses must hear it, facing the Well.":lawOf(p)==="north"?"Few in the North write wills; the law gives the land to the eldest son. He wants it written anyway.":"Only the propertied make wills, and he has property."},
        text: "Old {them} is dying above his tannery and wants his will made. The son wants the shop, the second wife wants her widow's third, and the daughter wants nothing and will get it. {note}",
        choices: [
          {
            t: "Write it as he says, word for word",
            check: {s:"learning",s2:"int",d:40},
            win: {
              r: "Clean, witnessed, sealed. Nobody can break it, and the whole family hates you equally.",
              fx: earn(1,{rep:3,skill:{learning:2}}),
            },
            lose: {
              r: "You miss a witness mark. A year later the family is in court over it, and your name comes up often.",
              fx: earn(1,{rep:-3}),
            },
          },
          {
            t: "Steer him toward the son, who pays you on the side",
            check: {s:"deception",s2:"persuasion",d:50},
            win: {
              r: "A little word here, a doubt there. The son gets the shop and slips you a purse.",
              fx: earn(2.2,{honor:-4,rep:1}),
            },
            lose: {
              r: "The widow is listening at the door. Half the street hears her opinion of you.",
              fx: earn(1,{rep:-6,honor:-5,newRel:{type:"enemy",op:-30}}),
            },
          },
          {
            t: "Make sure the widow's third is written plain",
            r: "She brings you eggs every Sunday after, and her cousins bring you their quarrels.",
            fx: earn(1,{honor:3,rep:2,newRel:{type:"friend",op:30}}),
          },
        ],
      }),
      O(["lawyer"], {
        id: "ln_law_will_break",
        minRank: 1,
        w: 1.2,
        title: "A will to break",
        setup: (p,ctx)=>{who(p,ctx,"a new widow",{sex:"F"}),setFee(p,ctx,.15),ctx.trial=trialOf(p)},
        text: "{them} buried her husband at {season}'s end. His will leaves the house to his brother, and her to the brother's charity. She wants it broken and offers you {pay} from her dowry. {trial}",
        choices: [
          {
            t: "Find the flaw in the seals",
            check: {s:"learning",s2:"int",d:50},
            win: {
              r: "The second witness signed the day after the death. The will falls, and the widow keeps her roof.",
              fx: earn(1,{rep:5,honor:2,them:{type:"friend",op:30}}),
            },
            lose: {
              r: "The will is sound. You lose, and she pays you anyway, in tears.",
              fx: {rep:-2,them:{type:"friend",op:10}},
            },
          },
          {
            t: "Bring witnesses that he was not in his right mind",
            check: {s:"deception",s2:"persuasion",d:55},
            win: {
              r: "His barber swears the dead man talked to his geese. The will is set aside.",
              fx: earn(1.4,{rep:4,honor:-3}),
            },
            lose: {
              r: "The brother's priest swears the man was clear as noon. The bench fines you for wasting its day.",
              fx: {rep:-5,honor:-3,coin:-5},
            },
          },
          {
            t: "Broker a bargain with the brother",
            check: {s:"diplomacy",s2:"persuasion",d:45},
            win: {
              r: "He takes the shop; she keeps the house and a third of the rents. Both sides pay you.",
              fx: earn(1.3,{rep:3,skill:{diplomacy:2}}),
            },
            lose: {r:"The brother laughs and says he will see her in the street by Midwinter.",fx:{rep:-1}},
          },
        ],
      }),
      O(["lawyer"], {
        id: "ln_law_bloodprice",
        minRank: 1,
        w: 1.3,
        cool: 5,
        title: "The price of a life",
        cond: p=>!!BLOOD[p.realm],
        setup: (p,ctx)=>{ctx.price=BLOOD[p.realm],ctx.code=codeOf(p),ctx.where=A.pick(["a wedding","the horse fair","a boundary quarrel","the alehouse after the Thing","a dice game"]),setFee(p,ctx,.2)},
        text: "A man of one kin killed a man of another at {where}. By {code} a death is paid: {price}. The killer's kin hire you to bring the price down. The dead man's kin are sharpening knives and counting cousins.",
        choices: [
          {
            t: "Argue the dead man's standing down",
            check: {s:"learning",s2:"persuasion",d:50},
            win: {
              r: "He was a tenant, not a freeholder; you prove it from the rent-roll. The court sets the lower price, and the dead man's kin give you a long look.",
              fx: earn(1.5,{rep:6,skill:{learning:2},newRel:{type:"enemy",op:-20}}),
            },
            lose: {r:"The court sets the full price and adds your fee to the shame.",fx:{rep:-4}},
          },
          {
            t: "Broker a marriage between the two kins instead",
            check: {s:"diplomacy",s2:"int",d:55},
            win: {
              r: "A daughter for a son. The feud ends at a wedding, and both kins drink to you until dawn.",
              fx: earn(1,{rep:8,fame:2,honor:3,skill:{diplomacy:3}}),
            },
            lose: {
              r: "The bride's brothers come to the betrothal armed. The talks end in blood and you run for the door.",
              fx: {health:-8,cause:"a feud",rep:-4,wil:1},
            },
          },
          {
            t: "Tell the dead man's kin what a feud will cost them",
            req: (p,C)=>C.prof(p,"intimidation",35),
            check: {s:"intimidation",s2:"wil",d:50},
            win: {
              r: "You count the funerals for them, one by one. They take the lower price and go home.",
              fx: earn(1.5,{rep:5,skill:{intimidation:2}}),
            },
            lose: {
              r: "They hear a threat, not a sum. Now two kins want you dead.",
              fx: {rep:-3,newRel:{type:"enemy",op:-40}},
            },
          },
          {
            t: "Tell your clients to pay in full and live",
            r: "They pay. Nobody thanks you, but nobody else dies.",
            fx: earn(.5,{honor:2,rep:1}),
          },
        ],
      }),
      O(["lawyer","steward"], {
        id: "ln_law_boundary",
        maxRank: 2,
        w: 1.2,
        title: "The moved stone",
        setup: (p,ctx)=>{setFee(p,ctx,.12)},
        text: p=>p.realm==="POL-18"?"The flood has gone down, and two farmers of {home} both swear the field up to the stone is theirs. Moving a boundary stone after the flood costs a hundred blows and the field — so one of them is lying, and one of them is finished. You are asked to settle it.":"Two families of {home} have quarreled over a strip of ground since their grandfathers' day. Last spring the boundary stone moved six paces in the night. Both sides have hired a voice. One of them is you.",
        choices: [
          {
            t: "Walk the bounds with the oldest men in the village",
            check: {s:"persuasion",s2:"int",d:45},
            win: {
              r: "Three old men remember the stone by the twisted ash. The other side has no answer.",
              fx: earn(1,{rep:4,skill:{persuasion:1}}),
            },
            lose: {r:"The old men remember three different ashes. The case drags into next year.",fx:{rep:-2}},
          },
          {
            t: "Search the manor rolls for the old survey",
            check: {s:"learning",s2:"int",d:50},
            win: {
              r: "An eighty-year-old survey names the ash, the ditch and the stone. You win, and the rolls become your weapon in a dozen cases after.",
              fx: earn(1.2,{rep:5,skill:{learning:3}}),
            },
            lose: {
              r: "The mice ate that roll in the bad winter of your grandfather's day.",
              fx: {rep:-1,skill:{learning:1}},
            },
          },
          {
            t: "Take the other side's coin to lose quietly",
            check: {s:"deception",s2:"intrigue",d:50},
            win: {r:"You argue badly, carefully. Nobody notices but you.",fx:earn(2.5,{honor:-6})},
            lose: {
              r: "Your client finds out, and so does every alehouse in {home}.",
              fx: {rep:-8,honor:-6,newRel:{type:"enemy",op:-35}},
            },
          },
        ],
      }),
      O(["lawyer"], {
        id: "ln_law_guilty",
        minRank: 1,
        w: 1.1,
        cool: 5,
        title: "A guilty client",
        setup: (p,ctx)=>{who(p,ctx,"a wool-merchant",{sex:"M"}),ctx.crime=A.pick(["struck a carter dead in a quarrel over the road","sold rotten grain to the town granary in the hungry month","cheated a widow out of her land with a forged deed","set fire to his partner's warehouse"]),ctx.trial=trialOf(p),setFee(p,ctx,.25)},
        text: "{them} hires you to defend him against a charge that he {crime}. On the second night, deep in his cups, he tells you he did it. {trial}",
        choices: [
          {
            t: "Defend him with everything you have",
            check: {s:"persuasion",s2:"learning",d:55},
            win: {
              r: "He walks free. Your fee is large, your name is larger, and you do not sleep well.",
              fx: earn(2,{rep:7,honor:-4,them:{type:"friend",op:20}}),
            },
            lose: {
              r: "He is convicted. He blames you loudly from the cart.",
              fx: earn(.5,{rep:-3,them:{type:"enemy",op:-30}}),
            },
          },
          {
            t: "Coach the witnesses",
            check: {s:"deception",s2:"intrigue",d:55},
            win: {
              r: "Every witness tells the same story, word for word. It is a very good story.",
              fx: earn(2.5,{rep:4,honor:-8}),
            },
            lose: {
              r: "A witness breaks on the stand and names you as the one who taught him his lines.",
              fx: {rep:-15,honor:-8,prison:1,why:"suborning witnesses"},
            },
          },
          {
            t: "Make him confess and pay",
            check: {s:"diplomacy",s2:"wil",d:50},
            win: {
              r: "He confesses and pays the price in full. His sentence is lighter, and the town sees an honest pleader.",
              fx: earn(1,{rep:4,honor:4}),
            },
            lose: {
              r: "He dismisses you and hires someone with fewer scruples.",
              fx: {honor:2,rep:-1,them:{type:"rival",op:-15}},
            },
          },
          {
            t: "Drop the case",
            r: "You hand back the papers. Word gets around that you are particular about your clients.",
            fx: {honor:3,rep:-2},
          },
        ],
      }),
      O(["lawyer"], {
        id: "ln_law_bribed_judge",
        minRank: 2,
        w: 1,
        cool: 6,
        title: "The judge has been paid",
        cond: p=>!["deep","elf"].includes(lawOf(p)),
        setup: (p,ctx)=>{setFee(p,ctx,.25),ctx.bribe=Math.round(ctx.fee*.8),ctx.bribeS=A.coin(ctx.bribe)},
        text: "The case was yours: three witnesses, a sealed charter and the plain words of the law. Then a fine grey horse appeared in the judge's stable, and your opponent's groom was seen leading it there. Judgment is tomorrow.",
        choices: [
          {
            t: "Outbid them ({bribeS})",
            req: (p,C,ctx)=>p.coin>=(ctx&&ctx.bribe?ctx.bribe:50),
            r: "The judge rules for you. You have bought a judgment and a judge, and both will cost you again.",
            fx: (p,ctx)=>(p.coin=Math.max(0,p.coin-(ctx.bribe||50)),earn(1.5,{honor:-6,rep:2})(p,ctx)),
          },
          {
            t: "Expose him to his lord",
            check: {s:"intrigue",s2:"learning",d:60},
            win: {
              r: "The horse, the groom and a bill of sale. The judge loses his bench, and you become a famous enemy to have.",
              fx: earn(1,{rep:12,fame:3,honor:4,favor:3,newRel:{type:"enemy",op:-40}}),
            },
            lose: {
              r: "His lord is his cousin. You lose the case, and every case before him for years.",
              fx: {rep:-8,newRel:{type:"enemy",op:-40}},
            },
          },
          {
            t: "Appeal to the crown's court at {capital}",
            check: {s:"etiquette",s2:"persuasion",d:55},
            win: {
              r: "The crown's justices dislike bought judges, mostly. They reverse him and remember your name.",
              fx: earn(1,{rep:8,skill:{etiquette:2}}),
            },
            lose: {
              r: "A month on the road and a long wait in an anteroom. The appeal is refused.",
              fx: spend(.3,{rep:-3,wil:1}),
            },
          },
          {
            t: "Accept the loss",
            r: "You lose. Your client knows why. So does every pleader in town.",
            fx: {rep:-2,wil:1},
          },
        ],
      }),
      O(["lawyer"], {
        id: "ln_law_code",
        minRank: 3,
        minRep: 55,
        time: 2,
        w: .8,
        cool: 12,
        title: "The realm's law code",
        cond: (p,C)=>!C.flag(p,"ln_code"),
        setup: (p,ctx)=>{ctx.code=codeOf(p),ctx.sur=p.sur||p.given,setFee(p,ctx,.5)},
        text: "{ruler} wants the laws of {realmShort} gathered into one book: {code}, the old customs, a century of edicts and a heap of judgments that contradict each other. Whoever writes it will be read in every court for a hundred years. The commission is yours, if you want it.",
        choices: [
          {
            t: "Write a just code, the same for lord and ploughman",
            check: {s:"learning",s2:"int",d:60},
            win: {
              r: "Two years of candles. When it is read aloud in the great hall, even the lords who hate it cannot find the crack.",
              fx: earn(1,both({masterwork:"the {sur} Code of {realmShort}",rep:15,fame:5,honor:5,favor:5,stability:3,flag:"ln_code",skill:{learning:5}},deed("Wrote the law code of {realmShort}"))),
            },
            lose: {
              r: "Two years of work, and the great lords strike out every clause that touches them. What is left is a book of fines for peasants.",
              fx: {rep:3,wil:1.5,flag:"ln_code"},
            },
          },
          {
            t: "Write the crown's code",
            check: {s:"intrigue",s2:"learning",d:55},
            win: {
              r: "Every doubt is settled in the crown's favor. {ruler} is delighted. The great houses are not.",
              fx: earn(1.5,both({masterwork:"the Crown Code of {realmShort}",favor:20,rep:8,fame:3,honor:-3,flag:"ln_code"},deed("Wrote the Crown Code of {realmShort}"))),
            },
            lose: {
              r: "The houses see what you are doing and close ranks. The book dies in council.",
              fx: {favor:5,rep:-4,flag:"ln_code",newRel:{type:"enemy",op:-35}},
            },
          },
          {
            t: "Sell clauses to whoever pays",
            check: {s:"deception",s2:"intrigue",d:60},
            win: {
              r: "The salt merchants, two bishops and a count all get a line. You get rich, and the code gets strange.",
              fx: earn(3,{honor:-10,rep:4,flag:"ln_code"}),
            },
            lose: {
              r: "A clause bought by the salt merchants is read aloud in council with your name beside it.",
              fx: {rep:-15,favor:-20,honor:-10,flag:"ln_code"},
            },
          },
          {
            t: "Decline: it is a life's work",
            r: "Someone else writes it. You will spend the rest of your life arguing about their commas.",
            fx: {rep:-1},
          },
        ],
      }),
      O(["lawyer"], {
        id: "ln_law_sanctuary",
        minRank: 1,
        w: 1,
        cool: 6,
        title: "Forty days",
        cond: p=>lawOf(p)==="sun",
        setup: (p,ctx)=>{who(p,ctx,"a fugitive at the altar",{sex:"M"}),setFee(p,ctx,.2)},
        text: "{them}, accused of killing a tax-farmer's man, has run into the Sun temple and gripped the bell-rope. Sanctuary gives him forty days: to confess, to pay, or to leave the realm by the nearest road carrying a white wand. The tax-farmer hires you to argue the sanctuary void. His wife begs you to argue it good.",
        choices: [
          {
            t: "Argue it void, for the tax-farmer",
            check: {s:"learning",s2:"persuasion",d:55},
            win: {
              r: "He let go of the rope to drink, you prove. The temple court hands him over. The tax-farmer pays handsomely.",
              fx: earn(1.5,{rep:5,honor:-4,piety:-2}),
            },
            lose: {
              r: "The dawnkeepers will not hear of it. The tax-farmer pays you half and calls you a fool.",
              fx: earn(.5,{rep:-3}),
            },
          },
          {
            t: "Argue it good, for nothing",
            check: {s:"faith",s2:"learning",d:50},
            win: {
              r: "The forty days hold. He walks out of the realm with a white wand, alive, and his wife names her next son for you.",
              fx: {honor:5,piety:3,rep:4,them:{type:"friend",op:40}},
            },
            lose: {
              r: "The court rules the rope was cut before he reached it. He hangs at noon.",
              fx: {honor:3,rep:-2,wil:1.5},
            },
          },
          {
            t: "Broker the white-wand exile for both sides",
            check: {s:"diplomacy",s2:"int",d:40},
            win: {
              r: "He confesses, pays what he has, and takes the road. Everyone is a little unhappy, which is the mark of a good settlement.",
              fx: earn(1,{rep:4,skill:{diplomacy:2}}),
            },
            lose: {r:"Neither side will move. On the fortieth day it ends badly.",fx:{rep:-2}},
          },
        ],
      }),
      O(["lawyer"], {
        id: "ln_law_oath_helpers",
        maxRank: 2,
        w: 1.2,
        title: "Twelve on the ring",
        cond: p=>lawOf(p)==="north",
        setup: (p,ctx)=>{who(p,ctx,"a freeholder accused of theft",{sex:"M"}),setFee(p,ctx,.12),ctx.fate=p.realm==="POL-08"?"are set adrift in a boat without oars":p.realm==="POL-01"?"are outlawed, and anyone may kill them":"lose their good name forever"},
        text: "Your client {them} is accused of stealing a neighbor's ewes. By custom a man of good name clears himself with twelve oath-helpers who swear on the iron ring that his oath is clean. He has seven. False swearing on iron makes an oath-breaker, and oath-breakers {fate}.",
        choices: [
          {
            t: "Go door to door with him",
            check: {s:"persuasion",s2:"diplomacy",d:50},
            win: {
              r: "A smith, two fishermen and a half-deaf old soldier who owes his father a favor. Twelve hands on the ring. He is cleared.",
              fx: earn(1,{rep:5,skill:{persuasion:2},them:{type:"friend",op:25}}),
            },
            lose: {
              r: "Every door you knock on has heard about the ewes. He cannot find twelve, and the village has judged him already.",
              fx: {rep:-2,them:{type:"friend",op:5}},
            },
          },
          {
            t: "Pay five men to swear",
            check: {s:"deception",s2:"intrigue",d:55},
            win: {
              r: "Five strangers swear like brothers. He is cleared. You do not look at the ring as you leave.",
              fx: earn(1.5,{honor:-8,piety:-3}),
            },
            lose: {
              r: "One of the five recants at the ring. The hall-priest wants to know who paid him.",
              fx: {honor:-8,rep:-10,prison:1,why:"buying false oaths"},
            },
          },
          {
            t: "Advise him to pay twofold and be done",
            r: "He pays for ewes he swears he never touched. Then he finds them in his cousin's fold.",
            fx: earn(.6,{rep:1,honor:1}),
          },
        ],
      }),
      O(["lawyer"], {
        id: "ln_law_usury",
        minRank: 1,
        w: 1,
        cool: 5,
        title: "Interest by another name",
        setup: (p,ctx)=>{setFee(p,ctx,.2),ctx.rule=lawOf(p)==="well"?'The Book forbids interest, so lenders here charge "fees" instead.':p.realm==="POL-16"?"In Ostra, twelve in a hundred is lawful; more is usury, fined by the Temple courts.":lawOf(p)==="deep"?"The loan was carved and sealed with poured metal, and the dwarves do not forgive.":"Most faiths frown on interest; the bankers smile and call it a gift for the use of the coin.",ctx.lender=lenderOf(p)},
        text: "A knight of {home} borrowed 500 suns from {lender} for his daughter's dowry. Three years later he owes 900, and they want his mill. {rule} His family hires you.",
        choices: [
          {
            t: "Prove the fees were interest, and too much",
            check: {s:"learning",s2:"trade",d:55},
            win: {
              r: "You add the fees up on a counting board in front of the court. The court strikes half the debt, and the bankers strike your name off their friends.",
              fx: earn(1.3,{rep:7,skill:{trade:2,learning:2},newRel:{type:"enemy",op:-25}}),
            },
            lose: {r:"The bankers' advocate has better ledgers and a better dinner with the judge.",fx:{rep:-3}},
          },
          {
            t: "Settle: new terms, the mill kept",
            check: {s:"trade",s2:"diplomacy",d:45},
            win: {
              r: "Seven hundred over ten years, and the mill stays his. Everyone eats.",
              fx: earn(1,{rep:4,skill:{trade:2}}),
            },
            lose: {r:"The bankers would rather have the mill.",fx:{rep:-1}},
          },
          {
            t: "Switch sides: the bankers pay better",
            r: "You take the bankers' brief. The knight loses his mill, and you gain a client who pays on time.",
            fx: earn(2.5,{honor:-6,rep:2}),
          },
        ],
      }),
      O(["lawyer","steward"], {
        id: "ln_law_wardship",
        minRank: 2,
        w: 1,
        cool: 6,
        title: "The orphan heiress",
        setup: (p,ctx)=>{pickHouse(p,ctx),who(p,ctx,"an heiress of eleven",{sex:"F",ageAdj:11,status:"gentry"}),setFee(p,ctx,.25)},
        text: "{them} is eleven, and since her father's fall from his horse she owns a manor, two mills and a stretch of river. Her uncle wants her wardship, which means her rents until she marries — and the right to choose whom. Her mother wants it too. {House} has offered to buy it outright.",
        choices: [
          {
            t: "Argue for the mother",
            check: {s:"persuasion",s2:"learning",d:55},
            win: {
              r: "The court gives the mother the wardship. {them} grows up in her own hall, and remembers who stood for her.",
              fx: earn(1,{rep:6,honor:4,them:{type:"friend",op:40}}),
            },
            lose: {
              r: "The uncle has the wardship by Midsummer. The girl is sent to his hall like a sack of grain.",
              fx: {rep:-3,honor:2,wil:1},
            },
          },
          {
            t: "Sell the wardship to {house}",
            check: {s:"intrigue",s2:"trade",d:50},
            win: {
              r: "A great house buys a girl and a river. You take a fee from both ends.",
              fx: earn(2.5,both({honor:-6,rep:3},hp(10))),
            },
            lose: {
              r: "The uncle outbids them and learns you tried to sell his niece behind his back.",
              fx: {rep:-5,honor:-4,newRel:{type:"enemy",op:-30}},
            },
          },
          {
            t: "Arrange a betrothal that protects her",
            check: {s:"diplomacy",s2:"int",d:50},
            win: {
              r: "A betrothal to a decent knight's son, with her lands tied up in her own name. The uncle is furious and powerless.",
              fx: earn(1.2,{rep:5,skill:{diplomacy:2},them:{type:"friend",op:25}}),
            },
            lose: {r:"The boy's father reads the clauses and walks away.",fx:{rep:-2}},
          },
        ],
      }),
      O(["lawyer"], {
        id: "ln_law_sentence",
        minRank: 3,
        w: 1.1,
        cool: 5,
        title: "Your sentence",
        setup: (p,ctx)=>{who(p,ctx,"a prisoner in the dock",{sex:"M"});const s=p.realm==="POL-15"?["a horse","hanging at the city gate"]:p.realm==="POL-05"?["a royal deer","the loss of a hand"]:p.realm==="POL-01"?["two sheep","hanging, since it is worth more than one mark"]:lawOf(p)==="well"?["a third purse","a hand, at the third offense"]:lawOf(p)==="east"?["a bolt of cloth","the brand on the cheek"]:["a sack of the lord's grain","a flogging and the brand"];ctx.thing=s[0],ctx.sentence=s[1],ctx.code=codeOf(p),ctx.rank=rankName(p)},
        text: "As {rank}, you sit in judgment. In the dock stands {them}, who stole {thing} in the hungry month. By {code} the sentence is {sentence}. The hall is full, and the lord who brought the charge is in the front row.",
        choices: [
          {
            t: "The law as it is written",
            r: "You pronounce it. The lord nods. The prisoner's mother does not scream, which is worse.",
            fx: {rep:3,honor:-2,favor:2,wil:.5},
          },
          {
            t: "Find a lesser charge in the law",
            check: {s:"learning",s2:"int",d:50},
            win: {
              r: "The value, properly reckoned, falls a penny short of the mark. A fine and a season's labor instead. The lord stares; the law is the law.",
              fx: {honor:4,rep:4,them:{type:"friend",op:40}},
            },
            lose: {r:"The lords call you soft, and the next bench gets the case.",fx:{rep:-5,favor:-4,honor:3}},
          },
          {
            t: "Sentence him to work it off on the lord's land",
            r: "Two years of labor. The lord gets his value; {them} keeps {theirHis} hands.",
            fx: {honor:2,rep:1},
          },
        ],
      }),
      O(["lawyer"], {
        id: "ln_law_crown",
        minRank: 4,
        minRep: 60,
        time: 2,
        w: 1,
        cool: 8,
        title: "The crown against the law",
        setup: (p,ctx)=>{lordOf(p,ctx,"a lord whose charter is challenged"),setFee(p,ctx,.15)},
        text: "{ruler} wants the High Justice to rule that the old charter of {house} is void, so the crown can take back {seat}. The charter is old, genuine and perfectly clear. {themFull} has asked to be heard.",
        choices: [
          {
            t: "Rule for the crown",
            r: "You find a reason. There is always a reason. {House} loses {seat}, and the crown is generous to its friends.",
            fx: earn(3,both({favor:20,honor:-8,stability:-2,them:{type:"enemy",op:-60}},hp(-30))),
          },
          {
            t: "Rule for the law",
            r: "You read the charter aloud, word by word, and uphold it. {ruler} leaves the hall without a word. Every court in the realm hears what you did.",
            fx: both({favor:-20,rep:12,fame:4,honor:8,them:{type:"friend",op:30}},hp(20)),
          },
          {
            t: "Find a path between them",
            check: {s:"learning",s2:"diplomacy",d:65},
            win: {
              r: "The house keeps its seat and pays a crushing fine for an old fault you find. The crown gets its money; you keep your head and your name.",
              fx: earn(1,both({favor:5,rep:8,fame:2},hp(-5))),
            },
            lose: {
              r: "Your compromise satisfies nobody. Both sides now count you an enemy.",
              fx: both({favor:-10,rep:-3,them:{type:"rival",op:-20}},hp(-10)),
            },
          },
        ],
      }),
    ]);
    A.defEvents([
      D(["lawyer"], {
        id: "ln_d_law_kin",
        w: 1,
        title: "The losing side",
        setup: (p,ctx)=>{who(p,ctx,"the brother of a man you beat in court",{sex:"M"})},
        text: "{them} and two of his cousins are waiting in the lane behind the court. You won the case against his brother last month. They have cudgels and an argument they think is better than yours.",
        choices: [
          {
            t: "Talk them down",
            check: {s:"persuasion",s2:"wil",d:45},
            win: {
              r: "You explain the appeal they could make, and what it would cost. They go to drink about it instead.",
              fx: {skill:{persuasion:2},wil:.5},
            },
            lose: {
              r: 'They hear "lawyer" and stop listening. You get a beating and a lesson.',
              fx: {health:-12,cause:"a beating in an alley",wil:1.5,them:{type:"enemy",op:-30}},
            },
          },
          {
            t: "Fight your way through",
            r: "You square up.",
            fx: {
              duel: {
                tier: 2,
                title: "an angry brother",
                opts: {kind:"brawl",place:"the lane behind the court",lethal:!1,toYield:!0,title:"The losing side"},
              },
            },
          },
          {
            t: "Run for the town gate",
            check: {s:"spd",s2:"athletics",d:40},
            win: {r:"You are faster than men who have been drinking since noon.",fx:{spd:.5,happy:-1}},
            lose: {r:"They are faster than a man in a long gown.",fx:{health:-10,cause:"a beating in an alley",wil:1}},
          },
        ],
      }),
      D(["lawyer"], {
        id: "ln_d_law_goose",
        w: 1,
        title: "Paid in geese",
        setup: (p,ctx)=>{who(p,ctx,"a widow with no coin",{sex:"F",ageAdj:50})},
        text: "{them} has walked from her village with a goose under each arm. Her landlord means to throw her out at the quarter-day, and she has no coin for a pleader. Everyone says you know the law. She has geese.",
        choices: [
          {
            t: "Take the case, and the geese",
            check: {s:"learning",s2:"persuasion",d:40},
            win: {
              r: "You win her another year under her own roof. The geese are excellent.",
              fx: {honor:4,happy:3,rep:2,them:{type:"friend",op:40}},
            },
            lose: {
              r: "You lose, but you buy her a month to find another roof. She leaves you one goose anyway.",
              fx: {honor:2,wil:.5},
            },
          },
          {t:"Send her away",r:"She goes home with both geese. You eat bread that evening.",fx:{honor:-2}},
          {
            t: "Send her to a younger pleader who needs the practice",
            r: "He loses, but he learns. So does she.",
            fx: {honor:1,rep:1},
          },
        ],
      }, (p,C)=>lit(p)&&C.prof(p,"learning",55)&&C.prof(p,"persuasion",35)),
      D(["lawyer","scribe","teacher","clergy","healer"], {
        id: "ln_d_book",
        w: .8,
        cool: 8,
        title: "A book for sale",
        cond: p=>lit(p)&&p.coin>=10,
        setup: (p,ctx)=>{ctx.book=J(p,"healer")?"a Qadiri book of fevers, copied on cheap paper":J(p,"clergy")?"a lives-of-the-saints with half the pages water-stained":J(p,"lawyer")?"an Old Solen digest of the law, three hundred years old":A.pick(["a history of the Solen emperors","a book of the stars from the Needle-Keepers","a grammar of Old Solen with the answers written in"]),ctx.price=A.ri(25,50)},
        text: "A dead man's books are being sold off a cart in {home}. Among the psalters and the account rolls is {book}. The carter wants {price} suns and has no idea what it is.",
        choices: [
          {
            t: "Buy it and read it through the winter",
            req: (p,C,ctx)=>p.coin>=(ctx.price||40),
            r: "You read it by rushlight until your eyes ache. Some of it is wrong. Some of it is better than anything you were taught.",
            fx: (p,ctx)=>(p.coin-=ctx.price||40,A.applyFx(p,{int:1,skill:J(p,"healer")?{medicine:4,learning:2}:J(p,"clergy")?{faith:3,learning:3}:{learning:5},happy:3},ctx)),
          },
          {
            t: "Haggle like a fishwife",
            check: {s:"trade",s2:"int",d:40},
            win: {
              r: "You get it for a third, and a cracked inkpot thrown in.",
              fx: (p,ctx)=>(p.coin=Math.max(0,p.coin-Math.round((ctx.price||40)/3)),A.applyFx(p,{skill:{learning:4,trade:1},happy:4},ctx)),
            },
            lose: {r:"A monk buys it from under your nose for the full price.",fx:{happy:-3}},
          },
          {t:"Leave it",r:"You think about it for a month.",fx:{happy:-1}},
        ],
      }, (p,C)=>lit(p)&&C.prof(p,"learning",45)),
    ]);
    A.defEvents([
      O(["healer"], {
        id: "ln_heal_plague",
        time: 2,
        w: 1.1,
        cool: 8,
        title: "The pox in the lanes",
        setup: (p,ctx)=>{setFee(p,ctx,.3),ctx.how=p.realm==="POL-04"?"Lucerna's Forty-Day Law kept it off the ships, but not out of the fish market.":C2r(p,"POL-17","POL-24","POL-32")?"The well-houses wash before every prayer, and it is still in the lanes.":A.pick(["It came on a ship, or a cart, or the wind; nobody agrees which.","The old people call it the Harbor Pox come again.","The priests say it is the bad air off the tanneries."])},
        text: "Pox in {town}. {how} The gates are shut, the rich have gone to their country houses, and the lime pits are open outside the walls. Candles cost six times what they did. The town council asks for anyone who will go in.",
        choices: [
          {
            t: "Go in: wash, boil, burn the bedding, keep the sick apart",
            check: {s:"medicine",s2:"wil",d:55},
            win: {
              r: "Your quarter buries one in ten. The next quarter buries one in three. The town will remember your name longer than the plague.",
              fx: earn(1,{rep:12,fame:4,honor:5,skill:{medicine:5},stability:1,flag:"ln_washer"}),
            },
            lose: {
              r: "You keep them apart and wash them, and then you are one of them. You live, barely, and they carry you out on a door.",
              fx: {health:-28,cause:"the pox",rep:6,honor:4,wil:2.5,skill:{medicine:3}},
            },
          },
          {
            t: "Sell sulfur, charms and sun-cakes at the gate",
            r: "Bad air, you tell them, and sell them smoke. You grow rich while the pits fill.",
            fx: earn(3,{honor:-8,rep:-3}),
          },
          {
            t: "Leave with the rich, as their physician",
            r: "You spend the plague summer in a villa, reading and feeling the pulses of frightened merchants.",
            fx: earn(1.5,{honor:-4,rep:-4,happy:2}),
          },
        ],
      }),
      O(["healer"], {
        id: "ln_heal_dying_lord",
        minRank: 2,
        w: 1.1,
        cool: 6,
        title: "The dying lord",
        setup: (p,ctx)=>{pickHouse(p,ctx);const t=who(p,ctx,"an old lord with the bloody flux",{sex:"M",ageAdj:64,status:"noble"});ctx.lord=A.fullName(t),setFee(p,ctx,.3),ctx.ill="the bloody flux"},
        text: "Old {them} of {house} has had the bloody flux for nine days. The family physicians have bled him white. On the third night his heir draws you aside: the old man is in pain, the estate is in debt, and nobody would blame a physician if the poppy were strong.",
        choices: [
          {
            t: "Honest care: broth, rest, clean linen, no more bleeding",
            check: {s:"medicine",s2:"int",d:60},
            win: {
              r: "He mends, slowly, sitting up on the twelfth day to curse his heir. {House} sends you a heavy purse and a standing invitation.",
              fx: earn(2,both({rep:10,fame:2,honor:2,them:{type:"friend",op:40}},hp(12))),
            },
            lose: {
              r: "He dies on the ninth night, quietly, of the flux you could not stop. The heir pays you and does not meet your eye.",
              fx: earn(1,both({rep:-3,wil:1},kill("the bloody flux"))),
            },
          },
          {
            t: "The great cures: powdered pearl, unicorn horn, more bleeding",
            r: "The family is impressed by the cost. He dies anyway, expensively, in clean sheets.",
            fx: earn(2.5,both({rep:2,honor:-2},kill("the bloody flux"))),
          },
          {
            t: "Do as the heir asks",
            check: {s:"intrigue",s2:"medicine",d:55},
            win: {
              r: "He goes to sleep and does not wake. The heir is generous, and grateful, and now he owns a piece of you.",
              fx: earn(5,both({honor:-15,piety:-5,newRel:{type:"friend",op:20}},kill("the bloody flux"))),
            },
            lose: {
              r: "The old man's confessor smells the poppy on his lips and calls for the reeve.",
              fx: both(kill("poison"),{honor:-15,rep:-20,punish:"murder"}),
            },
          },
          {
            t: "Tell the old man what his heir asked",
            r: "He laughs until he coughs blood, and disinherits nobody. But he pays you himself, double, and dies a month later still laughing.",
            fx: earn(2,{honor:4,rep:3,newRel:{type:"enemy",op:-40}}),
          },
        ],
      }),
      O(["healer"], {
        id: "ln_heal_dissection",
        minRank: 1,
        w: .9,
        cool: 8,
        title: "The hanged man",
        setup: (p,ctx)=>{ctx.ban=p.faith==="REL-01"?"The Temple teaches that the dead must lie whole, facing east, to rise into the noon sun. Cutting a corpse is sacrilege.":p.faith==="REL-05"?"The Deep Law says a body left open to the air wanders cold forever.":"Every faith on Ardan has something to say about cutting the dead, and none of it is kind."},
        text: "{ban} The hangman of {home} will sell you a body for 10 suns, no questions, if you fetch it yourself at night. The Old Solen books show the inside of a man in drawings so wrong you are sure of it.",
        choices: [
          {
            t: "Buy it and cut by candlelight",
            req: p=>p.coin>=10,
            check: {s:"medicine",s2:"stealth",d:55},
            win: {
              r: "Three nights in a cellar with a lamp and a strong stomach. The books are wrong about the liver, the heart and the cords of the hand. Your hands are surer than any physician's in the realm.",
              fx: both({coin:-10,skill:{medicine:8},int:1,flag:"ln_dissected"}, p=>A.chance(.3)?A.applyFx(p,{apt:{medicine:1.3}},{})||"(You have a gift for this.)":""),
            },
            lose: {
              r: "A watchman sees the cart. The faith's court has a great deal to say, and so do your patients.",
              fx: {coin:-10,prison:1,why:"cutting the dead",rep:-10,piety:-5,honor:-3,skill:{medicine:3}},
            },
          },
          {
            t: "Refuse. The dead belong to the gods",
            r: "You go back to the drawings. They are still wrong.",
            fx: {piety:2},
          },
          {
            t: "Report the hangman to the priests",
            r: "The hangman is fined and dismissed. His replacement charges 15.",
            fx: {piety:2,rep:1,newRel:{type:"enemy",op:-30}},
          },
        ],
      }),
      O(["healer"], {
        id: "ln_heal_quack",
        w: 1.2,
        cool: 5,
        title: "The unicorn-horn man",
        setup: (p,ctx)=>{who(p,ctx,"a seller of miracle cures",{sex:"M"}),setFee(p,ctx,.15)},
        text: "{them} has set up a booth in the market of {home}, selling unicorn horn (it is whale tusk, if anything), sun-cakes stamped with the Needle, and a red powder that cures all fevers. He charges more than you do, and his patients die smiling. Two of yours have gone to him.",
        choices: [
          {
            t: "Expose him in the market square",
            check: {s:"persuasion",s2:"learning",d:50},
            win: {
              r: "You show the crowd the whale-tusk grain under a knife and feed his red powder to a rat. The rat dies. He leaves town at dusk.",
              fx: {rep:7,honor:2,fame:1,them:{type:"enemy",op:-40}},
            },
            lose: {
              r: "The crowd likes him better. He is funnier than you, and he gives away free samples.",
              fx: {rep:-4,them:{type:"rival",op:-20}},
            },
          },
          {
            t: "Cure the patient he gave up on",
            check: {s:"medicine",s2:"int",d:55},
            win: {
              r: "His richest customer walks to the noon rite on her own feet. The whole market knows whose physic did it.",
              fx: earn(1,{rep:8,skill:{medicine:3}}),
            },
            lose: {r:"The patient dies on your table, and he tells everyone your hands killed her.",fx:{rep:-6,wil:1}},
          },
          {
            t: "Go into partnership with him",
            r: "You lend him your name and he lends you his customers. You both do very well. The graveyard does better.",
            fx: earn(2,{honor:-6,rep:-3,them:{type:"friend",op:30}}),
          },
          {
            t: "Ignore him",
            r: "In a year he is gone, and so are some of his customers, into the ground.",
            fx: {wil:.5},
          },
        ],
      }),
      O(["healer"], {
        id: "ln_heal_field",
        minRank: 1,
        w: 1,
        cool: 5,
        title: "After the fight",
        setup: (p,ctx)=>{pickHouse(p,ctx),setFee(p,ctx,.2),ctx.fight=C2r(p,"POL-11","POL-34","POL-12")?"a raid on the horse herds":A.atWar(p.realm).length?"a skirmish on the border":A.pick(["a feud over a mill-dam","a tourney melee that went wrong","a fight between two lords' men at the fair"])},
        text: "Forty men were hurt in {fight}. They lie in rows in a barn: smashed legs, arrows, cuts to the thigh that will kill in minutes if nobody holds them. The son of {house} is among them, with a cut forearm and a loud voice.",
        choices: [
          {
            t: "Cut fast: the smashed legs first, the scratched lord last",
            check: {s:"medicine",s2:"wil",d:55},
            win: {
              r: "You work until dawn: straps, hot iron, saw. Two men in three with smashed knees live. The lord's son waits, and lives too, and never forgives the wait.",
              fx: earn(1,both({rep:9,honor:4,skill:{medicine:5},wil:1},hp(-5))),
            },
            lose: {
              r: "There are too many and you are too slow. The rows of the dead grow longer than the rows of the living.",
              fx: {rep:1,wil:2,happy:-6,skill:{medicine:3}},
            },
          },
          {
            t: "The lord's son first, then the rest",
            r: "{House} pays you well and remembers you. Two men bleed out while you stitch a forearm.",
            fx: earn(2,both({honor:-4,rep:2},hp(10))),
          },
          {
            t: "Work by torchlight until you drop",
            check: {s:"sta",s2:"medicine",d:50},
            win: {
              r: "You do not stop for twenty hours. The soldiers carry you to bed and leave a cup of wine by it every night for a week.",
              fx: earn(1,{rep:6,sta:1,skill:{medicine:3},newRel:{type:"friend",op:30}}),
            },
            lose: {
              r: "You faint over a patient at midnight. Somebody else finishes.",
              fx: {health:-5,cause:"exhaustion",rep:1,wil:1},
            },
          },
        ],
      }),
      O(["healer"], {
        id: "ln_heal_birth",
        maxRank: 2,
        w: 1.1,
        title: "The child lying wrong",
        setup: (p,ctx)=>{who(p,ctx,"a woman in her second day of labor",{sex:"F",ageAdj:22}),setFee(p,ctx,.1),ctx.call=p.faith==="REL-03"?"The women are calling on the Hearth Mother.":p.faith==="REL-01"||p.faith==="REL-02"?"A candle burns to the sun on the sill.":C2r(p,"POL-20","POL-22","POL-21")?"The grandmother is speaking the ancestors' names.":"The women of the house are praying."},
        text: "The midwife sends a boy running for you: {them} has been in labor two days and the child is lying wrong. {call} One birth in sixty kills the mother. This one looks like it.",
        choices: [
          {
            t: "Turn the child",
            check: {s:"medicine",s2:"ins",d:55},
            win: {
              r: "Slow hands and a long hour. The child comes squalling at dawn, and the mother lives to scold you for the mess.",
              fx: earn(1,{rep:6,honor:3,skill:{medicine:4},them:{type:"friend",op:40}}),
            },
            lose: {
              r: "The child is born, alive. The mother is not so lucky. The midwife closes her eyes, and you walk home in the rain.",
              fx: {rep:-1,wil:2,happy:-8,skill:{medicine:2}},
            },
          },
          {
            t: "Stay, and let the midwife lead",
            check: {s:"wil",s2:"medicine",d:45},
            win: {
              r: "She knows more than your books. You hold, fetch and keep your mouth shut, and both live.",
              fx: {rep:3,skill:{medicine:3},newRel:{type:"mentor",op:30}},
            },
            lose: {
              r: "It goes as the midwife feared. You learn what she already knew: sometimes there is nothing to do.",
              fx: {wil:1.5,happy:-5},
            },
          },
          {
            t: "Leave it to the women and the gods",
            r: "You go home. Word gets round that you went home.",
            fx: {rep:-3,honor:-2},
          },
        ],
      }),
      O(["healer"], {
        id: "ln_heal_treatise",
        minRank: 2,
        minRep: 50,
        time: 2,
        w: .8,
        cool: 10,
        title: "A book of wounds",
        cond: (p,C)=>!C.flag(p,"ln_treatise"),
        setup: (p,ctx)=>{setFee(p,ctx,.3),ctx.sur=p.sur||p.given},
        text: "Twenty years of wounds, fevers and births, and most of it is in your head. The old Solen books tell physicians to bleed a fever and leave a wound alone to make good pus. You know better. A rich patron offers to pay the copyists for a dozen fair copies of whatever you write.",
        choices: [
          {
            t: "Write what you have seen work, against the old books",
            check: {s:"learning",s2:"medicine",d:60,bonus:p=>(p.flags.ln_dissected?10:0)+(p.flags.ln_washer?6:0)},
            win: {
              r: "Wine and vinegar on the wound, honey under the linen, clean hands, no bleeding for fever. The physicians' colleges call it a barber's book. Their students copy it by night.",
              fx: earn(1,both({masterwork:"On Wounds and Their Washing",rep:12,fame:3,int:1,flag:"ln_treatise"},deed("Wrote On Wounds and Their Washing"))),
            },
            lose: {
              r: "You write it, and it is muddled. The colleges laugh, and the patron wants his money back.",
              fx: {rep:-2,wil:1,flag:"ln_treatise"},
            },
          },
          {
            t: "Dedicate it to {ruler} and write what the court wants",
            r: "A Regimen of Health for princes: diets, airs, the right gems against melancholy. It sells beautifully and saves nobody.",
            fx: earn(1.5,{masterwork:"A Regimen of Health for the Court",favor:8,rep:4,honor:-2,flag:"ln_treatise"}),
          },
          {
            t: "Translate the Qadiri physicians instead",
            req: p=>speaks(p,"Qadiri")||speaks(p,"Well Speech"),
            check: {s:"learning",s2:"int",d:50},
            win: {
              r: "The well-house physicians of Qadira wash before every cut. You put it into your own tongue, and doors open in every court.",
              fx: earn(1, {
                masterwork: "the Book of Fevers out of the Qadiri",
                rep: 9,
                fame: 2,
                skill: {medicine:3,learning:3},
                flag: "ln_treatise",
              }),
            },
            lose: {r:"Half the words have no word in your tongue. You give up at the liver.",fx:{skill:{learning:2}}},
          },
        ],
      }),
      O(["healer"], {
        id: "ln_heal_poison",
        minRank: 1,
        w: 1,
        cool: 6,
        title: "Something to help him sleep",
        setup: (p,ctx)=>{who(p,ctx,"a well-dressed young man",{sex:"M",ageAdj:24}),setFee(p,ctx,.2)},
        text: "{them} wants something strong to help his old father sleep. Very strong. He offers {pay} and does not look at you while he says it.",
        choices: [
          {
            t: "Sell him poppy so weak it would not kill a cat",
            check: {s:"deception",s2:"medicine",d:45},
            win: {
              r: "The father sleeps well and wakes up rested. The son does not come back.",
              fx: earn(1,{skill:{deception:1}}),
            },
            lose: {
              r: "He comes back, furious, asking what he paid for. You tell him: his father's life.",
              fx: {rep:-2,them:{type:"enemy",op:-40}},
            },
          },
          {
            t: "Warn the father",
            check: {s:"intrigue",s2:"persuasion",d:45},
            win: {
              r: "The old man changes his will and his cook. He sends you a cask of wine every year after.",
              fx: {honor:5,rep:3,newRel:{type:"friend",op:40},them:{type:"enemy",op:-50}},
            },
            lose: {
              r: "The father does not believe you. The son hears what you said.",
              fx: {honor:3,them:{type:"enemy",op:-50}},
            },
          },
          {
            t: "Sell him what he wants",
            r: "You hand over the little bottle. You tell yourself it is not your business what he does with it.",
            fx: both(earn(4,{honor:-15,piety:-4}),p=>A.chance(.35)?A.applyFx(p,{punish:"murder"},{})||"The father dies, and the reeve follows the bottle back to you.":""),
          },
          {t:"Refuse him",r:"He shrugs and goes to the herbwife at the ford.",fx:{honor:2}},
        ],
      }),
      O(["healer"], {
        id: "ln_heal_summons",
        minRank: 2,
        maxRank: 2,
        minRep: 55,
        time: 2,
        w: 1.2,
        cool: 6,
        title: "The court sends for you",
        setup: (p,ctx)=>{const r=RM(p),ru=r?A.P(r.ruler):null,sp=ru&&ru.spouse?A.P(ru.spouse):null;ctx.patient=sp&&sp.alive?"the consort, "+sp.given:r&&r.heir&&A.P(r.heir)?"the heir, "+A.P(r.heir).given:"the ruler's youngest"},
        text: "{ruler}'s own physicians have failed. A fever has had {patient} for nine days. A rider with a spare horse is waiting at your door, and he has not dismounted.",
        choices: [
          {
            t: "Go, and treat {patient} as you would a carter",
            check: {s:"medicine",s2:"int",d:60},
            win: {
              r: "You throw out the court physicians, open the windows, and give willow bark, broth and sleep. The fever breaks on the fourth day. You do not go home again.",
              fx: up({favor:15,rep:10,fame:4}),
            },
            lose: {
              r: "You do all the right things and the fever does what it likes. It breaks on its own the day after they send you home in disgrace.",
              fx: {rep:-6,favor:-5,wil:1},
            },
          },
          {
            t: "Go, and do what the court physicians did, but more of it",
            r: "Pearl, gold leaf, bleeding twice a day. The patient lives, somehow. The court physicians close ranks against you.",
            fx: {rep:2,favor:2,coin:20},
          },
          {t:"Send word that you are ill yourself",r:"The rider leaves. So does your chance.",fx:{rep:-3}},
        ],
      }),
      O(["healer"], {
        id: "ln_heal_madness",
        minRank: 1,
        w: .9,
        cool: 6,
        title: "The chained son",
        setup: (p,ctx)=>{who(p,ctx,"a madman chained in a byre",{sex:"M",ageAdj:20}),setFee(p,ctx,.1),ctx.view=C2r(p,"POL-11","POL-34")?"The orcs say the storm has entered his head, and they treat such men gently.":p.faith==="REL-01"?"The Temple calls it the Devourer's cold in the soul.":"The priest says it is a punishment. Nobody says for what."},
        text: "A farmer of {home} keeps his son {them} chained in the byre since the boy broke a neighbor's arm at the harvest. {view} The family begs you to do something. They can pay a little.",
        choices: [
          {
            t: "Unchain him: sleep, food, work, and patience",
            check: {s:"medicine",s2:"wil",d:55},
            win: {
              r: "Three months of quiet work in the orchard. He still hears things, but he does not break arms. His mother kisses your hands.",
              fx: earn(1,{rep:6,honor:4,skill:{medicine:3},them:{type:"friend",op:30}}),
            },
            lose: {
              r: "He runs on the second night and is found in the river. Nobody blames you aloud.",
              fx: {rep:-3,wil:1.5,happy:-5},
            },
          },
          {
            t: p=>C2r(p,"POL-11","POL-34","POL-12")?"Give him into the shamans' keeping":"Send him to the monastery infirmary",
            r: "The family sells a cow to pay. His keepers are kind, and the walls are thick.",
            fx: earn(.5,{rep:1}),
          },
          {
            t: "Bleed him and bind his head, as the books say",
            r: "He grows quiet from weakness. The family thinks it worked.",
            fx: earn(1,{honor:-1}),
          },
        ],
      }),
      O(["healer"], {
        id: "ln_heal_dwarf",
        maxRank: 2,
        w: 1,
        cool: 6,
        title: "The dwarf bone-setter",
        setup: (p,ctx)=>{const t=who(p,ctx,"a dwarven bone-setter",{});t.race!=="dwarf"&&(t.race="dwarf",t.cult="CUL-21",t.faith="REL-05",t.given=A.givenName("CUL-21",t.sex),t.sur="",t.born=A.S.year-A.ri(70,140))},
        text: "A dwarf carter's hand is crushed under an iron-bound barrel at the {home} market. Before you can reach him, another dwarf, {them}, pushes you aside and goes to work. The dwarves are the best bone-setters alive; the rockfalls taught them.",
        choices: [
          {
            t: "Watch, and keep your mouth shut",
            r: "Every bone found and set, the splint padded with moss, the fingers tied to each other. You learn more in an hour than in a year.",
            fx: {skill:{medicine:4},int:.5},
          },
          {
            t: "Offer to trade your herb-craft for {theirHis} bone-craft",
            check: {s:"diplomacy",s2:"medicine",d:45},
            win: {
              r: "{them} grunts, considers, and agrees: willow and poppy for the secret of the hand. A contract is a contract.",
              fx: {skill:{medicine:7},them:{type:"friend",op:35}},
            },
            lose: {r:'"Your herbs grow on every hill. My craft does not." {them} walks off.',fx:{skill:{medicine:1}}},
          },
          {
            t: "Insist the patient is yours",
            check: {s:"persuasion",s2:"wil",d:55},
            win: {
              r: "You set the hand yourself, well enough. {them} watches, and says nothing, which from a dwarf is praise.",
              fx: {rep:3,skill:{medicine:2}},
            },
            lose: {r:"The carter himself tells you to get out of the way.",fx:{rep:-2,them:{type:"rival",op:-15}}},
          },
        ],
      }),
      O(["healer"], {
        id: "ln_heal_camp",
        minRank: 1,
        w: 1.4,
        cool: 4,
        title: "Camp fever",
        cond: (p,C)=>C.atWar(p),
        setup: (p,ctx)=>{setFee(p,ctx,.25),ctx.mem=A.pick(["A third of the army before Tessar died this way in 708.","Camp fever killed eight thousand of the Khan's men before Morhaven.","At Madara in 1003 the flux killed three thousand without a battle."])},
        text: "The army of {realmShort} has sat in the same meadow for six weeks. The latrines drain into the stream the cooks draw from, and men are dying of the flux faster than the enemy ever killed them. {mem}",
        choices: [
          {
            t: "Convince the commander to move the camp: high ground, latrines downwind",
            check: {s:"persuasion",s2:"medicine",d:55},
            win: {
              r: "He grumbles about lost days and moves. The dying slows within the week. The soldiers know who to thank.",
              fx: earn(1,{rep:10,fame:3,favor:4,honor:2}),
            },
            lose: {r:'"I did not ask a barber for tactics." The camp stays, and so does the flux.',fx:{rep:-2,wil:1}},
          },
          {
            t: "Nurse the fever tents yourself",
            check: {s:"medicine",s2:"sta",d:50},
            win: {
              r: "Clean water boiled, the sick kept apart. Your tents lose half what the others lose.",
              fx: earn(1,{rep:6,honor:3,skill:{medicine:4}}),
            },
            lose: {
              r: "The flux takes you too. You live, a stone lighter.",
              fx: {health:-22,cause:"camp fever",wil:2,skill:{medicine:2}},
            },
          },
          {
            t: "Charge the captains for physic",
            r: "They pay, and their men die anyway, but slower.",
            fx: earn(2,{honor:-3}),
          },
        ],
      }),
      O(["healer"], {
        id: "ln_heal_tooth",
        minRank: 3,
        w: 1,
        cool: 6,
        title: "The royal tooth",
        text: "{ruler} has had a rotten back tooth for a month and has not hanged anybody for it yet, which the court thinks is a miracle. It must come out. Your hand, the royal jaw, and the whole council watching through the door.",
        choices: [
          {
            t: "Pull it in one go",
            check: {s:"medicine",s2:"str",d:55},
            win: {
              r: "One twist, one roar, one bloody tooth held up to the light. By supper the royal humor is the best it has been in a year.",
              fx: {favor:15,rep:5,fame:2,skill:{medicine:2}},
            },
            lose: {
              r: "The tooth breaks. The second attempt is worse. The council stops watching through the door.",
              fx: {favor:-15,rep:-6,wil:1},
            },
          },
          {
            t: "Poppy first, then the pliers",
            check: {s:"medicine",s2:"int",d:45},
            win: {
              r: "The sovereign sleeps through it and wakes up with a gap and a good opinion of you.",
              fx: {favor:10,rep:3},
            },
            lose: {r:"Too much poppy. A day of royal sickness and a week of royal sulking.",fx:{favor:-5,rep:-2}},
          },
          {
            t: "Recommend cloves and patience",
            r: "The tooth stays. So does the temper. Someone else pulls it next month.",
            fx: {favor:-3,rep:-1},
          },
        ],
      }),
    ]);
    A.defEvents([
      D(["healer"], {
        id: "ln_d_heal_night",
        w: 1,
        title: "Knocking at night",
        setup: (p,ctx)=>{who(p,ctx,"a stabbed man who gives no name",{sex:"M"})},
        text: 'Hammering at your door after the curfew bell. Two men hold up a third between them, {them}, pale and bleeding from a knife-cut under the ribs. "No questions," says the bigger one, and puts a silver coin on your table.',
        choices: [
          {
            t: "Stitch him and ask nothing",
            check: {s:"medicine",s2:"int",d:45},
            win: {
              r: "Wine, needle, linen. He lives. A week later a cask of good wine appears at your door, and nobody touches your shop for years.",
              fx: {coin:8,skill:{medicine:3},them:{type:"friend",op:30}},
            },
            lose: {
              r: "He dies on your table before dawn. His friends carry him out without a word, and the coin stays.",
              fx: {coin:3,wil:1,happy:-4},
            },
          },
          {
            t: "Stitch him, then tell the watch",
            r: "He lives, and is hanged a month later for a killing at the docks. His friends know who talked.",
            fx: {honor:2,skill:{medicine:2},newRel:{type:"enemy",op:-40}},
          },
          {
            t: "Bar the door",
            r: "You hear them go away down the lane. In the morning there is blood on your step.",
            fx: {honor:-2,happy:-2},
          },
        ],
      }, (p,C)=>C.prof(p,"medicine",50)&&C.town(p)),
      D(["healer"], {
        id: "ln_d_heal_kind",
        w: 1,
        title: "Paid in kind",
        setup: (p,ctx)=>{who(p,ctx,"a farmer whose leg you set",{sex:"M"}),ctx.gift=A.pick(["a basket of eggs and a cheese","a goat with a bad temper","a sack of chestnuts","two hens and his eldest's promise to cut your wood all winter"])},
        text: "{them}, whose leg you set at harvest, walks into {home} on that leg to pay you: {gift}. It is not what you would have charged. It is more than he has.",
        choices: [
          {
            t: "Take it gladly",
            r: "You eat well and so does he, at your table. The village hears you are fair.",
            fx: {happy:4,honor:2,them:{type:"friend",op:30}},
          },
          {
            t: "Give it back and wish him well",
            r: "He goes home with his gift and a story about you.",
            fx: {honor:3,fame:1,them:{type:"friend",op:40}},
          },
          {
            t: "Ask for coin instead",
            r: "He pays, in pennies, over a year. He goes to the herbwife next time.",
            fx: {coin:5,honor:-2},
          },
        ],
      }, (p,C)=>C.prof(p,"medicine",50)),
      D(["healer"], {
        id: "ln_d_heal_sick",
        w: .8,
        cool: 8,
        title: "The healer's fever",
        text: "You have sat with the sick all winter. Now the cough is in your own chest and the fever in your own head, and there is nobody in {home} who knows more about it than you, which is not saying much tonight.",
        choices: [
          {
            t: "Do what you tell others: rest, broth, warmth",
            check: {s:"medicine",s2:"sta",d:45},
            win: {
              r: "A week in bed, and you rise thin and furious with yourself. It passes.",
              fx: {health:-6,cause:"a winter fever",wil:.5,skill:{medicine:2}},
            },
            lose: {r:"It takes a month and something of your lungs.",fx:{health:-18,cause:"a winter fever",wil:1.5}},
          },
          {
            t: "Keep working; they need you",
            check: {s:"sta",s2:"wil",d:55},
            win: {
              r: "You see every patient and collapse on Lantern Night. They talk about it for years.",
              fx: {rep:4,health:-10,cause:"a winter fever",wil:1.5},
            },
            lose: {
              r: "You pass the fever to three patients before you fall.",
              fx: {health:-20,cause:"a winter fever",rep:-3,wil:1},
            },
          },
        ],
      }, (p,C)=>C.prof(p,"medicine",55)),
      D(["healer"], {
        id: "ln_d_heal_child",
        w: 1,
        title: "The neighbor's child",
        setup: (p,ctx)=>{ctx.what=A.pick(["choking on a plum stone","scalded by a pot of boiling water","fallen from the mill roof and lying very still","blue and coughing like a barking dog"])},
        text: "A woman runs screaming down the lane with her child in her arms: the boy is {what}. She runs to your door because everybody knows you are the one who knows.",
        choices: [
          {
            t: "Act now",
            check: {s:"medicine",s2:"ins",d:45},
            win: {
              r: "Quick hands and a calm voice. The boy cries, which is the best sound in the world. His mother tells the whole street.",
              fx: {fame:1,honor:3,skill:{medicine:2},newRel:{type:"friend",op:40}},
            },
            lose: {r:"You do everything right, and it is not enough. You carry that home.",fx:{wil:2,happy:-10}},
          },
          {
            t: "Send for the herbwife; she has seen more of this",
            r: "She comes running, and you help. Between you, the boy lives.",
            fx: {honor:1,skill:{medicine:1}},
          },
        ],
      }, (p,C)=>C.prof(p,"medicine",45)),
    ]);
    A.defEvents([
      O(["clergy"], {
        id: "ln_cl_novice_test",
        maxRank: 0,
        young: !0,
        w: 1.4,
        title: "The test before the vows",
        setup: (p,ctx)=>{ctx.prior=fw(p).prior},
        text: "Before a novice may be made a Keeper, the {prior} sets a test. This year there are three to choose from: sit up with the dying in the infirmary for a season, copy the year's calendar without a single blot, or carry the alms to the outlying farms through the winter.",
        choices: [
          {
            t: "Sit with the dying",
            check: {s:"wil",s2:"faith",d:40},
            win: {
              r: "You hold hands that go cold in yours, night after night, and you do not run. The {prior} lays a hand on your head.",
              fx: up({piety:5,wil:1.5,skill:{faith:2,medicine:1}}),
            },
            lose: {
              r: "On the fortieth night you fall asleep at a deathbed. You will try again next year.",
              fx: {piety:2,wil:1},
            },
          },
          {
            t: "Copy the calendar",
            check: {s:"learning",s2:"int",d:40},
            win: {
              r: "Every feast and fast in a clean hand. The {prior} keeps your copy for the house.",
              fx: up({skill:{learning:3},literate:!0}),
            },
            lose: {r:"A blot on Ash Night, of all days. Next year.",fx:{skill:{learning:1}}},
          },
          {
            t: "Carry the alms through the snow",
            check: {s:"sta",s2:"faith",d:40},
            win: {
              r: "Every farm, every week, through drifts to the knee. The farmers start calling you by name.",
              fx: up({sta:1,piety:3,honor:2}),
            },
            lose: {r:"You turn back from the high farms twice. They notice.",fx:{sta:.5,wil:1}},
          },
        ],
      }),
      O(["clergy"], {
        id: "ln_cl_tithe",
        minRank: 1,
        maxRank: 2,
        w: 1.2,
        title: "The tithe in a bad year",
        setup: (p,ctx)=>{ctx.tithe=fw(p).tithe,ctx.see=fw(p).see,who(p,ctx,"a widow with one sack of barley",{sex:"F",ageAdj:45}),setFee(p,ctx,.15)},
        text: "The harvest of {home} came in a third short. Your superiors expect {tithe}, in full, for there is a roof to mend and a bishop's nephew to keep. {them} has one sack of barley left, and four children.",
        choices: [
          {
            t: "Collect it all, as you are bound to",
            r: "You collect it all. The roof is mended. You do not visit {them} again that winter.",
            fx: {rep:4,perf:5,honor:-4,happy:-3},
          },
          {
            t: "Forgive the poorest their share",
            r: 'You write "remitted for hunger" beside six names. Your superiors are cold. The village is not.',
            fx: {honor:4,piety:3,rep:-3,them:{type:"friend",op:40}},
          },
          {
            t: "Collect it all, and keep a little back for yourself",
            check: {s:"deception",s2:"stewardship",d:45},
            win: {
              r: "The tally balances, more or less. Your purse is heavier and your prayers are lighter.",
              fx: earn(2,{honor:-6,piety:-4}),
            },
            lose: {
              r: "The visitor from the {see} counts the tally sticks twice.",
              fx: {rep:-10,piety:-5,honor:-6,perf:-10},
            },
          },
        ],
      }),
      O(["clergy"], {
        id: "ln_cl_heresy",
        minRank: 1,
        w: 1.1,
        cool: 6,
        title: "The heretic",
        setup: (p,ctx)=>{const f=fw(p);ctx.heretic=f.heretic,ctx.heresy=f.heresy,ctx.pen=f.pen,who(p,ctx,"an accused "+f.heretic)},
        text: "A {heretic} is brought before the court of the faith: {them}, who teaches {heresy}. You are asked to sit on the bench and question {themHim}. {pen}",
        choices: [
          {
            t: "Prosecute with the full weight of the faith",
            check: {s:"faith",s2:"learning",d:50},
            win: {
              r: "You take {themHim} apart point by point. The court condemns {themHim}, and your superiors note your zeal.",
              fx: {rep:8,piety:3,honor:-2,skill:{faith:3},them:{type:"enemy",op:-40}},
            },
            lose: {
              r: "{them} answers better than you ask. The court is embarrassed, and so are you.",
              fx: {rep:-4,them:{type:"rival",op:-10}},
            },
          },
          {
            t: "Question honestly, and let the answers decide",
            check: {s:"learning",s2:"int",d:55},
            win: {
              r: "You find {themHim} more confused than wicked. Penance and silence, instead of the worst. {them} weeps.",
              fx: {honor:4,rep:2,them:{type:"friend",op:30}},
            },
            lose: {
              r: "The bench thinks you went soft. They condemn {themHim} anyway, and watch you.",
              fx: {rep:-4,honor:2},
            },
          },
          {
            t: "Study the heretic's teaching in private first",
            r: p=>p.faith==="REL-01"?"Columns of numbers in the heretic's papers, star by star. The arithmetic is not mad. The papers burn; you cannot unread them.":"Most of it is muddle. One part is not. You say nothing, and keep that part in your head.",
            fx: {int:1,skill:{learning:3},piety:-3,flag:"ln_read_heresy"},
          },
        ],
      }),
      O(["clergy"], {
        id: "ln_cl_saint",
        minRank: 2,
        w: 1,
        cool: 6,
        title: "The bones of a saint",
        setup: (p,ctx)=>{ctx.bishop=fw(p).bishop,setFee(p,ctx,.25),ctx.saint=A.givenName(p.cult,A.chance(.5)?"M":"F")},
        text: "The village of {town} has dug up a saint: old bones under the chapel floor that smell of roses. A lame girl has walked, a blind man sees a little, and the pilgrims have started coming. The {bishop} sends you to judge whether Saint {saint} is holy, or somebody is clever.",
        choices: [
          {
            t: "Certify the miracle",
            r: "A shrine is built, the pilgrims come, and the offerings flow to your house. Saint {saint} is very good for business.",
            fx: earn(2,{rep:4,fame:2,piety:1}),
          },
          {
            t: "Investigate quietly",
            check: {s:"learning",s2:"int",d:55},
            win: {
              r: "Pig bones under rose oil, bought from a relic-seller at the fair. The village priest weeps when you show him. The lame girl still walks.",
              fx: {honor:4,rep:6,int:1,newRel:{type:"enemy",op:-30}},
            },
            lose: {r:"You find nothing false. Perhaps there is nothing to find.",fx:{piety:3,rep:1}},
          },
          {
            t: "Certify it, and take the first year's offerings for your house",
            r: "The house roof is new by autumn. So is your cloak.",
            fx: earn(4,{honor:-4,rep:3,piety:-2}),
          },
        ],
      }),
      O(["clergy"], {
        id: "ln_cl_bishop",
        minRank: 2,
        maxRank: 2,
        minRep: 50,
        time: 2,
        w: 1.2,
        cool: 6,
        title: "The vacant see",
        setup: (p,ctx)=>{const f=fw(p);ctx.bishop=f.bishop,ctx.see=f.see,who(p,ctx,"a nobleman's son in holy orders",{status:"gentry",sex:"M"}),setFee(p,ctx,.3),ctx.how=p.realm==="POL-01"&&p.faith==="REL-03"?"In Aldmark the Emperor names the High Hall-Keeper; the halls only advise him.":"The chapter will vote at the next new moon."},
        text: "The {bishop} of your {see} is dead. {how} Your name is spoken. So is the name of {them}, a nobleman's son with a soft voice and a hard purse.",
        choices: [
          {
            t: "Campaign: gifts, dinners, promises",
            check: {s:"intrigue",s2:"diplomacy",d:55},
            win: {
              r: "A cask here, a benefice promised there. The vote is close, and yours.",
              fx: spend(1,up({rep:8,honor:-3,them:{type:"rival",op:-30}})),
            },
            lose: {
              r: "His purse is harder than yours. You lose, and you are poorer.",
              fx: spend(1,{rep:-5,them:{type:"rival",op:-20}}),
            },
          },
          {
            t: "Preach and pray, and let them judge your life",
            check: {s:"faith",s2:"wil",d:60},
            win: {
              r: "You do nothing but your work. On the day, the old men vote for the one who never asked them. You are {bishop}.",
              fx: up({piety:5,rep:10,fame:3,honor:3}),
            },
            lose: {
              r: "Holiness does not win elections. He does. You go back to your work, which is what you wanted, almost.",
              fx: {rep:2,piety:2,wil:1},
            },
          },
          {
            t: "Withdraw for him, in exchange for a rich priory",
            r: "He is made {bishop}. You are given the richest house in the {see} and his gratitude, for what it is worth.",
            fx: earn(2.5,{rep:2,them:{type:"friend",op:30}}),
          },
          {
            t: "Ask {ruler} to speak for you",
            check: {s:"etiquette",s2:"persuasion",d:55},
            win: {
              r: "A royal letter arrives at the chapter the night before the vote. Nobody needs to read it twice.",
              fx: up({favor:5,honor:-2,rep:4}),
            },
            lose: {
              r: "The sovereign does not meddle in the faith, the sovereign says, and remembers that you asked.",
              fx: {rep:-6,favor:-5},
            },
          },
        ],
      }),
      O(["clergy"], {
        id: "ln_cl_patriarch",
        minRank: 3,
        maxRank: 3,
        minRep: 65,
        time: 3,
        w: 1.2,
        cool: 8,
        title: "The great election",
        setup: (p,ctx)=>{const f=fw(p);setFee(p,ctx,.25),ctx.how=p.faith==="REL-01"?"The High Luminary is dead. The Luminaries gather in the Needle Court at Solenne; two-thirds must agree, only celibate priests of forty or more may stand, and the new High Luminary is crowned on the next Sunday at noon.":p.faith==="REL-02"?"The Patriarch of Dawn is dead. The lesser patriarchs gather at Velgrad, under the cathedral where kings are crowned.":p.faith==="REL-06"?"The search monks have not found the reborn abbot, and the Stair needs a Steward to rule until they do.":"The eldest voice of "+(A.faith(p.faith)?/^The /.test(A.faith(p.faith).name)?A.faith(p.faith).name.replace(/^The /,"the "):"the "+A.faith(p.faith).name:"the faith")+" is silent, and those who speak for the faith in every realm gather to choose another.",ctx.head=p.faith==="REL-06"?"Steward of the White Stair":f.head||"head of the faith"},
        text: "{how} You are one of three names that matter.",
        choices: [
          {
            t: "Stand, and let the votes fall",
            check: {s:"faith",s2:"diplomacy",d:65},
            win: {
              r: "Smoke, chant, and a long silence; then your name, read out twice. You kneel a bishop and rise {head}.",
              fx: up(both({fame:8,rep:15,piety:5},deed("Chosen {head}"))),
            },
            lose: {
              r: "You fall a handful of votes short. The winner embraces you, and remembers who voted for you.",
              fx: {rep:3,wil:2},
            },
          },
          {
            t: "Buy the votes you lack",
            check: {s:"intrigue",s2:"trade",d:60},
            win: {
              r: "Every bishop has a debt, a nephew or a leaking roof. You fix them all. You are {head}, and you know exactly what it cost.",
              fx: spend(4,up(both({fame:6,honor:-10,rep:8},deed("Chosen {head}")))),
            },
            lose: {
              r: "A bribed bishop talks. The scandal follows you home and sits in your chair.",
              fx: spend(3,{rep:-15,honor:-10,piety:-5}),
            },
          },
          {
            t: "Make the kingmaker's bargain",
            r: "You swing your followers behind the likeliest man at the right moment. He is grateful in the ways that count.",
            fx: earn(3,{rep:5,newRel:{type:"friend",op:40}}),
          },
        ],
      }),
      O(["clergy"], {
        id: "ln_cl_unlight",
        minRank: 3,
        time: 2,
        w: .9,
        cool: 10,
        title: "To unlight a sovereign",
        cond: p=>p.faith==="REL-01"||p.faith==="REL-02",
        setup: (p,ctx)=>{ctx.head=fw(p).head,ctx.grab=A.pick(["seized the faith's lands in the river valley","taxed the monasteries to pay the army","imprisoned a bishop who preached against him","married his cousin against the faith's law"])},
        text: "{ruler} has {grab}. The {head} means to unlight the sovereign — excommunicate, and free every subject from the oath of loyalty — and wants every bishop's seal on the decree. Yours is the last.",
        choices: [
          {
            t: "Seal it",
            r: "Your seal goes on with the rest. In a week the realm is full of lords who remember old grudges and new freedoms.",
            fx: {stability:-6,favor:-25,piety:5,rep:8,fame:3,honor:2},
          },
          {
            t: "Refuse, and stand with the crown",
            r: "The {head} writes you a letter you will not show anyone. {ruler} sends a gold cup.",
            fx: {favor:12,rep:-8,piety:-3,coin:60},
          },
          {
            t: "Ride between them and make a peace",
            check: {s:"diplomacy",s2:"faith",d:60},
            win: {
              r: "Three months on the road between palace and see. The crown gives back half; the faith forgets the rest. Both sides claim the victory and thank you in private.",
              fx: {rep:12,favor:6,fame:4,stability:2,skill:{diplomacy:3}},
            },
            lose: {
              r: "You please neither. The decree goes out without you, and the crown thinks you plotted it.",
              fx: {rep:-4,favor:-10,stability:-3},
            },
          },
        ],
      }),
      O(["clergy"], {
        id: "ln_cl_funeral",
        minRank: 1,
        maxRank: 3,
        w: 1.1,
        title: "A great funeral",
        setup: (p,ctx)=>{pickHouse(p,ctx),ctx.bury=buryOf(p),setFee(p,ctx,.3)},
        text: "The old head of {house} is dead, and must be {bury}. His will asks for a plain rite and the cost given to the poor. His heir wants a funeral that will make every other house in the realm feel small, and will pay the officiant accordingly.",
        choices: [
          {
            t: "Do as the dead man asked",
            r: "A plain rite, and bread for three hundred at the gate. The heir sulks. The poor of {seat} remember.",
            fx: both(earn(.5,{honor:4,piety:3,rep:3}),hp(-5)),
          },
          {
            t: "Do as the heir pays",
            r: "Banners, choirs, a feast for the whole valley. It is the funeral of the decade, and you are well paid for it.",
            fx: both(earn(2,{honor:-2,fame:1}),hp(8)),
          },
          {
            t: "Persuade the heir to do both",
            check: {s:"persuasion",s2:"faith",d:45},
            win: {
              r: "A great rite, and great alms. The heir looks generous and pious at once, and pays you for the idea.",
              fx: both(earn(1.5,{honor:2,rep:5}),hp(10)),
            },
            lose: {r:"The heir hears a lecture and orders more banners.",fx:earn(1,{rep:-1})},
          },
        ],
      }),
      O(["clergy"], {
        id: "ln_cl_seal",
        minRank: 1,
        w: 1,
        cool: 6,
        title: "Under the seal",
        setup: (p,ctx)=>{who(p,ctx,"a penitent with a knife in his belt",{sex:"M"}),ctx.target=A.pick(["the reeve who hanged his brother","his wife's lover, a tanner of the lower town","the lord's steward","the moneylender of the bridge"])},
        text: "{them} kneels before you and confesses, not a sin done, but one planned: he means to kill {target} on {festival} night. Then he rises, takes his blessing, and goes.",
        choices: [
          {
            t: "Keep the seal; pray for them both",
            r: "You keep it. On the feast night you pray until dawn. What happens is between him and the gods.",
            fx: {piety:4,wil:1},
          },
          {
            t: "Warn the target without naming him",
            check: {s:"intrigue",s2:"faith",d:50},
            win: {
              r: "A sermon on vengeance in the right ear, a quiet word to the right door. The feast night passes with nothing worse than a brawl.",
              fx: {honor:3,piety:1,skill:{intrigue:2}},
            },
            lose: {r:"Your warning is too plain. {them} knows who talked.",fx:{piety:-3,them:{type:"enemy",op:-50}}},
          },
          {
            t: "Tell the lord's men",
            r: "He is taken at the alehouse. The lord thanks you. Every penitent in the parish stops talking.",
            fx: {favor:5,rep:-5,honor:-2,piety:-6,them:{type:"enemy",op:-60}},
          },
        ],
      }),
      O(["clergy"], {
        id: "ln_cl_war_sermon",
        minRank: 2,
        w: 1.3,
        cool: 4,
        title: "Preach the war",
        cond: (p,C)=>C.atWar(p),
        setup: (p,ctx)=>{ctx.enemy=A.enemyRealmOf(p.realm)?A.realmShort(A.enemyRealmOf(p.realm)):"the enemy"},
        text: "{ruler} wants the faith behind the war with {enemy}. You are asked to preach on the feast day in {capital}: that the gods march with {realmShort}, that the dead go to the best of the afterlife, that the levy must answer.",
        choices: [
          {
            t: "Preach fire",
            check: {s:"faith",s2:"persuasion",d:50},
            win: {
              r: "You give them the gods and the dead and the glory, and the levy answers singing.",
              fx: {fame:3,favor:8,rep:4,piety:-1,stability:2},
            },
            lose: {r:"You preach fire to a hall of mothers. It goes badly.",fx:{rep:-3,favor:2}},
          },
          {
            t: "Preach peace instead",
            check: {s:"faith",s2:"wil",d:55},
            win: {
              r: "You preach on the widows. Half the hall weeps. The crown is furious, and the word spreads.",
              fx: {honor:5,piety:4,fame:3,favor:-12},
            },
            lose: {
              r: "The crowd jeers you down from the pulpit. The crown is still furious.",
              fx: {honor:3,favor:-10,rep:-3},
            },
          },
          {
            t: "Preach on duty and leave the gods out of it",
            r: "A careful sermon. Nobody is inspired and nobody is offended.",
            fx: {favor:2},
          },
        ],
      }),
      O(["clergy"], {
        id: "ln_cl_pilgrims",
        minRank: 1,
        maxRank: 2,
        w: 1.1,
        title: "Pilgrim season",
        setup: (p,ctx)=>{setFee(p,ctx,.2),ctx.where=p.faith==="REL-01"?"on the Sun Road to Solenne":p.faith==="REL-06"?"on the Bluespire circuit":p.faith==="REL-07"?"on the road to the Well of Samar":p.faith==="REL-02"?"on the way to see Redcrown glow":"on the old pilgrim road"},
        text: "Your shrine stands {where}, and this summer three hundred pilgrims a day crowd its yard. Pickpockets work them, relic-sellers fleece them, the well is running low, and the latrine is a scandal.",
        choices: [
          {
            t: "Organize it: water, order, beds for the sick",
            check: {s:"stewardship",s2:"logistics",d:45},
            win: {
              r: "Wardens at the gate, a second well dug, the sick in the barn. The pilgrims carry your name home along every road.",
              fx: earn(1.5,{rep:7,fame:2,skill:{stewardship:2}}),
            },
            lose: {r:"A crush at the gate on the feast day. Nobody dies, but it is close.",fx:earn(.5,{rep:-3})},
          },
          {
            t: "Let the relic-sellers pay rent",
            r: "The fake fingers of saints earn your house a new roof.",
            fx: earn(2,{honor:-3,piety:-2}),
          },
          {
            t: "Preach to them every dawn",
            check: {s:"faith",s2:"persuasion",d:45},
            win: {
              r: "They come for the shrine and stay for you. Some of them write home about it.",
              fx: {piety:3,fame:2,rep:4,skill:{faith:2}},
            },
            lose: {r:"They come for the shrine.",fx:{piety:1}},
          },
        ],
      }),
      O(["clergy"], {
        id: "ln_cl_forest",
        minRank: 2,
        w: 1,
        cool: 6,
        title: "The house's forest",
        setup: (p,ctx)=>{lordOf(p,ctx,"a new lord on the next estate"),setFee(p,ctx,.25)},
        text: "Your house owns the forest above {home}. The village has gathered deadwood and run its pigs there since anyone remembers. Now {themFull}, the new lord on the next estate, says half of it belongs to {house}, and {theirHis} men have started felling the old oaks.",
        choices: [
          {
            t: "Take it to the court with the house charters",
            check: {s:"learning",s2:"persuasion",d:55},
            win: {
              r: "The charter is older than {house} itself. The felling stops, and the oaks that fell are paid for.",
              fx: earn(1,both({rep:8,honor:2,them:{type:"enemy",op:-30}},hp(-10))),
            },
            lose: {
              r: "{them} has a better lawyer than your charter. {them} keeps the half, and the village loses its pigs' winter.",
              fx: {rep:-5,them:{type:"rival",op:-15}},
            },
          },
          {
            t: "Sell him the disputed half",
            r: "Good silver for the house. The village will not forgive you.",
            fx: earn(3,both({honor:-3,rep:-2,them:{type:"friend",op:25}},hp(10))),
          },
          {
            t: "Stand with the village in front of the axes",
            check: {s:"wil",s2:"faith",d:50},
            win: {
              r: "The axemen will not cut down a priest with a hundred villagers behind him. The felling stops. The story spreads.",
              fx: {fame:3,honor:5,piety:3,rep:5,them:{type:"enemy",op:-40}},
            },
            lose: {
              r: "They push you aside. You fall badly. The oaks fall anyway.",
              fx: {health:-10,cause:"a fall among the axemen",wil:1.5,honor:3},
            },
          },
        ],
      }),
      O(["clergy"], {
        id: "ln_cl_capital_sermon",
        minRank: 1,
        minRep: 35,
        w: 1,
        cool: 5,
        title: "A sermon in the capital",
        text: "You have been asked to preach on the great feast day in {capital}, before {ruler} and the whole court. Every word will be repeated in every hall by evening. Some will be repeated in the wrong ones.",
        choices: [
          {
            t: "Preach comfort to the poor",
            check: {s:"faith",s2:"persuasion",d:50},
            win: {
              r: "The servants in the back weep. So does one old duke. Your name goes round the city.",
              fx: {rep:8,fame:3,piety:3},
            },
            lose: {r:"It is a good sermon, and the court talks through it.",fx:{rep:1}},
          },
          {
            t: "Preach against the greed of the great",
            check: {s:"faith",s2:"wil",d:55},
            win: {
              r: "The hall goes silent. The commons love you. The great lords do not.",
              fx: {fame:5,honor:4,rep:6,favor:-8,newRel:{type:"enemy",op:-30}},
            },
            lose: {r:"You go too far, by name. You are not asked back.",fx:{favor:-10,rep:-4}},
          },
          {
            t: "Preach the sovereign's virtues",
            r: "The sovereign has many virtues, it turns out. A gift of venison arrives the next day.",
            fx: {favor:10,honor:-2,rep:2},
          },
        ],
      }),
    ]);
    A.defEvents([
      D(["clergy"], {
        id: "ln_d_cl_pauper",
        w: 1.1,
        title: "A pauper's rite",
        setup: (p,ctx)=>{ctx.bury=buryOf(p)},
        text: "A laborer has died in the lane behind the tannery, and his family has nothing. A proper rite costs 3 suns. Without one he goes into the ground like a dog, when he should be {bury}.",
        choices: [
          {
            t: "Pay the rite yourself",
            req: p=>p.coin>=3,
            r: "You do it properly, at the proper hour. His children watch you the whole way through.",
            fx: {coin:-3,honor:3,piety:3,newRel:{type:"friend",op:30}},
          },
          {
            t: "Make his guild pay",
            check: {s:"persuasion",s2:"faith",d:45},
            win: {
              r: "The porters' guild finds the coin, grudgingly, and comes to the grave in a body.",
              fx: {honor:2,piety:2,skill:{persuasion:1}},
            },
            lose: {r:"The guild says he was behind with his dues.",fx:{piety:1}},
          },
          {
            t: "Do the short rite for nothing",
            r: "Half the words, no candles, no choir. It is something.",
            fx: {piety:1},
          },
        ],
      }),
      D(["clergy"], {
        id: "ln_d_cl_doubt",
        w: .9,
        cool: 9,
        title: "The dark night",
        text: "A summer flux in the village. You buried eleven children in nine weeks, and said the same words over each. Tonight, alone in the chapel, the words sound like nothing at all.",
        choices: [
          {
            t: "Pray until the words come back",
            check: {s:"wil",s2:"faith",d:50},
            win: {
              r: "They come back at dawn, changed. You are a better priest for it, and a sadder one.",
              fx: {piety:5,wil:2.5},
            },
            lose: {
              r: "They do not come back. You go on saying them anyway, for the mothers.",
              fx: {piety:-5,wil:2,happy:-5},
            },
          },
          {
            t: "Go and sit with the mothers instead",
            r: "You say almost nothing. They do not need you to.",
            fx: {wil:1.5,honor:2,piety:2},
          },
          {t:"Drink",r:"It works, for a night.",fx:{happy:2,piety:-2,health:-2}},
        ],
      }),
      D(["clergy"], {
        id: "ln_d_cl_festival",
        w: 1,
        title: "A feast day's work",
        setup: (p,ctx)=>{const fs=A.faith(p.faith)&&A.faith(p.faith).festivals?String(A.faith(p.faith).festivals).split(";").map(x=>x.split("(")[0].trim()).filter(x=>x.length>3):[];ctx.f=A.cap(fs.length?A.pick(fs):"the great feast")},
        text: "{f} again. Two rites before dawn, a procession at noon, a feast where you must bless forty dishes and eat none of them, and a drunk lord who wants to confess at midnight.",
        choices: [
          {
            t: "Do it all, with a whole heart",
            check: {s:"sta",s2:"faith",d:40},
            win: {r:"The village has the best feast in years and gives you the credit.",fx:{piety:3,rep:3,sta:.5}},
            lose: {
              r: "You fall asleep during the lord's confession. He takes it well.",
              fx: {piety:1,health:-3,cause:"exhaustion"},
            },
          },
          {
            t: "Hand the procession to your deacon",
            r: "The deacon drops the image in the river. It floats. Some say that is a miracle.",
            fx: {happy:2,rep:-1},
          },
        ],
      }),
      D(["clergy"], {
        id: "ln_d_cl_gift",
        w: .9,
        title: "A gift at the door",
        setup: (p,ctx)=>{who(p,ctx,"a rich parishioner",{status:"merchant",sex:"M"}),ctx.sin=A.pick(["sells short weight","keeps a second family across the river","lends at twenty in a hundred","beats his apprentices"])},
        text: `{them}, who everybody knows {sin}, leaves a purse of 30 suns on your table "for the poor", and asks whether next Sunday's sermon really needs to be about the thing you said it would be about.`,
        choices: [
          {
            t: "Take the purse and preach as you planned",
            r: "The poor eat. {them} sits in the front row with a face like a slammed door.",
            fx: {honor:4,piety:2,them:{type:"enemy",op:-30}},
          },
          {
            t: "Take the purse and change the sermon",
            r: "You preach on the weather. The poor eat anyway. You do not feel well.",
            fx: {coin:30,honor:-4,piety:-3,them:{type:"friend",op:20}},
          },
          {
            t: "Hand the purse back",
            r: "He takes it back, and his business, to the next parish.",
            fx: {honor:2,piety:1},
          },
        ],
      }),
    ]);
    const giftNote = ctx=>({well:"At a Well court, wine is an insult: they flog drunkards at the well they shamed.",orc:"Among the orcs a gift is counted in horses, and refusing their food is worse than any insult.",deep:"The dwarves weigh every gift, and a gift of poor steel is remembered for three hundred years.",elf:"The elves will not touch a gift of cut timber, and are not impressed by gold.",north:"In the Halls, a gift of horse-meat would be sacrilege; a good horse is a king's gift.",sun:"The Temple courts like books, relics and anything that shines at noon.",east:"The Dawn courts prize furs, wax and icons painted in the Eastfolk way."})[ctx.destLaw]||"Every court has its own idea of an insult.";
    A.defEvents([
      O(["envoy"], {
        id: "ln_env_defiance",
        maxRank: 1,
        w: 1.2,
        title: "A herald's word",
        setup: (p,ctx)=>{lordOf(p,ctx,"a defiant lord"),ctx.msg=A.pick(["to pay the tax owed or answer for it in arms","to give up the outlaw he is sheltering","to come to court and kneel by Midsummer","to pull the house's men back from the royal forest"])},
        text: "You ride to {seat} in the tabard of {realmShort} to tell {themFull}, word for word, {msg}. A herald's person is sacred in every court of the Sunlands and the North. That has not stopped every lord.",
        choices: [
          {
            t: "Deliver it word for word, chin up",
            check: {s:"wil",s2:"etiquette",d:45},
            win: {
              r: "You say it all, in the hall, before the whole household, and walk out unhurried. The court hears how you did it.",
              fx: {rep:5,favor:3,fame:1,wil:.5,them:{type:"rival",op:-15}},
            },
            lose: {
              r: "{them} has you thrown in the moat. You climb out with your tabard and your dignity, mostly.",
              fx: {health:-5,cause:"a moat",rep:2,wil:1,them:{type:"enemy",op:-20}},
            },
          },
          {
            t: "Soften the words a little",
            check: {s:"diplomacy",s2:"int",d:45},
            win: {
              r: "{them} hears a way out, takes it, and comes to terms. Your liege never needs to know how.",
              fx: {rep:6,favor:4,skill:{diplomacy:2}},
            },
            lose: {r:"Word gets back that you changed the crown's words.",fx:{favor:-8,rep:-4}},
          },
          {
            t: "Sharpen them, for your liege's glory",
            r: "{them} goes red, then white, and draws.",
            fx: {
              fame: 2,
              favor: 3,
              duel: {
                tier: 2,
                foe: "them",
                opts: {kind:"duel",place:"the lord's hall",lethal:!1,toYield:!0,title:"A herald's word"},
              },
            },
          },
        ],
      }),
      O(["envoy"], {
        id: "ln_env_border",
        minRank: 1,
        w: 1.2,
        cool: 5,
        title: "The border treaty",
        setup: (p,ctx)=>{setDest(p,ctx),setFee(p,ctx,.2)},
        text: "The tolls and the fords between {realmShort} and {dest} have been argued since your grandfather's day. You ride to {destCap} with two clerks, a chest of gifts, and a map nobody on either side agrees with.",
        choices: [
          {
            t: "Trade the ford for the toll",
            check: {s:"diplomacy",s2:"int",d:50},
            win: {
              r: "They take the ford, you take the toll, and both sides sign at noon. The treaty bears your name in the margin.",
              fx: earn(1,both(rel(10),{rep:8,favor:6,skill:{diplomacy:3}})),
            },
            lose: {
              r: "Six weeks of talk and nothing signed. Their chancellor thinks you weak.",
              fx: both(rel(-5),{rep:-3}),
            },
          },
          {
            t: "Hold out for everything",
            check: {s:"intimidation",s2:"diplomacy",d:60},
            win: {
              r: "They give way on both. They will not forget it, and neither will your sovereign.",
              fx: earn(1,both(rel(-3),{favor:12,rep:6,fame:2})),
            },
            lose: {r:"They walk out. The border garrisons double that summer.",fx:both(rel(-10),{favor:-6,rep:-4})},
          },
          {
            t: "Bribe their chancellor",
            check: {s:"intrigue",s2:"trade",d:50},
            win: {
              r: "A chest of silver changes hands in a bathhouse. The treaty is generous.",
              fx: both(rel(6),{rep:5,honor:-3,favor:5}),
            },
            lose: {
              r: "Their chancellor is honest, or better paid. You are sent home early.",
              fx: both(rel(-8),{rep:-6,favor:-4}),
            },
          },
        ],
      }),
      O(["envoy"], {
        id: "ln_env_marriage",
        minRank: 2,
        minRep: 45,
        time: 2,
        w: 1,
        cool: 8,
        title: "A marriage between crowns",
        setup: (p,ctx)=>{setDest(p,ctx,"friendly");const r=RM(p),h=r&&r.heir?A.P(r.heir):null;ctx.heir=h&&h.alive?A.fullName(h):"a child of the royal house",setFee(p,ctx,.3)},
        text: "{ruler} wants {heir} married into the house of {destRuler}. You are to settle the dowry, the faith of the children, the new consort's household and the border it all pays for. Their side has sent a negotiator who has made four royal marriages and broken two.",
        choices: [
          {
            t: "A fair match, fairly made",
            check: {s:"diplomacy",s2:"etiquette",d:55},
            win: {
              r: "Rings exchanged by proxy at {destCap}, bells in two capitals, and a treaty of friendship folded inside the marriage contract.",
              fx: earn(1,both(rel(20),{favor:12,rep:10,fame:4},deed("Made the marriage between {realmShort} and {dest}"))),
            },
            lose: {
              r: "The talks founder on the faith of the children. The match goes elsewhere.",
              fx: both(rel(-5),{rep:-4,favor:-3}),
            },
          },
          {
            t: "Squeeze a bigger dowry",
            check: {s:"trade",s2:"diplomacy",d:60},
            win: {
              r: "A dowry the treasury will feel for a generation. Your sovereign laughs out loud reading it.",
              fx: earn(1,both(rel(8),tre(3e3),{favor:15,rep:8,fame:2},deed("Made the marriage between {realmShort} and {dest}"))),
            },
            lose: {
              r: "They call you a horse-trader to your face and break off the match.",
              fx: both(rel(-10),{favor:-5,rep:-5}),
            },
          },
          {
            t: "Slip a secret clause into the contract",
            check: {s:"intrigue",s2:"learning",d:60},
            win: {
              r: "If the bride bears no son, a castle and a river pass to {realmShort}. Nobody on their side reads the Old Solen of the sixth page carefully enough.",
              fx: earn(1.5,both(rel(10),{favor:20,honor:-4,rep:6,flag:"ln_clause"})),
            },
            lose: {
              r: "Their chancellor reads the sixth page twice. The match is off and the story is everywhere.",
              fx: both(rel(-20),{favor:-10,rep:-10,fame:1}),
            },
          },
        ],
      }),
      O(["envoy"], {
        id: "ln_env_insult",
        minRank: 1,
        w: 1.1,
        cool: 5,
        title: "Seated below the salt",
        setup: (p,ctx)=>{setDest(p,ctx)},
        text: "At the feast in {destCap} you are seated below the envoy of a mere prince, between the jugglers and a bishop's nephew. Under the roll of precedence the envoy of a king stands before the envoy of a prince. {destRuler} watches to see what {realmShort} will swallow.",
        choices: [
          {
            t: "Quote the precedence rolls, politely, at length",
            check: {s:"etiquette",s2:"learning",d:50},
            win: {
              r: "Rung by rung, treaty by treaty, in a pleasant voice. The steward moves you. The prince's envoy moves down. The court enjoys it enormously.",
              fx: both(rel(2),{rep:6,fame:2,favor:4,skill:{etiquette:3}}),
            },
            lose: {
              r: "You cite a treaty that was superseded in 1060. The jugglers laugh loudest.",
              fx: {rep:-3,happy:-3},
            },
          },
          {
            t: "Smile, and eat",
            check: {s:"wil",s2:"diplomacy",d:40},
            win: {
              r: "You eat well and laugh at the jugglers. By the third day they are embarrassed, and give you what you came for.",
              fx: both(rel(4),{wil:1,rep:3}),
            },
            lose: {r:"The hawks at home hear you swallowed it.",fx:both(rel(2),{favor:-4,wil:1})},
          },
          {
            t: "Walk out of the hall",
            r: "You rise, bow to the throne and leave. In {realmShort} they toast you. In {dest} they remember.",
            fx: both(rel(-10),{favor:6,fame:2}),
          },
          {
            t: "Challenge the prince's envoy",
            req: (p,C)=>C.prof(p,"sword",35)||C.prof(p,"dagger",35),
            r: "In the yard at dawn, with blunted blades and half the court watching.",
            fx: both(rel(-4), {
              fame: 3,
              duel: {
                tier: 2,
                title: "a prince's envoy",
                opts: {kind:"duel",place:"the palace yard",lethal:!1,toYield:!0,title:"Seated below the salt"},
              },
            }),
          },
        ],
      }),
      O(["envoy"], {
        id: "ln_env_hostage",
        minRank: 1,
        w: 1,
        cool: 6,
        title: "The hostage",
        setup: (p,ctx)=>{setDest(p,ctx),who(p,ctx,"a hostage of royal blood",{status:"royal",ageAdj:13})},
        text: "{them}, a child of the royal house of {dest}, has been a hostage at {capital} for three years under a truce. Now {theyHe} is sick with grief, and {theirHis} mother writes — not to your sovereign, but to you.",
        choices: [
          {
            t: "Argue for an early release",
            check: {s:"diplomacy",s2:"persuasion",d:55},
            win: {
              r: "You win the council round: a hostage who dies is worse than none. {them} goes home with your letter in {theirHis} sleeve.",
              fx: both(rel(8),{rep:6,honor:3,favor:-2,them:{type:"friend",op:50}}),
            },
            lose: {
              r: "The council will not hear of it. You visit {themHim} every week instead.",
              fx: {honor:2,them:{type:"friend",op:25}},
            },
          },
          {
            t: "Keep {themHim} well, and teach {themHim} your realm's ways",
            r: "Riding lessons, books, your own table on feast days. One day {them} will rule something, and remember.",
            fx: {honor:2,skill:{diplomacy:2},them:{type:"student",op:40,back:"mentor"}},
          },
          {
            t: "Use {themHim} to squeeze {theirHis} family",
            check: {s:"intrigue",s2:"deception",d:50},
            win: {
              r: "A letter in the child's hand, under your eye. The toll on the river is halved within the month.",
              fx: both(rel(-6),{favor:8,honor:-5,rep:3,them:{type:"enemy",op:-40}}),
            },
            lose: {
              r: "The mother sees through it, and so does every court she writes to.",
              fx: both(rel(-12),{rep:-6,honor:-5}),
            },
          },
        ],
      }),
      O(["envoy"], {
        id: "ln_env_peace",
        minRank: 2,
        minRep: 45,
        time: 2,
        w: 2,
        cool: 3,
        title: "Terms of peace",
        cond: p=>!!leadWar(p),
        setup: (p,ctx)=>{const w=leadWar(p),foe=w?w.leadA===p.realm?w.leadD:w.leadA:null;if(ctx.war=w?w.name:"the war",foe&&A.realm(foe)){const r=A.realm(foe);ctx.destId=r.id,ctx.dest=/^(Amber Isles|Sand Clans|Nine Winds|Tusk Clans)$/.test(r.short)?"the "+r.short:r.short,ctx.destCap=r.capital||r.short}else ctx.destId="",ctx.dest="the enemy",ctx.destCap="the enemy camp";setFee(p,ctx,.3)},
        text: "{war} has cost {realmShort} a harvest and a generation of sons. {ruler} sends you under a white banner to {destCap} to end it, if it can be ended. Their ministers will meet you in a tent between the armies.",
        choices: [
          {
            t: "A white peace: nothing gained, nothing lost",
            check: {s:"diplomacy",s2:"etiquette",d:60},
            win: {
              r: "Nine days in the tent. On the tenth, two seals on one parchment, and the armies go home for the harvest.",
              fx: earn(1,both((p,ctx)=>{const w=leadWar(p);return w&&A.endWar(w,"white",`${w.name} ends in a peace made by envoys: nothing changes hands but the graves.`),""},{rep:15,fame:6,favor:10,stability:3},deed("Made the peace that ended {war}"))),
            },
            lose: {r:"They send you back with the white banner torn. The war goes on.",fx:{rep:-5,favor:-3,wil:1}},
          },
          {
            t: "Peace, bought with a bribe to their marshal",
            check: {s:"intrigue",s2:"trade",d:55},
            win: {
              r: "Their marshal discovers that his men are tired and his treasury empty. Peace by Midsummer.",
              fx: earn(1,both((p,ctx)=>{const w=leadWar(p);return w&&A.endWar(w,"white",`${w.name} ends in a sudden peace, and nobody asks too loudly why.`),""},{rep:10,favor:12,honor:-3},deed("Bought the peace that ended {war}"))),
            },
            lose: {
              r: "The marshal takes the gold and tells his sovereign everything.",
              fx: both(rel(-10),{rep:-8,favor:-8}),
            },
          },
          {
            t: "Spin the talks out while your army regroups",
            check: {s:"deception",s2:"diplomacy",d:50},
            win: {
              r: "Six weeks of courteous nothing. Your marshal gets his reinforcements.",
              fx: {favor:10,rep:4,honor:-2},
            },
            lose: {
              r: "They realise what you are doing and break off. Their next attack comes faster.",
              fx: both(rel(-10),{rep:-6,favor:-4}),
            },
          },
        ],
      }),
      O(["envoy"], {
        id: "ln_env_cipher",
        minRank: 1,
        w: 1,
        cool: 6,
        title: "The second letter",
        setup: (p,ctx)=>{setDest(p,ctx,"rival"),who(p,ctx,"a chancery clerk of "+(ctx.dest||"a foreign court")),setFee(p,ctx,.2)},
        text: "{them}, a clerk of the chancery at {destCap}, finds you at the bathhouse. For {pay} {theyHe} will sell you the key to their cipher. {them} is either a traitor or bait.",
        choices: [
          {
            t: "Buy it",
            check: {s:"intrigue",s2:"ins",d:55},
            win: {
              r: "It is real. For a season your sovereign reads {dest}'s letters before their own ambassadors do.",
              fx: spend(1,{favor:15,rep:6,skill:{intrigue:3},them:{type:"friend",op:20}}),
            },
            lose: {
              r: "It was bait. Their guards are waiting outside the bathhouse. You are expelled in your shirt.",
              fx: spend(1,both(rel(-12),{rep:-8,favor:-5})),
            },
          },
          {
            t: "Report {themHim} to {theirHis} masters",
            r: "They thank you coldly and hang {themHim} warmly. Relations improve. You do not sleep well.",
            fx: both(rel(8),{honor:2,favor:-2,wil:.5}),
          },
          {t:"Pretend not to understand",r:"{them} shrugs and tries the envoy from the next kingdom.",fx:{}},
        ],
      }),
      O(["envoy"], {
        id: "ln_env_gifts",
        maxRank: 2,
        w: 1.1,
        title: "Gifts for a foreign court",
        setup: (p,ctx)=>{setDest(p,ctx),ctx.note=giftNote(ctx)},
        text: "You must choose {ruler}'s gifts for {destRuler} from the treasury: a blooded horse, a cask of the best wine, a book in gold leaf, a falcon, a sword. {note}",
        choices: [
          {
            t: "Study their customs before you choose",
            check: {s:"learning",s2:"etiquette",d:45},
            win: {
              r: "You choose exactly right. {destRuler} keeps the gift close for years, and asks after the one who chose it.",
              fx: both(rel(6),{rep:5,favor:3,skill:{etiquette:2}}),
            },
            lose: {
              r: "You choose exactly wrong. The gift is accepted with a silence you can hear across the hall.",
              fx: both(rel(-6),{rep:-4}),
            },
          },
          {
            t: "Choose by price: the costliest thing in the treasury",
            r: "They are impressed by the cost, and puzzled by the choice.",
            fx: both(rel(2),{favor:-2}),
          },
          {
            t: "Ask their own envoy what would please",
            check: {s:"diplomacy",s2:"int",d:40},
            win: {
              r: "Their envoy tells you, and is flattered to be asked. Two friends made for the price of one gift.",
              fx: both(rel(5),{rep:4,newRel:{type:"friend",op:30}}),
            },
            lose: {
              r: "Their envoy tells you something with a straight face. It is a joke at your expense.",
              fx: both(rel(-3),{rep:-3,happy:-2}),
            },
          },
        ],
      }),
      O(["envoy"], {
        id: "ln_env_tongue",
        maxRank: 2,
        w: 1,
        cool: 5,
        title: "The interpreter",
        setup: (p,ctx)=>{setForeignTongue(p,ctx)},
        text: "Your interpreter at {destCap} is a {destLang}-speaking merchant the chancery hired cheap. Twice now their ministers have laughed at the wrong moment in a serious talk, and he will not meet your eye.",
        choices: [
          {
            t: "Speak to them in their own tongue",
            req: (p,C,ctx)=>speaks(p,ctx&&ctx.destLang),
            r: "You dismiss the interpreter mid-sentence and go on in {destLang}. Their ministers sit up straight for the first time.",
            fx: both(rel(6),{rep:6,fame:1,skill:{diplomacy:2}}),
          },
          {
            t: "Learn {destLang} yourself, fast",
            check: {s:"int",s2:"learning",d:55},
            win: {
              r: "Every evening with a tutor and a cup. In a season you can hear the lies.",
              fx: both(learnLang,{rep:4,int:.5}),
            },
            lose: {r:"You learn enough to order dinner and misunderstand a duchess.",fx:{int:.5,rep:-1}},
          },
          {
            t: "Hire a second interpreter to watch the first",
            r: "The second one is honest. The first one was paid by their treasurer. You change your tactics.",
            fx: both(rel(2),{coin:-10,rep:3}),
          },
          {
            t: "Confront him",
            check: {s:"intimidation",s2:"ins",d:50},
            win: {
              r: "He weeps and tells you who pays him. Now you have a way to send them false news.",
              fx: {favor:6,skill:{intrigue:2}},
            },
            lose: {r:"He denies everything and flees in the night with your copies.",fx:{rep:-4,favor:-3}},
          },
        ],
      }),
      O(["envoy"], {
        id: "ln_env_alliance",
        minRank: 3,
        minRep: 60,
        time: 2,
        w: 1,
        cool: 8,
        title: "The great alliance",
        setup: (p,ctx)=>{const r=setDest(p,ctx,"friendly");ctx.ok=r&&RM(p)&&!RM(p).allies.includes(r.id)?1:0,setFee(p,ctx,.2)},
        text: "{ruler} wants a sworn alliance with {dest}: armies that march when the other is attacked. A pact like that changes every war council in the Known World for a generation, and every enemy of {dest} becomes an enemy of yours.",
        choices: [
          {
            t: "Negotiate the alliance",
            check: {s:"diplomacy",s2:"int",d:60},
            win: {
              r: "Oaths on both sides, in both faiths, in both capitals. Every court in the Known World redraws its maps that winter.",
              fx: earn(1,both((p,ctx)=>{const a=RM(p),b=ctx.destId?A.realm(ctx.destId):null;return a&&b&&!a.allies.includes(b.id)&&(a.allies.push(b.id),b.allies.includes(a.id)||b.allies.push(a.id),a.rivals=a.rivals.filter(x=>x!==b.id),b.rivals=b.rivals.filter(x=>x!==a.id),A.addRel(a.id,b.id,30),A.news(`${a.name} and ${b.name} swear an alliance.`,"peace")),""},{rep:15,fame:6,favor:15},deed("Made the alliance of {realmShort} and {dest}"))),
            },
            lose: {
              r: "They want more than your sovereign will give. The talks end politely and coldly.",
              fx: both(rel(-5),{rep:-5}),
            },
          },
          {
            t: "Settle for a treaty of trade and friendship",
            check: {s:"diplomacy",s2:"trade",d:45},
            win: {
              r: "Not swords, but salt and wool and safe roads. Less glorious, and it may last longer.",
              fx: earn(1,both(rel(12),{rep:6,favor:5})),
            },
            lose: {r:"Even the trade treaty founders on the toll at the bridge.",fx:{rep:-2}},
          },
          {
            t: "Advise your sovereign against it",
            r: '"Alliances are chains," you write. Your sovereign agrees, sourly, and wonders why you were sent.',
            fx: {favor:-5,wil:.5},
          },
        ],
      }),
      O(["envoy"], {
        id: "ln_env_ransom",
        minRank: 1,
        w: 1,
        cool: 6,
        title: "A knight's ransom",
        setup: (p,ctx)=>{setDest(p,ctx,"rival"),who(p,ctx,"a captive knight",{status:"gentry"}),setFee(p,ctx,.15)},
        text: "{them}, a knight of {realmShort}, was taken in a border fight and sits in a tower at {destCap}. A knight's ransom runs about 2,000 suns. The family has scraped together 900 and sent you to get {themHim} back.",
        choices: [
          {
            t: "Haggle",
            check: {s:"trade",s2:"diplomacy",d:55},
            win: {
              r: "Nine hundred, two horses and a promise. {them} rides home beside you.",
              fx: earn(1,both(rel(3),{rep:6,them:{type:"friend",op:40}})),
            },
            lose: {
              r: "They want two thousand and they have time. {them} stays in the tower.",
              fx: {rep:-3,them:{type:"friend",op:5}},
            },
          },
          {
            t: "Offer an exchange of prisoners",
            check: {s:"diplomacy",s2:"int",d:45},
            win: {
              r: "One of theirs, rotting in your sovereign's tower, for one of yours. Both families send you a gift.",
              fx: earn(1.5,both(rel(6),{rep:5,them:{type:"friend",op:40}})),
            },
            lose: {r:"Their man died of fever last winter. Nobody told you.",fx:{rep:-2}},
          },
          {
            t: "Help {themHim} escape",
            check: {s:"stealth",s2:"intrigue",d:60},
            win: {
              r: "A rope, a bribed guard, two horses at the ford. The ballads will get it wrong, but it makes a good ballad.",
              fx: both(rel(-12),{fame:3,rep:3,them:{type:"friend",op:60}}),
            },
            lose: {
              r: "Caught on the wall. They keep you both for a year.",
              fx: both(rel(-15),{prison:1,why:"aiding a prisoner to escape",rep:-8}),
            },
          },
        ],
      }),
      O(["envoy","courtier"], {
        id: "ln_env_defector",
        minRank: 2,
        w: .9,
        cool: 8,
        title: "A knock at the embassy",
        setup: (p,ctx)=>{setDest(p,ctx,"rival"),who(p,ctx,"a lord of "+(ctx.dest||"a foreign court")+" in flight",{status:"noble"})},
        text: "Past midnight, {them}, a lord of {dest}, is at your door in {destCap} with a cloak over a fine coat and blood on {theirHis} sleeve. {them} says {theyHe} knows what {destRuler} plans for {realmShort}, and wants asylum in exchange.",
        choices: [
          {
            t: "Take {themHim} in",
            r: "You hide {themHim} under the embassy floor and smuggle {themHim} home in a wine cart. What {theyHe} knows is worth it. {dest} is not pleased.",
            fx: both(rel(-15),{favor:15,rep:6,them:{type:"friend",op:40}}),
          },
          {
            t: "Hand {themHim} back",
            r: "You call the palace guard. {destRuler} sends you a gift and a long look.",
            fx: both(rel(10),{honor:-3,favor:-4,them:{type:"enemy",op:-60}}),
          },
          {
            t: "Get {themHim} out quietly, without your name on it",
            check: {s:"stealth",s2:"intrigue",d:55},
            win: {
              r: "A fishing boat, a false name, a border crossed at dawn. Nobody can prove anything, and everyone knows something.",
              fx: {favor:10,rep:5,skill:{intrigue:3},them:{type:"friend",op:40}},
            },
            lose: {r:"The boat is searched at the river mouth.",fx:both(rel(-20),{rep:-8,favor:-5})},
          },
        ],
      }),
      O(["envoy"], {
        id: "ln_env_hand",
        minRank: 2,
        maxRank: 2,
        minRep: 60,
        time: 2,
        w: 1.3,
        cool: 5,
        title: "The chancellor's eye",
        text: "The Chancellor is old, and needs a hand: someone who can write, in a month, the truth about every court that matters to {realmShort} — who is strong, who is lying, who will be dead by spring. It is a test, and everyone knows it.",
        choices: [
          {
            t: "Write the honest report",
            check: {s:"learning",s2:"diplomacy",d:55},
            win: {
              r: "Forty pages, plain and cold. The Chancellor reads it twice and sends for you.",
              fx: up({favor:8,rep:6}),
            },
            lose: {r:"Forty pages, and the Chancellor finds three mistakes on the first.",fx:{rep:-3}},
          },
          {
            t: "Write the report the Chancellor wants to read",
            check: {s:"intrigue",s2:"persuasion",d:50},
            win: {
              r: "Every prejudice of the old man confirmed, elegantly. You have the post. You have also made a bad map.",
              fx: up({favor:4,honor:-2}),
            },
            lose: {r:"The Chancellor smells flattery. He wanted the truth after all.",fx:{rep:-5}},
          },
          {
            t: "Decline: you prefer the road",
            r: "You stay on the road, where the work is. Someone more ambitious gets the post.",
            fx: {happy:2},
          },
        ],
      }),
    ]);
    A.defEvents([
      D(["envoy"], {
        id: "ln_d_env_road",
        w: 1,
        title: "The tabard on the road",
        text: "On the road between two courts, six men with spears step out of the trees. Bandits respect a herald's tabard in the songs. These have not heard the songs.",
        choices: [
          {
            t: "Name whose word you carry, and what befalls those who stop it",
            check: {s:"intimidation",s2:"persuasion",d:45},
            win: {
              r: "They look at the arms on your tabard and fade back into the trees.",
              fx: {wil:.5,skill:{intimidation:2}},
            },
            lose: {
              r: "They take your horse, your purse and your boots, and leave you the tabard.",
              fx: {coinPct:-.3,happy:-6,wil:1.5},
            },
          },
          {
            t: "Pay the toll they ask",
            r: "Ten suns and a smile. They escort you to the next village, which is almost funny.",
            fx: {coin:-10},
          },
          {
            t: "Spur through them",
            check: {s:"riding",s2:"spd",d:50},
            win: {
              r: "A spear-shaft across your back and you are through, galloping, laughing like a fool.",
              fx: {health:-3,cause:"a bandit's spear",skill:{riding:2}},
            },
            lose: {r:"Your horse balks. They pull you down.",fx:{health:-14,cause:"bandits",coinPct:-.4,wil:1}},
          },
        ],
      }),
      D(["envoy"], {
        id: "ln_d_env_custom",
        w: 1,
        title: "A custom broken",
        setup: (p,ctx)=>{const c=A.pick([["in a Wind Rider's tent","stepped on the threshold, which is a curse on the house"],["at an orc fire","refused a second bowl of milk and blood, which is an insult to the fire"],["at a Well court","raised a cup of wine at table, where drunkenness is flogged"],["in a dwarven hall","offered your hand on a bargain instead of pouring the metal"],["at the Zanari court","spoke a dead emperor's name aloud outside a rite"],["among the elves","snapped a green branch for a walking stick"]]);ctx.where=c[0],ctx.sin=c[1]},
        text: "On your last journey abroad, {where}, you {sin}. The hall went quiet. You apologized, and they were polite, and your business there went nowhere. It still keeps you awake.",
        choices: [
          {
            t: "Study the customs of every land you visit",
            r: "You fill a whole book with taboos, gifts and forms of address. You never make that mistake again, or any like it.",
            fx: {skill:{etiquette:4,learning:2},int:.5},
          },
          {
            t: "Send a gift of apology, in their own way",
            check: {s:"etiquette",s2:"diplomacy",d:45},
            win: {
              r: "The right gift, the right words, the right day. The door opens again.",
              fx: {rep:4,skill:{etiquette:2}},
            },
            lose: {r:"The wrong gift. The door stays shut.",fx:{rep:-2}},
          },
          {t:"Shrug it off",r:"Foreigners. They will get over it.",fx:{wil:.5}},
        ],
      }, (p,C)=>C.prof(p,"diplomacy",50)||J(p,"merchant","sailor")),
      D(["envoy"], {
        id: "ln_d_env_home",
        w: .9,
        cool: 8,
        title: "Far from home",
        text: "A year abroad, and then another. Letters from home come months late and say the same things: the harvest, the roof, who has died. Tonight the foreign city outside your window is beautiful, and you are lonely in it.",
        choices: [
          {
            t: "Write home every week, whatever it costs",
            r: "You spend a fortune on couriers. The letters back are worth every coin.",
            fx: {coin:-12,happy:4,rel:{who:"spouse",op:10}},
          },
          {
            t: "Let the city in",
            check: {s:"persuasion",s2:"etiquette",d:40},
            win: {
              r: "Friends at the court, a favourite tavern, and someone whose laugh you look forward to.",
              fx: {happy:5,lover:!0},
            },
            lose: {r:"You try. They are polite. You are still a foreigner.",fx:{happy:-2,wil:1}},
          },
          {
            t: "Work until you are too tired to feel it",
            r: "You are the best-informed envoy in the city and the unhappiest.",
            fx: {rep:3,happy:-4,wil:1},
          },
        ],
      }),
      D(["envoy","courtier"], {
        id: "ln_d_env_tongue",
        w: .8,
        cool: 8,
        title: "A new tongue",
        setup: (p,ctx)=>{const opts=GD.LANG_LIST.filter(l=>!speaks(p,l)&&!["Corsair cant","Cloudfolk"].includes(l));ctx.destLang=opts.length?A.pick(opts):""},
        cond: p=>GD.LANG_LIST.some(l=>!speaks(p,l)&&!["Corsair cant","Cloudfolk"].includes(l)),
        text: "A merchant of the far coast offers to teach you {destLang} through the winter in exchange for introductions at court. Every tongue you speak is another door you do not need a key for.",
        choices: [
          {
            t: "Study hard all winter",
            check: {s:"int",s2:"learning",d:45},
            win: {r:"By spring you can argue in it, which is the only real test.",fx:both(learnLang,{int:.5})},
            lose: {r:"You can greet a king in it and nothing else.",fx:{int:.5}},
          },
          {t:"Too busy this year",r:"Maybe next winter.",fx:{}},
        ],
      }),
    ]);
    A.defEvents([
      O(["steward"], {
        id: "ln_stw_reckoning",
        maxRank: 1,
        w: 1.3,
        title: "Reckoning day",
        setup: (p,ctx)=>{pickHouse(p,ctx),who(p,ctx,"a tenant who cannot pay",{sex:"M"}),ctx.due=p.realm==="POL-01"?"the hearth tax of one mark, a share of the rye, two hens and the days owed on the lord's fields":lawOf(p)==="well"?"the water-share and the date-tithe":lawOf(p)==="orc"||p.realm==="POL-12"?"the grazing fee, the clan's share of foals and the days owed at the winter pens":"the quarter's rent, the mill fee and the days owed on the lord's fields"},
        text: "New Year's Day, when rents are reckoned in the hall at {seat}. Hearth by hearth you count what each owes: {due}. {them} stands before you with half of it and a cough, and his children waiting at the door.",
        choices: [
          {
            t: "Take his cow for the rest",
            r: "The lord's books balance. {them} walks home behind an empty byre.",
            fx: both({rep:3,perf:4,honor:-3,them:{type:"enemy",op:-30}},hp(3)),
          },
          {
            t: "Give him until the Slaughter Feast",
            r: 'You write "respited" beside his name. The lord grumbles; {them} pays in full at the Slaughter Feast, and then some.',
            fx: {honor:3,perf:-2,rep:1,them:{type:"friend",op:30}},
          },
          {
            t: "Make up the difference from your own purse",
            req: p=>p.coin>=6,
            r: "Six suns. Nobody knows but you and him. He never forgets it.",
            fx: {coin:-6,honor:4,them:{type:"friend",op:50}},
          },
        ],
      }),
      O(["steward"], {
        id: "ln_stw_querns",
        maxRank: 2,
        w: 1.1,
        title: "The hand-querns",
        setup: (p,ctx)=>{pickHouse(p,ctx),setFee(p,ctx,.1)},
        text: "The lord's mill at {seat} grinds every bushel in the valley, and takes one in sixteen for the grinding. Half the village has quietly gone back to grinding at home with hand-querns, which is against the lord's right. The miller is complaining, loudly, to the lord.",
        choices: [
          {
            t: "Break the querns, as the law allows",
            r: "Your men go house to house with hammers. The mill is busy again. The village is very quiet when you pass.",
            fx: both({rep:3,perf:5,honor:-3,newRel:{type:"enemy",op:-30}},hp(4)),
          },
          {
            t: "Cut the mill fee so they come back of their own accord",
            check: {s:"stewardship",s2:"trade",d:45},
            win: {
              r: "One in twenty-four, and the querns go back under the beds. The mill grinds more than ever, and the lord earns more.",
              fx: earn(1,both({rep:6,perf:6,skill:{stewardship:3}},hp(5))),
            },
            lose: {
              r: "The fee falls and the grinding does not rise. The lord wants to know who told you to give away his money.",
              fx: {rep:-4,perf:-6},
            },
          },
          {
            t: "Look the other way",
            r: "The miller complains to the lord, and the lord complains to you.",
            fx: {honor:1,perf:-4},
          },
        ],
      }),
      O(["steward","scribe"], {
        id: "ln_stw_old_books",
        w: 1,
        cool: 6,
        title: "The books that balance",
        setup: (p,ctx)=>{who(p,ctx,"the steward before you"),setFee(p,ctx,.2)},
        text: "The books your predecessor {them} left you balance perfectly to the penny, year after year, which is how you know they are false. Somewhere in them is a hole the size of a manor.",
        choices: [
          {
            t: "Unpick them, line by line",
            check: {s:"stewardship",s2:"learning",d:50},
            win: {
              r: "Grain sold twice, a mill that never existed, a cousin paid as a carter. The lord recovers half, and pays you a share.",
              fx: earn(1.5,{rep:8,skill:{stewardship:3},them:{type:"enemy",op:-50}}),
            },
            lose: {
              r: "You find the hole but not where it leads. The lord is unimpressed with half an answer.",
              fx: {rep:-2},
            },
          },
          {
            t: "Keep the hole, and draw on it yourself",
            check: {s:"deception",s2:"stewardship",d:50},
            win: {
              r: "The hole is very comfortable. You line it with your own silver.",
              fx: earn(3,{honor:-8,flag:"ln_skim"}),
            },
            lose: {
              r: "The lord's new auditor finds the hole, and finds you in it.",
              fx: {rep:-20,honor:-8,punish:"theft"},
            },
          },
          {
            t: "Tell the lord exactly what you see",
            r: 'He sighs. The old steward was his godfather. "Close it, and say nothing." You do.',
            fx: {rep:3,honor:2},
          },
        ],
      }),
      O(["steward"], {
        id: "ln_stw_skim",
        minRank: 1,
        w: 1,
        cool: 6,
        title: "Cooking the books",
        cond: (p,C)=>!C.flag(p,"ln_skim"),
        setup: (p,ctx)=>{pickHouse(p,ctx),setFee(p,ctx,.35)},
        text: "Your lord of {house} has not looked at a tally stick in three years. Wool, timber, fines, the mill, the fishponds: every penny passes through your hands, and nobody counts but you. A tenth would never be missed. Probably.",
        choices: [
          {
            t: "Skim a tenth, carefully",
            check: {s:"deception",s2:"stewardship",d:55},
            win: {
              r: "A little from the wool, a little from the fines, nothing from the mill. Your purse fattens year by year.",
              fx: earn(3,{honor:-8,flag:"ln_skim"}),
            },
            lose: {
              r: "A clerk notices the wool weighs less in your book than at the market. The lord counts, at last.",
              fx: both({rep:-20,honor:-8,perf:-20},hp(-10),{punish:"theft"}),
            },
          },
          {
            t: "Lend the lord's idle silver to a wool venture; keep the gain",
            check: {s:"trade",s2:"stewardship",d:55},
            win: {
              r: "The ships come home. The lord's silver goes back in his chest, and the gain into yours.",
              fx: earn(2.5,{honor:-2,skill:{trade:3}}),
            },
            lose: {
              r: "The ship goes down off the cape with the lord's silver in it. You have some explaining to do.",
              fx: both({rep:-10,perf:-10,coinPct:-.25},hp(-8)),
            },
          },
          {
            t: "Keep every penny straight",
            r: "You count it all and keep none. Nobody thanks you for it. That is how stewardship works.",
            fx: {honor:2,rep:2,skill:{stewardship:1}},
          },
        ],
      }),
      O(["steward"], {
        id: "ln_stw_debts",
        minRank: 1,
        w: 1.1,
        cool: 5,
        title: "The lord's debts",
        setup: (p,ctx)=>{pickHouse(p,ctx),ctx.lender=lenderOf(p),setFee(p,ctx,.25),ctx.debt=A.fmt(ctx.fee*30)},
        text: "{House} owes {lender} {debt} suns, and the interest eats a third of the rents. The bankers' man has arrived at {seat} with a list of the lord's best woods and mills, and a smile.",
        choices: [
          {
            t: "Sell the outlying woods and clear the debt",
            check: {s:"stewardship",s2:"trade",d:45},
            win: {
              r: "The woods go at a good price before the bankers can force a bad one. The lord is free and furious about his woods.",
              fx: earn(1,both({rep:6,skill:{stewardship:2}},hp(5))),
            },
            lose: {
              r: "You sell in a falling market. The debt is halved and the woods are gone.",
              fx: both({rep:-3},hp(-3)),
            },
          },
          {
            t: "Negotiate the bankers down",
            check: {s:"trade",s2:"diplomacy",d:55},
            win: {
              r: 'You count their "fees" on the table in front of them until they blush. A third off, and ten years to pay.',
              fx: earn(1.5,both({rep:10,skill:{trade:3}},hp(10))),
            },
            lose: {r:"Bankers do not blush. They take the mill.",fx:both({rep:-5},hp(-6))},
          },
          {
            t: "Raise the tenants' rents",
            r: "The debt shrinks. So do the tenants. Two families leave the manor before spring.",
            fx: both({rep:3,honor:-3,perf:3},hp(4)),
          },
          {
            t: "Hide the silver plate from the creditors",
            check: {s:"deception",s2:"intrigue",d:50},
            win: {
              r: "The plate spends the winter under a byre floor. The bankers inventory a very poor-looking hall.",
              fx: both({rep:4,honor:-2},hp(8)),
            },
            lose: {
              r: "The bankers' man has done this before. He finds it, and adds a fee for the trouble.",
              fx: both({rep:-8,newRel:{type:"enemy",op:-25}},hp(-8)),
            },
          },
        ],
      }),
      O(["steward"], {
        id: "ln_stw_famine",
        minRank: 1,
        time: 2,
        w: 1.1,
        cool: 7,
        title: "The famine winter",
        setup: (p,ctx)=>{pickHouse(p,ctx),setFee(p,ctx,.3)},
        text: "The harvest came in forty in a hundred short. Wheat is four times its price at {town}. By the Dark Weeks the tenants of {seat} will be eating acorns and bark, then their seed grain, then their plough oxen — and after that there is no next year either. The lord's barns are full.",
        choices: [
          {
            t: "Open the lord's barns to the tenants as a loan",
            check: {s:"stewardship",s2:"persuasion",d:50},
            win: {
              r: "You talk the lord round with figures: dead tenants pay no rent. In spring every field on the manor is sown, and the next manor's are not.",
              fx: earn(.5,both({rep:10,honor:6,fame:2,stability:1},hp(6))),
            },
            lose: {
              r: "The lord hears you opened his barns before he agreed. He agrees afterward, with a face like thunder.",
              fx: both({rep:-6,honor:5,perf:-10},hp(-6)),
            },
          },
          {
            t: "Sell the lord's grain at famine prices",
            r: "The lord's chest fills, and the lord's graveyard. He gives you a bonus.",
            fx: earn(3,both({rep:5,honor:-6,happy:-3},hp(5))),
          },
          {
            t: "Buy grain from abroad before the price climbs higher",
            check: {s:"logistics",s2:"trade",d:55},
            win: {
              r: "Barges up the river from the coast, bought at last month's price. Nobody on the manor starves, and the lord makes money on the surplus.",
              fx: earn(1.5,both({rep:12,fame:2,skill:{logistics:4}},hp(10))),
            },
            lose: {r:"The barges are seized by a lord upriver for his own people.",fx:both({rep:-5,wil:1},hp(-4))},
          },
        ],
      }),
      O(["steward"], {
        id: "ln_stw_feast",
        minRank: 1,
        w: 1,
        cool: 5,
        title: "The wedding feast",
        setup: (p,ctx)=>{pickHouse(p,ctx),setFee(p,ctx,.2)},
        text: "The daughter of {house} marries at Midsummer: two hundred guests, a count among them, three days of feasting, and a budget a baron would laugh at. Everything is your problem.",
        choices: [
          {
            t: "Plan it like a campaign",
            check: {s:"logistics",s2:"stewardship",d:50},
            win: {
              r: "Every cask, every capon, every bed counted. The count says it is the best wedding he has eaten at. The lord pays you a bonus out of sheer relief.",
              fx: earn(1,both({rep:8,skill:{logistics:3}},hp(8))),
            },
            lose: {
              r: "The wine runs out before the count's toast. The count notices.",
              fx: both({rep:-6,happy:-4},hp(-6)),
            },
          },
          {
            t: "Serve cheap wine in good jugs",
            check: {s:"deception",s2:"etiquette",d:45},
            win: {
              r: "Nobody can tell after the second jug. You keep the difference for the lord, and a little for yourself.",
              fx: earn(1.5,{honor:-2,rep:3}),
            },
            lose: {r:"The count can tell after the first.",fx:both({rep:-5},hp(-5))},
          },
          {
            t: "Borrow on the lord's name and do it in style",
            r: "A wedding they will sing about, and a debt they will curse about.",
            fx: both({rep:3,perf:-4},hp(4)),
          },
        ],
      }),
      O(["steward"], {
        id: "ln_stw_audit",
        minRank: 2,
        w: 1,
        cool: 6,
        title: "The auditors",
        setup: (p,ctx)=>{setFee(p,ctx,.1),ctx.bribe=Math.max(20,Math.round(ctx.fee*2)),ctx.bribeS=A.coin(ctx.bribe)},
        text: "The Lord Treasurer's auditors arrive unannounced with tally sticks, seals and long faces. They want every book and every chest, and they have three weeks.",
        choices: [
          {
            t: "Open every book and chest",
            r: p=>p.flags.ln_skim?"They find the hole. They always find the hole.":"They find nothing, and say so in writing to the Lord Treasurer.",
            fx: p=>p.flags.ln_skim?A.applyFx(p,{rep:-20,honor:-6,punish:"theft",unflag:"ln_skim"},{}):A.applyFx(p,{rep:10,favor:4,honor:2},{}),
          },
          {
            t: "Feed them, flatter them, and show them only the good books",
            check: {s:"deception",s2:"etiquette",d:55},
            win: {
              r: "Three weeks of venison and clean pages. They leave fat and satisfied.",
              fx: {rep:4,unflag:"ln_skim"},
            },
            lose: {r:"The youngest auditor does not drink. He asks for the other books.",fx:{rep:-12,honor:-4}},
          },
          {
            t: "Bribe the chief auditor ({bribeS})",
            req: (p,C,ctx)=>p.coin>=(ctx&&ctx.bribe?ctx.bribe:20),
            r: "He takes it and writes a glowing report. Next year he will want more.",
            fx: (p,ctx)=>(p.coin=Math.max(0,p.coin-(ctx.bribe||20)),A.applyFx(p,{honor:-5,rep:2,unflag:"ln_skim"},ctx)),
          },
        ],
      }),
      O(["steward"], {
        id: "ln_stw_survey",
        minRank: 2,
        minRep: 50,
        time: 2,
        w: .9,
        cool: 10,
        title: "The great survey",
        cond: (p,C)=>!C.flag(p,"ln_survey"),
        setup: (p,ctx)=>{setFee(p,ctx,.3)},
        text: "{ruler} wants every hearth, mill, plough and beast in {realmShort} counted and written down, so the taxes can be set fairly — or at least fully. The great lords hate the idea. Every reeve in the realm will hate you.",
        choices: [
          {
            t: "Count it honestly, shire by shire",
            check: {s:"stewardship",s2:"logistics",d:60},
            win: {
              r: "Two years of clerks, carts and sullen villages. The roll fills a chest. Taxes are fairer, and the crown richer, than in living memory.",
              fx: earn(1,both(tre(4e3),{masterwork:"the Great Roll of {realmShort}",rep:12,fame:3,favor:10,flag:"ln_survey"},deed("Made the Great Roll of {realmShort}"))),
            },
            lose: {
              r: "Half the shires lie and the other half hide. The roll is a joke in every alehouse.",
              fx: {rep:-4,flag:"ln_survey",wil:1},
            },
          },
          {
            t: "Let the great lords under-count, for a fee",
            check: {s:"deception",s2:"intrigue",d:55},
            win: {
              r: "The roll is finished on time. Some great manors seem to have shrunk. So has your conscience.",
              fx: earn(4,{masterwork:"the Great Roll of {realmShort}",honor:-8,rep:4,flag:"ln_survey"}),
            },
            lose: {
              r: "A rival compares your roll with an old tax list. {ruler} is not amused.",
              fx: {favor:-15,rep:-8,flag:"ln_survey"},
            },
          },
          {t:"Decline the commission",r:"Somebody else does it, badly.",fx:{rep:-1}},
        ],
      }),
      O(["steward"], {
        id: "ln_stw_dues",
        minRank: 1,
        w: 1,
        cool: 6,
        title: "The tenants march",
        setup: (p,ctx)=>{pickHouse(p,ctx),who(p,ctx,"the headman of the tenants")},
        text: "{House} has raised the dues on wood, pannage and marriage. Now sixty tenants with scythes and pitchforks stand at the gate of {seat}, with {them} at their head, asking to speak to the lord. The lord sends you.",
        choices: [
          {
            t: "Hear them out and bargain",
            check: {s:"diplomacy",s2:"persuasion",d:50},
            win: {
              r: "Wood dues back to the old rate, the marriage fee halved, pannage kept. They go home. The lord grumbles and keeps his roof.",
              fx: both({rep:6,honor:3,stability:1,them:{type:"friend",op:30}},hp(3)),
            },
            lose: {r:"They hear you out and refuse. A barn burns that night.",fx:both({rep:-5},hp(-6))},
          },
          {
            t: "Call out the lord's men",
            check: {s:"intimidation",s2:"command",d:45},
            win: {
              r: "Twenty men in mail in the gateway. The tenants melt away. They will remember.",
              fx: both({rep:3,honor:-3,them:{type:"enemy",op:-40}},hp(5)),
            },
            lose: {
              r: "A stone hits you on the brow. It becomes a riot.",
              fx: both({health:-10,cause:"a riot",rep:-6,stability:-1},hp(-6)),
            },
          },
          {
            t: "Give them everything, in the lord's name",
            r: "They cheer you. The lord does not.",
            fx: both({honor:3,rep:-5,perf:-8,them:{type:"friend",op:40}},hp(-4)),
          },
        ],
      }),
      O(["steward"], {
        id: "ln_stw_child_lord",
        minRank: 2,
        w: .9,
        cool: 8,
        title: "The lord is seven",
        setup: (p,ctx)=>{pickHouse(p,ctx),who(p,ctx,"the dead lord's brother",{sex:"M",status:"noble"}),setFee(p,ctx,.3)},
        text: "The lord of {house} is dead of a fall, and his heir is seven. The widow keeps her third of the rents for life. The dead man's brother {them} wants the rest, and the boy, and says the steward had better decide quickly whose man he is.",
        choices: [
          {
            t: "Serve the widow and the child",
            r: "You keep the books for a boy who cannot read them yet. {them} becomes a dangerous enemy. In ten years the boy will be a grateful lord.",
            fx: both({honor:6,rep:6,them:{type:"enemy",op:-40},newRel:{type:"friend",op:40}},hp(12)),
          },
          {
            t: "Side with the uncle",
            r: "He pays well for a steward who knows where the silver is. The widow's third shrinks, somehow, every year.",
            fx: earn(3,both({honor:-6,them:{type:"friend",op:40}},hp(-5))),
          },
          {
            t: "Run it yourself, between them both, and grow fat",
            check: {s:"deception",s2:"intrigue",d:55},
            win: {
              r: "Each thinks you serve the other. Both trust you with everything. You serve yourself.",
              fx: earn(3.5,{honor:-8,skill:{intrigue:3}}),
            },
            lose: {
              r: "The widow and the uncle compare notes. For once they agree on something.",
              fx: both({rep:-15,honor:-6,them:{type:"enemy",op:-50}},hp(-10)),
            },
          },
        ],
      }),
      O(["steward","courtier"], {
        id: "ln_stw_coin",
        minRank: 3,
        minRep: 55,
        time: 2,
        w: .9,
        cool: 8,
        title: "Clipping the coin",
        text: "The treasury of {realmShort} is empty, and the army wants paying. The council proposes to debase the coin: a tenth less silver in every piece, and nobody the wiser for a year. Varenna hangs common coin-clippers. Councils do it anyway.",
        choices: [
          {
            t: "Support it",
            r: "The mint melts and recoins. The army is paid. Within a year bread costs a tenth more and every merchant weighs your coin twice.",
            fx: both(tre(5e3),{stability:-3,honor:-3,favor:10,rep:2}),
          },
          {
            t: "Oppose it, and find the money another way",
            check: {s:"stewardship",s2:"trade",d:60},
            win: {
              r: "A toll farmed out, a crown forest sold, a loan from the Temple at honest interest. The army is paid and the coin is clean.",
              fx: both(tre(3e3),{favor:8,rep:12,fame:3,stability:1},deed("Kept the coin of {realmShort} honest")),
            },
            lose: {
              r: "Your other ways come to half. The council debases anyway, and blames you for the delay.",
              fx: {favor:-10,rep:-4,stability:-2},
            },
          },
          {
            t: "Oppose it on principle",
            r: "You say your piece and are outvoted. The coin is clipped. You are remembered as the one who said no.",
            fx: {honor:4,favor:-6,rep:3},
          },
        ],
      }),
      O(["steward"], {
        id: "ln_stw_first_manor",
        maxRank: 0,
        w: 1.3,
        title: "A manor of your own to run",
        setup: (p,ctx)=>{pickHouse(p,ctx)},
        text: "The old steward of {house} has the gout and cannot ride. Until he mends, the outlying manor at {seat} is yours to run alone: the sowing, the shearing, the court days and the reeve, who already hates you.",
        choices: [
          {
            t: "Ride every field, every week",
            check: {s:"stewardship",s2:"sta",d:45},
            win: {
              r: "Sown on time, sheared on time, the reeve outfoxed twice. The old steward mends and is not needed there again.",
              fx: up(both({skill:{stewardship:3,logistics:2}},hp(5))),
            },
            lose: {
              r: "A late frost, a lost flock, and a reeve who tells the lord it was all your fault.",
              fx: {rep:-3,wil:1},
            },
          },
          {
            t: "Make the reeve your friend",
            check: {s:"diplomacy",s2:"int",d:45},
            win: {
              r: "He knows every field and every lie. With him on your side the manor runs itself, and you get the credit.",
              fx: up({skill:{diplomacy:2},newRel:{type:"friend",op:30}}),
            },
            lose: {r:"He takes your friendship and your grain.",fx:{rep:-2,coin:-5}},
          },
          {
            t: "Do as the old steward always did",
            r: "Nothing goes very wrong. Nothing goes very right.",
            fx: {rep:1,skill:{stewardship:1}},
          },
        ],
      }),
    ]);
    A.defEvents([
      D(["steward"], {
        id: "ln_d_stw_reeve",
        w: 1,
        title: "The reeve's bushel",
        setup: (p,ctx)=>{who(p,ctx,"a village reeve",{sex:"M"})},
        text: "{them}, the reeve of the home farm, measures the tenants' rent-grain with a bushel a little too big and sells the difference at the market. Everybody in the village knows. Now you do.",
        choices: [
          {
            t: "Dismiss him before the manor court",
            r: "A new reeve, a true bushel, and a village that looks at you differently.",
            fx: {honor:3,rep:3,them:{type:"enemy",op:-40}},
          },
          {
            t: "Make him pay it back, quietly, and keep him",
            check: {s:"intimidation",s2:"stewardship",d:40},
            win: {
              r: "He pays, and his bushel is honest ever after. A reeve who owes you is worth two who do not.",
              fx: {coin:5,skill:{stewardship:1},them:{type:"servant",op:10,back:"master"}},
            },
            lose: {
              r: "He laughs. He has been reeve longer than you have been alive.",
              fx: {rep:-2,them:{type:"rival",op:-20}},
            },
          },
          {
            t: "Take a share and say nothing",
            r: "Two sacks of barley at every quarter-day, delivered to your door.",
            fx: {coin:8,honor:-4},
          },
        ],
      }, (p,C)=>C.prof(p,"stewardship",45)&&(gentle(p)||C.rich(p)||J(p,"farm"))),
      D(["steward","servant"], {
        id: "ln_d_stw_hiring",
        w: .9,
        title: "The hiring fair",
        setup: (p,ctx)=>{ctx.fair=A.pick(["May Fair","the Slaughter Feast"])},
        text: "Servants are hired for the year at {fair}, and the household is short a cook, two dairymaids and a man for the horses. The hiring square at {town} is full of hopeful faces, each holding the token of a trade.",
        choices: [
          {
            t: "Hire the best, at the best wages",
            r: "Good servants cost money. The household runs like a mill all year.",
            fx: {coin:-5,rep:3,skill:{stewardship:1}},
          },
          {
            t: "Hire cheap and drive them hard",
            r: "You save money, and spend it on replacing the ones who run off at midsummer.",
            fx: {coin:3,rep:-1},
          },
          {
            t: "Hire the old woman nobody else wants",
            r: "She was cook to a count once. Your table improves beyond recognition.",
            fx: {honor:2,happy:3,newRel:{type:"friend",op:30}},
          },
        ],
      }, (p,C)=>C.rich(p)&&!C.ruler(p)),
      D(["steward"], {
        id: "ln_d_stw_tally",
        w: .8,
        cool: 8,
        title: "Three pennies short",
        text: "The year's accounts are three pennies short, and you cannot find where. Three pennies is nothing. Three pennies is a crack in the dam. You have not slept properly in a week.",
        choices: [
          {
            t: "Go through it all again, every tally",
            check: {s:"stewardship",s2:"wil",d:45},
            win: {
              r: "A tally stick notched by a left-handed reeve, read backward. Three pennies. You sleep for fourteen hours.",
              fx: {skill:{stewardship:2},int:.5,happy:3},
            },
            lose: {r:"You never find them. You think about them sometimes, years later.",fx:{wil:1,happy:-3}},
          },
          {
            t: "Put three pennies in from your own purse and forget it",
            r: "The books balance. You sleep. It still bothers you.",
            fx: {happy:1},
          },
        ],
      }, (p,C)=>C.prof(p,"stewardship",50)&&(gentle(p)||C.rich(p))),
    ]);
    A.defEvents([
      O(["courtier"], {
        id: "ln_crt_cupbearer",
        maxRank: 0,
        young: !0,
        w: 1.4,
        title: "The cupbearer",
        setup: (p,ctx)=>{pickHouse(p,ctx)},
        text: "Tonight you pour at the high table for the first time: wine for {ruler}, for the lords of {house}, for a foreign envoy with a thin smile. A full jug is heavy, the floor is rushes, and the whole hall is watching the sovereign's cup.",
        choices: [
          {
            t: "Pour, and keep your eyes on the cup",
            check: {s:"etiquette",s2:"spd",d:35},
            win: {
              r: "Not a drop spilled all night. The steward nods once, which from him is a speech.",
              fx: {rep:4,favor:3,skill:{etiquette:2}},
            },
            lose: {r:"Red wine on the countess. The hall laughs. The countess does not.",fx:{rep:-3,happy:-4,wil:.5}},
          },
          {
            t: "Pour, and listen to every word",
            check: {s:"intrigue",s2:"int",d:35},
            win: {
              r: "Nobody sees a page. By the end of the night you know who hates whom, and who is about to fall.",
              fx: {skill:{intrigue:3},int:.5,flag:"ln_heard"},
            },
            lose: {r:"You listen so hard you miss the sovereign's empty cup.",fx:{rep:-2,favor:-2}},
          },
          {
            t: "Slip the foreign envoy's cup to the steward to be tasted",
            r: "The steward looks at you strangely, then has it tasted. It is only wine. But he remembers that you thought of it.",
            fx: {rep:2,ins:.5},
          },
        ],
      }),
      O(["courtier"], {
        id: "ln_crt_letter_carry",
        maxRank: 1,
        young: !0,
        w: 1.1,
        title: "A letter to carry",
        setup: (p,ctx)=>{who(p,ctx,"a lady of the court",{sex:"F",status:"noble"})},
        text: "{them}, a lady of the court, presses a sealed letter into your hand with a silver penny and a look. It is for a knight of the guard. The seal is not hers.",
        choices: [
          {
            t: "Carry it, and forget it",
            r: "You carry it. You forget it. The lady remembers you, and so does the knight.",
            fx: {coin:2,rep:2,them:{type:"friend",op:20}},
          },
          {
            t: "Read it first",
            check: {s:"stealth",s2:"int",d:35},
            win: {
              r: "A hot knife under the wax. It is a love letter — and the seal belongs to the consort's household. You know something now.",
              fx: {coin:2,skill:{stealth:2,intrigue:2},flag:"ln_letter"},
            },
            lose: {
              r: "You break the seal. Now you have to carry a broken letter, or not carry it at all.",
              fx: {rep:-3,them:{type:"enemy",op:-20}},
            },
          },
          {
            t: "Hand it to the steward",
            r: "The steward reads it and goes white. The lady is sent home to her father within the week. You are trusted, and feared a little.",
            fx: {favor:3,rep:3,honor:-1,them:{type:"enemy",op:-50}},
          },
        ],
      }),
      O(["courtier"], {
        id: "ln_crt_seating",
        minRank: 1,
        maxRank: 2,
        w: 1.2,
        cool: 5,
        title: "The seating",
        setup: (p,ctx)=>{pickHouse(p,ctx)},
        text: "The steward is sick, and the seating of the great feast falls to you. Birth beats office at the top of the list and office beats birth below it. A general must sit below a baron; a Luminary walks before a count in some realms and behind him in others; and {house} has quarreled with everyone.",
        choices: [
          {
            t: "Do it strictly by the precedence roll",
            check: {s:"etiquette",s2:"learning",d:50},
            win: {
              r: "Every bench exactly right. Nobody thanks you, which is the highest praise a seating ever gets.",
              fx: {rep:6,favor:4,skill:{etiquette:3}},
            },
            lose: {
              r: "A count sits below a general, and the count notices before the soup.",
              fx: both({rep:-5,favor:-4,newRel:{type:"enemy",op:-25}},hp(-3)),
            },
          },
          {
            t: "Bend the roll to keep the quarrels apart",
            check: {s:"intrigue",s2:"etiquette",d:50},
            win: {
              r: "Wrong by the roll and right by the room. Not a single knife drawn all night.",
              fx: {rep:5,favor:5,skill:{intrigue:2}},
            },
            lose: {
              r: "Two rival lords end up side by side because of you. There is blood on the tablecloth.",
              fx: both({rep:-6,favor:-6},hp(-6)),
            },
          },
          {
            t: "Seat your friends high",
            r: "Your friends are delighted. Everyone else makes a note.",
            fx: {rep:-2,newRel:{type:"friend",op:30}},
          },
        ],
      }),
      O(["courtier"], {
        id: "ln_crt_petition",
        minRank: 1,
        w: 1.2,
        title: "A petition for the throne",
        setup: (p,ctx)=>{who(p,ctx,"a merchant with a petition",{status:"merchant"}),setFee(p,ctx,.25),ctx.ask=A.pick(["a charter for a new market at "+A.T("{town}",{}),"the farm of the salt tax for five years","pardon for a son who killed a man in a brawl","the right to build a mill on the royal river"])},
        text: "{them} wants {ask}, and knows a petition in a merchant's hand never reaches the throne. In yours it might. The offer is {pay}.",
        choices: [
          {
            t: "Carry it, at a good moment",
            check: {s:"diplomacy",s2:"etiquette",d:50},
            win: {
              r: "After the hunt, with the sovereign in a good mood: granted. {them} is your friend for life, and pays like one.",
              fx: earn(1.5,{rep:5,them:{type:"friend",op:40}}),
            },
            lose: {
              r: "Wrong moment. The petition is refused, and you are remembered as the one who brought it.",
              fx: earn(.5,{favor:-4,rep:-2}),
            },
          },
          {
            t: "Take the purse and let it gather dust",
            r: "It sits in a chest in your rooms. {them} asks after it for a year, then stops asking, and starts telling people.",
            fx: earn(1,{honor:-4,rep:-3,them:{type:"enemy",op:-30}}),
          },
          {
            t: "Refuse: you do not sell the sovereign's ear",
            r: "Some at court think you a fool. The sovereign, hearing of it, does not.",
            fx: {honor:3,favor:3},
          },
        ],
      }),
      O(["courtier"], {
        id: "ln_crt_favourite",
        minRank: 2,
        w: 1,
        cool: 6,
        title: "The new favourite",
        setup: (p,ctx)=>{who(p,ctx,"the sovereign's new favourite",{status:"gentry"})},
        text: "{them} arrived at court a year ago with good legs and a better laugh. Now {theyHe} rides at the sovereign's side, sleeps in the palace and decides who gets an audience. The old councillors are furious. Everybody is watching to see which way you lean.",
        choices: [
          {
            t: "Befriend {themHim}",
            check: {s:"diplomacy",s2:"persuasion",d:45},
            win: {
              r: "You make {themHim} laugh and teach {themHim} the court. In return your letters reach the throne first.",
              fx: {favor:5,rep:3,them:{type:"friend",op:40}},
            },
            lose: {r:"{them} sees you coming and laughs at you instead.",fx:{rep:-3,them:{type:"rival",op:-15}}},
          },
          {
            t: "Undermine {themHim}",
            check: {s:"intrigue",s2:"deception",d:55},
            win: {
              r: "A debt here, a rumor there, a letter found. {them} leaves court by Midsummer, and the old councillors owe you.",
              fx: {favor:6,rep:8,honor:-2,them:{type:"enemy",op:-60}},
            },
            lose: {
              r: "The sovereign hears who started the rumors. Favourites have long memories, and sovereigns longer.",
              fx: {favor:-12,rep:-5,them:{type:"enemy",op:-50}},
            },
          },
          {
            t: "Keep your distance and your counsel",
            r: "Favourites come and go. You intend to stay.",
            fx: {wil:.5},
          },
        ],
      }),
      O(["courtier"], {
        id: "ln_crt_plot",
        minRank: 2,
        w: 1,
        cool: 8,
        title: "Voices in the gallery",
        setup: (p,ctx)=>{lordOf(p,ctx,"a lord of the council"),ctx.target=A.pick(["the First Minister","the treasurer and his bankers","the queen's party","the sovereign's favourite"]),setFee(p,ctx,.4)},
        text: "Behind a tapestry in the long gallery you hear {themFull} of {house} and two others agree how to be rid of {target} before the new year. Then one of them says the sovereign's name in a tone you do not like at all.",
        choices: [
          {
            t: "Go to the sovereign tonight",
            r: "Arrests at dawn. {House} falls hard. The sovereign does not forget who came at midnight.",
            fx: both({favor:20,rep:8,honor:-2,fame:2,them:{type:"enemy",op:-70}},hp(-30)),
          },
          {
            t: "Join them",
            check: {s:"intrigue",s2:"int",d:60},
            win: {
              r: "It works. {target} falls, new men rise, and you rise with them.",
              fx: earn(2,both({fame:3,rep:6,honor:-4,them:{type:"friend",op:40}},hp(10))),
            },
            lose: {
              r: "Someone else was behind the tapestry too. The guards come for you all.",
              fx: {them:{type:"friend",op:10},punish:"treason"},
            },
          },
          {
            t: "Let them know you heard, and name your price",
            check: {s:"intrigue",s2:"deception",d:55},
            win: {
              r: "They pay, and they hate you, and they cannot touch you.",
              fx: earn(2.5,{honor:-6,them:{type:"enemy",op:-50}}),
            },
            lose: {
              r: "They pay with a knife in the stairwell. You survive it, barely.",
              fx: {health:-25,cause:"a knife in the stairwell",wil:2,them:{type:"enemy",op:-60}},
            },
          },
        ],
      }),
      O(["courtier"], {
        id: "ln_crt_council",
        minRank: 2,
        maxRank: 2,
        minRep: 55,
        time: 2,
        w: 1.3,
        cool: 5,
        title: "A seat at the council table",
        setup: (p,ctx)=>{setFee(p,ctx,.8),pickHouse(p,ctx)},
        text: "A councillor of {realmShort} has died at the table, mid-sentence, of an apoplexy. The seat is the sovereign's to give, but the great houses will have their say, and {house} has already let it be known that it has a candidate.",
        choices: [
          {
            t: "Court the great houses",
            check: {s:"diplomacy",s2:"intrigue",d:55},
            win: {
              r: "Dinners, promises, a marriage half-arranged. When the sovereign asks the houses, they say your name.",
              fx: up(both({favor:5,rep:5},hp(10))),
            },
            lose: {r:"The houses take your dinners and vote for {house}'s man.",fx:{rep:-4}},
          },
          {
            t: "Buy the seat",
            req: (p,C,ctx)=>p.coin>=(ctx&&ctx.fee?ctx.fee:100),
            r: "Gifts to the right chamberlain, the right confessor, the right mistress. The seat is yours, and everyone knows the price.",
            fx: (p,ctx)=>(p.coin=Math.max(0,p.coin-(ctx.fee||100)),up({honor:-4,rep:2})(p,ctx)),
          },
          {
            t: "Go straight to the sovereign",
            check: {s:"persuasion",s2:"etiquette",d:60},
            win: {
              r: "You speak plainly about what you would do with the seat. The sovereign likes plain speech, for once.",
              fx: up({favor:10,rep:6}),
            },
            lose: {r:"The sovereign does not like being asked.",fx:{favor:-6,rep:-2}},
          },
          {t:"Wait to be asked",r:"You are not asked. You will be, perhaps, next time.",fx:{rep:2,wil:.5}},
        ],
      }),
      O(["courtier"], {
        id: "ln_crt_first_minister",
        minRank: 3,
        maxRank: 3,
        minRep: 70,
        time: 2,
        w: 1.3,
        cool: 6,
        title: "The first chair",
        text: "{ruler} is tired of the daily grind of rule: petitions, ledgers, envoys, quarrels. The court whispers that a First Minister will be named — someone to rule in the sovereign's name, the highest place a subject can reach. Your name is on the list. So are two others.",
        choices: [
          {
            t: "Show the sovereign what you would do",
            check: {s:"stewardship",s2:"diplomacy",d:60},
            win: {
              r: "A plan for the treasury, the roads and the border, in four pages. The sovereign reads it in an evening and names you in the morning.",
              fx: up(both({favor:15,fame:6,rep:10,stability:2},deed("Made First Minister of {realmShort}"))),
            },
            lose: {r:"A good plan, but another candidate's was shorter.",fx:{rep:2,favor:2}},
          },
          {
            t: "Destroy the other two",
            check: {s:"intrigue",s2:"deception",d:60},
            win: {
              r: "One is found to have written to a foreign court. The other retires to the country with a sudden illness. You are named.",
              fx: up(both({favor:10,fame:4,honor:-8,newRel:{type:"enemy",op:-50}},deed("Made First Minister of {realmShort}"))),
            },
            lose: {r:"They compare notes and destroy you instead.",fx:{favor:-15,rep:-10,honor:-5}},
          },
          {
            t: "Ask not to be considered",
            r: "The council is astonished. The sovereign is touched. You keep your head off the block a few years longer.",
            fx: {favor:5,wil:.5},
          },
        ],
      }),
      O(["courtier"], {
        id: "ln_crt_tax",
        minRank: 3,
        w: 1.1,
        cool: 5,
        title: "The council votes",
        setup: (p,ctx)=>{ctx.tax=A.pick(["a war tax of one in ten on all moveable goods","a hearth tax doubled for three years","a forced loan from the merchant towns","a new toll on every bridge in the realm"]),pickHouse(p,ctx)},
        text: "The council of {realmShort} must vote on {tax}. The treasury needs it. The great houses, led by {house}, will hate it. The commons will hate it more. The sovereign looks at you to speak first.",
        choices: [
          {
            t: "Speak for it",
            r: "It passes. The treasury fills. The roads fill with grumbling.",
            fx: both(tre(3e3),{stability:-3,favor:8,rep:2},hp(-10)),
          },
          {
            t: "Speak against it",
            check: {s:"persuasion",s2:"stewardship",d:55},
            win: {
              r: "You show the council what the last such tax cost in revolts. It fails. The houses toast you; the sovereign does not.",
              fx: both({stability:2,favor:-6,rep:6,fame:2},hp(15)),
            },
            lose: {
              r: "It passes anyway, and the sovereign remembers you spoke against it.",
              fx: both(tre(3e3),{stability:-3,favor:-8}),
            },
          },
          {
            t: "Propose a smaller tax that the houses will swallow",
            check: {s:"diplomacy",s2:"stewardship",d:50},
            win: {
              r: "Half the sum, twice the goodwill. Everyone is a little disappointed and nobody revolts.",
              fx: both(tre(1500),{favor:4,rep:6},hp(5)),
            },
            lose: {r:"Too small for the sovereign, too big for the houses.",fx:{favor:-3,rep:-2}},
          },
        ],
      }),
      O(["courtier"], {
        id: "ln_crt_hunt",
        maxRank: 2,
        w: 1.1,
        cool: 4,
        title: "The royal hunt",
        setup: (p,ctx)=>{ctx.game=C2r(p,"POL-12","POL-11","POL-34")?"wild horses on the steppe":C2r(p,"POL-30")?"a tiger in the cane brakes":A.pick(["a great boar","a hart of twelve tines","a bear in the high woods"])},
        text: "{ruler} hunts {game} today, and you are in the riding party for the first time. The ground is broken, the hounds are mad with the scent, and the sovereign rides like someone who has never been told no.",
        choices: [
          {
            t: "Ride close at the sovereign's side",
            check: {s:"riding",s2:"ins",d:45},
            win: {
              r: "When the quarry turns, you are there, and the sovereign's horse is not hurt. That evening you sit nearer the high table.",
              fx: {favor:10,fame:2,rep:4,skill:{riding:2}},
            },
            lose: {
              r: "Your horse puts its foot in a hole. You are carried home on a hurdle.",
              fx: {health:-12,cause:"a fall in the hunt",wound:"bad_knee",rep:-2},
            },
          },
          {
            t: "Make sure the sovereign gets the kill",
            check: {s:"etiquette",s2:"riding",d:40},
            win: {
              r: "You turn the quarry with your horse, just so, and the sovereign's spear takes it. Nobody saw what you did except the huntsman, who winks.",
              fx: {favor:8,skill:{etiquette:2}},
            },
            lose: {r:"You turn it straight into the Master of Horse.",fx:{favor:-3,rep:-2}},
          },
          {
            t: "Hang back and talk with whoever else hangs back",
            r: "A disgraced lord, a bored bishop, a clever widow. You learn more at the back of a hunt than at the front.",
            fx: {skill:{intrigue:2},newRel:{type:"friend",op:25}},
          },
        ],
      }),
      O(["courtier"], {
        id: "ln_crt_letter",
        minRank: 1,
        w: .9,
        cool: 8,
        title: "A letter that should not exist",
        setup: (p,ctx)=>{const r=RM(p),ru=r?A.P(r.ruler):null,sp=ru&&ru.spouse?A.P(ru.spouse):null;sp&&sp.alive&&sp.id!==p.id?(ctx.pid=sp.id,ctx.who="the consort"):(who(p,ctx,"a prince of the blood",{status:"royal"}),ctx.who="a prince of the blood"),ctx.to=A.pick(["a captain of the guard","the envoy of "+(A.enemyRealmOf(p.realm)?A.realmShort(A.enemyRealmOf(p.realm)):"a rival court"),"a young poet of the household"])},
        text: "In a book returned to the palace library you find a folded letter from {who}, {them}, addressed to {to}. It is not about the weather. It could ruin {themHim}, or save you, depending on whose hands it is in.",
        choices: [
          {
            t: "Burn it",
            r: "You burn it in your own grate and watch until it is ash. Some things are not yours to know.",
            fx: {honor:3,wil:.5},
          },
          {
            t: "Give it to the sovereign",
            r: "The sovereign reads it without a word, and thanks you without a word. {them} is sent away from court. The palace is colder after.",
            fx: {favor:15,rep:4,honor:-2,stability:-1,them:{type:"enemy",op:-60}},
          },
          {
            t: "Return it to {them}, privately",
            check: {s:"etiquette",s2:"intrigue",d:45},
            win: {
              r: "You hand it back without a word. {them} looks at you a long time. From then on, you have a friend in high places who cannot afford to forget you.",
              fx: {rep:3,them:{type:"friend",op:50},skill:{intrigue:2}},
            },
            lose: {
              r: "{them} assumes you read it, which you did, and assumes you will use it.",
              fx: {them:{type:"enemy",op:-40}},
            },
          },
          {
            t: "Keep it, as insurance",
            r: "It sits behind a loose stone in your room. You sleep a little worse, and walk a little taller.",
            fx: {flag:"ln_letter",honor:-2,skill:{intrigue:2}},
          },
        ],
      }),
      O(["courtier"], {
        id: "ln_crt_accused",
        minRank: 2,
        w: .9,
        cool: 8,
        title: "Accused",
        setup: (p,ctx)=>{lordOf(p,ctx,"a rival at court"),ctx.charge=A.pick(["taking bribes for audiences","writing to an enemy court","mocking the sovereign at a supper","skimming the household accounts"])},
        text: "{themFull} rises in council and accuses you of {charge}. There are letters, {theyHe} says, and a witness. The sovereign's face shows nothing at all.",
        choices: [
          {
            t: "Answer every point with proofs",
            check: {s:"learning",s2:"persuasion",d:55},
            win: {
              r: "The letters are forged, the witness was paid, and you can show by whom. The council turns on your accuser.",
              fx: {favor:8,rep:8,them:{type:"enemy",op:-50}},
            },
            lose: {
              r: "Your proofs are good. Theirs are louder. You are sent from court for a season.",
              fx: {favor:-12,rep:-8,happy:-6,them:{type:"enemy",op:-40}},
            },
          },
          {
            t: "Turn the accusation back on {themHim}",
            check: {s:"intrigue",s2:"deception",d:55},
            win: {
              r: "By evening the talk is all of {themFull}'s debts and {theirHis} brother's friends abroad.",
              fx: {favor:5,rep:4,honor:-3,them:{type:"enemy",op:-60}},
            },
            lose: {r:"It looks exactly like what it is: a guilty man flailing.",fx:{favor:-15,rep:-10}},
          },
          {
            t: "Kneel and ask to be judged by your years of service",
            check: {s:"etiquette",s2:"wil",d:50},
            // [X1 baked patch events/33-no-obvious-choices CHOICE-LN-CRT-ACCUSED] ln_crt_accused: kneeling was the safe best:
            // no enemy made and the best odds. A kneel that fails is now a public humiliation, and one that works a smaller
            // win than proof would be.
            win: {
              r: "The sovereign raises you up in front of everyone. The accusation is never mentioned again.",
              fx: {favor:6,rep:3},
            },
            lose: {r:"The sovereign lets you kneel a long time, in front of everyone.",fx:{favor:-14,rep:-8,wil:1.5}},
          },
        ],
      }),
      O(["courtier"], {
        id: "ln_crt_regency",
        minRank: 4,
        time: 2,
        w: 1.2,
        cool: 6,
        title: "In the sovereign's name",
        text: "{ruler} has taken to bed with a fever that will not break, and for a season you govern {realmShort} in the sovereign's name. The seal is in your hand. So is every quarrel in the realm.",
        choices: [
          {
            t: "Govern well and quietly",
            check: {s:"stewardship",s2:"diplomacy",d:60},
            win: {
              r: "The courts sit, the roads are safe, the border is quiet, and the sovereign rises to a realm in better order than it was left.",
              fx: both({stability:5,favor:12,fame:5,rep:10},deed("Governed {realmShort} in the sovereign's name")),
            },
            lose: {
              r: "Lords who would never defy the sovereign defy you. The realm frays.",
              fx: {stability:-4,favor:-5,rep:-6,wil:1.5},
            },
          },
          {
            t: "Fill every office with your own people",
            check: {s:"intrigue",s2:"stewardship",d:55},
            win: {
              r: "By the time the sovereign rises, every key in the palace fits a hand that answers to you.",
              fx: earn(1,{fame:3,honor:-6,favor:-4,newRel:{type:"enemy",op:-40}}),
            },
            lose: {
              r: "The sovereign recovers early and finds strangers at every door.",
              fx: {favor:-25,rep:-10,stability:-2},
            },
          },
          {
            t: "Summon the heir to share the burden",
            r: "The heir sits beside you and learns. The sovereign, recovering, approves.",
            fx: {stability:2,favor:6,honor:2},
          },
        ],
      }),
    ]);
    A.defEvents([
      D(["courtier"], {
        id: "ln_d_crt_sleeves",
        w: 1,
        title: "The price of a velvet sleeve",
        text: "A new fashion at court: sleeves to the floor, lined with fur, slashed to show silk. Everyone who matters is wearing them. A tailor in {capital} will make you a pair for 40 suns, and you are already in debt to him.",
        choices: [
          {
            t: "Buy them; appearance is everything",
            req: p=>p.coin>=40,
            r: "You look magnificent. Your purse looks like a beggar's.",
            fx: {coin:-40,looks:2,rep:2,happy:2},
          },
          {
            t: "Have last year's coat altered cleverly",
            check: {s:"craft",s2:"etiquette",d:40},
            win: {r:"Nobody can tell. One duchess asks for your tailor.",fx:{coin:-8,looks:1,rep:1}},
            lose: {r:"Everybody can tell.",fx:{coin:-8,rep:-2,happy:-3}},
          },
          {
            t: "Refuse to follow fashion",
            r: "You become known as the courtier in the plain coat. Some find it refreshing. Most do not.",
            fx: {rep:-1,wil:.5},
          },
        ],
      }, (p,C)=>C.noble(p)&&C.town(p)),
      D(["courtier"], {
        id: "ln_d_crt_rumor",
        w: 1,
        title: "What they say about you",
        setup: (p,ctx)=>{ctx.what=A.pick(["that you take bribes","that you are the sovereign's bastard","that you have a lover in the kitchens","that you said something unforgivable about the consort's hair"])},
        text: "The court is saying {what}. It is not true, mostly. It does not need to be.",
        choices: [
          {
            t: "Find who started it",
            check: {s:"intrigue",s2:"int",d:50},
            win: {
              r: "A disappointed rival. You let {rival} know that you know. The rumor dies by the end of the week.",
              fx: {skill:{intrigue:2},rep:2},
            },
            lose: {r:"You ask too many questions. Now people say you are paranoid as well.",fx:{rep:-2,happy:-3}},
          },
          {
            t: "Laugh it off in public",
            check: {s:"persuasion",s2:"wil",d:45},
            win: {
              r: "You tell the story better than the rumor does. It becomes a joke, and the joke is on whoever started it.",
              fx: {rep:2,fame:1},
            },
            lose: {r:"Your laugh sounds forced. Everyone hears it.",fx:{rep:-2}},
          },
          {t:"Ignore it",r:"It fades. They always do. Something worse replaces it.",fx:{wil:.5}},
        ],
      }),
      D(["courtier"], {
        id: "ln_d_crt_friend",
        w: .9,
        cool: 8,
        title: "A friend at court",
        setup: (p,ctx)=>{who(p,ctx,"a courtier of your own age",{status:"gentry"})},
        text: "{them} has been at court as long as you have. You have shared bad wine, bad sermons and good gossip for years. Now {theyHe} has fallen out of favor, and being seen with {themHim} costs something.",
        choices: [
          {
            t: "Stay {theirHis} friend, openly",
            r: "You walk with {themHim} in the gallery where everyone can see. It costs you. {them} never forgets it.",
            fx: {favor:-3,honor:4,them:{type:"bestfriend",op:60}},
          },
          {
            t: "Stay friends, quietly",
            r: "Suppers in your rooms, never in the hall. Half a friendship is better than none, you tell yourself.",
            fx: {them:{type:"friend",op:30}},
          },
          {
            t: "Let {themHim} go",
            r: "You stop seeing {themHim}. It is how the court works. You do not much like how the court works.",
            fx: {favor:1,honor:-2,happy:-3,them:{type:"acquaint",op:-20}},
          },
        ],
      }),
    ]);
    const schoolWord = p=>C2r(p,...WELL)?"well-school":p.faith==="REL-01"?"Temple school":p.faith==="REL-02"?"monastery school":C2r(p,"POL-04","POL-16")?"counting school":C2r(p,"POL-18")?"scribe school":"school";
    A.defEvents([
      O(["teacher"], {
        id: "ln_tch_dunce",
        maxRank: 1,
        w: 1.3,
        title: "The merchant's son",
        setup: (p,ctx)=>{who(p,ctx,"a rich merchant's son",{sex:"M",ageAdj:11}),setFee(p,ctx,.15)},
        text: "{them} is eleven, cheerful and as thick as a city wall. His father, who pays {pay} a year, wants him reading Old Solen and reckoning bills of exchange by Midsummer. The boy wants to be a knight.",
        choices: [
          {
            t: "Patience: teach him through the things he loves",
            check: {s:"learning",s2:"wil",d:45},
            win: {
              r: "He learns to read from a book of tourneys and to reckon from the price of horses. By Midsummer he can do both, badly, which is a miracle.",
              fx: earn(1,{rep:5,skill:{persuasion:2},them:{type:"student",op:40,back:"mentor"}}),
            },
            lose: {r:"He learns the names of every famous horse in the realm and nothing else.",fx:earn(.5,{rep:-2})},
          },
          {
            t: "The birch rod, as your master taught you",
            r: "He learns his letters and to hate them. His father is satisfied.",
            fx: earn(1,{honor:-1,them:{type:"enemy",op:-20}}),
          },
          {
            t: "Tell the father the truth",
            check: {s:"persuasion",s2:"etiquette",d:45},
            win: {
              r: "The father laughs and sends the boy to a knight's household. He pays you a year anyway, and recommends you to his friends.",
              fx: earn(1,{rep:4,honor:3}),
            },
            lose: {r:'The father hears "your son is stupid" and dismisses you.',fx:{rep:-3,honor:2}},
          },
        ],
      }),
      O(["teacher"], {
        id: "ln_tch_prince",
        minRank: 1,
        minRep: 45,
        time: 2,
        w: 1.1,
        cool: 10,
        title: "A prince as pupil",
        cond: (p,C)=>!C.flag(p,"ln_prince"),
        setup: (p,ctx)=>{royalChild(p,ctx),setFee(p,ctx,.5)},
        text: "{them}, a {prince} of the royal house, needs a tutor. There have been four already. One left with a black eye, one in tears, and two were simply dismissed. {ruler} asks for you by name.",
        choices: [
          {
            t: "Teach history: the kings who fell, and why",
            check: {s:"learning",s2:"persuasion",d:55},
            win: {
              r: "The {prince} hates you for a year and then starts asking questions you cannot answer. One day {theyHe} will rule with those questions in mind.",
              fx: earn(1,{favor:10,rep:10,fame:2,flag:"ln_prince",them:{type:"student",op:45,back:"mentor"}}),
            },
            lose: {
              r: "The {prince} throws an inkpot at you and is sent to a fencing master instead.",
              fx: {rep:-4,flag:"ln_prince",them:{type:"rival",op:-15}},
            },
          },
          {
            t: "Make the {prince} love you first, and the books later",
            check: {s:"diplomacy",s2:"etiquette",d:45},
            win: {
              r: "Riding, falconry, stories after supper; then the books, which are suddenly interesting. {them} would walk into fire for you.",
              fx: earn(1,{favor:6,rep:5,flag:"ln_prince",them:{type:"student",op:65,back:"mentor"}}),
            },
            lose: {
              r: "The {prince} enjoys the riding and refuses the books.",
              fx: earn(.5,{rep:-2,flag:"ln_prince",them:{type:"student",op:30,back:"mentor"}}),
            },
          },
          {
            t: "Flatter: let {themHim} win at everything",
            r: "The sovereign is delighted with the {prince}'s progress. So is the {prince}. You are building a monster, very comfortably.",
            fx: earn(2,{favor:8,honor:-3,flag:"ln_prince",them:{type:"student",op:35,back:"mentor"}}),
          },
        ],
      }),
      O(["teacher"], {
        id: "ln_tch_girl",
        maxRank: 2,
        w: 1.1,
        cool: 8,
        title: "The girl at the window",
        setup: (p,ctx)=>{who(p,ctx,"a scullery girl",{sex:"F",ageAdj:12,status:"peasant"}),ctx.law=C2r(p,"POL-02")?"In the Holy See the sun-sisters teach girls to read, but not scullery girls.":C2r(p,...WELL)?"Well-schools teach many girls, but not girls who scrub floors.":"Nobody here teaches girls letters, least of all girls who scrub floors."},
        text: "Every lesson, {them} scrubs the same step outside the schoolroom window. Yesterday she wrote your Old Solen lesson in the dust with a stick, without a single mistake. {law}",
        choices: [
          {
            t: "Teach her at night, in secret",
            check: {s:"learning",s2:"wil",d:40},
            win: {
              r: "A candle, a slate and an hour after the house sleeps. In two years she reads better than your paying pupils.",
              fx: {honor:4,happy:4,skill:{learning:2},them:{type:"student",op:60,back:"mentor"}},
            },
            lose: {
              r: "The housekeeper finds the slate. The girl is beaten, and you are warned.",
              fx: {honor:2,rep:-3,happy:-4},
            },
          },
          {
            t: "Persuade her mistress to let her join the lessons",
            check: {s:"persuasion",s2:"etiquette",d:50},
            win: {
              r: "The mistress is amused, then proud. A girl who can read is a girl who can keep accounts.",
              fx: {honor:3,rep:3,them:{type:"student",op:50,back:"mentor"}},
            },
            lose: {
              r: "The mistress is not amused. The girl is moved to the laundry, far from your window.",
              fx: {rep:-2,them:{type:"friend",op:15}},
            },
          },
          {
            t: "It is not your place",
            r: "You close the shutter. The next day she scrubs a different step.",
            fx: {honor:-1},
          },
        ],
      }),
      O(["teacher","scribe"], {
        id: "ln_tch_grammar",
        minRank: 2,
        minRep: 50,
        time: 2,
        w: .9,
        cool: 10,
        title: "A grammar for the young",
        cond: (p,C)=>!C.flag(p,"ln_grammar"),
        setup: (p,ctx)=>{ctx.sur=p.sur||p.given,ctx.tongue=C2r(p,...WELL)?"the letters of the Book of Wells":C2r(p,"POL-18")?"Old Tamari script":C2r(p,"POL-25","POL-26")?"Eastfolk letters":C2r(p,...ANCESTOR)?"letters and numbers":lawOf(p)==="deep"?"the carved runes":lawOf(p)==="elf"?"the old leaf-script":"Old Solen",setFee(p,ctx,.3)},
        text: "Every school in {realmShort} teaches {tongue} from the same three-hundred-year-old book, full of mistakes, written by scholars for scholars. You could write a better one: plain, short, in the order a child actually learns.",
        choices: [
          {
            t: "Write it, plainly, for children",
            check: {s:"learning",s2:"int",d:60},
            win: {
              r: "Two winters of work. Within ten years every school in the realm uses it, and children curse your name in a dozen towns.",
              fx: earn(1,both({masterwork:"the {sur} Primer",rep:12,fame:3,flag:"ln_grammar"},deed("Wrote the {sur} Primer"))),
            },
            lose: {
              r: "It is clear and short, and the masters of the colleges hate it for exactly that.",
              fx: {rep:2,wil:1,flag:"ln_grammar"},
            },
          },
          {
            t: "Write a learned commentary instead, for scholars",
            check: {s:"learning",s2:"wil",d:55},
            win: {
              r: "A thick book that a dozen men in the Known World will read with delight. They are the right dozen.",
              fx: earn(.5,{masterwork:"a Learned Commentary on the Old Grammarians",rep:8,fame:1,int:1,flag:"ln_grammar"}),
            },
            lose: {r:"A thick book nobody reads.",fx:{rep:-1,flag:"ln_grammar"}},
          },
          {t:"Not yet",r:"Next winter, perhaps.",fx:{}},
        ],
      }),
      O(["teacher"], {
        id: "ln_tch_zero",
        minRank: 1,
        w: 1,
        cool: 6,
        title: "The nothing that counts",
        setup: (p,ctx)=>{ctx.where=C2r(p,"POL-04","POL-16")?"The counting schools here already teach it to merchants' children; the old masters still sneer.":"The merchants of Lucerna and Ostra already reckon with it. Nobody here does."},
        text: "A Qadiri trader has shown you a way of writing numbers in columns, with a sign for nothing — a zero — that makes the counting board unnecessary. {where} The old masters of your college call it a heathen trick.",
        choices: [
          {
            t: "Teach it to your pupils",
            check: {s:"learning",s2:"persuasion",d:50},
            win: {
              r: "Your pupils reckon faster than their fathers. The merchants start sending their sons to you, and nobody else.",
              fx: {rep:7,skill:{learning:3,trade:2},int:.5},
            },
            lose: {
              r: "The college forbids it. Your pupils learn it anyway, behind your back, which is how you know you were right.",
              fx: {rep:-3,skill:{learning:2}},
            },
          },
          {
            t: "Learn it yourself and keep it quiet",
            r: "You use it in your own accounts. Your accounts are suddenly very good.",
            fx: {skill:{trade:3,learning:1},int:.5},
          },
          {t:"Keep to the counting board",r:"The board has served for a thousand years.",fx:{}},
        ],
      }),
      O(["teacher"], {
        id: "ln_tch_disputation",
        minRank: 2,
        w: 1.1,
        cool: 5,
        title: "The disputation",
        setup: (p,ctx)=>{who(p,ctx,"a rival lecturer"),ctx.q=A.pick(["whether a law older than the king binds the king","whether the stars move or the world does","whether a lie told at noon is a worse sin than one told at midnight","whether the elves are older than the world"])},
        text: "The college holds its great disputation on {festival}. You are matched against {them} on the question {q}. The hall will be full, the masters will judge, and the loser buys the wine for a year.",
        choices: [
          {
            t: "Argue from the old authorities",
            check: {s:"learning",s2:"int",d:55},
            win: {
              r: "You quote every book in the library and two that are not. The masters give it to you.",
              fx: {rep:10,fame:2,skill:{learning:3},them:{type:"rival",op:-20}},
            },
            lose: {
              r: "{them} quotes the same books back at you, better.",
              fx: {rep:-6,coin:-10,them:{type:"rival",op:-15}},
            },
          },
          {
            t: "Argue from plain sense and wit",
            check: {s:"persuasion",s2:"int",d:55},
            win: {
              r: "The students roar. The masters frown, then laugh, then give it to you. The students carry you out of the hall.",
              fx: {rep:9,fame:3,skill:{persuasion:3},them:{type:"rival",op:-20}},
            },
            lose: {r:"You are funny, and wrong, and the masters say so.",fx:{rep:-5,coin:-10}},
          },
          {
            t: "Concede gracefully and buy {themHim} a drink",
            r: "You lose with style. {them} is disarmed, and becomes a friend.",
            fx: {rep:-2,coin:-10,them:{type:"friend",op:35}},
          },
        ],
      }),
      O(["teacher"], {
        id: "ln_tch_master",
        minRank: 2,
        maxRank: 2,
        minRep: 60,
        time: 2,
        w: 1.3,
        cool: 5,
        title: "Master of the College",
        setup: (p,ctx)=>{who(p,ctx,"a rival for the mastership"),ctx.college="the College of "+capOf(p)},
        text: "The Master of {college} has died at his desk, quill in hand. The masters will elect a successor. Your name is one of two. The other is {them}, older, duller, and much better at dinners.",
        choices: [
          {
            t: "Stand on your teaching",
            check: {s:"learning",s2:"persuasion",d:55},
            win: {
              r: "Your pupils, now grown, write letters to the electors from every corner of the realm. You are Master of the College.",
              fx: up({rep:8,fame:3,them:{type:"rival",op:-15}}),
            },
            lose: {
              r: "The electors prefer the dinners. You go on teaching.",
              fx: {rep:2,wil:1,them:{type:"rival",op:-15}},
            },
          },
          {
            t: "Promise the masters lighter teaching and better wine",
            check: {s:"diplomacy",s2:"intrigue",d:50},
            win: {
              r: "The cellar is restocked within a month of your election. So is the masters' affection.",
              fx: up({rep:4,honor:-2}),
            },
            lose: {r:"{them} promised better wine.",fx:{rep:-2}},
          },
          {
            t: "Withdraw, and keep your pupils",
            r: "You did not become a teacher to sit on committees.",
            fx: {happy:3},
          },
        ],
      }),
      O(["teacher","clergy"], {
        id: "ln_tch_forbidden",
        minRank: 1,
        w: .9,
        cool: 8,
        title: "The forbidden book",
        setup: (p,ctx)=>{const f=fw(p);ctx.heresy=f.heresy,ctx.heretic=f.heretic},
        text: "Behind a row of psalters in the library you find a book that should not exist: a {heretic}'s treatise arguing, at length and rather well, {heresy}. The binding is new. Somebody has been reading it.",
        choices: [
          {
            t: "Burn it",
            r: "It burns slowly, page by page. Some of the pages you read before you meant to.",
            fx: {piety:3,int:.3},
          },
          {
            t: "Read it, and put it back",
            r: "You read it in one night. The world looks a little different in the morning. You put it exactly where it was.",
            fx: {int:1,skill:{learning:3},piety:-3,flag:"ln_read_heresy"},
          },
          {
            t: "Find out who has been reading it",
            check: {s:"intrigue",s2:"int",d:50},
            win: {
              r: "It is the oldest master of the house, and he begs you to keep it secret. You now own a master.",
              fx: {skill:{intrigue:2},rep:2,newRel:{type:"friend",op:20}},
            },
            lose: {r:"Whoever it is notices you looking. The book is gone the next day.",fx:{happy:-2}},
          },
          {
            t: "Hand it to the faith's court",
            r: "The court thanks you. A young lecturer is dismissed a week later. You did not know it was him.",
            fx: {piety:3,rep:2,honor:-2},
          },
        ],
      }),
      O(["teacher"], {
        id: "ln_tch_riot",
        minRank: 2,
        w: 1,
        cool: 6,
        title: "Town and gown",
        text: "A tavern quarrel over the price of wine has become a riot: students against the townsmen of {capital}, cobblestones against cudgels. Two students are dead in the street, and a mob is coming to burn the college.",
        choices: [
          {
            t: "Stand at the college gate and talk them down",
            check: {s:"persuasion",s2:"wil",d:55},
            win: {
              r: "You stand in the gateway in your gown and talk until your voice gives out. They go home. The college remembers who stood there.",
              fx: {rep:10,fame:3,honor:4,wil:1},
            },
            lose: {
              r: "A cobblestone ends the conversation. The gate holds, barely.",
              fx: {health:-14,cause:"a cobblestone",wil:2,rep:4},
            },
          },
          {
            t: "Bar the gates and arm the students",
            check: {s:"command",s2:"ins",d:50},
            win: {
              r: "The mob finds a fortress. It goes home. The town will be angry for a generation.",
              fx: {rep:5,skill:{command:2},stability:-1},
            },
            lose: {r:"The students sally out against orders. It becomes a battle.",fx:{rep:-6,stability:-1,happy:-6}},
          },
          {
            t: "Ride to the sovereign's officers for justice",
            r: "The sovereign grants the college new privileges and hangs three townsmen. Nobody is satisfied.",
            fx: {rep:3,favor:2,honor:-1},
          },
        ],
      }),
      O(["teacher"], {
        id: "ln_tch_exam",
        minRank: 1,
        w: 1.1,
        cool: 5,
        title: "The examination",
        setup: (p,ctx)=>{pickHouse(p,ctx),who(p,ctx,"a lord's son who has not studied",{sex:"M",ageAdj:18,status:"noble"}),setFee(p,ctx,.4)},
        text: "{them} of {house} sits his examination tomorrow. He has not opened a book in a year. His father's steward has called on you with a purse of {pay} and a list of the questions he hopes will be asked.",
        choices: [
          {
            t: "Pass him",
            r: "He passes. He thanks you with a wink. In twenty years he will sit on a bench and judge men by a law he never learned.",
            fx: earn(1,both({honor:-5,rep:-1},hp(8))),
          },
          {
            t: "Fail him",
            r: "He fails, loudly, in front of the whole college. {House} will remember your name.",
            fx: both({honor:4,rep:4,them:{type:"enemy",op:-40}},hp(-10)),
          },
          {
            t: "Make him actually learn it, tonight",
            check: {s:"learning",s2:"wil",d:55},
            win: {
              r: "All night, with cold water and threats. He passes on his own, barely, and is oddly proud of it.",
              fx: earn(.5,both({rep:5,honor:2,them:{type:"student",op:30,back:"mentor"}},hp(5))),
            },
            lose: {
              r: "By dawn he knows less than he did at dusk. He fails anyway, and blames you.",
              fx: {them:{type:"enemy",op:-25}},
            },
          },
        ],
      }),
      O(["teacher"], {
        id: "ln_tch_sister",
        maxRank: 1,
        w: .8,
        cool: 10,
        title: "The elder sister",
        cond: (p,C)=>!C.married(p),
        setup: (p,ctx)=>{const t=who(p,ctx,"the elder sibling of your pupil",{sex:p.flags.likes||(p.sex==="M"?"F":"M"),status:"gentry"});t.born=p.born+A.ri(-3,3)},
        text: `{them}, your pupil's elder sibling, has started sitting in on the lessons "to help", and asking questions that have nothing to do with grammar. The household has noticed. Tutors who are noticed are dismissed.`,
        choices: [
          {
            t: "Let it happen",
            r: "Long walks after the lessons, letters hidden in a grammar. It ends the way these things end: with you dismissed, and someone weeping at a window.",
            fx: {happy:6,rep:-4,them:{type:"lover",op:50}},
          },
          {
            t: "Keep it to grammar",
            check: {s:"wil",s2:"etiquette",d:45},
            win: {
              r: "You keep it to grammar. The household notices that too, and trusts you.",
              fx: {rep:3,wil:1,them:{type:"friend",op:20}},
            },
            lose: {
              r: "You try. It shows on your face. You are dismissed anyway.",
              fx: {rep:-3,happy:-4,them:{type:"friend",op:30}},
            },
          },
          {
            t: "Ask the head of the house for permission to court",
            check: {s:"persuasion",s2:"etiquette",d:60},
            win: {
              r: "Laughter, then silence, then a long talk about your prospects. Permission, of a kind.",
              fx: {rep:2,honor:2,them:{type:"lover",op:50}},
            },
            lose: {r:"You are thrown out of the house by the steward personally.",fx:{rep:-5,happy:-6}},
          },
        ],
      }),
      O(["teacher"], {
        id: "ln_tch_free_school",
        minRank: 1,
        w: 1,
        cool: 8,
        title: "A school for the poor",
        setup: (p,ctx)=>{ctx.kind=schoolWord(p)},
        text: "A rich widow of {town} has died and left 300 suns for a free {kind} for poor children, if someone will run it. Her heirs are contesting the will. The children are already waiting outside the empty room.",
        choices: [
          {
            t: "Take it on, and fight the heirs for the money",
            check: {s:"persuasion",s2:"learning",d:50},
            win: {
              r: "The court upholds the will. Forty children learn their letters who never would have. Some of them will run the realm one day.",
              fx: {rep:10,fame:2,honor:5,deed:"Founded a free school for poor children"},
            },
            lose: {
              r: "The heirs win. You teach the children anyway, for a year, for nothing, until you cannot.",
              fx: {honor:4,coin:-15,wil:1},
            },
          },
          {
            t: "Ask the guilds to fund it instead",
            check: {s:"diplomacy",s2:"trade",d:50},
            win: {
              r: "The guilds pay, on condition that their apprentices come too. A school is born, with a lot of opinions attached.",
              fx: {rep:7,skill:{diplomacy:2}},
            },
            lose: {r:"The guilds want their own school, for their own sons only.",fx:{rep:-1}},
          },
          {
            t: "Leave it to someone else",
            r: "The room stays empty. The children go back to the fields.",
            fx: {honor:-1},
          },
        ],
      }),
      O(["teacher"], {
        id: "ln_tch_tongues",
        minRank: 1,
        w: .9,
        cool: 6,
        title: "A house of many tongues",
        setup: (p,ctx)=>{setForeignTongue(p,ctx),setFee(p,ctx,.25)},
        text: "A merchant house trading with {dest} wants its children taught {destLang} and the manners of {destCap}, and will pay {pay} for a year. You do not speak {destLang}. You could learn it a week ahead of them.",
        choices: [
          {
            t: "Learn it a week ahead of them",
            check: {s:"int",s2:"learning",d:50},
            win: {
              r: "A year of frantic nights. By the end you and your pupils speak it well, and you speak it better.",
              fx: earn(1,both(learnLang,{rep:5,int:.5})),
            },
            lose: {r:"The children overtake you by midsummer and mock your accent.",fx:earn(.5,{rep:-3})},
          },
          {
            t: "Hire a native tutor and take a cut",
            r: "The tutor teaches, you supervise. Everyone is happy and nobody learns anything from you.",
            fx: earn(.6,{rep:1}),
          },
          {
            t: "Decline honestly",
            r: "The merchant appreciates the honesty and sends his nephews for Old Solen instead.",
            fx: earn(.3,{honor:2}),
          },
        ],
      }),
    ]);
    A.defEvents([
      D(["teacher"], {
        id: "ln_d_tch_rod",
        w: 1,
        title: "The birch rod",
        setup: (p,ctx)=>{who(p,ctx,"a boy who will not learn",{sex:"M",ageAdj:10})},
        text: "{them} has failed his declensions for the fifth day running, and laughed about it. Every master you ever had would reach for the rod. The other boys are watching to see if you will.",
        choices: [
          {
            t: "The rod",
            r: "He learns his declensions, and to hate you. The class is very quiet for a month.",
            fx: {rep:1,them:{type:"enemy",op:-20}},
          },
          {
            t: "Find out why",
            check: {s:"persuasion",s2:"ins",d:40},
            win: {
              r: "He cannot see the board; he has been too proud to say. You move him to the front. He is top of the class by spring.",
              fx: {rep:3,honor:2,them:{type:"student",op:40,back:"mentor"}},
            },
            lose: {r:"He will not tell you. He fails again tomorrow.",fx:{happy:-2}},
          },
          {
            t: "Make him teach it to the youngest boy",
            r: "He learns it in an afternoon, so as not to look a fool in front of a six-year-old.",
            fx: {skill:{persuasion:1},int:.3},
          },
        ],
      }, (p,C)=>lit(p)&&C.prof(p,"learning",50)&&J(p,"clergy","scribe")),
      D(["teacher"], {
        id: "ln_d_tch_fees",
        w: 1,
        title: "The fees",
        setup: (p,ctx)=>{who(p,ctx,"a pupil's father who will not pay",{sex:"M"})},
        text: "{them} owes you a year's fees and has started crossing the street when he sees you. His son is your best pupil.",
        choices: [
          {
            t: "Keep teaching the boy anyway",
            r: "You are not paid. The boy goes on to the college, and sends you money ten years later.",
            fx: {honor:3,coin:-5,happy:2},
          },
          {
            t: "Shame the father in the market",
            check: {s:"persuasion",s2:"intimidation",d:45},
            win: {r:"He pays, in public, red to the ears.",fx:{coin:15,rep:1,them:{type:"enemy",op:-25}}},
            lose: {r:"He shames you back, louder. You are a schoolmaster brawling over pennies.",fx:{rep:-3}},
          },
          {
            t: "Send the boy home",
            r: "The boy cries. The father is relieved. You are poorer in two ways.",
            fx: {honor:-2},
          },
        ],
      }),
      D(["teacher"], {
        id: "ln_d_tch_former",
        w: .8,
        cool: 10,
        title: "A former pupil",
        setup: (p,ctx)=>{who(p,ctx,A.pick(["a captain of the guard","a rich wool merchant","a young prior","a judge of the town court"]),{})},
        text: "A well-dressed stranger stops you in the street: {them}, now {themOcc}, whom you taught to read twenty years ago in a cold room above a stable. {them} remembers every lesson. You remember the stable.",
        choices: [
          {
            t: "Share a cup and old stories",
            r: "You laugh until the tavern closes. {them} insists on paying, and on sending you a cask at every feast after.",
            fx: {happy:6,them:{type:"friend",op:40}},
          },
          {
            t: "Ask a favor",
            r: "{them} is glad to help. It is strange to be on the other side of the table.",
            fx: {coin:20,them:{type:"friend",op:15}},
          },
        ],
      }, (p,C)=>lit(p)&&C.prof(p,"learning",45)&&C.ageAdj(p)>=35),
    ]);
    A.defEvents([
      O(["minstrel"], {
        id: "ln_min_wedding",
        maxRank: 1,
        young: !0,
        w: 1.3,
        title: "A wedding to play",
        setup: (p,ctx)=>{ctx.instr=instr(p),setFee(p,ctx,.12,2)},
        text: "A miller's daughter of {home} marries the smith's son. A commoner's wedding feast costs about 20 suns, a third of a farmhand's year, and they want music for every sun of it: ring dances, love songs, and something rude for after the bride has gone up.",
        choices: [
          {
            t: "Play them into the ground",
            check: {s:"music",s2:"sta",d:40},
            win: {
              r: "Your {instr} goes from noon to dawn. The whole village dances, the old men weep at the love songs, and three other weddings book you on the spot.",
              fx: earn(1.5,{rep:5,skill:{music:3},happy:3}),
            },
            lose: {
              r: "A string breaks in the third dance and your voice in the fifth. They are kind about it.",
              fx: earn(.6,{rep:-2}),
            },
          },
          {
            t: "Play sweet and leave early",
            r: "They pay you and forget you, which at a wedding is a kind of success.",
            fx: earn(1,{rep:1}),
          },
          {
            t: "Sing the rude one before the bride has gone up",
            check: {s:"music",s2:"deception",d:45},
            win: {
              r: "Cleverly enough that the bride laughs hardest. You are the talk of the valley.",
              fx: earn(1.2,{rep:4,fame:1}),
            },
            lose: {r:"The bride's mother takes your {instr} away and throws it in the millpond.",fx:{rep:-3,happy:-4}},
          },
        ],
      }),
      O(["minstrel"], {
        id: "ln_min_contest",
        maxRank: 2,
        young: !0,
        w: 1.2,
        cool: 3,
        title: "The singing at the feast",
        setup: (p,ctx)=>{ctx.f=A.pick(GD.FESTIVALS)[0],who(p,ctx,"a singer who has won three years running"),setFee(p,ctx,.25,5)},
        text: "On {f} the town of {town} holds its singing: a silver cup, a purse of {pay}, and the right to sing at the lord's table for a year. {them} has won it three years running and is already polishing the cup.",
        choices: [
          {
            t: "Sing the old songs better than anyone",
            check: {s:"music",s2:"int",d:50},
            win: {
              r: "Every word true to the old way, every note clean. The judges are old men, and you have made them young.",
              fx: earn(1,{rep:8,fame:2,skill:{music:3},them:{type:"rival",op:-20}}),
            },
            lose: {
              r: "{them} sings the same songs, better. You come second, which nobody remembers.",
              fx: {rep:1,skill:{music:2}},
            },
          },
          {
            t: "Sing something new, your own",
            check: {s:"music",s2:"wil",d:55},
            win: {
              r: "Silence when you finish, then a roar. By nightfall the town is singing your song in the streets.",
              fx: earn(1,{rep:10,fame:3,skill:{music:4},them:{type:"rival",op:-25}}),
            },
            lose: {r:"They wanted the old songs. They tell you so, with vegetables.",fx:{rep:-3,happy:-4}},
          },
          {
            t: "Loosen {them}'s strings before the contest",
            check: {s:"stealth",s2:"deception",d:45},
            win: {
              r: "{them}'s harp goes out of tune in the first verse. You win, and you know why.",
              fx: earn(1,{rep:5,honor:-5,them:{type:"rival",op:-30}}),
            },
            lose: {
              r: "Caught with your hand on another singer's harp. You are barred from the singing for life.",
              fx: {rep:-10,honor:-5,them:{type:"enemy",op:-40}},
            },
          },
        ],
      }),
      O(["minstrel"], {
        id: "ln_min_satire",
        minRank: 1,
        w: 1.1,
        cool: 5,
        title: "A song with teeth",
        setup: (p,ctx)=>{lordOf(p,ctx,"a lord with a long nose"),setFee(p,ctx,.35),ctx.flaw=A.pick(["ran from the ford at the last battle","married for a dowry and lost it at dice","cannot sit a horse","owes money to the household steward"])},
        text: "A rival lord pays you {pay} for a song about {themFull} of {house}, who, as everyone knows, {flaw}. It should be funny, catchy, and sung in every tavern within a month.",
        choices: [
          {
            t: "Write it, and make it sting",
            check: {s:"music",s2:"int",d:50},
            win: {
              r: "By midsummer children sing it at {themFull} in the street. {House} is a laughing-stock, and you are famous, and hunted.",
              fx: earn(1.5,both({fame:3,rep:6,them:{type:"enemy",op:-60}},hp(-15))),
            },
            lose: {
              r: "It is not funny. It is just cruel, and {house}'s men find you anyway.",
              fx: earn(1,{health:-12,cause:"a beating by a lord's men",rep:-3,them:{type:"enemy",op:-50}}),
            },
          },
          {
            t: "Sell the song to its target instead",
            check: {s:"deception",s2:"intrigue",d:50},
            win: {
              r: "{themFull} pays double for the song to be burned, and for the name of the man who ordered it.",
              fx: earn(2.5,both({honor:-5,them:{type:"friend",op:20}},hp(5))),
            },
            lose: {
              r: "Both lords learn what you did. Neither is amused.",
              fx: {rep:-6,honor:-5,newRel:{type:"enemy",op:-40}},
            },
          },
          {t:"Refuse",r:"You are a singer, not a hired knife. Someone else writes it, badly.",fx:{honor:2}},
        ],
      }),
      O(["minstrel"], {
        id: "ln_min_ruin",
        minRank: 2,
        w: 1,
        cool: 8,
        title: "The song that ruins a lord",
        setup: (p,ctx)=>{lordOf(p,ctx,"a cruel lord"),ctx.crime=A.pick(["hanged a boy for a hare","took the seed grain in the famine winter","burned a village for an unpaid fine","drove a widow off her land and married her daughter"])},
        text: "The villagers under {themFull} of {house} come to you at night, cap in hand. Their lord {crime}. No court will hear them. But a song, in every hall, in every market, sung by a singer people listen to — that the great cannot ignore.",
        choices: [
          {
            t: "Make the song, and sing it everywhere",
            check: {s:"music",s2:"wil",d:55},
            win: {
              r: "It goes from hall to hall like a fire in summer. Within a year the liege of {house} takes the land away, to be rid of the song. The village sends you a ham every winter.",
              fx: both({fame:6,honor:6,rep:8,them:{type:"enemy",op:-80}},hp(-25),deed("Sang the song that brought down a cruel lord")),
            },
            lose: {
              r: "The lord's men catch you on the road before the song has gone far.",
              fx: {health:-18,cause:"a lord's men",wound:"scar_face",honor:4,wil:2,them:{type:"enemy",op:-60}},
            },
          },
          {
            t: "Make it, but put no name in it",
            check: {s:"music",s2:"intrigue",d:50},
            win: {
              r: "Every listener knows exactly who is meant. Nobody can prove it. The hangings stop, for fear of the song.",
              fx: both({fame:3,honor:3,rep:5},hp(-10)),
            },
            lose: {r:"Too vague. People like the tune and miss the point.",fx:{rep:1}},
          },
          {
            t: "Tell them you cannot",
            r: "They go home. You sing about other things, and do not sleep well.",
            fx: {honor:-2},
          },
        ],
      }),
      O(["minstrel"], {
        id: "ln_min_makes_lord",
        minRank: 1,
        w: 1,
        cool: 8,
        title: "The song that makes a lord",
        setup: (p,ctx)=>{who(p,ctx,"a landless knight",{status:"gentry"}),ctx.deed=A.pick(["held a bridge alone against a dozen raiders for an hour","carried a drowning child out of a flood with an arrow in the shoulder","turned back a wolf pack from a sheepfold with a burning brand","paid a whole village's fine from a thin purse"])},
        text: "Nobody has heard of {them}, a poor knight who once {deed}. You were there. It was the bravest thing you ever saw, and it is already being forgotten.",
        choices: [
          {
            t: "Make it a song worth remembering",
            check: {s:"music",s2:"int",d:50},
            win: {
              r: "The song spreads. Lords ask who this knight is. Within two years {them} has a patron, a manor and a wife, and never forgets whose song made {themHim}.",
              fx: {fame:3,rep:7,honor:2,flag:"ln_made_lord",them:{type:"friend",op:60}},
            },
            lose: {
              r: "A good song, but there are many good songs. {them} stays poor and grateful.",
              fx: {rep:2,them:{type:"friend",op:30}},
            },
          },
          {
            t: "Make it bigger than it was",
            check: {s:"music",s2:"deception",d:45},
            win: {
              r: "One bridge becomes three, a dozen raiders become a hundred. The song is a sensation, and {them} spends the rest of {theirHis} life living up to it.",
              fx: {fame:4,rep:6,honor:-2,them:{type:"friend",op:40}},
            },
            lose: {r:"Someone who was there says so, loudly.",fx:{rep:-4}},
          },
          {t:"Leave it; heroes are ten a penny",r:"The deed is forgotten, like most.",fx:{}},
        ],
      }),
      O(["minstrel"], {
        id: "ln_min_epic",
        minRank: 2,
        minRep: 50,
        time: 2,
        w: .9,
        cool: 10,
        title: "The epic",
        cond: (p,C)=>!C.flag(p,"ln_epic"),
        setup: (p,ctx)=>{pickHouse(p,ctx),setFee(p,ctx,.5),ctx.hn=ctx.house.replace(/^House /,"")},
        text: "{House} wants an epic: the whole story of the house, from the first ancestor to the present lord, to be sung at every great feast for a hundred years. They will feed you, house you and pay {pay}. They expect it to be flattering.",
        choices: [
          {
            t: "Write the true epic, glory and shame together",
            check: {s:"music",s2:"learning",d:60},
            win: {
              r: "Three years, nine thousand lines. The lord weeps at the parts about his grandfather and storms out at the parts about his father. In a hundred years it will be the only thing anyone knows about them.",
              fx: earn(1,both({masterwork:"the Lay of {hn}",rep:15,fame:6,honor:4,flag:"ln_epic"},hp(-5),deed("Made the Lay of {hn}"))),
            },
            lose: {
              r: "Too long, too honest, and not good enough to survive either. The house pays you to stop.",
              fx: earn(.5,{rep:-3,flag:"ln_epic"}),
            },
          },
          {
            t: "Write the flattering epic",
            check: {s:"music",s2:"int",d:50},
            win: {
              r: "Every ancestor brave, every bride beautiful, every defeat a moral victory. They love it. Their rivals sing parodies of it.",
              fx: earn(1.5,both({masterwork:"the Lay of {hn}",rep:10,fame:4,honor:-2,flag:"ln_epic"},hp(15))),
            },
            lose: {r:"Flattering and dull. They pay you and sing something else.",fx:earn(1,{rep:-2,flag:"ln_epic"})},
          },
          {t:"Decline",r:"You are not anyone's house poet. Not for that price, anyway.",fx:{rep:-1}},
        ],
      }),
      O(["minstrel"], {
        id: "ln_min_truth",
        minRank: 1,
        w: 1,
        cool: 10,
        title: "What the song leaves out",
        cond: (p,C)=>!C.flag(p,"ln_song_truth"),
        setup: (p,ctx)=>{const s=songFor(p);ctx.song=s.t,ctx.lie=s.lie,ctx.truth=s.truth,ctx.own=s.r.includes(p.realm)?1:0,who(p,ctx,"an old scholar",{ageAdj:70})},
        text: 'You have sung "{song}" a hundred times: how {lie}. Tonight, by an inn fire, an old scholar, {them}, listens to it with a face like stone, and then tells you what the old records say really happened: {truth}.',
        choices: [
          {
            t: "Sing the truth",
            check: {s:"music",s2:"wil",d:55},
            win: {
              r: "You make a new song of it, and the new song is better than the old. The people who should be angry are very angry.",
              fx: (p,ctx)=>A.applyFx(p,ctx.own?{fame:5,honor:5,rep:4,favor:-10,flag:"ln_song_truth"}:{fame:4,honor:4,rep:5,flag:"ln_song_truth"},ctx),
            },
            lose: {
              r: "You sing it once, in a hall. You are thrown out before the last verse, and the story follows you.",
              fx: (p,ctx)=>A.applyFx(p,ctx.own?{health:-10,cause:"being thrown down steps",favor:-8,honor:3,flag:"ln_song_truth"}:{rep:-3,honor:3,flag:"ln_song_truth"},ctx),
            },
          },
          {
            t: "Keep it to yourself",
            r: "You go on singing the old way. But you sing it differently now, and people who know notice.",
            fx: {int:.5,skill:{music:2},flag:"ln_song_truth"},
          },
          {
            t: "Write a new verse that hints, for those who know",
            check: {s:"music",s2:"int",d:50},
            win: {
              r: "One verse, two meanings. The innocent hear the old song; the wise hear the truth and buy you a drink.",
              fx: {rep:6,fame:2,skill:{music:3},flag:"ln_song_truth"},
            },
            lose: {r:"The hint is so clever nobody notices it.",fx:{skill:{music:1}}},
          },
        ],
      }),
      O(["minstrel"], {
        id: "ln_min_poet",
        minRank: 2,
        maxRank: 2,
        minRep: 60,
        time: 2,
        w: 1.3,
        cool: 5,
        title: "The court poet's laurel",
        text: "The court poet of {realmShort} is dead, and {ruler} will hear three singers on the feast day before choosing another. You are one of them. The other two have patrons on the council. You have your songs.",
        choices: [
          {
            t: "Sing for the sovereign's heart",
            check: {s:"music",s2:"persuasion",d:55},
            win: {
              r: "A song about the sovereign's mother. The hall is silent; the sovereign is not quite able to speak. The laurel is yours.",
              fx: up({favor:10,fame:4,rep:8}),
            },
            lose: {r:"A fine song, but the sovereign's mother was not well loved.",fx:{rep:2,favor:-2}},
          },
          {
            t: "Sing for the court's amusement",
            check: {s:"music",s2:"int",d:50},
            win: {
              r: "The court laughs until it cries. A court that laughs is a court that wants you back.",
              fx: up({favor:6,fame:3,rep:5}),
            },
            lose: {r:"The jokes are about the wrong councillors.",fx:{rep:-3,favor:-4}},
          },
          {
            t: "Do not compete; poets are not racehorses",
            r: "The court thinks you proud. The taverns think you right.",
            fx: {rep:2,happy:2},
          },
        ],
      }),
      O(["minstrel"], {
        id: "ln_min_patron",
        maxRank: 2,
        w: 1,
        cool: 8,
        title: "A patron",
        setup: (p,ctx)=>{who(p,ctx,"a rich widow who loves music",{sex:"F",status:"merchant",ageAdj:50}),setFee(p,ctx,.5)},
        text: "{them}, a rich widow of {town}, offers you {pay} a year, a room, and a place at her table, if you will sing for her and her guests and nobody else.",
        choices: [
          {
            t: "Accept",
            r: "A good roof, good food, and a patron who listens. You write more in a year than in the five before, all of it for her guests.",
            fx: earn(1,{happy:5,skill:{music:3},them:{type:"friend",op:50}}),
          },
          {
            t: "Accept, and keep singing in the taverns on the side",
            check: {s:"deception",s2:"stealth",d:45},
            win: {
              r: "Her money and the taverns' fame. She never finds out, or pretends not to.",
              fx: earn(1,{rep:4,honor:-2}),
            },
            lose: {
              r: "She finds you singing at the Drowned Queen on her name-day. The room is let to a harpist.",
              fx: earn(.3,{rep:-2,them:{type:"enemy",op:-30}}),
            },
          },
          {
            t: "Decline; the road is your patron",
            r: "She is offended, then intrigued. She comes to hear you in the taverns instead, which nobody in her circle can understand.",
            fx: {rep:2,them:{type:"friend",op:20}},
          },
        ],
      }),
      O(["minstrel"], {
        id: "ln_min_news",
        minRank: 1,
        w: 1,
        cool: 6,
        title: "Songs carry news",
        setup: (p,ctx)=>{const e=A.enemyRealmOf(p.realm);ctx.enemy=e?A.realmShort(e):"the old enemy",setFee(p,ctx,.3)},
        text: "A councillor's man pays you {pay} to carry a new song round every tavern in the realm: that the men of {enemy} poison wells and eat children, and that the levy should be ready. Songs are history, and the songs are rarely what happened.",
        choices: [
          {
            t: "Sing it",
            r: "By harvest every alehouse sings it. Recruiting is easy that year.",
            fx: earn(1,{fame:1,honor:-4,favor:4,stability:1}),
          },
          {
            t: "Sing it, but change the words so it mocks the councillor",
            check: {s:"music",s2:"intrigue",d:55},
            win: {
              r: "The tune is his; the jokes are yours. The taverns love it. The councillor cannot complain without admitting the song was his.",
              fx: earn(1,{fame:3,rep:5}),
            },
            lose: {r:"He complains anyway, to people who matter.",fx:{favor:-6,rep:-2}},
          },
          {
            t: "Refuse",
            r: "You sing what you like. The councillor writes your name in a small book.",
            fx: {honor:3,favor:-3},
          },
        ],
      }),
      O(["minstrel"], {
        id: "ln_min_line",
        minRank: 1,
        w: 1.3,
        cool: 4,
        title: "The praise of the line",
        cond: p=>C2r(p,...ANCESTOR)||p.faith==="REL-09",
        setup: (p,ctx)=>{pickHouse(p,ctx),setFee(p,ctx,.3),ctx.fine=p.realm==="POL-22"?"In Abara the fine is forty salt bars.":"In Zanara the fine is heavy."},
        text: "At the naming of a child of {house} you must recite the line: forty generations of names, in order, with the deeds of each. Any dead king's name may only be spoken inside the rite, never in the feasting after. {fine} The hall is full of people who know the line better than you do.",
        choices: [
          {
            t: "Recite it all, without a slip",
            check: {s:"music",s2:"learning",d:55},
            win: {
              r: "Forty generations, every name in its place, every deed in its verse. The grandmothers nod. The house pays like a house.",
              fx: earn(1.5,both({rep:8,fame:2,skill:{learning:2,music:2}},hp(8))),
            },
            lose: {r:"You swap two great-grandfathers. The grandmothers do not nod.",fx:both({rep:-6},hp(-6))},
          },
          {
            t: "Add a verse in praise of the newborn",
            check: {s:"music",s2:"int",d:45},
            win: {
              r: "A new name added to the line in a new verse. The mother weeps. You will be asked back.",
              fx: earn(1.2,both({rep:5},hp(5))),
            },
            lose: {r:"Your verse is clumsy beside the old ones.",fx:earn(.8,{rep:-1})},
          },
        ],
      }),
      O(["minstrel"], {
        id: "ln_min_lay",
        minRank: 1,
        w: 1.3,
        cool: 4,
        title: "The long lay",
        cond: p=>lawOf(p)==="north"||p.faith==="REL-03",
        setup: (p,ctx)=>{pickHouse(p,ctx),setFee(p,ctx,.3),ctx.lay=p.realm==="POL-01"?"the Lay of Hartgate":p.realm==="POL-08"?"the Lay of the Winter Crossing":A.pick(["the Lay of Hartgate","the Lay of the Winter Crossing","an old oath-lay of the first halls"])},
        text: "At the Hunter's Feast the hall of {house} expects a hall-singer to chant {lay} from beginning to end, from memory, before the fire burns down: two thousand lines. Every man on the benches knows when you get one wrong.",
        choices: [
          {
            t: "Chant it all, and make the hall shout at the right places",
            check: {s:"music",s2:"int",d:55},
            win: {
              r: "The benches roar on every stake and every charge. The lord gives you a ring from his own hand.",
              fx: earn(1.5,both({rep:8,fame:2,skill:{music:3}},hp(5))),
            },
            lose: {
              r: "You lose your place at the ford. A drunk thane finishes the verse for you, to great applause.",
              fx: earn(.5,{rep:-5,happy:-3}),
            },
          },
          {
            t: "Shorten it cleverly",
            check: {s:"music",s2:"deception",d:45},
            win: {
              r: "You cut the dull parts so smoothly that nobody notices. They say it is the best they have heard it.",
              fx: earn(1,{rep:4}),
            },
            lose: {r:"Somebody notices. Everybody notices.",fx:earn(.5,{rep:-4})},
          },
        ],
      }),
      O(["minstrel"], {
        id: "ln_min_lament",
        minRank: 1,
        w: 1,
        cool: 6,
        title: "A lament",
        setup: (p,ctx)=>{ctx.loss=C2r(p,"POL-14","POL-08","POL-04")||A.prov(p.home)&&A.prov(p.home).coast?"the fishing fleet lost in the autumn gale, eleven boats and forty men":A.atWar(p.realm).length?"the levy of "+A.provName(p.home)+", cut down at the river":"the children taken by the summer flux",setFee(p,ctx,.15)},
        text: "The whole of {home} is in black for {loss}. The priest has said the words. Now they want a song, so the names are not forgotten.",
        choices: [
          {
            t: "Make a lament with every name in it",
            check: {s:"music",s2:"wil",d:45},
            win: {
              r: "Every name, every face, in a song simple enough for children. They sing it at every anniversary for fifty years.",
              fx: {fame:3,honor:3,rep:6,wil:1,skill:{music:3}},
            },
            lose: {
              r: "You cannot get through it without breaking. They understand. It is still a good song.",
              fx: {rep:3,honor:2,wil:1.5},
            },
          },
          {
            t: "Sing it for coin at the lord's table instead",
            r: "The lord pays well for a fashionable grief. The village hears it was sold.",
            fx: earn(1.5,{honor:-3,rep:-2}),
          },
        ],
      }),
    ]);
    A.defEvents([
      D(["minstrel"], {
        id: "ln_d_min_brawl",
        w: 1,
        title: "A fight in the tavern",
        setup: (p,ctx)=>{ctx.instr=instr(p)},
        text: "Halfway through your best song two tables of drovers decide they hate each other. A bench goes over. A jug flies past your head. Your {instr} is the most valuable thing in the room, and it is in your hands.",
        choices: [
          {
            t: "Keep playing, louder, something they all know",
            check: {s:"music",s2:"wil",d:50},
            win: {
              r: "By the second chorus they are singing instead of fighting, arms round each other, weeping about their mothers.",
              fx: {fame:1,rep:3,skill:{music:2}},
            },
            lose: {
              r: "A drover breaks a stool over your shoulders. The {instr} survives. You mostly do.",
              fx: {health:-8,cause:"a tavern brawl",wil:1},
            },
          },
          {
            t: "Dive under the table with your {instr}",
            r: "You wait it out among the dogs. The landlord pays you double for not getting killed on his premises.",
            fx: {coin:3},
          },
          {
            t: "Join in",
            r: "Somebody has to hit the man who threw the jug.",
            fx: {
              duel: {
                tier: 1,
                title: "a drunk drover",
                opts: {kind:"brawl",place:"the tavern",lethal:!1,toYield:!0,title:"A fight in the tavern"},
              },
            },
          },
        ],
      }, (p,C)=>C.prof(p,"music",50)),
      D(["minstrel"], {
        id: "ln_d_min_broken",
        w: .9,
        cool: 8,
        title: "A broken instrument",
        setup: (p,ctx)=>{ctx.instr=instr(p)},
        text: "Your {instr}, the one you have played since you were a child, cracks in the damp of a long winter. A good maker in {capital} asks 30 suns for a new one. A carpenter could patch the old one for 3.",
        choices: [
          {
            t: "Buy the new one",
            req: p=>p.coin>=30,
            r: "It sounds like nothing you have ever played. You spend a month falling in love with it.",
            fx: {coin:-30,skill:{music:3},happy:4},
          },
          {
            t: "Patch the old one yourself",
            check: {s:"craft",s2:"music",d:45},
            win: {
              r: "Glue, a clamp and a week of patience. It sounds better than before, somehow.",
              fx: {skill:{craft:2,music:1},happy:3},
            },
            lose: {
              r: "It buzzes on every low note forever after. You learn to play around it.",
              fx: {happy:-2,skill:{music:1}},
            },
          },
          {
            t: "Sing without it for a season",
            r: "Your voice gets stronger. Your back gets weaker from carrying the begging bowl.",
            fx: {skill:{music:2},coin:-5},
          },
        ],
      }, (p,C)=>C.prof(p,"music",55)),
      D(["minstrel"], {
        id: "ln_d_min_heart",
        w: 1,
        cool: 8,
        title: "A face in the crowd",
        text: "In every town there is one face in the crowd that listens differently. In {town} this season it belongs to someone who comes every night, stands at the back, and leaves before the last song.",
        choices: [
          {
            t: "Sing the last song first",
            r: "They stay. You walk them home. The road can wait a while.",
            fx: {lover:!0,happy:6},
          },
          {
            t: "Move on; the road is long",
            r: "You leave at dawn, and write a song about it that pays for the whole winter.",
            fx: {skill:{music:2},happy:-2,coin:6},
          },
        ],
      }, (p,C)=>C.prof(p,"music",50)),
    ]);
    A.defEvents([
      O(["scribe"], {
        id: "ln_scr_letters",
        maxRank: 1,
        young: !0,
        w: 1.3,
        title: "Letters for those who cannot write",
        setup: (p,ctx)=>{who(p,ctx,"a soldier's mother",{sex:"F",ageAdj:48}),ctx.price=lawOf(p)==="sun"?"six pence a letter":"a penny a line"},
        text: "Few on Ardan can write. You sit by the market cross at {price}, and today {them} wants a letter to her son in the levy. She talks for half an hour: the roof, the dog, his sister's baby, and please, please come home.",
        choices: [
          {
            t: "Write it all, in her words",
            r: "Every word, the dog included. She makes you read it back three times and pays you in coin and a honey cake.",
            fx: {coin:2,honor:2,rep:2,skill:{learning:1}},
          },
          {
            t: "Make it fine, the way letters ought to be",
            check: {s:"learning",s2:"persuasion",d:35},
            win: {
              r: "You turn her half hour into a page that would make a captain weep. She cannot read it, but she can tell it is beautiful.",
              fx: {coin:3,rep:4,skill:{learning:2}},
            },
            lose: {
              r: "You make it so fine she does not recognise her own words when you read it back.",
              fx: {coin:1,happy:-2},
            },
          },
          {
            t: "Write it for nothing",
            r: "She cries. Half the market sees it. You have customers all summer.",
            fx: {honor:3,rep:3,them:{type:"friend",op:30}},
          },
        ],
      }),
      O(["scribe"], {
        id: "ln_scr_copy",
        maxRank: 1,
        young: !0,
        w: 1.2,
        title: "A book to copy",
        setup: (p,ctx)=>{setFee(p,ctx,.25,5),ctx.book=p.faith==="REL-07"?"a fine Book of Wells for a merchant's wedding gift":A.pick(["a book of hours for a lady of the court","a herbal with forty plants to draw","a copy of the town's customs for the guild hall"])},
        text: "Three months of work: {book}. The pay is {pay}. The parchment alone cost more than you earn in a year, and one blot ruins a page.",
        choices: [
          {
            t: "Slow and perfect",
            check: {s:"craft",s2:"learning",d:45},
            win: {
              r: "Not a blot. The buyer shows it to her friends, and her friends send for you.",
              fx: earn(1.3,{rep:6,skill:{learning:3,craft:2}}),
            },
            lose: {r:"A blot on the last page, of course. You scrape it, and it shows.",fx:earn(.8,{rep:-1})},
          },
          {
            t: "Fast, to take another job",
            r: "Finished in half the time, with three mistakes nobody will notice for a year.",
            fx: earn(1.6,{rep:-2}),
          },
          {
            t: "Illuminate the capitals yourself",
            check: {s:"craft",s2:"int",d:55},
            win: {
              r: "Little beasts climb every capital letter, and one of them looks exactly like the buyer's husband. She pays double.",
              fx: earn(2,{rep:7,fame:1,skill:{craft:3}}),
            },
            lose: {r:"The beasts look like smudges.",fx:earn(.7,{rep:-2})},
          },
        ],
      }),
      O(["scribe"], {
        id: "ln_scr_rolls",
        minRank: 1,
        maxRank: 3,
        w: 1.1,
        title: "The rolls that do not add",
        setup: (p,ctx)=>{who(p,ctx,"a reeve with a new roof",{sex:"M"}),setFee(p,ctx,.2)},
        text: "Copying the year's rent-rolls into the great book, you notice what nobody else has: the reeve {them} records fewer hearths in his valley every year, and collects from just as many. He has a new tiled roof.",
        choices: [
          {
            t: "Report it",
            r: "He is dismissed and fined. You are trusted with harder work, and watched by his friends.",
            fx: {rep:6,honor:2,perf:6,them:{type:"enemy",op:-50}},
          },
          {
            t: "Let him know you know",
            check: {s:"intrigue",s2:"deception",d:45},
            win: {
              r: "A quiet word. Every quarter-day after, a small purse appears on your desk.",
              fx: earn(2,{honor:-6,them:{type:"acquaint",op:-10}}),
            },
            lose: {
              r: "He goes to your master first, with his own version.",
              fx: {rep:-8,perf:-8,them:{type:"enemy",op:-40}},
            },
          },
          {
            t: "Copy what you are given",
            r: "You are a copyist, not a judge. The rolls are copied, beautifully, and wrong.",
            fx: {wil:.3},
          },
        ],
      }),
      O(["scribe"], {
        id: "ln_scr_charter",
        minRank: 2,
        w: 1,
        cool: 8,
        title: "A charter of liberties",
        cond: (p,C)=>!C.flag(p,"ln_charter"),
        setup: (p,ctx)=>{pickHouse(p,ctx),ctx.tn=A.T("{town}",{}),setFee(p,ctx,.4)},
        text: "The townsmen of {tn} have scraped together enough silver to buy a charter from {house}: their own court, their own market, their own walls, and a year and a day to make a runaway free. They want you to draft it. The lord's steward wants it drafted too, differently.",
        choices: [
          {
            t: "Draft it for the town, tight and clear",
            check: {s:"learning",s2:"persuasion",d:55},
            win: {
              r: "Every liberty nailed down in plain words. The town will read it aloud on its feast day for three hundred years.",
              fx: earn(1,both({masterwork:"the Charter of {tn}",rep:10,fame:3,honor:3,flag:"ln_charter"},hp(-10),deed("Drafted the Charter of {tn}"))),
            },
            lose: {
              r: "The lord's steward finds the loopholes before the seal is dry.",
              fx: earn(.5,{rep:-3,flag:"ln_charter"}),
            },
          },
          {
            t: "Draft it for the lord, with gaps a cart could pass through",
            check: {s:"deception",s2:"learning",d:50},
            win: {
              r: "The town gets a beautiful charter. The lord gets everything back in the fine print.",
              fx: earn(2,both({honor:-6,flag:"ln_charter"},hp(12))),
            },
            lose: {
              r: "A town clerk reads it twice and finds the gaps. The town hates you, and the lord has no use for a failure.",
              fx: {rep:-8,honor:-6,flag:"ln_charter"},
            },
          },
          {
            t: "Draft it fairly, for both",
            check: {s:"diplomacy",s2:"learning",d:50},
            win: {
              r: "Each side gets most of what it wants. Both sign. The town prospers, and so do the lord's tolls.",
              fx: earn(1.3,both({masterwork:"the Charter of {tn}",rep:8,fame:2,flag:"ln_charter"},hp(4))),
            },
            lose: {r:"Each side thinks you favoured the other.",fx:{rep:-2}},
          },
        ],
      }),
      O(["scribe"], {
        id: "ln_scr_translate",
        minRank: 1,
        w: 1,
        cool: 5,
        title: "From Old Solen",
        setup: (p,ctx)=>{setDest(p,ctx),setFee(p,ctx,.25)},
        text: 'A treaty with {dest} is written in Old Solen, as treaties are, and the council wants it in the common tongue by morning. One word in the fourth clause can mean "the river" or "the river and its banks". The banks are a province.',
        choices: [
          {
            t: "Translate it faithfully, and note the doubt",
            check: {s:"learning",s2:"int",d:55},
            win: {
              r: "Your note saves the council from a war over a word. The Chancellor asks your name.",
              fx: earn(1,{rep:8,favor:3,skill:{learning:3}}),
            },
            lose: {r:"Your note is muddled. The council argues all night and blames you by dawn.",fx:{rep:-3}},
          },
          {
            t: "Translate it the way that gives {realmShort} the banks",
            check: {s:"deception",s2:"learning",d:50},
            win: {
              r: 'The council reads "the river and its banks" and builds a tower on the far shore. {dest} is furious, and cannot prove you wrong.',
              fx: earn(1,both(rel(-8),{favor:8,honor:-3,rep:3})),
            },
            lose: {
              r: "{dest}'s own scholar reads the Old Solen aloud at the next meeting.",
              fx: both(rel(-12),{favor:-6,rep:-6}),
            },
          },
          {
            t: "Refuse to guess, and ask for the original negotiators",
            r: "Slow, careful and correct. Nobody thanks you for slow.",
            fx: {rep:1,honor:1},
          },
        ],
      }),
      O(["scribe"], {
        id: "ln_scr_seal",
        minRank: 3,
        w: 1,
        cool: 6,
        title: "A blank sheet under the seal",
        setup: (p,ctx)=>{lordOf(p,ctx,"a great lord in a hurry"),setFee(p,ctx,.4)},
        text: 'You keep a seal of office now. {themFull} of {house} comes to you with a blank sheet of good parchment and asks you to press the seal on it, "to save time; the words will follow." There is a purse beside the parchment.',
        choices: [
          {
            t: "Seal it",
            r: "You seal it. A month later a grant of land you never read appears in the rolls with your seal on it.",
            fx: earn(2,both({honor:-8,them:{type:"friend",op:20}},hp(8))),
          },
          {
            t: "Refuse, politely, by the rules of the office",
            check: {s:"etiquette",s2:"wil",d:45},
            win: {
              r: "{themFull} smiles thinly and takes the purse away. Later, someone powerful hears about it and is impressed.",
              fx: {honor:4,rep:6,favor:3,them:{type:"rival",op:-15}},
            },
            lose: {
              r: "{themFull} does not smile at all. Your office finds its funds cut.",
              fx: {honor:4,rep:-2,them:{type:"enemy",op:-30}},
            },
          },
          {
            t: "Seal it, and keep a copy of everything that follows",
            check: {s:"intrigue",s2:"learning",d:55},
            win: {
              r: "You seal it and watch. When the grant appears, you have the proof that will hang {themHim} if you ever need it.",
              fx: earn(2,{honor:-3,flag:"ln_seal_proof",skill:{intrigue:3}}),
            },
            lose: {
              r: "You never see the sheet again. Wherever it went, it has your seal on it.",
              fx: earn(2,{honor:-5,wil:1}),
            },
          },
        ],
      }),
      O(["scribe"], {
        id: "ln_scr_chronicle",
        minRank: 2,
        minRep: 50,
        time: 2,
        w: .9,
        cool: 10,
        title: "The chronicle",
        cond: (p,C)=>!C.flag(p,"ln_chronicle"),
        setup: (p,ctx)=>{setFee(p,ctx,.4)},
        text: "{ruler} wants a chronicle of the reign, to be copied and kept in every great house of {realmShort}. You have the rolls, the letters and the memories of the old servants. You also know which parts the sovereign would rather leave out.",
        choices: [
          {
            t: "Write it true",
            check: {s:"learning",s2:"wil",d:60},
            win: {
              r: "Plain, cold and true, the defeats beside the victories. The sovereign reads it in silence and orders it copied anyway. Historians will bless your name.",
              fx: earn(1,both({masterwork:"the Chronicle of {realmShort}",rep:12,fame:4,honor:5,favor:-5,flag:"ln_chronicle"},deed("Wrote the Chronicle of {realmShort}"))),
            },
            lose: {r:"True, and dull. Nobody copies it.",fx:{rep:1,flag:"ln_chronicle"}},
          },
          {
            t: "Write it as the sovereign would wish",
            check: {s:"learning",s2:"persuasion",d:50},
            win: {
              r: "Every battle a victory, every famine a test of faith. It is copied in gold leaf, and the songs will quote it.",
              fx: earn(1.5,both({masterwork:"the Chronicle of {realmShort}",favor:12,fame:3,rep:6,honor:-3,flag:"ln_chronicle"},deed("Wrote the Chronicle of {realmShort}"))),
            },
            lose: {r:"Even the sovereign finds it too sweet.",fx:{favor:-3,rep:-2,flag:"ln_chronicle"}},
          },
          {t:"Decline the honor",r:"Better unpaid than remembered for a lie, you tell yourself.",fx:{rep:-1}},
        ],
      }),
      O(["scribe"], {
        id: "ln_scr_paper",
        maxRank: 2,
        w: 1,
        cool: 8,
        title: "Qadiri paper",
        setup: (p,ctx)=>{who(p,ctx,"a runaway paper-maker from Qadira",{sex:"M"})},
        text: "{them} offers you Qadiri paper at a third the price of parchment, and something more: he knows how to make it, rags to pulp to sheet, and wants a partner to build a mill on the river at {home}. In Qadir a paper worker who takes the craft abroad is outlawed, and his family fined 500 silver.",
        choices: [
          {
            t: "Build the mill with him",
            req: p=>p.coin>=40,
            check: {s:"trade",s2:"craft",d:55},
            win: {
              r: "Rags in, paper out. Every clerk in the realm buys from you within five years. The Qadiri envoy asks questions at court.",
              fx: {coin:60,rep:8,fame:2,skill:{trade:3,craft:2},flag:"ln_paper",them:{type:"friend",op:40}},
            },
            lose: {
              r: "The first batch rots. The second floods. You lose your stake and he moves on.",
              fx: {coin:-40,wil:1},
            },
          },
          {
            t: "Buy his paper and keep out of the rest",
            r: "Cheap paper. Your copying costs fall by half, and so do your prices.",
            fx: {coin:10,rep:2},
          },
          {
            t: "Sell him to the Qadiri envoy",
            r: "The envoy pays you well. {them} is put on a ship east. You do not ask what happens at the other end.",
            fx: {coin:40,honor:-8,them:{type:"enemy",op:-60}},
          },
        ],
      }),
      O(["scribe"], {
        id: "ln_scr_flood",
        minRank: 1,
        w: 1.5,
        cool: 4,
        title: "The flood mark",
        cond: p=>p.realm==="POL-18",
        setup: (p,ctx)=>{who(p,ctx,"a nome lord",{status:"noble",sex:"M"}),setFee(p,ctx,.3)},
        text: "The flood-priests read the river's height on the Flood Stairs, and the year's tax is set from it: a high flood, a high tax. You write down what they read. {them}, whose nome lies downstream, would like this year's mark written a hand lower.",
        choices: [
          {
            t: "Write what the priests read",
            r: "The tax is high, the nome lord is sour, and the Mother's count is true.",
            fx: {honor:3,rep:3,piety:2,them:{type:"rival",op:-15}},
          },
          {
            t: "Write it a hand lower",
            check: {s:"deception",s2:"learning",d:50},
            win: {
              r: "A smudge, a slip, a hand lower. His nome pays less, and so does your purse.",
              fx: earn(2,{honor:-6,piety:-4,them:{type:"friend",op:30}}),
            },
            lose: {
              r: "A flood-priest checks the Stair himself. The temple has long memories.",
              fx: {rep:-12,honor:-6,piety:-6,prison:1,why:"false flood records"},
            },
          },
          {
            t: "Tell the High Flood-Priest he asked",
            r: "The nome lord is fined double. You are trusted with the Stairs from then on.",
            fx: {rep:6,piety:3,them:{type:"enemy",op:-40}},
          },
        ],
      }),
      O(["scribe"], {
        id: "ln_scr_reeve",
        minRank: 1,
        maxRank: 1,
        minRep: 40,
        w: 1.3,
        cool: 4,
        title: "The reeve's chair",
        setup: (p,ctx)=>{pickHouse(p,ctx)},
        text: "The reeve of the {house} lands has died of a winter cough, and somebody must keep the rents, the tolls and the shire's rolls until a new one is named. Somebody who can count, and who will not steal too much.",
        choices: [
          {
            t: "Do the work before anyone asks",
            check: {s:"stewardship",s2:"learning",d:45},
            win: {
              r: "By the time the lord thinks to name a new reeve, the rents are in, the rolls are straight, and the obvious choice is you.",
              fx: up(both({skill:{stewardship:2}},hp(5))),
            },
            lose: {r:"You make a mess of the toll accounts. The lord names his cousin.",fx:{rep:-3}},
          },
          {
            t: "Ask for it plainly",
            check: {s:"persuasion",s2:"etiquette",d:50},
            win: {r:"The lord likes a clerk who knows what he wants.",fx:up()},
            lose: {r:"The lord does not like being asked by a clerk.",fx:{rep:-2}},
          },
          {
            t: "Recommend an older clerk",
            r: "He is grateful. In five years he will recommend you.",
            fx: {honor:2,newRel:{type:"friend",op:30}},
          },
        ],
      }),
      O(["scribe"], {
        id: "ln_scr_warden",
        minRank: 2,
        maxRank: 3,
        minRep: 50,
        w: 1.2,
        cool: 5,
        title: "The keys of office",
        setup: (p,ctx)=>{ctx.post=rk(p)===2?A.pick(["the toll-gate on the great road","the castle at "+A.T("{town}",{}),"the harbor of "+A.T("{town}",{})]):A.pick(["the office of the rolls","the chancery's copying-house","the office of the royal mint"]),ctx.next=rk(p)===2?"Warden":"Master"},
        text: "{post} needs a new {next}: the last one is dead, disgraced or retired, depending on whom you ask. The appointment is made by the council clerk, who is fond of wine, flattery and competence, in that order.",
        choices: [
          {
            t: "Show your competence",
            check: {s:"learning",s2:"stewardship",d:55},
            win: {
              r: "A year's accounts of your present post, flawless, on the council clerk's desk. He reads them twice and names you.",
              fx: up({rep:4}),
            },
            lose: {r:"Flawless, and he never reads them.",fx:{rep:1}},
          },
          {
            t: "Flatter the council clerk",
            check: {s:"persuasion",s2:"etiquette",d:50},
            win: {
              r: "A cask, a compliment on his verses, an evening of listening. The keys are yours.",
              fx: up({honor:-1}),
            },
            lose: {r:"His verses are worse than you thought, and it showed.",fx:{rep:-2}},
          },
          {t:"Stay where you are",r:"You know your work and your work knows you.",fx:{happy:2}},
        ],
      }),
      O(["scribe"], {
        id: "ln_scr_great_seal",
        minRank: 4,
        maxRank: 4,
        minRep: 65,
        time: 2,
        w: 1.3,
        cool: 5,
        title: "The Great Seal",
        setup: (p,ctx)=>{ctx.office=A.pick(["Chancellor","Treasurer","Keeper of the Rolls"])},
        text: "The {office} of {realmShort} has fallen ill and will not rise again. The great offices are the crown's to give, and never inherited. The court whispers your name, and the names of two lords who have never kept a ledger in their lives.",
        choices: [
          {
            t: "Let your work speak",
            check: {s:"learning",s2:"stewardship",d:60},
            win: {
              r: "Twenty years of ledgers, rolls and seals, and not a penny out of place. {ruler} gives you the office, and the lords sulk.",
              fx: up(both({favor:10,fame:5,rep:8},deed("Made a Great Officer of {realmShort}"))),
            },
            lose: {
              r: "Work does not speak loudly enough. A lord gets it, and asks you to run it for him.",
              fx: {rep:3,wil:1},
            },
          },
          {
            t: "Make allies among the lords",
            check: {s:"diplomacy",s2:"intrigue",d:55},
            win: {
              r: "The lords decide a capable commoner they can lean on is better than a rival lord. You are named.",
              fx: up(both({favor:6,fame:4,rep:4},deed("Made a Great Officer of {realmShort}"))),
            },
            lose: {r:"The lords take your promises and give the office to one of their own.",fx:{rep:-4}},
          },
          {
            t: "Decline: you prefer the work to the title",
            r: "The new officer leans on you for everything, and knows it.",
            fx: {rep:3},
          },
        ],
      }),
    ]);
    A.defEvents([
      D(["scribe"], {
        id: "ln_d_scr_eyes",
        w: .9,
        cool: 10,
        title: "Failing eyes",
        cond: (p,C)=>C.ageAdj(p)>=35,
        text: "The letters swim on the page after noon now, and by candlelight they are ants. A merchant from the Spice Coast sells polished reading-stones, clear as water, that make small letters large. He wants 25 suns.",
        choices: [
          {
            t: "Buy the stone",
            req: p=>p.coin>=25,
            r: "The letters grow under the stone like loaves in an oven. You can work another twenty years.",
            fx: {coin:-25,happy:4,skill:{learning:1}},
          },
          {t:"Work only by daylight",r:"Fewer hours, less pay, more time at the window.",fx:{coin:-8,happy:1}},
          {
            t: "Take on a young copyist to read for you",
            r: "A sharp-eyed boy who reads your work back to you. He will have your job one day.",
            fx: {newRel:{type:"student",op:30,back:"mentor"}},
          },
        ],
      }, (p,C)=>lit(p)),
      D(["scribe"], {
        id: "ln_d_scr_news",
        w: 1,
        title: "Reading the letter",
        cond: (p,C)=>C.atWar(p),
        setup: (p,ctx)=>{who(p,ctx,"a farmer's wife",{sex:"F"})},
        text: "{them} brings you a letter that came with a carter. She cannot read. You can, and before you are halfway down the page you know that her son is not coming home from the war.",
        choices: [
          {
            t: "Read it to her as it is written",
            r: "You read it all, slowly. She does not cry until the end. You stay until her husband comes in from the field.",
            fx: {wil:1,honor:2,them:{type:"friend",op:30}},
          },
          {
            t: "Read it gently, leaving out the worst",
            r: "He died quickly, you tell her, and bravely. The letter does not say so. She believes you, and that is enough.",
            fx: {honor:1,happy:-2,them:{type:"friend",op:40}},
          },
        ],
      }, (p,C)=>lit(p)&&!C.poor(p)),
      D(["scribe"], {
        id: "ln_d_scr_lover",
        w: .8,
        cool: 10,
        title: "The love letters",
        cond: (p,C)=>!C.married(p),
        setup: (p,ctx)=>{who(p,ctx,"a tongue-tied suitor",{sex:"M"})},
        text: "For a season you have been writing love letters for {them}, who cannot write and cannot speak when it matters, to someone across the river. The replies are clever, warm and getting cleverer. You have started looking forward to them yourself.",
        choices: [
          {
            t: "Keep writing; it is only a job",
            r: "They marry at Midsummer. You write the wedding verses. It is only a job.",
            fx: {coin:6,happy:-2,them:{type:"friend",op:30}},
          },
          {
            t: "Tell the one across the river who has really been writing",
            check: {s:"persuasion",s2:"wil",d:50},
            win: {
              r: 'A long silence, then a laugh, then: "I wondered why he never says any of it out loud."',
              fx: {lover:!0,happy:6,them:{type:"enemy",op:-40}},
            },
            lose: {r:"They are furious with you both.",fx:{happy:-5,them:{type:"enemy",op:-30}}},
          },
          {
            t: "Teach {them} to write the letters himself",
            r: "Slow, ink-stained, misspelled — and his own. It works better than yours did.",
            fx: {honor:3,them:{type:"friend",op:40}},
          },
        ],
      }, (p,C)=>lit(p)&&C.prof(p,"learning",45)),
    ]);
    A.defEvents([
      O(["scribe","lawyer","steward"], {
        id: "ln_sh_old_charter",
        minRank: 1,
        w: 1,
        cool: 6,
        title: "The old charter",
        setup: (p,ctx)=>{lordOf(p,ctx,"a lord who wants the common"),setFee(p,ctx,.2)},
        text: "The village of {home} claims its common grazing by a charter four hundred years old. {themFull} of {house} says the charter is a forgery and the common belongs to {house}. Both sides have agreed to accept the judgment of someone who can read the old hand. That is you.",
        choices: [
          {
            t: "Test the ink, the wax and the words",
            check: {s:"learning",s2:"int",d:55},
            win: {
              r: p=>A.chance(.5)?"Oak-gall ink faded brown, wax from the right century, a scribe's abbreviation nobody has used in three hundred years. It is genuine. The village keeps its common.":"The wax is too fresh and a word is spelled the way nobody spelled it then. A forgery — made, you suspect, by a desperate village fifty years ago. You say so, gently.",
              fx: earn(1,{rep:8,skill:{learning:3},int:.5}),
            },
            lose: {r:"You cannot tell. You say so, which pleases nobody, and the matter goes to a court.",fx:{rep:-2}},
          },
          {
            t: "Declare it genuine",
            r: "The village rings its bell for you. {themFull} does not forget.",
            fx: both({honor:3,rep:3,them:{type:"enemy",op:-40},newRel:{type:"friend",op:30}},hp(-8)),
          },
          {
            t: "Declare it forged, for the lord's gratitude",
            r: "The lord is very grateful. The village drives its cattle onto your fields that autumn.",
            fx: earn(2.5,both({honor:-6,them:{type:"friend",op:30},newRel:{type:"enemy",op:-40}},hp(10))),
          },
        ],
      }),
      O(["healer","clergy"], {
        id: "ln_sh_pesthouse",
        minRank: 1,
        time: 2,
        w: .9,
        cool: 8,
        title: "The pest-house",
        setup: (p,ctx)=>{setFee(p,ctx,.2)},
        text: "The council of {town} has built a pest-house of planks outside the walls for the fever-sick, and needs someone to run it: beds, water, burials, and somebody who will stay. Nobody has volunteered. The last keeper is in the lime pit beside it.",
        choices: [
          {
            t: "Run it: clean water, clean straw, the sick kept apart",
            check: {s:"medicine",s2:"wil",d:55},
            win: {
              r: "A summer of it. Fewer die in your planks than in their own beds in town. The council builds you a stone house for the next one.",
              fx: earn(1.5,{rep:10,fame:3,honor:5,piety:3,skill:{medicine:4}}),
            },
            lose: {
              r: "You catch it in the second month. The sisters nurse you in your own pest-house.",
              fx: {health:-25,cause:"the fever",wil:2.5,honor:4,rep:5},
            },
          },
          {
            t: "Run it as a place of prayer and comfort",
            check: {s:"faith",s2:"wil",d:45},
            win: {
              r: "Many die, but none alone. The town calls you holy, which you are not, and kind, which you are.",
              fx: {piety:6,honor:4,rep:6,fame:2},
            },
            lose: {r:"The prayers do not stop the dying. Nor do they stop you doubting.",fx:{piety:-3,wil:2}},
          },
          {
            t: "Find someone else and pay them from the council's purse",
            r: "A desperate debtor takes it. You keep the books. Nobody asks how the money was split.",
            fx: earn(1,{honor:-2}),
          },
        ],
      }),
      O(["envoy","courtier"], {
        id: "ln_sh_embassy",
        minRank: 1,
        w: 1,
        cool: 6,
        title: "The foreign embassy",
        setup: (p,ctx)=>{setDest(p,ctx),setFee(p,ctx,.15)},
        text: "An embassy from {dest} arrives at {capital}: forty riders, two chests, a holy man of their faith, a poet and a man who never seems to sleep and asks a great many questions. You are to host them for a month and learn what they really want.",
        choices: [
          {
            t: "Host them handsomely and listen",
            check: {s:"etiquette",s2:"intrigue",d:50},
            win: {
              r: "Feasts, hunts, music, and by the fourth week the poet tells you, in his cups, exactly what the ambassador will ask for.",
              fx: earn(1,both(rel(5),{favor:8,rep:6,skill:{etiquette:2,intrigue:2}})),
            },
            lose: {r:"They are charmed and tell you nothing.",fx:both(rel(4),{rep:1})},
          },
          {
            t: "Watch the man who never sleeps",
            check: {s:"intrigue",s2:"ins",d:55},
            win: {
              r: "You catch him copying the muster rolls in the chancery at midnight. He is sent home; their ambassador apologizes; your sovereign is delighted.",
              fx: both(rel(-5),{favor:12,rep:8,fame:1}),
            },
            lose: {r:"He watches you watching him, and leaves you a polite note.",fx:{rep:-2,happy:-2}},
          },
          {
            t: "Let the holy man work on your soul, for friendship's sake",
            r: "Long evenings on theology. You do not change faith, but you make a friend, and friends talk.",
            fx: both(rel(6),{newRel:{type:"friend",op:40},skill:{diplomacy:2,faith:1}}),
          },
        ],
      }),
      O(["lawyer","clergy"], {
        id: "ln_sh_oathday",
        minRank: 1,
        w: 1.3,
        cool: 4,
        title: "The oaths on the ring",
        cond: p=>lawOf(p)==="north",
        setup: (p,ctx)=>{lordOf(p,ctx,"a lord with a grievance"),ctx.hall=p.realm==="POL-01"?"the Oath Hall at Kingsmere":"the great hall at "+capOf(p)},
        text: "Oathfather's Day, the first of the year, when lords renew their oaths on the iron ring in {hall}. You keep the roll of who swears. {themFull} of {house} stands before the ring and does not put out {theirHis} hand. The whole hall holds its breath. Breaking an oath sworn on iron makes an outlaw; refusing to swear makes something worse.",
        choices: [
          {
            t: "Ask {themHim}, before everyone, what grievance stays the hand",
            check: {s:"diplomacy",s2:"wil",d:55},
            win: {
              r: "A land dispute, three years unheard. You promise it a hearing before the month is out. The hand goes onto the ring.",
              fx: both({rep:8,favor:6,fame:2,stability:1,them:{type:"friend",op:25}},hp(10)),
            },
            lose: {
              r: "{themFull} walks out of the hall. The next year is a hard one.",
              fx: both({rep:-3,stability:-2,them:{type:"rival",op:-15}},hp(-10)),
            },
          },
          {
            t: "Mark {themHim} on the roll as refusing",
            r: "Ink on the roll. By nightfall the sovereign knows, and so does every lord who might follow.",
            fx: both({favor:5,rep:2,them:{type:"enemy",op:-40}},hp(-15)),
          },
          {
            t: "Call the next name and say nothing",
            r: "The ceremony goes on. A silence on a roll can be filled later. You have given {themHim} a year to think.",
            fx: {rep:1,them:{type:"friend",op:10}},
          },
        ],
      }),
    ]);
    A.defEvents([
      D(["scribe","lawyer","teacher","clergy","steward"], {
        id: "ln_d_proclamation",
        w: 1,
        cool: 5,
        title: "Reading the proclamation",
        setup: (p,ctx)=>{ctx.news=A.atWar(p.realm).length?"a new levy: one armed man from every five hearths, by the month's end":A.pick(["a new tax on salt","the betrothal of the heir","a reward for the head of an outlaw band","a ban on dice on holy days"])},
        text: "A rider nails a proclamation to the door of the village hall at {home}, and the village crowds round a page nobody can read. Every face turns to you. It announces {news}.",
        choices: [
          {
            t: "Read it exactly as written",
            r: "You read it word for word. Then you explain it three times, more slowly each time.",
            fx: {rep:1,fame:1,honor:1},
          },
          {
            t: "Read it, and tell them what it really means",
            check: {s:"persuasion",s2:"learning",d:40},
            win: {
              r: "You tell them what to do, whom to see, and what can be avoided lawfully. Half the village owes you a favor by evening.",
              fx: {rep:3,newRel:{type:"friend",op:30}},
            },
            lose: {r:"You explain it wrong. The reeve corrects you in front of everyone.",fx:{rep:-2,happy:-2}},
          },
        ],
      }, (p,C)=>lit(p)&&!C.town(p)&&C.prof(p,"learning",40)),
      D(["scribe","lawyer","teacher","healer","clergy"], {
        id: "ln_d_correspondent",
        w: .7,
        cool: 12,
        title: "A letter from afar",
        cond: p=>lit(p),
        setup: (p,ctx)=>{setDest(p,ctx),who(p,ctx,"a scholar of "+(ctx.dest||"a far court"))},
        text: "A letter reaches you after four months on the road: {them}, a scholar of {destCap}, has read something of yours and disagrees with it, at length, in elegant {destLang}. There is a question at the end that you cannot answer.",
        choices: [
          {
            t: "Answer it properly, whatever it takes",
            check: {s:"learning",s2:"int",d:50},
            win: {
              r: "Letters cross the Known World for twenty years. You never meet. You become the best of friends and the fiercest of rivals.",
              fx: {int:1,skill:{learning:4},them:{type:"friend",op:40}},
            },
            lose: {
              r: "Your answer is weak and {them} says so. You are stung into a year of study.",
              fx: {int:.5,skill:{learning:3},them:{type:"rival",op:-10}},
            },
          },
          {t:"Leave it unanswered",r:"It sits on your desk for a year, looking at you.",fx:{happy:-1}},
        ],
      }, (p,C)=>lit(p)&&C.prof(p,"learning",55)),
      D(["lawyer"], {
        id: "ln_d_law_gift",
        w: .9,
        cool: 6,
        title: "A gift before the hearing",
        cond: p=>rk(p)>=3,
        setup: (p,ctx)=>{who(p,ctx,"a litigant with a hearing next week",{status:"merchant"}),ctx.gift=A.pick(["a cask of Lucernan wine","a falcon in a hood","a bolt of Varennan silk",'a purse of 50 suns "for the poor of your parish"'])},
        text: "{them}, whose case comes before you next week, sends {gift} to your house, with a note that says nothing at all about the case.",
        choices: [
          {
            t: "Send it back with a cold note",
            r: "Word gets round that the bench cannot be bought. Some litigants are relieved. Some are frightened.",
            fx: {honor:4,rep:4,them:{type:"rival",op:-15}},
          },
          {
            t: "Keep it, and judge the case honestly anyway",
            r: "You keep it and rule against {themHim}. {them} feels robbed, which is fair.",
            fx: {coin:20,honor:-1,them:{type:"enemy",op:-30}},
          },
          {
            t: "Keep it, and remember who sent it",
            r: "The case goes {theirHis} way. It was close anyway, you tell yourself.",
            fx: {coin:30,honor:-6,them:{type:"friend",op:30}},
          },
        ],
      }),
      D(["steward"], {
        id: "ln_d_stw_granary",
        w: .9,
        cool: 8,
        title: "Rats in the granary",
        text: "The granary is full after a good harvest, and the rats know it. A tenth of the barley is already gone, and the rest smells of them. The cats have given up.",
        choices: [
          {
            t: "Rebuild the floor on stone staddles",
            check: {s:"stewardship",s2:"craft",d:45},
            win: {
              r: "Mushroom-stones under every post, and the rats cannot climb them. The granary is dry and full next year too.",
              fx: {skill:{stewardship:2,craft:1},rep:3},
            },
            lose: {r:"The new floor is higher, and the rats are better climbers than you thought.",fx:{rep:-1}},
          },
          {
            t: "Sell the barley now, before it spoils",
            r: "A poor price, but a price. The neighbors think you hasty.",
            fx: {rep:-1,skill:{trade:1}},
          },
          {
            t: "Hire the ratcatcher and his terriers",
            r: "A week of yapping and killing. The ratcatcher charges a fortune and is worth it.",
            fx: {coin:-4,rep:1},
          },
        ],
      }, (p,C)=>J(p,"farm")||C.prof(p,"stewardship",45)),
      D(["courtier"], {
        id: "ln_d_crt_dice",
        w: .9,
        cool: 6,
        title: "Dice with a great lord",
        setup: (p,ctx)=>{lordOf(p,ctx,"a great lord who likes dice")},
        text: "After supper {themFull} calls for dice and invites you to the table. The stakes are higher than your rent. To refuse a great lord is rude. To beat one is ruder.",
        choices: [
          {
            t: "Play to win",
            check: {s:"gambling",s2:"ins",d:50},
            win: {
              r: "You win, gracefully. {themFull} laughs, pays, and invites you back, which is the real prize.",
              fx: {coin:40,them:{type:"friend",op:20},skill:{gambling:2}},
            },
            lose: {
              r: "You lose more than you have. {themFull} is gracious about the debt. For now.",
              fx: {coinPct:-.3,them:{type:"friend",op:10}},
            },
          },
          {
            t: "Play to lose, a little, charmingly",
            check: {s:"gambling",s2:"etiquette",d:45},
            win: {
              r: "You lose just enough, at just the right moments. {themFull} thinks you the best company at court.",
              fx: {coin:-15,them:{type:"friend",op:35},favor:2},
            },
            lose: {r:"You lose much more than you meant to, uncharmingly.",fx:{coin:-40}},
          },
          {
            t: "Decline with a joke",
            check: {s:"persuasion",s2:"int",d:40},
            win: {r:"The joke lands. You are excused and remembered as witty.",fx:{rep:1}},
            lose: {r:"The joke falls flat. You are remembered as dull.",fx:{rep:-1,them:{type:"acquaint",op:-5}}},
          },
        ],
      }),
      D(["teacher"], {
        id: "ln_d_tch_shepherd",
        w: .8,
        cool: 10,
        title: "The shepherd boy",
        setup: (p,ctx)=>{who(p,ctx,"a shepherd boy who counts",{sex:"M",ageAdj:10,status:"peasant"})},
        text: "{them}, a shepherd boy of nine, has never seen a letter, but he can tell you how many sheep are in a flock of three hundred at a glance, and add up a market day's sales in his head faster than the reeve can with a board.",
        choices: [
          {
            t: "Teach him for nothing",
            r: "Letters in a month, numbers past anything you know in a year. One day he will be a master of an office, or a banker, or a famous heretic.",
            fx: {honor:3,happy:4,them:{type:"student",op:60,back:"mentor"}},
          },
          {
            t: "Find him a patron",
            check: {s:"persuasion",s2:"etiquette",d:45},
            win: {
              r: "A merchant pays for his schooling, and owes you a favor for the find.",
              fx: {rep:4,them:{type:"student",op:40,back:"mentor"}},
            },
            lose: {r:"Nobody believes a shepherd boy can count.",fx:{happy:-2}},
          },
          {t:"Leave him with his sheep",r:"He counts sheep all his life, very accurately.",fx:{}},
        ],
      }, (p,C)=>lit(p)&&C.prof(p,"learning",55)&&!C.town(p)),
      D(["minstrel"], {
        id: "ln_d_min_winter",
        w: 1,
        cool: 6,
        title: "Singing for supper",
        text: "Snow on the road, no coin in the purse, and a smoky inn ahead with a fire you can smell from the hill. A good storyteller eats free at any inn. Tonight you find out whether you are one.",
        choices: [
          {
            t: "Tell the long tale, with all the voices",
            check: {s:"music",s2:"int",d:40},
            win: {
              r: "The carters forget their dice, the landlord forgets his prices, and you sleep by the fire on a full belly.",
              fx: {happy:4,skill:{music:2},health:2},
            },
            lose: {r:"They have heard it. You sleep in the stable.",fx:{health:-4,cause:"the cold",wil:1}},
          },
          {
            t: "Sing the songs they ask for, all night",
            check: {s:"music",s2:"sta",d:45},
            win: {
              r: "Request after request until dawn. Supper, a bed and a purse from the drovers.",
              fx: {coin:5,happy:3,skill:{music:2}},
            },
            lose: {
              r: "Your voice gives out at midnight. They let you have the stable.",
              fx: {health:-3,cause:"the cold"},
            },
          },
        ],
      }, (p,C)=>C.prof(p,"music",50)&&C.poor(p)),
    ]);
    A.defEvents([
      D(["lawyer"], {
        id: "ln_d_law_noon",
        w: 1,
        cool: 6,
        title: "A lie at noon",
        cond: p=>lawOf(p)==="sun",
        setup: (p,ctx)=>{who(p,ctx,"a witness for the other side")},
        text: "The noon bell is ringing when {them} swears, before the court and the sun, that your client was in the tavern on the night in question. You know {theyHe} is lying. So, from the way {theyHe} sweats, does {them}. A lie at noon is a sin before the Temple.",
        choices: [
          {
            t: "Break the witness in front of the court",
            check: {s:"persuasion",s2:"ins",d:50},
            win: {
              r: "Three questions, gently, and the noon sun does the rest. {them} weeps and recants. You win, and the court thanks you for saving a soul.",
              fx: {rep:6,skill:{persuasion:2},them:{type:"enemy",op:-20}},
            },
            lose: {r:"{them} sweats, but holds. The case goes against you.",fx:{rep:-3}},
          },
          {
            t: "Ask the court to send for a priest",
            check: {s:"faith",s2:"learning",d:45},
            win: {
              r: "The dawnkeeper reminds the witness what waits under Mount Hael for those who lie at noon. The truth comes out in a rush.",
              fx: {rep:5,piety:2},
            },
            lose: {r:"The priest is the witness's uncle.",fx:{rep:-2}},
          },
          {
            t: "Let it pass, and appeal later",
            r: "Slow, and safe. The appeal court is less impressed by sunlight.",
            fx: {rep:-1,wil:.5},
          },
        ],
      }),
      D(["healer"], {
        id: "ln_d_heal_blame",
        w: .9,
        cool: 8,
        title: "The family blames you",
        setup: (p,ctx)=>{who(p,ctx,"a grieving son",{sex:"M"})},
        text: "You did everything right, and old {npcF} the alewife died anyway. Now her son {them} stands in your doorway with his brothers behind him, saying the poison was in your physic. The street is gathering to watch.",
        choices: [
          {
            t: "Show them the physic and drink it yourself",
            check: {s:"wil",s2:"medicine",d:45},
            win: {
              r: "You drink a full cup of the draught in front of them all, and do not die. The brothers go home ashamed.",
              fx: {rep:3,wil:1,honor:2},
            },
            lose: {
              r: "You drink it and they still do not believe you. A stone comes through your shutter that night.",
              fx: {rep:-4,them:{type:"enemy",op:-40}},
            },
          },
          {
            t: "Grieve with him",
            check: {s:"persuasion",s2:"diplomacy",d:45},
            win: {
              r: "You sit with him on your step and talk about his mother until he weeps instead of shouting. The street goes home.",
              fx: {honor:3,them:{type:"friend",op:30}},
            },
            lose: {r:"He does not want your grief. He wants someone to blame.",fx:{them:{type:"enemy",op:-30}}},
          },
          {
            t: "Shut the door and send for the watch",
            r: "The watch disperses them. The story that you poisoned the alewife goes round {home} for years.",
            fx: {rep:-5,them:{type:"enemy",op:-50}},
          },
        ],
      }, (p,C)=>C.prof(p,"medicine",50)),
      D(["clergy"], {
        id: "ln_d_cl_vow",
        w: .8,
        cool: 12,
        title: "A face at the rail",
        cond: (p,C)=>(p.faith==="REL-01"||p.faith==="REL-06")&&!C.married(p),
        setup: (p,ctx)=>{ctx.vow=p.faith==="REL-01"?"Priests of the Temple may not marry.":"Your vows are for life."},
        text: "{vow} For a year now one face at the rail has looked up at you every Sunday as if you were the only person in the building. Today, at the door, a hand lingers on yours.",
        choices: [
          {
            t: "Keep your vows",
            check: {s:"wil",s2:"faith",d:50},
            win: {
              r: "You step back. It is the hardest thing you have done in years, and you are proud of it, and you are lonely.",
              fx: {piety:5,wil:2,happy:-3},
            },
            lose: {r:"You step back, too late and too slowly. People saw. People talk.",fx:{piety:2,rep:-3,wil:1}},
          },
          {
            t: "Break them, quietly",
            r: "Fade to black, and a secret you will carry into every rite. If it comes out, you are finished.",
            fx: {lover:!0,piety:-8,happy:6,flag:"ln_broken_vow"},
          },
          {
            t: "Ask to be moved to another house",
            r: "You are sent to a cold house in the hills. You do not look back, often.",
            fx: {piety:3,happy:-4,wil:1},
          },
        ],
      }),
      D(["envoy"], {
        id: "ln_d_env_purse",
        w: .9,
        cool: 6,
        title: "The embassy's bills",
        text: "The treasury of {realmShort} has not sent your embassy's allowance in eight months. The landlord, the grooms, the wine merchant and the bishop's tailor are all waiting in your hall. An envoy who cannot pay his bills is an insult to the crown that sent him.",
        choices: [
          {
            t: "Pay them yourself, and send the account home",
            req: p=>p.coin>=40,
            r: "You pay, out of your own purse, and write a stiff letter. The treasury repays you, eventually, in part.",
            fx: {coin:-25,honor:2,favor:2},
          },
          {
            t: "Borrow from a local banker",
            check: {s:"trade",s2:"etiquette",d:45},
            win: {
              r: "A gentleman's loan at a gentleman's rate. The embassy keeps its dignity.",
              fx: {coin:-5,skill:{trade:2}},
            },
            lose: {r:"The banker smells desperation and charges for it.",fx:{coin:-20}},
          },
          {
            t: "Hold off the creditors with charm",
            check: {s:"persuasion",s2:"diplomacy",d:50},
            win: {r:"They go away smiling, unpaid. You have bought three months.",fx:{skill:{persuasion:2}}},
            lose: {
              r: "The wine merchant tells the whole court. You are laughed at in two languages.",
              fx: {rep:-4,happy:-3},
            },
          },
        ],
      }),
      D(["steward"], {
        id: "ln_d_stw_heir",
        w: .9,
        cool: 8,
        title: "The heir wants money",
        setup: (p,ctx)=>{who(p,ctx,"your lord's heir",{status:"gentry",ageAdj:19})},
        text: "{them}, your lord's heir, corners you in the counting room. Dice debts, a horse, a lady in town: {theyHe} needs 30 suns from the estate, quietly, before {theirHis} father hears. One day {them} will be your lord.",
        choices: [
          {
            t: "Find the money, quietly",
            r: 'Thirty suns vanish into a heading called "repairs to the dovecote". {them} will remember this, which is the point.',
            fx: {honor:-2,them:{type:"friend",op:35}},
          },
          {
            t: "Refuse, and say nothing to the father",
            r: "{them} goes white and leaves. You have made an enemy who will own you one day.",
            fx: {honor:2,them:{type:"enemy",op:-30}},
          },
          {
            t: "Lend it from your own purse, at no interest",
            req: p=>p.coin>=30,
            r: "{them} is astonished. Heirs are not used to kindness from stewards. You will be paid back in a way coin cannot.",
            fx: {coin:-30,them:{type:"friend",op:55}},
          },
          {
            t: "Tell the father",
            r: "The father pays the debts and thrashes the heir. The heir does not forget who told.",
            fx: {rep:3,them:{type:"enemy",op:-50}},
          },
        ],
      }),
      D(["courtier"], {
        id: "ln_d_crt_memoir",
        w: .7,
        cool: 12,
        title: "An old courtier's papers",
        setup: (p,ctx)=>{who(p,ctx,"an old courtier who has outlived every friend",{ageAdj:72})},
        text: '{them} served three sovereigns and outlived every friend. On a winter evening, with a cough that will not go away, {theyHe} gives you a locked box. "Fifty years of court in there. Burn it, or use it. I find I do not care which."',
        choices: [
          {
            t: "Read every page",
            r: "Old scandals, old debts, the true story of three marriages and a funeral. Half the great houses of the realm are in that box. Now they are in your head.",
            fx: {int:.5,skill:{intrigue:4},flag:"ln_memoir",them:{type:"friend",op:40}},
          },
          {
            t: "Burn it unread",
            r: "You burn it in front of {themHim}. {them} laughs until the cough takes over, and calls you the only honest courtier left alive.",
            fx: {honor:4,them:{type:"friend",op:60}},
          },
          {
            t: "Sell it to the highest bidder",
            check: {s:"intrigue",s2:"trade",d:50},
            win: {
              r: "Three houses bid. You sell each one the pages about the other two.",
              fx: {coin:120,honor:-6,skill:{intrigue:2}},
            },
            lose: {r:"The first house you approach takes it by force.",fx:{newRel:{type:"enemy",op:-30},rep:-3}},
          },
        ],
      }),
      D(["teacher"], {
        id: "ln_d_tch_bully",
        w: .9,
        cool: 6,
        title: "The lord's son",
        setup: (p,ctx)=>{pickHouse(p,ctx),who(p,ctx,"a lord's son who torments the others",{sex:"M",ageAdj:12,status:"noble"})},
        text: "{them} of {house} beats the poorer boys behind the woodshed and takes their bread. His father has sent word that his son is not to be touched by any tutor's rod.",
        choices: [
          {
            t: "Punish him like any other boy",
            r: "He takes the rod, and his father takes his son out of your school. The other boys eat their bread in peace.",
            fx: both({honor:4,rep:-2,them:{type:"enemy",op:-40}},hp(-6)),
          },
          {
            t: "Find a punishment the father cannot object to",
            check: {s:"int",s2:"persuasion",d:45},
            win: {
              r: 'Extra Old Solen, alone, every evening, "for his advancement". His father thanks you. The bullying stops for lack of time.',
              fx: {rep:3,honor:2,them:{type:"rival",op:-15}},
            },
            lose: {r:"He sees through it and is crueler than ever when your back is turned.",fx:{happy:-3}},
          },
          {
            t: "Look away",
            r: "The fees are good. The bread goes missing. Some of the poorer boys stop coming.",
            fx: {honor:-3,coin:5},
          },
        ],
      }),
      D(["minstrel"], {
        id: "ln_d_min_stolen",
        w: .9,
        cool: 8,
        title: "Your song in another mouth",
        setup: (p,ctx)=>{who(p,ctx,"a famous singer with a silver voice")},
        text: "In a hall at {town} you hear {them}, a far more famous singer, perform your song — your words, your tune — as {theirHis} own, to tremendous applause.",
        choices: [
          {
            t: "Stand up and sing the verse {theyHe} left out",
            check: {s:"music",s2:"wil",d:55},
            win: {
              r: "The verse that only the maker knows. The hall turns to you, then back to {them}, who has the grace to bow to you.",
              fx: {fame:3,rep:6,them:{type:"rival",op:-30}},
            },
            lose: {r:"Your voice cracks on the high note. The hall boos the upstart.",fx:{rep:-4,happy:-5}},
          },
          {
            t: "Let it go: the song has wings now",
            r: "A song that travels is a song that lives. Someday people will ask who made it.",
            fx: {wil:1,happy:-1},
          },
          {
            t: "Make {themHim} pay for it, privately",
            check: {s:"intimidation",s2:"intrigue",d:45},
            win: {
              r: "{them} pays, and agrees to name you as the maker from now on. A strange partnership begins.",
              fx: {coin:20,rep:3,them:{type:"friend",op:10}},
            },
            lose: {r:"{them} laughs and tells everyone you are bitter.",fx:{rep:-2,them:{type:"enemy",op:-25}}},
          },
        ],
      }, (p,C)=>C.prof(p,"music",55)),
      D(["scribe"], {
        id: "ln_d_scr_secret",
        w: .9,
        cool: 8,
        title: "What the letter said",
        setup: (p,ctx)=>{pickHouse(p,ctx),ctx.secret=A.pick(["the lord's eldest is not his son","the bishop is selling the cathedral's silver","the town treasurer has a second set of books","a marriage has been agreed that will start a feud"])},
        text: "Copying the private letters of {house}, you read something you were never meant to understand: {secret}. The copyist's first rule is that you do not read what you copy. Nobody keeps that rule.",
        choices: [
          {
            t: "Forget it",
            check: {s:"wil",s2:"int",d:40},
            win: {
              r: "You put it out of your mind, mostly. Discretion is the scribe's whole fortune, and yours grows.",
              fx: {rep:3,wil:.5},
            },
            lose: {
              r: "You cannot forget it. It comes out of your mouth one night after the third cup.",
              fx: both({rep:-5},hp(-8)),
            },
          },
          {
            t: "Sell it",
            check: {s:"intrigue",s2:"deception",d:50},
            win: {r:"The right ear pays 30 suns and never says where it heard.",fx:{coin:30,honor:-5}},
            lose: {
              r: "The right ear was the wrong ear. {House} learns who has been reading its letters.",
              fx: both({rep:-12,honor:-5,newRel:{type:"enemy",op:-40}},hp(-15)),
            },
          },
          {
            t: "Warn whoever it will hurt",
            r: "A quiet word in the right place. Someone is spared something. Nobody knows why.",
            fx: {honor:3,skill:{intrigue:1}},
          },
        ],
      }, (p,C)=>lit(p)&&J(p,"servant","steward")),
    ]);
  })();
})();
