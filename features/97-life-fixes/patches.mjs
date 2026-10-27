// 97-life-fixes: the smallest hooks into the release's flow; the systems are in the *.core.js files.
export default [
  {
    id: 'LF-THEM-NAME',
    blob: 'ardan-core',
    why: 'The {them} token named the scene\'s person by given name alone, so a second Suilan ("Suilan is going about ' +
      'saying ...") read as the patron Suilan who died twenty years before. When someone else the player knows shares ' +
      'the given name, {them} now names the person in full (A.knownName, 67-memory-weave); otherwise as before.',
    edits: [['t&&(o.them=t.given,o.themFull=A.fullName(t)', 't&&(o.them=A.knownName?A.knownName(t,pc):t.given,o.themFull=A.fullName(t)']],
  },
  {
    id: 'LF-TIER-GATES',
    blob: 'ardan-content',
    why: 'Scenes written for a commoner or a private reached the top of the ladder: a queen was told to "Flee to the woods" and ' +
      '"Turn him in for the bounty" (the home-front war scenes), danced at Harvest Home to be married off by the village, and ' +
      'kept a scribe\'s duties ("it is only a job"); a General of 62 leading 12,800 was asked "You. Name?" by a passing ' +
      'captain; a carpenter of 68 was offered the dead captain\'s ring and a sellsword\'s contract. A reigning ruler or a ' +
      'general (A.lfTop, h-words.core.js) no longer draws the home-front, harvest-dance or learned-duty scenes; the ' +
      'rank-and-file camp scenes stop at rank 3; the mercenary scenes stop at 55 (human years) and the road offers at 60. ' +
      'The guards are helpers, not C.ruler/p.mil in the cond text, so A.evAudience classes the scenes as before.',
    edits: [
      ['homeFront=(p,C)=>civ(p,C)&&C.atWar(p)', 'homeFront=(p,C)=>civ(p,C)&&C.atWar(p)&&!(A.lfTop&&A.lfTop(p))'],
      ['id:"lf_harvest_dance",cond:p=>C.adult(p)&&!C.married(p)&&!C.old(p)&&!slave(p)', 'id:"lf_harvest_dance",cond:p=>C.adult(p)&&!C.married(p)&&!C.old(p)&&!slave(p)&&!(A.lfTop&&A.lfTop(p))'],
      ['D=(careers,e,broad)=>{const extra=e.cond;return Object.assign({cool:6},e,{cond:(p,C)=>C.adult(p)&&', 'D=(careers,e,broad)=>{const extra=e.cond;return Object.assign({cool:6},e,{cond:(p,C)=>C.adult(p)&&!(A.lfTop&&A.lfTop(p))&&'],
      ['mwar=p=>!p.ruler&&', 'mwar=p=>!p.ruler&&!(A.lfOld&&A.lfOld(p,55))&&'],
      ['sword=p=>!!p.flags.av_sword||!!p.mil&&!p.ruler', 'sword=p=>!(A.lfOld&&A.lfOld(p,55))&&(!!p.flags.av_sword||!!p.mil&&!p.ruler)'],
      ['go=p=>A.C.adult(p)&&free(p)&&!p.ruler', 'go=p=>A.C.adult(p)&&free(p)&&!p.ruler&&!(A.lfOld&&A.lfOld(p,60))'],
      ...['officer', 'letter', 'drill', 'brawl', 'dice'].map(c => [`id:"camp_${c}",trigger:!0,cond:p=>!!p.mil`, `id:"camp_${c}",trigger:!0,cond:p=>!!p.mil&&!(A.lfRank&&A.lfRank(p)>3)`]),
    ],
  },
  {
    id: 'LF-CR-RULER',
    blob: 'ardan-core',
    why: 'The creation summary printed "Realm: <name> (<title> <cast ruler>)" from LORE.cast, which holds the Known World\'s ' +
      'rulers only: a far realm read "(King )", and the title ignored the ruler\'s sex. It now asks UI.crRulerNote ' +
      '(h-words.core.js), which takes the far lands\' lore ruler too, sexes the title and prints nothing without a name.',
    edits: [['<span class="muted">(${UI.esc(realm.title)} ${UI.esc(LORE.cast[realm.ruler]?LORE.cast[realm.ruler].name:"")})</span>',
      '${UI.crRulerNote?UI.crRulerNote(realm):`<span class="muted">(${UI.esc(realm.title)} ${UI.esc(LORE.cast[realm.ruler]?LORE.cast[realm.ruler].name:"")})</span>`}']],
  },
  {
    id: 'LF-BOSS-NONE',
    blob: 'ardan-core',
    why: 'With no superior, the tokens fell back to boss "your master" and bossTitle "master", so the superior scenes ' +
      '(bd_boss_test, "{bossTitle} {boss} hands you a task") read "Master your master hands you a task". bossTitle is now ' +
      'left unfilled when there is no superior, so the engine drops a scene about a superior the life does not have; ' +
      '{boss} alone still falls back to "your master".',
    edits: [['(o.boss="your master",o.bossFull="your master",o.bossTitle="master")', '(o.boss="your master",o.bossFull="your master")']],
  },
  {
    id: 'LF-ONE-SUN',
    blob: 'ardan-core',
    why: 'A.coin wrote every amount from 1 to 99 as "N suns", so a cost chip read "Costs 1 suns" and a log "you pay 1 suns". ' +
      'Exactly one sun is now "1 sun"; every other amount is written as before.',
    edits: [['n>=1?Math.round(n*10)/10+" suns"', 'n>=1?Math.round(n*10)/10+(Math.round(n*10)===10?" sun":" suns")']],
  },
  {
    id: 'LF-BOSS-PICK',
    blob: 'ardan-core',
    why: 'A.obligationsYear picked one of four superior scenes (bd_boss_test/favor/blame/rival) with A.pick, blind to what the ' +
      'life had seen, so "A rival for favor" came eight times in a working life. It now picks by the life memory\'s weights ' +
      '(A.lfPick: twice a life, ten years apart); when all four are held back the slot goes to a fresh scene.',
    edits: [[
      'evs.length&&A.queue({type:"event",ev:A.pick(evs),ctx:{pid:b.id}})',
      '{const ev0=evs.length?(A.lfPick?A.lfPick(evs,pc):A.pick(evs)):null;ev0&&A.queue({type:"event",ev:ev0,ctx:{pid:b.id}})}',
    ]],
  },
  {
    id: 'LF-GATH-ROLE',
    blob: 'ardan-core',
    why: 'Every gathering the realm attended invited the player, so a courtier\'s or a chancellor\'s life showed the same invitation, ' +
      'opening and closing scenes up to 30 times. A guest is now asked to the same kind of gathering at most every 6 years (a ' +
      'knight\'s tourney every 5) and to any at most every 3; a visiting ruler or envoy goes to optional gatherings abroad at most ' +
      'every 4 years, an envoy to war councils and congresses every 3 (A.lfGathRole). Hosts, a ruler at congresses and war ' +
      'councils, and family weddings always ask.',
    edits: [[
      'role=pc&&pc.alive?A.gathRole(pc,g):null',
      'role=pc&&pc.alive?(A.lfGathRole?A.lfGathRole(pc,g):A.gathRole(pc,g)):null',
    ]],
  },
  {
    id: 'LF-FIRST-LIFE',
    blob: 'ardan-core',
    why: 'On Hard, the default, one newborn in twenty died before five, before the player had made a choice. The creation screen ' +
      'now tells the engine whether this is the first life begun in this browser (o.firstLife, so a replay of the journal ' +
      'does the same), and the engine spares a first life the deaths of early childhood unless Realism was chosen.',
    edits: [[
      'story:A.storyFor?A.storyFor(c):null};A.newGame(o)',
      'story:A.storyFor?A.storyFor(c):null};UI.lfStartOpts&&UI.lfStartOpts(o,c);A.newGame(o)',
    ]],
  },
  {
    id: 'LF-FIRST-LIFE-SAYS',
    blob: 'ardan-core',
    why: 'The creation screen says, under the difficulty, that a first life is spared the deaths of early childhood on Story and Hard.',
    edits: [[
      '.map(d=>UI.opt(c.diff===d[0],"crSet","diff:"+d[0],d[1],d[2])).join("")}</div></div>`',
      '.map(d=>UI.opt(c.diff===d[0],"crSet","diff:"+d[0],d[1],d[2])).join("")}</div>${UI.lfFirstLine?UI.lfFirstLine(c):""}</div>`',
    ]],
  },
  {
    id: 'LF-GATH-SCENES',
    blob: 'ardan-content',
    why: 'A gathering picks its scenes (the toast, the seating, the knife in the dark) from a pool that only avoids repeats within ' +
      'the one gathering, so a courtier saw the same seating quarrel at feast after feast. The pick now also weighs each scene ' +
      'by the life memory (A.lfSceneW: a fifth for each time this life has seen it).',
    edits: [['e=A.wpick(pool,x=>x.gscene.kinds?3:1);', 'e=A.wpick(A.lfGathPool?A.lfGathPool(pool,g):pool,x=>(x.gscene.kinds?3:1)*(A.lfSceneW?A.lfSceneW(x):1));']],
  },
  {
    id: 'LF-GATH-CAP',
    blob: 'ardan-content',
    why: 'A ruler hosts and attends a gathering most years, and each shows three of its scenes, so a 37-year reign showed the ' +
      'toast, the seating quarrel, the knife in the crowd and the gift about 15 times each, and the closed-door bargain 26 ' +
      'times. A gathering scene the life has seen three times now gives way to an unseen one or to none (A.lfGathPool, in the ' +
      'pick above), and the bargain, once seen three times, is settled by the envoys off stage with a line in the log ' +
      '(A.lfGathBargain): the same influence a fair speech wins.',
    edits: [['&&!g.pc.seen.includes("gs_bargain")){g.pc.seen.push("gs_bargain"),q.after="gs_bargain";return}',
      '&&!g.pc.seen.includes("gs_bargain")&&!(A.lfGathBargain&&A.lfGathBargain(g))){g.pc.seen.push("gs_bargain"),q.after="gs_bargain";return}']],
  },
  {
    id: 'LF-POOL-PICK',
    blob: 'ardan-core',
    why: 'A.councilMonth and A.drillMonth pick a councillor\'s or a drilling soldier\'s business from a pool with only a 2- or 3-year ' +
      'cooldown, so the same war vote and the same slow recruit came back every few years. Both now pick by the life memory ' +
      '(A.lfPoolPick: twice a life, 12 years apart); when the pool is all held back the slot goes to a fresh scene.',
    edits: [[
      'e=A.wpick(pool,x=>x.w||1);e&&(A.S.evRecent=A.S.evRecent||{},A.S.evRecent[e.id]=A.S.year,A.queue({type:"event",ev:e.id,forced:!0}))',
      'e=A.lfPoolPick?A.lfPoolPick(pool,pc):A.wpick(pool,x=>x.w||1);e&&(A.S.evRecent=A.S.evRecent||{},A.S.evRecent[e.id]=A.S.year,A.queue({type:"event",ev:e.id,forced:!0}))',
      2,
    ]],
  },
  {
    id: 'LF-RULER-PICK',
    blob: 'ardan-core',
    why: 'A.rulerYear picked one of twelve scenes of a ruler\'s year (a petition, an embassy, a famine...) blind to what the reign had ' +
      'seen. It now picks by the life memory (A.lfPickIds); a scene held back is dropped at the head of the queue and refilled.',
    edits: [['ev:A.pick(["ruler_petition","ruler_embassy"', 'ev:(A.lfPickIds||A.pick)(["ruler_petition","ruler_embassy"']],
  },
  {
    id: 'LF-GATH-WANT',
    blob: 'ardan-content',
    why: 'Every gathering showed two or three of its scenes, however many the life had been to. Once the player has been through ' +
      'a gathering\'s last night before, a later one shows one scene fewer (A.lfGathWant, never fewer than one); a knight\'s ' +
      'jousts are their own sequence and are not cut.',
    edits: [['const want=role==="knight"?2:role==="ruler"||role==="envoy"?3:2;', 'const want=(A.lfGathWant||(x=>x))(role==="knight"?2:role==="ruler"||role==="envoy"?3:2);']],
  },
];
