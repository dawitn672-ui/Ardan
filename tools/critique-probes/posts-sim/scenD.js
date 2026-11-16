// The lower echelons: company, battalion, division, army; who is displaced at each step, and what is left behind when
// the player leaves (resign / desert / prison / death).
async function main(arg) {
  const out = [];
  A.newGame({ seed: arg.seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 26 });
  const pc = A.pc(), rid = pc.realm;
  A.enlist(pc);
  L.ensureWar(rid);
  L.advanceDays(20);
  const slotInfo = () => {
    const m = pc.mil && pc.mil.co; if (!m || !A.CO) return null;
    const d = A.divById(m.div), b = d && d.bs[m.b]; if (!b) return null;
    const cap = A.CO.cap(d, m.b, m.i), sen = A.CO.cap(d, m.b, 4);
    return { company: A.CO.coName(d, m.b, m.i), bn: A.CO.bnName(d, m.b), coCaptain: cap ? { name: cap.name, pid: cap.pid || null, pc: !!cap.pc } : null,
      senior: sen ? { name: sen.name, pid: sen.pid || null, pc: !!sen.pc } : null, bp: b.p ? Object.assign({}, b.p) : null, vac: !!b.vac, divCmd: d.cmd ? L.nm(d.cmd) : null };
  };
  const who = id => { const p = A.P(id); return p ? { who: L.nm(id), occ: p.occ, milRank: p.milRank, posts: L.postsOf(id).filter(x => !/^occ=/.test(x)) } : null; };
  const seen = new Set();
  const snapAll = label => {
    const s = slotInfo();
    const people = [];
    if (s && s.bp) for (const k in s.bp) seen.add(s.bp[k]);
    if (s && s.coCaptain && s.coCaptain.pid) seen.add(s.coCaptain.pid);
    if (s && s.senior && s.senior.pid) seen.add(s.senior.pid);
    for (const id of seen) if (id !== pc.id) people.push(who(id));
    const st = L.step(label, rid);
    return { label, rank: pc.mil ? pc.mil.rank : null, title: pc.mil ? GD.MIL[pc.mil.rank].title : null, slots: s, displacedOrHolders: people, pc: st.pc, armies: st.realm.armies };
  };
  out.push(snapAll('rank 3 Squad Captain at enlistment'));
  for (const r of [4, 5, 6, 7]) { pc.mil.rank = r; pc.mil.rankSince = A.absDay(); A.wsAttachPC(); out.push(snapAll('rank ' + r + ' ' + GD.MIL[r].title)); }
  // back to a division command for the leave tests: rank 6
  pc.mil.rank = 6; A.wsAttachPC();
  out.push(snapAll('rank 6 again'));
  const mode = arg.mode || 'resign';
  if (mode === 'resign') out.push({ leave: A.resign() });
  if (mode === 'desert') out.push({ leave: L.forced(() => A.desert(), { chance: false }) });
  if (mode === 'prison') { A.imprison(pc, 2, 'a brawl'); out.push({ leave: 'imprisoned', prison: pc.prison }); }
  if (mode === 'captured') { out.push({ leave: 'captured', q: L.forced(() => A.RI && A.RI.maybeTaken ? A.RI.maybeTaken(pc, A.atWar(rid)[0].def[0], 'line') : null, { chance: true }) }); }
  out.push(snapAll('right after leaving: ' + mode));
  L.advanceDays(45);
  out.push(snapAll('45 days after: ' + mode));
  return out;
}
