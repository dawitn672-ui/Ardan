// 99972-unit-work (P3, owner order 54, D-062 addendum): a soldier's unit gets work from its war, its post and its
// officer, month by month, and the first mission comes within months, by reason.
//
// The owner: "when in an army it took a year and months to be given my first mission." The release queued a soldier's
// mission once a year, at the year's turn (A.milYear): at war always, at peace on a coin of 55%. A man who enlisted in
// February waited to the next January at best, and at peace one year in two passed with nothing. Now, every month:
//
//  - a NEW MAN is tried: his officer wants to see what he is made of; the first mission comes in his first months (more
//    likely each month, and by the fourth month it comes);
//  - AT WAR the unit's war sends it out (scouting, raids, ambushes, the crossing to hold): often, more for a rank that
//    leads men;
//  - AT PEACE the post's work: patrols, escorts, outlaws. More when the realm is unsteady (outlaws on the roads), when
//    the officer thinks well of you (he picks men he trusts), and for the ranks that are sent first;
//  - never two within six weeks of each other, never in prison, never for a commander (rank 7 and up keeps the War
//    Room), and never while one waits to be answered.
// Each mission says who sent it and why ("March: Sergeant Odo wants to see what the new man is made of."). The yearly
// mission of A.milYear is skipped when the unit has already had work in the last three months.
//
// Engine code: A.chance only; the reason is read from the world (the war, the realm's stability, the officer's opinion).
(function () {
  if (typeof A === 'undefined') return;
  const UW = A.UNITWORK = A.UNITWORK || {};
  UW.GAP = 45;          // days between two missions at least
  UW.FIRST = 100;       // a new man's first mission comes by then
  UW.RECENT = 90;       // the yearly mission waits if the unit had work this recently
  const monthName = () => { try { return GD.MONTHS[A.monthOf(A.today()).m]; } catch (e) { return ''; } };
  UW.onDuty = pc => !!(pc && pc.alive && pc.mil && pc.id === A.S.pc && !pc.prison && (!pc.mil.merc || pc.mil.contract) && (pc.mil.rank || 0) < 7 && A.isAdult(pc));
  UW.recent = (pc, days) => { const m = pc && pc.mil; return !!(m && m.lastMisD != null && A.absDay() - m.lastMisD < (days || UW.RECENT)); };
  // who sends you, in words
  UW.sender = pc => {
    const b = A.superior ? A.superior(pc) : null, t = b && A.superiorTitle ? A.superiorTitle(pc) : '';
    return b ? `${t ? t + ' ' : ''}${b.given}` : 'Your captain';
  };
  // this month's odds and the reason, from the unit's war, its post and its officer: { p, why, war, enemy }
  UW.reason = function (pc) {
    const m = pc.mil, now = A.absDay(), realm = m.merc ? m.contract : m.realm, R = A.realm(realm);
    const who = UW.sender(pc), wars = realm && A.atWar ? A.atWar(realm) : [];
    if (!m.missions && m.lastMisD == null) {
      const since = now - (m.joinD != null ? m.joinD : now);
      return { p: since >= UW.FIRST ? 1 : since >= 25 ? 0.4 : 0, why: `${who} wants to see what the new man is made of` };
    }
    if (wars.length) {
      const w = A.pick(wars), enemy = A.pick(A.warSide(w, realm) === 'att' ? w.def : w.att);
      return { p: 0.4 + ((m.rank || 0) >= 2 ? 0.1 : 0), why: `${w.name}: ${who} needs men forward`, war: w, enemy };
    }
    const parts = [[0.1, `${who} sends a patrol out, and you are on the roll`]];
    if (R && (R.stability || 0) < 40) parts.push([0.12, `the roads are thick with outlaws since ${R.short || R.name} went unsteady, and ${who} is sent to clear them`]);
    const b = A.superior ? A.superior(pc) : null, op = b && b.rel && b.rel[pc.id] ? b.rel[pc.id].op || 0 : 0;
    if (op >= 30) parts.push([0.08, `${who} trusts you, and picks you for the work`]);
    if ((m.rank || 0) >= 1 && (m.rank || 0) <= 3) parts.push([0.05, `a ${GD.MIL[m.rank] ? GD.MIL[m.rank].title.toLowerCase() : 'junior man'} is sent first`]);
    return { p: parts.reduce((a, x) => a + x[0], 0), why: parts.slice().sort((a, b) => b[0] - a[0])[0][1] };
  };
  UW.month = function (pc) {
    if (!UW.onDuty(pc)) return;
    const m = pc.mil, now = A.absDay();
    if (m.joinD == null) m.joinD = now;
    if ((A.S.queue || []).some(q => q && q.type === 'mission')) return;
    if (m.lastMisD != null && now - m.lastMisD < UW.GAP) return;
    const r = UW.reason(pc);
    if (!(r.p > 0) || !A.chance(Math.min(1, r.p))) return;
    const mis = A.newMission(pc, r.enemy || null, r.war || null);
    mis.why = r.why;
    m.lastMisD = now;
    if (r.war) m.curWar = r.war.id;
    if (A.makeSquad) A.makeSquad(pc);
    A.log(`${monthName()}: ${r.why}. ${mis.title}.`, 'war');
    A.queue({ type: 'mission', m: mis });
  };
  A.onMonth.push(pc => { try { UW.month(pc); } catch (e) { console.error('unit work', e); } });
  // the day a man joins is the day he signs on (the month hook sets it only for an old save)
  const enlist0 = A.enlist;
  if (typeof enlist0 === 'function') A.enlist = function (pc) {
    const r = enlist0.apply(this, arguments);
    try { if (pc && pc.mil) { pc.mil.joinD = A.absDay(); pc.mil.lastMisD = null; } } catch (e) {}
    return r;
  };
})();
