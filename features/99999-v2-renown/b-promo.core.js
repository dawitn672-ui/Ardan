// 99999-v2-renown, part 2: promotion is a monthly chance, not a counter that fills (V2_SPEC complaint 15).
//
// The game's ladders stay (GD.MIL for the army, GD.CAREERS' ranks for a post), and so do their real gates: months at
// rank, the skill a post asks, letters, a free man, an army to command, gentle birth for the high seats. What goes
// is the merit counter as a gate ("Merit 112 / 30"): the board's chance is now v2's promotionCheck(), whose hazard
// is driven by how open the next post is (vacancy), by the standout deed of the last eighteen months against what
// the rank asks (each rank asks about twice the last), by steady service, and by a patron. So it can come twice in a
// year or not for a decade, and an extraordinary deed can carry you past a rank. The board's other factors (a gate
// unmet, a family's pull, the ruler's regard, being of another people) scale it as before.
// Draws: exactly the ones the old code made (one A.chance per check, plus one when a deed is great enough to skip).
(function () {
  const RN = A.RN, V = A.V2 && A.V2.renown;
  if (!RN || !V) return;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  // the field of deeds a ladder counts: the army counts war and arms; a post counts its own path and what you did at it
  // (deeds of renown, p.rn.d, and the months of good service, p.rn.v)
  RN.deedsFor = function (pc, kind) {
    const r = pc.rn || {}, d = (Array.isArray(r.d) ? r.d : []).concat(Array.isArray(r.v) ? r.v : []);
    if (kind === 'mil') return d.filter(x => x.field === 'war' || x.field === 'arms');
    const f = 'work:' + (A.pathOfCareer && pc.job ? A.pathOfCareer(pc.job.c) : 'common');
    return d.filter(x => x.field === f || x.field === 'court' && /court|church|learning/.test(f));
  };
  // Service: the game still keeps its merit counters (battles, missions, war games, a month's good work); a month whose
  // merit rose is a deed of service on the ladder's field, weighed by how much it rose. It counts for promotion (the
  // steady part of the hazard, and a standout month), never for renown.
  RN.SERVICE = { mil: 0.25, job: 1 };
  RN.serviceMonth = function (pc) {
    const r = RN.st(pc);
    if (!Array.isArray(r.v)) r.v = [];
    const y = A.S.year, mo = A.monthOf ? A.monthOf(A.today()).m : 0;
    const note = (k, cur, field, scale) => {
      if (!Number.isFinite(cur)) { delete r[k]; return; }
      if (Number.isFinite(r[k]) && cur > r[k] + 1e-6) r.v.push({ w: (cur - r[k]) * scale, year: y, month: mo, text: '', field });
      r[k] = cur;
    };
    note('lm', pc.mil ? pc.mil.merit : NaN, 'war', RN.SERVICE.mil);
    note('lj', pc.job ? pc.job.merit : NaN, 'work:' + (pc.job && A.pathOfCareer ? A.pathOfCareer(pc.job.c) : 'common'), RN.SERVICE.job);
    // eighteen months is all promotionCheck reads
    const cut = (y * 12 + mo) - 19;
    if (r.v.length) r.v = r.v.filter(x => x.year * 12 + (x.month || 0) >= cut);
  };
  A.onMonth.push(pc => { try { if (RN.on && RN.isPC(pc)) RN.serviceMonth(pc); } catch (e) { console.error('v2 renown service', e); } });
  // what the rank above asks of a standout deed (v2's promotionCheck: 2.5 x 2.1^rank)
  RN.needed = r => 2.5 * Math.pow(2.1, r);
  // the best deed of the last eighteen months against that: 0 nothing, 1 enough, 3 or more extraordinary
  RN.standout = function (pc, kind, r, y, m) {
    y = y != null ? y : A.S.year; m = m != null ? m : (A.monthOf ? A.monthOf(A.today()).m : 0);
    let best = 0;
    for (const x of RN.deedsFor(pc, kind)) if ((y - x.year) * 12 + (m - (x.month || 0)) <= 18 && x.w > best) best = x.w;
    return best / RN.needed(r);
  };
  RN.standWords = function (pc, kind, r) {
    const s = RN.standout(pc, kind, r);
    return s >= 3 ? 'a deed far beyond your rank' : s >= 1 ? 'a deed your betters noticed' : s >= 0.4 ? 'good work, not yet enough' : s > 0 ? 'nothing above the ordinary' : 'nothing lately';
  };

  // one check: v2's promotionCheck on the deeds of this ladder. mods scales the hazard (the board's other factors);
  // months is how long this check stands for (the army's board sits every three months).
  // Returns null, or { jump, why }.
  RN.promoRoll = function (pc, o) {
    const p = { deeds: RN.deedsFor(pc, o.kind), rankIndex: o.rank };
    const ladder = o.ladder;
    let first = true;
    const rng = {
      chance(h) {
        if (!first) return A.chance(h);
        first = false;
        const hm = clamp(h * (o.mods != null ? o.mods : 1), 0, 0.95);
        const months = o.months || 1;
        return A.chance(clamp(1 - Math.pow(1 - hm, months), 0, 0.95));
      },
    };
    const y = o.year != null ? o.year : A.S.year, mo = o.month != null ? o.month : (A.monthOf ? A.monthOf(A.today()).m : 0);
    const pr = V.promotionCheck(rng, p, { year: y, month: mo, ladder, vacancy: o.vacancy, patron: o.patron || 0 });
    if (!pr) return null;
    // the jump is the engine's; the game's own gates decide whether there is a rung to land on
    const jump = pr.jump === 2 && o.canSkip ? 2 : 1;
    return { jump, why: pr.why };
  };

  // ---- the army ----------------------------------------------------------------------------------------------------------
  RN.MIL_VAC = [0.5, 0.45, 0.4, 0.35, 0.3, 0.25, 0.2, 0.15, 0.1, 0.1];
  RN.milVacancy = function (pc) {
    const m = pc.mil, r = m.rank;
    let v = RN.MIL_VAC[r] != null ? RN.MIL_VAC[r] : 0.1;
    // war empties posts
    if (A.atWar && m.realm && (A.atWar(m.realm) || []).length) v *= 1.5;
    return clamp(v, 0.02, 0.9);
  };
  RN.milPatron = pc => (pc.flags && pc.flags.bossPush === A.S.year ? 1 : 0) + (A.patronOf && A.patronOf(pc) ? 0.5 : 0);
  RN.pend = null;
  // called by promoCheckNow (patch RN-MIL) where it rolled the board's chance; chance is the board's factors on 0.5
  RN.milRoll = function (pc, chance, board) {
    const m = pc.mil, r = m.rank;
    let mods = clamp(chance, 0.004, 1.5) / 0.5;
    // the deed row is soft, and the board halved the chance when it was not met: the hazard counts deeds already
    const row = (board || []).find(b => b.k === 'deed');
    if (row && !row.ok) mods *= 2;
    const canSkip = !!GD.MIL[r + 2] && r + 2 < 7;
    const res = RN.promoRoll(pc, { kind: 'mil', rank: r, ladder: GD.MIL.map(t => t.title), vacancy: RN.milVacancy(pc), patron: RN.milPatron(pc), mods: clamp(mods, 0.02, 3),
      months: A._promoBoard ? 3 : 1, canSkip });
    RN.pend = res ? { pc: pc.id, kind: 'mil', from: r, jump: res.jump, why: res.why } : null;
    return !!res;
  };
  const pcheck = A.promoCheck;
  A.promoCheck = function (pc) {
    RN.pend = null;
    const r0 = pc && pc.mil ? pc.mil.rank : null;
    const out = pcheck.apply(this, arguments);
    try {
      const P = RN.pend; RN.pend = null;
      const m = pc && pc.mil;
      if (P && m && m.rank === r0 + 1) {
        if (P.why && /^for /.test(P.why)) A.log(`The board's reason: ${P.why}.`, 'good');
        if (P.jump === 2 && GD.MIL[m.rank + 1] && m.rank + 1 < 7) {
          const skipped = GD.MIL[m.rank].title;
          m.rank++; m.rankSince = A.absDay();
          A.fame(pc, 2 + m.rank);
          const t = GD.MIL[m.rank];
          A.log(`RAISED PAST A RANK: ${t.title}, never having served as ${skipped}. You now lead ${A.fmt(t.leads)}${m.rank >= 4 ? ' — men who will live or die by your orders' : ''}.`, 'big');
          if (m.rank === 2) A.ach('sergeant');
          if (m.rank === 4) A.ach('captain');
          if (m.rank >= 3 && Array.isArray(m.squad)) m.squad = m.squad.slice(0, 6);
          if (A.wsAttachPC) A.wsAttachPC();
        }
      }
    } catch (e) { console.error('v2 renown promo', e); }
    return out;
  };
  // the board: the merit counter becomes the standout deed, in words, and it no longer bars the way
  const board0 = A.promoBoard;
  A.promoBoard = function (pc) {
    const b = board0.apply(this, arguments);
    try {
      if (b && pc && pc.mil) {
        const i = b.findIndex(x => x.k === 'merit');
        if (i >= 0) b[i] = { k: 'deed', label: 'A deed that stands out', have: RN.standWords(pc, 'mil', pc.mil.rank), need: '', ok: RN.standout(pc, 'mil', pc.mil.rank) >= 1, soft: true };
      }
    } catch (e) { console.error('v2 renown board', e); }
    return b;
  };

  // ---- a post ------------------------------------------------------------------------------------------------------------
  RN.jobVacancy = function (pc) {
    const j = pc.job, C = GD.CAREERS[j.c], n = C && C.ranks ? C.ranks.length : 5;
    // the lower rungs of a ladder have many places, the top one
    return clamp(0.5 - 0.4 * j.r / Math.max(1, n - 1), 0.08, 0.6);
  };
  // called by pathMonth (patch RN-JOB) where it rolled the post's monthly chance; ch is the old chance (0.18 at par)
  RN.jobRoll = function (pc, ch, board) {
    const j = pc.job, C = GD.CAREERS[j.c];
    const mods = clamp(clamp(ch, 0.03, 0.6) / 0.18, 0.2, 3);
    const res = RN.promoRoll(pc, { kind: 'job', rank: j.r, ladder: C.ranks.map(x => x[0]), vacancy: RN.jobVacancy(pc), patron: A.patronOf && A.patronOf(pc) ? 0.6 : 0, mods,
      months: 1, canSkip: !!C.ranks[j.r + 2] && !(C.guild && j.r + 1 === 1) });
    RN.pendJob = res ? { pc: pc.id, from: j.r, c: j.c, jump: res.jump, why: res.why } : null;
    return !!res;
  };
  const rankUp = A.jobRankUp;
  A.jobRankUp = function (pc, how) {
    const P = RN.pendJob; RN.pendJob = null;
    const r0 = pc && pc.job ? pc.job.r : null;
    const ok = rankUp.apply(this, arguments);
    try {
      if (ok && P && pc.job && pc.job.c === P.c && P.from === r0) {
        if (P.why && /^for /.test(P.why)) A.log(`They say it was ${P.why}.`, 'good');
        if (P.jump === 2) rankUp.call(this, pc, 'Raised past a rank');
      }
    } catch (e) { console.error('v2 renown job', e); }
    return ok;
  };
  const jboard0 = A.jobBoard;
  A.jobBoard = function (pc) {
    const b = jboard0.apply(this, arguments);
    try {
      if (b && pc && pc.job) {
        const i = b.findIndex(x => x.k === 'merit');
        if (i >= 0) b[i] = { k: 'deed', label: 'Work that stands out', have: RN.standWords(pc, 'job', pc.job.r), need: '', ok: RN.standout(pc, 'job', pc.job.r) >= 1, soft: true };
      }
    } catch (e) { console.error('v2 renown job board', e); }
    return b;
  };
})();
