// The council's offer: a General of renown is offered the Marshal's seat (A.seatOffers -> takeSeat, 994 lets rank 7 in).
async function main(arg) {
  const out = [];
  A.newGame({ seed: arg.seed, race: 'human', realm: arg.realm || 'POL-01', status: arg.status || 'noble', sex: 'M', startAge: 30 });
  const pc = A.pc(), rid = pc.realm;
  A.enlist(pc);
  L.ensureWar(rid);
  L.advanceDays(25);
  pc.skills.command = 90; pc.fame = 60;
  pc.mil.rank = 7; pc.mil.rankSince = A.absDay(); A.wsAttachPC();
  out.push(L.step('General (rank 7)', rid));
  out.push({ eligible: A.seatEligible(pc, 'marshal') });
  // the offer (A.seatOffers continues only when A.chance(.88) fails), then accepting it
  const q0 = A.S.queue.length;
  L.forced(() => A.seatOffers(pc), { chance: false });
  const offer = A.S.queue.slice(q0).find(q => q.type === 'choice' && (q.options || []).some(o => o.fn === 'takeSeat'));
  out.push({ offer: offer ? { title: offer.title, text: offer.text, seat: offer.options[0].arg } : null });
  A.CHOICE_FN.takeSeat(offer ? offer.options[0].arg : 'marshal');
  if (offer) A.S.queue.splice(A.S.queue.indexOf(offer), 1);
  out.push(L.step('took the seat (takeSeat)', rid));
  L.advanceDays(30);
  out.push(L.step('30 days later', rid));
  return out;
}
