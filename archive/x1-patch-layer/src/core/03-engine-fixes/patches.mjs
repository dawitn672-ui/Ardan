// Engine fixes: exact find/replace edits on the minified build. See README.md.
export default [
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
    id: 'ENG-OCC-SEX',
    blob: 'ardan-core',
    why: 'Occupations were picked without regard to sex, so a noble father could be "a lady of the house" and a mother "a lord" ' +
      '(seen in the birth line of a noble life). A.occPick filters the gendered titles by sex; it still draws exactly one random number.',
    edits: [[
      'royal:["of the blood royal"]},A.parentAgeRange=',
      'royal:["of the blood royal"]},A.occPick=function(st,sex){const L=A.OCC[st]||A.OCC.peasant,l=L.filter(o=>sex==="F"?o!=="a lord":o!=="a lady of the house");return A.pick(l.length?l:L)},A.parentAgeRange=',
    ], [
      'A.pick(A.OCC[status]||A.OCC.peasant)', 'A.occPick(status,p.sex)', 2,
    ], [
      'A.pick(A.OCC[p.status]||A.OCC.peasant)', 'A.occPick(p.status,p.sex)',
    ]],
  },
  {
    id: 'ENG-EVENT-TEXT-GUARD',
    blob: 'ardan-core',
    why: 'eventView caught a throwing setup (the event is dropped) but not a throwing text, so one bad text function froze the game ' +
      'on the event screen. Seen in a bot life: pl_royal_wedding_guest reads A.realm(p.realm).capital, and about twenty other ' +
      'release texts read A.realm(p.realm) unguarded. A text that throws now drops the event the same way a setup does.',
    edits: [[
      'const ctx=A.ctxTokens(pc,q.ctx);let text=typeof e.text=="function"?e.text(pc,q.ctx):e.text;text=A.T(text,ctx);',
      'const ctx=A.ctxTokens(pc,q.ctx);let text;try{text=typeof e.text=="function"?e.text(pc,q.ctx):e.text}catch(err){q.ctx.skip=1,text="",A.S.debug&&console.error("text",e.id,err)}text=A.T(text,ctx);',
    ]],
  },
  {
    id: 'ENG-COIN-FINITE',
    blob: 'ardan-core',
    why: 'The coin effect took any number, and NaN is a number: a scene whose payout was never worked out (its setup failed, ' +
      'and something resolved it anyway) set the player\'s purse to NaN for the rest of the life. Found by the exploit test: ' +
      'ni_deal_profit after a failed setup. A coin effect that is not a finite number now counts as nothing.',
    edits: [[
      'case"coin":{const amt=typeof v=="number"?v:0;',
      'case"coin":{const amt=typeof v=="number"&&Number.isFinite(v)?v:0;',
    ]],
  },
  {
    id: 'ENG-DEATH-CAUSE',
    blob: 'ardan-core',
    why: 'A death right after a hurt was put down to a natural cause. mortalCheck calls a death from health long gone "natural" ' +
      'when the last hurt is over 40 days old, but the day of the last hurt is stamped only by the daily tick (onDay). A duel, ' +
      'a beast, a battle or an event that drops health to 0 calls mortalCheck at once, before that tick, so it read the stamp ' +
      'of some older hurt: gored by the Hell Boar at 16, the obituary said "marsh fever" (every one of 7 such deaths logged in 12 ' +
      'Varenna bot lives). The tick now also notes the health it saw: a named hurt that took health from above 0 since then is today\'s. ' +
      'An event\'s health loss with no cause of its own keeps the old name, so for it the release\'s rule stands, unless the name ' +
      'itself is new since the tick (a beast fought the same day).',
    edits: [[
      'A.onDay.push(pc=>{pc.lastHurt!==pc._lh&&(pc._lh=pc.lastHurt,pc._lhDay=A.absDay?A.absDay():0)})',
      'A.onDay.push(pc=>{pc.lastHurt!==pc._lh&&(pc._lh=pc.lastHurt,pc._lhDay=A.absDay?A.absDay():0),pc._hTick=pc.health,pc._lhAnon=0})',
    ], [
      'cause===pc.lastHurt&&A.absDay&&A.absDay()-(pc._lhDay||0)>40&&(cause=A.naturalCause(pc))',
      'cause===pc.lastHurt&&!(pc._hTick>0&&(!pc._lhAnon||pc._lh!==pc.lastHurt))&&A.absDay&&A.absDay()-(pc._lhDay||0)>40&&(cause=A.naturalCause(pc))',
    ], [
      'v<0&&(pc.lastHurt=fx.cause||pc.lastHurt||"an injury")',
      'v<0&&(fx.cause||(pc._lhAnon=1),pc.lastHurt=fx.cause||pc.lastHurt||"an injury")',
    ]],
  },
];
