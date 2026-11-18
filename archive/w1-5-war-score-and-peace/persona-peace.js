// Retired by W1-5 (D-091), as they stood at 84b7f92: 20-ai-personality's log of a settlement the war score forced
// (A.aiNotePeace, with 68-reasons-for-war's mark of a forced one), the willingness parts of the old peace table and its
// wrapper on A.peaceOffer, the white-peace and willingness weights (A.aiWhite, A.aiPeaceWill).

// ---- src/diplomacy/20-ai-personality/persona.core.js lines 140-143
A.aiYield = rid => clamp(A.aiW('trib', rid), .3, 2.5);
const will = P => clamp(Math.exp(.4 * P.caution - .5 * P.pride - .5 * P.wrath + .3 * P.warmth - .3 * P.warLog), .3, 2.5);
A.aiWhite = w => Math.sqrt(will(A.rulerPersona(w.leadA)) * will(A.rulerPersona(w.leadD)));
A.aiPeaceWill = rid => { const P = A.rulerPersona(rid); return Math.round(clamp(12 * (P.caution - P.pride - .6 * P.wrath + .4 * P.warmth) - 4 * P.warLog, -20, 20)); };

// ---- src/diplomacy/20-ai-personality/persona.core.js lines 372-393
// peace (checkPeace): called just before the engine settles a war on its own
A.aiNotePeace = function (w, res) {
  const loser = res === 'att' ? w.leadD : res === 'def' ? w.leadA : null, la = A.realm(w.leadA), ld = A.realm(w.leadD);
  if (!la || !ld) return;
  const why = [], sc = w.score || 0;
  if (loser) {
    const P = A.rulerPersona(loser), L = A.realm(loser);
    why.push([Math.abs(sc) >= 80 ? "The war is lost: the land taken, the battles lost" : "Losing the war", Math.abs(sc) >= 80 ? 2 : Math.abs(sc) / 60]);
    if (L && L.exhaustion > 60) why.push([`Exhausted (${Math.round(L.exhaustion)})`, L.exhaustion / 80]);
    const forced = Math.abs(sc) >= 80;
    why.push(...wWhy('trib', P).map(x => forced ? [x[0], x[1]] : x));
    A.aiLogAdd('yield', loser, loser === w.leadD ? w.leadA : w.leadD, `yields to ${short(loser === w.leadD ? w.leadA : w.leadD)}: ${w.name || 'the war'} is lost.`, why);
  } else {
    const yrs = A.S.year - (w.start || A.S.year);
    if (yrs >= 2) why.push([`${yrs} years of war`, yrs / 6]);
    if (Math.abs(sc) < 15) why.push(['Stalemate', .5]);
    if (la.exhaustion > 75 && ld.exhaustion > 75) why.push(['Both sides exhausted', 1]);
    for (const id of [w.leadA, w.leadD]) { const P = A.rulerPersona(id); why.push(...traitWhy(P, 'caution', .4, short(id)), ...traitWhy(P, 'pride', -.5, short(id)), ...traitWhy(P, 'wrath', -.5, short(id))); }
    A.aiLogAdd('peace', w.leadA, w.leadD, `makes a white peace with ${short(w.leadD)}: ${w.name || 'the war'} ends.`, why);
  }
};


// ---- src/diplomacy/20-ai-personality/persona.core.js lines 512-534
// the player's peace offer: log the answer with the willingness parts (W0, D-052: the war score's part is named by what
// makes it, the land held and the battles won, never as a score)
A.aiWillParts = function (T) {
  if (!T || !T.e) return [];
  const P = A.rulerPersona(T.eid), out = [[T.sc >= 0 ? 'The land you hold and the battles you won' : 'The land they hold and the battles they won', Math.round(T.sc * 1.3)], ['Base', 18]];
  if (T.e.exhaustion) out.push([`Their war-weariness (${Math.round(T.e.exhaustion)})`, Math.round(T.e.exhaustion * .35)]);
  if (T.r && T.r.exhaustion) out.push([`Your war-weariness (${Math.round(T.r.exhaustion)})`, -Math.round(T.r.exhaustion * .15)]);
  if (A.atWar(T.eid).length > 1) out.push(['Fighting on another front', 10]);
  const pw = A.aiPeaceWill(T.eid);
  if (pw) out.push([`Their ruler is ${P.traits.filter(t => ['caution', 'pride', 'wrath', 'warmth'].some(ax => (TW[t] || {})[ax])).join(', ') || 'set in their ways'}`, pw]);
  return out;
};
const _peaceOffer = A.peaceOffer;
A.peaceOffer = function (wid, picks) {
  const pc = A.pc(), rid = pc && pc.ruler, w = A.S.wars.find(x => x.id === wid);
  const T = w && rid ? A.peaceTerms(w, rid) : null;
  const res = _peaceOffer.apply(this, arguments);
  if (T && res && (res.ok || /refuses/.test(res.msg || ''))) {
    const parts = A.aiWillParts(T).map(([l, v]) => [l, (res.ok ? 1 : -1) * v / 20]);
    A.aiLogAdd(res.ok ? 'accept' : 'decline', T.eid, rid, res.ok ? `accepts peace terms from ${short(rid)}.` : `refuses the peace terms of ${short(rid)}.`, parts);
  }
  return res;
};

// ---- src/diplomacy/20-ai-personality/view.core.js lines 53-57
UI.aiWillWhy = function (T) {
  if (!T || !A.aiWillParts) return '';
  const parts = A.aiWillParts(T).filter(p => p[1]);
  return parts.length ? `<div class="tiny muted ai-why">${parts.map(pts).join(' · ')}</div>` : '';
};

// ---- src/diplomacy/68-reasons-for-war/temper.core.js lines 71-81
  }
  // a surrender at a war score of 80 or more is the engine's, not the ruler's
  if (typeof A.aiNotePeace === 'function') {
    const np = A.aiNotePeace;
    A.aiNotePeace = function (w, res) {
      const top = A.S && A.S.aiLog && A.S.aiLog[0];
      const out = np.apply(this, arguments);
      try { const e = A.S.aiLog && A.S.aiLog[0]; if (e && e !== top && e.k === 'yield' && Math.abs(w.score || 0) >= 80) e.forced = 1; } catch (x) {}
      return out;
    };
  }
