// S1b stage 6: other people and the top (docs/design/skills.md §10). The same rules in closed form once a year for the
// people with a post (work against the rank's demand, talent, age, the years; concepts by hash: an NPC stuck at Expert V
// for twenty years has a concept that did not come); the few who matter month by month (the player's teacher, rivals,
// household: at most 24) get the player's monthly step for their three best skills; and the census of the top, a count
// and never a cap (order 36, D-043, D-072). Pure: no draws from the world's stream.
(function () {
  const SK = A.SK; if (!SK || !SK.DATA) return;
  const VALUES = SK.VALUES;

  // what a person's post works, and how hard it asks
  SK.postSkills = function (p) {
    const out = [];
    const j = p.job, C = j && GD.CAREERS && GD.CAREERS[j.c];
    if (C && C.skill && SK.canon(C.skill)[0]) out.push([SK.canon(C.skill)[0], SK.demandOf(j.r || 0), 0.6]);
    if (p.mil) {
      const r = p.mil.rank || 0;
      out.push([SK.canon((GD.TROOP_SKILL && GD.TROOP_SKILL[p.mil.troop]) || 'spear')[0], SK.demandOf(1 + r / 2), 0.4]);
      if (r >= 1) out.push(['command', SK.demandOf(r), 0.4]);
      if (r >= 3) out.push(['tactics', SK.demandOf(r - 1), 0.3]);
    }
    if (p.office && A.COUNCIL && A.COUNCIL[p.office] && A.COUNCIL[p.office].skill) out.push([SK.canon(A.COUNCIL[p.office].skill)[0], SK.demandOf(4), 0.6]);
    return out.filter(x => x[0]);
  };
  // one year of a person's post, by the closed form: the expected experience of twelve months at the post's work
  SK.NPC_YEAR = true;
  SK.npcGrowOne = function (p) {
    const age = A.age(p); if (age < 14 || p.prison) return 0;
    const Eng = SK.E(), v = SK.npcView(p);
    let n = 0;
    for (const [k, demand, eu] of SK.postSkills(p)) {
      const lv0 = SK.lvOfValue((p.skills && p.skills[k]) || 0), L = VALUES[lv0];
      let x = Eng.npcYearXp(k, L, age, (p.tal && p.tal[k]) || 'C', { eu, q: 'work', demand });
      if (SK.bodyStall(p, k, lv0)) x = 0;
      if (!(x > 0.05)) continue;
      const r = Eng.npcGain(v, k, lv0, (p.skx && p.skx[k]) || 0, x, SK.effortYears(p, k), false);
      if (!p.skills) p.skills = {};
      if (r.lv > 0) p.skills[k] = VALUES[r.lv];
      if (r.lv >= SK.MAX_LV || r.xp <= 0.05) { if (p.skx) delete p.skx[k]; } else { p.skx = p.skx || {}; p.skx[k] = Math.round(r.xp * 10) / 10; }
      n++;
    }
    return n;
  };
  // the census: everyone alive whose best skill reads Grandmaster (88) or Legend (96)
  SK.census = function (S) {
    S = S || A.S; if (!S || !S.people) return null;
    const gm = [], legend = [];
    for (const id in S.people) {
      const p = S.people[id]; if (!p || !p.alive || !p.skills) continue;
      let best = 0; for (const k in p.skills) if (SK.BY[k] && p.skills[k] > best) best = p.skills[k];
      if (best >= 96) legend.push(id); else if (best >= 88) gm.push(id);
    }
    // a count, never a cap; the ids kept are bounded (rule 21), the counts are whole
    S.top = { y: S.year, gm: gm.slice(0, 24), legend: legend.slice(0, 8), n: [gm.length, legend.length] };
    return S.top;
  };
  SK.npcGrowYear = function (S) {
    if (!SK.NPC_YEAR) return;
    for (const id in S.people) {
      const p = S.people[id]; if (!p || !p.alive || id == S.pc) continue;
      if (p.job || p.mil || p.office) SK.npcGrowOne(p);
    }
    SK.census(S);
  };

  // ---- the few who matter month by month (at most 24) ----------------------------------------------------------------
  // the player's teacher, rivals and household get his monthly step for their three best skills, by the same closed form
  // as a month of their post (they have one number a skill, so no bar of their own)
  SK.ACTIVE_MAX = 24;
  SK.activeOf = function (pc) {
    const out = [], seen = new Set([pc.id]);
    const add = p => { if (p && p.alive && !seen.has(p.id) && out.length < SK.ACTIVE_MAX && A.age(p) >= 14) { seen.add(p.id); out.push(p); } };
    if (pc.school && pc.school.mpid) add(A.P(pc.school.mpid));
    for (const { p } of (A.relsOf ? A.relsOf(pc, ['rival', 'mentor', 'master', 'spouse', 'comrade']) : [])) add(p);
    for (const c of pc.children || []) add(A.P(c));
    return out;
  };
  SK.activeMonth = function (pc) {
    for (const p of SK.activeOf(pc)) {
      const ks = Object.keys(p.skills || {}).filter(k => SK.BY[k]).sort((a, b) => p.skills[b] - p.skills[a]).slice(0, 3);
      for (const k of ks) {
        const post = SK.postSkills(p).find(x => x[0] === k);
        A.gainXp(p, k, post ? post[2] : 0.3, { q: post ? 'work' : 'practice', demand: post ? post[1] : undefined, why: 'the month' });
      }
    }
  };
  const month = SK.month;
  SK.month = function (pc) { const r = month.apply(this, arguments); try { if (pc && pc.alive) SK.activeMonth(pc); } catch (e) { console.error('skills: active', e); } return r; };
})();
