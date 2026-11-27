// S1b: skills with levels and experience (docs/design/skills.md, D-072). The store, the mirror and the one door.
//
// - The player's skills live in pc.sk[k], in exactly the engine's shape (src/people/engine/skills.js, A.V2.skills):
//   level, experience, stored experience, proof, best, rust, the year used, the streak, insight and grasped concepts,
//   specialisms. Other people keep one number a skill, p.skills[k], which is the value their level reads.
// - p.skills[k] is a mirror: the value of the level (one of 36 values on the 0-100 scale the cards' checks are written
//   against), for everyone. A.SK writes it; A.skill reads it (03-engine-base), adding the specialism, rust, the body's
//   hold and wounds. A number written into it by older code (a new NPC rolled at 47) is read as the level under it and
//   taken into the player's table by the month's pass (SK.adopt), with the cause "set".
// - A.gainXp(p, k, effort, cause) is the only way experience moves. For the player it is queued for the month's pass
//   (A.onMonth: the life's factors, insight, breakthroughs and levels, in the engine); for anyone else it lands at once
//   by the closed form. A.trainSkill(p, k, amt) is the shim: amt x 0.2 effort, a cause read from what is running.
// - The ten legacy keys (dagger, xbow, lance, logistics...) are specialisms of a skill: SK.canon('xbow') is
//   ['bow', 'the-crossbow'].
(function () {
  const SK = A.SK = A.SK || {};
  const D = SK.DATA = A.DATA && A.DATA.skills;
  if (!D) { console.error('skills: no data/skills.json on the page'); return; }

  // ---- the engine, on first use (A.V2 is bundled after this feature) ------------------------------------------------
  let E = null;
  SK.E = () => { if (!E) { E = A.V2.skills; E.setData(D); } return E; };

  // ---- levels, read without the engine (the hot path: every check) --------------------------------------------------
  // S1's 35 steps in seven bands of five. The skills rebuild's switch (step 5, D-179): the rungs of 37-skills2 hold
  // the level a check reads and the player sees; this table is the experience engine's working form under them, its
  // step the S1 step the rung stands in. S1's names for the bands and steps (the seven words, Roman steps, SK.levelName,
  // SK.wordName, SK.levelOfWord) are archived in archive/s1-skill-words/: a level is printed by A.SK2.label.
  const EDGE = [1, 15, 35, 55, 72, 88, 96, 101], STEPS = 5, MAX_LV = 35, BANDS = SK.BANDS = 7;
  const wordOf = SK.wordOf = lv => (lv <= 0 ? -1 : Math.floor((lv - 1) / STEPS));
  const stepOf = SK.stepOf = lv => (lv <= 0 ? 0 : ((lv - 1) % STEPS) + 1);
  const VALUES = SK.VALUES = [0];
  for (let lv = 1; lv <= MAX_LV; lv++) { const w = wordOf(lv); VALUES.push(EDGE[w] + (stepOf(lv) - 1) * (EDGE[w + 1] - EDGE[w]) / STEPS); }
  SK.MAX_LV = MAX_LV; SK.STEPS = STEPS; SK.EDGE = EDGE;
  SK.value = lv => VALUES[Math.max(0, Math.min(MAX_LV, lv | 0))];
  const lvOfValue = SK.lvOfValue = v => {
    if (!(v >= 1 - 1e-9)) return 0;
    let lo = 1, hi = MAX_LV;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (VALUES[mid] <= v + 1e-9) lo = mid; else hi = mid - 1; }
    return lo;
  };
  // the first step of a band (0 .. 6): what S1's word form of a check named (now only tests and the closed form)
  SK.firstOf = w => w * STEPS + 1;
  // a step and its experience, printed as the rung that holds it ("C · Lv 4"; 37-skills2), for records and checks
  SK.stepLabel = (lv, xp) => (A.SK2 && A.SK2.labelS1 ? A.SK2.labelS1(lv, xp) : lv > 0 ? "step " + lv : "untried");
  const on2 = () => !!(A.SK2 && A.SK2.on);
  // a level's place on the ladder, for counting levels risen: rank x 10 + level (D Lv 1 = 1 .. S Lv 10 = 50); S1's step
  // before the switch. ordOfStep reads a bare step as its odd rung (a season's start, where no experience was kept).
  const RK = ['D', 'C', 'B', 'A', 'S'];
  const ordR = r => (r ? RK.indexOf(r.rank) * 10 + r.lv : 0);
  SK.ordOfStep = lv => (on2() ? ordR(A.SK2.E().rungOfS1(lv)) : lv);
  SK.ordOf = (p, k) => { const s = full(p) && p.sk[k]; if (!s || !(s.lv > 0)) return 0; return on2() ? ordR(A.SK2.rungNow(s)) : s.lv; };
  SK.rankOfOrd = o => (o > 0 ? RK[Math.min(4, Math.floor((o - 1) / 10))] : null);

  // ---- the skills and the legacy keys ------------------------------------------------------------------------------
  SK.IDS = D.skills.map(s => s.id);
  SK.BY = {}; for (const s of D.skills) SK.BY[s.id] = s;
  SK.LEG = {};          // legacy key -> [skill, specialism id]
  SK.SPEC = {};         // skill -> { specialism id -> specialism }
  for (const s of D.skills) {
    SK.SPEC[s.id] = {};
    for (const sp of s.specialisms) { SK.SPEC[s.id][sp.id] = sp; if (sp.legacy) SK.LEG[sp.legacy] = [s.id, sp.id]; }
  }
  const NONE = [null, null];
  SK.canon = k => SK.LEG[k] || (SK.BY[k] ? [k, null] : NONE);
  SK.isSkill = k => !!(SK.BY[k] || SK.LEG[k]);
  SK.name = k => { const c = SK.canon(k); return c[0] ? SK.BY[c[0]].name : (GD.SKILLS && GD.SKILLS[k]) || k; };
  SK.specName = (k, id) => { const S = SK.SPEC[k]; return S && S[id] ? S[id].name : id; };
  // a compatibility view for code that read 49-body-mind's merge (BM.MERGE, BM.canon): retired wrappers, same answers
  A.BM = A.BM || {};
  A.BM.MERGE = {}; for (const k in SK.LEG) A.BM.MERGE[k] = SK.LEG[k][0];
  A.BM.canon = k => (SK.LEG[k] ? SK.LEG[k][0] : k);

  // the game's data, one definition: names, groups and governing stats from data/skills.json; every key a check may
  // name stays in GD.SKILLS (the 28 and the 10 legacy keys, which read their skill); the list to pick from is the 28
  GD.SKILLS = GD.SKILLS || {};
  for (const s of D.skills) GD.SKILLS[s.id] = s.name;
  for (const k in SK.LEG) GD.SKILLS[k] = GD.SKILLS[k] || SK.BY[SK.LEG[k][0]].name;
  GD.SKILL_LIST = SK.IDS.slice();
  GD.SKILL_STAT = GD.SKILL_STAT || {};
  for (const s of D.skills) GD.SKILL_STAT[s.id] = s.gov.slice();
  GD.SKILL_CATS = {}; GD.SKILL_CAT_OF = GD.SKILL_CAT_OF || {};
  for (const s of D.skills) (GD.SKILL_CATS[s.group] = GD.SKILL_CATS[s.group] || []).push(s.id);
  // the release's checks on "Martial" skills (a fine weapon, a pulled shoulder) read the Arms group
  for (const s of D.skills) GD.SKILL_CAT_OF[s.id] = s.group === 'Arms' || s.group === 'The body' ? 'Martial' : s.group;
  for (const k in SK.LEG) GD.SKILL_CAT_OF[k] = GD.SKILL_CAT_OF[SK.LEG[k][0]];
  // knacks: the release's perks, earned at the crossings into Advanced, Expert and Master (35, 55, 72; were 40, 65, 85)
  SK.KNACK_AT = { 40: 35, 65: 55, 72: 72, 85: 72 };
  if (GD.PERKS) for (const k in GD.PERKS) for (const x of GD.PERKS[k]) if (SK.KNACK_AT[x[0]] != null) x[0] = SK.KNACK_AT[x[0]];

  // ---- who has a full table ------------------------------------------------------------------------------------------
  const isPC = SK.isPC = p => !!(p && A.S && p.id === A.S.pc);
  const full = p => !!(p && p.sk && typeof p.sk === 'object');
  SK.ageF = p => A.age(p) + Math.min(364, Math.max(0, (A.S && A.S.warClock) || 0)) / 365;

  // the level a person holds in a skill (the mirror, read through the level under it)
  SK.lvOf = function (p, k) {
    const c = SK.LEG[k] ? SK.LEG[k][0] : k;
    // the player's table; a number older code wrote since the month's pass is read at once (adopted at the month)
    if (full(p) && p.sk[c]) {
      const m = p.skills && p.skills[c], lv0 = m == null || m === SK.valueOf(p, c) ? p.sk[c].lv : lvOfValue(m);
      // a legacy key older code wrote (a test, a scene: p.skills.axe = 60) is read through its skill, the higher
      return c !== k && p.skills && p.skills[k] ? Math.max(lv0, lvOfValue(p.skills[k])) : lv0;
    }
    const sk = p && p.skills; if (!sk) return 0;
    let lv = lvOfValue(sk[c] || 0);
    // older code may still write a legacy key on someone new: it is read through its skill, the higher of the two
    if (c !== k && sk[k]) lv = Math.max(lv, lvOfValue(sk[k]));
    return lv;
  };
  SK.specsOf = function (p, c) { if (full(p) && p.sk[c]) return p.sk[c].sp || []; return (p && p.ssp && p.ssp[c]) || []; };
  // what a check reads: the level's value, the specialism's steps (two up inside it, one down in a sibling), less rust.
  // The body's hold (C9) and wounds come after, in A.skill.
  SK.reads = function (p, k) {
    // the switch: the rungs hold the level (37-skills2; their read equals this one on every odd rung, D-179)
    if (on2()) return A.SK2.reads(p, k);
    return SK.s1reads(p, k);
  };
  // S1's read, kept for the proof of the switch (sk5Switch, sk5Lives: the rungs read the same on the day of the switch)
  SK.s1reads = function (p, k) {
    const L = SK.LEG[k], c = L ? L[0] : k;
    let lv = SK.lvOf(p, k);
    if (!lv) return 0;
    if (L) { const sp = SK.specsOf(p, c); if (sp.length) lv = sp.indexOf(L[1]) >= 0 ? lv + 2 : lv - 1; }
    lv = Math.max(1, Math.min(MAX_LV, lv));
    let v = VALUES[lv];
    if (full(p) && p.sk[c] && p.sk[c].rust > 0) v = Math.max(0, v - p.sk[c].rust);
    return v;
  };
  SK.talentOf = (p, k) => { const c = SK.LEG[k] ? SK.LEG[k][0] : k; return (p && p.tal && p.tal[c]) || 'C'; };
  SK.TALENT_WORD = { F: 'hopeless', E: 'clumsy', D: 'slow', C: 'ordinary', B: 'gifted', A: 'rare', S: 'a prodigy', SSS: 'born to it' };
  SK.TALENT_ORDER = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SSS'];
  // the old aptitude multipliers (0.5 .. 1.85) as letters (growth.md §5's table)
  SK.letterOfApt = a => (a <= 0.5 ? 'F' : a <= 0.75 ? 'D' : a < 1.2 ? 'C' : a < 1.45 ? 'B' : a < 1.8 ? 'A' : 'S');
  SK.raiseTalent = function (p, k, letter) {
    const c = SK.canon(k)[0]; if (!c || !p) return;
    const cur = SK.talentOf(p, c), O = SK.TALENT_ORDER;
    if (O.indexOf(letter) > O.indexOf(cur)) { p.tal = p.tal || {}; p.tal[c] = letter; }
  };

  // ---- writing a level: only here ------------------------------------------------------------------------------------
  // the mirror's number for a person's table entry: the value of the rung that holds it (the switch: a C, B or A step's
  // even level once past half its bar), or S1's step value while the rungs are off
  SK.valueOf = function (p, c) {
    const s = full(p) && p.sk[c]; if (!s || !(s.lv > 0)) return 0;
    if (!on2()) return VALUES[s.lv];
    // a family a merge absorbed reads through it (37-skills2's e-merge, D-182): the better of the two
    const v = A.SK2.valueOfEntry(s), mv = A.SK2.mergedRead ? A.SK2.mergedRead(p, c) : 0;
    return mv > v ? mv : v;
  };
  SK.mirror = function (p, c) {
    if (!p.skills) p.skills = {};
    if (full(p) && p.sk[c]) { if (p.sk[c].lv > 0) p.skills[c] = SK.valueOf(p, c); else delete p.skills[c]; return; }
    const lv = SK.lvOf(p, c);
    if (lv > 0) p.skills[c] = VALUES[lv]; else delete p.skills[c];
  };
  SK.blank = () => ({ lv: 0, xp: 0, st: 0, proved: false, best: 0, rust: 0, used: null, streak: 0, gap: 0, fresh: -1, ins: {}, got: {}, sp: [] });
  // set a level outright (a test, a card that makes someone a master, an old save): the concepts of every word held are
  // grasped, so nobody holds a word without them
  SK.set = function (p, k, lv, why) {
    const c = SK.canon(k)[0]; if (!c || !p) return;
    lv = Math.max(0, Math.min(MAX_LV, lv | 0));
    if (full(p)) {
      const s = p.sk[c] || (p.sk[c] = SK.blank());
      const from = s.lv;
      s.lv = lv; s.best = Math.max(s.best || 0, lv); s.xp = Math.min(s.xp || 0, Math.max(0, SK.E().cost(lv) - 1e-6)); s.st = 0; s.rust = 0;
      // the switch: a level set outright reads its step's value (the odd rung): what the experience past its bar was
      // worth does not carry into the even level (D-179)
      if (on2() && from !== lv) { s.xp = Math.min(s.xp, A.SK2.oddBar(lv)); delete s.hold; }
      SK.graspHeld(p, c, s);
      if (from !== lv) SK.ledger(p, c, 0, why || 'set', ['set']);
    } else if (p.skx) delete p.skx[c];
    if (!p.skills) p.skills = {};
    if (lv > 0) p.skills[c] = full(p) ? SK.valueOf(p, c) : VALUES[lv]; else delete p.skills[c];
    if (SK.LEG[k] && p.skills[k] != null) delete p.skills[k];
    if (full(p) && on2() && A.SK2.syncFam) A.SK2.syncFam(p, c);
  };
  // a raw value, as older code wrote it: the level under it
  SK.put = (p, k, v, why) => { SK.set(p, k, lvOfValue(v), why); return v; };
  // raise to at least a value (an appointment: nobody is named to a seat without knowing the trade); never lowers
  SK.raiseTo = (p, k, v, why) => { if (lvOfValue(v) > SK.lvOf(p, k)) SK.set(p, k, lvOfValue(v), why); return v; };
  SK.graspHeld = function (p, c, s) {
    const age = isPC(p) && A.S ? Math.floor(SK.ageF(p)) : 0, Eng = SK.E();
    for (let w = 1; w <= wordOf(s.lv) && w < BANDS; w++) for (const cn of Eng.conceptsOf(c, w)) if (s.got[cn.id] == null) { s.got[cn.id] = age; delete s.ins[cn.id]; }
  };

  // ---- the player's view for the engine ------------------------------------------------------------------------------
  // CI 137's balance (D-077): two of the design's walls, measured in bot lives, held a life's skills at Advanced V for a
  // decade and more (the player's offices and pay read skills on the scale the world's people are rolled on). Both are
  // named constants, the owner's to move:
  // - PROOF_SLACK: a stretch succeeded at the top step of your own word proves you for the next (the model asks the next
  //   word's own level; the cards hold few checks at 55 and up, so an edge waited on luck, not on a deed);
  // - INSIGHT_LIFE: a month of a life is many-sided (the post, the cards, the talk, the plan), so its chance of insight is
  //   twice the model's single month of drill; still a chance, still blind spots, still a proof from Expert.
  SK.PROOF_SLACK = 1;
  SK.INSIGHT_LIFE = 2;
  const memo = new Map();
  SK.view = function (p) {
    // keyed by the world's seed with the id: a person's needs are drawn from both, and a new game in the same page reuses
    // ids (CI 147, s1TwoLives: twelve worlds' players, all "p1", shared one world's needs and so one fate)
    const key = (A.S ? A.S.seed : '') + ':' + p.id;
    let m = memo.get(key); if (!m) { if (memo.size > 30) memo.clear(); m = new Map(); memo.set(key, m); }
    return { id: p.id, seed: String(A.S ? A.S.seed : 'ardan'), talent: p.tal || {}, memory: SK.memoryOf ? SK.memoryOf(p) : 1,
      proud: SK.proudOf ? SK.proudOf(p) : false, proofSlack: SK.PROOF_SLACK, sk: p.sk, ledger: [], rec: [], rng: A.rand, needMemo: m,
      // the skills rebuild, step 7 (D-182): an edge's conditions are the rung's route (37-skills2's d-evolve)
      gate: A.SK2 && A.SK2.on && A.SK2.gate ? A.SK2.gate(p) : undefined };
  };
  SK.need = (p, k, c) => SK.E().need(SK.view(p), k, c);

  // ---- the one door: A.gainXp ------------------------------------------------------------------------------------------
  // cause: a string (why) or { q: 'work'|'practice'|'drill'|'stretch', why, d (a level), failed, trigger, teacher (a
  // level), who, good, demand (a level), spec, holds }. Effort is in months of steady drill (10 experience at most).
  SK.cur = null;   // the cause of what is running (SK.within), for calls that do not pass one
  SK.within = function (cause, f, self, args) { const o = SK.cur; SK.cur = cause; try { return f.apply(self, args || []); } finally { SK.cur = o; } };
  SK.whyNow = function () {
    if (SK.cur) return SK.cur;
    const q = A.S && A.S.queue && A.S.queue[0], e = q && q.type === 'event' && A.EV && A.EV[q.ev];
    if (e) return { q: 'practice', why: SK.cardTitle(q, e) };
    return { q: 'practice', why: 'the year\'s doings' };
  };
  // a card's title as the player read it: the view's, with its tokens filled ("As {oa} tells it" is a template, CI 137)
  SK.untoken = s => String(s == null ? '' : s).replace(/\s*\{[A-Za-z0-9_.]+\}\s*/g, ' ').replace(/\s+/g, ' ').trim();
  SK.cardTitle = function (q, e) {
    const v = q && q.view && typeof q.view.title === 'string' ? q.view.title : null;
    const t = SK.untoken(v != null ? v : typeof (e && e.title) === 'string' ? e.title : '');
    return t && !/^(as|a|the|of)$/i.test(t) ? t : 'a moment';
  };
  SK.MONTH_CAP = 40;   // efforts queued in a month, bounded (rule 21): like ones are summed
  A.gainXp = function (p, k, eu, cause) {
    if (!p || !(eu > 0 || eu < 0) || !A.S) return 0;
    const [c, spc] = SK.canon(k); if (!c) return 0;
    // order 95 (D-192): a title's share boost to experience gained: a share more effort (37-skills2's SK2.boostOf; 0 for
    // anyone who holds none)
    if (eu > 0 && A.SK2 && A.SK2.boostOf) { const g = A.SK2.boostOf(p, 'growth', c); if (g > 0) eu *= 1 + g; }
    if (typeof cause === 'string') cause = { why: cause };
    const base = SK.whyNow();
    const a = Object.assign({ q: base.q || 'practice', why: base.why }, cause || {}, { skill: c, eu: Math.abs(eu) });
    if (spc && a.spec === undefined) a.spec = spc;
    if (full(p) && isPC(p)) {
      if (eu < 0) { SK.takeXp(p, c, -eu, a.why); return 0; }
      const B = p.skm = Array.isArray(p.skm) ? p.skm : [];
      const same = B.find(x => x.skill === c && x.q === a.q && x.why === a.why && x.d === a.d && !!x.failed === !!a.failed && x.trigger === a.trigger && x.teacher === a.teacher && x.spec === a.spec);
      if (same) same.eu += a.eu;
      else if (B.length < SK.MONTH_CAP) B.push(a);
      else { const last = B.find(x => x.skill === c && x.q === a.q) || B[B.length - 1]; if (last.skill === c) last.eu += a.eu; }
      return a.eu * 8;
    }
    return eu > 0 ? SK.npcGain(p, c, a) : 0;
  };
  // the rare card that takes experience: never a word
  SK.takeXp = function (p, c, eu, why) {
    const s = p.sk[c]; if (!s) return;
    const x = Math.min(s.xp, eu * 10 * 0.8); s.xp -= x;
    SK.ledger(p, c, -x, why || 'a setback', ['setback']);
  };
  // the shim the 300 older calls go through: amt x 0.2 effort, the cause read from what is running
  // (0.2 in the design; 0.5 since CI 137: the older code's grants, a duel, a battle, a council's month, a card, were the old
  // growth's main road, and at 0.2 a noble of 35 stood at Advanced V with no office within reach; D-077)
  SK.SHIM = 0.5;
  SK.trainShim = function (p, k, amt, cause) {
    if (!p || !GD.SKILLS[k] || !(amt > 0 || amt < 0)) return 0;
    return A.gainXp(p, k, amt * SK.SHIM, cause || SK.cur || undefined);
  };

  // ---- other people: one number, the closed form ----------------------------------------------------------------------
  // the gate: the rest of the rung's route at an edge, the concepts being the closed form's (37-skills2's d-evolve, D-182)
  SK.npcView = (p, a) => ({ id: p.id, seed: String(A.S ? A.S.seed : 'ardan'), talent: p.tal || {}, gate: A.SK2 && A.SK2.on && A.SK2.npcGate ? A.SK2.npcGate(p, a) : undefined });
  // years of work a person has put into a skill, for the closed form's grasp: from fourteen, a share by his post
  // (a post: SK.works, 36-skills' f-people, which reads the post registry and the crown too: H-167)
  // (works: whether he does, when the caller has read it already)
  SK.effortYears = (p, c, works) => Math.max(0, (A.age(p) - 14)) * ((works != null ? works : SK.works ? SK.works(p) : p.job || p.mil || p.office) ? 0.8 : 0.5);
  SK.npcGain = function (p, c, a) {
    const Eng = SK.E(), skills = p.skills || (p.skills = {});
    // fold a legacy key older code wrote on this person into its skill first
    if (a.spec && SK.LEG) for (const lk in SK.LEG) if (SK.LEG[lk][0] === c && skills[lk] != null) { if (skills[lk] > (skills[c] || 0)) skills[c] = skills[lk]; delete skills[lk]; }
    const lv0 = lvOfValue(skills[c] || 0), L = VALUES[lv0], t = (p.tal && p.tal[c]) || 'C', [tm, reach] = Eng.TALENT[t] || Eng.TALENT.C;
    const age = Math.max(4, A.age(p));
    let x = 10 * a.eu * A.V2.growth.quality(Object.assign({}, a, { d: a.d != null ? VALUES[a.d] || 0 : undefined, demand: a.demand != null ? VALUES[a.demand] : undefined }), L) * tm * Eng.learnAge(c, age);
    if (L >= reach) x *= 0.25;
    if (SK.bodyStall(p, c, lv0)) x = 0;
    if (!(x > 0)) return 0;
    const carry = (p.skx && p.skx[c]) || 0;
    const r = Eng.npcGain(SK.npcView(p, a), c, lv0, carry, x, SK.effortYears(p, c), false);
    if (r.lv > 0) skills[c] = VALUES[r.lv]; else delete skills[c];
    if (r.lv > lv0 && A.SK2 && A.SK2.npcEvolved) A.SK2.npcEvolved(p, c, lv0, r.lv);
    if (r.lv >= MAX_LV || r.xp <= 0.05) { if (p.skx) delete p.skx[c]; } else { p.skx = p.skx || {}; p.skx[c] = Math.round(r.xp * 10) / 10; }
    return x;
  };
  // C9 (999997-bodies): a level past what the body carries does not rise (its stall is a reason in the ledger)
  SK.bodyStall = function (p, c, lv) { return !!(A.skillCap && lv < MAX_LV && A.skillCap(p, c) < VALUES[lv + 1] - 1e-9 && VALUES[lv] >= 29); };

  // ---- the ledger: every change with its reason (the player) ---------------------------------------------------------
  SK.seasonKey = () => (A.S ? A.S.year * 4 + Math.floor(Math.min(364, (A.S.warClock || 0)) / 91.25) : 0);
  SK.BY_MAX = 4;
  SK.ledger = function (p, k, x, why, tags, extra) {
    if (!isPC(p)) return;
    const key = SK.seasonKey();
    let L = p.skl; if (!L || typeof L !== 'object' || L.s == null) L = p.skl = { s: key, k: {}, prev: null };
    if (L.s !== key) { if (SK.seasonLine) SK.seasonLine(p, L); L.prev = { s: L.s, k: L.k }; L.s = key; L.k = {}; }
    const e = L.k[k] || (L.k[k] = { x: 0, by: {}, tags: [], held: 0, lost: 0, back: 0, lv0: p.sk && p.sk[k] ? p.sk[k].lv : 0, o0: SK.ordOf(p, k) });
    e.x = Math.round((e.x + x) * 100) / 100;
    if (extra) { if (extra.lost) e.lost += extra.lost; if (extra.back) e.back += extra.back; if (extra.held) e.held += extra.held; }
    if (x || !extra) {
      const by = e.by, w = SK.untoken(why || 'other').slice(0, 80) || 'other';
      const r2 = v => Math.round(v * 100) / 100;
      if (by[w] != null || Object.keys(by).length < SK.BY_MAX) by[w] = r2((by[w] || 0) + x); else by.other = r2((by.other || 0) + x);
    }
    for (const t of tags || []) if (e.tags.indexOf(t) < 0 && e.tags.length < 8) e.tags.push(t);
  };
  // coherency (99998's SV.check, the coherency checks): the table is there, the mirror holds, no word without its
  // concepts, no legacy key, no aptitude left
  SK.checkPC = function (pc) {
    const bad = [];
    if (!full(pc)) return ['no table'];
    const Eng = SK.E();
    for (const k in pc.sk) {
      const s = pc.sk[k]; if (!SK.BY[k]) { bad.push('unknown ' + k); continue; }
      const m = (pc.skills || {})[k] || 0, want = SK.valueOf(pc, k);
      if (Math.abs(m - want) > 1e-9 && !(SK.pendingAdopt && SK.pendingAdopt(pc, k))) bad.push(`mirror ${k} ${m} for ${SK.stepLabel(s.lv, s.xp)}`);
      for (let w = 1; w <= wordOf(s.lv) && w < BANDS; w++) for (const c of Eng.conceptsOf(k, w)) if (s.got[c.id] == null) bad.push(`${k} at ${SK.stepLabel(s.lv, s.xp)} without ${c.name}`);
      if (!(s.xp >= 0) || !isFinite(s.xp) || !(s.st >= 0)) bad.push(`${k} experience ${s.xp}/${s.st}`);
    }
    for (const lk in SK.LEG) if ((pc.skills || {})[lk] != null) bad.push('legacy key ' + lk);
    return bad.slice(0, 6);
  };
  // a number older code wrote since the month's pass: it is adopted next month, not broken
  SK.pendingAdopt = (pc, k) => { const s = pc.sk[k], m = (pc.skills || {})[k] || 0; return !!s && Math.abs(m - SK.valueOf(pc, k)) > 1e-9 && !SK.onGrid(m); };
  // a number on the ladder a check reads (the rungs once switched, S1's steps before)
  SK.onGrid = v => (on2() ? A.SK2.isRungValue(v) : Math.abs(v - VALUES[lvOfValue(v)]) <= 1e-9);

  // the record of turning points (the player): at most 80, the oldest folded a decade at a time
  SK.REC_MAX = 80;
  SK.record = function (p, k, t, text) {
    if (!isPC(p)) return;
    const R = p.skr = Array.isArray(p.skr) ? p.skr : [];
    R.push({ y: A.S.year, k, t, text: SK.untoken(text).slice(0, 160) });
    if (SK.tap) SK.tap.push(R[R.length - 1]);
    if (R.length > SK.REC_MAX) {
      const y0 = R[0].y, dec = Math.floor(y0 / 10) * 10, some = R.filter(r => r.t !== 'fold' && Math.floor(r.y / 10) * 10 === dec);
      const n = some.length;
      for (const r of some) R.splice(R.indexOf(r), 1);
      R.unshift({ y: dec, k: '', t: 'fold', text: `${n} turning points in the years from ${dec}` });
      while (R.length > SK.REC_MAX) R.splice(1, 1);
    }
  };
})();
