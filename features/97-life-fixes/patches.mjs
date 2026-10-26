// 97-life-fixes: the smallest hooks into the release's flow; the systems are in the *.core.js files.
export default [
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
    edits: [['e=A.wpick(pool,x=>x.gscene.kinds?3:1);', 'e=A.wpick(pool,x=>(x.gscene.kinds?3:1)*(A.lfSceneW?A.lfSceneW(x):1));']],
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
