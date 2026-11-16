// W1-4 "no levies" (docs/design/war.md §10, D-064 point 7; D-086): an old save's levy, converted on load.
//
// The levy is gone from the game: as a kind of troop, as a yearly tax of men and as a word. This is the one file of the
// build that still names it, because an old save stores it (tools' w4NoLevyLint allows this file and no other).
//   r.levy -> r.roll (the volunteer roll; what the war map's refits and new regiments draw on), r.levyCap -> r.rollCap,
//   r.levy0 -> r.roll0, r.laws.levy -> r.laws.conscript (the same three steps, now how far the crown may call by lot on
//   its own word), the war map's yearly record (r.ind.hist[].levy) -> .roll, the doctrine "levy" -> "nation";
//   a house's levy (its full strength) -> h.men, a vassal's contract.levy (the men he owes) -> contract.men;
//   the release's yearly summons and 72's home muster (fn names, a mission's ts.levy, its layer) -> their new names;
//   event ids, flags and customs renamed in the content -> the new ids, so nothing is seen twice.
// The roll itself is set to its size (about 1 in 100 of the people) and the old pool's surplus, with any levy host in
// the field, is read by b-men.core.js (A.MEN.convert) once the world is loaded: men already under arms in a war become
// conscripts of a call of that war's need; at peace they go home (D-086).
(function () {
  const OLD = 'levy';
  const EV = { pp_dw_levy: 'pp_dw_muster', aw_bandit_levy: 'aw_bandit_muster', ww_ald_levy: 'ww_ald_muster', wr_hf_levy: 'wr_hf_lot',
    ss_rp_levy: 'ss_rp_muster', rk_cmd_levy_lord: 'rk_cmd_muster_lord', pl_heavy_levy: 'pl_heavy_call', dr_new_levy: 'dr_new_conscripts',
    sc_wc_levies: 'sc_wc_conscripts', tam_levy: 'tam_muster', vel_pelt_levy: 'vel_pelt_due', tst_levy: 'tst_call', tst_levy5: 'tst_call5' };
  const VAL = { levyUp: 'conscriptUp', levyDown: 'conscriptDown', tsLevy: 'tsMuster', levyBattle: 'summonsBattle' };
  const WORD = s => s.replace(/\bLevy Host\b/g, 'Conscript Host').replace(/\bLevy\b/g, 'Muster').replace(/\blevies\b/g, 'conscripts').replace(/\blevy\b/g, 'muster');
  const ren = (o, a, b) => { if (o && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, a)) { if (o[b] == null) o[b] = o[a]; delete o[a]; return true; } return false; };
  const renKeys = (o, map) => { if (!o || typeof o !== 'object') return; for (const k of Object.keys(map)) ren(o, k, map[k]); };

  const C = A.MEN_CONVERT = { EV, VAL, n: 0 };
  C.convert = function (S) {
    if (!S || typeof S !== 'object') return S;
    let n = 0;
    for (const id of Object.keys(S.realms || {})) {
      const r = S.realms[id];
      if (!r) continue;
      if (ren(r, OLD, 'roll')) n++;
      ren(r, OLD + 'Cap', 'rollCap'); ren(r, OLD + '0', 'roll0'); ren(r, OLD + 'Once', 'rollOnce');
      if (r.laws && ren(r.laws, OLD, 'conscript')) n++;
      if (r.ind && Array.isArray(r.ind.hist)) for (const h of r.ind.hist) ren(h, OLD, 'roll');
      if (r.forces) {
        if (r.forces.doc === OLD) r.forces.doc = 'nation';
        for (const t of Object.values(r.forces.tpl || {})) if (t && typeof t.name === 'string') t.name = WORD(t.name);
        for (const d of r.forces.divs || []) if (d && typeof d.name === 'string') d.name = WORD(d.name);
      }
      for (const k of ['riPri', 'riAgenda']) if (r[k] && VAL[r[k].k]) r[k].k = VAL[r[k].k];
      // the polity (9996): its law group, a bill in progress, its log of bills and offices
      const pol = r.pol;
      if (pol) {
        for (const k of ['laws2', 'law0']) if (pol[k]) ren(pol[k], OLD, 'conscript');
        const fixB = b => { if (!b || typeof b !== 'object') return; if (VAL[b.k]) b.k = VAL[b.k]; if (b.g === OLD) b.g = 'conscript'; };
        fixB(pol.bill); fixB(pol.last);
        for (const e of pol.log || []) fixB(e);
      }
      for (const e of Array.isArray(r.riCourt) ? r.riCourt : []) if (e && VAL[e.k]) e.k = VAL[e.k];
    }
    for (const id of Object.keys(S.houses || {})) {
      const h = S.houses[id];
      if (!h) continue;
      if (ren(h, OLD, 'men')) n++;
      if (h.contract) ren(h.contract, OLD, 'men');
    }
    for (const id of Object.keys(S.people || {})) {
      const p = S.people[id];
      if (!p) continue;
      if (p.noble) ren(p.noble, OLD + 'ied', 'summoned');
      if (p.flags) { ren(p.flags, OLD + 'iedSerf', 'calledSerf'); if (p.flags.ev) renKeys(p.flags.ev, EV); renKeys(p.flags, EV); }
      if (p.rb) renKeys(p.rb, EV);
      if (p.pol && p.pol.contract) ren(p.pol.contract, OLD, 'men');
      ren(p, 'tsLevyN', 'tsMusterN');
      for (const k of ['occ', 'title']) if (typeof p[k] === 'string' && /\b[Ll]ev(y|ies)\b/.test(p[k])) p[k] = WORD(p[k]);
    }
    ren(S, 'tsLevy', 'tsMuster'); ren(S, 'carLevy', 'carMuster');
    // queued and scheduled cards: their fn names, a mission's muster flag and layer
    const fix = q => {
      if (!q || typeof q !== 'object') return;
      for (const o of q.options || []) if (o && VAL[o.fn]) o.fn = VAL[o.fn];
      if (VAL[q.fn]) q.fn = VAL[q.fn];
      const m = q.m;
      if (m && m.ts) { ren(m.ts, OLD, 'muster'); if (m.ts.layer === OLD) m.ts.layer = 'muster'; }
      if (q.ev && EV[q.ev]) q.ev = EV[q.ev];
      if (q.id && EV[q.id]) q.id = EV[q.id];
      if (q.item) fix(q.item);
    };
    (S.queue || []).forEach(fix); (S.sched || []).forEach(fix);
    if (S.tsq) fix(S.tsq);
    C.n = n;
    if (n) S.menOld = 1;   // b-men.core.js converts the old pool and any levy host in the field once (A.MEN.convert)
    return S;
  };
  const mig = A.migrate;
  A.migrate = function (S) {
    S = mig ? mig.apply(this, arguments) : S;
    try { C.convert(S); } catch (e) { console.error('[men] convert', e); }
    return S;
  };
})();
