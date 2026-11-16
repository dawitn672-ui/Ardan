// Two seats at once: taking a council seat does not give up the one you hold (leaveRolesFor keeps pc.office for
// 'council' and 'army-marshal'), and the rank-9 promotion sets r.council.marshal without pc.office.
async function main(arg) {
  const out = [];
  A.newGame({ seed: arg.seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 35 });
  const pc = A.pc(), rid = pc.realm, r = A.realm(rid);
  pc.fame = 60; for (const k of ['diplomacy', 'stewardship', 'command', 'intrigue', 'faith']) pc.skills[k] = 70;
  // 1) seat after seat through the council's offer
  A.CHOICE_FN.takeSeat('treasurer');
  out.push({ step: 'took treasurer', office: pc.office, seats: Object.entries(r.council).filter(([k, v]) => v === pc.id).map(([k]) => k) });
  A.CHOICE_FN.takeSeat('chancellor');
  out.push({ step: 'took chancellor', office: pc.office, seats: Object.entries(r.council).filter(([k, v]) => v === pc.id).map(([k]) => k), mainRole: A.mainRole(pc) });
  L.advanceDays(35);
  out.push({ step: 'a month on', office: pc.office, seats: Object.entries(r.council).filter(([k, v]) => v === pc.id).map(([k]) => k) });
  // 2) the army road: a Marshal by rank (seat without pc.office), then the chancellor's seat
  A.CHOICE_FN.takeSeat('spymaster'); // reset office to something else first
  for (const k of Object.keys(r.council)) if (r.council[k] === pc.id) delete r.council[k];
  pc.office = null;
  A.enlist(pc); L.ensureWar(rid); L.advanceDays(20);
  pc.skills.command = 96; pc.mil.rank = 8; pc.mil.rankSince = A.absDay() - 99999; pc.mil.battles = 99; pc.mil.armyWins = 99; pc.literate = true; A.wsAttachPC();
  A._promoBoard = true; for (let i = 0; i < 5 && pc.mil.rank === 8; i++) L.forced(() => A.promoCheck(pc), { chance: true }); A._promoBoard = false;
  out.push({ step: 'rank 9 by promoCheck', rank: pc.mil.rank, office: pc.office, seats: Object.entries(r.council).filter(([k, v]) => v === pc.id).map(([k]) => k), posts: L.postsOf(pc.id) });
  A.CHOICE_FN.takeSeat('chancellor');
  out.push({ step: 'then took chancellor', mil: pc.mil ? pc.mil.rank : null, office: pc.office, seats: Object.entries(r.council).filter(([k, v]) => v === pc.id).map(([k]) => k), posts: L.postsOf(pc.id), mainRole: A.mainRole(pc) });
  L.advanceDays(40);
  out.push({ step: '40 days on', mil: pc.mil ? pc.mil.rank : null, office: pc.office, seats: Object.entries(r.council).filter(([k, v]) => v === pc.id).map(([k]) => k), posts: L.postsOf(pc.id) });
  return out;
}
