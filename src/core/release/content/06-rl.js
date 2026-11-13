// The release's event pack 6 of 30 (120 events, mostly rl_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-027). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  (function(){
    const rs = p=>A.realmShort(p.realm),
      capOf = p=>{const r=A.realm(p.realm);return r&&r.capital?r.capital:"the capital"},
      early = ()=>!!(A.S&&A.S.year<=1110),
      free = p=>!["slave","serf"].includes(p.status)&&!p.flags.unfree,
      SEX = (p,m,f)=>p.sex==="F"?f:m,
      C_OLD = p=>A.C.old(p),
      CASTIDX = {};
    function castOf(p,roles){if(!LORE.cast)return[];let base=CASTIDX[p.realm];base||(base=CASTIDX[p.realm]=Object.values(LORE.cast).filter(c=>c&&c.realm===p.realm&&!c.ruler&&c.name));const map=A.S&&A.S.castMap||{};return base.filter(c=>{if(!roles.includes(c.role))return!1;const pid=map[c.id];if(!pid)return!0;if(pid===p.id)return!1;const q=A.P(pid);return!q||!q.alive?!1:!(p.rel&&p.rel[pid])})}
    // [X1 baked patch core/02-content-fixes TXT-CAST-DIET] A scene that meets one of the cast (castText) ends with
    // that person's looks and manner, and a long description took the scene past the 80-word diet (rl_cast_noble read
    // 82 words in a bot life). The manner sentence is now left out when the scene would run past 80 words with the
    // name filled in. The name also came after its titles ("Lord of the Southern March, head of the March Hawks
    // Garrick Harrow"); it now comes first ("Garrick Harrow, Lord of the Southern March, ...").
    function meetCast(p,ctx,roles){const list=castOf(p,roles),c=list.length?A.pick(list):null,per=c?A.personFromCast(c.id):null;if(c&&per)return ctx.pid=per.id,ctx.cName=c.name+(c.title?", "+c.title:""),ctx.cLooks=String(c.looks||"A stranger with a hard, watchful face.").replace(/ of \d+(?= |,)/,""),ctx.cManner=String(c.manner||"Says little and watches a great deal."),ctx.cWantsLine=String(c.wants||"Wants help, and is too proud to ask."),!0;const q=A.makeAcquaintance(p,"friend");return ctx.pid=q.id,ctx.cName=A.fullName(q),ctx.cLooks="A stranger with a hard, watchful face.",ctx.cManner="Says little and watches a great deal.",ctx.cWantsLine="Wants help, and is too proud to ask.",!1}
    const SECS = ()=>LORE.secrets||[],
      clip = (t,n)=>{const parts=String(t||"").replace(/[;…]+\s*$/,".").split(/(?<=\.)\s+/);let out="";for(const s of parts){if(out&&(out+" "+s).length>n)break;out=out?out+" "+s:s}return out=out.trim(),out&&!/[.!?"]$/.test(out)&&(out+="."),out||"The truth is uglier than the story."};
    function secPick(p,ctx,ids){const S=SECS();if(!S.length)return ctx.si=-1,ctx.secTitle="an old secret",null;let pool=ids?S.filter(s2=>ids.includes(s2.id)&&!p.flags["rl_k_"+s2.id]):[];if(!pool.length){const k=A.realmShort(p.realm);pool=S.filter(s2=>!p.flags["rl_k_"+s2.id]&&(s2.pub+" "+s2.truth+" "+(s2.who||"")).includes(k))}pool.length||(pool=S.filter(s2=>!p.flags["rl_k_"+s2.id])),pool.length||(pool=S);const s=A.pick(pool);return ctx.si=S.indexOf(s),ctx.secTitle=s.title,s}
    const sec = ctx=>SECS()[ctx&&ctx.si>=0?ctx.si:-1]||null,
      secPub = ctx=>{const s=sec(ctx);return s?clip(s.pub,260):"Everyone knows the story."},
      secTruth = ctx=>{const s=sec(ctx);return s?clip(s.truth,300):"The story is a lie."},
      secIfr = ctx=>{const s=sec(ctx);return s&&s.ifr?clip(s.ifr,220):"People would be very angry."},
      learn = (p,ctx)=>{const s=sec(ctx);s&&(p.flags["rl_k_"+s.id]=A.S.year,p.flags.rl_secret=ctx.si+1)},
      knowsAny = p=>!!p.flags.rl_secret,
      setFree = (p,how)=>(delete p.flags.unfree,(p.status==="slave"||p.status==="serf")&&(p.status="peasant"),how&&(p.flags[how]=A.S.year),A.ach("freed"),A.willGrow(p,2.5,"freedom"),p.happy=A.clamp(p.happy+20,0,100),"(You are free.)");
    A.defEvents([
      {
        id: "rl_ald_oathday",
        title: "Oathfather's Day",
        cond: (p,C)=>C.realm(p,"POL-01")&&C.adult(p)&&free(p),
        w: 1,
        cool: 10,
        text: p=>`New Year's Day. In ${A.provName(p.home)}'s timber hall the hall-priest holds out the iron ring, black with old hands. Every householder must lay a palm on it and swear again to the lord, as the great lords swear to the Emperor in the Oath Hall at Kingsmere today. Break it, and anyone may kill you.`,
        choices: [
          {
            t: "Lay your hand on the iron and swear plainly",
            r: p=>`Cold iron, warm words. The priest slips a plain iron ring on your thumb. You are a sworn ${SEX(p,"man","woman")} of the hall.`,
            fx: {honor:3,piety:2,favor:2,flag:"rl_ald_sworn"},
          },
          {
            t: "Swear, with your other hand crossed behind your back",
            check: {s:"intrigue",s2:"ins",d:34},
            win: {
              r: "Nobody sees. The oath is spoken, and in your heart it is not. You feel strangely light.",
              fx: {trait:"deceitful",skill:{intrigue:2}},
            },
            lose: {
              r: 'The hall-priest sees. "The Sea King sees too," he says, loud enough for all. Neighbors stop greeting you.',
              fx: {honor:-8,happy:-5,wil:1},
            },
          },
          {
            t: "Refuse. You will not swear to a lord who stole your hay",
            r: "A murmur runs round the hall. You are not outlawed, but the reeve writes your name down in his slow hand.",
            fx: {favor:-6,wil:1.5,trait:"stubborn",honor:1},
          },
        ],
      },
      {
        id: "rl_ald_fairrush",
        title: "The drowning at the Fairrush",
        cond: (p,C)=>C.realm(p,"POL-01")&&(C.adult(p)||C.teen(p)),
        w: .8,
        once: !0,
        text: ()=>`You are in Kingsmere when the bell of the Oath Hall tolls. Below the hall, guards tie a ${A.pick(["grey-bearded carter","young knight in a torn surcoat","woman in a miller's apron"])} to an iron ring and walk him to the black water of the Fairrush. An oath-breaker. The Sea King will keep him forever. He is looking straight at you.`,
        choices: [
          {
            t: "Watch to the end, as the law wants",
            r: "The river takes him without a sound. You do not sleep well for a week, but you understand your country better.",
            fx: {wil:1.5,happy:-4},
          },
          {
            t: "Shout for mercy",
            check: {s:"diplomacy",s2:"wil",d:49},
            win: {
              r: "Others take up the cry. The guards hesitate, and an officer orders the man held for the Oath Moot instead. Small mercy, but mercy.",
              fx: {honor:4,fame:2,favor:-3},
            },
            lose: {
              r: 'A guard cuffs you to the cobbles. "Want to join him?" The river takes the man anyway.',
              fx: {health:-5,honor:2,favor:-4,wil:1},
            },
          },
          {
            t: "Ask the crowd what oath he broke",
            check: {s:"intrigue",s2:"int",d:29},
            win: {
              r: ()=>`A fishwife tells you: he swore on iron to pay a lord of House ${A.pick(["Harrow","Greymane","Fairrush"])} for a horse, then sold the horse. In Aldmark a promise is a rope round your neck.`,
              fx: {int:.6,skill:{intrigue:2}},
            },
            lose: {r:"Nobody will say. In Kingsmere people learn not to know things.",fx:{}},
          },
        ],
      },
      {
        id: "rl_ald_license",
        title: "The License Law",
        cond: (p,C)=>C.realm(p,"POL-01")&&C.race(p,"halforc","orc")&&C.adult(p),
        w: 1.3,
        cool: 5,
        text: `A reeve of the Southern March stops you on the Copperham road with two spearmen. Under the License Law of 1053 a half-orc needs a lord's license to own land or bear arms. "License," he says, and holds out a gloved hand. He already knows you have none.`,
        choices: [
          {
            t: "Show the license you bought last year",
            req: (p,C)=>C.flag(p,"rl_ald_lic"),
            r: "He reads it twice, hoping for a flaw, then waves you on. Paper is armor too.",
            fx: {happy:1},
          },
          {
            t: "Pay him to look the other way (5 suns)",
            req: p=>p.coin>=5,
            r: `The coin vanishes into his glove. "Didn't see you." He will see you again next month.`,
            fx: {coin:-5,wil:.5},
          },
          {
            t: "Ask him which lord sells licenses, and pay the fee (25 suns)",
            req: p=>p.coin>=25,
            r: "Lord Harrow's clerk takes 25 suns and writes your name in a book. You may carry a knife now. You still may not own the field you plough.",
            fx: {coin:-25,flag:"rl_ald_lic",honor:1},
          },
          {
            t: "Stare him down. Your mother was born on this road",
            check: {s:"wil",s2:"str",d:46},
            win: {
              r: "Something in your face makes him decide it is not worth it. They ride on. Your hands shake afterward.",
              fx: {wil:2,fame:1},
            },
            lose: {
              r: "They take your knife and your coat, and beat you for the look. Under this law it is not even a crime.",
              fx: {health:-12,wil:2,happy:-6,coin:-3,cause:"a beating by march spearmen"},
            },
          },
        ],
      },
      {
        id: "rl_ash_butts",
        title: "Sunday at the butts",
        cond: (p,C)=>C.realm(p,"POL-05")&&C.male(p)&&(C.adult(p)||C.teen(p))&&!C.old(p)&&free(p),
        w: 1.2,
        cool: 4,
        text: p=>`Sunday afternoon. Under the Butts Law every free man from 7 to 60 must own a bow and shoot at the village butts, or pay one ember. At ${A.provName(p.home)} the reeve has hung a fat goose on the post for the best three arrows at 200 paces.`,
        choices: [
          {
            t: "Shoot for the goose",
            check: {s:"bow",s2:"str",d:39},
            win: {
              r: "Three shafts in the clout. You walk home with the goose under your arm and the girls watching.",
              fx: {skill:{bow:3},fame:1,happy:4,str:.3},
            },
            lose: {
              r: "Your second arrow goes into the hedge. The old men say your draw is all shoulder and no back.",
              fx: {skill:{bow:2},happy:-1},
            },
          },
          {
            t: "Pay the ember and drink in the alehouse instead",
            req: p=>p.coin>=2,
            r: "One ember well spent. The cider is sharp and the company sharper.",
            fx: {coin:-2,happy:3},
          },
          {
            t: "Help old Fletcher fix the village arrows",
            r: 'He shows you how to set a goose feather true with pitch and thread. "A bad arrow wastes a good bow," he says.',
            fx: {skill:{craft:3,bow:1},newRel:{type:"friend",op:20}},
          },
        ],
      },
      {
        id: "rl_ash_firstbow",
        title: "Your first bow",
        cond: (p,C)=>C.realm(p,"POL-05")&&C.child(p)&&C.ageAdj(p)>=7,
        w: 1.2,
        once: !0,
        text: p=>`You are seven, and in Ashmere that means a bow. ${p.sex==="F"?"The law asks it only of boys, but your mother cuts you a little ash bow anyway":"Your father cuts you a little ash bow and a fistful of blunt arrows"}. "Every one of the King's Bowmen started like this," ${p.sex==="F"?"she":"he"} says. "Shoot every day, and your back will grow into it."`,
        choices: [
          {
            t: "Shoot every day until your fingers bleed",
            r: "By harvest you can hit a hay bale at sixty paces. Your left arm wears a bracer of old leather now.",
            fx: {skill:{bow:4},wil:.6,sta:.4},
          },
          {
            t: "Shoot at the reeve's geese",
            check: {s:"stealth",s2:"spd",d:22},
            win: {
              r: "You hit one in the rump and run. Nobody ever finds out. Best day of your life.",
              fx: {skill:{bow:2,stealth:1},happy:5},
            },
            lose: {
              r: "The reeve catches you by the ear. Your family pays a fine and you get a thrashing.",
              fx: {family:-3,happy:-4,wil:.5},
            },
          },
          {
            t: "Whittle better arrows than your brothers",
            r: "Yours fly straighter. You find you like making things as much as shooting them.",
            fx: {skill:{craft:3,bow:1}},
          },
        ],
      },
      {
        id: "rl_ash_yew",
        title: "Yew for the south",
        cond: (p,C)=>C.realm(p,"POL-05")&&C.adult(p),
        w: .9,
        cool: 8,
        text: ()=>'A man with a Varennan accent buys you ale and talks quietly. He has a cart of yew staves from the Eldergrove boats and needs someone to drive it to the Crowbrook barges at night. "Sixty suns." Exporting war bows or yew staves from Ashmere is treason.',
        choices: [
          {
            t: "Drive the cart",
            check: {s:"stealth",s2:"int",d:46},
            win: {
              r: "Fog, a quiet ford, a barge with no lantern. Sixty suns in your boot by dawn, and a bad taste in your mouth.",
              fx: {coin:60,honor:-3,skill:{stealth:2}},
            },
            lose: {
              r: "The King's riders are waiting at the ford. Someone sold the seller.",
              fx: {prison:3,why:"smuggling yew staves out of the kingdom"},
            },
          },
          {
            t: "Report him to the reeve",
            r: "The Varennan is taken at dawn. The reeve gives you 5 suns. The man's friends will remember your face.",
            fx: {coin:5,favor:4,newRel:{type:"enemy",op:-30}},
          },
          {t:"Finish your ale and say no",r:"He shrugs and finds another fool by the fire.",fx:{}},
        ],
      },
      {
        id: "rl_nr_thing",
        title: "The spring Thing",
        cond: (p,C)=>C.realm(p,"POL-08")&&C.adult(p),
        w: 1.1,
        cool: 6,
        text: p=>`At the spring Thing the Lawspeaker stands on the mound and speaks the law aloud from memory, as it has never been written. Then the cases. Yours is called: ${A.pick(["your neighbor says your dog killed three of his sheep","a man claims the boat you bought was his to sell","your cousin swears your field was his father's"])}. The whole district is listening.`,
        choices: [
          {
            t: "Speak your case before the Thing",
            check: {s:"diplomacy",s2:"int",d:39},
            win: {
              r: "You speak plainly and the freemen strike their shields. The Lawspeaker finds for you.",
              fx: {honor:3,fame:1,coin:6,skill:{diplomacy:2}},
            },
            lose: {
              r: "You stumble and lose your temper. The Thing finds against you; you pay twice over, as theft is paid here.",
              fx: {coin:-12,happy:-4,wil:1},
            },
          },
          {
            t: "Ask the Lawspeaker to recite the old verse on it",
            check: {s:"learning",s2:"int",d:34},
            win: {
              r: "He recites a verse from the time of Eirik II that settles it in your favor. People remember you knew to ask.",
              fx: {int:.6,honor:2,skill:{learning:2}},
            },
            lose: {r:"The verse he recites is the wrong one for you. Old law cuts both ways.",fx:{coin:-6}},
          },
          {
            t: "Settle with him before the judgment (6 silver)",
            req: p=>p.coin>=6,
            r: "You pay, and clasp hands in front of everyone. A feud avoided is a son kept alive.",
            fx: {coin:-6,honor:1,newRel:{type:"friend",op:15}},
          },
        ],
      },
      {
        id: "rl_nr_wreck",
        title: "A cog on the rocks",
        cond: (p,C)=>C.realm(p,"POL-08")&&(C.adult(p)||C.teen(p)),
        w: .9,
        cool: 8,
        text: ()=>`Fog all night, and at dawn a fat cog sits on the skerries below the village, heeled over, ${A.pick(["an Aldmark ring on her sail","a Greyhaven pennant at the mast","tin ingots spilling from a burst hatch"])}. Men are already wading out with axes and sacks. Wrecking is a hanging crime, and half the coast does it.`,
        choices: [
          {
            t: "Wade out and take your share",
            check: {s:"stealth",s2:"str",d:34},
            win: {
              r: "You come back with a sack of cloth and a pouch of foreign silver. Nobody talks. Nobody ever talks.",
              fx: {coin:35,honor:-4},
            },
            lose: {
              r: "The jarl's men ride down the beach while you are still knee-deep in the surf.",
              fx: {punish:"theft"},
            },
          },
          {
            t: "Swim out and pull the crew off the wreck",
            check: {s:"sta",s2:"sea",d:44},
            win: {
              r: "You drag two sailors through the surf. One of them gives you his silver arm-ring and swears friendship.",
              fx: {honor:5,fame:2,newRel:{type:"friend",op:35}},
            },
            lose: {
              r: "The cold takes the strength out of you. Others pull you out, blue and coughing.",
              fx: {health:-15,wil:1.5,cause:"the winter sea"},
            },
          },
          {
            t: "Ride for the jarl",
            r: "The jarl's men save the cargo and hang nobody this time. The jarl remembers who came.",
            fx: {favor:3,coin:5,honor:2},
          },
        ],
      },
      {
        id: "rl_fh_runaway",
        title: "The boat to the south",
        cond: (p,C)=>C.realm(p,"POL-09")&&!C.race(p,"giant")&&C.adult(p),
        w: 1.2,
        cool: 8,
        text: ()=>`Your neighbor ${A.pick(["Colm","Aslaug","Brand","Hild"])} whispers that a Northreach tin boat will take his family south tonight, away from the pits and the giant halls. Under the Tin Compact runaways are brought back by Northreach ships and lose their land. He needs someone to keep the hall's watchman busy.`,
        choices: [
          {
            t: "Keep the watchman talking by the fire",
            check: {s:"diplomacy",s2:"int",d:36},
            win: {
              r: "You talk about seals and the old chants until the boat is gone into the dark. Nobody ever finds out who helped.",
              fx: {honor:4,happy:3,skill:{diplomacy:2}},
            },
            lose: {
              r: "The watchman goes out to piss and sees the boat. They are brought back at dawn, and so is your name.",
              fx: {prison:1,why:"helping tribute-folk to run"},
            },
          },
          {
            t: "Tell the eldest of the hall",
            r: "The family is stopped at the shore. The eldest gives you a seal pelt. Nobody in the village speaks to you again.",
            fx: {favor:4,honor:-6,coin:6,trait:"cruel"},
          },
          {
            t: "Say nothing and stay out of it",
            r: "In the morning their house is empty. You never learn whether they made it.",
            fx: {wil:.5},
          },
        ],
      },
      {
        id: "rl_fh_whale",
        title: "A whale on the shore",
        cond: (p,C)=>C.realm(p,"POL-09")&&C.ageAdj(p)>=9,
        w: 1,
        cool: 7,
        text: p=>`A whale has stranded on the black sand below Skarfell. The Mother Under the Ice has sent food. ${p.race==="giant"?"Your eldest walks down first to thank the whale with the old chant, and every hand of your hall follows":"The giants come down from the hall, twelve feet of chant and sealskin, and the tribute-folk follow with knives and baskets"}. Nothing may be wasted.`,
        choices: [
          {
            t: "Work the flensing knives all day",
            check: {s:"str",s2:"sta",d:30},
            win: {
              r: "Blubber to your elbows, and a fair share of oil and meat at the end. The winter will be fat.",
              fx: {skill:{survival:2},coin:6,str:.3},
            },
            lose: {
              r: "You slip on the blubber and slice your hand. Still, you go home with meat.",
              fx: {health:-6,coin:3,wound:"deep_cut"},
            },
          },
          {
            t: "Join the chant of thanks",
            r: "The deep voices of the giants shake your ribs. For a moment you understand why they believe.",
            fx: {piety:4,skill:{music:2},happy:2},
          },
          {
            t: "Pocket a strip of ivory from the jaw",
            check: {s:"stealth",s2:"spd",d:36},
            win: {r:"Nobody notices. At the summer tin fair an Eldergrove sailor pays well for it.",fx:{coin:14}},
            lose: {
              r: "An old giant sees. Wasting or stealing from the whale is fined in seal oil, and you pay a winter's worth.",
              fx: {coin:-10,honor:-4,favor:-2},
            },
          },
        ],
      },
    ]);
    A.defEvents([
      {
        id: "rl_id_carters",
        title: "Iron on the Iron Road",
        cond: (p,C)=>C.realm(p,"POL-10")&&C.adult(p),
        w: 1.1,
        cool: 7,
        text: "Ox-carts of iron bars creak down the Iron Road toward Eagleburg. The human carters are paid by the bar delivered, and the dwarven tally-clerks count every one. Tonight you see two carters prise a bar loose and bury it under the snow beside the road.",
        choices: [
          {
            t: "Stop them yourself",
            check: {s:"ins",s2:"str",d:41},
            win: {
              r: "You put one in the snow and the other runs. The Factors of the Iron Road pay a finder's fee of 8 suns, and a dwarf clerk nods at you, which is a lot from a dwarf.",
              fx: {coin:8,honor:3,fame:1},
            },
            lose: {
              r: "They are two and you are one. You wake with a split lip and no witnesses.",
              fx: {health:-10,wil:1,cause:"a carters' beating"},
            },
          },
          {
            t: "Ask for a share of the bar",
            r: "They give you a third of what a smith in Eagleburg pays. You are a thief now, if anyone counts.",
            fx: {coin:12,honor:-4,flag:"rl_id_thief"},
          },
          {
            t: "Tell Trade-Warden Ulla Stonecount's clerks",
            r: "The carters lose their contracts. In Irondeep a broken contract is remembered for 300 years. So, it seems, is a kept one.",
            fx: {favor:3,honor:2,coin:3},
          },
        ],
      },
      {
        id: "rl_id_founding",
        title: "The Founding in Irondeep",
        cond: (p,C)=>C.realm(p,"POL-10")&&C.adult(p),
        w: .9,
        cool: 8,
        text: ()=>early()?"3 March, the Founding. In the great hall Law-Carver Orsa Flintmark reads the carved law aloud while Queen Brynja sits behind her veil. Below the dais men of Thane Korrin pass a tablet from hand to hand: a petition to declare his mother unfit. They hold it out to you.":"3 March, the Founding. The Law-Carvers read the carved law aloud in the great hall, as every year since the hold was cut. Afterwards a thane's men pass a tablet among the crowd, gathering marks against the Council of Masters. They hold it out to you.",
        choices: [
          {
            t: "Make your mark",
            r: "Your mark goes into the wax beside a hundred others. In Irondeep wax becomes stone, and stone is remembered.",
            fx: {skill:{intrigue:2},favor:-4,flag:"rl_id_petition"},
          },
          {
            t: "Refuse and say why, loudly",
            check: {s:"diplomacy",s2:"wil",d:39},
            win: {
              r: `"The law is carved, not shouted." A few grey heads nod with you. The thane's men move on.`,
              fx: {honor:3,favor:3,fame:1},
            },
            lose: {
              r: "They remember you. The next season a contract you were promised goes to someone else.",
              fx: {coin:-8,wil:1},
            },
          },
          {
            t: "Listen only to the reading",
            r: "You know three more clauses of the carved law than you did this morning. That is never wasted in a dwarf hold.",
            fx: {skill:{learning:2},int:.4},
          },
        ],
      },
      {
        id: "rl_dw_kindling",
        title: "The Kindling",
        cond: (p,C)=>C.realm(p,"POL-10","POL-28","POL-29")&&C.ageAdj(p)>=8,
        w: 1,
        cool: 6,
        text: p=>`21 December, the Kindling. Every forge in ${rs(p)} is put out, and the halls go cold and black. ${p.realm==="POL-28"?"Then the Eldest Carver lights the new fire in the First Hall of Stonehold, and the flame is passed hearth to hearth":"Runners have carried a lamp lit from the First Hall's fire across the mountains, and it is passed hearth to hearth"}. Your ${A.pick(["grandmother","clan elder","master"])} holds out a taper for your family's forge.`,
        choices: [
          {
            t: "Carry the flame home through the dark galleries",
            check: {s:"spd",s2:"wil",d:28},
            win: {
              r: "Not a flicker. Your family's forge takes the First Hall's fire from your hand, and the elders say so at supper.",
              fx: {piety:4,honor:2,happy:3},
            },
            lose: {
              r: "A draft in the stair snuffs the taper. You walk back in shame to light it again. Everyone saw.",
              fx: {happy:-4,wil:1,piety:1},
            },
          },
          {
            t: "Sit with the old ones and hear the founding chant",
            r: "Three hours of names and dates, carved into you as into stone. You know where you come from.",
            fx: {skill:{learning:2},piety:2,int:.3},
          },
          {
            t: "Sneak a coal from the old fire before it dies",
            r: "It is forbidden and you know it. You keep the black coal in your pocket for years and never tell anyone why.",
            fx: {trait:"curious",piety:-2},
          },
        ],
      },
      {
        id: "rl_dw_namecarving",
        title: "The name-carving",
        cond: (p,C)=>C.race(p,"dwarf")&&C.age(p)>=30&&C.age(p)<=36&&C.realm(p,"POL-10","POL-28","POL-29"),
        w: 2,
        once: !0,
        text: p=>`You are thirty, and in the holds of the Deep Law that is the year of the name-carving. The Law-Carver waits with chisel and maul beside the clan's ancestor wall in ${rs(p)}. Your master must speak for your apprenticeship first, before every eye of the clan.`,
        choices: [
          {
            t: "Show the Carver your masterwork",
            check: {s:"craft",s2:"int",d:34},
            win: {
              r: 'Your master turns it in the lamplight and says one word: "True." The chisel rings. Your name is in the stone now, and will outlast you by a thousand years.',
              fx: {honor:5,fame:2,happy:6,skill:{craft:3},deed:"Had a name carved in the ancestor wall"},
            },
            lose: {
              r: "Your master hesitates a moment too long. The name is carved, but small and low on the wall. Dwarves notice such things.",
              fx: {honor:1,happy:-3,wil:1.5},
            },
          },
          {
            t: "Ask that your name be carved beside your dead mother's",
            r: "The Carver allows it. Your names sit side by side, and the whole clan goes quiet.",
            fx: {honor:3,piety:3,happy:3},
          },
          {
            t: "Hold the Carver to the exact wording of the old law",
            check: {s:"learning",s2:"int",d:39},
            win: {
              r: "You cite the carved clause so exactly that the Carver smiles. A law-mind, they say. Some invite you to study for a century more.",
              fx: {skill:{learning:4},int:.6},
            },
            lose: {r:"You cite it wrong. The laughter is gentle, but long.",fx:{happy:-2}},
          },
        ],
      },
      {
        id: "rl_dw_secret",
        title: "A human wants your craft",
        cond: (p,C)=>C.realm(p,"POL-10","POL-28","POL-29")&&C.race(p,"dwarf")&&C.adult(p),
        w: .9,
        cool: 10,
        text: ()=>`A human ${A.pick(["factor from Kingsmere","smith from Chanari","agent of an Ostran bank"])} finds you at the lower gate with a purse of 200 suns. He wants one forge secret: ${A.pick(["how your clan draws wire for mail","the heat of the second quench","what goes in the crucible with the iron"])}. A smith who leaks a forge secret is exiled, and the name is ground out of the ancestor vaults.`,
        choices: [
          {
            t: "Throw his purse in the gutter",
            r: "He picks it up and goes. The Law-Carvers never hear of it, but you know, and that is enough.",
            fx: {honor:3,piety:2},
          },
          {
            t: "Sell him a false secret",
            check: {s:"intrigue",s2:"craft",d:44},
            win: {
              r: "You describe a quench that will crack every blade he makes. He pays 60 suns for it, smiling.",
              fx: {coin:60,skill:{intrigue:2},trait:"deceitful"},
            },
            lose: {
              r: "He tests it before he pays and comes back with a cracked blade and two hired men.",
              fx: {health:-12,newRel:{type:"enemy",op:-30},cause:"hired thugs"},
            },
          },
          {
            t: "Report him to the gate wardens",
            r: "The human is turned out of the hold for good. The Council of Masters writes your name in the good book.",
            fx: {favor:4,honor:2},
          },
        ],
      },
      {
        id: "rl_hd_ride",
        title: "The Great Ride",
        cond: (p,C)=>C.realm(p,"POL-11")&&(C.adult(p)||C.teen(p)),
        w: 1.2,
        cool: 4,
        text: "21 June. The clans gather at the Drum Stones for the Great Ride: races at dawn, wrestling at noon, the clan councils at night, and drums under everything. Ten thousand horses on the grass. The race of the young riders starts at the second drum.",
        choices: [
          {
            t: "Ride the race",
            check: {s:"riding",s2:"spd",d:40},
            win: {
              r: "You come in first by a neck. A clan-mother ties a red cord in your horse's mane, and riders you have never met shout your name.",
              fx: {fame:4,skill:{riding:3},happy:6},
            },
            lose: {
              r: "Your horse stumbles at the turn stone. You eat dust in front of every clan on the grass.",
              fx: {skill:{riding:2},happy:-3,wil:1},
            },
          },
          {
            t: "Wrestle in the noon ring",
            check: {s:"unarmed",s2:"str",d:39},
            win: {
              r: "Four throws in a row. A drum-master taps his drum once for you.",
              fx: {fame:2,str:.5,skill:{unarmed:3}},
            },
            lose: {r:"A huge Nagoth girl throws you over her hip. The crowd loves it.",fx:{health:-5,wil:.8}},
          },
          {
            t: "Sit at the edge of the clan council and listen",
            r: "The Grey Mothers speak the law of the grass from memory, and even the war-chief goes quiet. You learn who really rules.",
            fx: {skill:{diplomacy:2},int:.5},
          },
        ],
      },
      {
        id: "rl_hd_guest",
        title: "The Law of the Fire",
        cond: (p,C)=>C.realm(p,"POL-11","POL-34")&&C.adult(p),
        w: 1,
        cool: 8,
        text: ()=>`At dusk a ${A.pick(["bleeding human trader","young rider of a feuding clan","half-orc boy with a broken arm"])} staggers to your fire and sits down without asking. Three riders follow an hour later. "Give him to us." Under the Law of the Fire, whoever harms or gives up a guest becomes clanless, and no fire will ever feed them again.`,
        choices: [
          {
            t: "Stand between them and your guest",
            check: {s:"wil",s2:"ins",d:41},
            win: {
              r: '"He ate my salt." They curse, and ride off. In the morning your guest leaves you a silver tusk-cap.',
              fx: {honor:6,piety:2,coin:10,newRel:{type:"friend",op:30}},
            },
            lose: {
              r: "One of them will not let it go. Steel comes out.",
              fx: {
                honor: 4,
                duel: {
                  tier: 2,
                  title: "a feud rider",
                  opts: {kind:"duel",place:"your fire",lethal:!1,toYield:!0,title:"Fight at the fire"},
                },
              },
            },
          },
          {
            t: "Give him up",
            r: "They drag him away into the dark. Word spreads by morning. At the next camp, nobody passes you the milk.",
            fx: {honor:-15,happy:-8,piety:-4,trait:"craven"},
          },
          {
            t: "Feed the riders too, and talk until they tire",
            check: {s:"diplomacy",s2:"int",d:34},
            win: {
              r: "Mare's milk and long talk. By dawn they agree to a blood-price in horses, paid at the next Great Ride.",
              fx: {honor:5,skill:{diplomacy:3},fame:1},
            },
            lose: {r:"They eat your food and leave angry. Your guest slips away in the night.",fx:{honor:2}},
          },
        ],
      },
      {
        id: "rl_nw_yam",
        title: "The yam rider",
        cond: (p,C)=>C.realm(p,"POL-12")&&(C.adult(p)||C.teen(p)),
        w: 1.1,
        cool: 6,
        text: "A yam rider of the Khan's post reels into your camp on a foam-white horse and falls out of the saddle. Fever. In his sash is a sealed message tied with the tally cords, and the next yam station is a day's ride away. His horse carries the Khan's brand. Selling a yam horse is theft from the Khan.",
        choices: [
          {
            t: "Ride the stage yourself",
            check: {s:"riding",s2:"sta",d:42},
            win: {
              r: "You change horses twice at the herds and reach the station before dusk. The Yam Keeper ties a blue cord on your wrist: a friend of the post.",
              fx: {fame:2,favor:4,skill:{riding:3},sta:.4},
            },
            lose: {
              r: "You lose the track in the rain and arrive a day late. The Yam Keeper looks at you as if you were mud.",
              fx: {favor:-2,wil:1},
            },
          },
          {
            t: "Nurse the rider back to health",
            r: "Three days of mare's milk and broth. He lives, rides on, and tells the Yam Keepers who kept him alive.",
            fx: {skill:{medicine:3},honor:2,newRel:{type:"friend",op:30}},
          },
          {
            t: "Sell the branded horse at the channel fair",
            check: {s:"intrigue",s2:"trade",d:49},
            win: {
              r: "A Greyhaven buyer asks no questions. Fifty suns. The brand is the buyer's problem now.",
              fx: {coin:50,honor:-6},
            },
            lose: {r:"The brand is known. The Khan's tens find you within a week.",fx:{punish:"theft"}},
          },
        ],
      },
      {
        id: "rl_nw_ring",
        title: "The ring hunt",
        cond: (p,C)=>C.realm(p,"POL-12")&&(C.adult(p)||C.teen(p))&&!C.old(p),
        w: 1,
        cool: 5,
        text: "Winter. Thousands of riders spread in a ring a day's ride across and close it slowly on the steppe, driving deer, wolves and wild asses into the middle, as the Saddle Law has drilled the tribes for centuries. Your ten holds a gap between two hills. Something big is pushing at your side of the ring.",
        choices: [
          {
            t: "Hold your place in the ring",
            check: {s:"riding",s2:"ins",d:38},
            win: {
              r: "Nothing gets past your ten. At the end, the hunt-master gives your ten the first pick of the kill.",
              fx: {skill:{riding:2,command:2},coin:6,honor:2},
            },
            lose: {
              r: "A herd of wild asses bursts through your gap. The hunt-master will not forget your face.",
              fx: {honor:-3,wil:1},
            },
          },
          {
            t: "Break the ring to ride down a cave hyena",
            r: "You wheel out after it. Glory or disgrace, depending on how this goes.",
            fx: {beast:{id:"CRE-35",place:"the frozen steppe",mod:.9}},
          },
          {
            t: "Shoot from the saddle as the beasts run past",
            check: {s:"bow",s2:"riding",d:40},
            win: {
              r: "Three deer with three arrows, one of them the backward shot. Even the old riders whistle.",
              fx: {skill:{bow:3},fame:2,coin:5},
            },
            lose: {r:"You empty your quiver into the snow.",fx:{skill:{bow:1}}},
          },
        ],
      },
      {
        id: "rl_hl_wallrun",
        title: "The wall-run",
        cond: (p,C)=>C.realm(p,"POL-13")&&C.adult(p)&&!C.old(p),
        w: 1,
        cool: 10,
        text: ()=>`Your valley and the next have quarreled for two years over ${A.pick(["a summer pasture","a stolen bull","a silver seam under the ridge"])}. The Council will settle it by a wall-run: two champions race along the top of Highcastle's wall, and whoever falls loses the case. Sometimes their life too. The valley elders look at you.`,
        choices: [
          {
            t: "Run for your valley",
            check: {s:"spd",s2:"ins",d:48},
            win: {
              r: "The wind tugs at you and the drop is forty feet, but your feet know stone. You touch the far tower first. Your valley carries you home on its shoulders.",
              fx: {fame:5,honor:4,happy:8,epithet:"Wallrunner",deed:"Won a wall-run on Highcastle wall"},
            },
            lose: {
              r: "Halfway along, your nailed boot skids. You fall. You live, but the valley loses the case.",
              fx: {health:-30,wound:"limp",wil:2,honor:1,cause:"a fall from Highcastle wall"},
            },
          },
          {
            t: "Refuse and pay toward the valley's fine (15 suns)",
            req: p=>p.coin>=15,
            r: "Another runs. The elders take your silver and say nothing, which is worse than shouting.",
            fx: {coin:-15,honor:-2},
          },
          {
            t: "Find the other champion and settle it over herb spirits",
            check: {s:"diplomacy",s2:"int",d:44},
            win: {
              r: "By the third cup you have agreed to split the pasture. The Council is almost disappointed.",
              fx: {honor:3,fame:2,skill:{diplomacy:3}},
            },
            lose: {r:"By the third cup you are fighting. The run goes ahead without you.",fx:{health:-5,happy:-2}},
          },
        ],
      },
      {
        id: "rl_hl_greycloak",
        title: "The Greycloak recruiter",
        cond: (p,C)=>C.realm(p,"POL-13")&&C.adult(p)&&!C.soldier(p)&&!C.old(p),
        w: 1.1,
        cool: 8,
        text: ()=>`A Greycloak sergeant comes up the valley in foreign finery, a heavy crossbow on his back. "Four years on contract with ${A.pick(["the bankers of Ostra","the Emperor of Aldmark","the King of Ashmere"])}. Silver every month, paid through the Ostran banks. Come home rich or come home in a cairn." Half the young men of the valley are listening.`,
        choices: [
          {
            t: "Sign the contract",
            r: "You put your mark on the Ostran paper. A heavy crossbow and a grey felt cloak are yours now.",
            fx: p=>{const r=A.enlist(p,!1);return A.trainSkill(p,"xbow",3),r&&r.ok?"You march out of the valley in spring.":"In the end the sergeant cannot take you, but he teaches you to span a crossbow."},
          },
          {
            t: "Haggle over the pay first",
            check: {s:"trade",s2:"int",d:39},
            win: {
              r: "You get him up by a fifth, then decline anyway. He laughs and buys you a drink for the nerve of it.",
              fx: {skill:{trade:3},happy:2},
            },
            lose: {r:"He shrugs and signs your cousin instead.",fx:{}},
          },
          {
            t: "Stay. The cows will not milk themselves",
            r: "You watch the young men go down the pass with their crossbows. Not all of them will come back.",
            fx: {skill:{husbandry:2}},
          },
        ],
      },
      {
        id: "rl_gh_toll",
        title: "Running the toll",
        cond: (p,C)=>C.realm(p,"POL-14")&&C.adult(p),
        w: 1.1,
        cool: 7,
        text: 'A skipper in a waxed cloak wants hands for a night run up the Grey Channel without stopping at the toll fort. "Steppe furs and a few jars nobody needs to know about. A tenth share each." Under the Channel Law, a ship that runs past the toll is seized with its cargo.',
        choices: [
          {
            t: "Ship with him",
            check: {s:"sea",s2:"stealth",d:44},
            win: {
              r: "No moon, muffled oars, the toll fort's lamp sliding past. Your share comes to 45 suns.",
              fx: {coin:45,skill:{sea:3},honor:-2},
            },
            lose: {r:"A toll galley comes out of the dark with its lantern unshuttered.",fx:{punish:"smuggling"}},
          },
          {
            t: "Sell his sailing night to the Toll-Mistress",
            r: "A clerk gives you 10 suns and asks you to forget his face. The skipper is taken at the boom.",
            fx: {coin:10,favor:2,newRel:{type:"enemy",op:-25}},
          },
          {
            t: "Say no",
            r: "He goes off to find braver fools. You hear later the boat came home. Or did not. Stories differ.",
            fx: {},
          },
        ],
      },
      {
        id: "rl_gh_vigil",
        title: "The Dragon Vigil",
        cond: (p,C)=>C.realm(p,"POL-14")&&C.ageAdj(p)>=8,
        w: 1,
        cool: 5,
        text: p=>`Midwinter, the Dragon Vigil. All of ${A.provName(p.home)} keeps watch toward the channel, with lamps in every window, because the Black Dragon rose in 1037 and again in 1071, and everyone is counting the years. Out on the black water you see ${A.pick(["a light that moves against the wind","a long low shape against the stars","a red glow very far off"])}.`,
        choices: [
          {
            t: "Keep the vigil and pray to the Sea King",
            r: "You watch until dawn with frozen hands. Nothing rises. Your neighbors call you steady.",
            fx: {piety:3,wil:1},
          },
          {
            t: "Take a boat out to look closer",
            check: {s:"sea",s2:"wil",d:36},
            win: {
              r: "Close up it is fishermen with a brazier, drunk and singing. You laugh all the way home. Some dragons are smaller than the tales.",
              fx: {int:.6,fame:1,skill:{sea:2}},
            },
            lose: {
              r: "The tide turns and nearly takes you out into the channel. You never find out what the light was.",
              fx: {health:-10,wil:1.5,cause:"the winter channel"},
            },
          },
          {
            t: "Mock the whole thing in the alehouse",
            check: {s:"diplomacy",s2:"int",d:39},
            win: {r:"Half the room laughs with you. The other half buys you a drink to shut up.",fx:{fame:1,happy:3}},
            lose: {
              r: "An old sailor who lost a brother in 1071 throws his ale in your face.",
              fx: {happy:-3,newRel:{type:"rival",op:-20}},
            },
          },
        ],
      },
      {
        id: "rl_gh_sea10",
        title: "Boys go to sea at ten",
        cond: (p,C)=>C.realm(p,"POL-14")&&C.child(p)&&C.ageAdj(p)>=9&&C.coast(p),
        w: 1.2,
        once: !0,
        text: p=>`In Greyhaven ${p.sex==="F"?"boys go to sea at ten, and girls who are stubborn enough":"boys go to sea at ten"}. A cog master in the harbor needs a ship's child for the run to Cold Bay: fetch, carry, climb, be sick over the side. Your family could use the pay, and the house would be quieter.`,
        choices: [
          {
            t: "Sign on as ship's child",
            check: {s:"sta",s2:"wil",d:22},
            win: {
              r: "Three weeks of cold, salt and rope. You come home with tar under your nails and a sailor's swagger.",
              fx: {skill:{sea:5},sta:.5,family:4},
            },
            lose: {
              r: "You are sick every day of the run and the mate calls you Bucket. But you go back.",
              fx: {skill:{sea:3},wil:1,family:2},
            },
          },
          {
            t: "Beg to try the Diving School instead",
            check: {s:"sta",s2:"spd",d:25},
            win: {
              r: "You hold your breath until you see stars and touch the harbor floor. The diver-master marks your name.",
              fx: {skill:{sea:3},sta:.6,flag:"rl_gh_diver"},
            },
            lose: {r:"You come up choking with nothing. Next year, perhaps.",fx:{wil:.5}},
          },
          {
            t: "Stay home with your mother",
            r: "She is glad. The harbor waits for you anyway.",
            fx: {rel:{who:"mother",op:8}},
          },
        ],
      },
      {
        id: "rl_mh_tower",
        title: "Dust on the Horse Road",
        cond: (p,C)=>C.realm(p,"POL-15")&&C.adult(p),
        w: 1,
        cool: 7,
        text: "Your turn on the watch tower above the Horse Road. At dusk a cloud of dust rises on the steppe side, low and wide. Riders? A herd? Every Morhaven lookout swears to go blind rather than lie, and a lookout who gives a false alarm loses an eye.",
        choices: [
          {
            t: "Light the signal fire",
            check: {s:"ins",s2:"int",d:44},
            win: {
              r: "Raiders, and you were right. The tower chain lights up to the city in an hour, and the riders turn back. The captain writes your name in the tower book.",
              fx: {fame:3,favor:5,honor:3,merit:2},
            },
            lose: {r:"A horse-dealer's herd. The Edicts are the Edicts.",fx:{wound:"lost_eye",wil:2.5,honor:-2}},
          },
          {
            t: "Send a runner to look first",
            r: "It takes an hour. It was a herd after all. Your captain grunts, which is praise.",
            fx: {skill:{tactics:1},honor:1},
          },
          {
            t: "Climb higher and watch the dust shape",
            check: {s:"ins",s2:"wil",d:36},
            win: {
              r: "You read it right: horses without riders, moving slow. You log it and sleep easy.",
              fx: {skill:{tactics:2},ins:.4},
            },
            lose: {r:"The light fails before you can tell. You spend the night sick with worry.",fx:{happy:-3,wil:.6}},
          },
        ],
      },
      {
        id: "rl_mh_horsefair",
        title: "The Horse Fair at Santora",
        cond: (p,C)=>C.realm(p,"POL-15")&&C.adult(p),
        w: 1,
        cool: 5,
        text: "May, the Horse Fair at Santora. Steppe riders, Nagoth orcs with copper-capped tusks and Sunland dealers shout over a sea of horses. A dealer offers you a fine bay steppe mare for half what she is worth. The horse thieves of last year still hang at the city gate.",
        choices: [
          {
            t: "Buy the cheap mare (30 suns)",
            req: p=>p.coin>=30,
            check: {s:"ins",s2:"trade",d:41},
            win: {
              r: "She is sound and honest, only the dealer was in a hurry. A bargain.",
              fx: {coin:-30,gear:{mount:"horse"},skill:{riding:1},happy:4},
            },
            lose: {
              r: "A Nine Winds rider recognizes his brand on her flank the next week.",
              fx: {coin:-30,punish:"theft"},
            },
          },
          {
            t: "Tell the fair warden the mare is stolen",
            r: "The dealer runs. The warden gives you a cup of mare's milk and a nod.",
            fx: {favor:2,honor:2},
          },
          {
            t: "Work the fair as a dealer's hand for the week",
            r: "You learn to read a horse's teeth and a buyer's face. Eight suns and a sore back.",
            fx: {coin:8,skill:{husbandry:2,trade:2}},
          },
        ],
      },
    ]);
    A.defEvents([
      {
        id: "rl_os_reckoning",
        title: "The great reckoning",
        cond: (p,C)=>C.realm(p,"POL-16")&&C.adult(p),
        w: 1.1,
        cool: 6,
        text: ()=>`New Year's Day in Ostra is the great reckoning, when every debt in the city is counted. A bank agent in a black cap is at your door with a wax tablet. Your name stands under a loan for ${A.pick(["a friend who has fled to Lucerna","your brother's failed dye vat","a wine cargo that sank off the Isle of Vines"])}. Forty suns, or the Debtors' Tower.`,
        choices: [
          {
            t: "Pay it (40 suns)",
            req: p=>p.coin>=40,
            r: "The agent scratches your name off the tablet. You are poorer and you can still borrow in this city, which in Ostra is a kind of wealth.",
            fx: {coin:-40,honor:3},
          },
          {
            t: "Plead for a year's grace at 12 in 100",
            check: {s:"diplomacy",s2:"trade",d:42},
            win: {
              r: "He writes a new bill at the lawful rate. Twelve in a hundred is not usury; it only feels like it.",
              fx: {coinPct:-.1,skill:{trade:2}},
            },
            lose: {
              r: "He shakes his head. You spend a season in the Debtors' Tower, counting pigeons.",
              fx: {prison:1,why:"debt at the great reckoning",wil:1.5},
            },
          },
          {
            t: "Flee the city tonight",
            check: {s:"stealth",s2:"spd",d:39},
            win: {
              r: "You are over the river by dawn. Next New Year your name will be read aloud in every church, and your children may not borrow here for twenty years.",
              fx: {honor:-8,happy:-3,flag:"rl_os_fled"},
            },
            lose: {
              r: "Bank agents hunt debtors better than the watch hunts murderers. They find you at the gate.",
              fx: {punish:"debt"},
            },
          },
        ],
      },
      {
        id: "rl_os_purple",
        title: "The Purplehand march",
        cond: (p,C)=>C.realm(p,"POL-16")&&C.adult(p)&&!C.noble(p),
        w: 1,
        cool: 8,
        text: p=>`In the murex dyers' quarter the air stinks of rotting shellfish and everyone's hands are stained to the wrist. ${early()?"Mora Purplehand, who leads 14,000 dockers and dyers,":"A dyers' captain"} is handing out cudgels for a march on the Exchange at the Purple Fair. "The Twelve wear our purple and pay us in bread crusts." A cudgel is pressed into your hand.`,
        choices: [
          {
            t: "March with the dyers",
            check: {s:"ins",s2:"str",d:41},
            win: {
              r: "Ten thousand stained hands in front of the Exchange. The Twelve promise a bread price. You were there.",
              fx: {fame:2,happy:5,honor:2,newRel:{type:"friend",op:25}},
            },
            lose: {
              r: "The Purple Company's hired men break the march with clubs. You limp home with a cracked head.",
              fx: {health:-15,wound:"concussion",wil:1.5,cause:"a broken march"},
            },
          },
          {
            t: "Sell the date of the march to a bank clerk",
            r: "Ten suns from a man who smells of ink. The dyers will never know. You will.",
            fx: {coin:10,honor:-5,skill:{intrigue:2}},
          },
          {
            t: "Hand the cudgel back and keep your head down",
            r: "Your neighbors notice. In the dyers' quarter, they always notice.",
            fx: {happy:-1},
          },
        ],
      },
      {
        id: "rl_sol_relic",
        title: "A finger of Corvan",
        cond: (p,C)=>C.realm(p,"POL-02")&&C.adult(p),
        w: 1,
        cool: 6,
        text: `Pilgrims pack the street below the Shadow Needle, brass sun badges on every hat. A man with a tray of honey sun-cakes stamped with the Needle leans in close. Under the cakes is a little glass box with a brown finger bone. "Corvan's own. Touched the Crowning Stone. Twelve suns, for you."`,
        choices: [
          {
            t: "Buy it (12 suns)",
            req: p=>p.coin>=12,
            r: "You hold it and feel something. Probably the price.",
            fx: {coin:-12,piety:3,happy:2},
          },
          {
            t: "Shout that he is a relic-faker",
            check: {s:"diplomacy",s2:"wil",d:36},
            win: {
              r: "Pilgrims turn on him. A Knight of the Sun drags him off to the Temple court, and somebody gives you a free sun-cake.",
              fx: {fame:1,honor:3,newRel:{type:"enemy",op:-25}},
            },
            lose: {
              r: "He shouts louder that you are a heretic. The crowd believes him, not you.",
              fx: {happy:-4,health:-4},
            },
          },
          {
            t: "Offer to go into business with him",
            check: {s:"intrigue",s2:"trade",d:39},
            win: {
              r: "You sell eleven fingers of Corvan in a week. Corvan had a lot of fingers.",
              fx: {coin:25,piety:-4,honor:-3,skill:{trade:2}},
            },
            lose: {
              r: "The Pilgrim Innkeepers' Guild catches you both. You lose your take and your good name.",
              fx: {coin:-5,honor:-5,punish:"theft"},
            },
          },
        ],
      },
      {
        id: "rl_sol_walled",
        title: "Under the Needle",
        cond: (p,C)=>C.realm(p,"POL-02")&&(C.adult(p)||C.teen(p)),
        w: .9,
        cool: 10,
        text: 'Knights of the Sun lead a thin man in grey down the steps beside the Shadow Needle. A Needle Heretic. In the Holy See heretics are never killed. He will be walled up in a dark cell under the Needle, so that he never sees the sun again. As he passes he whispers, "Count the years. Count them yourself."',
        choices: [
          {
            t: "Make the sign of the sun and pray for him",
            r: "You pray at noon for a week. The bell sounds different now.",
            fx: {piety:3,wil:.6},
          },
          {
            t: "Bribe a cellar guard to pass him bread (5 suns)",
            req: p=>p.coin>=5,
            check: {s:"intrigue",s2:"diplomacy",d:42},
            win: {
              r: "The guard takes your coin and the loaf. Later he tells you the man asked your name, to pray for you in the dark.",
              fx: {coin:-5,honor:4,piety:1},
            },
            lose: {
              r: "The guard reports you to a Luminary. You are questioned for a day about your own faith.",
              fx: {coin:-5,piety:-2,wil:1.5,happy:-5},
            },
          },
          {
            t: "Count the years, as he said",
            check: {s:"learning",s2:"int",d:49},
            win: {
              r: "You find a book of reigns and add them up. They do not add up. You close the book and tell no one.",
              fx: {int:1,skill:{learning:3},flag:"rl_needle_doubt",trait:"cynical"},
            },
            lose: {r:"The numbers swim. Probably the poor man was mad.",fx:{skill:{learning:1}}},
          },
        ],
      },
      {
        id: "rl_va_wheel",
        title: "The spinning wheel",
        cond: (p,C)=>C.realm(p,"POL-03")&&C.adult(p),
        w: 1,
        cool: 8,
        text: ()=>`In a Palella inn a well-dressed ${A.pick(["Ashmere wool merchant","man with a Highland accent","factor from Kingsmere"])} shows you a purse. He wants to see a Palella spinning wheel work, only once, only to look. Teaching the wheel to foreigners is a hanging crime, like clipping coin. No wheel may leave the valley, even in a coffin.`,
        choices: [
          {
            t: "Show him your aunt's wheel for 100 suns",
            check: {s:"stealth",s2:"intrigue",d:49},
            win: {
              r: "One night, one candle, one turn of the wheel. He pays and rides north. You lie awake for a year listening for horses.",
              fx: {coin:100,honor:-6,flag:"rl_va_wheel_sold"},
            },
            lose: {r:"The Weavers' Guild has men in every inn.",fx:{punish:"treason"}},
          },
          {
            t: "Take his money and show him a broken old wheel",
            check: {s:"intrigue",s2:"int",d:39},
            win: {
              r: "He sketches every cracked spoke of it. Ashmere will be building useless wheels for years.",
              fx: {coin:30,skill:{intrigue:3},trait:"deceitful"},
            },
            lose: {
              r: "He knows enough to know he is being cheated. He takes his money back with a knife at your ribs.",
              fx: {health:-8,newRel:{type:"enemy",op:-30},cause:"a knife in a Palella inn"},
            },
          },
          {
            t: "Tell the Weavers' Guild",
            r: "Mistress Nella Brisa's men take him at dawn. The guild sends you a bolt of Palella blue.",
            fx: {favor:3,honor:3,coin:8},
          },
        ],
      },
      {
        id: "rl_va_tithe",
        title: "The Tithe Resisters",
        cond: (p,C)=>C.realm(p,"POL-03")&&C.adult(p)&&(C.poor(p)||C.job(p,"farm")||p.status==="peasant"),
        w: 1.1,
        cool: 6,
        text: p=>`Harvest on the terraces above ${A.provName(p.home)}. The Temple's tithe-men come with carts for a tenth of every sheaf, as they have for six hundred years. This year your neighbors have hidden a share of their grain in the old terrace walls. "Tithe Resisters," the dawnkeeper calls them from the pulpit. They ask you to hide some too.`,
        choices: [
          {
            t: "Pay the full tenth",
            r: "Your carts go to the Temple barn. The dawnkeeper blesses your house by name on Sunday.",
            fx: {coin:-8,piety:3},
          },
          {
            t: "Hide grain in the terrace wall",
            check: {s:"stealth",s2:"int",d:36},
            win: {
              r: "Three sacks behind the stones, and the tithe-men walk past them twice. Your children eat better this winter.",
              fx: {coin:10,happy:3,piety:-2,newRel:{type:"friend",op:20}},
            },
            lose: {
              r: "A tithe-man's dog finds it. The Temple court fines you double.",
              fx: {coin:-20,piety:-3,happy:-5,wil:1},
            },
          },
          {
            t: "Tell the dawnkeeper which walls are hollow",
            r: "The Temple gets its grain and you get a reduced tithe. Nobody on the terrace drinks with you again.",
            fx: {coin:6,honor:-6,piety:2,newRel:{type:"enemy",op:-30}},
          },
        ],
      },
      {
        id: "rl_lu_cup",
        title: "The host drinks first",
        cond: (p,C)=>C.realm(p,"POL-04")&&C.adult(p),
        w: 1,
        cool: 6,
        text: ()=>`A feast in a council family's house on the Grand Canal. As custom demands, the host drinks first from each guest's cup before it is handed on. When he drinks from yours, the Doravelli taster behind him ${A.pick(["flinches very slightly","wipes his mouth too quickly","goes pale under his powder"])}. Nobody else seems to notice.`,
        choices: [
          {
            t: "Refuse the cup",
            r: "A guest who refuses is shown the door. You walk home along the canal, alive and insulted.",
            fx: {happy:-3,honor:-1},
          },
          {
            t: "Drink. The host already did",
            check: {s:"sta",s2:"wil",d:36},
            win: {r:"Bitter, but only cheap wine. The taster simply hates Ostran vintages.",fx:{happy:2}},
            lose: {
              r: "Your belly knots by midnight. Something was in the cup, meant for someone. You live, barely.",
              fx: {health:-25,wil:2,cause:"poison at a feast"},
            },
          },
          {
            t: "Whisper to the host",
            check: {s:"ins",s2:"diplomacy",d:41},
            win: {
              r: "The cup goes back to the kitchen and a cook does not come back. The host owes you, and in Lucerna debts are written down.",
              fx: {fame:2,newRel:{type:"friend",op:40},skill:{intrigue:2}},
            },
            lose: {
              r: "The host laughs at you in front of the table. The taster smiles into his sleeve.",
              fx: {happy:-4,honor:-2},
            },
          },
        ],
      },
      {
        id: "rl_lu_seaopen",
        title: "The Doge weds the sea",
        cond: (p,C)=>C.realm(p,"POL-04")&&(C.adult(p)||C.teen(p)),
        w: 1,
        cool: 5,
        text: "1 April, Sea Opening. From the gilded state galley the Doge throws a gold crown into the lagoon to wed the sea, and every bell in Lucerna rings. That night, in the dockside wine shops, men whisper that the crown lies in four fathoms off the Arsenal, and the Night Watch does not patrol there till after midnight.",
        choices: [
          {
            t: "Dive for the crown in the dark",
            check: {s:"sea",s2:"sta",d:56},
            win: {
              r: "Black water, mud, and then cold metal under your fingers. You sell it in pieces to a Lucernan goldsmith who asks no questions. The sea is a widow now.",
              fx: {coin:80,piety:-6,skill:{sea:3}},
            },
            lose: {
              r: "You come up empty, half-drowned, into the lantern of a Night Watch boat.",
              fx: {health:-15,prison:1,why:"robbing the sea of her crown",cause:"the lagoon at night"},
            },
          },
          {
            t: "Throw a coin of your own, like a sailor",
            r: "A copper for the Drowned Queen. The fishermen nod at you. Good luck this year.",
            fx: {coin:-1,piety:2,happy:2},
          },
          {
            t: "Bet on the galley race that follows",
            check: {s:"trade",s2:"int",d:39},
            win: {r:"You picked the Arsenal crew. Fifteen suns richer.",fx:{coin:15,happy:3}},
            lose: {r:"Your galley fouls an oar at the turn.",fx:{coin:-8}},
          },
        ],
      },
      {
        id: "rl_qd_paper",
        title: "The runaway journeyman",
        cond: (p,C)=>C.realm(p,"POL-17")&&C.adult(p),
        w: 1,
        cool: 8,
        text: ()=>`A young man with paper-pulp in the creases of his hands hides behind your door. A journeyman of the Qadira mills, fleeing with the paper craft, the secret only Qadir has. A mill worker who takes the craft abroad is outlawed, and his family fined 500 silver qadr. Outside, ${early()?"the spymaster Rafiq the Quiet's men":"the Sultan's men"} are knocking on every door in the street.`,
        choices: [
          {
            t: "Hide him under the rags",
            check: {s:"stealth",s2:"ins",d:42},
            win: {
              r: "They prod the rag heap and move on. Before dawn he kisses your hands and is gone toward the coast. Whatever he takes, it is not your secret.",
              fx: {honor:2,skill:{stealth:2},newRel:{type:"friend",op:30}},
            },
            lose: {
              r: "They find him in a breath. They find you too.",
              fx: {prison:2,why:"hiding a runaway mill journeyman"},
            },
          },
          {
            t: "Open the door and point",
            r: "The Sultan's men pay you 15 silver. The journeyman does not look back at you as they take him.",
            fx: {coin:15,favor:3,honor:-5},
          },
          {
            t: "Give him water and send him out the back",
            r: "Water first, as the Book of Wells says. Whatever happens to him now is between him and the Giver.",
            fx: {piety:2},
          },
        ],
      },
      {
        id: "rl_qd_well",
        title: "The fouled cistern",
        cond: (p,C)=>C.realm(p,"POL-17")&&C.ageAdj(p)>=10,
        w: 1,
        cool: 8,
        text: ()=>`The street cistern stinks this morning, and three children are sick. You saw who did it: ${A.pick(["a rich tanner's servant emptying vats at night","a drunk caravan guard","a man in the colors of a mill family"])}. In Qadir fouling a well or cistern is death. The Well-Keepers are asking who saw anything.`,
        choices: [
          {
            t: "Tell the Well-Keepers what you saw",
            r: "They hear you out under the arch of the House of Water. Justice follows, and an enemy with it.",
            fx: {honor:4,piety:2,newRel:{type:"enemy",op:-30}},
          },
          {
            t: "Tell his master instead, for a price",
            check: {s:"intrigue",s2:"ins",d:39},
            win: {
              r: "The master pays 25 silver for your silence and cleans the cistern himself. Children stop getting sick. Mostly.",
              fx: {coin:25,honor:-3,skill:{intrigue:2}},
            },
            lose: {
              r: "The master pays you with a beating from his porters instead.",
              fx: {health:-12,cause:"a beating in a Qadira alley"},
            },
          },
          {
            t: "Say nothing and haul clean water from the next street",
            r: "Your arms ache for a month. Nobody hangs. Nobody gets better quickly, either.",
            fx: {sta:.4,wil:.6},
          },
        ],
      },
      {
        id: "rl_tm_dyke",
        title: "Dyke month",
        cond: (p,C)=>C.realm(p,"POL-18")&&C.adult(p)&&!C.noble(p),
        w: 1.2,
        cool: 4,
        text: "Before the Opening of the Dykes on 1 September every village sends its men to the dykes with baskets and hoes. The overseer's cane is long. Men who dodge dyke work are branded on the hand. Your cousin asks you to answer for him at the roll call while he works his own field.",
        choices: [
          {
            t: "Work your share and his",
            check: {s:"sta",s2:"str",d:38},
            win: {
              r: "Two baskets for every one. The overseer never notices the trick, and your back grows like a bullock's.",
              fx: {str:.6,sta:.6,wil:1,rel:{who:"cousin",op:10}},
            },
            lose: {
              r: "You collapse in the heat on the fourth day. The trick comes out. Both of you are caned.",
              fx: {health:-12,wil:1.5,cause:"heat on the dykes"},
            },
          },
          {
            t: "Work your own share only",
            r: "Mud, sun, and the river rising behind the new earth. The dyke holds, and that is your work in it.",
            fx: {sta:.5,str:.3,honor:1},
          },
          {
            t: "Pay the overseer for a substitute (10 suns)",
            req: p=>p.coin>=10,
            r: "A landless boy carries your baskets. You feel the eyes of the village on your clean hands.",
            fx: {coin:-10,honor:-1},
          },
          {
            t: "Slip away to your own field",
            check: {s:"stealth",s2:"int",d:39},
            win: {r:"Nobody notices one man more or less in a crowd of a thousand.",fx:{coin:5}},
            lose: {
              r: "The overseer counts heads. The iron is already in the fire.",
              fx: {wound:"brand",honor:-4,wil:1.5},
            },
          },
        ],
      },
      {
        id: "rl_tm_stone",
        title: "The boundary stone",
        cond: (p,C)=>C.realm(p,"POL-18")&&C.adult(p),
        w: 1,
        cool: 8,
        text: "The flood has gone down and the black mud shines. When you walk your field you see your neighbor's boundary stone has crept a full stride onto your land overnight. Moving a field stone after the flood is punished by a hundred blows and loss of the field.",
        choices: [
          {
            t: "Bring the flood-priests to measure it",
            check: {s:"diplomacy",s2:"int",d:34},
            win: {
              r: "The flood-priests stretch their cords and find for you. Your neighbor takes his hundred blows. You did not want him to lose the field too. He does.",
              fx: {honor:3,coin:8,newRel:{type:"enemy",op:-35}},
            },
            lose: {r:"The priests find the old marks unclear and split the difference, as priests do.",fx:{coin:-4}},
          },
          {
            t: "Move it back yourself at night",
            check: {s:"stealth",s2:"str",d:34},
            win: {
              r: "The stone goes back where it was. Your neighbor says nothing. He knows that you know.",
              fx: {skill:{stealth:2},str:.3},
            },
            lose: {
              r: "He catches you with your hands on the stone. Now it is your word against his.",
              fx: {honor:-4,happy:-4},
            },
          },
          {
            t: "Speak to him man to man",
            r: "He weeps. His wife is sick and the land is poor. You leave the stone where it is this year.",
            fx: {honor:2,coin:-3,trait:"kind",newRel:{type:"friend",op:20}},
          },
        ],
      },
      {
        id: "rl_sc_water",
        title: "Water for an enemy",
        cond: (p,C)=>C.realm(p,"POL-19")&&C.ageAdj(p)>=10,
        w: 1.2,
        cool: 7,
        text: ()=>`A man of a clan your family has feuded with for three generations stumbles into camp at noon, lips cracked, ${A.pick(["his camel dead behind him","a wound in his side","a boy on his back"])}. Among the Sand Clans a traveler who accepts water is under clan protection, even a blood enemy. The cup is in your hand.`,
        choices: [
          {
            t: "Offer him the cup",
            r: "He drinks. For three days he is under your tent's protection, and he eats your dates and looks at the ground. When he leaves, the feud is a little smaller.",
            fx: {honor:5,piety:3,newRel:{type:"friend",op:15}},
          },
          {
            t: "Hold back the water",
            r: "Your own grandmother takes the cup from your hand and gives it to him. She does not speak to you for a month.",
            fx: {honor:-10,piety:-5,happy:-5},
          },
          {
            t: "Give water, then ask him about the feud",
            check: {s:"diplomacy",s2:"int",d:39},
            win: {
              r: "He tells you how it began: a well, a camel, a lie. It sounds stupid in the shade. You carry his words to your elders.",
              fx: {honor:5,skill:{diplomacy:3},fame:1},
            },
            lose: {r:"He drinks and says nothing. Some feuds are older than words.",fx:{honor:3}},
          },
        ],
      },
      {
        id: "rl_sc_camel",
        title: "A camel raid",
        cond: (p,C)=>C.realm(p,"POL-19")&&(C.teen(p)||C.adult(p))&&!C.old(p),
        w: 1,
        cool: 5,
        text: "Camel theft between the clans is almost a sport, and your cousins have a plan for the herd of a rival tent two days south. Blood feud is allowed, but never within sight of a well, so you must take the camels at the grazing, far from water.",
        choices: [
          {
            t: "Ride with your cousins",
            check: {s:"riding",s2:"stealth",d:40},
            win: {
              r: "Six camels at moonrise, and nobody hurt. The girls of the camp sing a mocking song about the other clan.",
              fx: {coin:25,fame:2,skill:{riding:2}},
            },
            lose: {
              r: "Their herd boys were awake. You come home with a spear-cut and no camels.",
              fx: {health:-12,wound:"scar_arm",wil:1,cause:"a camel raid"},
            },
          },
          {
            t: "Guard your own herd instead, in case they raid back",
            check: {s:"ins",s2:"survival",d:36},
            win: {
              r: "They come three nights later. You hear them first. Your herd is whole.",
              fx: {honor:3,skill:{survival:2}},
            },
            lose: {r:"You fall asleep. You lose two camels and a lot of pride.",fx:{coin:-10,happy:-3}},
          },
          {
            t: "Learn the stars from the old guide instead",
            r: "Khalid's men know the desert like a book. You learn three new stars and a well nobody else knows.",
            fx: {skill:{survival:3},int:.4},
          },
        ],
      },
      {
        id: "rl_zn_nugget",
        title: "Gold in the pan",
        cond: (p,C)=>C.realm(p,"POL-20")&&C.ageAdj(p)>=10,
        w: 1,
        cool: 8,
        text: "Panning the stream, you feel a weight in the gravel. A nugget, big as a thumb joint. In Zanara every gold nugget belongs to the Emperor and the finder keeps only the dust. Hiding a nugget means the loss of a hand. The governor's weigher comes up the valley tomorrow.",
        choices: [
          {
            t: "Hand it to the weigher",
            r: "He weighs it on the imperial scales, writes your name and gives you a fine-dust reward. The Emperor's gold buys the Emperor's armies.",
            fx: {coin:4,honor:3,favor:3},
          },
          {
            t: "Hide it in your cheek and sell it later",
            check: {s:"stealth",s2:"wil",d:44},
            win: {
              r: "A Well Quarter merchant in Zanara pays 50 suns and swears he never saw you.",
              fx: {coin:50,honor:-3,skill:{stealth:2}},
            },
            lose: {r:"The weigher's boy saw. The governor's men do not argue.",fx:{wound:"lost_hand",wil:3,honor:-5}},
          },
          {
            t: "Give it to the Rememberers for your ancestors' shrine",
            r: "Illegal, but the Rememberers sing your family's line at the Night of Masks with a new verse about you.",
            fx: {piety:4,fame:1},
          },
        ],
      },
      {
        id: "rl_zn_remember",
        title: "The Rememberers",
        cond: (p,C)=>C.realm(p,"POL-20","POL-22")&&C.child(p)&&C.ageAdj(p)>=6,
        w: 1.1,
        once: !0,
        text: p=>`A Rememberer comes to your compound in ${A.provName(p.home)}, an old ${A.pick(["woman","man"])} with a voice like a drum. Rememberers keep the genealogies and songs by heart, and they choose children who can hold long lines of names. "Say back what I say," the Rememberer tells you, and begins: forty names, father to son.`,
        choices: [
          {
            t: "Say all forty back",
            check: {s:"int",s2:"wil",d:25},
            win: {
              r: "Every name, in order. The Rememberer smiles and says you will learn the long songs with the other chosen children.",
              fx: {skill:{learning:4,music:2},int:.6,flag:"rl_rememberer"},
            },
            lose: {
              r: "You lose your way at the twentieth name. The Rememberer pats your head and moves on.",
              fx: {skill:{learning:1}},
            },
          },
          {
            t: "Sing them, not say them",
            check: {s:"music",s2:"int",d:22},
            win: {
              r: "The names fit into a tune. The Rememberer laughs aloud and takes you as a pupil.",
              fx: {skill:{music:4,learning:2},flag:"rl_rememberer"},
            },
            lose: {r:"The tune swallows the names. Everyone laughs, kindly.",fx:{skill:{music:1}}},
          },
          {
            t: "Ask the name of the old emperor you hear whispered",
            r: "The compound goes silent. Speaking a dead emperor's name outside a rite brings a heavy fine. Your father pays it.",
            fx: {family:-4,int:.3},
          },
        ],
      },
      {
        id: "rl_ks_climb",
        title: "The Harvest Home climb",
        cond: (p,C)=>C.realm(p,"POL-21")&&(C.teen(p)||C.adult(p)&&C.ageAdj(p)<26),
        w: 1.2,
        once: !0,
        text: "22 September, Harvest Home in Kesh. Young men and women climb the 30-meter roof of the Pepper Hall without ropes while the council of houses watches from the square. A fall is called the ancestors' choice. Your friends are already chalking their hands.",
        choices: [
          {
            t: "Climb",
            check: {s:"spd",s2:"str",d:46},
            win: {
              r: "Tile, beam, carved ancestor, sky. You touch the roof-tree and the square roars. A council house sends a man to ask your name.",
              fx: {fame:5,happy:8,spd:.5,epithet:"Roof-Touch",deed:"Climbed the Pepper Hall at Harvest Home"},
            },
            lose: {
              r: "A tile breaks under your hand. The ancestors choose to let you live, broken.",
              fx: {health:-35,wound:"back",wil:2.5,cause:"a fall from the Pepper Hall roof"},
            },
          },
          {
            t: "Climb halfway and come down honestly",
            r: 'Halfway is higher than most. The old Rope Hall master nods at you. "Live to climb next year."',
            fx: {spd:.3,skill:{stealth:1},wil:.5},
          },
          {
            t: "Bet on the climbers instead",
            check: {s:"ins",s2:"trade",d:38},
            win: {
              r: "You back a skinny Monuri girl at long odds. She touches the roof-tree. You buy cardamom tea for everyone.",
              fx: {coin:20,happy:3},
            },
            lose: {r:"Your climber freezes at the eaves.",fx:{coin:-8}},
          },
        ],
      },
      {
        id: "rl_ks_scales",
        title: "The Pepper Hall scales",
        cond: (p,C)=>C.realm(p,"POL-21")&&C.adult(p),
        w: 1.1,
        cool: 6,
        text: p=>p.status==="slave"||p.flags.unfree?"Under Kesh law a slave may buy freedom for two kilograms of pepper. You have been saving peppercorns, one by one, for years. Today a Pepper Hall weigher offers to put his thumb on the scale for you, for a price.":"At the Pepper Hall a weigher offers to lean his thumb on the scale when your pepper sacks are weighed. Cheating at the Pepper Hall scales costs your trading rights and a fine of ten times the value. Everybody says everybody does it.",
        choices: [
          {
            t: "Let him lean on the scale",
            check: {s:"intrigue",s2:"ins",d:42},
            win: {
              r: p=>p.status==="slave"||p.flags.unfree?"The scale tips. Two kilograms, says the weigher. Your master signs the paper with a sour face. You walk out free.":"A fat profit and nobody the wiser. Pepper is black gold, and some of it is yours now.",
              fx: p=>p.status==="slave"||p.flags.unfree?setFree(p,"rl_ks_freed"):(p.coin+=30,A.trainSkill(p,"trade",2),""),
            },
            lose: {
              r: "A council inspector is standing behind you. The Pepper Hall has long memories and short tempers.",
              fx: {coin:-20,honor:-5,punish:"theft"},
            },
          },
          {
            t: "Weigh honestly",
            r: p=>p.status==="slave"||p.flags.unfree?"Not enough yet. A few hundred peppercorns short. Next year.":"You get an honest price, and the weigher stops offering.",
            fx: {honor:2,wil:.5},
          },
          {
            t: "Report the weigher to the council",
            r: "The weigher loses his place. The council of houses notes your name, which in Kesh is better than coin.",
            fx: {favor:3,honor:2,newRel:{type:"enemy",op:-25}},
          },
        ],
      },
      {
        id: "rl_ab_borders",
        title: "The crown changes hands",
        cond: (p,C)=>C.realm(p,"POL-22")&&C.adult(p),
        w: 1.1,
        cool: 4,
        text: p=>`New Year's Day in Abara. The crown passes from one twin king to the other, as under the Compact of 1053 it has every year since 1090. Each king keeps his own court, guard and host. In ${A.provName(p.home)} lords wear green or blue borders on their white shawls to show which king they follow, and a man from the other court asks you to carry a letter for him.`,
        choices: [
          {
            t: "Carry the letter for 20 suns",
            check: {s:"stealth",s2:"intrigue",d:42},
            win: {
              r: "You deliver it and never read it. Plotting between the courts is treason, but you only carried paper.",
              fx: {coin:20,skill:{intrigue:2}},
            },
            lose: {
              r: "Your lord's men stop you at the ford. The letter is read aloud. It is about you, oddly.",
              fx: {prison:2,why:"carrying letters between the twin courts"},
            },
          },
          {
            t: "Wear your lord's border and refuse",
            r: "Loyal, and seen to be. Your lord gives you a gourd of honey wine.",
            fx: {favor:3,honor:2},
          },
          {
            t: "Wear a plain white shawl to the feast",
            r: "Neither court trusts you now. Both courts are polite to you. In Abara that is a kind of safety.",
            fx: {skill:{diplomacy:2}},
          },
        ],
      },
      {
        id: "rl_ab_twins",
        title: "The second name",
        cond: (p,C)=>C.realm(p,"POL-22")&&C.adult(p),
        w: .8,
        once: !0,
        text: "Your sister has borne twins. In the villages of Abara twins are thought to share one soul, and the younger is given to the Rememberers, raised as a 'second name', and never marries. The Rememberers are coming up the path with their staffs.",
        choices: [
          {
            t: "Give the child to the Rememberers",
            r: "Your sister weeps. The child will grow up holding a hundred names, but never one of its own. That is the custom.",
            fx: {piety:3,wil:1.5,happy:-4},
          },
          {
            t: "Hide the younger twin with cousins in the next valley",
            check: {s:"stealth",s2:"int",d:44},
            win: {
              r: "The Rememberers are told the second baby died. Your sister raises two children, one in secret.",
              fx: {honor:3,happy:4,piety:-4},
            },
            lose: {
              r: "The Rememberers find the baby. The lord fines your family twenty salt bars.",
              fx: {coin:-20,piety:-3,happy:-6},
            },
          },
          {
            t: "Ask the Rememberers to let you visit the child",
            check: {s:"diplomacy",s2:"faith",d:34},
            win: {
              r: "They agree: at every Night of Masks, you may sit with the child for an hour.",
              fx: {piety:2,happy:2},
            },
            lose: {r:'"A second name has no kin," they say, kindly and finally.',fx:{happy:-3}},
          },
        ],
      },
      {
        id: "rl_hf_thing",
        title: "The Thing at Jotunhall",
        cond: (p,C)=>C.realm(p,"POL-23")&&C.adult(p),
        w: 1.1,
        cool: 7,
        text: p=>`${early()?"Midsummer 1105: the Thing that must choose the next king.":"The Thing, held every seven years."} Giants sit in a ring of stones as tall as houses, and the human hunters crowd at the back. ${p.race==="giant"?"Your hall's eldest asks how you will speak when the Mother names her king.":"The hunter Arvo Sealbane means to ask for a human seat at the Thing, and wants you beside him."} A lie spoken at the Thing makes a giant hall-less.`,
        choices: [
          {
            t: p=>p.race==="giant"?"Speak for a king who can still walk to the shore":"Stand beside Arvo Sealbane",
            check: {s:"diplomacy",s2:"wil",d:44},
            win: {
              r: "Your words are heard and repeated in the chant. Whatever is decided, you were counted.",
              fx: {fame:3,honor:3,skill:{diplomacy:2}},
            },
            lose: {r:"The eldest look at you the way a mountain looks at a goat.",fx:{honor:-2,wil:1.5,favor:-3}},
          },
          {
            t: "Keep silent and listen to the chants",
            r: "Hours of lineage, back to the first hall. You understand why the giants are slow to decide: every word is carried for a thousand years.",
            fx: {skill:{learning:2},piety:2},
          },
          {
            t: p=>p.race==="giant"?"Promise your hall's ivory to whoever wins":"Quietly talk with the families who might leave for Drevna's Whale Coast",
            r: p=>p.race==="giant"?"Practical. The winner will remember. So will the loser.":"Four hundred families, they say. You learn which ones are serious, and which boats.",
            fx: {skill:{intrigue:2}},
          },
        ],
      },
      {
        id: "rl_hf_tusk",
        title: "A unicorn horn",
        cond: (p,C)=>C.realm(p,"POL-23","POL-08")&&C.adult(p),
        w: .9,
        cool: 8,
        text: p=>`A Northreach trader turns a long, spiral whale tusk in his hands. ${p.realm==="POL-23"?"Your hall carved the whale out of the ice last winter.":"He bought it from Hrimfell hunters."} "In Velgrad and the Sunlands this is a unicorn horn," he says, "and a unicorn horn sweats near poison. I need a witness to swear where it came from: the far mountains, from a white beast."`,
        choices: [
          {
            t: "Swear to the unicorn (30 suns)",
            r: "He pays, and the tusk goes south as a miracle. Somewhere a sick king will drink from it and feel safe.",
            fx: {coin:30,honor:-4,skill:{trade:1}},
          },
          {
            t: "Tell him it is a whale and he can swear himself",
            r: "He laughs and swears himself. You keep your honor and your empty purse.",
            fx: {honor:2},
          },
          {
            t: "Offer to carve it with sea scenes and sell it honestly",
            check: {s:"craft",s2:"int",d:39},
            win: {
              r: "Carved whale ivory sells for a good price in its own right. Twenty suns, clean.",
              fx: {coin:20,skill:{craft:3}},
            },
            lose: {r:"Your knife slips on the spiral. A spoiled tusk sells for nothing.",fx:{coin:-5,happy:-2}},
          },
        ],
      },
      {
        id: "rl_sb_dive",
        title: "The pearl beds",
        cond: (p,C)=>C.realm(p,"POL-24")&&C.adult(p)&&!C.noble(p),
        w: 1.1,
        cool: 5,
        text: "Pearling season off Azara. Free divers wear only a loincloth, a nose clip of turtle shell and a knife. The slave divers on the next boat are weighted with stones and lowered on ropes to twenty meters, and one who comes up without shells is sent down again. One in ten dies each season. A pearl-master offers you a day's diving.",
        choices: [
          {
            t: "Dive for the pearl-master",
            check: {s:"sta",s2:"sea",d:46},
            win: {
              r: "Your chest burns, the light goes green, and then an oyster as big as your palm. A fat pearl inside. Twenty-five suns.",
              fx: {coin:25,sta:.6,skill:{sea:3}},
            },
            lose: {
              r: "You come up too fast with blood in your nose. Your chest never quite forgives you.",
              fx: {health:-15,wound:"lungs",wil:1.5,cause:"the pearl beds"},
            },
          },
          {
            t: "Tell the pearl-master to pull the slave boy up",
            check: {s:"diplomacy",s2:"wil",d:46},
            win: {
              r: "He grumbles and pulls the rope. The boy coughs out the sea and looks at you as if you were the Giver of Water.",
              fx: {honor:5,piety:2,trait:"kind"},
            },
            lose: {r:'"Buy him, then," says the pearl-master. The boy goes down again.',fx:{wil:1.5,happy:-5}},
          },
          {
            t: "Buy a pearl cheap from a diver's wife (10 suns)",
            req: p=>p.coin>=10,
            check: {s:"trade",s2:"ins",d:34},
            win: {
              r: "In Sabra town it fetches 30. Pearls make Sabra rich, a little at a time.",
              fx: {coin:20,skill:{trade:2}},
            },
            lose: {r:"It is a glass bead with a good polish.",fx:{coin:-10}},
          },
        ],
      },
      {
        id: "rl_sb_oilshore",
        title: "The Oil Shore",
        cond: (p,C)=>C.realm(p,"POL-24")&&C.adult(p),
        w: .9,
        cool: 8,
        text: `A Nafari overseer is short of hands for the boiling-sheds at Zariya, and offers you the Emir's token and 40 suns for a season. Officially they boil "lamp oil" there. Nobody without the token may enter the Oil Shore; strangers found near it simply disappear. Last November a shed burned and killed eleven slaves.`,
        choices: [
          {
            t: "Take the token and the season's work",
            check: {s:"sta",s2:"craft",d:41},
            win: {
              r: `Black smoke, stinking jars sealed with the Emir's mark, and silence. You come back with 40 suns and know what "lamp oil" really is.`,
              fx: {coin:40,skill:{craft:2},flag:"rl_sb_oil",int:.3},
            },
            lose: {
              r: "A spark, a whoosh, and your arm is on fire. You keep the arm, and the pay.",
              fx: {coin:40,health:-25,wound:"burn",wil:2,cause:"fire-oil at Zariya"},
            },
          },
          {
            t: "Say no. You like your eyebrows",
            r: "The overseer shrugs. Plenty of desperate men in Sabra.",
            fx: {},
          },
          {
            t: "Ask what the oil is really for",
            check: {s:"intrigue",s2:"ins",d:49},
            win: {
              r: '"Ships," he says, then goes pale and walks off fast. Ships, and a dragon, perhaps.',
              fx: {skill:{intrigue:3},flag:"rl_sb_oil"},
            },
            lose: {
              r: "He looks at you a long time. Men like that remember questions.",
              fx: {newRel:{type:"enemy",op:-20}},
            },
          },
        ],
      },
    ]);
    A.defEvents([
      {
        id: "rl_vg_sables",
        title: "Blood-silver in sables",
        cond: (p,C)=>C.realm(p,"POL-25")&&C.adult(p),
        w: 1.1,
        cool: 7,
        text: ()=>`A brawl at the ${A.pick(["Ostmir fur fair","mill","priest's name-day feast"])}, and you broke a man's arm. Under the Code of Radoslav the lord judges with a priest beside him, and most crimes are paid off in blood-silver counted in sable pelts. A free man's life is sixty sables. An arm, says the lord, is six. You have none.`,
        choices: [
          {
            t: "Go into the winter forest and trap six sables",
            check: {s:"survival",s2:"sta",d:42},
            win: {
              r: "Six weeks of snares and frozen fingers, and six glossy pelts laid on the lord's table. Debt paid, and you know the forest now.",
              fx: {skill:{survival:4},sta:.5,wil:1,honor:2},
            },
            lose: {
              r: "Two pelts and frostbitten toes. The lord takes the two and the rest in labor.",
              fx: {wound:"frostbite",wil:1.5,honor:1},
            },
          },
          {
            t: "Pay the Fur Staple price in silver (18 suns)",
            req: p=>p.coin>=18,
            r: "The fur merchants of Velgrad set the price of everything, even justice. You pay.",
            fx: {coin:-18},
          },
          {
            t: "Refuse the judgment",
            r: "The lord's men hold you down and brand your cheek, as thieves are branded. Now everyone knows you as trouble.",
            fx: {wound:"brand",honor:-6,wil:2,looks:-4},
          },
        ],
      },
      {
        id: "rl_vg_galley",
        title: "Rowing for the toll",
        cond: (p,C)=>C.realm(p,"POL-25")&&C.adult(p)&&(C.poor(p)||p.coin<30),
        w: .9,
        cool: 10,
        text: "You owe a Sevany chandler money you cannot pay. In Velgrad debtors can be sentenced to row the toll galleys in the Grey Channel. The judge, a bored lord with a priest at his elbow, offers you a choice: a season on the oars, or your house.",
        choices: [
          {
            t: "Take the oar",
            check: {s:"sta",s2:"str",d:41},
            win: {
              r: "A season of channel tides, cold rain and the drum. You come back with a back like an ox and the debt struck off.",
              fx: {str:1,sta:1,wil:2,skill:{sea:4}},
            },
            lose: {
              r: "Your hands rot and your shoulder tears. The debt is struck off. Part of you stays on that bench.",
              fx: {health:-20,wound:"back",wil:2.5,cause:"the toll galleys"},
            },
          },
          {
            t: "Give up the house",
            r: "Your family sleeps at your cousin's now. But nobody chains you to anything.",
            fx: {coinPct:-.3,happy:-6},
          },
          {
            t: "Ask the priest to speak for you",
            check: {s:"faith",s2:"diplomacy",d:39},
            win: {
              r: "The priest reminds the lord of the Dark Weeks and mercy. The debt is halved.",
              fx: {coinPct:-.1,piety:3},
            },
            lose: {r:"The priest is the chandler's cousin.",fx:{coinPct:-.25,happy:-4}},
          },
        ],
      },
      {
        id: "rl_dv_ice",
        title: "The Ice Breaking",
        cond: (p,C)=>C.realm(p,"POL-26")&&C.ageAdj(p)>=8,
        w: 1.1,
        cool: 5,
        text: `A sound like a giant's axe across the lake: the Ice Breaking. The whole town runs to the shore, shouting, with honey cakes and mead. Out on a grinding floe a ${A.pick(["small boy","girl with a fishing line","drunk fisherman"])} is drifting away from the bank.`,
        choices: [
          {
            t: "Jump from floe to floe and bring them back",
            check: {s:"spd",s2:"ins",d:41},
            win: {
              r: "Three jumps out, three jumps back with a child under your arm. The town drinks your health all night.",
              fx: {fame:3,honor:4,happy:5,spd:.4},
            },
            lose: {
              r: "You go through the ice. They pull you both out with a boathook, blue and alive.",
              fx: {health:-15,wound:"frostbite",wil:2,honor:2,cause:"the breaking lake ice"},
            },
          },
          {
            t: "Run for a lake boat",
            check: {s:"sea",s2:"str",d:29},
            win: {
              r: "You and two fishermen shove a boat across the ice and pick them off the floe. Sensible and brave.",
              fx: {honor:2,skill:{sea:2}},
            },
            lose: {r:"By the time the boat is free, others have done it. At least nobody drowned.",fx:{}},
          },
          {
            t: "Throw a rope and pray",
            r: "The rope falls short. Someone else's rope does not. The Dawn bells ring for the thaw.",
            fx: {piety:1},
          },
        ],
      },
      {
        id: "rl_dv_listen",
        title: "Through the wall",
        cond: (p,C)=>C.realm(p,"POL-26")&&C.adult(p),
        w: 1,
        cool: 8,
        text: `Through the thin wall of your house you hear your neighbor and two strangers talking low: ${A.pick(["about holding back the rye owed to the Tusk Clans","about a forged clause and the heir","about selling wax past the crown's tolls"])}. In Drevna listening at a neighbor's wall is only fined, but spying on the crown is treason. Which is this?`,
        choices: [
          {
            t: "Take what you heard to the Still Hall",
            check: {s:"intrigue",s2:"int",d:39},
            win: {
              r: "A quiet man from the Still Hall listens, pays you 12 suns, and asks if you have ever thought of learning to listen properly.",
              fx: {coin:12,skill:{intrigue:3,stealth:1},flag:"rl_dv_listener"},
            },
            lose: {r:"The Still Hall already knows. They fine you for listening at walls.",fx:{coin:-5}},
          },
          {
            t: "Knock on the neighbor's door and warn him",
            r: "He goes white, thanks you, and moves to Dromir in spring. He leaves you his bees.",
            fx: {honor:2,newRel:{type:"friend",op:25},skill:{husbandry:1}},
          },
          {
            t: "Stuff wax in your ears and sleep",
            r: "Some say the old queens did that. The best sleep you have had in years.",
            fx: {happy:2},
          },
        ],
      },
      {
        id: "rl_sk_child",
        title: "One child to the Stair",
        cond: (p,C)=>C.realm(p,"POL-27")&&C.child(p)&&C.ageAdj(p)>=6,
        w: 1.4,
        once: !0,
        text: "Every family on the Roof of the World gives one child to a monastery, and the lot has fallen on you. Your mother has shaved your head and packed roasted barley and a yak-hair blanket. The monastery is three days up the trail, past the prayer flags and the sky-burial platform.",
        choices: [
          {
            t: "Climb the trail without looking back",
            r: "Butter lamps, debates in cold halls, letters scratched on slate. You learn to read, and to sit still for an hour.",
            fx: {literate:!0,skill:{learning:4,faith:3},piety:6,wil:1,flag:"rl_sk_monk"},
          },
          {
            t: "Beg to stay and herd the yaks",
            check: {s:"wil",s2:"int",d:22},
            win: {
              r: "Your little brother goes instead, happily. You stay with the herd, and the yaks are glad of you.",
              fx: {skill:{husbandry:4},happy:3},
            },
            lose: {
              r: "Tears change nothing on the Roof. You go up the trail anyway.",
              fx: {literate:!0,skill:{learning:3,faith:2},piety:4,wil:1.5},
            },
          },
          {
            t: "Run away into the hills",
            check: {s:"sta",s2:"survival",d:25},
            win: {
              r: "You survive two nights in the snow before your uncle finds you. They let you come home. Nobody makes you go again.",
              fx: {wil:1.5,skill:{survival:3}},
            },
            lose: {
              r: "The cold finds you first. A Snowborn Guide carries you back, frostbitten and ashamed.",
              fx: {wound:"frostbite",wil:2},
            },
          },
        ],
      },
      {
        id: "rl_sk_circuit",
        title: "The Bluespire Circuit",
        cond: (p,C)=>C.realm(p,"POL-27")&&C.adult(p),
        w: 1,
        cool: 6,
        text: "Summer, the circuit season. Pilgrims walk the 280-kilometer path round Lake Bluespire, spinning prayer wheels, some measuring the whole way with their bodies. Skyhold never kills; grave offenders walk this circuit as penance. Robbers know it too, and wait at the high passes.",
        choices: [
          {
            t: "Walk the whole circuit",
            check: {s:"sta",s2:"wil",d:41},
            win: {
              r: "Thin air, blue water, white peaks. You come back lighter, as if you had left something heavy on the far shore.",
              fx: {piety:6,wil:2,sta:.6,happy:4},
            },
            lose: {
              r: "Altitude sickness turns you back after four days. You will try again.",
              fx: {health:-8,piety:2,wil:1,cause:"the high passes"},
            },
          },
          {
            t: "Guard a party of pilgrims with your staff",
            check: {s:"unarmed",s2:"ins",d:39},
            win: {
              r: "At the second pass two robbers try their luck. Your staff sends them rolling down the scree, bruised, unkilled. The pilgrims fill your bowl with butter.",
              fx: {skill:{unarmed:3},honor:3,fame:1},
            },
            lose: {r:"The robbers take the pilgrims' butter and your boots.",fx:{health:-8,happy:-3}},
          },
          {
            t: "Sell butter tea at the passes",
            r: "Pilgrims pay anything at 5,000 meters. Twelve suns, and a lot of good karma, you hope.",
            fx: {coin:12,skill:{trade:2}},
          },
        ],
      },
      {
        id: "rl_st_debtwall",
        title: "The Debtors' Wall",
        cond: (p,C)=>C.realm(p,"POL-28")&&C.adult(p),
        w: .9,
        once: !0,
        text: `In the First Hall of Stonehold the Hold Bank carves the names of unpaying debtors on the Debtors' Wall, three Tessarian emperors among them. Today a Law-Carver shows you a name low down near the floor: your ${A.pick(["great-grandfather","grandmother's first husband","grandfather"])}. A debtor's heirs inherit the debt for 300 years. It has 90 years left to run.`,
        choices: [
          {
            t: "Pay a share of it (30 suns)",
            req: p=>p.coin>=30,
            r: "The Carver notes it in the ledger and taps a mark beside the name. One step toward grinding it off.",
            fx: {coin:-30,honor:5},
          },
          {
            t: "Contest it before the Carvers",
            check: {s:"learning",s2:"int",d:49},
            win: {
              r: "You find a flaw in the carving: the wrong clan mark. The name is ground off the wall. Your family celebrates for three days.",
              fx: {honor:6,fame:2,skill:{learning:3}},
            },
            lose: {r:"The carving is perfect. Dwarven carvings usually are.",fx:{coin:-5,happy:-3}},
          },
          {
            t: "Shrug. The dead can pay their own debts",
            r: "The Carver says nothing, which means everything. Your credit in the Hold is gone.",
            fx: {honor:-6,coin:3},
          },
        ],
      },
      {
        id: "rl_st_oldtoll",
        title: "The Old Toll",
        cond: (p,C)=>C.realm(p,"POL-28")&&C.adult(p)&&!C.old(p),
        w: 1,
        cool: 8,
        text: ()=>`In a tavern of the lower halls men of the Old Toll party drill with pikes after dark. Ranpur took the Nagora Gate in 1085, and the Old Toll means to take it back. ${early()?"Kettil Ironbrow's men whisper that three secret galleries still run under the Gate.":"They whisper of old galleries under the Gate."} A sergeant offers you a pike.`,
        choices: [
          {
            t: "Join the drill",
            check: {s:"spear",s2:"str",d:34},
            win: {
              r: "You hold the line in the lantern light, step and thrust. The sergeant writes your name on a slate.",
              fx: {skill:{spear:3},str:.4,flag:"rl_st_oldtoll"},
            },
            lose: {
              r: "You trip over your own pike and break a lantern. The others laugh, but they let you stay.",
              fx: {skill:{spear:1},flag:"rl_st_oldtoll"},
            },
          },
          {
            t: "Tell the Gate Wardens",
            r: "The Gate Wardens will not march for the Old Toll, and they are glad to know who will. They pay you well for names.",
            fx: {coin:15,favor:3,newRel:{type:"enemy",op:-30}},
          },
          {
            t: "Finish your dark beer and go home",
            r: "Wars are carved in stone too. Not your name, not this time.",
            fx: {},
          },
        ],
      },
      {
        id: "rl_em_heat",
        title: "The heat tally",
        cond: (p,C)=>C.realm(p,"POL-29")&&C.adult(p),
        w: 1,
        cool: 8,
        text: "You hold the wax rod in the deepest gallery while the surveyor reads the heat by how fast it softens. The wax sags in half the time it did in your grandfather's tally. The springs, the Smith-Father's breath, are hotter, as they have been for fifty years. The surveyor writes a different, cooler number in the book and looks at you.",
        choices: [
          {
            t: "Say nothing. You did not see the book",
            r: "The surveyor buys you a dark beer that night, and another the next. You drink and do not ask why.",
            fx: {coin:5,honor:-2},
          },
          {
            t: "Copy the true reading for yourself",
            check: {s:"stealth",s2:"int",d:39},
            win: {
              r: "You scratch it on a slate and hide it in your vault. Someday someone will need to know.",
              fx: {flag:"rl_em_truetally",skill:{intrigue:2},int:.4},
            },
            lose: {
              r: "The surveyor sees you. The next season you are sent to the coldest, emptiest gallery of all.",
              fx: {happy:-4,wil:1},
            },
          },
          {
            t: "Demand he writes the true number",
            check: {s:"wil",s2:"diplomacy",d:51},
            win: {
              r: 'He writes it, shaking. "On your head be it." Word of it climbs the hold toward the Forge-Queen.',
              fx: {honor:5,fame:2},
            },
            lose: {
              r: 'He laughs. "The Eldest Carver checks my tallies. Who checks yours?"',
              fx: {favor:-3,newRel:{type:"enemy",op:-25}},
            },
          },
        ],
      },
      {
        id: "rl_em_watch",
        title: "The Dragon Watch",
        cond: (p,C)=>C.realm(p,"POL-29")&&C.adult(p),
        w: 1,
        cool: 6,
        text: 'A shift on the Dragon Watch above Kardeep: heavy crossbows on swivels, aimed at the sky. A great shadow crosses the snow and the old sergeant hisses, "Wait." The thing banks, huge, over the ridge.',
        choices: [
          {
            t: "Shoot when the sergeant drops his hand",
            check: {s:"xbow",s2:"ins",d:46},
            win: {
              r: "Your bolt takes it in the wing membrane. It screams and veers off east. The watch toasts you all winter.",
              fx: {fame:3,skill:{xbow:4},honor:2},
            },
            lose: {r:"Your bolt flies wide into empty sky. The beast does not even notice.",fx:{skill:{xbow:2}}},
          },
          {
            t: "Hold your bolt. It is only passing",
            r: "It passes. Not every dragon over Kardeep needs killing, says the sergeant, and looks east to where the Skyfolk revere them.",
            fx: {skill:{tactics:2}},
          },
          {
            t: "Ask why the east gallery was walled up last November",
            check: {s:"intrigue",s2:"diplomacy",d:44},
            win: {
              r: "A drunk watchman tells you: a young Great Ash Dragon, shot down, its body walled in. If the Red Stair learns, they will call the hold cursed.",
              fx: {skill:{intrigue:3},flag:"rl_em_dragon"},
            },
            lose: {r:'"What gallery?" says everyone.',fx:{}},
          },
        ],
      },
      {
        id: "rl_rp_elephant",
        title: "Elephant Day",
        cond: (p,C)=>C.realm(p,"POL-30")&&C.ageAdj(p)>=8,
        w: 1.1,
        cool: 5,
        text: "1 February, Elephant Day. Garlanded war elephants process through Ranpur behind the white elephant Moon-Pearl, old and slow and painted with saffron. Harming the white elephant is death by an elephant's foot. A drum bursts too close, and a young bull swings out of line toward the crowd.",
        choices: [
          {
            t: "Grab the nearest child and pull them clear",
            check: {s:"spd",s2:"ins",d:36},
            win: {
              r: "You roll into the gutter with a weeping child as the bull thunders past. A mahout bows to you from his perch.",
              fx: {honor:4,fame:2},
            },
            lose: {
              r: "A shoulder of grey skin clips you and the world spins.",
              fx: {health:-18,wound:"broken_ribs",honor:2,cause:"a panicked war elephant"},
            },
          },
          {
            t: "Step in front of it with open hands, as mahouts do",
            check: {s:"husbandry",s2:"wil",d:52},
            win: {
              r: "The bull stops, trembling, and lets you touch its trunk. The Elephant School of Nagita hears of it by nightfall.",
              fx: {fame:4,skill:{husbandry:4},epithet:"Elephant-Calmer"},
            },
            lose: {r:"It does not stop.",fx:{health:-30,wound:"broken_ribs",wil:2,cause:"a panicked war elephant"}},
          },
          {
            t: "Throw flowers at Moon-Pearl and pray",
            r: "She lifts her trunk as she passes. People say she looked at you. The priests say she looks at everyone.",
            fx: {piety:3,happy:3},
          },
        ],
      },
      {
        id: "rl_rp_temple",
        title: "The temple court",
        cond: (p,C)=>C.realm(p,"POL-30")&&C.adult(p),
        w: 1,
        cool: 8,
        text: ()=>`In Ranpur the temples hold the courts and the gold. A temple family of the Thousand Names claims your ${A.pick(["field","cotton plot","fishing pond"])} sits on temple land, by a deed nobody alive has seen. Debtors work temple fields until they are paid. The case is heard on the temple steps this afternoon.`,
        choices: [
          {
            t: "Argue your case before the temple judges",
            check: {s:"diplomacy",s2:"learning",d:44},
            win: {
              r: "You bring three old neighbors who remember your grandfather ploughing it. The judges find for you, sourly.",
              fx: {honor:3,skill:{diplomacy:2}},
            },
            lose: {
              r: "The deed appears, very old and very convenient. You work a season in the temple fields.",
              fx: {wil:1.5,coin:-15,happy:-6},
            },
          },
          {
            t: "Make a gift to the shrine (20 suns)",
            req: p=>p.coin>=20,
            r: "Lamps and flowers and gold. The deed is found to concern a different field.",
            fx: {coin:-20,piety:2},
          },
          {
            t: "Ask the One Face merchants for help",
            check: {s:"trade",s2:"diplomacy",d:39},
            win: {
              r: "The merchants who say the Thousand Names are one God hire you a lawyer, happy to shame a temple family.",
              fx: {skill:{trade:2},newRel:{type:"friend",op:20},piety:-1},
            },
            lose: {r:"They are sympathetic and busy.",fx:{}},
          },
        ],
      },
      {
        id: "rl_ts_coin",
        title: "Bad Leontines",
        cond: (p,C)=>C.realm(p,"POL-31")&&C.adult(p),
        w: 1.1,
        cool: 6,
        text: "You are paid in Leontines that feel too light and ring too dull. Since the war, both claimants have been debasing the coin, and forgers flood the markets. In Tessar coin forgers are boiled in oil, an old imperial law Queen Livia revived. The baker will not take them.",
        choices: [
          {
            t: "Pass them on at the next market",
            check: {s:"intrigue",s2:"ins",d:36},
            win: {
              r: "A carter takes them without looking. Bread is dear; a conscience is dearer.",
              fx: {coin:8,honor:-3},
            },
            lose: {r:"The money-changer bites one and calls the watch.",fx:{coin:-5,punish:"theft"}},
          },
          {
            t: "Weigh them and sell them as copper",
            check: {s:"trade",s2:"int",d:32},
            win: {
              r: "A copper miner from Albina gives you a fair weight for them. Half their face value, but honest.",
              fx: {coin:4,skill:{trade:2}},
            },
            lose: {r:"They are lead under a copper wash. Worth nothing at all.",fx:{coin:-4,happy:-2}},
          },
          {
            t: "Complain to your employer",
            r: 'He shrugs. "Take it up with the Queen. Or the Prince. Whichever exists."',
            fx: {happy:-2,wil:.5},
          },
        ],
      },
      {
        id: "rl_ts_road",
        title: "The road station",
        cond: (p,C)=>C.realm(p,"POL-31")&&(C.adult(p)||C.teen(p)),
        w: 1.1,
        cool: 6,
        text: ()=>`A road station on the Neck Road. Soldiers block the way, unpaid for months and hungry. Queen Livia's men wear a gold sun badge, Prince Andros's a red dawn badge. These ones have pulled their badges off. "Whose are you?" asks their sergeant, and waits.`,
        choices: [
          {
            t: `Say "the Queen's"`,
            check: {s:"ins",s2:"int",d:41},
            win: {
              r: "Right guess. They wave you through with a grunt and a sun badge to wear next time.",
              fx: {happy:2,skill:{intrigue:1}},
            },
            lose: {
              r: "Wrong guess. They strip you of everything worth a copper.",
              fx: {coinPct:-.4,health:-6,wil:1,cause:"a beating at a road station"},
            },
          },
          {
            t: `Say "the Prince's"`,
            check: {s:"ins",s2:"int",d:41},
            win: {
              r: "Right guess. A red dawn badge and a sour look, and the road is yours.",
              fx: {happy:2,skill:{intrigue:1}},
            },
            lose: {
              r: `Wrong guess. "Andros's spy!" You lose your purse and a tooth.`,
              fx: {coinPct:-.4,health:-6,wil:1,cause:"a beating at a road station"},
            },
          },
          {
            t: `Say "nobody's" and offer bread instead of coin`,
            check: {s:"diplomacy",s2:"wil",d:36},
            win: {
              r: "Hungry men like bread better than politics. They share it with you, and tell you which stretch has bandits.",
              fx: {honor:2,skill:{diplomacy:2}},
            },
            lose: {r:"They take the bread and the purse.",fx:{coinPct:-.3}},
          },
        ],
      },
      {
        id: "rl_ai_wyrm",
        title: "The wyrm bounty",
        cond: (p,C)=>C.realm(p,"POL-32")&&C.adult(p)&&!C.old(p),
        w: 1,
        cool: 8,
        text: ()=>`Criers in ${A.pick(["Amberport","Aming","the hill villages"])} shout the Sultan's bounty: an Amber Wyrm has taken goats and a child from the forest edge. Men of the Spear Yard of Aming are gathering with heavy wyrm-spears, and they want more hands. The wyrm is as long as a galley.`,
        choices: [
          {
            t: "Take a heavy spear and join the hunt",
            r: "Twenty spears go into the green. You are near the front when the wyrm comes.",
            fx: {beast:{id:"CRE-05",place:"the rainforest edge",mod:.45}},
          },
          {
            t: "Carry spears and water for the hunters (5 suns)",
            r: "You see it from a distance: the size of it, and the courage of the men in front. You will never call a lizard small again.",
            fx: {coin:5,wil:1,skill:{spear:1}},
          },
          {
            t: "Keep your children inside and pray at the well",
            r: "The wyrm is driven back into the deep forest. Or killed. The criers say killed.",
            fx: {piety:2},
          },
        ],
      },
      {
        id: "rl_ai_cloves",
        title: "Burning the cloves",
        cond: (p,C)=>C.realm(p,"POL-32")&&C.ageAdj(p)>=10,
        w: 1,
        cool: 7,
        text: "The harvest was too good. The Sultan's men pile sacks of cloves on the harbor stones and burn them to keep the price high, and the whole of Amberport smells like a spice cake. Smuggling clove or nutmeg seedlings off the isles is death, but a sack of dried cloves, quietly kept, is merely theft.",
        choices: [
          {
            t: "Steal a sack from the pile in the smoke",
            check: {s:"stealth",s2:"spd",d:39},
            win: {r:"Coughing, you drag a sack into an alley. A Keshi sailor buys it for 20 suns.",fx:{coin:20}},
            lose: {r:"A guard's stick catches you across the back.",fx:{health:-8,punish:"theft"}},
          },
          {
            t: "Watch the fire with the old women, who weep",
            r: "A year of picking, burned in an hour. Even the pilots go quiet.",
            fx: {wil:.8},
          },
          {
            t: "Ask a Keshi captain about seedlings, very quietly",
            check: {s:"intrigue",s2:"ins",d:49},
            win: {
              r: "He names a price that would make you rich, and a death that would make you an example. You decide to know, not to do.",
              fx: {skill:{intrigue:3}},
            },
            lose: {
              r: "The Keshi captain is the Sultan's informer. You spend a long night explaining yourself.",
              fx: {prison:1,why:"asking after clove seedlings"},
            },
          },
        ],
      },
      {
        id: "rl_reef_share",
        title: "Share Day",
        cond: (p,C)=>C.realm(p,"POL-33")&&C.adult(p),
        w: 1.2,
        cool: 4,
        text: `Share Day after a great prize. On the beach the quartermaster reads from the share-book and every crew member steps up for gold, silks and Sabran dates. When your mate ${A.pick(["Tobin","Red Sal","Old Kettle","Mags"])} steps up, you see the quartermaster's thumb skip a line. Cheating at the share-out means the Drowning Post at low tide.`,
        choices: [
          {
            t: "Call it out before the crew",
            check: {s:"diplomacy",s2:"int",d:42},
            win: {
              r: "The book is read again aloud. The thumb is caught. The tide comes in at dusk. Your mate gets his share and swears you a brother.",
              fx: {fame:3,honor:4,newRel:{type:"friend",op:40}},
            },
            lose: {
              r: "The quartermaster reads it again, and this time the line is there. Everyone looks at you.",
              fx: {honor:-3,newRel:{type:"enemy",op:-30}},
            },
          },
          {
            t: "Tell the quartermaster privately you saw",
            r: "He gives you a share and a half and a long, cold look. You are in his book now, in more ways than one.",
            fx: {coin:30,honor:-4,skill:{intrigue:2}},
          },
          {
            t: "Take your own share and say nothing",
            r: "Twenty-five suns of gold and silk. The Articles are for those who can prove things.",
            fx: {coin:25},
          },
        ],
      },
      {
        id: "rl_reef_dragonnight",
        title: "Dragon Night",
        cond: (p,C)=>C.realm(p,"POL-33")&&(C.adult(p)||C.teen(p)),
        w: 1,
        cool: 5,
        text: "12 July, Dragon Night. Fire-rafts burn across the harbor and the shoals, and on the mainland they swear the dragon has woken. At midnight a captured captain who would not pay ransom is to be set adrift in a burning boat, so the watchers see the dragon feed. Anyone who tells the dragon's secret is drowned with a stone.",
        choices: [
          {
            t: "Help the Ratrock Raft Yard light the rafts",
            check: {s:"craft",s2:"spd",d:34},
            win: {
              r: "Your raft burns highest. Sten the Quiet nods once. A Ratrock nod is a medal.",
              fx: {skill:{craft:3,sea:1},fame:2},
            },
            lose: {
              r: "The oil splashes. You keep your hand, mostly.",
              fx: {health:-12,wound:"burn",cause:"fire-oil on Dragon Night"},
            },
          },
          {
            t: "Cut the captain loose in the dark",
            check: {s:"stealth",s2:"sea",d:49},
            win: {
              r: "You slip a knife into his bound hands and push him off before the oil is lit. The boat burns empty. Nobody counts the bones.",
              fx: {honor:6,trait:"kind"},
            },
            lose: {
              r: "Someone sees. Under the Articles, the crew votes on you.",
              fx: {honor:3,prison:1,why:"freeing a ransom prisoner on Dragon Night"},
            },
          },
          {
            t: "Drink stolen wine and cheer the dragon",
            r: "It is a good party, if you do not look at the boat.",
            fx: {happy:4},
          },
        ],
      },
      {
        id: "rl_tk_rhino",
        title: "Facing the rhino",
        cond: (p,C)=>C.realm(p,"POL-34")&&(C.teen(p)||C.adult(p)&&C.ageAdj(p)<30),
        w: 1.3,
        once: !0,
        text: "Spring. In the League of the Tusk Clans no one may speak at a clan council until they have faced a woolly rhino on foot with a spear. Many young ones die trying each spring. The Rhino Spear Lodge has found a bull grazing alone at the steppe edge. The heavy spear is yours if you take it.",
        choices: [
          {
            t: "Take the spear and walk out onto the grass",
            r: "The clan watches from the ridge. The bull lifts its head.",
            fx: {flag:"rl_tk_faced",beast:{id:"CRE-34",place:"the steppe edge",mod:.6}},
          },
          {
            t: "Ask Grel Rhinospear to teach you first",
            r: "A season at the Lodge. You learn where the hide is thin, and how to plant the butt of a spear. Next spring, perhaps.",
            fx: {skill:{spear:4,survival:2},ins:.4},
          },
          {
            t: "Refuse. You will speak in other ways",
            r: "You will never speak at council. You hold your tongue and start learning trade speech and counting instead.",
            fx: {skill:{trade:3},wil:1,happy:-3},
          },
        ],
      },
      {
        id: "rl_tk_toll",
        title: "The Kraoth toll",
        cond: (p,C)=>C.realm(p,"POL-34")&&C.adult(p),
        w: 1,
        cool: 7,
        text: ()=>`The silk caravans pay their toll at Kraoth, and robbing a caravan that has paid is the gravest crime in the League. But ${A.pick(["a Velgrad factor","a caravan master with a Drevnan accent","a merchant in a sable hat"])} offers you silver to guide his camels round Kraoth by the hidden track. A caravan that dodges the toll loses its goods, and its guides are flogged.`,
        choices: [
          {
            t: "Guide him round by the hidden track",
            check: {s:"survival",s2:"stealth",d:44},
            win: {
              r: "Three nights through the hills, and he pays 40 suns. The Toll-Keeper's riders never see you.",
              fx: {coin:40,skill:{survival:2},honor:-3},
            },
            lose: {
              r: "The Toll-Keeper's riders are waiting at the far end. The caravan loses its goods. You lose skin.",
              fx: {health:-15,wound:"back",honor:-5,wil:1.5,cause:"a flogging at Kraoth"},
            },
          },
          {
            t: "Tell the Toll-Keeper where the track runs",
            r: "The track is watched from now on. Gurz the Toll-Keeper sends you a bolt of silk and a nod.",
            fx: {coin:15,favor:4,fame:1},
          },
          {
            t: "Tell him to pay like everyone else",
            r: "He pays. The silver feeds the clans, and the clans keep the road safe. That is the bargain.",
            fx: {honor:2},
          },
        ],
      },
      {
        id: "rl_sy_birthtree",
        title: "The birth tree",
        cond: (p,C)=>C.realm(p,"POL-06","POL-07")&&C.child(p)&&C.race(p,"elf","halfelf"),
        w: 1.4,
        once: !0,
        text: p=>p.race==="elf"?`Your mother walks you deep into the wood to the young ${A.pick(["oak","beech","ash"])} that was planted the day you were born. Here you were named; here, in some centuries, you will be buried, and your life will pass into the tree. A Grove Keeper waits to teach you its pardon chant.`:"The other children have birth trees. You have learned, this year, that you do not: a half-elf is never given a birth tree, and has no tree and no grave inside the forest. Half-elves are buried outside the Oak Line, like strangers. Your elven grandmother finds you crying by the stream.",
        choices: [
          {
            t: p=>p.race==="elf"?"Learn the pardon chant by heart":"Ask your grandmother why",
            r: p=>p.race==="elf"?"You sing it to your tree until the leaves seem to listen. A Keeper smiles at you for the first time.":'"Because the law is old and slow," she says. "Older than me. Slower than me." She holds you a long time.',
            fx: p=>(p.race==="elf"?(A.trainSkill(p,"faith",3),p.piety=A.clamp(p.piety+4,0,100)):(A.willGrow(p,2,"event"),p.happy=A.clamp(p.happy-3,0,100)),""),
          },
          {
            t: p=>p.race==="elf"?"Climb your tree to the top":"Plant a sapling of your own, outside the Oak Line",
            check: {s:"spd",s2:"wil",d:22},
            win: {
              r: p=>p.race==="elf"?"Up in the crown you can see the whole Evenwood rolling away like a green sea. You never forget it.":"You plant it by the stones. It takes. Whatever the law says, this one is yours.",
              fx: {happy:5,wil:.6},
            },
            lose: {
              r: p=>p.race==="elf"?"A branch gives and you fall into the ferns. The Keeper is not pleased with either of you.":"Deer eat it within the month. You plant another.",
              fx: {health:-4,wil:1},
            },
          },
          {
            t: "Listen to the old elves talk about the Moot of Leaves",
            r: "Old voices about old laws, and the heir, and the Oakborn line. You understand one word in four, and remember all of them.",
            fx: {int:.4,skill:{learning:2}},
          },
        ],
      },
      {
        id: "rl_sy_oakline",
        title: "Three warnings",
        cond: (p,C)=>C.realm(p,"POL-06")&&C.adult(p),
        w: 1.1,
        cool: 6,
        text: p=>`At the Oak Line ${p.race==="elf"||p.race==="halfelf"?"you are on watch with the rangers":"you are gathering mushrooms with elven leave"} when you hear an axe. A human woodcutter is notching a living oak north of the stones. Under Sylvaran law, humans who fell trees north of the Oak Line may be shot without warning after three warnings. This is his second.`,
        choices: [
          {
            t: "Give the third warning yourself, face to face",
            check: {s:"diplomacy",s2:"wil",d:34},
            win: {
              r: "He sees your face, the bows in the trees behind you, and drops the axe. He walks south without a word.",
              fx: {honor:3,skill:{diplomacy:2}},
            },
            lose: {r:"He spits and keeps cutting. The rangers above you nock arrows.",fx:{wil:1,happy:-3}},
          },
          {
            t: "Put an arrow in the oak beside his head",
            check: {s:"bow",s2:"ins",d:42},
            win: {r:"The shaft hums an inch from his ear. He runs and does not come back.",fx:{skill:{bow:3},fame:1}},
            lose: {
              r: "The arrow goes into his shoulder. He will live, and Aldmark will hear of it.",
              fx: {honor:-3,skill:{bow:1},happy:-4},
            },
          },
          {
            t: "Fetch a Grove Keeper",
            r: "The Keeper speaks to the tree first and to the man second. The notch is bound with clay. The man is marched south.",
            fx: {piety:3},
          },
        ],
      },
      {
        id: "rl_eg_keel",
        title: "Sailing on grandmothers",
        cond: (p,C)=>C.realm(p,"POL-07")&&C.adult(p),
        w: 1,
        cool: 10,
        text: `The Shipwrights of Nimthil come to your family with a Keeper's mark. In Eldergrove a ship's keel is cut from the tree that grew over a dead captain, and the great fir on the hill over your ${A.pick(["grandmother","great-uncle","mother's mother"])} is ready. Sailors say they sail on their grandmothers. Sylvaran calls it robbing the dead.`,
        choices: [
          {
            t: "Give the tree, and sail on the new ship",
            r: "You lay a hand on the keel at the launching. When she takes the first wave you could swear you hear an old voice laugh.",
            fx: {piety:3,skill:{sea:3},happy:3},
          },
          {
            t: "Refuse. Let the old one keep growing",
            r: "The shipwrights bow and go. The family argues for a decade, which is short by elven reckoning.",
            fx: {honor:2,wil:1},
          },
          {
            t: "Ask for a share in the ship as the tree's price",
            check: {s:"trade",s2:"diplomacy",d:39},
            win: {
              r: "A fifth share. When she comes home from Frostholm with ivory and oil, so does your purse.",
              fx: {coin:40,skill:{trade:2}},
            },
            lose: {r:"The shipwrights are offended. The Grey Veil council hears of your greed.",fx:{honor:-3}},
          },
        ],
      },
      {
        id: "rl_eg_dusk",
        title: "The Dusk School",
        cond: (p,C)=>C.realm(p,"POL-07")&&(C.adult(p)||C.teen(p))&&!C.old(p),
        w: 1,
        once: !0,
        text: 'A grey-veiled elf of the Mistwalker line stops you on the quay at dusk. The Dusk School of Silverbough teaches night fighting, silent movement and archery by starlight, and she has watched you move. "Come to the wood at moonless dark. Bring a bow. Make no sound."',
        choices: [
          {
            t: "Go, and shoot by starlight",
            check: {s:"bow",s2:"stealth",d:44},
            win: {
              r: 'Three arrows into a pale target you can barely see. A soft voice from the dark says, "Again tomorrow."',
              fx: {skill:{bow:4,stealth:3},flag:"rl_eg_dusk",ins:.4},
            },
            lose: {
              r: 'You step on every twig in the wood. "Come back in ten years," says the voice, kindly.',
              fx: {skill:{stealth:1}},
            },
          },
          {
            t: "Go, but only to watch",
            r: "You watch the night rangers move like smoke. You learn more by watching than you expected.",
            fx: {skill:{stealth:2},ins:.3},
          },
          {
            t: "Decline. The sea is your school",
            r: "She nods and is gone before you finish the sentence.",
            fx: {skill:{sea:1}},
          },
        ],
      },
      {
        id: "rl_elf_slow",
        title: "The slow centuries",
        cond: (p,C)=>C.race(p,"elf")&&C.adult(p)&&C.age(p)>=70,
        w: .9,
        cool: 25,
        text: ()=>`A letter comes from the human world: ${A.pick(["the boy who sold you nails in a forest-edge market","the human woman you danced with at a harvest fair","the young soldier you once nursed through a fever"])} is dying, old and white-haired. To you it was a handful of seasons ago. Humans burn like candles. Elves are trees.`,
        choices: [
          {
            t: "Travel to sit by the deathbed",
            r: "You hold a hand gone thin as paper, and see the young face inside the old one. You will remember for both of you.",
            fx: {wil:2,honor:2,happy:-4},
          },
          {
            t: "Plant a tree for them under elven custom",
            r: "It is not their way, but it is yours. In three hundred years it will be the tallest tree on the hill.",
            fx: {piety:3,wil:1},
          },
          {
            t: "Burn the letter. It is easier not to love the short-lived",
            r: "It is easier. Elves who do this grow cold, and you can feel it starting.",
            fx: {trait:"cynical",happy:-2},
          },
        ],
      },
      {
        id: "rl_giant_chant",
        title: "The lineage chant",
        cond: (p,C)=>C.race(p,"giant")&&C.child(p)&&C.realm(p,"POL-09","POL-23"),
        w: 1.4,
        cool: 6,
        text: "Giant children learn the chants for twenty-five years before they are grown. Tonight the eldest of your hall sits by the fire and begins your line, back past the Thing of the last king, back to the first hall cut in the ice. You must give it back to the whole hall, without one name wrong. A lie at the Thing is the worst crime; a wrong name is close.",
        choices: [
          {
            t: "Chant it back in the deep voice",
            check: {s:"int",s2:"wil",d:25},
            win: {
              r: "The hall thumps the floor so hard the human servants' cups jump. Every giant child is precious; tonight you feel it.",
              fx: {skill:{learning:3,music:2},happy:4,piety:2},
            },
            lose: {
              r: "You swap two grandmothers. The eldest makes you start from the beginning. All of it.",
              fx: {wil:1,skill:{learning:2}},
            },
          },
          {
            t: "Ask about the sixtieth Mother",
            r: 'The hall goes quiet. Jotunhall is in the time of the 52nd Mother, the eldest says, and the sixtieth will be the last. "Learn the chant. Then there will be someone to sing it."',
            fx: {int:.4,wil:.6},
          },
          {
            t: "Slip out to play with the human children",
            r: "They ride on your shoulders and scream with joy. Nobody will remember this in a chant. You will.",
            fx: {happy:5,newRel:{type:"friend",op:25}},
          },
        ],
      },
      {
        id: "rl_giant_knees",
        title: "Failing knees",
        cond: (p,C)=>C.race(p,"giant")&&C.adult(p)&&C.realm(p,"POL-09","POL-23"),
        w: 1,
        cool: 12,
        text: p=>C_OLD(p)?"Your knees grind like millstones now, and the walk to the shore takes half a morning. Among the giants, when an old one can no longer walk to the shore, the hall carries them onto the winter sea ice, and they go down to the Mother. The young ones of your hall watch you on the stairs.":`Old ${A.pick(["Hroa","Bergljot","Thrand","Asvald"])} of your hall can no longer walk to the shore. Tonight the hall will carry the old one onto the winter sea ice, as is done, to go down to the Mother. Outsiders call it murder. The old one asks you to carry the head end.`,
        choices: [
          {
            t: p=>C_OLD(p)?"Walk to the shore every day, however long it takes":"Carry the old one onto the ice",
            r: p=>C_OLD(p)?"Every morning, step by grinding step, the whole hall watching. Not this winter. Not yet.":"The ice groans under you. You set the old one down facing the open water and sing until the cold takes the singing.",
            fx: {wil:2.5,piety:2,happy:-3},
          },
          {
            t: p=>C_OLD(p)?"Ask your hall to carry you when the ice comes":"Plead with the eldest for one more summer",
            check: {s:"diplomacy",s2:"wil",d:34},
            win: {
              r: p=>C_OLD(p)?"They promise. There is peace in it. You start to give away your harpoons.":"The eldest allows it. One more summer of sun on old shoulders.",
              fx: {honor:3,piety:2,wil:1},
            },
            lose: {r:"The eldest only looks at you. Custom is a glacier.",fx:{wil:1.5,happy:-3}},
          },
          {
            t: "Ask the human healers for willow bark and salves",
            r: "The salves help a little. The tribute-folk healer is astonished to be asked; giants rarely ask anyone.",
            fx: {health:6,skill:{medicine:1},happy:1},
          },
        ],
      },
    ]);
    const PILGRIM = {
        "REL-01": [
          "Solenne for Return Day",
          "the Shadow Needle and the Crowning Stone, where Corvan was crowned",
          "a brass sun badge",
        ],
        "REL-02": [
          "the slopes below Redcrown in August",
          "the red glow of the volcano the Church calls the Lamp's embers",
          "a red thread blessed at the Dawn Cathedral",
        ],
        "REL-03": [
          "the Oath Hall at Kingsmere",
          "the great iron ring of the Oathfather, black with a thousand years of hands",
          "a little iron ring",
        ],
        "REL-04": [
          "the First Oak at Evenglade",
          "the fifth First Oak, grown from Queen Aelinwe's acorns",
          "an acorn from the First Oak",
        ],
        "REL-05": [
          "the First Hall of Stonehold",
          "the walls where the Deep Law was first carved",
          "a chip of the founding stone",
        ],
        "REL-07": [
          "the Well of Samar on Well Day",
          "the first well, where Samar found water",
          "a flask of water from the Well",
        ],
        "REL-08": [
          "the Flood Stairs at Tamar",
          "the great stairs where the flood-priests measure the river",
          "a reed cut from the Stairs",
        ],
        "REL-09": [
          "the Ancestor Hill of Zanara",
          "the hill where the emperors lie and the High Rememberer sings",
          "a cowrie shell from the Hill",
        ],
        "REL-10": [
          "the Great Temple of Ranpur",
          "the Great Temple and its thousand shrines",
          "a flower garland from the Temple",
        ],
      },
      faithName = p=>{const f=A.faith(p.faith);return f&&f.name?f.name:"the gods"};
    A.defEvents([
      {
        id: "rl_f_noon",
        title: "Lying at noon",
        cond: (p,C)=>C.faith(p,"REL-01")&&C.adult(p),
        w: 1,
        cool: 8,
        text: ()=>`The noon bell rings across the market as ${A.pick(["a grain factor","your employer","a cloth merchant you owe a favor"])} asks you to swear before the notary that the sacks weigh full. They do not. "Don't lie at noon," the Solen saying goes: the noon hour is holy, and a lie spoken under the bell is a lie spoken to the Light itself.`,
        choices: [
          {
            t: "Swear to it anyway",
            r: "The words come out while the bell is still humming. Twelve suns. You do not look up at the sun for the rest of the day.",
            fx: {coin:12,piety:-5,honor:-3},
          },
          {
            t: "Refuse and say what the sacks really weigh",
            r: "The notary writes the true weight. The merchant will not forget, but the dawnkeeper hears of it and praises you on Sunday.",
            fx: {honor:4,piety:3,newRel:{type:"enemy",op:-20}},
          },
          {
            t: "Wait until the bell stops, then swear",
            check: {s:"intrigue",s2:"int",d:34},
            win: {
              r: "One breath after the last stroke. The Temple's lawyers argue about whether that counts. You have twelve suns while they argue.",
              fx: {coin:12,piety:-1,skill:{intrigue:2}},
            },
            lose: {
              r: "The bell-ringer is slow today. You swear on the twelfth stroke. Everyone heard it.",
              fx: {coin:12,piety:-6,honor:-4},
            },
          },
        ],
      },
      {
        id: "rl_f_hearth",
        title: "The Midwinter hearth",
        cond: (p,C)=>C.faith(p,"REL-01","REL-02")&&C.ageAdj(p)>=7,
        w: 1,
        cool: 6,
        text: p=>`Midwinter Vigil, the longest night. The sun must be held through its weakest hour, and every house keeps its hearth burning till dawn. "A hearth that dies at Midwinter is a house that dies in spring." At midnight ${C_OLD(p)?"your old bones wake you to":"you wake to"} a few red coals and no dry wood. Sleet is hammering on the door.`,
        choices: [
          {
            t: "Go out into the sleet for wood",
            check: {s:"sta",s2:"wil",d:30},
            win: {
              r: "You come back soaked with an armful from under the eaves of the church. The fire roars up. The sun comes back on time.",
              fx: {piety:3,wil:1,sta:.3},
            },
            lose: {
              r: "You find wood, and the cold finds your fingers. The fire lives. Your hands ache all winter.",
              fx: {piety:3,wound:"frostbite",wil:1.5},
            },
          },
          {
            t: "Break up a stool and feed it to the fire",
            r: "A good stool, your grandfather's. The hearth lives. You will sit on the floor until spring.",
            fx: {piety:2,happy:-1},
          },
          {
            t: "Run to the neighbors to beg live coals",
            check: {s:"diplomacy",s2:"spd",d:25},
            win: {
              r: "Old Marta gives you coals in a pot and a cup of hot wine. In the morning the whole street knows, and laughs, and helps.",
              fx: {piety:2,newRel:{type:"friend",op:15}},
            },
            lose: {
              r: "Their hearth is dying too. You blow on your coals until dawn, and they hold, barely.",
              fx: {piety:1,wil:1},
            },
          },
          {
            t: "Let it die. It is only a fire",
            r: "Nobody sees. In spring, when anything goes wrong, you remember that night.",
            fx: {piety:-6,trait:"cynical"},
          },
        ],
      },
      {
        id: "rl_f_burn",
        title: "Burning the dead",
        cond: (p,C)=>C.faith(p,"REL-01","REL-02")&&C.adult(p),
        w: .8,
        cool: 12,
        text: ()=>`A fever has killed a family of five in your street. A ${A.pick(["Qadiri physician","Ranpuri healer","half-elf herb-woman"])} says the bodies and the bedding must be burned, or the sickness will spread. But the dead are buried at dawn facing east, never burned: fire belongs to the sun, and burning a body is a crime.`,
        choices: [
          {
            t: "Help burn them at night outside the walls",
            check: {s:"stealth",s2:"wil",d:39},
            win: {
              r: "Smoke in the dark, a prayer said anyway. The fever does not spread. Nobody ever tells.",
              fx: {piety:-6,honor:2,skill:{medicine:2}},
            },
            lose: {
              r: "The watch sees the fire. The priests call it sacrilege; the magistrate calls it a fine.",
              fx: {piety:-6,coin:-15,honor:-3},
            },
          },
          {
            t: "Bury them at dawn, facing east, as is right",
            check: {s:"sta",s2:"medicine",d:36},
            win: {r:"A dawnkeeper reads the rite. You wash in vinegar afterward, and stay well.",fx:{piety:4}},
            lose: {
              r: "You carry the fever home with you. A bad month.",
              fx: {piety:4,health:-18,wil:1.5,cause:"a burial fever"},
            },
          },
          {
            t: "Bury the bodies but burn the bedding",
            check: {s:"int",s2:"medicine",d:38},
            win: {
              r: "The priests do not mind burning straw. The physician nods. A middle road that works.",
              fx: {piety:1,skill:{medicine:3},int:.4},
            },
            lose: {r:"The physician says it is not enough. Two more neighbors sicken.",fx:{happy:-4}},
          },
        ],
      },
      {
        id: "rl_f_heresy",
        title: "The count of the years",
        cond: (p,C)=>C.faith(p,"REL-01")&&C.adult(p)&&C.literate(p),
        w: .7,
        once: !0,
        text: `A friend who copies for the Temple shows you a sheet of numbers by candlelight: reigns, eclipses, the dates in Brother Odo's chronicle. "The Common Reckoning is wrong," he whispers. "Six years short." That is the Needle Heresy. The last Needle Heretic was silenced in 1068, walled up under the Shadow Needle.`,
        choices: [
          {
            t: "Help him check the numbers",
            check: {s:"learning",s2:"int",d:49},
            win: {
              r: "You check them three times. He is right. You both burn the sheet and say nothing, but you can never hear the noon bell the same way again.",
              fx: {int:1,skill:{learning:4},flag:"rl_needle_doubt",piety:-3},
            },
            lose: {r:"You cannot follow it. Maybe he is wrong. You hope he is wrong.",fx:{skill:{learning:1}}},
          },
          {
            t: "Report him to the Luminary",
            r: "He vanishes. A Knight of the Sun thanks you for your faith. You do not sleep well.",
            fx: {piety:4,honor:-8,favor:3,happy:-5},
          },
          {
            t: "Tell him to burn it, for both your sakes",
            r: 'He looks at you, then at the candle, and burns it. "Some truths have no use," he says. He does not sound sure.',
            fx: {wil:1,honor:1},
          },
        ],
      },
      {
        id: "rl_f_darkweeks",
        title: "The Dark Weeks",
        cond: (p,C)=>C.faith(p,"REL-02")&&C.ageAdj(p)>=9,
        w: 1,
        cool: 5,
        text: ()=>`The four Dark Weeks before the Dawn Feast: no meat, the church lamps veiled, black rye and cabbage every day. In the third week ${A.pick(["your uncle comes back from the forest with a fat hare","the smell of a tavern sausage follows you down the street","a traveling Ostran offers you smoked ham for a song"])}. Eating meat in the Dark Weeks is a sin.`,
        choices: [
          {
            t: "Keep the fast",
            r: "At the Dawn Feast on 20 March, when the lamps are unveiled and honey cakes come out, you weep with the whole church. You earned it.",
            fx: {piety:4,wil:1.5,health:-2},
          },
          {
            t: "Eat it in secret",
            check: {s:"stealth",s2:"int",d:29},
            win: {r:"Delicious, guilty and greasy. Nobody knows but the Light.",fx:{piety:-3,health:2,happy:3}},
            lose: {
              r: "The priest's wife smells it on you. You do penance at the church door for a week.",
              fx: {piety:-2,honor:-3,happy:-4},
            },
          },
          {
            t: "Eat it openly and say the Light has better things to watch",
            r: "Some laugh. The priest does not. You are not invited to the Feast table.",
            fx: {piety:-5,trait:"cynical",happy:2},
          },
        ],
      },
      {
        id: "rl_f_horse",
        title: "The sacred horse",
        cond: (p,C)=>C.faith(p,"REL-03")&&C.adult(p)&&!C.rich(p),
        w: .9,
        cool: 10,
        text: "A starving winter. Your old plough horse dies in its stall. Horse is sacred to the Hunter and never eaten; the Seven Halls forbid it, and the neighbors would talk. But there is meat in the stall, and your family has eaten nothing but thin porridge for a week.",
        choices: [
          {
            t: "Bury the horse with honor",
            r: "You dig through frozen earth for a day. The Hunter remembers such things, the hall-priest says. Your belly does not.",
            fx: {piety:4,wil:1.5,health:-5,cause:"a hungry winter"},
          },
          {
            t: "Eat it, quietly",
            check: {s:"stealth",s2:"int",d:34},
            win: {
              r: "Dark meat, cooked at night with the shutters closed. Your family lives to spring.",
              fx: {health:6,piety:-6},
            },
            lose: {
              r: "The neighbors smell it. The hall-priest bars you from the Hunter's Feast.",
              fx: {health:6,piety:-6,honor:-5,happy:-4},
            },
          },
          {
            t: "Sell the carcass to the tanner and the dog-keepers",
            r: "Eight suns buys rye. Hide for leather, meat for the dogs. A grey kind of answer.",
            fx: {coin:8,piety:-1},
          },
        ],
      },
      {
        id: "rl_f_alms",
        title: "The water-alms",
        cond: (p,C)=>C.faith(p,"REL-07")&&C.adult(p),
        w: 1,
        cool: 6,
        text: ()=>`August, the Dry Month. You fast from dawn to dusk and your water jar is nearly empty. At noon a ${A.pick(["dusty pilgrim bound for the Well of Samar","foreign trader in the wrong clothes","ragged boy"])} knocks at your door and asks for water. Every household must give water to any traveler; refusing is a taboo.`,
        choices: [
          {
            t: "Give him the jar",
            r: "He drinks it all. At dusk you have nothing to break the fast with but the Book of Wells, and somehow it is enough.",
            fx: {piety:5,honor:2,health:-3},
          },
          {
            t: "Give him half, and explain",
            r: 'He understands. "The Giver counts the cup, not the size of it," he says.',
            fx: {piety:2,honor:1},
          },
          {
            t: "Close the door",
            r: "He knocks again, then goes. You cannot pray properly for the rest of the month.",
            fx: {piety:-7,honor:-5},
          },
        ],
      },
      {
        id: "rl_f_ibis",
        title: "The dead ibis",
        cond: (p,C)=>C.faith(p,"REL-08")&&C.ageAdj(p)>=8,
        w: 1,
        cool: 10,
        text: "Your dog trots home with a white ibis in its mouth, very dead. Killing an ibis is a crime against the Flood Mother, punished by death. Nobody saw. Probably. A fisherman's boy was near the reeds.",
        choices: [
          {
            t: "Bury it deep under the onion bed",
            check: {s:"stealth",s2:"int",d:32},
            win: {r:"The onions grow very well that year. You never tell.",fx:{piety:-2}},
            lose: {
              r: "The fisherman's boy saw. The flood-priests take the dog and fine your house heavily.",
              fx: {coin:-20,piety:-2,happy:-6},
            },
          },
          {
            t: "Carry it to the flood-priests and confess",
            r: "They bless the bird and drown your dog in the river as an offering. It is not your death, at least.",
            fx: {piety:4,honor:3,happy:-6,wil:1},
          },
          {
            t: "Leave it by a neighbor's gate",
            r: "It is not your problem now. It is very much your neighbor's. That is a bad thing you did.",
            fx: {honor:-6,trait:"deceitful"},
          },
        ],
      },
      {
        id: "rl_f_lamps",
        title: "The Festival of Lamps",
        cond: (p,C)=>(C.faith(p,"REL-10")||C.realm(p,"POL-30","POL-32"))&&C.ageAdj(p)>=8,
        w: 1,
        cool: 5,
        text: "25 October, the Festival of Lamps. Ten thousand little clay lamps float down the river at dusk, each one a prayer, each one a name. Temple families sing on the ghats. In the shallows the sacred river fish rise to nibble the flower offerings, fat and fearless.",
        choices: [
          {
            t: "Float a lamp for your dead",
            r: "You watch your little flame until it joins the river of them. For a moment the dead feel very close.",
            fx: {piety:4,happy:3},
          },
          {
            t: "Dance on the ghats until midnight",
            check: {s:"spd",s2:"diplomacy",d:31},
            win: {
              r: "Someone with jasmine in their hair dances with you until the last lamp goes out.",
              fx: {happy:5,lover:!0},
            },
            lose: {
              r: "You slip into the river and come up wearing three lamps. The ghats laugh with you.",
              fx: {happy:2},
            },
          },
          {
            t: "Catch one of the fat sacred fish for supper",
            check: {s:"stealth",s2:"survival",d:39},
            win: {
              r: "Delicious and deeply forbidden. Your stomach is happy; your shrine is not.",
              fx: {piety:-5,health:2},
            },
            lose: {
              r: "A temple boy sees you. The temple court fines you a month's wages.",
              fx: {piety:-5,coin:-15,honor:-3},
            },
          },
        ],
      },
      {
        id: "rl_f_storm",
        title: "Storm Coming",
        cond: (p,C)=>C.faith(p,"REL-11")&&C.ageAdj(p)>=10,
        w: 1,
        cool: 5,
        text: `The first thunder of spring rolls over the grass: Storm Coming. The shamans drum, and the clan pours mare's milk for the Storm-Father and the Mare. Spilling it carelessly is taboo. The old shaman points at you with her drumstick. "You. Into the sweat lodge tonight."`,
        choices: [
          {
            t: "Go into the sweat lodge",
            check: {s:"sta",s2:"wil",d:36},
            win: {
              r: "Heat, drums, darkness. You see a grey horse running in a storm and come out shaking. The shaman nods as if she expected it.",
              fx: {piety:5,wil:1.5,sta:.4},
            },
            lose: {
              r: 'You faint in the heat and they drag you out by the ankles. "Next spring," says the shaman.',
              fx: {health:-5,wil:1},
            },
          },
          {
            t: "Carry the milk bowl to the libation",
            check: {s:"spd",s2:"wil",d:30},
            win: {
              r: "Not a drop spilled. The clan-mothers mark you as careful, and careful is rare.",
              fx: {piety:3,honor:2},
            },
            lose: {
              r: "You trip on a tent rope. Milk on the grass. The whole clan goes silent.",
              fx: {piety:-4,honor:-3,wil:1},
            },
          },
          {
            t: "Drum with the young shamans",
            r: "The thunder and the drums answer each other. Your hands blister. You feel the storm in your chest.",
            fx: {skill:{music:3},piety:2},
          },
        ],
      },
      {
        id: "rl_f_convert",
        title: "The other church",
        cond: (p,C)=>C.faith(p,"REL-01","REL-02")&&C.realm(p,"POL-31","POL-25","POL-26","POL-02","POL-15","POL-03")&&C.adult(p),
        w: .8,
        cool: 12,
        text: p=>p.faith==="REL-01"?`A married priest of the Dawn Church preaches in a barn outside town, not in Old Solen but in the plain tongue everyone understands. "The sun is a lamp, not the Light. No High Luminary rules all bishops." ${p.realm==="POL-31"?"In Tessaria the churches mark the two sides of a war, and the Patriarch at Velgrad may yet unlight a prince.":"The dawnkeepers call it the Dawn Schism of 734, still festering."}`:`A dawnkeeper of the Temple of the Returning Sun preaches at the crossroads in Old Solen and then in bad Eastfolk. "The sun is the Light's own face. One High Luminary, one Church." ${p.realm==="POL-31"?"In Tessaria the two churches mark the two sides of a war. Changing church here is changing sides.":"Your priest calls him a Solen spy."}`,
        choices: [
          {
            t: "Listen, and change your church",
            r: p=>`You go to the other altar now. Your family is shocked. ${p.realm==="POL-31"?"Some neighbors stop speaking to you; some start.":"The priest of your old church calls your name from the pulpit, sadly."}`,
            fx: p=>(p.faith=p.faith==="REL-01"?"REL-02":"REL-01",p.piety=A.clamp(p.piety+3,0,100),A.willGrow(p,1,"event"),`(You now follow the ${faithName(p)}.)`),
          },
          {
            t: "Debate him in front of the crowd",
            check: {s:"learning",s2:"diplomacy",d:44},
            win: {
              r: "You quote the Schism back at him and the crowd cheers you. He packs up and moves on to the next village.",
              fx: {fame:2,piety:3,skill:{learning:2,diplomacy:2}},
            },
            lose: {r:"He answers every point, gently. Some of the crowd stays with him.",fx:{piety:-1,int:.4}},
          },
          {
            t: "Report him to your priest",
            r: "He is driven out of town by dogs and boys. Your priest thanks you. The preacher's eyes find yours as he goes.",
            fx: {piety:2,honor:-2},
          },
        ],
      },
      {
        id: "rl_f_pilgrim",
        title: "Pilgrimage",
        cond: (p,C)=>C.adult(p)&&!!PILGRIM[p.faith]&&!C.flag(p,"rl_pilgrim"),
        w: .8,
        cool: 10,
        text: p=>{const g=PILGRIM[p.faith];return`Your neighbors are going on pilgrimage to ${g[0]}, to see ${g[1]}. It is weeks on the road, and dear. The old people say a life without one pilgrimage is a house without a roof.`},
        choices: [
          {
            t: "Go with them (15 suns)",
            req: p=>p.coin>=15,
            check: {s:"sta",s2:"wil",d:31},
            win: {
              r: p=>`Dust, inns, songs, blisters, and then the holy place itself. You come home with ${PILGRIM[p.faith][2]} and something in your face that was not there before.`,
              fx: {coin:-15,piety:8,happy:6,wil:1,flag:"rl_pilgrim",deed:"Made the pilgrimage of the faithful"},
            },
            lose: {
              r: "Fever on the road. You reach the holy place on a litter, but you reach it.",
              fx: {coin:-15,piety:6,health:-12,wil:1.5,flag:"rl_pilgrim",cause:"fever on a pilgrim road"},
            },
          },
          {
            t: "Send an offering with them (4 suns)",
            req: p=>p.coin>=4,
            r: "Your coin goes on the road without you. The old people say it counts. A little.",
            fx: {coin:-4,piety:2},
          },
          {t:"Not this year",r:"The road will still be there next year. You hope you will be too.",fx:{}},
        ],
      },
      {
        id: "rl_f_priest",
        title: "A calling",
        cond: (p,C)=>C.faith(p,"REL-01","REL-02","REL-03")&&C.adult(p)&&C.ageAdj(p)<30&&!C.job(p,"clergy")&&free(p),
        w: .7,
        once: !0,
        text: p=>({"REL-01":`The dawnkeeper of ${A.provName(p.home)} has watched you at the dawn greeting for years. "The Temple needs priests. You would have to give up marriage forever; dawnkeepers may not marry. But you would never go hungry, and you would learn to read the Light's own books."`,"REL-02":`The parish priest of ${A.provName(p.home)} is old and has no son to follow him. "You could take my church. You must be married first, mind: a priest who serves unmarried is a scandal to the Dawn. The Patriarch will lay hands on you in Velgrad."`,"REL-03":"Your village's hall-priest has no heir, and the hall votes to offer the iron and the knife to you. Hall-priests may marry and are often hereditary; you would keep the oath-ring, judge oaths and lead the sacrifices at the great feasts."})[p.faith]||"A priest offers you a place in the church.",
        choices: [
          {
            t: "Answer the call",
            req: p=>!(p.faith==="REL-01"&&p.spouse&&A.P(p.spouse)&&A.P(p.spouse).alive),
            r: "You take the vows. The first year is all memorizing and cold floors. Then people start to come to you with their troubles.",
            fx: {job:"clergy",piety:6,skill:{faith:4,learning:2}},
          },
          {
            t: "Ask for a year to think",
            r: "The offer stays open, the priest says. You both know it does not, really.",
            fx: {wil:.5},
          },
          {
            t: "Say no. You want a different life",
            r: "The priest nods, disappointed. Somebody else's child takes the place.",
            fx: {happy:1},
          },
        ],
      },
      {
        id: "rl_f_ashen",
        title: "Ash Night",
        cond: (p,C)=>(C.realm(p,"POL-05")||C.faith(p,"REL-15"))&&C.adult(p),
        w: .9,
        cool: 8,
        text: '31 October, Ash Night. In Ashmere it is marked with special fear because of Mount Cinder, and the villages keep lamps burning against what walks. A woman you know slightly stops you in the lane. Her eyelids are rubbed grey with ash. "Come and see the true rite," she whispers. The Ashen are hunted by the Temple.',
        choices: [
          {
            t: "Go to the hidden rite",
            check: {s:"stealth",s2:"wil",d:36},
            win: {
              r: "A barn, ash and blood in a bowl, and a name of the mountain that nobody may speak. It is frightening, and strangely calm. You keep the secret.",
              fx: {flag:"rl_ashen",skill:{intrigue:2},piety:-3,trait:"curious"},
            },
            lose: {
              r: "Temple hunters raid the barn. You run through the hedges with ash on your face.",
              fx: {health:-6,honor:-4,wil:1},
            },
          },
          {
            t: "Tell the Temple hunters",
            r: "The barn is raided. The woman is taken. The hunters thank you. Her children look at you in the lane for years.",
            fx: {favor:3,piety:2,honor:-3,newRel:{type:"enemy",op:-35}},
          },
          {
            t: "Bar the door and keep your lamp burning",
            r: "Something scratches at the shutters. A fox, surely. The lamp burns till dawn.",
            fx: {piety:1},
          },
        ],
      },
    ]);
    function secretEv(o){return{id:o.id,title:o.title,cond:o.cond,w:o.w||.8,once:!0,setup:(p,ctx)=>{secPick(p,ctx,o.ids)},text:(p,ctx)=>`${o.intro(p,ctx)} The story everyone knows: "${secPub(ctx)}"`,choices:[{t:o.dig||"Dig deeper, quietly",check:{s:"intrigue",s2:"int",d:o.d||50},win:{r:(p,ctx)=>`You learn the truth of "${ctx.secTitle}". ${secTruth(ctx)}`,fx:(p,ctx)=>(learn(p,ctx),A.trainSkill(p,"intrigue",3),A.train(p,"int",.6),"")},lose:{r:o.digFail||"Doors close in your face. Someone has noticed your questions, and does not like them.",fx:{wil:1,newRel:{type:"enemy",op:-25}}}},{t:o.sell||"Sell what you have to a buyer of whispers",check:{s:"trade",s2:"intrigue",d:39},win:{r:"A quiet buyer pays well and asks you to forget his face. You do not ask what he will do with it.",fx:(p,ctx)=>{learn(p,ctx);const n=A.ri(25,70);return p.coin+=n,`(+${n} suns)`}},lose:{r:"The buyer pays you in bruises and takes your notes.",fx:{health:-12,coin:-5,cause:"men who buy secrets"}}},{t:o.keep||"Keep it to yourself",r:"Some things are safer unknown. You tuck it away where nobody will look.",fx:(p,ctx)=>(learn(p,ctx),A.willGrow(p,.6,"event"),"")},{t:o.tell||"Tell everyone what you suspect",check:{s:"diplomacy",s2:"wil",d:52},win:{r:(p,ctx)=>`People listen, then argue, then repeat it in every tavern. ${secIfr(ctx)} Your name travels with the tale.`,fx:(p,ctx)=>{learn(p,ctx),A.fame(p,4);const q=A.makeAcquaintance(p,"enemy");return A.link(p,q,"enemy",-40,"enemy"),`(${q.given} is your enemy now)`}},lose:{r:"Nobody believes you. But somebody powerful now knows your name.",fx:{fame:1,honor:-2,health:-8,newRel:{type:"enemy",op:-40},cause:"men sent to quiet a loose tongue"}}}]}}
    A.defEvents([
      secretEv({
        id: "rl_sec_archive",
        title: "A page that does not belong",
        w: .9,
        cond: (p,C)=>C.adult(p)&&(C.literate(p)||C.job(p,"scribe")||C.job(p,"clergy")),
        intro: (p,ctx)=>`Copying old rolls by lamplight, you find a page tucked where no page should be. It concerns "${ctx.secTitle}", and it does not agree with what everyone knows.`,
      }),
      secretEv({
        id: "rl_sec_deathbed",
        title: "A deathbed whisper",
        w: .8,
        cond: (p,C)=>C.adult(p),
        intro: (p,ctx)=>`An old ${A.pick(["servant of a great house","soldier","clerk","priest"])} you have been sitting with is dying. Near the end ${A.pick(["she","he"])} grips your wrist: "I was there. The business they call '${ctx.secTitle}' was a lie. I lied too."`,
        dig: "Ask for everything, every name",
      }),
      secretEv({
        id: "rl_sec_conrad",
        title: "The huntsmen of Swanvale",
        ids: ["SEC-56"],
        cond: (p,C)=>C.realm(p,"POL-01")&&C.adult(p),
        intro: ()=>"At an inn near Swanvale, two old pensioned huntsmen of the imperial household drink too much and go quiet when the Fairrush ice is mentioned. One of them crosses himself and mutters the old prophecy: an Ironside will fall into the water, and the empire with him.",
        dig: "Buy them another round and ask about the winter of 1081",
      }),
      secretEv({
        id: "rl_sec_floodmark",
        title: "The mason of Talim",
        ids: ["SEC-59"],
        cond: (p,C)=>C.realm(p,"POL-18")&&C.adult(p),
        intro: ()=>'An old mason at Talim, coughing his life away, shows you a loose stone in his wall. Behind it is a rolled rubbing of a flood mark from the Flood Stairs, from 1089. "Measure it," he says. "Then measure the stone they show you now."',
        dig: "Take the rubbing to the Flood Stairs and measure",
      }),
      secretEv({
        id: "rl_sec_boy",
        title: "Brother Pema's diary",
        ids: ["SEC-60"],
        cond: (p,C)=>C.realm(p,"POL-27")&&C.adult(p),
        intro: ()=>"Sweeping a monastery storeroom, you find an old search diary in a monk's hand, dated 1061, the year the reborn abbot was found as a child. Brother Pema snatches it from you, then looks at you a long time.",
        dig: "Ask Brother Pema what the diary says",
      }),
      secretEv({
        id: "rl_sec_calf",
        title: "The market roll of 1101",
        ids: ["SEC-68"],
        cond: (p,C)=>C.realm(p,"POL-30","POL-32")&&C.adult(p),
        // [X1 baked patch core/02-content-fixes EVT-TEXT-DIET] The text diet (event text <= 80 words, choices <= 12) had
        // three misses: two 13-word choices, and rl_sec_calf, whose 59-word intro plus the public story it pulls from the
        // lore rendered at about 83 words.
        intro: ()=>"A clerk in Amberport's harbor market is throwing out old rolls. One line: a pale elephant calf, sold in 1101 to a Ranpuri temple, paid in gold. The white elephant Moon-Pearl has no calf, people say, and Ranpur's dream ends when she dies. Or has she?",
        dig: "Find out who signed for the calf",
      }),
      secretEv({
        id: "rl_sec_dragonoil",
        title: "A stamped jar",
        ids: ["SEC-55","SEC-54","SEC-52"],
        cond: (p,C)=>C.realm(p,"POL-33","POL-24","POL-04","POL-03","POL-17")&&C.adult(p),
        intro: ()=>`A shoal pilot with burned hands shows you a clay jar in a sack, sealed with wax and stamped with a mark you half recognize. It smells of pitch and something sharper. "From Dragon Night," he says. "Somebody will pay a sultan's ransom for this."`,
        dig: "Find out whose stamp it is",
      }),
      secretEv({
        id: "rl_sec_needle",
        title: "Serra's proof",
        ids: ["SEC-58","SEC-01"],
        cond: (p,C)=>C.realm(p,"POL-02","POL-07")&&C.adult(p),
        intro: p=>p.realm==="POL-07"?"In the archive at Silverbough an archivist leaves a copy of a Solen astronomer's tables on the desk you are dusting, open at a page covered in eclipse dates.":"A Needle-Keeper novice weeps in a Solenne wine shop. He has been set to copy a sealed archive under the Needle court, and what he copied frightens him.",
        dig: "Ask what the numbers mean",
      }),
      secretEv({
        id: "rl_sec_tarn",
        title: "The Grey Mother's tale",
        ids: ["SEC-66","SEC-65"],
        cond: (p,C)=>C.realm(p,"POL-11","POL-01","POL-34")&&C.adult(p),
        intro: ()=>`An ancient Grey Mother at a horse fair talks about Tarn Halfblood, the half-orc raider who burned the tax barns on the Gordush. "Nameless raider's son?" She laughs without teeth. "I held the cord at that birth, child."`,
        dig: "Ask who held the father's hand",
      }),
      secretEv({
        id: "rl_sec_hulls",
        title: "Old hulls below Mount Dobava",
        ids: ["SEC-69"],
        cond: (p,C)=>C.realm(p,"POL-25","POL-14")&&C.adult(p),
        intro: ()=>"On the Sevina coast you see eight old hulls drawn up in a cove below Mount Dobava, under guard, with barrels of pitch and sulfur stacked beside them. Nobody fits pitch and sulfur to a ship they mean to sail home.",
        dig: "Get closer and listen to the guards",
      }),
      {
        id: "rl_sec_burden",
        title: "What you know",
        cond: (p,C)=>C.adult(p)&&knowsAny(p),
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{ctx.si=(p.flags.rl_secret||1)-1;const s=sec(ctx);ctx.secTitle=s?s.title:"the old secret"},
        text: (p,ctx)=>`What you know about "${ctx.secTitle}" sits in you like a stone. Tonight a ${A.pick(["well-dressed stranger","clerk with a sealed letter","smiling woman with cold eyes"])} sits down across from you in the tavern and says your name, and the name of the secret, softly.`,
        choices: [
          {
            t: "Sell it to them, and be done",
            check: {s:"trade",s2:"ins",d:39},
            win: {
              r: "Gold on the table, and the stone in your chest lighter. Whatever happens next is not on you. Mostly.",
              fx: p=>{const n=A.ri(40,120);return p.coin+=n,delete p.flags.rl_secret,`(+${n} suns)`},
            },
            lose: {
              r: "They take it for nothing and leave you a warning instead.",
              fx: {health:-10,happy:-5,unflag:"rl_secret",cause:"a warning from the shadows"},
            },
          },
          {
            t: "Tell them you know nothing",
            check: {s:"intrigue",s2:"wil",d:44},
            win: {
              r: "They watch you a long time, then pay for your drink and leave. You never see them again. You keep looking.",
              fx: {skill:{intrigue:3},wil:1},
            },
            lose: {
              r: "They do not believe you. You start sleeping with a knife.",
              fx: {newRel:{type:"enemy",op:-40},happy:-6,wil:1.5},
            },
          },
          {
            t: "Stand up in the tavern and tell everyone",
            r: (p,ctx)=>`The room goes quiet, then loud. ${secTruth(ctx)} ${secIfr(ctx)}`,
            fx: p=>(A.fame(p,5),p.honor=A.clamp(p.honor+3,0,100),p.health=Math.max(1,p.health-10),p.lastHurt="men who wanted silence",delete p.flags.rl_secret,"(The truth is out. Some powerful people will not forgive you.)"),
          },
        ],
      },
    ]);
    A.defEvents([
      {
        id: "rl_y_neck",
        title: "News from the Neck",
        cond: (p,C)=>early()&&C.realm(p,"POL-31","POL-02","POL-25","POL-16","POL-15")&&(C.adult(p)||C.teen(p)),
        w: 1.1,
        once: !0,
        text: p=>p.realm==="POL-31"?"Everyone on the Neck says it: Prince Andros will march on Tessar after 1 May. Queen Livia's hired men are owed a fortune; some say she keeps jars of dragon fire behind her walls. Others say envoys of both are talking partition at Ostra. Bread is dearer every week.":`Travelers from the Neck say Prince Andros will march on Tessar in spring, and that Queen Livia has something terrible in her cellars. ${p.realm==="POL-16"?"In Ostra they say the First Banker owns the debts of both claimants.":p.realm==="POL-25"?"In Velgrad they say the King pays Andros five thousand marks a year.":p.realm==="POL-02"?"In Solenne the Luminaries pray loudly for the Queen.":"In Morhaven they say the King sells to both sides."} Nobody knows anything for certain. Everyone is sure.`,
        choices: [
          {
            t: "Buy grain now, before it doubles (10 suns)",
            req: p=>p.coin>=10,
            check: {s:"trade",s2:"int",d:34},
            win: {
              r: "By summer bread is dear and you have a full bin. You sell a little at a good price.",
              fx: {coin:8,skill:{trade:2}},
            },
            lose: {r:"Prices fall instead, for a while. War is bad at keeping appointments.",fx:{coin:-6}},
          },
          {
            t: "Carry supplies to the camps for hire",
            check: {s:"sta",s2:"ins",d:41},
            win: {
              r: "Mules, mud, nervous soldiers and good pay. You see the war close up and come home with silver.",
              fx: {coin:25,wil:1,skill:{husbandry:2}},
            },
            lose: {
              r: "Unpaid soldiers take the mules and your boots.",
              fx: {health:-8,coin:-5,wil:1.5,cause:"robbery on the Neck Road"},
            },
          },
          {
            t: "Pray for the war to end",
            r: "In two churches, perhaps. On the Neck that is half the battle.",
            fx: {piety:3},
          },
        ],
      },
      {
        id: "rl_y_gordush",
        title: "The Gordush line",
        cond: (p,C)=>early()&&C.realm(p,"POL-01","POL-11","POL-13","POL-34")&&(C.adult(p)||C.teen(p)),
        w: 1.1,
        once: !0,
        text: p=>p.realm==="POL-01"?"Sixteen thousand Aldmark men hold the Gordush between Crossmarch and the fords, because War-Chief Vrag will not hand over Tarn Halfblood. Lord Harrow's March Hawks want to cross after May Fair; the Emperor wants quiet until the wedding. Carts of stakes and bolts creak south every day.":p.realm==="POL-11"?"Riders come back from the Gordush with news: sixteen thousand iron men on the far bank, and the war-chief will not give them Tarn Halfblood. Grass comes after May Fair, and then the clans can ride. At the Great Ride, Harkun the Drum-Master must judge the half-orc rider.":`News from the Gordush: Aldmark's iron men face the Horde across the river over one half-orc raider, Tarn Halfblood. ${p.realm==="POL-13"?"The Council votes in March on Aldmark's contract for four thousand Highland crossbows.":"Three clans of the east have sent riders west to see this Tarn for themselves."}`,
        choices: [
          {
            t: p=>p.realm==="POL-01"?"Hire on to carry stakes to Crossmarch":p.realm==="POL-13"?"Talk up the contract in the valley alehouse":"Ride west to see Tarn Halfblood for yourself",
            check: {s:"sta",s2:"diplomacy",d:38},
            win: {
              r: "You are part of the year's great story now, in a small way. Men remember who was there.",
              fx: {fame:2,coin:8,wil:.6},
            },
            lose: {
              r: "Mud, rain, waiting, and nothing to show for it but a cough.",
              fx: {health:-6,wil:1,cause:"a wet camp"},
            },
          },
          {
            t: "Volunteer for the fighting",
            req: (p,C)=>C.adult(p)&&!C.soldier(p)&&!C.unfree(p),
            r: "You put your mark down. Whatever comes after May Fair, you will be in it.",
            fx: p=>{const r=A.enlist(p,!1);return r&&r.ok?"":"The sergeants turn you away, for now."},
          },
          {
            t: "Keep your head down and plant your field",
            r: "Wars are for lords. Bread is for everyone. You plant.",
            fx: {skill:{husbandry:1}},
          },
        ],
      },
      {
        id: "rl_y_wedding",
        title: "The wedding of 21 June",
        cond: (p,C)=>early()&&C.realm(p,"POL-01","POL-05","POL-03","POL-14")&&C.ageAdj(p)>=10,
        w: 1,
        once: !0,
        text: p=>`Everyone talks of the wedding: Prince Harald of Aldmark is to wed Princess Rowena of Ashmere on 21 June, Return Day. ${p.realm==="POL-05"?"In the villages they argue whether it will be sworn on the iron ring or in the Temple way.":p.realm==="POL-03"?"In Varenna men mutter that the Lion cannot let two crowns become one on its northern border.":"Ribbon-sellers are already doing well."} And in every alehouse someone says: "Prince Harald gets the crown of Ashmere with his bride."`,
        choices: [
          {
            t: "Make and sell wedding ribbons",
            check: {s:"craft",s2:"trade",d:29},
            win: {
              r: "Black and gold, red and grey, iron rings stitched in thread. They sell faster than you can make them.",
              fx: {coin:14,skill:{craft:2,trade:1}},
            },
            lose: {r:"Everyone else had the same idea.",fx:{coin:-3}},
          },
          {
            t: "Ask around about the marriage contract",
            check: {s:"intrigue",s2:"int",d:49},
            win: {
              r: "A chancery clerk, drunk, says it: if Rowena bears no son, Ashmere goes to the Emperor. A hidden clause. You wish you had not asked.",
              fx: p=>{const S=SECS(),s=S.find(x=>x.id==="SEC-70");return s&&(p.flags["rl_k_"+s.id]=A.S.year,p.flags.rl_secret=S.indexOf(s)+1),A.trainSkill(p,"intrigue",3),""},
            },
            lose: {r:"Nobody who knows anything drinks where you drink.",fx:{}},
          },
          {
            t: "Drink to the couple and to peace",
            r: "Peace is worth a cup. You hope the couple are worth one too.",
            fx: {happy:3},
          },
        ],
      },
      {
        id: "rl_y_toll",
        title: "The dragon toll",
        cond: (p,C)=>early()&&C.realm(p,"POL-03","POL-04","POL-33","POL-15","POL-24","POL-17")&&(C.adult(p)||C.teen(p)),
        w: 1,
        once: !0,
        text: p=>p.realm==="POL-33"?"On the Reef they say Ima Redsail wants to vote Nell Brine out at Share Day and go back to open raiding, and that Varenna's Lion Fleet sails after Sea Opening. Half the Reef Crossbows are owed pay. The toll, one ship in forty, still comes in every week.":`In the harbor they curse the dragon toll: Blackreef takes one ship's worth in forty from everything that passes the Strait of Hael, behind a fire-dragon nobody has seen up close. ${p.realm==="POL-03"?"Now the Lion Fleet means to sail on the pirates after Sea Opening, and is hiring oarsmen.":"Men say the Lion Fleet of Varenna will sail against the Reef this year."}`,
        choices: [
          {
            t: "Sign on as an oarsman for the coming fight",
            req: (p,C)=>C.adult(p),
            check: {s:"sta",s2:"sea",d:41},
            win: {
              r: "Hard rowing and good pay. Whatever the fleet does, you come home with silver and shoulders.",
              fx: {coin:20,sta:.6,skill:{sea:3}},
            },
            lose: {
              r: "Blistered hands and a fever in the rowing benches. You are put ashore at the first port.",
              fx: {health:-10,wil:1,cause:"galley fever"},
            },
          },
          {
            t: "Say aloud that the dragon is only burning oil",
            check: {s:"diplomacy",s2:"wil",d:44},
            win: {
              r: "A few sailors nod slowly. They have seen the rafts. A dangerous kind of respect follows you.",
              fx: {fame:1,int:.4},
            },
            lose: {
              r: "They laugh, then stop laughing. On some docks that is not a safe thing to say.",
              fx: {health:-5,newRel:{type:"enemy",op:-20}},
            },
          },
          {
            t: "Put a little money into a cargo that will dodge the Strait",
            req: p=>p.coin>=15,
            check: {s:"trade",s2:"int",d:42},
            win: {r:"The long way round, and a fat profit at the end.",fx:{coin:25,skill:{trade:2}}},
            lose: {r:"The long way round has storms. The cargo does not come home.",fx:{coin:-15}},
          },
        ],
      },
      {
        id: "rl_y_blackdragon",
        title: "The Black Dragon of the channel",
        cond: (p,C)=>early()&&C.realm(p,"POL-14","POL-25","POL-26")&&C.ageAdj(p)>=10,
        w: 1,
        once: !0,
        text: p=>`Old sailors count on their fingers: the Black Dragon rose from the Grey Channel in 1037 and again in 1071. Thirty-four years. ${p.realm==="POL-14"?"This summer, they say. Fishermen will not go out at dusk.":p.realm==="POL-25"?"In Sevany, strangely, the King's men are buying old hulls, pitch and sulfur.":"In Drevna they say the channel kingdoms are about to have a very bad summer."}`,
        choices: [
          {
            t: "Laugh. Smoke and a waterspout",
            check: {s:"int",s2:"learning",d:36},
            win: {
              r: 'You find an old sailor who saw 1071. "A waterspout," he says. "Black as tar. I wrote a song about a dragon because it sold better."',
              fx: {int:.6,happy:2},
            },
            lose: {r:"Nobody laughs with you. They are frightened, and fear does not like jokes.",fx:{happy:-2}},
          },
          {
            t: "Sell dragon charms at the harbor",
            check: {s:"trade",s2:"diplomacy",d:32},
            win: {r:"Little iron rings and sea-glass eyes. They sell like hot bread.",fx:{coin:15,honor:-1}},
            lose: {r:"A priest calls them heathen trinkets and kicks over your tray.",fx:{coin:-3}},
          },
          {
            t: "Keep a lamp in the window and pray",
            r: "Half the coast does the same. The channel glitters with small brave lights.",
            fx: {piety:2},
          },
        ],
      },
      {
        id: "rl_y_twins",
        title: "The twin crowns",
        cond: (p,C)=>early()&&C.realm(p,"POL-22","POL-20","POL-18")&&(C.adult(p)||C.teen(p)),
        w: 1,
        once: !0,
        text: p=>`Runners bring news at the gallop: at dawn on New Year's Day, King Yared of Abara tore up his twin brother's road promise to Zanara. Eight thousand Abari pikes at Tamowa face Marshal Juma's fifteen thousand. ${p.realm==="POL-18"?"And King Yared demands Tamar's river gift in silver by 1 March, or he threatens the Source rite at the Monuti's headwaters.":p.realm==="POL-20"?"Zanari runners say the Emperor wants a gold road east, free of tolls.":"Your lord wears his border colors very carefully this month."}`,
        choices: [
          {
            t: "Drive cattle to sell to the camps",
            req: (p,C)=>C.adult(p),
            check: {s:"husbandry",s2:"trade",d:36},
            win: {
              r: "Armies are always hungry. You come back with gold and without cattle, which is the right way round.",
              fx: {coin:22,skill:{husbandry:2}},
            },
            lose: {r:"Foragers take half your herd and pay in promises.",fx:{coin:-8,wil:1}},
          },
          {
            t: "Hide your sons and brothers from the levy",
            check: {s:"stealth",s2:"int",d:34},
            win: {r:"The levy-men count empty huts. Your family stays whole this season.",fx:{happy:3,honor:-1}},
            lose: {r:"They are found. Your family pays a fine and they march anyway.",fx:{coin:-10,happy:-5}},
          },
          {
            t: "Pour a libation to the ancestors for peace",
            r: "You name your dead one by one. Whatever the kings do, your line will remember.",
            fx: {piety:3},
          },
        ],
      },
      {
        id: "rl_y_sabra",
        title: "Galleys against fire",
        cond: (p,C)=>early()&&C.realm(p,"POL-17","POL-24","POL-19","POL-32")&&(C.adult(p)||C.teen(p)),
        w: 1,
        once: !0,
        text: p=>p.realm==="POL-24"?"In Sabra they whisper that Qadir's Grand Admiral Jalal will sail on the emirate after 1 April with a fleet that has never faced fire-oil. The Emir wants no battle; his son Tahir wants to burn the Qadiri fleet first. Fire-boats are being tarred in every cove.":`In the bazaars they say Grand Admiral Jalal of Qadir will sail on Sabra after 1 April, while the Sultan lies sick with stones. ${p.realm==="POL-19"?"The Speaker has his own quarrel with Sabra over missing children.":p.realm==="POL-32"?"Amber Isles pilots are asked which side their sultan favors.":"Twelve of the galleys leak, say the shipwrights, but quietly."}`,
        choices: [
          {
            t: p=>p.realm==="POL-24"?"Help tar the fire-boats":"Sign on to row the galleys",
            req: (p,C)=>C.adult(p),
            check: {s:"sta",s2:"craft",d:40},
            win: {r:"Hard work, fair pay, and a seat close to history.",fx:{coin:15,sta:.4,skill:{sea:2}}},
            lose: {
              r: "A burn, a blister, a cough. History is mostly that.",
              fx: {health:-8,wil:1,cause:"work in the war-yards"},
            },
          },
          {
            t: "Ask a well-informed caravan broker what will really happen",
            check: {s:"diplomacy",s2:"intrigue",d:42},
            win: {
              r: '"A sealed letter offers peace, and a camel lord offers to kneel," she says. "Bet on nothing." Good advice, as it turns out.',
              fx: {skill:{intrigue:2},int:.4},
            },
            lose: {r:"She talks for an hour and tells you nothing at all.",fx:{}},
          },
          {
            t: "Pray at the well for the war to pass by",
            r: "The Book of Wells forbids blood feud within sight of a well. Perhaps the kings will remember.",
            fx: {piety:3},
          },
        ],
      },
      {
        id: "rl_y_evenwood",
        title: "The heir of the Evenwood",
        cond: (p,C)=>early()&&C.realm(p,"POL-06","POL-07","POL-01","POL-05")&&C.ageAdj(p)>=10,
        w: 1,
        once: !0,
        text: p=>`${p.realm==="POL-06"||p.realm==="POL-07"?"In the groves":"Along the forest edge"} everyone speaks of Queen Ithrien the Oakborn, 586 years old and with no heir the law allows. Her only grandchild is the half-elf Thalion Halfleaf, and the Moot of Leaves must vote at Leaf Fall on a law five thousand years old. The prophecy says that when the last Oakborn dies, the forest will burn.`,
        choices: [
          {
            t: p=>p.race==="elf"?"Speak at your grove for changing the law":p.race==="halfelf"?"Say aloud that a half-elf can carry a crown":"Say the elves should crown whoever they like",
            check: {s:"diplomacy",s2:"wil",d:42},
            win: {
              r: "Some agree. Some go silent. Either way, people remember you said it plainly.",
              fx: {fame:2,honor:2},
            },
            lose: {r:"The old ones look at you as if you had cut a living tree.",fx:{honor:-2,happy:-2}},
          },
          {
            t: "Ask what the prophecy really means",
            check: {s:"learning",s2:"int",d:39},
            win: {
              r: "A Chronicler tells you prophecies are beliefs, not facts. The forest burns when people burn it. That is all.",
              fx: {int:.6,skill:{learning:2}},
            },
            lose: {r:"You hear six different meanings from six different elves.",fx:{}},
          },
          {
            t: "Clear the brush around your home, just in case",
            r: "Practical. If the forest does burn, it will burn around you.",
            fx: {skill:{survival:2}},
          },
        ],
      },
      {
        id: "rl_y_abbot",
        title: "The dying abbot",
        cond: (p,C)=>early()&&C.realm(p,"POL-27","POL-29","POL-30","POL-26")&&C.ageAdj(p)>=10,
        w: 1,
        once: !0,
        text: p=>`Salt caravans bring news from the Roof of the World: Abbot Tashen, 13th of the White Stair, is coughing blood, and the Steward runs the daily rule. In the High Wastes the Red Stair's claimant Norbu waits, and says the search of 1061 found the wrong child. ${p.realm==="POL-29"?"And the Red Stair reveres the great dragons as sky-kings, which in Emberdeep is an awkward thing to hear.":"Some say the Steward is buying steel in the south for guards sworn never to kill."}`,
        choices: [
          {
            t: "Light a butter lamp for the abbot",
            r: "A little flame for an old man. Whatever the truth of the search, he is dying.",
            fx: {piety:3},
          },
          {
            t: "Ask a salt trader which Stair will win",
            check: {s:"diplomacy",s2:"trade",d:36},
            win: {
              r: '"Neither, if they fight," he says, "and salt goes up either way." You buy a little salt now.',
              fx: {coin:5,skill:{trade:2}},
            },
            lose: {r:"He shrugs. Traders love a mystery that raises prices.",fx:{}},
          },
          {
            t: "Offer to guard a salt caravan in these uncertain months",
            req: (p,C)=>C.adult(p),
            check: {s:"ins",s2:"sta",d:41},
            win: {r:"Thin air, yaks, a quiet road. Good pay for nothing happening.",fx:{coin:18,sta:.4}},
            lose: {r:"Altitude sickness. They carry you down on a yak.",fx:{health:-10,cause:"altitude sickness"}},
          },
        ],
      },
      {
        id: "rl_y_things",
        title: "The giants' Things",
        cond: (p,C)=>early()&&C.realm(p,"POL-09","POL-23","POL-08","POL-26")&&C.ageAdj(p)>=10,
        w: 1,
        once: !0,
        text: p=>`${p.realm==="POL-08"?"In Wolfhaven":p.realm==="POL-26"?"On the Whale Coast at Dobin":"In the halls"} everyone talks of the giants. Hrimfell chooses a king at its Thing at Midsummer, and Mother Asta will name only Ulfar, whose knees are already going. Frostholm's Thing in 1106 could end the Tin Compact. And somewhere a dead Frost Leviathan was found with a harpoon of Drevnan iron in its back.`,
        choices: [
          {
            t: p=>p.realm==="POL-08"?"Talk tin with the Tin Reeves' clerks":p.realm==="POL-26"?"Ask the whalers about the leviathan":"Ask your eldest what the Mother wants",
            check: {s:"diplomacy",s2:"int",d:38},
            win: {
              r: "You learn more than most: who is angry, who is afraid, and who is buying. In the cold north that is wealth.",
              fx: {skill:{intrigue:2,diplomacy:1},int:.4},
            },
            lose: {r:"Northern people answer questions with silence. You get a great deal of silence.",fx:{}},
          },
          {
            t: "Lay in salt fish and seal oil against a hard year",
            req: p=>p.coin>=8,
            r: "If the truce breaks, you will eat. If it does not, you will eat anyway.",
            fx: {coin:-8,happy:2},
          },
          {
            t: "Shrug. Giants decide slowly",
            r: "They do. A giant can take a whole winter to finish a sentence.",
            fx: {},
          },
        ],
      },
    ]);
    const castText = lead=>(p,ctx)=>{const a=`${lead(p,ctx)} {cName}. ${ctx.cLooks}`,b=ctx.cManner;return b&&(a.replace("{cName}",ctx.cName||"")+" "+b).split(/\s+/).length>80?a:`${a} ${b}`};
    A.defEvents([
      {
        id: "rl_cast_fighter",
        title: "A famous blade",
        cond: (p,C)=>(C.adult(p)||C.teen(p))&&!C.old(p)&&castOf(p,["fighter","general"]).length>0,
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{meetCast(p,ctx,["fighter","general"])},
        text: castText(p=>`In the practice yard at ${capOf(p)} the crowd parts for a fighter whose name everyone in ${rs(p)} knows:`),
        choices: [
          {
            t: "Ask {them} to teach you",
            check: {s:"diplomacy",s2:"wil",d:44},
            win: {
              r: '{them} looks you over and grunts. "Dawn. Every day. Do not be late." You never are.',
              fx: {them:{type:"mentor",op:30},skill:{sword:4,shield:2},ins:.6},
            },
            lose: {
              r: "{them} does not even break stride. Famous people get asked that a lot.",
              fx: {them:{type:"acquaint",op:-3}},
            },
          },
          {
            t: "Challenge {them} to a friendly bout",
            r: "A ring forms. You will remember this either way.",
            fx: {
              them: {type:"rival",op:5},
              duel: {
                foe: "them",
                opts: {kind:"duel",place:"the practice yard",lethal:!1,toYield:!0,title:"A bout with a famous blade"},
              },
            },
          },
          {
            t: "Buy {them} a drink and listen to war stories",
            r: "Ale and old campaigns until the lamps gutter. You learn more about real fighting in one night than in a year of drills.",
            fx: {them:{type:"friend",op:20},skill:{tactics:2},coin:-2},
          },
        ],
      },
      {
        id: "rl_cast_merchant",
        title: "A merchant of note",
        cond: (p,C)=>C.adult(p)&&castOf(p,["merchant"]).length>0,
        w: .9,
        cool: 8,
        setup: (p,ctx)=>{meetCast(p,ctx,["merchant"])},
        text: castText(()=>"At the market a great merchant is looking for a reliable pair of hands for a venture:"),
        choices: [
          {
            t: "Put 20 suns into the venture",
            req: p=>p.coin>=20,
            check: {s:"trade",s2:"int",d:39},
            win: {
              r: `{them} pays out at year's end with a nod: "You have a nose for it." Fifty suns back, and a friend in trade.`,
              fx: {coin:30,them:{type:"friend",op:25},skill:{trade:3}},
            },
            lose: {
              r: 'The cargo is lost. {them} shrugs: "Trade is weather." Your twenty suns are weather now.',
              fx: {coin:-20,them:{type:"acquaint",op:5}},
            },
          },
          {
            t: "Work for {them} as a clerk for a season",
            r: "{them} teaches you bills, weights and how to smile at a liar. You go home with 12 suns and a patron.",
            fx: {coin:12,them:{type:"mentor",op:20},skill:{trade:3,stewardship:2}},
          },
          {
            t: "Undercut {them} on the next deal",
            check: {s:"trade",s2:"intrigue",d:49},
            win: {
              r: "You beat {them} to a cargo by a day. {them} laughs, and never forgets.",
              fx: {coin:25,them:{type:"rival",op:-15}},
            },
            lose: {
              r: "{them} sees you coming a mile off and ruins you in the market for a month.",
              fx: {coin:-10,them:{type:"rival",op:-20}},
            },
          },
        ],
      },
      {
        id: "rl_cast_priest",
        title: "A voice of the faith",
        cond: (p,C)=>C.ageAdj(p)>=12&&castOf(p,["priest","scholar"]).length>0,
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{meetCast(p,ctx,["priest","scholar"])},
        text: castText(()=>"Sheltering from the rain in a holy place, you find yourself beside someone the whole realm has heard of:"),
        choices: [
          {
            t: "Ask {them} the question that keeps you awake",
            check: {s:"int",s2:"faith",d:36},
            win: {
              r: "{them} answers with a question of their own, and then another. By dawn you have no answer but a teacher.",
              fx: {them:{type:"mentor",op:25},skill:{learning:3,faith:2},int:.5},
            },
            lose: {
              r: "{them} answers kindly and briefly. You walk away feeling small.",
              fx: {them:{type:"acquaint",op:5},piety:1},
            },
          },
          {
            t: "Argue with {them}",
            check: {s:"learning",s2:"wil",d:49},
            win: {
              r: '{them} laughs aloud. "Come back and argue again." You do, for years.',
              fx: {them:{type:"friend",op:20},skill:{learning:3}},
            },
            lose: {
              r: "{them} takes your argument apart like a cook boning a fish.",
              fx: {them:{type:"rival",op:-10},wil:1},
            },
          },
          {
            t: "Simply ask for a blessing",
            r: "{them} lays a hand on your head. Whatever you believe, it feels like being seen.",
            fx: {piety:4,them:{type:"acquaint",op:10}},
          },
        ],
      },
      {
        id: "rl_cast_spy",
        title: "A quiet offer",
        cond: (p,C)=>C.adult(p)&&castOf(p,["spy"]).length>0,
        w: .7,
        cool: 10,
        setup: (p,ctx)=>{meetCast(p,ctx,["spy"])},
        text: castText(()=>"Someone sits down at your table without asking. You have heard the name whispered, never said aloud:"),
        choices: [
          {
            t: "Agree to watch a neighbor for {them}",
            check: {s:"intrigue",s2:"ins",d:42},
            win: {
              r: "A season of listening, and a purse at the end. {them} says you have a gift. That is not entirely a compliment.",
              fx: {coin:20,skill:{intrigue:4,stealth:2},them:{type:"mentor",op:20}},
            },
            lose: {
              r: "Your neighbor notices you noticing. {them} is not pleased with clumsy tools.",
              fx: {them:{type:"acquaint",op:-15},newRel:{type:"enemy",op:-20}},
            },
          },
          {
            t: "Ask {them} what is really going on in the realm",
            check: {s:"diplomacy",s2:"int",d:49},
            win: {
              r: "{them} tells you a little, which from a spy is a fortune, and decides you are worth knowing.",
              fx: {them:{type:"friend",op:15},int:.5,skill:{intrigue:2}},
            },
            lose: {r:"{them} smiles and tells you about the weather for an hour.",fx:{}},
          },
          {
            t: "Refuse and leave",
            r: "{them} lets you go. Spies always let you go. They also always remember.",
            fx: {them:{type:"acquaint",op:-5}},
          },
        ],
      },
      {
        id: "rl_cast_outlaw",
        title: "A wanted name",
        cond: (p,C)=>C.adult(p)&&castOf(p,["criminal","rebel"]).length>0,
        w: .7,
        cool: 10,
        setup: (p,ctx)=>{meetCast(p,ctx,["criminal","rebel"])},
        text: castText(()=>"Late at night someone knocks at your door, soaked and hunted. You know the face from the criers' descriptions:"),
        choices: [
          {
            t: "Hide {them} for the night",
            check: {s:"stealth",s2:"ins",d:39},
            win: {
              r: 'The searchers pass. At dawn {them} grips your arm: "I owe you." People like that pay their debts in strange coin.',
              fx: {them:{type:"friend",op:35},honor:2},
            },
            lose: {
              r: "The searchers do not pass.",
              fx: {them:{type:"friend",op:20},prison:1,why:"sheltering a wanted outlaw"},
            },
          },
          {
            t: "Turn {them} over to the watch",
            r: "A reward of 20 suns. {them} looks back at you once as they drag them off. Some looks last a lifetime.",
            fx: {coin:20,favor:3,them:{type:"enemy",op:-50}},
          },
          {
            t: "Give {them} bread and send them on",
            r: "{them} takes it without a word and goes into the dark.",
            fx: {them:{type:"acquaint",op:10}},
          },
        ],
      },
      {
        id: "rl_cast_hunter",
        title: "A hunter of the wilds",
        cond: (p,C)=>C.adult(p)&&!C.old(p)&&castOf(p,["hunter"]).length>0,
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{meetCast(p,ctx,["hunter"])},
        text: castText(()=>"At the edge of the wilds you share a fire with a hunter whose name is told in songs:"),
        choices: [
          {
            t: "Ask to go out with {them} at dawn",
            check: {s:"survival",s2:"sta",d:39},
            win: {
              r: 'You keep up, barely. {them} shows you how to read a track by its edges. "Again tomorrow?"',
              fx: {them:{type:"mentor",op:25},skill:{survival:4,bow:2}},
            },
            lose: {
              r: "You crack every twig in the forest. {them} sends you back to the fire.",
              fx: {them:{type:"acquaint",op:0},skill:{survival:1}},
            },
          },
          {
            t: "Trade stories through the night",
            r: "Beasts, weather, the creatures people believe in and the ones that are real. {them} knows the difference.",
            fx: {them:{type:"friend",op:20},int:.4},
          },
          {
            t: "Ask {them} to sell you a pelt (10 suns)",
            req: p=>p.coin>=10,
            r: "A fine pelt, and a fair price. In town it is worth double.",
            fx: {coin:10,them:{type:"acquaint",op:5}},
          },
        ],
      },
      {
        id: "rl_cast_noble",
        title: "A great one passes",
        cond: (p,C)=>C.adult(p)&&castOf(p,["noble","general","royal"]).length>0,
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{meetCast(p,ctx,["noble","general","royal"])},
        text: castText(()=>"A great lord's party is held up on the road by a broken axle, right outside your door. Among them is someone whose name is spoken in every hall of the realm:"),
        choices: [
          {
            t: "Mend the axle yourself",
            check: {s:"craft",s2:"str",d:34},
            win: {
              r: "{them} watches you work and asks your name, and writes it down. A patron is a ladder in a world of walls.",
              fx: {them:{type:"friend",op:25},coin:5,fame:1},
            },
            lose: {
              r: "You make it worse. {them} sighs and waits for a proper wheelwright.",
              fx: {them:{type:"acquaint",op:-5}},
            },
          },
          {
            t: "Offer food and your best stool",
            r: "{them} eats your bread with real courtesy. Afterwards your neighbors treat you a little differently.",
            fx: {them:{type:"acquaint",op:15},honor:2},
          },
          {
            t: "Ask {them} for a place in their household",
            check: {s:"diplomacy",s2:"int",d:49},
            win: {
              r: '"Come to me in spring," says {them}. You do, and a door opens.',
              fx: {them:{type:"mentor",op:25},skill:{diplomacy:3},favor:2},
            },
            lose: {r:"{them} smiles politely. The guards smile less politely.",fx:{happy:-2}},
          },
        ],
      },
      {
        id: "rl_cast_commoner",
        title: "An ordinary person",
        cond: (p,C)=>C.ageAdj(p)>=12&&castOf(p,["commoner"]).length>0,
        w: .8,
        cool: 10,
        setup: (p,ctx)=>{meetCast(p,ctx,["commoner"])},
        text: (p,ctx)=>`At the well you fall into talk with {cName}. Ordinary people have extraordinary stories, and this one tells you: ${ctx.cWantsLine}`,
        more: (p,ctx)=>`${ctx.cLooks} ${ctx.cManner}`,
        choices: [
          {
            t: "Offer to help",
            check: {s:"diplomacy",s2:"wil",d:34},
            win: {
              r: "It takes a season, and it is not your trouble, and you help anyway. {them} becomes the kind of friend who would carry your coffin.",
              fx: {them:{type:"friend",op:35},honor:3,wil:.6},
            },
            lose: {
              r: "You try and it goes badly. {them} thanks you all the same.",
              fx: {them:{type:"friend",op:15},wil:.6},
            },
          },
          {
            t: "Just listen",
            r: "Sometimes listening is all anyone needs. {them} walks away a little lighter.",
            fx: {them:{type:"acquaint",op:15}},
          },
          {
            t: "Tell {them} it is hopeless",
            r: "{them} goes quiet and walks away. You were probably right. You feel bad anyway.",
            fx: {them:{type:"acquaint",op:-10},trait:"cynical"},
          },
        ],
      },
    ]);
  })();
})();
