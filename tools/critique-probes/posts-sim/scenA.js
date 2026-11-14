// The owner's path: a noble Captain is named Marshal at court (A.nobleAction 'office'), keeps only his company,
// then leaves the army and is Marshal in name only.
async function main(arg) {
  const out = [];
  A.newGame({ seed: arg.seed, race: 'human', realm: arg.realm || 'POL-01', status: 'noble', sex: 'M', startAge: 24 });
  const pc = A.pc(), rid = pc.realm;
  const en = A.enlist(pc);
  out.push({ enlist: en, rank: pc.mil && pc.mil.rank });
  L.ensureWar(rid);
  L.advanceDays(20);
  // a Captain (rank 4)
  pc.mil.rank = 4; pc.mil.rankSince = A.absDay(); A.wsAttachPC();
  L.advanceDays(3);
  out.push(L.step('captain (rank 4) at war', rid));
  // seek office at court: the crown names you Marshal (A.nobleAction 'office' with the seat forced to marshal)
  const oldMarshal = A.realm(rid).council.marshal;
  A.S.time = Math.max(A.S.time || 0, 3); delete A.S.yearActs.n_office;
  pc.fame = Math.max(pc.fame, 40); pc.skills.command = Math.max(pc.skills.command || 0, 60);
  const res = L.forced(() => A.nobleAction('office'), { chance: true, pick: 'marshal' });
  out.push({ nobleAction: res, oldMarshal: L.nm(oldMarshal), oldMarshalPosts: L.postsOf(oldMarshal) });
  A.roleCheck(pc);
  out.push(L.step('named Marshal at court (still a Captain)', rid));
  L.advanceDays(60);
  out.push(L.step('two months later', rid));
  // leave the captain's post (resign, in war a rank<6 must desert: use resign at rank... so desert, as the bug says "left")
  const rs = A.resign();
  out.push({ resign: rs });
  let how = 'resign';
  if (!rs.ok) { const d = L.forced(() => A.desert(), { chance: false }); out.push({ desert: d }); how = 'desert'; }
  out.push(L.step('after leaving the army (' + how + ')', rid));
  L.advanceDays(40);
  A.roleCheck(pc);
  out.push(L.step('40 days later', rid));
  return out;
}
