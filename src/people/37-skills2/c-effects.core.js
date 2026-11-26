// Skills rebuild, step 6 (docs/design/skills-v2.md §2.3, §2.4, §3.6, §5.2, §10; D-180): the rungs' effects in play, with
// the stacking caps here, in the adapter, so no data can break them. The engine (A.V2.skills2, section 10) gathers and
// caps; this file says what a person holds and where each effect is read:
//
// - edge     A.skillEff (so A.checkVal and every check): SK2.edgeOf(p, k), the edges tagged k, its family, its focus,
//            its group, its family's check tags or 'all', weighed 1, 1/2, 1/4, 1/8, at most +12 on one check (up to S)
// - fight    A.fighterFrom -> A.CR and A.fightWorth: SK2.fightOn(f, p), in fight-worth points for the weapon's tags,
//            at most +15% of the fighter's own worth (f.sk2; a burst counts in the first three rounds)
// - blunder, surge   VS.minds (so VS.attempt, the honest odds and the roll alike): SK2.mindSteps(p, check), at most 2
//            steps either way, a step half a deviation of judgment (fewer blunders) or will (more surges)
// - resist   at most 3 steps of each: wounds (the fighter's woundRes), fear (a foe's stare at a duel's start, fearRes),
//            illness (its monthly toll, 49-body-mind); poison and mind wait for the systems that read them
// - perk     A.perkOf, A.perksOf, A.perkSum, A.perkNames: SK2.perkRows(k), the rungs' perk effects as the release's rows
//            [threshold, name, text, fx], held while the read of their key reaches the threshold (the release's rule),
//            so every sum is what it was (sk2Caps compares them with GD.PERKS over bot lives)
// - A.CAPS(p) the capability profile (§3.6): every bonus a person's held skills give, capped
//
// Until the data review writes effects into the rungs, only perks are in the data: every other bonus is 0 and every
// reader takes the fast path (no family carries an effect, nothing is looked up).
//
// Pure: no dice, nothing written to A.S. A profile is kept for the month, keyed by the skills and levels it reads (a
// memo of a pure function: a level gained mid-month is read at once, and a page that renders can never leave the engine a
// stale one).
(function () {
  const SK2 = A.SK2; if (!SK2 || !SK2.E || !SK2.DATA) return;
  const E = () => SK2.E(), IX = () => SK2.IX();

  // ---- what carries effects: the families whose rungs carry any (besides perks), and whether any other skill does ------
  let ACT = null, PERK = null, EMPTY = null;
  const TAGS = new Map(), MEMO = new Map();
  function active() {
    if (ACT) return ACT;
    const I = IX(), Eng = E(), fams = new Set();
    let named = false;
    for (const s of I.skills) {
      let any = false;
      for (const b of s.levels || []) for (const e of b.effects || []) if (e && e.type !== 'perk') any = true;
      if (!any) continue;
      const rung = s.family && Eng.HUMAN.includes(s.rank) && Eng.rungOf(I, s.family, s.rank) === s.id;
      if (rung) fams.add(s.family); else named = true;
    }
    return (ACT = { fams: [...fams].sort(), named, none: !fams.size && !named });
  }
  const freeze = o => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const k in o) freeze(o[k]); } return o; };
  // after the data changed under the page (a test plants effects): forget what was worked out from it
  SK2.capsReset = function () { ACT = null; PERK = null; EMPTY = null; TAGS.clear(); MEMO.clear(); };

  // ---- titles beside the skills (src/people/9999976-titles, D-183): a person's titles are sources in the same pool, under
  // the same caps. SK2.xHeld(p) (the titles' module sets it) lists them as { id, lv }; SK2.addSource registers each one's
  // skill-shaped object ({ id, rank: its weight, levels: [{ at: 1, effects }] }), put into the index on first use
  const XSRC = new Map();
  let XREG = false;
  SK2.addSource = s => { if (s && s.id) { XSRC.set(s.id, s); XREG = false; } };
  const regX = () => { if (XREG) return; const B = IX().BY; for (const [id, s] of XSRC) if (!B[id]) B[id] = s; XREG = true; };
  const xOf = p => (SK2.xHeld && p ? SK2.xHeld(p) : null);
  const off = p => !p || (active().none && !xOf(p));

  // ---- what a person holds that may carry effects ------------------------------------------------------------------------
  // the rungs of the families that carry effects (his table's, or his number's for anyone else: SK2.rungFor), each with
  // the rungs below it at Lv 10 (§15.2), and the player's other held skills (named skills, from step 9)
  SK2.held = function (p) {
    const out = [], act = active();
    if (!p) return out;
    const x = xOf(p);
    if (act.none) { if (x) { regX(); out.push(...x); } return out; }
    const Eng = E(), I = IX();
    const sealed = SK2.sealed ? SK2.sealed(p) : [];
    for (const c of act.fams) { const r = SK2.rungFor(p, c); if (r) for (const h of Eng.heldOfRung(I, c, r.rank, r.lv)) if (!sealed.includes(h.id)) out.push(h); }
    if (act.named && p.ks && typeof p.ks === 'object') for (const id of Object.keys(p.ks).sort()) {
      const s = I.BY[id], e = p.ks[id];
      if (!s || !e || !(e.lv >= 1) || (s.family && Eng.rungOf(I, s.family, s.rank) === id)) continue;
      out.push({ id, lv: Math.min(Eng.MAX_LV, e.lv) });
    }
    if (x) { regX(); out.push(...x); }
    return out;
  };
  // A.CAPS(p): the capability profile (§3.6), frozen, shared by everyone who holds the same skills at the same levels
  A.CAPS = SK2.caps = function (p) {
    if (!EMPTY) EMPTY = freeze(E().profile(IX(), []));
    const held = SK2.held(p);
    if (!held.length) return EMPTY;
    const sig = held.map(h => h.id + ':' + h.lv).join('|');
    let P = MEMO.get(sig);
    if (!P) { if (MEMO.size >= 4096) MEMO.clear(); P = freeze(E().profile(IX(), held)); MEMO.set(sig, P); }
    return P;
  };
  A.onMonth.push(() => { MEMO.clear(); });

  // ---- the tags a key's check reads ---------------------------------------------------------------------------------------
  // the key itself, its family, its focus (a legacy key's: "dagger" is sword's "the-knife"), its group, its family's check
  // tags, and 'all'
  SK2.tagsOf = function (k) {
    let t = TAGS.get(k); if (t) return t;
    const I = IX(), c = E().famOf(I, k), F = c && I.FAM[c], out = [k];
    if (F) {
      out.push(c);
      for (const f of F.focuses || []) if (f.legacy && f.legacy === k) out.push(c + ':' + f.id);
      if (F.group) out.push(F.group);
      for (const x of F.checkTags || []) out.push(x);
    }
    out.push('all');
    t = [...new Set(out)]; TAGS.set(k, t);
    return t;
  };
  const tagsOfKeys = keys => { const out = []; for (const k of keys) if (k) for (const t of SK2.tagsOf(k)) if (!out.includes(t)) out.push(t); return out.length ? out : ['all']; };

  // ---- edge: a check's points (A.skillEff) ------------------------------------------------------------------------------
  SK2.edgeOf = function (p, k) {
    if (off(p) || !k) return 0;
    const P = A.CAPS(p); if (P === EMPTY) return 0;
    return E().edgeOn(IX(), P.G, SK2.tagsOf(k));
  };

  // ---- blunder and surge: steps of judgment and will (VS.minds) ----------------------------------------------------------
  // the check's skills (s, s2, and a fight check's weapon skill); with no check only what is tagged 'all'
  SK2.mindSteps = function (p, check) {
    if (off(p)) return null;
    const P = A.CAPS(p); if (P === EMPTY) return null;
    const keys = [];
    if (check && typeof check === 'object') {
      for (const k of [check.s, check.s2]) if (k && GD.SKILLS[k]) keys.push(k);
      if (check.fight && A.weaponSkillOf) { const w = A.weaponSkillOf(p); if (w) keys.push(w); }
    }
    const tags = keys.length ? tagsOfKeys(keys) : ['all'], I = IX(), Eng = E();
    const blunder = Eng.stepsOn(I, P.G, 'blunder', tags), surge = Eng.stepsOn(I, P.G, 'surge', tags);
    return blunder || surge ? { blunder, surge, step: Eng.STEP_MIND } : null;
  };

  // ---- resist: steps, and the share of harm they take off ----------------------------------------------------------------
  SK2.resistSteps = function (p, of) {
    if (off(p)) return 0;
    const P = A.CAPS(p); return P === EMPTY ? 0 : P.resist[of] || 0;
  };
  SK2.resistShare = function (p, of) {
    const s = SK2.resistSteps(p, of); if (!s) return 0;
    return Math.max(-1, Math.min(1, s * (E().RESIST_STEP[of] || 0)));
  };

  // ---- fight: A.fighterFrom's hook --------------------------------------------------------------------------------------
  // the worth A.fightWorth gives this fighter (the same sum), before any skill's fight effect
  SK2.worthOfFighter = function (f) {
    const v = A.CR(Object.assign({ fat: 0, burst: 0, fury: 0, hp: 100, maxHp: 100, adapt: 0, mounted: false }, f, { sk2: null }), { round: 5 });
    return Math.max(0, v + (f.wdmg || 3) * 0.9 + (f.prot || 0) * 1.1 + (f.shield || 0) * 1.4);
  };
  SK2.fightOn = function (f, p) {
    if (!f || off(p)) return f;
    const P = A.CAPS(p); if (P === EMPTY) return f;
    const Eng = E(), I = IX();
    const w = P.resist.wounds || 0, fear = P.resist.fear || 0;
    if (w) f.woundRes = (f.woundRes || 0) + w * Eng.RESIST_STEP.wounds;
    if (fear) f.fearRes = fear;
    const k = f.skillK || 'unarmed', c = Eng.famOf(I, k), tags = [...new Set([k, c || k, 'all'])];
    const parts = Eng.fightOn(I, P.G, tags, SK2.worthOfFighter(f));
    if (parts.total || parts.burst) f.sk2 = { steady: parts.atk + parts.def + parts.adapt, burst: parts.burst, total: parts.total, cap: parts.cap };
    return f;
  };

  // ---- stat: what held skills' and titles' stat effects add to a stat (A.stat), at most +10 (the cap, §2.4, §11.5) -----
  SK2.statOf = function (p, s) {
    if (off(p)) return 0;
    const P = A.CAPS(p); return P === EMPTY ? 0 : P.stat[s] || 0;
  };

  // ---- perks: the rungs' perk effects as the release's rows ---------------------------------------------------------------
  SK2.perkRows = function (k) {
    if (!PERK) PERK = freeze(E().perkRows(IX()));
    return PERK[k];
  };
})();
