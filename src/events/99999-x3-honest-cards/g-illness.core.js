// X3 part 2 (T4): a fatal illness is an arc, not a roll.
//
// The playtest: marsh fever killed a banker of 41 on the first of January; his health read "hale" before and on the death screen;
// there was no card, no treatment, no last scene. 49-body-mind already gives a sickness a start (a card for the treatment, bm_ill),
// a toll each month, and the health word now says "ill with ..." (b-health). What was missing is the end: the month the toll took the
// last of the body, the engine left health at nothing and the next day's mortal roll (A.mortalCheck) decided, unseen. Now:
//   onset      a card for the treatment (bm_ill, as before)
//   worsening  once, when the fever has taken the body under a third and is not done: the log says so and a card asks what the house
//              does (x3_ill_worse: send for the physician now, call the priest, or tell no one how bad it is)
//   crisis     once, when a month's toll would bring the body to nothing: the body is held at the edge and a card asks who is sent for
//              (x3_ill_crisis: the physician, the priest, or the family called to the bed): each is a check on the body and the will,
//              their prices differ (coin and a weaker body after; a long odds against piety; no price but those who must be there)
//   end        the fever breaks and the player lives (a mark may stay), or he dies of the sickness, named, in the scene's own result
// A child, or a youth not of age, is put to bed as before and has no scenes (the choices are the house's, not his); a sickness that does not reach the edge ends as
// it did. Every draw is engine code (A.chance in the check); the page reads only.
(function () {
  const BM = A.BM;
  if (!BM) return;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const X3 = A.X3 = A.X3 || {};
  const KINREL = ['child', 'father', 'mother', 'sibling'];

  // who could sit by the bed: the spouse, then a child, a parent, a brother or sister, if alive, free and there
  X3.atTheBed = function (pc) {
    try {
      const sp = pc.spouse && A.P(pc.spouse);
      if (sp && X3.present(pc, sp)) return { p: sp, word: sp.sex === 'F' ? 'your wife' : 'your husband' };
      for (const type of KINREL) {
        const rs = A.relsOf(pc, [type]).filter(x => X3.present(pc, x.p)).sort((a, b) => (a.p.id < b.p.id ? -1 : 1));
        if (rs.length) { const t = rs[0].p; return { p: t, word: 'your ' + (type === 'child' ? (t.sex === 'M' ? 'son' : 'daughter') : type === 'sibling' ? (t.sex === 'M' ? 'brother' : 'sister') : type) }; }
      }
    } catch (e) {}
    return null;
  };

  // the end of a sickness that lets go: the fever breaks, the body is spent, a mark may stay (as bmIllMonth's own end)
  X3.mend = function (pc) {
    const I = pc.ill, D = I && GD.DISEASES[I.k], name = I ? I.name : 'the sickness';
    delete pc.ill;
    pc.health = clamp(Math.max(pc.health, 0) + A.ri(10, 16), 8, A.maxHealth(pc));
    let tail = '';
    if (D && D.wound && A.chance(0.3)) { const w = A.addWound(pc, D.wound); if (w) tail = ` It leaves its mark: ${String(w).toLowerCase()}.`; }
    return `Toward morning the fever breaks. ${BM.the(name)[0].toUpperCase() + BM.the(name).slice(1)} lets go of you, and you are weak as water, and alive.${tail}`;
  };
  X3.die = function (pc, ctx) { A.pcDeath((ctx && ctx.ill) || (pc.ill && pc.ill.name) || 'a fever'); return ''; };

  // P3 CI: another blow (a cold night, a fall, an event's toll) that takes the last of a sick body before the sickness's own
  // crisis would let the mortal roll name the sickness with no scene (seed 918: frostbite at 4 health, "died of marsh
  // fever"). A grown player who is ill and has not had the crisis is held at the edge and asked, as the toll would; the
  // crisis comes once, so a second blow afterwards goes to the mortal roll as before. Called by A.mortalCheck.
  X3.illEdge = function (pc, cause) {
    const I = pc && pc.ill;
    // (S1b CI 137, seed 930: the crisis was queued and held him at 4, and a sacked town's card, taking the head of the queue,
    // took the 4 before the crisis was met: the queued crisis still decides, so he is held at the edge until it is answered)
    if (I && I.crisis && I.cr && pc.alive && pc.health <= 0 && pc.id === A.S.pc && A.S.queue.some(q => q && q.ev === 'x3_ill_crisis') && (cause == null || String(cause) === I.name)) { pc.health = 1; return true; }
    if (!I || I.crisis || !pc.alive || pc.health > 0 || pc.id !== A.S.pc || !A.isAdult(pc) || !A.EV.x3_ill_crisis) return false;
    if (cause != null && String(cause) !== I.name) return false;   // a named blow of its own (a battle, a beast) is its own death
    I.crisis = 1; X3.illAfter(pc, I, false);
    return pc.alive && pc.health > 0;
  };
  // called by A.bmIllMonth (49-body-mind) at the end of each month of a sickness: I is the sickness (it may have been deleted at its end),
  // had is whether the crisis had come before this month
  X3.illAfter = function (pc, I, had) {
    try {
      const name = I && I.name, max = pc && A.maxHealth ? A.maxHealth(pc) : 100;
      if (!I || !pc || !pc.alive || pc.id !== A.S.pc || !A.isAdult(pc)) return;
      const ctx = { ill: name, illThe: BM.the(name)[0].toUpperCase() + BM.the(name).slice(1) };
      if (!had && I.crisis && pc.health <= 0 && A.EV.x3_ill_crisis) {
        // the toll brought him to nothing: held at the edge, and asked (the mortal roll waits for the scene)
        pc.health = 4; pc.ill = I; if (!(I.m > 0)) I.m = 1;
        I.cr = 1;
        A.log(`${ctx.illThe} has you at the edge. They send for someone, anyone.`, 'bad');
        A.queue({ type: 'event', ev: 'x3_ill_crisis', forced: true, now: true, ctx });
      } else if (!I.crisis && !I.worse && I.m > 0 && pc.ill === I && pc.health < max / 3 && A.EV.x3_ill_worse) {
        I.worse = 1;
        A.log(`${ctx.illThe} is worse. The room is kept quiet now, and voices drop when you wake.`, 'bad');
        A.queue({ type: 'event', ev: 'x3_ill_worse', forced: true, now: true, ctx });
      }
    } catch (e) { console.error('x3 illness', e); }
  };
})();
