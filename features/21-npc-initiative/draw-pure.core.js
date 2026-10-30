// Render-purity guards: drawing the screen must not change the world. These are fix-layer gaps that this feature's
// tests exposed. They belong with ENG-ROSTER-PURE in 03-engine-fixes and should move there at integration; they live
// here so builds with this feature pass journalReplay and the feature's own determinism test.
//
// Three engine readers wrote state the first time a tab asked them something:
// - A.staffCands (staff card, War and Holdings tabs) refilled a stale candidate pool on the spot: A.makeAcquaintance
//   created four people and drew from A.rand mid-draw. A journal recorded with that tab open then failed to replay
//   ("the random stream differs").
// - A.staffHolder (staff card, and A.staffBonus behind the market spread on the Holdings tab) created pc.staff = {}.
//   An empty pc.staff switches on the monthly staff step (onMonth: pc.staff && A.staffApply(pc)), which can take a
//   division's command away from the player.
// - A.jobRep (Path tab) wrote the default reputation (20) into pc.job.rep. C.rep reads p.job.rep || 0, so looking at
//   a tab changed which events could fire.
// Any feature that changes a life's course can walk a seed into these, which is how this one found them.
//
// The fix: while drawing (UI.render, UI.refresh, UI.refreshTab, UI.renderModal), the three readers return what they would have
// returned and write nothing. The candidate pool is refilled by the monthly tick instead, the same engine path
// A.staffResolveDelegates already uses for delegated posts. Pool members are npcTemp, so A.gcPeople still clears the
// ones nobody hires.
(function () {
  if (A._drawPure) return;
  A._drawPure = true;
  let drawing = 0;
  A.isDrawing = () => drawing > 0;
  // for other drawing that runs outside the three below: 59-tooltips builds a popover's content through it, since a
  // popover opens on a hover or a click, after the render (81-pacing's random stream once had one create people.X.staff)
  A.asDrawing = function (f, self, args) { drawing++; try { return f.apply(self, args || []); } finally { drawing--; } };
  // refreshTab too: a tab click draws through it alone (the Path tab wrote job.rep through it, found by 90-fold's purity test)
  for (const k of ['render', 'refresh', 'refreshTab', 'renderModal']) {
    const f = UI[k];
    if (typeof f !== 'function') continue;
    UI[k] = function () { drawing++; try { return f.apply(this, arguments); } finally { drawing--; } };
  }

  if (typeof A.staffCands === 'function') {
    const cands = A.staffCands;
    A.staffCands = function (pc, slot) {
      if (!drawing || !pc || !slot) return cands.apply(this, arguments);
      // present the pool as it stands (living members only) as this year's, then put everything back
      const had = !!pc.staffPool, before = had ? pc.staffPool[slot.type] : undefined;
      const ids = before && Array.isArray(before.ids) ? before.ids.filter(id => { const p = A.P(id); return p && p.alive; }) : [];
      if (!had) pc.staffPool = {};
      pc.staffPool[slot.type] = { y: A.S.year, ids };
      try { return cands.apply(this, arguments); }
      finally {
        if (before === undefined) delete pc.staffPool[slot.type]; else pc.staffPool[slot.type] = before;
        if (!had) delete pc.staffPool;
      }
    };
    A.onMonth = A.onMonth || [];
    A.onMonth.push(pc => { if (pc && pc.alive && pc.id === A.S.pc && A.staffSlots) for (const s of A.staffSlots(pc)) cands(pc, s); });
  }

  if (typeof A.staffHolder === 'function') {
    const holder = A.staffHolder;
    // with no pc.staff the original returns null after creating it; while drawing, return null and create nothing
    A.staffHolder = function (pc) { return drawing && pc && !pc.staff ? null : holder.apply(this, arguments); };
  }

  if (typeof A.jobRep === 'function') {
    const rep = A.jobRep;
    A.jobRep = function (pc) { return drawing && pc && pc.job && pc.job.rep == null ? 20 + (pc.house ? 6 : 0) : rep.apply(this, arguments); };
  }
})();
