// A soldier's life: enlist at 18-20 and play 20 years with the bot (T.play: events auto-answered, prompts skipped).
// Each year: the player's posts in every store, contradictions found, and the world census.
async function main(arg) {
  A.newGame({ seed: arg.seed, race: 'human', realm: arg.realm || 'POL-01', status: arg.status, sex: 'M', startAge: arg.age || 19 });
  const pc0 = A.pc(), rid = pc0.realm;
  const en = A.enlist(pc0);
  const years = [], flags = [];
  const flag = (y, k, v) => { flags.push({ y, k, v }); };
  let lastRank = pc0.mil ? pc0.mil.rank : null;
  const t0 = performance.now();
  for (let i = 0; i < arg.years; i++) {
    const st = T.play(1);
    const pc = A.pc();
    if (!pc || !pc.alive) { years.push({ y: A.S.year, dead: true, cause: pc && pc.cause }); break; }
    if (arg.seekOffice && A.isAdult(pc) && !pc.office) {
      A.S.time = Math.max(A.S.time || 0, 1);
      if (!A.S.yearActs.n_office) { const r = A.nobleAction('office'); if (r && r.ok && pc.office) flag(A.S.year, 'namedToSeat', { seat: pc.office, rank: pc.mil ? pc.mil.rank : null }); A.roleCheck(pc); }
    }
    const v = L.pcView();
    const r = A.realm(pc.realm);
    const myArmies = (A.S.armies || []).filter(a => a.gen === pc.id).map(a => a.id);
    const rank = pc.mil ? pc.mil.rank : null;
    // contradictions
    if (pc.office === 'marshal' && (!pc.mil || pc.mil.rank < 9)) flag(A.S.year, 'marshalSeatButRank', { rank, cmdRole: v.cmdRole.key });
    if (pc.mil && pc.mil.rank >= 9 && r && r.council && r.council.marshal !== pc.id) flag(A.S.year, 'rank9NotSeat', { seat: L.nm(r.council.marshal) });
    if (pc.mil && pc.mil.rank >= 7 && A.atWar(pc.mil.realm).length && !myArmies.length) flag(A.S.year, 'generalNoArmy', { rank });
    if (!pc.mil && v.posts.some(p => /^(army\.gen|army\.sub|div\.cmd|co\.)/.test(p))) flag(A.S.year, 'ghostCommand', v.posts.filter(p => /^(army|div|co)\./.test(p)));
    if (pc.mil && v.posts.filter(p => /^co\./.test(p)).length > 1) flag(A.S.year, 'twoCompanySlots', v.posts);
    if (pc.mil && pc.mil.rank === 6 && v.posts.some(p => /^div\.cmd/.test(p)) && v.posts.some(p => /^co\.senior/.test(p))) flag(A.S.year, 'divCmdAndSeniorCaptain', v.posts);
    if (rank !== lastRank) flag(A.S.year, 'rankChange', { from: lastRank, to: rank, posts: v.posts });
    lastRank = rank;
    years.push({ y: A.S.year, age: v.age, rank, office: pc.office || null, mainRole: v.mainRole, cmdRole: v.cmdRole.key, v2rank: v.v2rank, leads: v.v2leads, superior: v.superior, posts: v.posts, census: arg.census === false ? null : L.census() });
  }
  return { seed: arg.seed, status: arg.status, enlist: en, secsPerYear: (performance.now() - t0) / 1000 / Math.max(1, years.length), flags, years };
}
