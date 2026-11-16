// World and economy fixes: exact find/replace edits on the minified build. See README.md.
export default [
  {
    id: 'WLD-MERC-NO-CONTRACT',
    blob: 'ardan-core',
    why: 'A mercenary with no contract was still paid 1.3x rank pay every year by nobody (a rank-6 merc earned 9,100 idle). No contract, no pay.',
    edits: [[
      'let pay=GD.MIL[m.rank].pay*(m.merc?1.3:1);',
      'let pay=m.merc&&!r?0:GD.MIL[m.rank].pay*(m.merc?1.3:1);m.merc&&!r&&A.log(`No one is hiring sellswords this year. ${m.company||"The company"} lives on its savings.`,"warn");',
    ]],
  },
  {
    id: 'WLD-REPARATIONS-EXCLUSIVE',
    blob: 'ardan-core',
    why: '"Reparations" and "Crushing reparations" could both be ticked and were both paid: 3.5x gold for cost 44 beat the crushing ' +
      'option alone (2.5x for 30). They are now one choice: the engine keeps only the crushing one if both arrive, and ticking one ' +
      'unticks the other.',
    edits: [[
      'A.peaceOdds=function(T,picks){const cost=',
      'A.peaceOdds=function(T,picks){picks.includes("gold2")&&(picks=picks.filter(k=>k!=="gold"));const cost=',
    ], [
      'const{cost,p}=A.peaceOdds(T,picks);if(!A.chance(p/100))',
      'picks.includes("gold2")&&(picks=picks.filter(k=>k!=="gold"));const{cost,p}=A.peaceOdds(T,picks);if(!A.chance(p/100))',
    ], [
      'el.checked&&i<0&&p.push(el.value),!el.checked&&i>=0&&p.splice(i,1),UI.peaceRedraw()}',
      'el.checked&&i<0&&p.push(el.value),!el.checked&&i>=0&&p.splice(i,1);const other={gold:"gold2",gold2:"gold"}[el.value];el.checked&&other&&p.includes(other)&&p.splice(p.indexOf(other),1),UI.peaceRedraw()}',
    ]],
  },
  {
    id: 'WLD-AI-DEBT',
    blob: 'ardan-core',
    why: 'AI realm debt never went down: only interest (8%) was charged, nothing repaid the principal, and surplus gold above 3x ' +
      'income was deleted for +1 stability instead. Realms now repay principal from cash above half a year\'s income, and the ' +
      'surplus rule pays debt before it burns anything.',
    edits: [[
      'r.treasury+=Math.round(r.income*.92-upkeep-r.debt*.08),',
      'r.treasury+=Math.round(r.income*.92-upkeep-r.debt*.08),r.debt>0&&r.treasury>r.income*.5&&(()=>{const _p=Math.min(r.debt,Math.round((r.treasury-r.income*.5)*.5));r.debt-=_p,r.treasury-=_p})(),',
    ], [
      'if(!isPlayer&&r.treasury>r.income*3){const x=Math.round((r.treasury-r.income*3)*.85);r.treasury-=x,',
      'if(!isPlayer&&r.treasury>r.income*3){const _d=Math.min(r.debt||0,r.treasury-r.income*3);r.debt-=_d,r.treasury-=_d}if(!isPlayer&&r.treasury>r.income*3){const x=Math.round((r.treasury-r.income*3)*.85);r.treasury-=x,',
    ]],
  },
  {
    id: 'WLD-STABILITY-FLOOR',
    blob: 'ardan-core',
    why: 'Five places lowered realm stability with no floor (capital lost -15, a coup -15, bankruptcy -4, empty treasury -6, ' +
      'a raging faction -10), so readers inside the year (prices, industry, factions) could see negative stability.',
    edits: [
      ['r.capital=A.prov(r.capitalProv).name,r.stability-=15)}', 'r.capital=A.prov(r.capitalProv).name,r.stability=Math.max(0,r.stability-15))}'],
      ['r&&(r.stability-=15)}if(B.abbot)', 'r&&(r.stability=Math.max(0,r.stability-15))}if(B.abbot)'],
      ['r.treasury=Math.round(r.treasury*.5),r.stability-=4);', 'r.treasury=Math.round(r.treasury*.5),r.stability=Math.max(0,r.stability-4));'],
      ['r.treasury<0&&(r.stability-=6,A.log(', 'r.treasury<0&&(r.stability=Math.max(0,r.stability-6),A.log('],
      ['if(!provs.length){r.stability-=10,A.news(', 'if(!provs.length){r.stability=Math.max(0,r.stability-10),A.news('],
    ],
  },
  {
    id: 'WLD-FACTION-WAR-CHECKS',
    blob: 'ardan-core',
    why: 'When a crown yielded to a war faction, it declared war while skipping the checks every other declaration runs: truces, ' +
      'defensive treaties, being already hostile, and the cap of 4 wars at once. Those checks now apply; with no lawful target, no war.',
    edits: [[
      'if(f.kind==="war"){const tgts=A.neighbors(r.id).map(A.realm).filter(o=>o&&o.alive&&!o.isRebel&&!A.hasNap(r.id,o.id)&&!r.allies.includes(o.id)&&o.overlord!==r.id);if(tgts.length){',
      'if(f.kind==="war"){const tgts=A.neighbors(r.id).map(A.realm).filter(o=>o&&o.alive&&!o.isRebel&&!A.hasNap(r.id,o.id)&&!r.allies.includes(o.id)&&o.overlord!==r.id&&r.overlord!==o.id&&!(r.truce&&r.truce[o.id]>S.year)&&!A.hasTr(r.id,o.id,"def")&&!A.hostile(r.id,o.id));if(tgts.length&&S.wars.filter(w=>w.cb!=="throne").length<4){',
    ]],
  },
  {
    id: 'WLD-SIEGE-OWNER',
    blob: 'ardan-core',
    why: 'A siege belonged to whichever division was first in the list, so when an allied division ended up first the progress ' +
      'reset to 0 (and the decay check used the same test). The siege now stays with the realm already running it while it ' +
      'still has troops there, otherwise it goes to the realm with the most men.',
    edits: [[
      'for(const loc in by){const P=S.prov[loc],L=by[loc],rid=L[0].r,',
      'for(const loc in by){const P=S.prov[loc],L=by[loc],rid=P.sgBy&&L.some(d=>d.r===P.sgBy)?P.sgBy:(()=>{const m={};for(const d of L)m[d.r]=(m[d.r]||0)+d.men;return Object.keys(m).sort((a,b)=>m[b]-m[a])[0]})(),',
    ], [
      'P.sgBy&&!(by[P.id]&&by[P.id][0].r===P.sgBy)&&(P.sgd=',
      'P.sgBy&&!(by[P.id]&&by[P.id].some(d=>d.r===P.sgBy))&&(P.sgd=',
    ]],
  },
  {
    id: 'ECO-THIN-MARKET-SPREAD',
    blob: 'ardan-core',
    why: 'Buying one load raises the price by 0.3/depth (up to 10% in thin markets) while a skilled trader\'s spread could be 2%, ' +
      'so buying and selling straight back at home printed money (about 570 suns per 20 click pairs for pearls). Thin markets ' +
      'now have a wider spread: at least 0.2/depth, which keeps any buy-then-sell-back round trip at a loss. Deep markets are unchanged.',
    edits: [[
      'A.buyPrice=(rid,k,pc)=>A.mkt(rid).p[k]*(1+A.spread(pc||A.pc()))',
      'A.buyPrice=(rid,k,pc)=>A.mkt(rid).p[k]*(1+Math.max(A.spread(pc||A.pc()),.2/A.mktDepth(rid)))',
    ], [
      'A.sellPrice=(rid,k,pc)=>A.mkt(rid).p[k]*(1-A.spread(pc||A.pc()))',
      'A.sellPrice=(rid,k,pc)=>A.mkt(rid).p[k]*(1-Math.max(A.spread(pc||A.pc()),.2/A.mktDepth(rid)))',
    ]],
  },
  {
    id: 'WLD-DIV-ARTICLE',
    blob: 'ardan-core',
    why: 'A division line wrote "The ${d.name}", and a far order is often named "The ..." already: "The The Chain Keepers is cut ' +
      'off and destroyed at Shulai" (world review cycle 2, B5). A.divThe(name) puts "The" before a name only when it has none.',
    edits: [
      ['A.news(`The ${d.name} is ${opts.length?"overrun":"cut off and destroyed"} at ${P.name}.`,"battle")',
        'A.news(`${A.divThe?A.divThe(d.name):"The "+d.name} is ${opts.length?"overrun":"cut off and destroyed"} at ${P.name}.`,"battle")'],
      ['A.log(`The ${d.name} finishes training and joins the host (${A.fmt(d.men)} men).`,"good")',
        'A.log(`${A.divThe?A.divThe(d.name):"The "+d.name} finishes training and joins the host (${A.fmt(d.men)} men).`,"good")'],
    ],
  },
];
