// Retired by W1-5 (D-091), as it stood at 84b7f92: 09-engine-at-scale's floor on a far war's peace (nine months, a
// timer) and its hold on the crushing peace (the score kept under 90).

// ---- src/core/09-engine-at-scale/world.core.js lines 151-177
  // the crushing peace (a war score of 90 with every province held) annexes the whole realm; a far realm too large
  // for one peace's share (more than a handful of provinces) is not swallowed so: the score is held under 90 for it
  // a far war is not settled (by any road: the AI's offers, a faction's peace, the war clock) before W.MIN_WAR_DAYS,
  // nor a border war (w.fwLimit) before its own day, unless a capital has fallen or a player's realm makes the peace
  W.tooSoon = function (w, res) {
    if (!w || w.d0 == null) return false;
    const la = A.realm(w.leadA), ld = A.realm(w.leadD);
    if (!la || !ld || !la.alive || !ld.alive || la.playerRun || ld.playerRun || w.cb === 'throne') return false;
    const lim = w.fwLimit && w.fwLimit.until || 0;
    const until = Math.max(lim, res !== 'white' && (farLoser(w.leadA) || farLoser(w.leadD)) ? w.d0 + W.MIN_WAR_DAYS : 0);
    if (A.absDay() >= until) return false;
    const capFallen = (r, by) => { const P = r.capitalProv != null ? A.prov(r.capitalProv) : null; return !!(P && by.includes(P.occ)); };
    // a border war (w.fwLimit) runs its course even past a fallen capital: its peace cannot take the realm anyway
    return !!lim && A.absDay() < lim || !(capFallen(ld, w.att) || capFallen(la, w.def));
  };
  // the crushing peace (a war score of 90 with every province held) annexes the whole realm; a far realm too large
  // for one peace's share (more than a handful of provinces) is not swallowed so: the score is held under 90 for it
  const sw = A.settleWar;
  if (typeof sw === 'function') A.settleWar = function (w, res) {
    if (!great() || !w) return sw.apply(this, arguments);
    try { if (W.tooSoon(w, res)) { W.stats.held_peace = (W.stats.held_peace || 0) + 1; return; } } catch (e) { console.error('peace floor', e); }
    if (res !== 'att' && res !== 'def') return sw.apply(this, arguments);
    const lose = res === 'att' ? w.leadD : w.leadA, big = farLoser(lose) && A.realmProvs(lose).length > 4;
    if (!(big || (w.fwLimit && w.fwLimit.max)) || Math.abs(w.score) < 90) return sw.apply(this, arguments);
    const sc = w.score; w.score = sc > 0 ? 89 : -89;
    try { return sw.apply(this, arguments); } finally { w.score = sc; }
  };
