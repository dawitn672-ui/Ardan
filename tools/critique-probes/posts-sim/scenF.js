// Several armies: a General is given one (not the largest); High General gets two "subs"; the Marshal's promotion
// leaves every other army's general in place.
async function main(arg) {
  const out = [];
  A.newGame({ seed: arg.seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
  const pc = A.pc(), rid = pc.realm;
  A.enlist(pc); L.ensureWar(rid); L.advanceDays(25);
  // split the host into three armies with the release's own constructor (generals from A.wsGeneralFor)
  const a0 = A.armiesOf(rid)[0];
  if (a0 && a0.divs.length >= 6) {
    const n = a0.divs.length, third = Math.floor(n / 3);
    A.wsNewArmy(rid, a0.divs.slice(n - third), A.wsGeneralFor(rid));
    A.wsNewArmy(rid, a0.divs.slice(n - 2 * third, n - third), A.wsGeneralFor(rid));
    A.armySync(a0);
  }
  out.push(L.step('three armies', rid));
  pc.skills.command = 96; pc.fame = 60;
  for (const r of [7, 8]) { pc.mil.rank = r; pc.mil.rankSince = A.absDay(); A.wsAttachPC(); if (r === 8) A.obligationsYear(pc); out.push(L.step('rank ' + r + ' ' + GD.MIL[r].title, rid)); }
  pc.mil.rankSince = A.absDay() - 99999; pc.mil.battles = 99; pc.mil.armyWins = 99; pc.literate = true;
  A._promoBoard = true; for (let i = 0; i < 5 && pc.mil.rank === 8; i++) L.forced(() => A.promoCheck(pc), { chance: true }); A._promoBoard = false;
  out.push(L.step('rank ' + pc.mil.rank + ' after promoCheck', rid));
  L.advanceDays(20);
  out.push(L.step('20 days on', rid));
  return out;
}
