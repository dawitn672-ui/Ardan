// ---- census 2: stale titles against the stores that should back them ----
L.census2 = function () {
  const S = A.S, out = { realms: 0, seatMarshal: 0, realmsWithOtherMarshalTitle: 0, otherMarshalTitled: 0, otherMarshalBy: {}, coAtStale: 0, companiesTwoClaimants: 0, seniorTwoClaimants: 0,
    genOcc: 0, genOccNoArmy: 0, milRankPeople: 0, milRankNoPost: 0, armiesOneRealm: {}, realmsTwoArmyGenSame: 0, samples: [] };
  const genIds = new Set((S.armies || []).map(a => a.gen).filter(Boolean));
  const claim = new Map();   // "div/b/s" -> [pid]
  for (const r of L.realms()) {
    out.realms++;
    const ms = r.council && r.council.marshal; if (ms) out.seatMarshal++;
    let n = 0;
    for (const p of Object.values(S.people)) {
      if (!p.alive || p.id === ms || p.realm !== r.id) continue;
      const t = [p.title, p.occ].filter(Boolean).join(' | ');
      let why = null;
      if (/\bmarshal\b/i.test(t) && !/lists/i.test(t)) why = p.title && /marshal/i.test(p.title) ? 'cast title' : /^Marshal of /.test(p.occ || '') ? (p.milRank === 9 ? 'fabricated superior (milRank 9)' : 'council occ left behind') : 'family/other occ';
      else if (p.milRank === 9) why = 'milRank 9';
      if (why) { n++; out.otherMarshalBy[why] = (out.otherMarshalBy[why] || 0) + 1; if (out.samples.length < 15) out.samples.push({ realm: r.id, seat: ms ? L.nm(ms) : null, other: L.nm(p.id), title: p.title || null, occ: p.occ || null, why, posts: L.postsOf(p.id).filter(x => !/^occ=/.test(x)) }); }
    }
    if (n) { out.realmsWithOtherMarshalTitle++; out.otherMarshalTitled += n; }
    if (r.forces) for (const d of r.forces.divs) if (d.bs) d.bs.forEach((b, i) => { if (b.p) for (const s in b.p) { const k = d.id + '/' + i + '/' + s; if (!claim.has(k)) claim.set(k, new Set()); claim.get(k).add(b.p[s]); } });
  }
  for (const p of Object.values(S.people)) {
    if (!p.alive) continue;
    if (p.coAt) {
      const d = A.divById(p.coAt.d), b = d && d.bs && d.bs[p.coAt.b];
      const holder = b && b.p ? b.p[p.coAt.s] : null;
      if (holder !== p.id) { out.coAtStale++; const k = p.coAt.d + '/' + p.coAt.b + '/' + p.coAt.s; if (!claim.has(k)) claim.set(k, new Set()); claim.get(k).add(p.id); }
    }
    if (p.milRank != null) { out.milRankPeople++; if (!L.postsOf(p.id).some(x => /^(army|div|co|council|orderMaster|pol)\./.test(x))) out.milRankNoPost++; }
    if (/^(a general|General)\b/.test(String(p.occ || ''))) { out.genOcc++; if (!genIds.has(p.id)) out.genOccNoArmy++; }
  }
  for (const [k, set] of claim) if (set.size > 1) { if (/\/4$/.test(k)) out.seniorTwoClaimants++; else out.companiesTwoClaimants++; }
  return out;
};
