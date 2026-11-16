// Everyone titled marshal at world start and after N years: p.title (cast), p.occ, milRank 9; with the posts they hold.
async function main(arg) {
  A.newGame({ seed: arg.seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
  const snap = () => {
    const rows = [];
    for (const p of Object.values(A.S.people)) {
      if (!p.alive) continue;
      const t = [p.title, p.occ].filter(Boolean).join(' | ');
      if (/\bmarshal\b/i.test(t) && !/lists/i.test(t) || p.milRank === 9 || (p.mil && p.mil.rank === 9)) {
        const r = A.realm(p.realm);
        rows.push({ who: L.nm(p.id), realm: p.realm, title: p.title || null, occ: p.occ || null, cast: p.castId || p.cast || null, milRank: p.milRank, mainRole: A.mainRole(p), seatHolder: r && r.council && r.council.marshal === p.id, posts: L.postsOf(p.id).filter(x => !/^occ=/.test(x)) });
      }
    }
    const seats = {};
    for (const r of L.realms()) seats[r.id] = r.council && r.council.marshal ? L.nm(r.council.marshal) : null;
    return { year: A.S.year, rows, seats };
  };
  const out = [snap()];
  for (let y = 0; y < (arg.years || 0); y++) T.play(1);
  if (arg.years) out.push(snap());
  return out;
}
