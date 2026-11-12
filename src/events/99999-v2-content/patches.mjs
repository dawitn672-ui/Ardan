// 99999-v2-content: release scenes that reached the wrong life (playtest 1, #11). Each find is checked against the build
// (count 1).
export default [
  {
    id: 'V2C-UNDERCUT-MASTER',
    blob: 'ardan-content',
    why: 'du_gd_undercut ("Someone is undercutting you ... paying Hamo to ruin you") had no rank gate, so a 13-year-old ' +
      'apprentice with no shop of his own was told his trade was being ruined. Selling at a price is a master\'s business: ' +
      'the scene now needs rank 2 (a master) of a guild career.',
    edits: [['duty:["guild"],title:"Someone is undercutting you"', 'duty:["guild"],minR:2,title:"Someone is undercutting you"']],
  },
  {
    id: 'V2C-CARAVAN-MASTER',
    blob: 'ardan-content',
    why: 'du_gd_caravan ("Your caravan from the south is ten days late") came to an apprentice merchant, who owns no ' +
      'caravan. It needs rank 2 of the merchant career, as the loan scene needs rank 3.',
    edits: [['duty:["merchant"],title:"The caravan is late"', 'duty:["merchant"],minR:2,title:"The caravan is late"']],
  },
  {
    id: 'V2C-NO-LATIN',
    blob: 'ardan-content',
    why: 'fl_st_exam named Latin, which Ardan does not have. Its learned tongue is Old Solen (GD.LANG_LIST).',
    edits: [['scholars twice a year: Latin, law', 'scholars twice a year: Old Solen, law']],
  },
  {
    id: 'V2C-SCHOLAR-WORK',
    blob: 'ardan-content',
    why: 'fl_st_master ("An old scholar") left a student with under 30 suns one live choice, "You cannot afford it", ' +
      'with the real one out of reach (playtest 1, #19). A poor student may now work off part of the rent: less ' +
      'learning than paying, and it costs his evenings and some health.',
    edits: [['{t:"You cannot afford it",r:"He shrugs and goes back to his books.",fx:{}}',
      '{t:"Offer to work off his rent instead",req:p=>p.coin<30,r:"You carry his water, sweep his stair and copy his letters, and in the gaps he teaches you. It is half a schooling, paid for in sleep.",fx:{skill:{learning:3},int:1,health:-3,need:{rest:-12},them:{type:"mentor",op:20}}},{t:"You cannot afford it",r:"He shrugs and goes back to his books.",fx:{}}']],
  },
  {
    id: 'V2C-TAVERN-ROUND-ADULT',
    blob: 'ardan-content',
    why: 'bd_lucky_escape offered "Laugh, and buy the whole tavern a drink (5 suns)" from 12, so a penniless 14-year-old saw ' +
      'it on the card as an option out of reach. Standing a round is a grown man\'s choice: it needs 16 years as well as ' +
      'the coin. (9998-choice-stakes shows a locked row only for a requirement it can read, so a child no longer sees it.)',
    edits: [['t:"Laugh, and buy the whole tavern a drink (5 suns)",req:p=>p.coin>=5,', 't:"Laugh, and buy the whole tavern a drink (5 suns)",req:p=>p.coin>=5&&A.age(p)>=16,']],
  },
  {
    id: 'V2C-FX-PARTS',
    blob: 'ardan-content',
    why: 'The soldier packs build 227 choices as both({ honor: 2, ... }, op2(-30)): a closure whose source shows only ' +
      '"applyFx(p, obj, ctx)", so the card could read none of what they do (playtest 2, old 18 and 19: "It will be ' +
      'remembered", "• changes regard" naming nobody). The closures now carry their parts (A.V2C.parts: f.v2parts, and ' +
      'op2\'s regard and messmate as f.v2meta), which the chips read as written. Nothing they do changes. In the source: ' +
      'write these effects as data, or give the helpers a way to say what they hold.',
    edits: [
      ['both=(obj,fn)=>(p,ctx)=>{const a=A.applyFx(p,obj,ctx),b=fn(p,ctx);return[a,b].filter(x=>typeof x=="string"&&x).join(" ")}',
        'both=(obj,fn)=>(A.V2C&&A.V2C.parts||(f=>f))((p,ctx)=>{const a=A.applyFx(p,obj,ctx),b=fn(p,ctx);return[a,b].filter(x=>typeof x=="string"&&x).join(" ")},[obj,fn])', 3],
      ['op2=d=>(p,ctx)=>{const c=A.P(ctx.m2);return c&&A.addOp(p,c,d),""}',
        'op2=d=>(A.V2C&&A.V2C.parts||(f=>f))((p,ctx)=>{const c=A.P(ctx.m2);return c&&A.addOp(p,c,d),""},null,{op:d,who:"m2"})', 2],
      ['rel=d=>(p,ctx)=>(ctx&&ctx.destId&&A.realm(ctx.destId)&&ctx.destId!==p.realm&&A.addRel(p.realm,ctx.destId,d),"")',
        'rel=d=>(A.V2C&&A.V2C.parts||(f=>f))((p,ctx)=>(ctx&&ctx.destId&&A.realm(ctx.destId)&&ctx.destId!==p.realm&&A.addRel(p.realm,ctx.destId,d),""),null,{rel:d})'],
    ],
  },
  {
    id: 'V2C-RUNAWAY-BETROTHAL',
    blob: 'ardan-content',
    why: 'lf_teen_runaway picks a reason to run from a list that includes "a betrothal to a man twice your age", so a boy ' +
      'of 14 ran from a betrothal to a man (playtest 2, old #11). A boy is betrothed to a widow. The list keeps its ' +
      'length, so the pick draws the same.',
    edits: [['"a betrothal to a man twice your age"', '(p.sex==="F"?"a betrothal to a man twice your age":"a betrothal to a widow twice your age")']],
  },
  {
    id: 'V2C-TOURNEY-LANCE',
    blob: 'ardan-content',
    why: 'ga_open gives every tournament entrant of the "knight" role "Your horse is groomed and your lance is new", and ' +
      'the role also goes to any soldier of rank 2 or more: an orc crossbowman with no lance to speak of was told of ' +
      'his lance and groomed horse (playtest 2, old #11). The line is for one who rides with a lance (the role\'s own ' +
      'tests: a knight\'s post, lance and riding 30, a lord\'s rung); a soldier comes in his company\'s colours.',
    edits: [['knight:"Your horse is groomed and your lance is new. The heralds are calling the order of the lists."',
      'knight:p.job&&p.job.c==="knight"||A.skill(p,"lance")>=30&&A.skill(p,"riding")>=30||p.noble&&p.noble.rung>=2?"Your horse is groomed and your lance is new. The heralds are calling the order of the lists.":"You have come in your company\'s colours, with the weapons you know. The heralds are calling the order of the lists."']],
  },
  {
    id: 'V2C-TOY-ARTICLE',
    blob: 'ardan-content',
    why: 'The small grave ("Today there is a small grave, and {npc}\'s {toy} is lying in the lane") and its choice "Keep the ' +
      '{toy}" took a toy with its article, so the card read "Edda\'s a wooden horse" and "Keep the a slingshot" (playtest 2, ' +
      'new #19). The toy is named bare; the list keeps its length and order, so the pick draws the same.',
    edits: [['ctx.toy=A.pick(["a bone whistle","a wooden horse","a clay marble","a slingshot","a corn doll"])', 'ctx.toy=A.pick(["bone whistle","wooden horse","clay marble","slingshot","corn doll"])']],
  },
];
