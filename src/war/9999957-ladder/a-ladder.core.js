// D11-3 "careers" (docs/design/war.md §14.1, §16; CRITIQUE W11, R12 and D11's list; D-122 to D-127): each branch's
// ladder, a promotion that weighs the post's own aptitudes, peace service that counts, a role's line of promotion.
//
// - The ladder (data/military/branches.json `ladder`): what each of the five ranks does in that branch. The rank and unit
//   words stay the one glossary's (R14); the ladder says the work.
// - A promotion weighs the post (§14.1: "a captaincy wants command; the train wants numbers; the scouts want fieldcraft;
//   a fine swordsman with no voice stays a fine swordsman"): the board's hazard (99999-v2-renown's RN.milRoll) is scaled
//   by the branch's key skill and, from sergeant up, command (A.LADDER.mod).
// - Peace service counts (R12): a duty done (9999956-units) is a deed of service the board reads, more when done well;
//   duties done at a rank raise the board's hazard a little, and long, clean service at one rank is a floor: past its
//   years the hazard rises, with the reason said.
// - A role's line (data/military/roles.json `line`): a soldier who has held a role two years and has grown in its skill
//   may be raised along it (the clerk to quartermaster, then master of the train), by his commander's decision through
//   A.WHY (kind 'role'); its pay rises with it, and a raised role survives the holder's own promotion as far as its rung.
(function () {
  const L = A.LADDER = A.LADDER || {};
  const MU = A.MUSTER;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const r2 = x => Math.round(x * 100) / 100;
  const day = () => (A.absDay ? A.absDay() : 0);
  L.T = Object.assign({ longYears: [3, 4, 5, 6, 8], longF: 1.6, dutyF: .12, dutyMax: 4, wellW: .5, shareW: .25, roleYears: 2 }, L.T || {});

  // ---------------------------------------------------------------- the ladder in words
  L.line = function (pc) {
    const m = pc && pc.mil, B = m && MU.B(MU.branchOf(pc));
    if (!B || !Array.isArray(B.ladder)) return [];
    return B.ladder.map((does, i) => ({ rank: (MU.ranks()[i] || {}).rank || '', does, here: MU.rankIdx(m.rank | 0) === i }));
  };
  L.doesNow = pc => { const x = L.line(pc).find(y => y.here); return x ? x.does : ''; };

  // ---------------------------------------------------------------- what the board weighs of the post
  // the branch's key skill against a middling man's (30), and from sergeant up command; each a factor 0.6 to 1.5
  L.mod = function (pc) {
    const m = pc && pc.mil;
    if (!m) return { f: 1, why: [] };
    const B = MU.B(MU.branchOf(pc)) || {}, next = MU.rankIdx((m.rank | 0) + 1), why = [];
    const z = k => clamp(1 + ((A.skill(pc, k) || 0) - 30) / 60, .6, 1.5);
    let f = 1;
    // D11+: the road names what the next rung wants (A.PATHS.wants: an archer's captaincy the bow and command, a sapper's
    // command works and stone); without it, the branch's key skill and, from sergeant up, command
    const wants = A.PATHS && A.PATHS.wants ? A.PATHS.wants(pc, next) : [];
    if (wants.length) {
      for (const k of wants.slice(0, 2)) {
        const v = z(k), nm = A.SK ? A.SK.name(k).toLowerCase() : k;
        f *= v; why.push([k === 'command' ? (v >= 1 ? 'men follow you' : 'men do not yet follow you') : v >= 1 ? `the next rung wants ${nm}, and you have it` : `the next rung wants more ${nm} than you have`, v]);
      }
      const tr = A.PATHS.trialsAt ? A.PATHS.trialsAt(pc, MU.rankIdx(m.rank | 0)) : 0;
      if (tr) { const v = 1 + .15 * Math.min(2, tr); f *= v; why.push(['you stood your rung\'s trial', v]); }
      return { f: r2(clamp(f, .4, 2.4)), why };
    }
    if (B.key) { const k = z(B.key); f *= k; why.push([k >= 1 ? `${B.short} want what you know` : `${B.short} want more than you know`, k]); }
    if (next >= 1) { const c = z('command'); f *= c; why.push([c >= 1 ? 'men follow you' : 'men do not yet follow you', c]); }
    return { f: r2(clamp(f, .4, 2)), why };
  };
  // peace service at this rank: duties done (pc.mil.svc, since the rank), and long clean service at one rank
  L.service = function (pc) {
    const m = pc && pc.mil;
    if (!m) return { f: 1, why: [] };
    const why = [];
    const n = Math.min(L.T.dutyMax, (m.svc && m.svc.r === (m.rank | 0)) ? m.svc.n : 0);
    let f = 1 + L.T.dutyF * n;
    if (n) why.push([`${n} ${n === 1 ? 'duty' : 'duties'} done at this rank`, 1 + L.T.dutyF * n]);
    const yrs = m.rankSince != null ? (day() - m.rankSince) / 365 : 0, need = L.T.longYears[MU.rankIdx(m.rank | 0)] || 8;
    if (yrs >= need && !(pc.flags && pc.flags.deserter)) { f *= L.T.longF; why.push([`long and faithful service: ${Math.floor(yrs)} years at this rank`, L.T.longF]); }
    return { f: r2(f), why };
  };
  // the factor 99999-v2-renown's board roll reads (RN.milRoll), and its reasons for the log
  L.boardMod = function (pc) {
    const a = L.mod(pc), b = L.service(pc);
    return { f: r2(clamp(a.f * b.f, .3, 3)), why: a.why.concat(b.why) };
  };

  // ---------------------------------------------------------------- a duty done is a deed of service (R12)
  L.dutyDone = function (pc, duty) {
    const m = pc.mil;
    if (!m || !duty) return;
    if (!m.svc || m.svc.r !== (m.rank | 0)) m.svc = { r: m.rank | 0, n: 0 };
    m.svc.n++;
    const RN = A.RN;
    if (RN && RN.on && RN.st && RN.needed) {
      const w = RN.needed(m.rank | 0) * (duty.q === 'well' ? L.T.wellW : duty.q === 'caught' ? 0 : L.T.shareW);
      if (w > 0) {
        const r = RN.st(pc);
        if (!Array.isArray(r.v)) r.v = [];
        r.v.push({ w: r2(w), year: A.S.year, month: A.monthOf ? A.monthOf(A.today()).m : 0, text: '', field: 'war' });
      }
    }
  };

  // ---------------------------------------------------------------- a role's line
  L.roleTitle = function (pc) {
    const r = pc && pc.mil && pc.mil.role, R = r && MU.R(r.k);
    if (!R) return '';
    return (R.line || [])[r.lv || 0] || R.name;
  };
  // the rung a role survives to: a quartermaster is a captain's post, a master of the train a commander's
  L.roleKeeps = (role, grade) => (grade | 0) < 3 || ((role.lv || 0) >= 1 && (grade | 0) <= 4) || (role.lv || 0) >= 2;
  L.roleOptions = function (pc) {
    const m = pc.mil, r = m.role, R = r && MU.R(r.k);
    if (!R) return null;
    const lv = r.lv || 0;
    if (lv + 1 >= (R.line || []).length) return null;
    const yrs = (A.S.year - (r.y || A.S.year));
    const v = A.skill(pc, R.skill) || 0, want = R.min + 15 * (lv + 1);
    const up = [], stay = [];
    up.push({ kind: 'merit', weight: r2((v - want) / 15), label: v >= want ? `you are good at the ${R.name}'s work` : `you are not yet good enough at it`, source: { t: 'skill', id: R.skill, r: Math.round(v) }, pub: 1 });
    up.push({ kind: 'duty', weight: r2(Math.min(1.2, (yrs - L.T.roleYears + 1) * .4)), label: `${yrs} ${yrs === 1 ? 'year' : 'years'} in the role`, source: { t: 'years', r: yrs }, pub: 1 });
    // the post above held by a seed man of the battalion (one holder a post)
    const key = MU.coKey(m).split(':').slice(0, 2).join(':');
    const held = A.hash ? A.hash('rl' + (lv + 1) + ':' + key + ':' + r.k) % 2 === 0 : false;
    stay.push({ kind: 'cost', weight: held ? 1.2 : .3, label: held ? `the ${R.line[lv + 1]} of the battalion has the post and keeps it` : 'a new man is a risk', source: { t: 'holder', id: R.id }, pub: 1 });
    return [{ id: 'up', reasons: up }, { id: 'stay', reasons: stay }];
  };
  L.roleYear = function (pc) {
    const m = pc && pc.mil, r = m && m.role;
    if (!r || pc.id !== A.S.pc) return null;
    if ((A.S.year - (r.y || A.S.year)) < L.T.roleYears) return null;
    const opts = L.roleOptions(pc);
    if (!opts) return null;
    const C = MU.captainOf ? MU.captainOf(pc) : { who: 'cap', name: 'Your captain' };
    const rec = A.WHY.decide(C.who, 'role', opts, { band: .3, at: pc.id, r: m.realm, rand: MU.rng('rl+:' + pc.id + ':' + A.S.year), logIf: x => x.chose === 'up' });
    if (rec && rec.chose === 'up') {
      r.lv = (r.lv || 0) + 1;
      r.y = A.S.year;
      A.log(`You are raised to ${L.roleTitle(pc)}: ${rec.why.slice(0, 2).map(x => x[0]).join(', and ')}.`, 'good');
    }
    return rec;
  };
  L.rolePay = pc => { const r = pc.mil && pc.mil.role, R = r && MU.R(r.k); return R ? (R.pay || 0) * (1 + (r.lv || 0)) : 0; };
  A.onMonth.push(pc => {
    try {
      const m = pc && pc.alive && pc.mil;
      if (!m || pc.id !== A.S.pc) return;
      // once a year, in the month he took the role
      if (m.role && A.today && Math.floor(A.today() / 30.4) === 0) L.roleYear(pc);
    } catch (e) { console.error('[careers] month', e); }
  });
})();
