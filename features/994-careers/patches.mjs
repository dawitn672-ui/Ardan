// 994-careers: the one hook into the release's flow; the rest is careers.core.js wrapping A.endWar and A.seatEligible.
export default [
  {
    id: 'CAR-USURPER',
    blob: 'ardan-content',
    why: 'plot_throne awarded the "Usurper" achievement ("Seize a throne that was not yours") when the coup only half-succeeded ' +
      'and started a civil war, so a claimant who was crushed a year later still held it. It is now awarded when the claimant ' +
      'wins that war and is crowned (careers.core.js, A.endWar).',
    edits: [['(A.successionWar(r,p),A.ach("usurper"),"The coup half-succeeds', '(A.successionWar(r,p),"The coup half-succeeds']],
  },
  {
    id: 'CAR-MISSION-SIZE',
    blob: 'ardan-core',
    why: 'A mission\'s size was the men the player\'s rank leads, whatever the mission: a General\'s bandit hunt fought 12,800 ' +
      'and logged "Enemy dead: 5,141. Your losses: 0". A bandit hunt is now 20 to 300 men and a mission away from any war ' +
      'at most 400 (A.missionSize); a mission in a war keeps the rank\'s numbers.',
    edits: [['const size=rank<=0?10:GD.MIL[Math.min(rank,9)].leads,foeRealm', 'const size=A.missionSize?A.missionSize(type,rank,war):rank<=0?10:GD.MIL[Math.min(rank,9)].leads,foeRealm']],
  },
  {
    id: 'CAR-LEVY-LOG',
    blob: 'ardan-core',
    why: 'Calling out a realm\'s levies logged one line per division ("the 92nd ... gathers", "the 93rd ... gathers"), a dozen in ' +
      'one autumn. It now logs one line per realm a month, with the count (A.levyLog).',
    edits: [['const pc=A.pc();pc&&(pc.realm===r.id||pc.ruler===r.id)&&A.log(`${r.short} calls out the levies: the ${d.name} gathers at ${A.provName(loc)}.`,"war")}',
      'const pc=A.pc();pc&&(pc.realm===r.id||pc.ruler===r.id)&&(A.levyLog?A.levyLog(r,d,loc):A.log(`${r.short} calls out the levies: the ${d.name} gathers at ${A.provName(loc)}.`,"war"))}']],
  },
  {
    id: 'CAR-HELD-WITHOUT',
    blob: 'ardan-core',
    why: 'Every gathering the realm attended logged "The Council of X is held without you" for anyone of class 6 or more, 30 times ' +
      'in a general\'s last 300 log lines. It now says so only for a gathering that had a place for the player (A.gathRole).',
    edits: [['att.includes(pcRealm)&&A.classOf(pc)>=6&&A.log(`${A.cap(name)} is held without you.`,"")', 'att.includes(pcRealm)&&A.classOf(pc)>=6&&A.gathRole(pc,g)&&A.log(`${A.cap(name)} is held without you.`,"")']],
  },
];
