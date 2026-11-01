// Peaces that fit the war, and crowns that learn (world review cycle 2, F3 and F4).
//
// F4. On the Great Continent a peace still moved 16 to 21 districts: 09-scale caps a peace at 15% of the loser's
// people and land, and the Twin Rivers' districts are small, so 15% of Taulen is about twenty of them, and they went
// back and forth between Hesh and Taulen within five years. Now a peace takes at most PEACE.base provinces, or
// PEACE.share of the loser's, for a war of under two years, and PEACE.perYear more for each year past the first. An
// attacker beaten back loses less still (PEACE.repulsed): the defender wanted to be left alone, and takes a border
// district or two and the war's gold.
//
// F3. The same history every seed: Zanara attacked Abara in 1105 (the lore's rivalry), lost, and went on declaring
// "reconquest" wars it lost, against Abara and its friends, until it was a third of its size, in seven worlds of
// eight. Two answers, with 20-ai-personality's per-world humour (r.aiMood):
//   - a crown remembers the wars it lost (r.lostTo[winner] = years, kept 40 years): each loss to a realm in the last
//     30 years cuts its odds of attacking that realm again (x LEARN per loss);
//   - a realm that has lost a third of its provinces in 30 years (r.provHist) is a hard target: its neighbours' odds of
//     attacking it fall (x SHRUNK), and the war's odds count its side a quarter stronger (SHRUNK_CALL).
// Engine only; no dice. State: r.lostTo, r.provHist (optional).
(function () {
  const PEACE = A.PEACE = A.PEACE || {};
  Object.assign(PEACE, { base: 3, share: 0.08, perYear: 4, repulsed: 0.05, repulsedMin: 2, LEARN: 0.4, SHRUNK: 0.5, SHRUNK_CALL: 0.25, stats: { capped: 0, cut: 0 } });
  const yrs = w => Math.max(0, (A.absDay() - (w.d0 != null ? w.d0 : (w.start != null ? (w.start - A.S.year) * 365 + A.absDay() : A.absDay()))) / 365);
  PEACE.cap = function (w, res, loserProvs) {
    const L = Math.max(1, loserProvs), y = yrs(w);
    let cap = Math.max(PEACE.base, Math.ceil(PEACE.share * L)) + PEACE.perYear * Math.max(0, Math.floor(y) - 1);
    if (res === 'def') cap = Math.min(cap, Math.max(PEACE.repulsedMin, Math.ceil(PEACE.repulsed * L)));   // the attacker beaten back
    return cap;
  };
  const wtp = A.wsTreatyProvinces;
  if (typeof wtp === 'function') A.wsTreatyProvinces = function (w, res) {
    const t = wtp.apply(this, arguments);
    try {
      if (!w || !Array.isArray(t) || (res !== 'att' && res !== 'def') || w.cb === 'throne' || w.cb === 'liberty') return t;
      const lose = res === 'att' ? w.leadD : w.leadA, lr = A.realm(lose);
      if (!lr || lr.isRebel || lr.playerRun || (A.realm(res === 'att' ? w.leadA : w.leadD) || {}).playerRun) return t;
      const cap = PEACE.cap(w, res, A.realmProvs(lose).length);
      if (t.length <= cap) return t;
      PEACE.stats.capped++; PEACE.stats.cut += t.length - cap;
      return t.slice(0, cap);
    } catch (e) { console.error('peace cap', e); return t; }
  };

  // ---- the wars a crown lost, and the land a realm held
  if (typeof A.on === 'function') A.on('warEnd', (w, res, text, live) => {
    try {
      if (!w || !live || (res !== 'att' && res !== 'def')) return;
      const win = res === 'att' ? w.leadA : w.leadD, losers = res === 'att' ? w.def : w.att, y = A.S.year;
      for (const id of losers) {
        const r = A.realm(id); if (!r || !r.alive) continue;
        const L = r.lostTo = r.lostTo && typeof r.lostTo === 'object' ? r.lostTo : {};
        (L[win] = Array.isArray(L[win]) ? L[win] : []).push(y);
        for (const k in L) { L[k] = L[k].filter(x => y - x < 40); if (!L[k].length) delete L[k]; }
      }
    } catch (e) { console.error('lost wars', e); }
  });
  A.onMonth.push(() => {
    try {
      const S = A.S; if (!S || !S.realms || A.monthOf(A.today()).m !== 0) return;
      for (const id in S.realms) {
        const r = S.realms[id]; if (!r.alive) continue;
        const H = r.provHist = Array.isArray(r.provHist) ? r.provHist : [];
        if (!H.length || S.year - H[H.length - 1][0] >= 5) H.push([S.year, r.provCount || A.realmProvs(id).length]);
        while (H.length > 7) H.shift();   // 30 years in steps of five
      }
    } catch (e) { console.error('land kept', e); }
  });
  PEACE.lossesTo = (a, b) => { const r = A.realm(a), L = r && r.lostTo && r.lostTo[b]; return Array.isArray(L) ? L.filter(y => A.S.year - y < 30).length : 0; };
  PEACE.shrunk = b => {
    const r = A.realm(b), H = r && r.provHist; if (!Array.isArray(H) || !H.length) return false;
    const most = Math.max(...H.filter(x => A.S.year - x[0] <= 30).map(x => x[1]), 0), now = r.provCount || 0;
    return most >= 3 && now <= most * 2 / 3;
  };
  PEACE.mul = function (a, b) {
    let m = Math.pow(PEACE.LEARN, PEACE.lossesTo(a, b));
    if (PEACE.shrunk(b)) m *= PEACE.SHRUNK;
    return m;
  };
  const cwm = A.cbWarMul;
  A.cbWarMul = function (a, b, P) {
    const m = typeof cwm === 'function' ? cwm.apply(this, arguments) : 1;
    try { return m * PEACE.mul(a, b); } catch (e) { return m; }
  };
  // a shrunken realm's neighbours watch: in the odds of a war on it, its side counts SHRUNK_CALL more
  const wp = A.warPreview;
  if (typeof wp === 'function') A.warPreview = function (a, b) {
    const P = wp.apply(this, arguments);
    try { if (P && PEACE.shrunk(b)) { P.powD = Math.round(P.powD * (1 + PEACE.SHRUNK_CALL)); P.ratio = P.powA / Math.max(1, P.powD); P.shrunk = 1; } } catch (e) {}
    return P;
  };
  const why = A.aiWhyWar;
  if (typeof why === 'function') A.aiWhyWar = function (a, b) {
    const out = why.apply(this, arguments);
    try {
      const n = PEACE.lossesTo(a, b);
      if (n) out.push([`${n === 1 ? 'A war' : n + ' wars'} lost to ${A.realmShort(b)} lately`, Math.log(Math.pow(PEACE.LEARN, n)) * .6]);
      if (PEACE.shrunk(b)) out.push([`${A.realmShort(b)} has lost a third of its land; its neighbours watch`, Math.log(PEACE.SHRUNK) * .6]);
    } catch (e) {}
    return out;
  };
})();
