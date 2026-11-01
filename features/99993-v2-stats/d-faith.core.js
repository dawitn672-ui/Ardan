// v2 stats, part 4: piety is no longer everyone's stat (V2_SPEC complaint 7).
//
// Faith belongs to the clergy-born (a parent in holy orders, or a family of the priestly line), to a priest, and to a
// player who takes it up (flag v2_faith, offered by the event v2s_seek_faith, never forced). For anyone else:
// - piety stays at a neutral 30 (the release's value at birth), so the events and systems that read it for everyone
//   (1,785 fx, endings, ambitions, chapters, careers) read a neutral default;
// - what an fx would have done to piety is kept as a pull toward faith (p.v2.pull), which makes the offer likelier;
// - the profile shows no piety bar and no piety figure, and no chapter or ambition sets a piety aim.
// NPCs keep their piety as before: the AI reads it, and nothing shows it as a stat.
const VS = A.V2S;
VS.PIETY0 = 30;
const kindOf = p => { try { return A.C && A.C.famKind ? A.C.famKind(p, 'clergy') || A.C.famKind(p, 'priestly') : false; } catch (e) { return false; } };
const holy = q => !!(q && ((q.flags && q.flags.priest) || (q.job && q.job.c === 'clergy')));
VS.clergyBorn = function (p) {
  if (!p) return false;
  if (p.flags && p.flags.clergyBorn) return true;
  for (const id of p.parents || []) if (holy(A.P ? A.P(id) : A.S.people[id])) return true;
  return !!kindOf(p);
};
// only the player is ever faithless by this rule
VS.hasFaith = function (p) {
  if (!p || !VS.isPC(p)) return true;
  return !!(p.flags && p.flags.v2_faith) || holy(p) || VS.clergyBorn(p);
};
VS.pull = p => (p && p.v2 && +p.v2.pull) || 0;
VS.addPull = function (p, v) { if (p.v2) p.v2.pull = Math.round((VS.pull(p) + v) * 10) / 10; };
VS.takeFaith = function (p) {
  p.flags.v2_faith = A.S.year;
  p.piety = Math.max(0, Math.min(100, VS.PIETY0 + Math.max(0, VS.pull(p))));
  if (p.v2) p.v2.pull = 0;
};
// the month: a faithless player's piety goes back to neutral, any change kept as pull
A.onMonth.push(pc => {
  if (!pc || !pc.alive || VS.hasFaith(pc)) return;
  if (pc.piety !== VS.PIETY0) { VS.addPull(pc, (+pc.piety || 0) - VS.PIETY0); pc.piety = VS.PIETY0; }
});
// an effect on piety for a faithless player becomes pull
const applyFx = A.applyFx;
A.applyFx = function (pc, fx) {
  if (pc && fx && typeof fx === 'object' && !Array.isArray(fx) && typeof fx.piety === 'number' && VS.isPC(pc) && !VS.hasFaith(pc)) {
    VS.addPull(pc, fx.piety);
    const o = Object.assign({}, fx); delete o.piety;
    arguments[1] = o;
  }
  return applyFx.apply(this, arguments);
};
// no piety aims for the faithless: 9993-chapters' "Be known at the shrine", 97-life-fixes' devout ambition
const noAim = (list, k) => { const a = (list || []).find(x => x && x.k === k); if (!a || a.v2) return; const fit = a.fit; a.fit = p => (VS.hasFaith(p) ? fit(p) : 0); a.v2 = true; };
if (A.CH && A.CH.AIMS) noAim(A.CH.AIMS, 'pious');
if (A.LF && A.LF.AMB && A.LF.AMB.faith && !A.LF.AMB.faith.v2) { const a = A.LF.AMB.faith, fit = a.fit; a.fit = p => (VS.hasFaith(p) ? fit(p) : 0); a.v2 = true; }
