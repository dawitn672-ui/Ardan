// The release's event pack 27 of 30 (23 events, mostly gs_). Readable source of
// vendor/ardan-b593143.html with the patch layer baked in (X1, D-028). Every function is kept exactly as the release
// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.
(function(){
  const G = ctx=>A.gathById(ctx.gid),
    ROLE = ctx=>{const g=G(ctx);return g&&g.pc?g.pc.role:null},
    isR = (...rs)=>(p,C,ctx)=>rs.includes(ROLE(ctx||{})),
    inf = (ctx,d)=>{const g=G(ctx);g&&g.pc&&(g.pc.inf=(g.pc.inf||0)+d)},
    myRid = p=>p.ruler||p.realm,
    foreign = (p,ctx)=>{const g=G(ctx);if(!g)return;const L=A.gathAttendees(g).filter(x=>x!==myRid(p));ctx.rid=L.length?A.pick(L):g.host},
    npc = (p,ctx,occ,st)=>{const n=A.makeAcquaintance(p,"acquaint");return n.occ=occ,st&&(n.status=st),G(ctx)&&ctx.rid&&(n.realm=ctx.rid),ctx.pid=n.id,n},
    scene = ctx=>{const g=G(ctx);return g?A.gathName(g):"the gathering"};
  // [X1 baked patch events/97-first-life-fixes LF-GATH-SCENES] A gathering picks its scenes (the toast, the seating,
  // the knife in the dark) from a pool that only avoids repeats within the one gathering, so a courtier saw the same
  // seating quarrel at feast after feast. The pick now also weighs each scene by the life memory (A.lfSceneW: a
  // fifth for each time this life has seen it).
  // [X1 baked patch events/97-first-life-fixes LF-GATH-CAP] A ruler hosts and attends a gathering most years, and
  // each shows three of its scenes, so a 37-year reign showed the toast, the seating quarrel, the knife in the crowd
  // and the gift about 15 times each, and the closed-door bargain 26 times. A gathering scene the life has seen
  // three times now gives way to an unseen one or to none (A.lfGathPool, in the pick above), and the bargain, once
  // seen three times, is settled by the envoys off stage with a line in the log (A.lfGathBargain): the same
  // influence a fair speech wins.
  // [X1 baked patch events/97-first-life-fixes LF-GATH-WANT] Every gathering showed two or three of its scenes,
  // however many the life had been to. Once the player has been through a gathering's last night before, a later one
  // shows one scene fewer (A.lfGathWant, never fewer than one); a knight's jousts are their own sequence and are not
  // cut.
  A.gNext=function(ctx){const g=G(ctx),q=A.S.queue[0];if(!g||!g.pc||!q)return;const role=g.pc.role;if(g.pc.sc=(g.pc.sc||0)+1,ctx.joust){q.after=ctx.joust;return}const want=(A.lfGathWant||(x=>x))(role==="knight"?2:role==="ruler"||role==="envoy"?3:2);if(g.pc.sc>want){q.after="ga_close";return}if((role==="ruler"||role==="envoy")&&g.pc.aim&&["ally","def","trade","nap","isolate","guarantees"].includes(g.pc.aim.k)&&!g.pc.seen.includes("gs_bargain")&&!(A.lfGathBargain&&A.lfGathBargain(g))){g.pc.seen.push("gs_bargain"),q.after="gs_bargain";return}const pool=Object.values(A.EV).filter(e2=>e2.gscene&&e2.gscene.roles.includes(role)&&(!e2.gscene.kinds||e2.gscene.kinds.includes(g.kind))&&!g.pc.seen.includes(e2.id)&&(!e2.gscene.ok||e2.gscene.ok(A.pc(),g))),e=A.wpick(A.lfGathPool?A.lfGathPool(pool,g):pool,x=>(x.gscene.kinds?3:1)*(A.lfSceneW?A.lfSceneW(x):1));if(!e){q.after="ga_close";return}g.pc.seen.push(e.id),q.after=e.id};
  const next=(p,ctx)=>A.gNext(ctx),needG=setup=>(p,ctx)=>{if(!G(ctx)){ctx.skip=1;return}setup&&setup(p,ctx)};
  A.defEvents([
    {
      id: "ga_invite",
      trigger: !0,
      title: (p,ctx)=>{const g=G(ctx);return g?A.cap(A.gathName(g)):"An invitation"},
      setup: needG((p,ctx)=>{const g=G(ctx);if(!g){ctx.skip=1;return}ctx.when=A.dateStr(g.at%365,Math.floor(g.at/365)),ctx.who=g.guests.slice(0,5).map(A.realmShort).join(", ")||"the great of the realm",ctx.place=A.realm(g.host)?A.realm(g.host).capital:"the capital"}),
      text: (p,ctx)=>{const g=G(ctx);if(!g)return"";const role=g.pc.role,K=A.GATHER[g.kind],head=`${A.cap(A.gathName(g))} will be held on {when}. ${K.desc} Expected: {who}.`;return role==="ruler"?g.host===p.ruler?`${head} You are the host. Your stewards are already counting the wine.`:`${head} A herald brings the invitation to your hall, sealed in ${A.realmShort(g.host)}'s colors. A crown that does not come is noticed.`:role==="envoy"?`${head} The crown sends you to speak for ${A.realmShort(myRid(p))}. Whatever is signed there, your name will be on the copy.`:role==="knight"?`${head} The heralds are crying the tournament in every market: a purse of gold, and the eyes of every court in the north. Knights and men-at-arms of good name may enter the lists.`:role==="noble"?`${head} Your family is invited. A gathering like this is where marriages are made, patrons are found and enemies are measured.`:role==="guard"?`${head} Your company is posted to the hall for the whole of it. Every crown in the room will walk past your spear.`:`${head} The household will work day and night. You will be in the hall, carrying, pouring — and hearing things.`},
      choices: [
        {
          t: "Go",
          req: isR("ruler","envoy","knight","noble"),
          r: (p,ctx)=>{const g=G(ctx);return g&&g.pc&&(g.pc.accepted=!0),A.S.time=Math.max(0,(A.S.time||0)-1),"You will be there."},
        },
        {
          t: "Send regrets",
          req: isR("ruler","noble","knight","envoy"),
          r: (p,ctx)=>{const g=G(ctx);return g&&g.pc&&(g.pc.accepted=!1),g&&p.ruler&&g.host!==p.ruler&&A.remember(g.host,p.ruler,"snub",-5),"Your regrets are sent. Somebody will be sitting in your chair."},
        },
        {t:"Very well",req:isR("guard","servant"),r:"You will be there whether you like it or not."},
      ],
    },
    {
      id: "ga_open",
      trigger: !0,
      title: (p,ctx)=>{const g=G(ctx);return g?A.cap(A.gathName(g)):"The gathering"},
      setup: needG((p,ctx)=>{const g=G(ctx);if(!g){ctx.skip=1;return}ctx.aims=["ruler","envoy"].includes(g.pc.role)?A.gathAims(p,g):[],ctx.who=A.gathAttendees(g).map(A.realmShort).join(", "),ctx.role=A.ROLE_NAME[g.pc.role]}),
      // [X1 baked patch events/99999-v2-content V2C-TOURNEY-LANCE] ga_open gives every tournament entrant of the
      // "knight" role "Your horse is groomed and your lance is new", and the role also goes to any soldier of rank 2 or
      // more: an orc crossbowman with no lance to speak of was told of his lance and groomed horse (playtest 2, old
      // #11). The line is for one who rides with a lance (the role's own tests: a knight's post, lance and riding 30, a
      // lord's rung); a soldier comes in his company's colours.
      text: (p,ctx)=>{const g=G(ctx);if(!g)return"";const sights={summit:"Long tables, maps under glass, clerks with inkhorns behind every chair.",wedding:"Garlands on every beam, a choir in the gallery, and the bride's family counting the guests' gifts.",coronation:"Banners of every house in the realm, a crown on a cushion, and the old guard watching the new.",congress:"Black armbands, empty chairs for the dead, and maps with new borders already drawn in pencil.",tournament:"Lists of sand and timber, pavilions in every color, and the smell of horses and frying meat.",council:"Grim faces and a single map with one realm colored red."}[g.kind],lead={ruler:"Every eye turns when you enter. What do you want to carry home?",envoy:"You carry your crown's seal and your crown's orders. What will you press for?",knight:p.job&&p.job.c==="knight"||A.skill(p,"lance")>=30&&A.skill(p,"riding")>=30||p.noble&&p.noble.rung>=2?"Your horse is groomed and your lance is new. The heralds are calling the order of the lists.":"You have come in your company's colours, with the weapons you know. The heralds are calling the order of the lists.",noble:"You are here as {role}. The room is full of people who could change your life.",guard:"Your post is the east door of the great hall. The whole world walks past it.",servant:"Down in the kitchens the fires have been burning since before dawn."}[g.pc.role];return`${sights} Present: {who}. ${lead}`},
      choices: [0,1,2,3].map(i=>({t:(p,ctx)=>ctx.aims&&ctx.aims[i]?ctx.aims[i].n:"",req:(p,C,ctx)=>!!(ctx&&ctx.aims&&ctx.aims[i]),r:"You make your purpose known to those who matter.",fx:(p,ctx)=>{const g=G(ctx);g&&g.pc&&(g.pc.aim=ctx.aims[i]),next(p,ctx)}})).concat([
        {
          t: "Enter the lists",
          req: isR("knight"),
          r: "Your name goes up on the board: a herald cries it twice.",
          fx: (p,ctx)=>{ctx.joust="gs_joust1",next(p,ctx)},
        },
        {
          t: "Work the room",
          req: isR("noble"),
          check: {s:"etiquette",s2:"persuasion",d:40},
          win: {
            r: "You glide from group to group with the right word for each. Doors open.",
            fx: (p,ctx)=>{inf(ctx,5),A.fame(p,1),next(p,ctx)},
          },
          lose: {
            r: "You say the wrong thing to the wrong duchess. People drift away.",
            fx: (p,ctx)=>{inf(ctx,-2),next(p,ctx)},
          },
        },
        {
          t: "Keep to your own and watch",
          req: isR("noble","knight"),
          r: "You watch. Watching teaches.",
          fx: (p,ctx)=>{A.trainSkill(p,"intrigue",1),next(p,ctx)},
        },
        {t:"To your post",req:isR("guard","servant"),r:"You go where you are told.",fx:next},
      ]),
    },
    {
      id: "ga_close",
      trigger: !0,
      setup: needG(null),
      title: "The last night",
      text: (p,ctx)=>{const g=G(ctx);return g?{summit:"The clerks sand the last copies. Seals are pressed into hot wax, one after another.",wedding:"The couple are bedded with ribald songs; the guests are left with the wine and their bargains.",coronation:"The new crown has been worn for a day. The guests know what they think of it now.",congress:"The dead are counted, the borders are signed, and the survivors go home.",tournament:"The lists are raked, the pavilions come down, and the champion's name is already a song.",council:"They leave with their hands on their swords and their eyes on one map."}[g.kind]:""},
      choices: [
        {
          t: "Go home",
          r: (p,ctx)=>{const g=G(ctx);if(!g||!g.pc)return"You go home.";const L=A.gathClose(p,g);return L.length?"What you carry home: "+L.join("; ")+".":"You go home with stories, at least."},
        },
      ],
    },
    {
      id: "gs_bargain",
      trigger: !0,
      gscene: {roles:[]},
      title: "Behind closed doors",
      setup: needG((p,ctx)=>{const g=G(ctx),a=g&&g.pc.aim;ctx.rid=a&&a.t?a.t:g?g.host:null,ctx.aimName=a?a.n.toLowerCase():"your business"}),
      text: "A small room, a small fire, three chairs. The envoys of {other} listen to you ask for {aimName}. They do not say no. They are waiting to hear what it is worth to you.",
      choices: [
        {
          t: "Speak to their interests — a common enemy, a common gain",
          check: {s:"diplomacy",s2:"int",d:45,bonus:p=>p.ruler?6:0},
          win: {
            r: "You draw it for them on the table: their danger, your strength, one road. They nod slowly.",
            fx: (p,ctx)=>{inf(ctx,12),A.trainSkill(p,"diplomacy",2),next(p,ctx)},
          },
          lose: {r:"They have heard this speech before, from better speakers.",fx:(p,ctx)=>{inf(ctx,1),next(p,ctx)}},
        },
        {
          t: "Offer gold to sweeten it",
          req: p=>{const r=A.realm(myRid(p));return!!r&&r.treasury>2e3},
          r: "A chest is carried in. Their faces soften by exactly its weight.",
          fx: (p,ctx)=>{const r=A.realm(myRid(p));r.treasury-=1500,inf(ctx,14),next(p,ctx)},
        },
        {
          t: "Remind them how strong you are",
          check: {
            s: "intimidation",
            s2: "wil",
            d: 50,
            bonus: p=>{const r=A.realm(myRid(p));return r?Math.min(15,A.realmPower(r)/2e4):0},
          },
          win: {
            r: "They look at each other. Nobody wants to be on the wrong side of that.",
            fx: (p,ctx)=>{inf(ctx,10),A.remember(ctx.rid,myRid(p),"insult",-3),next(p,ctx)},
          },
          lose: {
            r: 'Their eldest smiles thinly. "We are not a village to be bullied." The room cools.',
            fx: (p,ctx)=>{inf(ctx,-8),A.remember(ctx.rid,myRid(p),"insult",-8),next(p,ctx)},
          },
        },
        {
          t: "Promise a favor later",
          r: "A promise costs nothing today. They write it down.",
          fx: (p,ctx)=>{inf(ctx,6),A.remember(myRid(p),ctx.rid,"gift",2),next(p,ctx)},
        },
      ],
    },
    {
      id: "gs_seating",
      trigger: !0,
      gscene: {roles:["ruler","envoy","noble"]},
      title: "Below the salt",
      setup: needG(foreign),
      text: "At the high table, the steward seats the envoy of {other} above you. The whole hall sees it. It is either a mistake or a message.",
      choices: [
        {
          t: "Protest — politely, publicly",
          check: {s:"etiquette",s2:"diplomacy",d:45},
          win: {
            r: "The steward goes pale, apologizes, and moves you up. The hall has learned something about you.",
            fx: (p,ctx)=>{inf(ctx,6),A.fame(p,1),next(p,ctx)},
          },
          lose: {
            r: "Your protest sounds like a whine. {other}'s envoy smiles into his cup.",
            fx: (p,ctx)=>{inf(ctx,-4),next(p,ctx)},
          },
        },
        {
          t: "Accept it with grace",
          r: "You sit where you are put and charm everyone around you. Some notice the grace more than the slight.",
          fx: (p,ctx)=>{inf(ctx,3),A.trainSkill(p,"etiquette",1),next(p,ctx)},
        },
        {
          t: "Remember it",
          r: "You smile and say nothing. Your crown will remember.",
          fx: (p,ctx)=>{A.remember(myRid(p),ctx.rid,"snub",-6),next(p,ctx)},
        },
      ],
    },
    {
      id: "gs_whisper",
      trigger: !0,
      gscene: {roles:["ruler","envoy"],ok:(p,g)=>A.gathAttendees(g).length>=3},
      title: "A word in the garden",
      setup: needG((p,ctx)=>{foreign(p,ctx);const g=G(ctx),L=g?A.gathAttendees(g).filter(x=>x!==ctx.rid&&x!==myRid(p)):[];ctx.vid=L.length?A.pick(L):null,ctx.victim=ctx.vid?A.realmShort(ctx.vid):"a neighbor"}),
      text: 'In the rose garden, the envoy of {other} falls into step beside you. "Between us," he says, "{victim} is weaker than it looks. If it were attacked in the spring, would your crown stand aside? There could be something in it for you."',
      choices: [
        {
          t: "Agree, quietly",
          r: "You shake hands where nobody can see. A secret understanding.",
          fx: (p,ctx)=>{A.remember(ctx.rid,myRid(p),"summit",10),ctx.vid&&A.remember(myRid(p),ctx.vid,"snub",-4),inf(ctx,3),A.chance(.25)&&ctx.vid&&(A.remember(ctx.vid,myRid(p),"betrayal",-15),A.log(`Someone saw you in the rose garden. ${ctx.victim} knows what was said.`,"bad")),next(p,ctx)},
        },
        {
          t: "Warn {victim}",
          r: "{victim}'s envoy thanks you with tears in his eyes. {other}'s envoy will not look at you again.",
          fx: (p,ctx)=>{ctx.vid&&A.remember(ctx.vid,myRid(p),"aid",15),A.remember(ctx.rid,myRid(p),"insult",-12),inf(ctx,2),next(p,ctx)},
        },
        {t:"Say you heard nothing",r:'"Roses," you say, "are lovely this year." He takes the hint.',fx:next},
      ],
    },
    {
      id: "gs_gift",
      trigger: !0,
      gscene: {roles:["ruler","envoy"]},
      title: "The exchange of gifts",
      setup: needG(foreign),
      text: "Gifts are given in the great hall, one crown after another, while the heralds call out what each is worth. {other} gives a pair of white horses. It is your turn.",
      choices: [
        {
          t: "Something lavish (2,000)",
          req: p=>{const r=A.realm(myRid(p));return!!r&&r.treasury>2500},
          r: "A golden cup set with river pearls. The hall gasps, which is the point.",
          fx: (p,ctx)=>{const r=A.realm(myRid(p));r.treasury-=2e3,inf(ctx,8);for(const x of A.gathAttendees(G(ctx)))x!==r.id&&A.remember(x,r.id,"gift",4);next(p,ctx)},
        },
        {
          t: "Something clever",
          check: {s:"learning",s2:"int",d:45},
          win: {
            r: "An old map of their own realm, older than any they own. Their ruler is enchanted. The gift is talked about all night.",
            fx: (p,ctx)=>{inf(ctx,9),A.remember(ctx.rid,myRid(p),"gift",8),next(p,ctx)},
          },
          lose: {
            r: "A book of poems, in a tongue nobody reads. Polite applause.",
            fx: (p,ctx)=>{inf(ctx,1),next(p,ctx)},
          },
        },
        {t:"Something modest",r:"A good sword, honestly made. Nobody remembers it.",fx:next},
      ],
    },
    {
      id: "gs_spy",
      trigger: !0,
      gscene: {roles:["ruler","envoy"]},
      title: "Your man in their tent",
      setup: needG(foreign),
      text: "The guards of {other} drag in a man caught going through their envoy's papers. He is one of yours. He looks at you, and so does the whole room.",
      choices: [
        {
          t: "Disown him",
          r: "You have never seen him before. He hangs at dawn. {other} half-believes you.",
          fx: (p,ctx)=>{inf(ctx,-2),p.honor=Math.max(0,p.honor-4),A.remember(ctx.rid,myRid(p),"spies",-6),next(p,ctx)},
        },
        {
          t: "Bargain for his life",
          check: {s:"diplomacy",s2:"deception",d:50},
          win: {
            r: "A trade: your man for a concession on a minor clause. Everyone saves face.",
            fx: (p,ctx)=>{inf(ctx,-1),next(p,ctx)},
          },
          lose: {
            r: "The bargaining is an admission. {other} is furious.",
            fx: (p,ctx)=>{inf(ctx,-8),A.remember(ctx.rid,myRid(p),"spies",-14),next(p,ctx)},
          },
        },
        {
          t: `Laugh it off — "doesn't everyone?"`,
          check: {s:"persuasion",d:50},
          win: {
            r: "The room laughs. Everyone has a man in someone's tent. The moment passes.",
            fx: (p,ctx)=>{inf(ctx,3),next(p,ctx)},
          },
          lose: {r:"Nobody laughs.",fx:(p,ctx)=>{inf(ctx,-6),A.remember(ctx.rid,myRid(p),"spies",-10),next(p,ctx)}},
        },
      ],
    },
    {
      id: "gs_terms",
      trigger: !0,
      gscene: {roles:["ruler","envoy"],kinds:["congress"]},
      title: "Dividing the peace",
      setup: needG(foreign),
      text: "The congress argues over the small print of peace: river tolls, hostages, who pays for the burned towns. {other} wants the burned towns paid for by someone else.",
      choices: [
        {
          t: "Be generous — a peace that lasts",
          r: "You give up a toll here, a hostage there. The room warms to you.",
          fx: (p,ctx)=>{for(const x of A.gathAttendees(G(ctx)))x!==myRid(p)&&A.remember(x,myRid(p),"peace",6);inf(ctx,6),next(p,ctx)},
        },
        {
          t: "Press every claim",
          check: {s:"diplomacy",s2:"intimidation",d:50},
          win: {
            r: "You get the tolls and the hostages. Your treasury will thank you.",
            fx: (p,ctx)=>{const r=A.realm(myRid(p));r&&(r.treasury+=Math.round(r.income*.04)),A.remember(ctx.rid,myRid(p),"insult",-6),next(p,ctx)},
          },
          lose: {
            r: "You overplay it. The congress unites against you on everything else.",
            fx: (p,ctx)=>{inf(ctx,-8),next(p,ctx)},
          },
        },
        {
          t: "Side with the strongest crown",
          r: "You vote with the big battalions. They notice. So do the small.",
          fx: (p,ctx)=>{const g=G(ctx),big=A.gathAttendees(g).filter(x=>x!==myRid(p)).sort((a,b)=>A.realmPower(A.realm(b))-A.realmPower(A.realm(a)))[0];big&&A.remember(big,myRid(p),"summit",10),next(p,ctx)},
        },
      ],
    },
    {
      id: "gs_toast",
      trigger: !0,
      gscene: {roles:["ruler","envoy","noble","knight"]},
      title: "A toast",
      setup: needG((p,ctx)=>{foreign(p,ctx),npc(p,ctx,"a prince with too much wine in him","noble")}),
      text: '{them}, a prince of {other}, rises unsteadily with his cup. "To {realmShort}," {theyHe} says, "whose soldiers run so fast that nobody has ever seen their faces." Laughter. Then silence. Everyone looks at you.',
      choices: [
        {
          t: "Answer with wit",
          check: {s:"persuasion",s2:"int",d:45},
          win: {
            r: '"And to {other}," you say, raising your cup, "whose princes are so brave they fight only cups." The hall roars. {them} sits down, red to the ears.',
            fx: (p,ctx)=>{inf(ctx,8),A.fame(p,2),next(p,ctx)},
          },
          lose: {
            r: "Your answer is a beat too slow. The laughter is at you, now.",
            fx: (p,ctx)=>{inf(ctx,-5),next(p,ctx)},
          },
        },
        {
          t: "Challenge him — tomorrow, at dawn",
          req: p=>A.skill(p,"melee")>=25||A.skill(p,"sword")>=25,
          r: '"Choose your weapon," you say. The hall holds its breath. At dawn, {them} sends a written apology and a cask of wine.',
          fx: (p,ctx)=>{inf(ctx,4),A.fame(p,3),p.honor=Math.min(100,p.honor+3),A.remember(ctx.rid,myRid(p),"insult",-4),next(p,ctx)},
        },
        {
          t: "Ignore it",
          r: "You drink and say nothing. Some call it dignity. Some call it something else.",
          fx: (p,ctx)=>{inf(ctx,-1),next(p,ctx)},
        },
      ],
    },
    {
      id: "gs_knife",
      trigger: !0,
      gscene: {roles:["guard","noble","ruler","knight"]},
      title: "A glint in the crowd",
      setup: needG((p,ctx)=>{const g=G(ctx);ctx.rid=g?g.host:null;const h=g&&A.realm(g.host),ru=h&&A.P(h.ruler);ctx.target=ru?A.rulerStyle(ru,h):"the host"}),
      text: "The procession passes close. A man in a servant's coat pushes forward — and you see the knife along his wrist, a hand's breadth from {target}.",
      choices: [
        {
          t: "Throw yourself at him",
          check: {s:"spd",s2:"unarmed",d:50},
          win: {
            r: "You hit him like a falling wall. The knife skitters across the flagstones. {target} looks at you, then at the knife, then at you again. You will not be forgotten.",
            fx: (p,ctx)=>{inf(ctx,12),A.fame(p,6);const g=G(ctx),h=g&&A.realm(g.host),ru=h&&A.P(h.ruler);ru&&ru.id!==p.id&&(p.rel[ru.id]?A.addOp(ru,p,25):A.link(p,ru,"acquaint",40,"acquaint"),p.flags&&(p.flags.patron=p.flags.patron||ru.id)),p.mil&&(p.mil.merit+=30),p.job&&(p.job.merit=(p.job.merit||0)+30),p.deeds.push({y:A.S.year,t:`Stopped a murderer at ${scene(ctx)}`}),next(p,ctx)},
          },
          lose: {
            r: "You are a step too slow. The guards take him — after the blade has opened {target}'s arm. You get a cut of your own for your trouble.",
            fx: (p,ctx)=>{p.health=Math.max(5,p.health-A.ri(6,16)),A.fame(p,1),next(p,ctx)},
          },
        },
        {
          t: "Shout a warning",
          r: "Your shout turns every head. The man is seized. A captain of the guard takes the credit, but those close enough heard who shouted.",
          fx: (p,ctx)=>{inf(ctx,5),A.fame(p,2),next(p,ctx)},
        },
        {
          t: "Do nothing — it is not your business",
          r: "Somebody else stops him. Or does not. You never find out who sent him.",
          fx: (p,ctx)=>{p.honor=Math.max(0,p.honor-3),next(p,ctx)},
        },
      ],
    },
    {
      id: "gs_overheard",
      trigger: !0,
      gscene: {roles:["servant","guard","noble","envoy"]},
      title: "Overheard",
      setup: needG((p,ctx)=>{foreign(p,ctx);const g=G(ctx),L=g?A.gathAttendees(g).filter(x=>x!==ctx.rid):[];ctx.vid=L.length?A.pick(L):null,ctx.victim=ctx.vid?A.realmShort(ctx.vid):"their own allies"}),
      text: "Behind a tapestry, two envoys of {other} talk low, sure that nobody listens to people like you. They are planning to sell out {victim} as soon as the ink is dry.",
      choices: [
        {
          t: "Sell it to a spymaster",
          r: "A man with ink-stained fingers pays you well and asks you to forget his face.",
          fx: (p,ctx)=>{p.coin+=60+Math.round(A.classOf(p)*20),A.trainSkill(p,"intrigue",2),ctx.vid&&A.remember(ctx.vid,ctx.rid,"betrayal",-10),next(p,ctx)},
        },
        {
          t: "Tell your own lord",
          r: "Your lord listens, and then looks at you as if seeing you for the first time.",
          fx: (p,ctx)=>{inf(ctx,6),p.job&&(p.job.merit=(p.job.merit||0)+20),p.mil&&(p.mil.merit+=12);const b=A.superior&&A.superior(p);b&&p.rel[b.id]&&A.addOp(b,p,10),next(p,ctx)},
        },
        {
          t: "Keep it for yourself",
          r: "A secret like that is worth more the longer you keep it.",
          fx: (p,ctx)=>{p.flags.secrets=(p.flags.secrets||0)+1,next(p,ctx)},
        },
      ],
    },
    {
      id: "gs_dance",
      trigger: !0,
      gscene: {roles:["noble","knight"],ok:p=>!p.spouse},
      title: "A dance",
      setup: needG((p,ctx)=>{foreign(p,ctx);const n=A.makeLoveInterest(p);n.status="noble",n.occ="a lord's child of "+A.realmShort(ctx.rid),ctx.pid=n.id}),
      text: "The musicians strike up a pavane. Across the floor, {them} of {other} is looking at you, and not at the dancers.",
      choices: [
        {
          t: "Ask {themHim} to dance",
          check: {s:"etiquette",s2:"persuasion",d:40,bonus:p=>(p.looks-50)/5},
          win: {
            r: "One dance becomes three. You walk on the terrace until the torches gutter. Letters will follow.",
            fx: (p,ctx)=>{const t=A.P(ctx.pid);t&&A.link(p,t,"lover",45,"lover"),A.remember(ctx.rid,myRid(p),"summit",3),next(p,ctx)},
          },
          lose: {r:"You tread on {theirHis} foot twice. {theyHe} is kind about it, which is worse.",fx:next},
        },
        {
          t: "Ask about {theirHis} family instead",
          check: {s:"intrigue",s2:"etiquette",d:40},
          win: {
            r: "You learn more about the court of {other} in one dance than an envoy learns in a year.",
            fx: (p,ctx)=>{inf(ctx,4),A.trainSkill(p,"intrigue",2),next(p,ctx)},
          },
          lose: {r:"{theyHe} finds your questions odd and drifts away.",fx:next},
        },
        {t:"Stay by the wall",r:"The music ends. Some other evening.",fx:next},
      ],
    },
    {
      id: "gs_patron",
      trigger: !0,
      gscene: {roles:["knight","noble","envoy","servant","guard"]},
      title: "A great one notices",
      setup: needG((p,ctx)=>{foreign(p,ctx),A.chance(.5)&&(ctx.rid=myRid(p));const n=npc(p,ctx,"a great lord with a long memory","noble");n.fame=Math.max(n.fame||0,40)}),
      text: '{them}, a great lord of {other}, has been watching you all evening. Now {theyHe} beckons. "You have a look about you," {theyHe} says. "Tell me what you want from life."',
      choices: [
        {
          t: "Tell {themHim} the truth",
          check: {s:"persuasion",s2:"wil",d:45},
          win: {
            r: '{them} laughs. "Good. Come and see me." A patron, if you want one.',
            fx: (p,ctx)=>{const t=A.P(ctx.pid);t&&(A.link(p,t,"mentor",45,"student"),p.rel[t.id]&&(p.rel[t.id].patron=!0),p.flags.patron=t.id),A.fame(p,1),next(p,ctx)},
          },
          lose: {r:"{them} nods politely and turns to someone more interesting.",fx:next},
        },
        {
          t: "Flatter {themHim}",
          check: {s:"deception",s2:"etiquette",d:40},
          win: {
            r: "{them} enjoys it, knows it is flattery, and enjoys it anyway. A useful acquaintance.",
            fx: (p,ctx)=>{const t=A.P(ctx.pid);t&&A.link(p,t,"acquaint",30,"acquaint"),next(p,ctx)},
          },
          lose: {r:"{them} has heard better flattery from {theirHis} dogs.",fx:next},
        },
        {t:"Excuse yourself",r:"Great lords want things. You leave before you find out what.",fx:next},
      ],
    },
    {
      id: "gs_oldfoe",
      trigger: !0,
      gscene: {roles:["ruler","noble","knight","envoy"],ok:p=>A.relsOf(p,["rival","enemy"]).some(x=>x.p.alive)},
      title: "An old enemy",
      setup: needG((p,ctx)=>{const e=A.relsOf(p,["rival","enemy"]).filter(x=>x.p.alive)[0];e?ctx.pid=e.p.id:ctx.skip=1,foreign(p,ctx)}),
      text: "Across the hall: {them}. Your eyes meet. {theyHe} raises {theirHis} cup a finger's width — an invitation or a dare.",
      choices: [
        {
          t: "Go over and make peace",
          check: {s:"persuasion",s2:"wil",d:50},
          win: {
            r: "An hour of hard talk in a window seat. You do not become friends. You stop being enemies.",
            fx: (p,ctx)=>{const t=A.P(ctx.pid);t&&p.rel[t.id]&&(p.rel[t.id].type="acquaint",p.rel[t.id].op=5,t.rel[p.id]&&(t.rel[p.id].type="acquaint",t.rel[p.id].op=5)),p.honor=Math.min(100,p.honor+3),next(p,ctx)},
          },
          lose: {
            r: "It goes badly. You part worse than you met.",
            fx: (p,ctx)=>{const t=A.P(ctx.pid);t&&A.addOp(p,t,-10),next(p,ctx)},
          },
        },
        {
          t: "Raise your cup back — and smile",
          r: "A truce for the evening. Everyone watching relaxes.",
          fx: (p,ctx)=>{inf(ctx,2),next(p,ctx)},
        },
        {
          t: "Turn your back",
          r: "The whole hall sees you do it.",
          fx: (p,ctx)=>{const t=A.P(ctx.pid);t&&A.addOp(p,t,-8),next(p,ctx)},
        },
      ],
    },
    {
      id: "gs_poison",
      trigger: !0,
      gscene: {roles:["servant","guard"]},
      title: "The wrong cup",
      setup: needG((p,ctx)=>{foreign(p,ctx),npc(p,ctx,"a cupbearer you have never seen before")}),
      text: "In the pantry, {them} — a cupbearer nobody hired — tips a paper of white powder into a jeweled cup meant for the envoy of {other}. {theyHe} has not seen you.",
      choices: [
        {
          t: "Seize {themHim}",
          check: {s:"str",s2:"unarmed",d:45},
          win: {
            r: "You pin {themHim} to the flagstones. The powder is tested on a dog. The dog dies. The envoy of {other} sends you a purse with a letter of thanks, and your master looks at you with new eyes.",
            fx: (p,ctx)=>{p.coin+=80,A.fame(p,3),p.job&&(p.job.merit=(p.job.merit||0)+30),p.mil&&(p.mil.merit+=20),A.remember(ctx.rid,myRid(p),"rescue",8),p.deeds.push({y:A.S.year,t:`Caught a poisoner at ${scene(ctx)}`}),next(p,ctx)},
          },
          lose: {
            r: "{them} slips out of your grip and is gone. You knock the cup over, at least. Nobody believes your story.",
            fx: next,
          },
        },
        {
          t: "Knock the cup over and say nothing",
          r: "A clumsy servant. A cleaned-up spill. An envoy who lives, and never knows why.",
          fx: (p,ctx)=>{p.honor=Math.min(100,p.honor+2),next(p,ctx)},
        },
        {
          t: "Back away. This is above you.",
          r: "You back out of the pantry. In the morning the envoy of {other} is too sick to sign anything.",
          fx: (p,ctx)=>{A.remember(ctx.rid,A.realm(G(ctx).host)?G(ctx).host:myRid(p),"insult",-10),next(p,ctx)},
        },
      ],
    },
    {
      id: "gs_drunk",
      trigger: !0,
      gscene: {roles:["guard","servant"]},
      title: "A lord in his cups",
      setup: needG((p,ctx)=>{foreign(p,ctx),npc(p,ctx,"a very drunk lord","noble")}),
      text: "{them}, a lord of {other}, very drunk, decides you have insulted {themHim} by existing. {theyHe} draws a dagger and lurches at you, laughing.",
      choices: [
        {
          t: "Disarm {themHim} gently",
          check: {s:"unarmed",s2:"spd",d:45},
          win: {
            r: "A twist, a step, and the dagger is in your hand and the lord is in a chair. His own men thank you quietly. No blood, no scandal.",
            fx: (p,ctx)=>{inf(ctx,4),p.mil&&(p.mil.merit+=8),p.job&&(p.job.merit=(p.job.merit||0)+10),next(p,ctx)},
          },
          lose: {
            r: "The dagger opens your forearm before his men drag him off.",
            fx: (p,ctx)=>{p.health=Math.max(5,p.health-A.ri(5,12)),next(p,ctx)},
          },
        },
        {
          t: "Call for his own men",
          r: "His men come and take him away, apologizing. You are a little ashamed at how relieved you are.",
          fx: next,
        },
        {
          t: "Knock him down",
          r: "He goes down like a sack of meal. Your fellows cheer. The lord, sober, will remember your face.",
          fx: (p,ctx)=>{const t=A.P(ctx.pid);t&&A.link(p,t,"enemy",-40,"enemy"),A.fame(p,1),next(p,ctx)},
        },
      ],
    },
    {
      id: "gs_oath",
      trigger: !0,
      gscene: {roles:["noble"],kinds:["coronation"]},
      title: "The oath",
      setup: needG((p,ctx)=>{const g=G(ctx);ctx.rid=g?g.host:null}),
      text: "One by one the lords of {other} kneel to swear to the new crown. Your turn comes. The words are old; how you say them is not.",
      choices: [
        {
          t: "Swear loudly, and mean it",
          r: "Your voice carries to the rafters. The new crown nods at you: one of the loyal ones.",
          fx: (p,ctx)=>{const r=A.realm(ctx.rid),ru=r&&A.P(r.ruler);ru&&ru.id!==p.id&&(p.rel[ru.id]?A.addOp(ru,p,15):A.link(p,ru,"lord",30,"acquaint")),inf(ctx,4),next(p,ctx)},
        },
        {
          t: 'Swear — and pause before "forever"',
          r: "Half a heartbeat. Those who matter heard it. A faction may be in touch.",
          fx: (p,ctx)=>{p.flags.doubtful=A.S.year,A.trainSkill(p,"intrigue",1),next(p,ctx)},
        },
      ],
    },
    {
      id: "gs_vows",
      trigger: !0,
      gscene: {roles:["noble","ruler","guard","servant"],kinds:["wedding"]},
      title: "A hitch",
      setup: needG((p,ctx)=>{const g=G(ctx);ctx.rid=g?g.target||g.host:null}),
      text: "In the middle of the vows, a woman in a travel-stained cloak stands up at the back and says, loudly, that the groom of {other} is already married to her.",
      choices: [
        {
          t: "Help get her out quickly and quietly",
          check: {s:"persuasion",s2:"etiquette",d:40},
          win: {
            r: "She is ushered out with a purse and a promise. The vows go on. Two families owe you a quiet favor.",
            fx: (p,ctx)=>{inf(ctx,6),A.trainSkill(p,"persuasion",1),next(p,ctx)},
          },
          lose: {r:"She makes a scene all the way out. The marriage goes ahead under a cloud.",fx:next},
        },
        {
          t: "Find out if it is true",
          check: {s:"intrigue",d:45},
          win: {
            r: "It is true — a village wedding twenty years ago. You now know something that two crowns would pay to bury.",
            fx: (p,ctx)=>{p.flags.secrets=(p.flags.secrets||0)+1,next(p,ctx)},
          },
          lose: {r:"You learn nothing and get yourself noticed.",fx:next},
        },
        {
          t: "Enjoy the show",
          r: "Best wedding in years.",
          fx: (p,ctx)=>{p.happy=Math.min(100,p.happy+3),next(p,ctx)},
        },
      ],
    },
    {
      id: "gs_joust1",
      trigger: !0,
      gscene: {roles:[]},
      title: "The first tilt",
      setup: needG((p,ctx)=>{foreign(p,ctx),npc(p,ctx,"a knight in green and gold","gentry")}),
      text: "Your first opponent: {them} of {other}, green and gold, a good seat on a big horse. The marshal drops the flag.",
      choices: [
        {
          t: "Aim for the shield, ride hard",
          check: {s:"lance",s2:"riding",d:40},
          win: {
            r: "Your lance shatters square on {theirHis} shield and {theyHe} goes over the crupper into the sand. The crowd roars.",
            fx: (p,ctx)=>{ctx.jw=1,ctx.joust="gs_joust2",A.trainSkill(p,"lance",2),next(p,ctx)},
          },
          lose: {
            r: "You take {theirHis} lance on the helm and see the sky. Out in the first round.",
            fx: (p,ctx)=>{ctx.joust=null,p.health=Math.max(5,p.health-A.ri(3,10)),A.trainSkill(p,"lance",1),next(p,ctx)},
          },
        },
        {
          t: "Aim for the helm — win it all or nothing",
          check: {s:"lance",s2:"ins",d:52},
          win: {
            r: "A perfect strike on the helm. {them} is carried off senseless. The heralds will remember your name.",
            fx: (p,ctx)=>{ctx.jw=2,ctx.joust="gs_joust2",A.fame(p,2),next(p,ctx)},
          },
          lose: {
            r: "Your point skids off and {theirHis} lance takes you full in the chest. Out, and sore for a month.",
            fx: (p,ctx)=>{ctx.joust=null,p.health=Math.max(5,p.health-A.ri(8,16)),next(p,ctx)},
          },
        },
      ],
    },
    {
      id: "gs_joust2",
      trigger: !0,
      gscene: {roles:[]},
      title: "The second tilt",
      setup: needG((p,ctx)=>{foreign(p,ctx),npc(p,ctx,"a famous champion","noble")}),
      text: "The second round. {them} of {other} has unhorsed four men this season and never been unhorsed. {theyHe} salutes you with {theirHis} lance.",
      choices: [
        {
          t: "Ride steady, take the points",
          check: {s:"lance",s2:"riding",d:50,bonus:p=>0},
          win: {
            r: "Three passes, three clean breaks. The judges give it to you. The champion is beaten.",
            fx: (p,ctx)=>{ctx.joust="gs_joust3",A.fame(p,2),A.trainSkill(p,"riding",2),next(p,ctx)},
          },
          lose: {
            r: "Three passes; {theyHe} breaks one more lance than you. Out with honor.",
            fx: (p,ctx)=>{ctx.joust=null,A.fame(p,1),next(p,ctx)},
          },
        },
        {
          t: "Unhorse {themHim} or die trying",
          check: {s:"lance",s2:"str",d:58},
          win: {
            r: "The champion goes down. The stands are on their feet. They will sing about this pass.",
            fx: (p,ctx)=>{ctx.joust="gs_joust3",A.fame(p,4),next(p,ctx)},
          },
          lose: {
            r: "You go down instead, hard. The surgeons are busy with you a long time.",
            fx: (p,ctx)=>{ctx.joust=null,p.health=Math.max(5,p.health-A.ri(10,22)),p.lastHurt="a jousting fall",next(p,ctx)},
          },
        },
      ],
    },
    {
      id: "gs_joust3",
      trigger: !0,
      gscene: {roles:[]},
      title: "The final",
      setup: needG((p,ctx)=>{foreign(p,ctx),npc(p,ctx,"the favorite of the tournament","noble");const g=G(ctx);ctx.purse=String(200+(g?A.gathAttendees(g).length*60:200)),ctx.gname=scene(ctx)}),
      text: "The final. {them} of {other} — the favorite. The whole field has come down to the two of you, and a purse of {purse} suns, and the circlet of the champion.",
      choices: [
        {
          t: "Ride for the circlet",
          check: {s:"lance",s2:"riding",d:56},
          win: {
            r: "The last lance breaks and {them} goes down. You are the champion of {gname}. The circlet is set on your head by the host's own hands.",
            fx: (p,ctx)=>{p.coin+=+ctx.purse,A.fame(p,8),p.deeds.push({y:A.S.year,t:`Champion of ${scene(ctx)}`}),A.ach&&A.ach("champion");const g=G(ctx),r=A.realm(myRid(p));if(r&&(r.legit=Math.min(100,r.legit+1)),p.job&&p.job.c==="knight"&&(p.job.merit=(p.job.merit||0)+50),g){const h=A.realm(g.host),ru=h&&A.P(h.ruler);ru&&ru.id!==p.id&&(p.rel[ru.id]?A.addOp(ru,p,15):A.link(p,ru,"acquaint",35,"acquaint"))}A.news(`${A.fullName(p)} of ${A.realmShort(p.realm)} wins ${scene(ctx)}.`,"crown"),ctx.joust=null,next(p,ctx)},
          },
          lose: {
            r: "So close. The favorite wins by a single broken lance. Second in the whole field — a purse of your own and a name people know.",
            fx: (p,ctx)=>{p.coin+=Math.round(+ctx.purse/3),A.fame(p,4),p.job&&p.job.c==="knight"&&(p.job.merit=(p.job.merit||0)+20),ctx.joust=null,next(p,ctx)},
          },
        },
      ],
    },
  ]);
  for(const id of["gs_joust1","gs_joust2","gs_joust3","gs_bargain"])A.EV[id]&&(A.EV[id].gscene=null);
  const IR=ctx=>A.incidentRole(A.pc(),ctx.kind),myR2=p=>p.ruler||(p.mil&&!p.mil.merc?p.mil.realm:p.realm);
  A.defEvents([
    {
      id: "di_incident",
      trigger: !0,
      title: (p,ctx)=>({border:"Blood at the ford",envoy:"An envoy insulted",ships:"Ships seized",spy:"A spy on the gallows",raid:"Villages burning",heretic:"Blasphemy on the border",refugees:"Refugees at the border",rescue:"Rescued at sea",famine:"Grain ships",murder:"A murder, and a purse",defector:"A captain changes sides",elope:"An elopement"})[ctx.kind]||"An incident",
      setup: (p,ctx)=>{(!ctx.rid||!A.realm(ctx.rid)||!A.incidentRole(p,ctx.kind))&&(ctx.skip=1)},
      text: (p,ctx)=>{const role=A.incidentRole(p,ctx.kind),who={ruler:"The matter comes to your council table.",chancellor:"The crown wants your advice — and your letters.",spymaster:"It is your service. The crown wants to know what you will do about it.",commander:"It happened on your stretch of the border. Your officers wait for orders.",envoy:"You are the envoy who must deal with it."}[role]||"";return`${ctx.desc} ${who} ${ctx.mine?"This time the fault is laid at your realm's door.":"This time {other} is to blame — or so everyone in your realm believes."}`},
      choices: [
        {
          t: "Demand an apology",
          req: (p,C,ctx)=>!ctx.mine&&["ruler","chancellor","envoy"].includes(IR(ctx)),
          check: {
            s: "diplomacy",
            s2: "intimidation",
            d: 48,
            bonus: p=>{const r=A.realm(myR2(p));return r?Math.min(12,A.realmPower(r)/25e3):0},
          },
          win: {
            r: "{other} apologizes, in writing, with a gift. Your crown stands taller.",
            fx: (p,ctx)=>{const me=myR2(p);A.remember(me,ctx.rid,"gift",8);const r=A.realm(me);r&&(r.legit=Math.min(100,r.legit+2)),A.trainSkill(p,"diplomacy",1),p.job&&(p.job.merit=(p.job.merit||0)+8)},
          },
          lose: {
            r: "{other} refuses, and says so loudly. Now there are two insults to remember.",
            fx: (p,ctx)=>{const me=myR2(p);A.remember(me,ctx.rid,"insult",-6),A.grantCB(me,ctx.rid,"incident")},
          },
        },
        {
          t: "Make it a reason for war",
          req: (p,C,ctx)=>!ctx.mine&&IR(ctx)==="ruler",
          r: "Your clerks write it into the record in red ink. For five years you have a reason for war the world will accept.",
          fx: (p,ctx)=>{A.grantCB(p.ruler,ctx.rid,"incident"),A.remember(ctx.rid,p.ruler,"insult",-4)},
        },
        {
          t: "Smooth it over",
          req: (p,C,ctx)=>["ruler","chancellor","envoy"].includes(IR(ctx)),
          r: "Letters, a gift, a careful phrase. It goes away — mostly.",
          fx: (p,ctx)=>{const me=myR2(p);A.remember(ctx.rid,me,"gift",6);const t=A.realm(ctx.rid);ctx.mine&&t&&t.cbs&&delete t.cbs[me];const r=A.realm(me);r&&!ctx.mine&&(r.legit=Math.max(0,r.legit-1)),p.job&&(p.job.merit=(p.job.merit||0)+5)},
        },
        {
          t: "Deny everything",
          req: (p,C,ctx)=>ctx.mine&&["ruler","chancellor","envoy","spymaster"].includes(IR(ctx)),
          check: {s:"deception",s2:"diplomacy",d:50},
          win: {
            r: "You deny it so smoothly that half of {other}'s court believes you.",
            fx: (p,ctx)=>{const t=A.realm(ctx.rid),me=myR2(p);if(t&&t.mem&&t.mem[me])for(const m of t.mem[me])m.v<0&&(m.v*=.5)},
          },
          lose: {
            r: "Nobody believes a word. Now you are a liar as well.",
            fx: (p,ctx)=>A.remember(ctx.rid,myR2(p),"insult",-8),
          },
        },
        {
          t: "Trade their spy for ours",
          req: (p,C,ctx)=>IR(ctx)==="spymaster",
          check: {s:"intrigue",d:45},
          win: {
            r: "A quiet exchange at a border bridge, at night. Nobody else ever knows.",
            fx: (p,ctx)=>{A.trainSkill(p,"intrigue",2),A.remember(ctx.rid,myR2(p),"gift",4)},
          },
          lose: {
            r: "They have no spy of yours to trade. They were bluffing — and you showed your hand.",
            fx: (p,ctx)=>A.remember(ctx.rid,myR2(p),"spies",-6),
          },
        },
        {
          t: "Retaliate: hang one of theirs",
          req: (p,C,ctx)=>IR(ctx)==="spymaster",
          r: "You knew of one of theirs all along. He hangs at noon. Tit for tat.",
          fx: (p,ctx)=>{A.remember(ctx.rid,myR2(p),"spies",-10);const r=A.realm(myR2(p));r&&(r.stability=Math.min(100,r.stability+1))},
        },
        {
          t: "Hold your men back",
          req: (p,C,ctx)=>IR(ctx)==="commander",
          r: "You forbid any reprisal. Your officers grumble; the border stays quiet.",
          fx: p=>{p.honor=Math.min(100,p.honor+2),A.trainSkill(p,"command",1)},
        },
        {
          t: "Strike back across the border",
          req: (p,C,ctx)=>IR(ctx)==="commander"&&!ctx.mine,
          check: {s:"tactics",s2:"command",d:45},
          win: {
            r: "A night raid. You burn their watchtower and come back without losing a man. Your soldiers would follow you into the sea now.",
            fx: (p,ctx)=>{const me=myR2(p);A.remember(ctx.rid,me,"incident",-12),A.grantCB(ctx.rid,me,"incident"),p.mil&&(p.mil.merit+=20),A.fame(p,2);const r=A.realm(me),ru=r&&A.P(r.ruler);r&&!r.playerRun&&ru&&!A.atWar(r.id).length&&(A.AGGRO[r.id]||1)>1&&A.chance(.15)&&(A.declareWar(r.id,ctx.rid,{cb:"incident"}),A.log("Your raid lights the fire. The crown declares war.","war"))},
          },
          lose: {
            r: "They were waiting. You lose good men and come back with nothing but a grievance.",
            fx: (p,ctx)=>{p.mil&&(p.mil.merit-=5),p.health=Math.max(5,p.health-A.ri(3,10))},
          },
        },
        {
          t: "Report it and ask for orders",
          req: (p,C,ctx)=>IR(ctx)==="commander",
          r: "A rider goes to the capital. The crown will decide. You did your duty.",
          fx: p=>{p.mil&&(p.mil.merit+=5)},
        },
        {
          t: "Let it go",
          req: (p,C,ctx)=>IR(ctx)==="ruler",
          r: "You have bigger things to think about. Your lords think you soft.",
          fx: p=>{const r=A.realm(p.ruler);r&&(r.legit=Math.max(0,r.legit-1))},
        },
      ],
    },
  ]);
})();
