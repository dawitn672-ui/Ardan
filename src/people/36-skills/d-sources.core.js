// S1b: where experience comes from (docs/design/skills.md §3.2). Each source is an effort with a quality and a cause:
// the training plan once a month (drill with a teacher above you, else practice), a post (work against the rank's
// demand), school (drill, the master as teacher), a card's check (a stretch against its difficulty) and its grants, a
// fight (a stretch against the foe), the ranks' year. The daily drip and the 0.3 a month are gone (release edits).
(function () {
  const SK = A.SK; if (!SK || !SK.DATA) return;

  // the plan's pace: effort a month (rest 0.15, light 0.5, steady 1, hard 1.4, brutal 1.7)
  SK.PACE = { rest: 0.15, light: 0.5, steady: 1, hard: 1.4, brutal: 1.7 };
  // what a post's rank asks of its skill, as a level: the work stops teaching past it ("asks nothing new of you")
  SK.RANK_DEMAND = [8, 11, 14, 17, 19, 21, 23];
  SK.demandOf = r => SK.RANK_DEMAND[Math.max(0, Math.min(SK.RANK_DEMAND.length - 1, r | 0))];
  SK.POST_EFFORT = 0.6;
  SK.SCHOOL_EFFORT = 1.0;

  // does a teacher hold the concepts of word w? (the closed form for people with one number; a teacher shows only
  // what he grasped himself)
  SK.teacherHolds = function (t, k, w) {
    if (!t) return false;
    if (t.sk && t.sk[k]) return SK.E().conceptsOf(k, w).every(c => t.sk[k].got[c.id] != null);
    const lv = SK.lvOf(t, k); if (SK.wordOf(lv) < w) return false;
    const Eng = SK.E(), v = SK.npcView(t), years = SK.effortYears(t, k);
    return Eng.conceptsOf(k, w).every(c => Eng.graspedBy(v, k, c, years + 10));
  };
  SK.nameOf = p => (p ? (A.fullName ? A.fullName(p, false) : p.given) : 'your teacher');
  // a teacher in reach who stands above you: a drill; else practice alone
  SK.teachCause = function (pc, k, why) {
    const c = SK.canon(k)[0]; if (!c) return { q: 'practice', why };
    const T = A.teacherFor ? A.teacherFor(pc, c) : null, mine = SK.lvOf(pc, c);
    if (T && T.p && SK.wordOf(SK.lvOf(T.p, c)) > SK.wordOf(mine)) {
      const tl = SK.lvOf(T.p, c), w = SK.wordOf(mine) + 1;
      return { q: 'drill', teacher: tl, who: SK.nameOf(T.p), holds: SK.teacherHolds(T.p, c, w), good: T.p.traits && T.p.traits.includes('patient') ? 1 : 0, why: `${SK.nameOf(T.p)}'s teaching` };
    }
    return { q: 'practice', why: why || `${SK.name(c)}, practised alone` };
  };

  // the month's efforts, queued before the month's pass (b-month calls this)
  SK.queueMonth = function (pc) {
    if (A.age(pc) < 4) return;
    const P = A.plan ? A.plan(pc) : {};
    // the training plan
    if (P.train && GD.SKILLS[P.train] && !pc.prison) {
      const pace = SK.PACE[P.intensity] != null ? SK.PACE[P.intensity] : 1;
      const cz = SK.teachCause(pc, P.train);
      if (pc.health < 30) { cz.mul = 0.3; cz.mulTag = 'hurt'; }
      A.gainXp(pc, P.train, pace, cz);
    }
    if (pc.prison) return;
    // school: the master's drill
    const sc = pc.school;
    if (sc && sc.skill && GD.SKILLS[sc.skill]) {
      const m = sc.mpid ? A.P(sc.mpid) : null, c = SK.canon(sc.skill)[0];
      const tl = m ? SK.lvOf(m, c) : Math.min(SK.MAX_LV, SK.lvOf(pc, c) + 6);
      A.gainXp(pc, sc.skill, SK.SCHOOL_EFFORT, { q: 'drill', teacher: tl, who: sc.master || 'the master', holds: m ? SK.teacherHolds(m, c, SK.wordOf(SK.lvOf(pc, c)) + 1) : true, why: `the lessons at ${sc.name || 'the school'}` });
    }
    // a post: the work of the rank
    const j = pc.job, C = j && GD.CAREERS && GD.CAREERS[j.c];
    if (C && C.skill && GD.SKILLS[C.skill]) {
      const rank = C.ranks && C.ranks[j.r] ? C.ranks[j.r][0].toLowerCase() : 'your post';
      A.gainXp(pc, C.skill, SK.POST_EFFORT, { q: 'work', demand: SK.demandOf(j.r), why: `the work of a ${rank}` });
    }
    // the ranks: a soldier's duty in his troop's weapon; an officer's in command
    if (pc.mil && GD.TROOP_SKILL) {
      const sk = GD.TROOP_SKILL[pc.mil.troop] || 'spear';
      A.gainXp(pc, sk, SK.POST_EFFORT * 0.5, { q: 'work', demand: SK.demandOf(1 + (pc.mil.rank || 0) / 2), why: 'duty in the ranks' });
      if ((pc.mil.rank || 0) >= 1) A.gainXp(pc, 'command', SK.POST_EFFORT * 0.5, { q: 'work', demand: SK.demandOf(pc.mil.rank), why: 'commanding your men' });
    }
    // an office: its seat's work
    if (pc.office && A.COUNCIL && A.COUNCIL[pc.office] && A.COUNCIL[pc.office].skill) {
      A.gainXp(pc, A.COUNCIL[pc.office].skill, SK.POST_EFFORT, { q: 'work', demand: SK.demandOf(4), why: `the business of the ${A.COUNCIL[pc.office].name.toLowerCase()}` });
    }
  };

  // an activity: the yard and practice are drill with a teacher in reach, else practice; anything else names itself
  SK.actCause = function (pc, key, arg) {
    const D = GD.ACTIVITIES && GD.ACTIVITIES[key], name = D && D.name ? D.name.toLowerCase() : key;
    if (key === 'practice' || key === 'train_yard') {
      const k = arg && GD.SKILLS[arg] ? arg : A.weaponSkillOf ? A.weaponSkillOf(pc) : null;
      if (k) return SK.teachCause(pc, k, key === 'train_yard' ? 'the yard' : undefined);
    }
    return { q: 'practice', why: name };
  };

  // a fight: a stretch against the foe's level; a defeat by a better hand, a win far above you, a bout with a rival
  // are breakthrough moments
  SK.isRival = (pc, foe) => !!(foe && pc.rel && pc.rel[foe.id] && (pc.rel[foe.id].type === 'rival' || pc.rel[foe.id].rival));
  SK.fightCause = function (D, foe, sk) {
    const pc = A.pc(); if (!pc) return undefined;
    const won = D.result === 'win' || D.result === 'beastfled', mine = SK.lvOf(pc, sk);
    let d = foe ? SK.lvOf(foe, sk) : mine + Math.round((D.gap || 0) / 4);
    d = Math.max(1, Math.min(SK.MAX_LV, d));
    const who = (D.b && D.b.short) || 'a foe';
    const trigger = SK.isRival(pc, foe) ? 'rival' : !won && d > mine ? 'defeat' : won && d >= mine + 3 ? 'feat' : undefined;
    // a fight lost before others: a proud temper may be humbled by it (sk_humbled)
    if (!won && D.kind !== 'spar' && pc.flags) pc.flags.sk_lost_public = A.S.year;
    return { q: 'stretch', d, failed: !won, trigger, why: `${D.kind === 'spar' ? 'the bout' : 'the fight'} with ${who}` };
  };
  // the ranks' year: the sergeants drill a recruit; a veteran's year is work
  SK.ranksCause = function (pc, sk) {
    const rank = (pc.mil && pc.mil.rank) || 0;
    if (rank < 2 && SK.lvOf(pc, sk) < 11) return { q: 'drill', teacher: 13, who: 'the sergeants', why: 'the sergeants\' drill' };
    return { q: 'work', demand: SK.demandOf(1 + rank / 2), why: 'a year in the ranks' };
  };

  // a card's choice sets the cause of what it grants: a stretch when it had a check, a fight or a named stake
  A.addStage('A.eventChoose', 'skills', choose => function (idx) {
    const q = A.S && A.S.queue[0], e = q && q.type === 'event' && A.EV[q.ev];
    let cz = null;
    try {
      if (e && q.view && q.view.choices && q.view.choices[idx]) {
        const c = e.choices[q.view.choices[idx].i];
        if (c) cz = c.check || c.group ? { q: 'stretch', d: c.check ? SK.lvOfValue(c.check.d || 45) : undefined, why: SK.cardTitle(q, e) } : { q: 'practice', why: SK.cardTitle(q, e) };
      }
    } catch (err) { cz = null; }
    return cz ? SK.within(cz, choose, this, arguments) : choose.apply(this, arguments);
  });
})();
