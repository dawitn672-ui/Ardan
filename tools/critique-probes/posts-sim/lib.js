// ---- shared in-page helpers (prepended to each job) ----
const L = {};
L.live = p => !!(p && p.alive);
L.nm = id => { const p = A.P(id); return p ? `${id}:${A.fullName ? A.fullName(p, false) : p.given}${p.alive ? '' : '(dead)'}` : `${id}:(none)`; };
L.realms = () => Object.values(A.S.realms).filter(r => r && r.alive !== false && !r.landless);
// every post a person holds, from every store
L.postsOf = function (pid) {
  const S = A.S, p = A.P(pid), out = [];
  if (!p) return out;
  for (const r of Object.values(S.realms)) {
    if (!r) continue;
    if (r.ruler === pid) out.push(`ruler:${r.id}`);
    if (r.heir === pid) out.push(`heir:${r.id}`);
    for (const k in (r.council || {})) if (r.council[k] === pid) out.push(`council.${k}:${r.id}`);
    for (const k in (r.orders || {})) if (r.orders[k] === pid) out.push(`orderMaster.${k}:${r.id}`);
    for (const o of ((r.pol && r.pol.off) || [])) if (o.pid === pid) out.push(`pol.${o.k}@${o.at}:${r.id}`);
    if (r.forces) for (const d of r.forces.divs) {
      if (d.cmd === pid) out.push(`div.cmd:${d.id}`);
      if (d.bs) d.bs.forEach((b, i) => { if (b.p) for (const s in b.p) if (b.p[s] === pid) out.push(`co.${s === '4' ? 'senior' : 'captain' + s}:${d.id}/b${i}`); });
    }
  }
  for (const a of (S.armies || [])) { if (a.gen === pid) out.push(`army.gen:${a.id}(${a.realm})`); if (a.sub === pid) out.push(`army.sub:${a.id}(${a.realm})`); }
  for (const h of Object.values(S.houses || {})) if (h && h.headPid === pid && !h.extinct) out.push(`houseHead:${h.id}`);
  if (p.mil) out.push(`mil.rank${p.mil.rank}${p.mil.merc ? '(merc)' : ''}:${p.mil.realm}`);
  if (p.milRank != null) out.push(`milRank${p.milRank}`);
  if (p.office) out.push(`office.${p.office}`);
  if (p.order) out.push(`order.${p.order.id}#${p.order.rank}`);
  if (p.company) out.push(`freeCompany:${p.company.name}`);
  if (p.job) out.push(`job.${p.job.c}#${p.job.r}`);
  if (p.noble) out.push(`noble.rung${p.noble.rung}${p.noble.court ? '/' + p.noble.court : ''}`);
  if (p.occ) out.push(`occ="${p.occ}"`);
  return out;
};
L.pcView = function () {
  const pc = A.pc(); if (!pc) return null;
  const r = A.realm(pc.mil ? pc.mil.realm || pc.realm : pc.realm);
  const role = A.cmdRole ? A.cmdRole(pc) : null;
  const sup = A.superior ? A.superior(pc) : null;
  let chain = '';
  try { chain = UI.chainOfCommand ? UI.chainOfCommand(pc).replace(/<[^>]+>/g, '|').replace(/\|+/g, '|') : ''; } catch (e) { chain = 'ERR ' + e.message; }
  return {
    year: A.S.year, age: A.age(pc), id: pc.id, alive: pc.alive, status: pc.status, realm: pc.realm,
    mil: pc.mil ? { rank: pc.mil.rank, title: GD.MIL[pc.mil.rank] && GD.MIL[pc.mil.rank].title, realm: pc.mil.realm, div: pc.mil.div, army: pc.mil.army, co: pc.mil.co, cmdr: pc.mil.cmdr, merit: Math.round(pc.mil.merit || 0), unit: pc.mil.unit } : null,
    office: pc.office || null, mainRole: A.mainRole ? A.mainRole(pc) : null,
    cmdRole: role ? { key: role.key, title: role.title, armies: [...role.armies], divs: role.divs.size } : null,
    v2rank: A.V2W && A.V2W.rank ? A.V2W.rank(pc) : null, v2leads: A.V2W && A.V2W.leads ? A.V2W.leads(pc) : null,
    superior: sup ? { id: sup.id, occ: sup.occ, milRank: sup.milRank } : null,
    councilMarshal: r && r.council ? L.nm(r.council.marshal) : null,
    posts: L.postsOf(pc.id), chain, canRoom: A.V2W && A.V2W.canRoom ? A.V2W.canRoom(pc) : null, inWar: A.V2W && A.V2W.inWar ? A.V2W.inWar(pc) : null, side: A.V2W && A.V2W.side ? A.V2W.side(pc) : null,
  };
};
// counts of contradictions in one world
L.census = function () {
  const S = A.S, out = { realms: 0, councilMarshal: 0, marshalTitleOthers: 0, marshalTitleOthersRealms: 0, milRank9Others: 0,
    armies: (S.armies || []).length, armiesNoGen: 0, armiesDeadGen: 0, genTwoArmies: 0, genAlsoCouncilNonMarshal: 0, genIsCouncilMarshal: 0, genIsRuler: 0, genForeign: 0, genPrisoner: 0,
    divsCmd: 0, divCmdAlsoGen: 0, divCmdTwoDivs: 0, divCmdDead: 0,
    personTwoCouncilSeats: 0, councillorDead: 0, councillorForeign: 0, councillorIsRuler: 0,
    orderMasterAlsoGen: 0, orderMasterAlsoCouncil: 0, orderDivCmdNotMaster: 0,
    polHolderAlsoGen: 0, polHolderAlsoCouncil: 0, polHolderAlsoDivCmd: 0,
    coCaptainTwoSlots: 0, coCaptainDead: 0, coCaptainAlsoGen: 0,
    occMarshalNotSeat: [], occGeneralNotGen: 0, samples: [], marshalOccAny: 0, marshalOccAnyRealms: 0, anySamples: [] };
  const genOf = new Map(), cmdOf = new Map(), seatOf = new Map(), polOf = new Map(), coOf = new Map(), masterOf = new Map();
  const add = (m, k, v) => { if (!m.has(k)) m.set(k, []); m.get(k).push(v); };
  for (const a of S.armies || []) { if (!a.gen) out.armiesNoGen++; else { const g = A.P(a.gen); if (!L.live(g)) out.armiesDeadGen++; add(genOf, a.gen, a.id + '@' + a.realm); if (g && g.realm && g.realm !== a.realm) out.genForeign++; if (g && g.prison) out.genPrisoner++; } }
  for (const r of L.realms()) {
    out.realms++;
    for (const k in (r.council || {})) { const pid = r.council[k]; if (!A.COUNCIL[k]) continue; add(seatOf, pid, k + '@' + r.id); const p = A.P(pid); if (!L.live(p)) out.councillorDead++; else { if (p.realm !== r.id) out.councillorForeign++; if (p.ruler) out.councillorIsRuler++; } }
    for (const k in (r.orders || {})) add(masterOf, r.orders[k], k + '@' + r.id);
    for (const o of ((r.pol && r.pol.off) || [])) if (o.pid) add(polOf, o.pid, o.k + '@' + r.id);
    if (r.forces) for (const d of r.forces.divs) {
      if (d.cmd) { out.divsCmd++; add(cmdOf, d.cmd, d.id); if (!L.live(A.P(d.cmd))) out.divCmdDead++; if (d.elite && r.orders && r.orders[d.elite] !== d.cmd) out.orderDivCmdNotMaster++; }
      if (d.bs) d.bs.forEach((b, i) => { if (b.p) for (const s in b.p) { add(coOf, b.p[s], d.id + '/' + i + '/' + s); if (!L.live(A.P(b.p[s]))) out.coCaptainDead++; } });
    }
    const ms = r.council && r.council.marshal;
    if (ms) out.councilMarshal++;
    // others carrying the marshal title of this realm
    const short = A.realmShort ? A.realmShort(r.id) : r.short;
    let others = 0;
    for (const p of Object.values(S.people)) {
      if (!p.alive || p.id === ms) continue;
      const t = String(p.occ || '');
      const rx = new RegExp('^Marshal of (the )?' + String(short).replace(/^the /i, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
      if (rx.test(t)) { others++; if (out.samples.length < 12) out.samples.push({ realm: r.id, seat: ms ? L.nm(ms) : null, other: L.nm(p.id), occ: t, otherPosts: L.postsOf(p.id).filter(x => !/^occ=/.test(x)) }); }
      if (p.milRank === 9 && p.realm === r.id) out.milRank9Others++;
    }
    if (others) { out.marshalTitleOthers += others; out.marshalTitleOthersRealms++; }
    // any living person of this realm whose occupation calls him a marshal (of the realm, the host, the levies...) and who does not hold the seat
    let anyM = 0;
    for (const p of Object.values(S.people)) if (p.alive && p.id !== ms && p.realm === r.id && /\bmarshal\b/i.test(String(p.occ || '')) && !/lists/i.test(String(p.occ || ''))) { anyM++; if (out.anySamples.length < 12) out.anySamples.push({ realm: r.id, seat: ms ? L.nm(ms) : null, other: L.nm(p.id), occ: p.occ }); }
    if (anyM) { out.marshalOccAny += anyM; out.marshalOccAnyRealms++; }
  }
  for (const [pid, l] of genOf) {
    if (l.length > 1) out.genTwoArmies++;
    const seats = seatOf.get(pid) || [];
    if (seats.some(s => s.startsWith('marshal@'))) out.genIsCouncilMarshal++;
    if (seats.some(s => !s.startsWith('marshal@'))) out.genAlsoCouncilNonMarshal++;
    const p = A.P(pid); if (p && p.ruler) out.genIsRuler++;
    if (cmdOf.has(pid)) out.divCmdAlsoGen++;
    if (masterOf.has(pid)) out.orderMasterAlsoGen++;
    if (polOf.has(pid)) out.polHolderAlsoGen++;
    if (coOf.has(pid)) out.coCaptainAlsoGen++;
  }
  for (const [pid, l] of cmdOf) if (l.length > 1) out.divCmdTwoDivs++;
  for (const [pid, l] of seatOf) if (l.length > 1) out.personTwoCouncilSeats++;
  for (const [pid] of masterOf) if (seatOf.has(pid)) out.orderMasterAlsoCouncil++;
  for (const [pid] of polOf) { if (seatOf.has(pid)) out.polHolderAlsoCouncil++; if (cmdOf.has(pid)) out.polHolderAlsoDivCmd++; }
  for (const [pid, l] of coOf) if (l.length > 1) out.coCaptainTwoSlots++;
  // people titled General who command no army
  for (const p of Object.values(S.people)) if (p.alive && /^(a general|General)/.test(String(p.occ || '')) && !genOf.has(p.id)) out.occGeneralNotGen++;
  return out;
};
