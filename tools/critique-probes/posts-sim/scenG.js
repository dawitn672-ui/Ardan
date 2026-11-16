// What is left behind: death (with an heir), passing the torch, and a Commander in an order's division.
async function main(arg) {
  const out = [];
  A.newGame({ seed: arg.seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 44 });
  const pc = A.pc(), rid = pc.realm;
  A.enlist(pc); L.ensureWar(rid); L.advanceDays(20);
  // an heir: the oldest living relative, else a made acquaintance (only to carry the story on)
  const pickHeir = () => { const ids = Object.keys(pc.rel || {}).filter(id => { const p = A.P(id); return p && p.alive && A.isAdult(p) && p.realm === rid; }); return ids[0] || A.makeAcquaintance(pc, 'friend').id; };
  if (arg.mode === 'death6' || arg.mode === 'death7') {
    pc.mil.rank = arg.mode === 'death6' ? 6 : 7; A.wsAttachPC();
    const before = L.postsOf(pc.id); const heir = pickHeir();
    A.kill(pc, 'a lance through the visor');
    A.continueAs(heir);
    out.push({ mode: arg.mode, deadPostsBefore: before, deadPostsAfterContinue: L.postsOf(pc.id), newPc: L.nm(A.S.pc) });
    L.advanceDays(40);
    out.push({ after40: L.postsOf(pc.id), armies: L.realmSnap(rid).armies });
  }
  if (arg.mode === 'torch') {
    pc.mil.rank = 7; A.wsAttachPC(); pc.office = null;
    // the decision's own code needs an adult child: give him one (a made acquaintance relabelled as child is not
    // needed by the code path below, which only moves crown and house)
    const kid = A.makeAcquaintance(pc, 'friend'); kid.born = A.S.year - 22; pc.children = (pc.children || []).concat([kid.id]); kid.parents = [pc.id];
    const before = L.postsOf(pc.id);
    const r = A.DEC.pass_torch.run(pc, kid.id);
    out.push({ mode: 'torch', run: r, newPc: L.nm(A.S.pc), retiredPostsBefore: before, retiredPostsAfter: L.postsOf(pc.id), retiredAlive: pc.alive, retiredMil: pc.mil ? pc.mil.rank : null });
    L.advanceDays(40);
    out.push({ after40: L.postsOf(pc.id), armies: L.realmSnap(rid).armies });
  }
  if (arg.mode === 'order') {
    const id = Object.keys(GD.ORDERS).find(k => GD.ORDERS[k].realm === rid) || 'iron_wolf';
    const d = A.orderDiv(id), r = A.realm(rid);
    const gm = r.orders && r.orders[id];
    out.push({ order: id, div: d && d.id, divCmd: d && L.nm(d.cmd), grandMaster: L.nm(gm), gmPosts: L.postsOf(gm) });
    // what A.orderJoin and A.orderMonth write, then the yearly attach at rank 6
    pc.order = { id, rank: 0, since: A.absDay(), merit: 0 }; pc.mil.div = d.id; pc.mil.unit = d.name;
    pc.mil.rank = 6; A.pcDivAttach(pc);
    out.push({ afterJoinRank6: true, divCmd: d && L.nm(d.cmd), grandMaster: L.nm(r.orders[id]), gmPosts: L.postsOf(gm), pcPosts: L.postsOf(pc.id), mainRole: A.mainRole(pc) });
  }
  return out;
}
