// Every change made to the shipped build, as exact find/replace edits on the minified code.
// blob: 'ardan-core' | 'ardan-content' | 'ardan-lore' | 'html' (the page shell)
// edits: [find, replace, expectedMatches = 1]
// Port each of these to the real source; the ids are referenced in "Ardan Road to 100.md".
export default [
  {
    id: 'SEC-CSP',
    blob: 'html',
    why: 'Content-Security-Policy: only the page\'s own inline scripts (by hash) and the scripts they create may run. ' +
      'Injected inline handlers (onerror=, onclick=) and injected <script> tags are blocked, whatever slips into the markup.',
    edits: [[
      '<meta charset="utf-8">\n',
      '<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src __SCRIPT_HASHES__ \'strict-dynamic\'; ' +
        'style-src \'unsafe-inline\' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data: blob:; ' +
        'connect-src data: blob:; base-uri \'none\'; form-action \'none\'; object-src \'none\'">\n',
    ]],
  },
  {
    id: 'SEC-SAVE-CLEAN',
    blob: 'ardan-core',
    why: 'A loaded save is untrusted (players swap files; the checksum anyone can recompute). Before a save is entered, ' +
      'strip < and > from every string and key (no game text uses them), strip " from everything except prose fields, ' +
      'and force log line classes, years and ages into safe shapes. Closes the script injection through the story log, ' +
      'realm colours, ids in data-v attributes and portrait colours.',
    edits: [[
      ',UI.enterSave=function(d){return UI.clkStop&&',
      ',SAVES.clean=function(d){const PROSE=/^(lines|primer|t|text|desc|manner|wants|fears|looks|famNote|occ|famRole|title|history)$/,' +
        'fix=(s,prose)=>(s=s.replace(/[<>]/g,""),prose?s:s.replace(/"/g,"")),' +
        'walk=(v,prose,depth)=>{if(typeof v=="string")return fix(v,prose);if(!v||typeof v!="object"||depth>80)return v;' +
        'if(Array.isArray(v)){for(let i=0;i<v.length;i++)v[i]=walk(v[i],prose,depth+1);return v}' +
        'for(const k of Object.keys(v)){const val=walk(v[k],prose||PROSE.test(k),depth+1),ck=fix(k,!1);ck!==k?(delete v[k],ck&&(v[ck]=val)):v[k]=val}return v};' +
        'if(d&&d.S){walk(d.S,!1,0);for(const e of Array.isArray(d.S.log)?d.S.log:[])if(e&&typeof e=="object"){e.year=+e.year||0,e.age=+e.age||0;' +
        'for(const l of Array.isArray(e.lines)?e.lines:[])Array.isArray(l)&&typeof l[1]=="string"&&!/^[\\w -]*$/.test(l[1])&&(l[1]="")}}' +
        'return d&&d.meta&&walk(d.meta,!1,0),d},' +
        'UI.enterSaveSafe=function(d){try{return UI.enterSave(d)}catch(e){return console.error(e),UI.noteError&&UI.noteError(e,"load"),' +
        'UI.clkStop&&UI.clkStop(),UI.screen="title",UI.ov=null,UI.render(),UI.toast("That save could not be opened: "+(e&&e.message||e)+"."),!1}},' +
        'UI.enterSave=function(d){return SAVES.clean(d),UI.clkStop&&',
    ], [
      'd: "+e.message+"."),!1}return UI.enterSave(d)},UI.continueGame=',
      'd: "+e.message+"."),!1}return UI.enterSaveSafe(d)},UI.continueGame=',
    ], [
      'return d?d.S?UI.enterSave(d):(UI.toast("Every save',
      'return d?d.S?UI.enterSaveSafe(d):(UI.toast("Every save',
    ]],
  },
  {
    id: 'SEC-LOG-CLASS',
    blob: 'ardan-core',
    why: 'Escape the story-log line class where it is written into markup (second layer behind SEC-SAVE-CLEAN).',
    edits: [['class="ll ${c}">', 'class="ll ${UI.esc(c)}">']],
  },
  {
    id: 'ENG-STYLE-RNG',
    blob: 'ardan-core',
    why: 'Looking at a fighter changed the world. A.fightWorth (a question) generated and saved NPC fighting styles with the ' +
      'main random stream, so rendering tier chips, odds or worth tooltips moved the dice and broke replays and problem reports. ' +
      'Now npcStyles rolls from a stream seeded by the world seed and the person, and fightWorth discards styles it only imagined; ' +
      'real styles are created by the duel code, at the same moment in every replay.',
    edits: [[
      'A.npcStyles=function(p){if(!p||p.styles||(p.styles={},!A.isAdult(p)||p.race==="beast"))return;const best=',
      'A.npcStyles=function(p){if(!p||p.styles||(p.styles={},!A.isAdult(p)||p.race==="beast"))return;const _rs=A.rngState;' +
        'let _h=2166136261;for(const ch of (A.S&&A.S.seed||0)+"|"+p.id+"|"+p.born)_h=Math.imul(_h^ch.charCodeAt(0),16777619);' +
        'A.rngState=_h>>>0||1;try{const best=',
    ], [
      'if(nat.length&&A.chance(ch)){const s=A.pick(nat);p.styles[s.id]={rank:rankFor(),xp:0}}}',
      'if(nat.length&&A.chance(ch)){const s=A.pick(nat);p.styles[s.id]={rank:rankFor(),xp:0}}}finally{A.rngState=_rs}}',
    ], [
      'A.fightWorth=function(p){if(!p||!p.st)return 0;const f=A.fighterFrom(p,{});',
      'A.fightWorth=function(p){if(!p||!p.st)return 0;const _ns=p.styles===void 0,f=A.fighterFrom(p,{});_ns&&delete p.styles;',
    ]],
  },
  {
    id: 'ENG-ROSTER-PURE',
    blob: 'ardan-core',
    why: 'Opening the People tab created people: A.roster (a list for the screen) hired missing colleagues with the main random ' +
      'stream. Colleagues are now hired by the engine at the start of each month (A.ensureMates), and the roster only lists.',
    edits: [[
      'A.roster=function(pc){',
      'A.ensureMates=function(pc){if(pc&&pc.alive&&pc.job){for(pc.job.mates=(pc.job.mates||[]).filter(id=>A.P(id)&&A.P(id).alive);pc.job.mates.length<2&&A.isAdult(pc);){const n=A.makeAcquaintance(pc,"acquaint");n.occ="works beside you as "+GD.CAREERS[pc.job.c].ranks[Math.max(0,Math.min(pc.job.r,GD.CAREERS[pc.job.c].ranks.length-1))][0].toLowerCase(),n.job={c:pc.job.c,r:pc.job.r,y:A.ri(1,8),perf:A.ri(30,80),rep:A.ri(20,60)},GD.CAREERS[pc.job.c].skill&&(n.skills[GD.CAREERS[pc.job.c].skill]=A.ri(15,55)),pc.job.mates.push(n.id)}}},A.roster=function(pc){',
    ], [
      'if(pc.job){for(pc.job.mates=(pc.job.mates||[]).filter(id=>A.P(id)&&A.P(id).alive);pc.job.mates.length<2&&A.isAdult(pc);){const n=A.makeAcquaintance(pc,"acquaint");n.occ="works beside you as "+GD.CAREERS[pc.job.c].ranks[Math.max(0,Math.min(pc.job.r,GD.CAREERS[pc.job.c].ranks.length-1))][0].toLowerCase(),n.job={c:pc.job.c,r:pc.job.r,y:A.ri(1,8),perf:A.ri(30,80),rep:A.ri(20,60)},GD.CAREERS[pc.job.c].skill&&(n.skills[GD.CAREERS[pc.job.c].skill]=A.ri(15,55)),pc.job.mates.push(n.id)}for(const id of pc.job.mates)add(A.P(id),"a colleague","Beside you")}',
      'if(pc.job){for(const id of pc.job.mates||[])add(A.P(id),"a colleague","Beside you")}',
    ], [
      'console.error("onMonth",e)}A.monthEvents(pc)},A.monthEvents=',
      'console.error("onMonth",e)}A.ensureMates(pc),A.monthEvents(pc)},A.monthEvents=',
    ]],
  },
  {
    id: 'ENG-GEAR-ROLL',
    blob: 'ardan-core',
    why: 'A.gearAvailable rolled A.ri(0,1)<2, which is always true, so drawing the Holdings tab burned random numbers for nothing.',
    edits: [['p.owner))&&A.ri(0,1)<2&&!pc.flags.dwarfFriend', 'p.owner))&&!pc.flags.dwarfFriend']],
  },
  {
    id: 'EVT-TOKEN-DIGITS',
    blob: 'ardan-core',
    why: 'Tokens with digits ({mate2}, {h1}, {m2him}, {cap2}, {age2}, {n1}...) were neither filled nor caught, so 39 events ' +
      'showed raw braces ("You owe {mate2} {debt} suns"). The values were already in the context; allow digits in both patterns.',
    edits: [
      ['return str.replace(/\\{([a-zA-Z_.]+)\\}/g,', 'return str.replace(/\\{([a-zA-Z0-9_.]+)\\}/g,'],
      ['(v.skip=!!(q.ctx&&q.ctx.skip)||/\\{[a-zA-Z_.]+\\}/.test(', '(v.skip=!!(q.ctx&&q.ctx.skip)||/\\{[a-zA-Z0-9_.]+\\}/.test('],
    ],
  },
  {
    id: 'EVT-DELEG-COUSIN',
    blob: 'ardan-content',
    why: 'st_deleg_cousin used {they}, which is not a token, so the event was always dropped after using up its roll.',
    edits: [['You hear afterwards that {they} is the cousin', 'You hear afterwards that {them} is the cousin']],
  },
  {
    id: 'EVT-SERV-SECRET',
    blob: 'ardan-content',
    why: 'wk_serv_secret: one of its four secrets contains {enemy}, which this pack never filled, so the event was dropped 1 time in 4.',
    edits: [[
      'setup:(p,ctx)=>{ctx.secret=A.pick(["the steward has been selling',
      'setup:(p,ctx)=>{ctx.secret=A.T(A.pick(["the steward has been selling',
    ], [
      '"the mistress has a lover among the household knights"])},text:"Servants know everything.',
      '"the mistress has a lover among the household knights"]))},text:"Servants know everything.',
    ]],
  },
  {
    id: 'EVT-TEXT-DIET',
    blob: 'ardan-content',
    why: 'The text diet (event text <= 80 words, choices <= 12) had three misses: two 13-word choices, and rl_sec_calf, ' +
      'whose 59-word intro plus the public story it pulls from the lore rendered at about 83 words.',
    edits: [
      ['Leave the law as it is and swear the lords to it again', 'Keep the law and swear the lords to it again'],
      ["Go, and tell the officer what you have overheard at your master's table", "Go, and report what you overheard at your master's table"],
      ['intro:()=>"A clerk in Amberport\'s harbor market is throwing out old rolls. One line catches your eye: a pale elephant calf, sold in 1101 to buyers from a Ranpuri temple, paid in gold. The white elephant Moon-Pearl has no calf, people say, and the dream of Ranpur ends when she dies. Or does she have one?"',
        'intro:()=>"A clerk in Amberport\'s harbor market is throwing out old rolls. One line: a pale elephant calf, sold in 1101 to a Ranpuri temple, paid in gold. The white elephant Moon-Pearl has no calf, people say, and Ranpur\'s dream ends when she dies. Or has she?"'],
    ],
  },
  {
    id: 'ENG-TRAIT-OPP',
    blob: 'ardan-core',
    why: 'Children copied parent traits without checking opposites: 12.4% of children of a brave and a craven parent were both.',
    edits: [[
      'for(const par of parents)if(par.traits.length&&A.chance(.35)){const t=A.pick(par.traits);out.includes(t)||out.push(t)}',
      'for(const par of parents)if(par.traits.length&&A.chance(.35)){const t=A.pick(par.traits),T=GD.TRAITS[t];out.includes(t)||T&&T.opp&&out.includes(T.opp)||out.push(t)}',
    ]],
  },
  {
    id: 'ENG-DUEL-TECH',
    blob: 'ardan-core',
    why: 'NPC techniques: aiTech picked a technique that did not match the announced action 25% of the time; such a technique can ' +
      'never be used, yet duelAct spent its use before noticing, after the read hint had already named it to the player. ' +
      'Now the NPC only plans techniques that fit its action, and a use is spent only when the technique is actually used.',
    edits: [[
      '.filter(o=>o.t&&(o.t.base===act||A.chance(.25))&&!(o.t.fx&&o.t.fx.ranged&&D.round>1)',
      '.filter(o=>o.t&&o.t.base===act&&!(o.t.fx&&o.t.fx.ranged&&D.round>1)',
    ], [
      'if(D.intentTech&&D.intentTech.x&&D.intentTech.x.uses>0&&(bTech=A.techUse(b,D.intentTech.x.id),bTech&&bTech.base!==bAct&&(bTech=null),bTech&&(',
      'if(D.intentTech&&D.intentTech.x&&D.intentTech.x.uses>0&&D.intentTech.t&&D.intentTech.t.base===bAct&&(bTech=A.techUse(b,D.intentTech.x.id),bTech&&(',
    ]],
  },
  {
    id: 'ENG-DUEL-DOUBLE-KO',
    blob: 'ardan-core',
    why: 'When both fighters dropped to 0 HP in the same exchange the player always won, because the foe was checked first. ' +
      'Now the one further below zero (as a share of max HP) loses; an exact tie is a coin flip.',
    edits: [[
      'D.log.push("Your knees buckle — and you refuse to fall. Not here. Not like this."),!1):b.hp<=0?(A.duelFinish(D,"win"',
      'D.log.push("Your knees buckle — and you refuse to fall. Not here. Not like this."),!1):b.hp<=0&&(a.hp>0||b.hp/b.maxHp<a.hp/a.maxHp||b.hp/b.maxHp===a.hp/a.maxHp&&A.chance(.5))?(A.duelFinish(D,"win"',
    ]],
  },
  {
    id: 'TXT-MENTOR-LEGACY',
    blob: 'ardan-core',
    why: 'The "The teacher" mastery still promised "+1 legacy", a system that was removed.',
    edits: [[
      'love you for it; your trade remembers you (+1 legacy if you die a master).",',
      'love you for it; your trade remembers you.",',
    ]],
  },
  {
    id: 'ENG-PLAN-FOLLOWS-LIFE',
    blob: 'ardan-core',
    why: 'The automatic training plan was filled once and never revisited, so the "athletics" a child gets at 6 stayed for life ' +
      '(every bot life maxed athletics and learning by 30). The plan now remembers what it chose automatically and moves on ' +
      '(to the troop weapon, the trade skill, or melee) until the player picks something; a player choice is never overridden. ' +
      'Old saves: only a stale childhood "athletics" is treated as automatic.',
    edits: [[
      'A.defaultPlan=function(pc){const P=A.plan(pc);if(!P.train&&A.age(pc)>=6&&(P.train=',
      'A.defaultPlan=function(pc){const P=A.plan(pc);if((!P.train||P.train===P.trainAuto||P.trainAuto===void 0&&P.train==="athletics"&&A.age(pc)>=12)&&A.age(pc)>=6&&(P.train=P.trainAuto=',
    ], [
      '(P.train=v||null,{ok:!0});if(part==="intensity")',
      '(P.train=v||null,P.trainAuto=null,{ok:!0});if(part==="intensity")',
    ], [
      'A.defaultPlanIfAuto=function(pc){const P=A.plan(pc);P.auto!==!1&&(!P.train||!P.aim)&&A.defaultPlan(pc)}',
      'A.defaultPlanIfAuto=function(pc){const P=A.plan(pc);P.auto!==!1&&(!P.train||P.train===P.trainAuto||P.trainAuto===void 0||!P.aim)&&A.defaultPlan(pc)}',
    ]],
  },
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
    id: 'SAVE-WARN',
    blob: 'ardan-core',
    why: 'Every autosave was silent, including failures (quota, aborted transaction), so a player could lose years without a word. ' +
      'A failed autosave now warns (at most once every 2 minutes). A manual save also asks the browser to keep the site\'s storage ' +
      '(Safari otherwise clears it after 7 days away).',
    edits: [[
      'return r.ok&&UI.ptTick&&UI.ptTick("saved",!0),silent||UI.toast(r.ok?`Saved (${r.kb} KB).`:"This browser would not keep the save — use Menu → Export to keep it as a file."),r.ok}',
      'return r.ok&&UI.ptTick&&UI.ptTick("saved",!0),!silent&&typeof navigator<"u"&&navigator.storage&&navigator.storage.persist&&navigator.storage.persist().catch(()=>{}),' +
        '(!silent||!r.ok&&Date.now()-(UI._saveWarn||0)>12e4&&(UI._saveWarn=Date.now()))&&UI.toast(r.ok?`Saved (${r.kb} KB).`:r.blocked?' +
        '"Ardan is open in another tab, so this tab is not saving. Close the other tab to save here.":' +
        '"This browser would not keep the save — use Menu → Export to keep it as a file.",r.ok?void 0:7e3),r.ok}',
    ]],
  },
  {
    id: 'SAVE-ONE-TAB',
    blob: 'ardan-core',
    why: 'Two tabs shared one save slot with no lock, so within about 3 autosaves one life overwrote the other. A Web Lock now ' +
      'lets one tab save at a time; a second tab says so, does not save, and takes over when the first one closes.',
    edits: [[
      ',SAVES.init=async function(){await SAVES.open();',
      ',SAVES.lock=function(){const L=typeof navigator<"u"&&navigator.locks;if(!L||SAVES.lockTried)return Promise.resolve();SAVES.lockTried=!0;' +
        'return new Promise(res=>{L.request("ardan-saves",{ifAvailable:!0},lk=>{if(lk)return SAVES.blocked=!1,res(),new Promise(()=>{});' +
        'SAVES.blocked=!0,res(),setTimeout(()=>UI.toast&&UI.toast("Ardan is already open in another tab. This tab will not save, so that game stays safe.",8e3),1500);' +
        'L.request("ardan-saves",()=>(SAVES.blocked=!1,UI.toast&&UI.toast("The other Ardan tab closed. This tab saves again."),new Promise(()=>{}))).catch(()=>{});return null}).catch(()=>{SAVES.blocked=!1,res()})})},' +
        'SAVES.init=async function(){await SAVES.lock();await SAVES.open();',
    ], [
      'SAVES.save=async function(S,J){const{bytes,meta}=',
      'SAVES.save=async function(S,J){if(SAVES.blocked)return{ok:!1,blocked:!0,kb:0};const{bytes,meta}=',
    ]],
  },
  {
    id: 'SAVE-NEW-LIFE-CONFIRM',
    blob: 'ardan-core',
    why: 'Starting a new life (Begin or Random) gave no warning, and three yearly autosaves later the previous life had rotated ' +
      'out of all backups. If the saved life is still going, the game now asks first and says how to keep it.',
    edits: [[
      'UI.startLife=function(){const c=UI.cr;',
      'UI.startLife=function(){if(!UI._newLifeOk){const cur=(SAVES.listCache||[]).find(x=>x&&x.slot==="cur"),m=cur&&cur.meta;' +
        'if(m&&m.alive){UI.confirm({title:"Start a new life?",text:`Your saved life (${m.name||"unnamed"}, age ${m.age}, ${m.year} AR) is still going. ' +
        'This browser keeps one life: after a few years of the new one, autosaves will push the old one out. To keep it, go back, ' +
        'continue it, and use Menu → Export first.`,yes:"Start the new life",danger:!0,run:()=>{UI._newLifeOk=!0;try{UI.startLife()}finally{UI._newLifeOk=!1}}});return}}const c=UI.cr;',
    ]],
  },
  {
    id: 'SAVE-BACKUP-MESSAGE',
    blob: 'ardan-core',
    why: 'Loading an older backup on purpose from the Menu said "The newest save was damaged".',
    edits: [[
      'd={S:null,damaged:[{why:e.message}]}}return d?d.S?UI.enterSaveSafe(d)',
      'd={S:null,damaged:[{why:e.message}]}}slot&&d&&(d.chosen=!0);return d?d.S?UI.enterSaveSafe(d)',
    ], [
      'UI.toast(d.slot&&d.slot!=="cur"?"The newest save was damaged — loaded the one before it.":"Welcome back to Ardan.")',
      'UI.toast(d.slot&&d.slot!=="cur"&&!d.chosen?"The newest save was damaged — loaded the one before it.":"Welcome back to Ardan.")',
    ]],
  },
  {
    id: 'UI-KEYBOARD',
    blob: 'ardan-core',
    why: 'Keyboard play. (1) The 1.5 s clock redraw and every action rebuilt the tab with innerHTML, dropping focus to <body>; ' +
      'focus now returns to the same control, or to the tab panel if that control is gone. (2) Enter then skipped time from <body>; ' +
      'it now skips time only when nothing at all is focused. (3) 49 of 50 clickable cards and rows (people, realms, war-room rows, ' +
      'every character-creation option) could not be reached by keyboard; every clickable element now gets tabindex and role=button ' +
      'and answers Enter and Space. (4) The game saves when the tab is hidden or closed, so closing it no longer loses up to a year.',
    edits: [[
      'UI.clockKeys&&UI.clockKeys(),UI.render()},UI.TIPS={}',
      'UI.clockKeys&&UI.clockKeys(),UI.extras(),UI.render()},' +
        'UI.focusKey=()=>{const el=document.activeElement;return!el||el===document.body||!el.closest||!el.closest("#app")?null:' +
        '{id:el.id||null,a:el.getAttribute("data-a"),v:el.getAttribute("data-v"),c:el.getAttribute("data-c"),k:el.getAttribute("data-k"),tip:el.getAttribute("data-tip"),inTab:!!el.closest("#tabbody")}},' +
        'UI.focusRestore=f=>{if(!f)return;const ae=document.activeElement;if(ae&&ae!==document.body&&document.contains(ae))return;const q=x=>CSS.escape(x);' +
        'const sel=f.id?"#"+q(f.id):f.a?`[data-a="${q(f.a)}"]`+(f.v!=null?`[data-v="${q(f.v)}"]`:""):f.c?`[data-c="${q(f.c)}"]`+(f.k!=null?`[data-k="${q(f.k)}"]`:""):f.tip?`[data-tip="${q(f.tip)}"]`:null;' +
        'let el=null;try{el=sel&&document.querySelector(sel)}catch{}if(!el&&f.inTab&&(el=document.getElementById("tabbody"),el&&!el.hasAttribute("tabindex")&&el.setAttribute("tabindex","-1")),el)try{el.focus({preventScroll:!0})}catch{}},' +
        'UI.extras=function(){if(UI._extras)return;UI._extras=!0;' +
        'document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&UI.screen==="game"&&A.S&&UI.set.autosave&&UI.save(!0)});' +
        'const up=()=>{for(const el of document.querySelectorAll("#app [data-a]:not(button):not(a):not(input):not(select):not(textarea):not(option):not([tabindex])"))el.setAttribute("tabindex","0"),el.hasAttribute("role")||el.setAttribute("role","button")};' +
        'new MutationObserver(up).observe(document.body,{childList:!0,subtree:!0}),up();' +
        'document.addEventListener("keydown",e=>{if(e.key!=="Enter"&&e.key!==" ")return;const t=e.target;t&&t.matches&&t.matches("[data-a][role=button]:not(button)")&&(e.preventDefault(),e.stopImmediatePropagation(),t.click())},!0)},' +
        'UI.TIPS={}',
    ], [
      '!UI.isControl(e.target)&&(e.preventDefault(),UI.A.age())',
      '!UI.isControl(e.target)&&e.target===document.body&&(e.preventDefault(),UI.A.age())',
    ], [
      'UI.refreshTab=function(){const tb=UI.$("#tabbody");if(!tb)return;const st=tb.scrollTop;',
      'UI.refreshTab=function(){const tb=UI.$("#tabbody");if(!tb)return;const st=tb.scrollTop,_f=UI.focusKey();',
    ], [
      'tb.innerHTML=UI.renderTab(),tb.scrollTop=st;',
      'tb.innerHTML=UI.renderTab(),tb.scrollTop=st,UI.focusRestore(_f);',
    ], [
      'UI.render();return}const pf=UI.$("#profile");',
      'UI.render();return}const _f=UI.focusKey(),pf=UI.$("#profile");',
    ], [
      'const lg=UI.$("#log");lg&&(lg.scrollTop=lg.scrollHeight)}UI.renderModal()}',
      'const lg=UI.$("#log");lg&&(lg.scrollTop=lg.scrollHeight),UI.focusRestore(_f)}UI.renderModal()}',
    ]],
  },
  {
    id: 'ENG-NOBLE-AGE',
    blob: 'ardan-core',
    why: 'A newborn noble could attend court ("You shine at court"), petition the crown, seek a council seat and ride the estate ' +
      '("You ride your lands, hear the reeves, fix the mill") — nobleAction had no age check. These need an adult now; ' +
      'the court tab still shows them, and says why.',
    edits: [[
      'A.nobleAction=function(key){const pc=A.pc();if(!pc.noble&&!["royal","noble","gentry"].includes(pc.status))return{ok:!1};',
      'A.nobleAction=function(key){const pc=A.pc();if(!pc.noble&&!["royal","noble","gentry"].includes(pc.status))return{ok:!1};if(!A.isAdult(pc))return{ok:!1,msg:"You are too young for that. For now the court is something grown-ups talk about over your head."};',
    ]],
  },
  {
    id: 'SAVE-JOURNAL-BASE',
    blob: 'ardan-core',
    why: 'A journal with no recorded game start (restarted, imported or legacy) kept its old base fingerprint across a save and ' +
      'reload, while the report sent the just-loaded state as the base, so such reports could never replay ("the save to start ' +
      'from is not the one this journal began at"). Such a journal now restarts from the loaded state; its old entries could not ' +
      'be replayed anyway.',
    edits: [[
      'A.J=J&&J.v===1&&Array.isArray(J.e)?J:{v:1,o:null,base:A.fingerprint(A.jBase),e:[]}',
      'A.J=J&&J.v===1&&Array.isArray(J.e)&&(J.o||J.base===A.fingerprint(A.jBase))?J:{v:1,o:null,base:A.fingerprint(A.jBase),e:[]}',
    ]],
  },
];
