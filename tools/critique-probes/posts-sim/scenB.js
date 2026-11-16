// The army ladder: General (7) -> High General (8) -> Marshal (9) through the release's own promotion code
// (A.promoCheck -> promoCheckNow), with the dice forced to say yes; then resignation.
async function main(arg) {
  const out = [];
  A.newGame({ seed: arg.seed, race: 'human', realm: arg.realm || 'POL-01', status: arg.status || 'noble', sex: 'M', startAge: 30 });
  const pc = A.pc(), rid = pc.realm;
  A.enlist(pc);
  L.ensureWar(rid);
  L.advanceDays(25);
  pc.skills.command = 96; pc.skills.tactics = 80; pc.fame = 60;
  // Commander (6): his division
  pc.mil.rank = 6; pc.mil.rankSince = A.absDay(); A.wsAttachPC();
  out.push(L.step('Commander (rank 6)', rid));
  // General (7): one army
  pc.mil.rank = 7; pc.mil.rankSince = A.absDay(); A.wsAttachPC();
  out.push(L.step('General (rank 7)', rid));
  // High General (8), and the yearly superior check (A.obligationsYear makes a new superior one rank up)
  pc.mil.rank = 8; pc.mil.rankSince = A.absDay(); A.wsAttachPC(); A.obligationsYear(pc);
  out.push(L.step('High General (rank 8) + obligationsYear', rid));
  // Marshal (9) by the promotion board, forced
  pc.mil.rankSince = A.absDay() - 99999; pc.mil.battles = 99; pc.mil.armyWins = 99; pc.mil.divWins = 99; pc.mil.merit = 99999; pc.literate = true;
  const board = A.promoBoard(pc);
  A._promoBoard = true;
  const r0 = pc.mil.rank;
  for (let i = 0; i < 5 && pc.mil.rank === r0; i++) L.forced(() => A.promoCheck(pc), { chance: true });
  A._promoBoard = false;
  out.push({ board: board.map(b => [b.k, b.ok, String(b.have)]), promotedTo: pc.mil.rank });
  out.push(L.step('Marshal (rank 9) via promoCheck', rid));
  L.advanceDays(40); A.obligationsYear(pc);
  out.push(L.step('40 days later', rid));
  // leaving: resign (rank >= 6 may resign in war)
  const rs = A.resign();
  out.push({ resign: rs });
  out.push(L.step('after resign', rid));
  L.advanceDays(30);
  out.push(L.step('30 days after resign', rid));
  return out;
}
