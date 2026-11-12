// 99999-v2-content, part 8: words that did not fit the life (playtest 2, new #18 and #19, old #16's piety).
//
// - The death screen: "The Old Soldier — Stood in the line more times than anyone counted" on a captain dead at 18 (28-
//   endings counted 10 battles and nothing else); "As all things end" for a hanging and for "a blow on the night watch"
//   (28's manners did not read "hanging" or a watch); "Set out to rise in the army, and did, and in the rain" (26-belief-
//   truth's tavern tag after a deed that ends "and did").
// - A battle's losses: "Your side loses some 0, theirs some 0" (99997-v2-war's estimate rounded a captain's handful to 0).
// - Piety offered to the faithless: 99993-v2-stats turns a faithless player's piety into a quiet pull toward the faith
//   (VS.hasFaith), but the card's chips still said "▲ more piety" on "Watch the rites" at 4. A faithless life is no
//   longer offered piety: its chips leave piety out (a choice left with nothing shown says "It will be remembered", as
//   for any effect the card does not show).
// The endings are decided once, at death, in the engine (28's A.pcDeath); the rest is words.
(function () {
  // ---- endings and manners (28-endings) -------------------------------------------------------------------------------
  const E = A.ENDINGS, M = A.MANNERS;
  if (Array.isArray(E)) {
    const vet = E.find(x => x && x.id === 'veteran');
    // an old soldier has grown old in the ranks: ten battles, and forty years
    if (vet && !vet.v2c) { const t0 = vet.test; vet.test = (p, S) => A.age(p) >= 40 && t0(p, S); vet.v2c = true; }
  }
  if (Array.isArray(M)) {
    const add = (id, rx) => { const m = M.find(x => x && x.id === id); if (m && !m.v2c) { m.rx = new RegExp(`${m.rx.source}|${rx}`, m.rx.flags); m.v2c = true; } };
    add('battle', 'night watch|on watch|sentry|picket|skirmish|ambush|patrol');
    add('violence', 'hang|gallows|rope|noose|headsman|the block|a blow');
  }

  // ---- the tale in the taverns (26-belief-versus-truth) ----------------------------------------------------------------------
  const BT = A.BT;
  if (BT && typeof BT.tale === 'function') {
    const tale0 = BT.tale;
    // a deed that already ends in its outcome ("and did", "and failed") takes a teller's tag, not a deed's
    const ENDS = /\b(?:did|did not|failed|could not|never did)\.?\s*$/i;
    BT.tale = function (deed) {
      const out = tale0.apply(this, arguments);
      if (typeof out !== 'string' || !ENDS.test(String(deed || '').trim())) return out;
      return out.replace(/, (?:and with half the men|and in the rain|single-handed, some swear|and laughed while doing it|before breakfast, the story goes)\.$/, ', the story goes.');
    };
  }

  // ---- a captain's count of the fallen (99997-v2-war) ------------------------------------------------------------------
  const W = A.V2W;
  if (W && typeof W.estimate === 'function') {
    const est0 = W.estimate;
    W.estimate = function (n, rank) {
      const r = Math.max(0, Math.round(+n || 0));
      if ((rank === 'captain' || rank === 'commander') && r < 5) return r ? 'a few' : 'none';
      return est0.apply(this, arguments);
    };
  }
  // "Across from you: about 2,000 of the the Lantern Company", "of the The Greyfeathers": a company's or an order's
  // name carries its own article
  if (W && typeof W.view === 'function') {
    const view0 = W.view;
    W.view = function () {
      const h = view0.apply(this, arguments);
      return typeof h === 'string' ? h.replace(/\bof the (?:the|The) /g, 'of the ') : h;
    };
  }

  // ---- no piety for the faithless on the card (99993-v2-stats' faith, 9998-choice-stakes' chips) -------------------------------
  const ST = A.STAKES, VS = A.V2S;
  if (ST && typeof ST.choiceChips === 'function' && typeof ST.read === 'function' && VS && typeof VS.hasFaith === 'function') {
    const chips0 = ST.choiceChips, noPiety = R => {
      if (!R || ![R.up, R.down, R.touch].some(a => Array.isArray(a) && a.some(x => x && x.k === 'piety'))) return R;
      const f = a => (Array.isArray(a) ? a.filter(x => !(x && x.k === 'piety')) : a);
      return Object.assign({}, R, { up: f(R.up), down: f(R.down), touch: f(R.touch) });
    };
    ST.choiceChips = function (c, e, q, pc) {
      const p = pc || (A.S && A.pc && A.pc());
      let faithless = false;
      try { faithless = !!(p && !VS.hasFaith(p)); } catch (err) { faithless = false; }
      if (!faithless) return chips0.apply(this, arguments);
      const read0 = ST.read;
      ST.read = function () { return noPiety(read0.apply(this, arguments)); };
      try { return chips0.apply(this, arguments); } finally { ST.read = read0; }
    };
  }
})();
