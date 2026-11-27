// S1b stage 6: other people and the top (docs/design/skills.md §10). The same rules in closed form once a year for the
// people with a post (work against the rank's demand, talent, age, the years; concepts by hash: an NPC stuck at Expert V
// for twenty years has a concept that did not come) and for a master at his own art (H-167, D-196: a post is the
// registry's or a crown; a master keeps his best art up at practice); the few who matter month by month (the player's teacher, rivals,
// household: at most 24) get the player's monthly step for their three best skills; and the census of the top, a count
// and never a cap (order 36, D-043, D-072). Pure: no draws from the world's stream.
(function () {
  const SK = A.SK; if (!SK || !SK.DATA) return;
  const VALUES = SK.VALUES;

  // what a person's post works, and how hard it asks
  // H-167 (D-196): an NPC's posts are in the registry (999990-posts: a council seat, a shire office, a field command, a
  // company, an elite order) and a crown is p.ruler; p.office is the player's own mirror of his seat, never written for
  // anyone else, and p.job and p.mil are rare on NPCs (none in the starting world has either). So the closed form saw
  // almost nobody at work: seed 8383 at year 20 had 11 people of 1,452 growing, and 435 holding a post. A house or a
  // court title is a rank, not a post (A.POSTS.title), and works nothing. Each: [skill, the demand's rank, effort]
  SK.POST_WORK = {
    gov: [['stewardship', 3, 0.5], ['command', 2, 0.2]],   // a governor: the shire's taxes, its muster, its peace
    mag: [['learning', 2, 0.5]],                            // a magistrate: the law
    reeve: [['stewardship', 2, 0.5]],                       // the market peace and the town's tolls
    warden: [['command', 3, 0.5]],                          // a border shire held against a neighbour
    customs: [['trade', 2, 0.5]],                           // the crown's share of sea trade
    field: [['command', 5, 0.5], ['tactics', 4, 0.3]],     // a General: an army in the field or a host
    company: [['command', 2, 0.4]],                         // the captain of a company or a battalion
    order: [['command', 4, 0.4]],                           // the Grand Master of an elite order
    crown: [['diplomacy', 5, 0.4], ['stewardship', 5, 0.3], ['command', 4, 0.2]],   // a ruler: statecraft, the purse, the realm's arms
  };
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
    // the registry's posts and the crown (the player's own posts teach him month by month: 36-skills' d-sources)
    if (p.id && A.S && p.id !== A.S.pc) {
      const W = SK.POST_WORK, P = A.POSTS;
      const add = (k, r, eu) => { k = SK.canon(k)[0]; if (k && !out.some(x => x[0] === k)) out.push([k, SK.demandOf(r), eu]); };
      const each = list => { for (const [k, r, eu] of list || []) add(k, r, eu); };
      if (P && P.held) for (const key of P.held(p.id)) {
        const kind = key.slice(0, key.indexOf(':'));
        if (kind === 'seat') { const D = A.COUNCIL && A.COUNCIL[P.parse(key).id]; if (D && D.skill) add(D.skill, 4, 0.6); }
        else if (kind === 'office') each(W[P.parse(key).id.split(':')[0]]);
        else if (kind === 'army' || kind === 'div') each(W.field);
        else if (kind === 'coy' || kind === 'bn') each(W.company);
        else if (kind === 'order') each(W.order);
      }
      if (p.ruler) each(W.crown);
    }
    return out.filter(x => x[0]);
  };
  // does he work at a post? (the closed form's years of effort, and the deed his post gives him at an edge: npcGate)
  SK.works = p => !!(p && (p.job || p.mil || p.office || p.ruler || SK.postSkills(p).length));
  // a post the realm knows of: a council seat, a shire office, a field command, an order, a crown (the renowned deed)
  SK.highPost = p => !!(p && (p.office || p.ruler || (A.POSTS && A.POSTS.held && p.id && A.POSTS.held(p.id).some(k => /^(seat|office|army|div|order):/.test(k)))));

  // H-167 (D-196): a master keeps up his own art. No post asks more than Master III of anyone (SK.RANK_DEMAND's top,
  // 78.4), so past it a post teaches at a sixth of its pace, and nobody in the world rose to Grandmaster: the census
  // was the starting world's masters, dying (seed 8383: 4 Grandmasters at the start, none in year 33). Someone whose
  // best art stands at Master or above works at it for its own sake, at practice (no teacher stands above him), while
  // he is young enough to push it. Below Master his post's work, a teacher or a card carries him, as before.
  SK.MASTER_FROM = 72;      // the value of Master I
  SK.MASTER_EU = 0.5;       // half a month's effort, the year round (a post's work: 0.6 at half quality); tuned on s1Census
  SK.MASTER_UNTIL = 70;     // years, in a human's: his age x 16 / his people's age of majority
  SK.masterArt = function (p, age) {
    let best = 0, bk = null;
    for (const k in p.skills) if (SK.BY[k] && p.skills[k] > best) { best = p.skills[k]; bk = k; }
    if (!bk || best < SK.MASTER_FROM) return null;
    const R = GD.RACES && GD.RACES[p.race];
    return (R && R.adult ? age * 16 / R.adult : age) < SK.MASTER_UNTIL ? bk : null;
  };

  // one year of a person's post, by the closed form: the expected experience of twelve months at the post's work; and
  // a master's year at his own art
  SK.NPC_YEAR = true;
  SK.npcGrowOne = function (p) {
    const age = A.age(p); if (age < 14 || p.prison) return 0;
    const acts = SK.postSkills(p), art = p.skills ? SK.masterArt(p, age) : null;
    if (art) acts.push([art, undefined, SK.MASTER_EU, 'practice']);
    if (!acts.length) return 0;
    // he works when his posts give him anything to work at, or an older field says so (SK.works, read once here)
    const Eng = SK.E(), works = !!(p.job || p.mil || p.office || p.ruler || acts.length > (art ? 1 : 0));
    let n = 0, v = null;
    for (const [k, demand, eu, q] of acts) {
      const lv0 = SK.lvOfValue((p.skills && p.skills[k]) || 0), L = VALUES[lv0];
      const x = Eng.npcYearXp(k, L, age, (p.tal && p.tal[k]) || 'C', { eu, q: q || 'work', demand });
      if (!(x > 0.05) || SK.bodyStall(p, k, lv0)) continue;
      v = v || SK.npcView(p);
      const r = Eng.npcGain(v, k, lv0, (p.skx && p.skx[k]) || 0, x, SK.effortYears(p, k, works), false);
      if (!p.skills) p.skills = {};
      if (r.lv > 0) p.skills[k] = VALUES[r.lv];
      if (r.lv > lv0 && A.SK2 && A.SK2.npcEvolved) A.SK2.npcEvolved(p, k, lv0, r.lv);   // an evolution's gift (D-182)
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
      SK.npcGrowOne(p);   // his posts (the registry's, a crown) and a master's own art; nobody else moves (H-167)
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
