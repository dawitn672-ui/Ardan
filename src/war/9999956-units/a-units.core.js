// D11-2 "units that differ" (docs/design/war.md §14.1, §14.2, §16; D-116 to D-121): what a company is.
//
// A company (a battalion record of 9997-companies, d.bs[i], or one of its support companies) is described by three
// things (§14.2), all read here:
//  1. its make-up (A.UNITS.makeup): its branch (the troop's, or the support company's), its men, how many are veterans
//     and how many raw (the record's experience), conscripts, its sergeants (9997's seeds), its captain's temper;
//  2. its abilities (A.UNITS.grade): a grade 0-100 in each drill of its branch's own list (data/military/drills.json).
//     Every company's grade is read from what the war map already keeps (the division's drill in that drill's family,
//     60-unit-drill, and the record's experience), with a small difference of its own by its seed; the grades a company
//     has drilled for itself are stored on its record (b.dg), only for the companies the player drills in;
//  3. its tendencies (A.UNITS.tend): what it is like, from its own history in the ledger (b.td: "it broke before horse
//     at Camia", "it held the ford"; written after each fight, three at most) and from its captain and its men (a bold
//     captain lets it chase; a cautious one is slow to form; a raw company is raw).
// Pure readings, except U.afterFight (the fight's record) and U.seat (the support company a branch mans).
(function () {
  const U = A.UNITS = A.UNITS || {};
  const MU = A.MUSTER;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const isSup = c => !!(c && !GD.BN[c] && GD.SUP && GD.SUP[c]);
  const DD = () => (A.DATA && A.DATA['military/drills']) || { drills: [] };
  const DU = () => (A.DATA && A.DATA['military/duties']) || { duties: [] };
  let IX = null;
  const ix = () => {
    const d = DD();
    if (IX && IX.d === d) return IX;
    const m = new Map(), by = new Map();
    for (const x of d.drills || []) { m.set(x.id, x); for (const b of x.branches || []) { if (!by.has(b)) by.set(b, []); by.get(b).push(x); } }
    IX = { d, m, by };
    return IX;
  };
  U.drills = () => DD().drills || [];
  U.D = id => ix().m.get(id) || null;
  U.listFor = b => ix().by.get(b) || [];
  U.duties = () => DU().duties || [];
  U.hash = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  // ---------------------------------------------------------------- make-up
  // the branch of a company record: the support company's branch, else its troop's
  U.branchOf = function (rec) {
    if (!rec) return null;
    if (isSup(rec.c)) { const B = MU.branches().find(x => (x.sup || []).includes(rec.c)); return B ? B.id : 'engineers'; }
    return MU.branchOfTroop(rec.c);
  };
  // the player's company: its division, record and branch (the player's own branch when he stands in it)
  U.mine = function (pc) {
    const M = A.CO && A.CO.mine ? A.CO.mine(pc) : null;
    if (!M) return null;
    return Object.assign({ branch: U.branchOf(M.rec), key: `${M.d.id}:${M.b}` }, M);
  };
  U.makeup = function (d, i) {
    const b = d && d.bs && d.bs[i];
    if (!b) return null;
    const men = b.k.reduce((a, x) => a + (x || 0), 0), x = b.x || 0;
    const vet = clamp(Math.round(x / 60 * 100) / 100, 0, 1);
    const cap = A.CO.capStat ? A.CO.capStat(d, i, 0) : null;
    const sg = A.CO.sergeants && !isSup(b.c) ? A.CO.sergeants(d, i, 0) : [];
    return {
      branch: U.branchOf(b), code: b.c, men, comps: b.k.length, vet, raw: 1 - vet, exp: Math.round(x),
      conscripts: !!d.call || b.c === 'LV', temper: cap ? cap.temper : 'steady', capCmd: cap ? cap.cmd : 40,
      sergeants: (sg || []).map(s => s && (s.name || s.given)).filter(Boolean).slice(0, 2), sup: isSup(b.c),
    };
  };
  U.vetWord = v => (v >= .66 ? 'mostly veterans' : v >= .33 ? 'veterans and raw men together' : 'mostly raw men');

  // ---------------------------------------------------------------- abilities
  // the division's drill of a family (60-unit-drill's record, 0..1), and the company's own difference by its seed
  const famOf = (d, k) => { const D = A.DRILL; const rec = D && D.of ? D.of(d) : d.dr || {}; return (rec && rec[k]) || 0; };
  U.baseGrade = function (d, i, id) {
    const b = d.bs[i], X = U.D(id);
    if (!b || !X) return 0;
    const own = (U.hash(d.id + '|' + i + '|' + id) % 21) - 10;
    return Math.round(clamp(famOf(d, X.feeds) * 70 + (b.x || 0) * .35 + own, 0, 100));
  };
  U.grade = function (d, i, id) {
    const b = d && d.bs && d.bs[i];
    if (!b) return 0;
    if (b.dg && b.dg[id] != null) return b.dg[id];
    return U.baseGrade(d, i, id);
  };
  U.GRADE_W = g => (g >= 70 ? 'hard-drilled' : g >= 40 ? 'drilled' : g >= 15 ? 'half-drilled' : 'never drilled');
  U.abilities = function (d, i) {
    const B = U.branchOf(d.bs[i]);
    return U.listFor(B).map(x => [x.id, U.grade(d, i, x.id)]).sort((a, b) => b[1] - a[1]);
  };

  // ---------------------------------------------------------------- tendencies
  const TEND = {
    shy_horse: p => `it broke before horse at ${p}`,
    proud: p => `it held at ${p}, and is proud of it`,
    chases: p => (p ? `it chased too far at ${p}` : 'its captain lets it chase too far'),
    shaken: p => `it lost a quarter of its men at ${p}`,
    slow: () => 'it is slow to form',
    raw: () => 'most of its men have never stood in a line',
  };
  U.TEND = TEND;
  // what it is like: its ledger first (newest first), then its captain and its men
  U.tend = function (d, i) {
    const b = d && d.bs && d.bs[i];
    if (!b) return [];
    const out = [];
    for (const t of (b.td || []).slice().reverse()) if (TEND[t[0]]) out.push({ k: t[0], y: t[1], label: TEND[t[0]](t[2]), from: 'ledger' });
    const cap = A.CO.capStat ? A.CO.capStat(d, i, 0) : null;
    if (cap && cap.temper === 'bold' && !out.some(x => x.k === 'chases')) out.push({ k: 'chases', label: TEND.chases(''), from: 'captain' });
    if (((cap && cap.temper === 'cautious') || d.call || b.c === 'LV') && !out.some(x => x.k === 'slow')) out.push({ k: 'slow', label: TEND.slow(), from: cap && cap.temper === 'cautious' ? 'captain' : 'men' });
    if ((b.x || 0) < 10 && !isSup(b.c)) out.push({ k: 'raw', label: TEND.raw(), from: 'men' });
    return out.slice(0, 4);
  };
  // the enemy side's share of horse in a fight
  const horseShare = ids => {
    let h = 0, n = 0;
    for (const id of ids || []) { const d = A.divById(id); if (!d || !Array.isArray(d.bs)) continue; for (const b of d.bs) { const m = b.k.reduce((a, x) => a + x, 0); n += m; if (GD.BN[b.c] && GD.BN[b.c].cat === 'horse') h += m; } }
    return n ? h / n : 0;
  };
  // a fight writes what it did to each company into its ledger (9997's CO.afterFight calls this): three at most
  U.afterFight = function (d, i, o) {
    const b = d.bs[i];
    if (!b || !o || !o.P) return;
    const foe = o.atk ? o.F.dIds : o.F.aIds, cat = GD.BN[b.c] ? GD.BN[b.c].cat : 'sup';
    let k = null;
    if (!o.won && o.frac >= .25 && cat !== 'horse' && horseShare(foe) >= .15) k = 'shy_horse';
    else if (o.won && !o.atk && o.frac >= .12) k = 'proud';
    else if (o.won && o.atk && cat === 'horse') k = 'chases';
    else if (!o.won && o.frac >= .25) k = 'shaken';
    if (!k) return;
    const L = b.td = Array.isArray(b.td) ? b.td.filter(t => t[0] !== k) : [];
    L.push([k, A.S.year, String(o.P.name || '').replace(/[<>"]/g, '').slice(0, 40)]);
    if (L.length > 3) L.splice(0, L.length - 3);
  };

  // ---------------------------------------------------------------- support companies (D-117)
  // the support companies a soldier's branch mans, for a soldier, sergeant or captain (a support company has one
  // company and one captain's slot; a commander leads a wing of a combat battalion)
  U.supFor = function (pc) {
    const m = pc && pc.mil;
    if (!m || m.merc || (m.rank | 0) >= 5) return null;
    const B = MU.B(MU.branchOf(pc));
    return B && (B.sup || []).length ? B.sup : null;
  };
})();
