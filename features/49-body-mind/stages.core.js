// Each life stage its own play (Road to Ten, Character 6), and children are not offered what they cannot do (UI 6).
// The release had two actions only a child has (play, chores) and none for a youth, the prime or old age. Now each stage
// has three of its own, shown under "Only now" on the Life tab and hidden in every other stage:
//  - childhood: get into mischief, sit with the old folk, go along to a parent's work (each leaves deeds that set
//    traits, and the last one picks the trade a youth is apprenticed in);
//  - youth (from the teens to five years into adulthood): work under a master (a named master, kind or harsh, who can
//    pass on a lasting gift for the trade), run with the young bloods, hire out for a season;
//  - prime: work double, speak up at the moot, put coin by for old age;
//  - old age: teach the young (a named pupil who can pass you), set down your memories (a book in three chapters),
//    mind the failing body (care holds back the fading of the stats, up to four years).
// And a child's screens hide what a child cannot do: the court's four actions and the plot for the throne, the brutal
// training intensity, and the free-hours pursuits that say "Too young".
// Engine side: the actions draw and change state; the Life tab and the hiding only read.
(function () {
  const BM = A.BM = A.BM || {};
  const isPC = p => p && A.S && p.id === A.S.pc;
  const touch = (p, d) => { if (A.MOODS && A.MOODS.touch) A.MOODS.touch(p, d); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const y = () => A.S.year;

  // the four stages of play: a youth runs from the teens to five years (for a human) into adulthood
  BM.STAGES = ['child', 'youth', 'prime', 'old'];
  BM.STAGE_NAME = { child: 'childhood', youth: 'youth', prime: 'your prime', old: 'old age' };
  BM.stageOf = function (p) {
    const st = A.stage(p);
    if (st === 'infant') return 'infant';
    if (st === 'child' || st === 'old') return st;
    const R2 = GD.RACES[p.race];
    return A.age(p) < R2.adult + Math.max(2, Math.round(R2.adult * 0.3)) ? 'youth' : 'prime';
  };

  // the trade a child grows up around
  BM.tradeOf = function (p) {
    const by = { slave: 'husbandry', serf: 'husbandry', peasant: 'husbandry', artisan: 'craft', merchant: 'trade', gentry: 'stewardship', noble: 'stewardship', royal: 'stewardship' };
    const par = (p.parents || []).map(A.P).find(x => x && x.job && GD.CAREERS[x.job.c]);
    return (par && GD.CAREERS[par.job.c].skill) || by[p.status] || 'husbandry';
  };
  const TRADE_WORD = { husbandry: 'the fields and the beasts', craft: 'the workshop', trade: 'the stalls and the ledgers', stewardship: 'the estate and its reeves', sea: 'the boats', medicine: 'the sickroom', learning: 'the books', faith: 'the chapel', music: 'the hall' };

  const ACTS = {
    // ---- childhood
    bm_mischief: { stage: 'child', minAge: 5, name: 'Get into mischief', desc: 'Pears from the priest\'s tree, the miller\'s geese. Stealth and nerve, if you are not caught.' },
    bm_tales: { stage: 'child', minAge: 4, name: 'Sit with the old folk', desc: 'Stories of the hard winters and the old wars. Letters and faith, slowly.' },
    bm_tagalong: { stage: 'child', minAge: 6, name: 'Go along to a parent\'s work', desc: 'Watch how the work is done. The family trade, and the habit of work.' },
    // ---- youth
    bm_apprentice: { stage: 'youth', minAge: 12, name: 'Work under a master', desc: 'A master of a trade, kind or harsh. Fast learning; finish your time and the gift stays.' },
    bm_bloods: { stage: 'youth', minAge: 13, name: 'Run with the young bloods', desc: 'Company, races and brawls. A broken nose, now and then.' },
    bm_hire: { stage: 'youth', minAge: 13, name: 'Hire out for a season', desc: 'A neighbour\'s harvest, a carter\'s loads. A few suns of your own.' },
    // ---- prime
    bm_double: { stage: 'prime', minAge: 16, name: 'Work double', desc: 'Two days\' work in one, for a season. Only the prime body can take it.' },
    bm_moot: { stage: 'prime', minAge: 16, name: 'Speak up at the moot', desc: 'Say your piece where people decide things. Standing, if they listen.' },
    bm_putby: { stage: 'prime', minAge: 16, name: 'Put coin by for old age', desc: 'A tenth of your purse under the hearthstone. It comes back, grown, when you are old.' },
    // ---- old age
    bm_teach: { stage: 'old', minAge: 30, name: 'Teach the young', desc: 'Pass on what you know best to a youngster, who may one day pass you.' },
    bm_memoir: { stage: 'old', minAge: 30, name: 'Set down your memories', desc: 'A chapter of your life, in your hand or a scribe\'s. Three make a book.' },
    bm_tend: { stage: 'old', minAge: 30, name: 'Mind the failing body', desc: 'Baths, walks, less wine. Health now, and your stats fade slower.' },
  };
  for (const k in ACTS) GD.ACTIVITIES[k] = Object.assign({ cost: 1, cat: 'Only now' }, ACTS[k]);
  BM.STAGE_ACTS = {}; for (const k in ACTS) (BM.STAGE_ACTS[ACTS[k].stage] = BM.STAGE_ACTS[ACTS[k].stage] || []).push(k);

  // only in its stage: "Too young" before it, "Too old" after (the Life tab already hides both)
  const can = A.canAct;
  A.canAct = function (key) {
    const D = GD.ACTIVITIES[key], pc = A.pc();
    if (D && D.stage && pc && pc.alive) {
      const s = BM.stageOf(pc), i = BM.STAGES.indexOf(s), j = BM.STAGES.indexOf(D.stage);
      if (i !== j) return [false, i < j ? 'Too young' : 'Too old'];
    }
    return can.apply(this, arguments);
  };

  const MISCHIEF = [
    ['You steal pears from the priest\'s tree', false], ['You let the miller\'s geese out of their pen', false],
    ['You climb the bell tower to see the whole valley', true], ['You swim the millrace on a dare', true],
    ['You tie the reeve\'s horse to the well-rope', false], ['You climb onto the tithe-barn roof', true],
  ];
  const TALES = ['the winter the river froze to the sea', 'the war when the bridge was burned', 'a saint who walked on the marsh', 'the year of the long rain and the bread that rotted',
    'a beast in the hills that took sheep and once a boy', 'how the old lord bought his title with a herd of cattle'];
  const MOOT = { 2: 'the village moot', 3: 'the guild hall', 4: 'the shire court', 5: 'the lord\'s council', 6: 'the royal court', 7: 'the royal court', 9: 'your own council' };
  // the skill a person is best at, among the ones a person can teach
  BM.bestSkill = function (p) {
    let best = null, v = -1;
    for (const k of GD.SKILL_LIST) { if (BM.MERGE && BM.MERGE[k]) continue; const x = A.skill(p, k); if (x > v) { v = x; best = k; } }
    return best;
  };

  Object.assign(A.ACT, {
    bm_mischief(pc, arg, dim) {
      const [what, climb] = A.pick(MISCHIEF);
      A.trainSkill(pc, 'stealth', 1.2 * dim); A.trainSkill(pc, 'athletics', 0.8 * dim);
      touch(pc, { company: 6, rest: 4 });
      if (climb && A.chance(0.05 + Math.max(0, 40 - A.skill(pc, 'athletics')) / 600)) {
        const w = A.addWound(pc, 'broken_arm');
        BM.deed(pc, 'brave', 0.5, `Climbed where you should not have (${y()})`);
        return { msg: `${what}, and fall. ${w ? 'Your arm breaks with a sound like a stick.' : 'You land hard.'}`, cls: 'bad' };
      }
      if (A.chance(0.35 + A.skill(pc, 'stealth') / 150 + A.stat(pc, 'spd') / 400)) {
        BM.deed(pc, 'deceitful', 0.5, `Got away with mischief (${y()})`);
        return { msg: `${what}, and nobody ever finds out who.` };
      }
      pc.happy = clamp(pc.happy - 4, 0, 100); A.willGrow(pc, 0.5, 'hardship');
      BM.deed(pc, climb ? 'brave' : 'impetuous', 0.5, `Caught at mischief (${y()})`);
      return { msg: `${what}, and are caught. Your backside pays for it.`, cls: 'bad' };
    },
    bm_tales(pc, arg, dim) {
      const gp = A.relsOf(pc, ['grandparent']).map(x => x.p).find(p => p.alive);
      A.trainSkill(pc, 'learning', 0.8 * dim); A.trainSkill(pc, 'faith', 0.5 * dim);
      touch(pc, { company: 8, rest: 4 });
      if (gp) A.addOp(pc, gp, 3);
      BM.deed(pc, A.chance(0.5) ? 'curious' : 'patient', 0.5, `Listened to the old folk (${y()})`);
      if (A.chance(0.3)) pc.piety = clamp((pc.piety || 0) + 1, 0, 100);
      return { msg: `${gp ? gp.given : 'Old Mother Ash'} tells of ${A.pick(TALES)}. You remember every word.` };
    },
    bm_tagalong(pc, arg, dim) {
      const k = BM.tradeOf(pc);
      pc.bmTrade = k;
      A.trainSkill(pc, k, 1.6 * dim);
      touch(pc, { purpose: 8, rest: -3 });
      BM.deed(pc, 'diligent', 0.4, `Went along to the work (${y()})`);
      return { msg: `You go along to ${TRADE_WORD[k] || 'the work'} and watch how it is done. ${GD.SKILLS[k]} comes a little easier.` };
    },
    bm_apprentice(pc, arg, dim) {
      let M = pc.bmMaster && A.P(pc.bmMaster.id), born = false;
      if (!M || !M.alive) {
        const k = pc.bmTrade || BM.tradeOf(pc);
        M = A.makeAcquaintance(pc, 'mentor');
        M.born = A.S.year - A.ri(38, 58); M.skills[k] = A.ri(45, 70);
        if (M.occ && /child/.test(M.occ)) M.occ = A.occPick ? A.occPick(M.status, M.sex) : M.occ;
        A.link(pc, M, 'mentor', 15, 'student');
        pc.bmMaster = { id: M.id, k, n: 0 }; born = true;
      }
      const k = pc.bmMaster.k, harsh = A.has(M, 'cruel') || A.has(M, 'wrathful'), soft = A.has(M, 'kind') || A.has(M, 'patient');
      A.trainSkill(pc, k, (harsh ? 3.2 : 2.5) * dim);
      touch(pc, { purpose: 12, rest: -4 });
      let note = '';
      if (harsh) { pc.happy = clamp(pc.happy - 3, 0, 100); A.willGrow(pc, 0.5, 'hardship'); note = ` ${M.given} has a heavy hand and a sharp tongue, and you learn fast to avoid both.`; }
      else if (soft) { pc.happy = clamp(pc.happy + 2, 0, 100); A.addOp(pc, M, 4); note = ` ${M.given} shows you twice and never shouts.`; }
      else A.addOp(pc, M, 2);
      pc.bmMaster.n = (pc.bmMaster.n || 0) + 1;
      if (pc.bmMaster.n === 6) {
        pc.apt = pc.apt || {}; pc.apt[k] = Math.max(pc.apt[k] || 1, 1.2);
        pc.flags.bm_journeyman = A.S.year; A.fame(pc, 1); A.addOp(pc, M, 10);
        BM.deed(pc, 'diligent', 1, `Served your time under ${M.given} (${y()})`);
        return { msg: `${M.given} says there is nothing more to teach you: you are a journeyman of ${GD.SKILLS[k].toLowerCase()}. The knack stays with you.`, cls: 'good' };
      }
      return { msg: `${born ? `You are bound to ${A.fullName(M)}, a master of ${GD.SKILLS[k].toLowerCase()}. ` : ''}A season at ${M.given}'s side.${note}` };
    },
    bm_bloods(pc, arg, dim) {
      touch(pc, { company: 15, rest: -4 });
      A.trainSkill(pc, 'athletics', 1 * dim); A.trainSkill(pc, 'unarmed', 0.8 * dim);
      if (A.chance(0.3)) {
        if (A.chance(0.35 + (A.skill(pc, 'unarmed') + A.stat(pc, 'str')) / 250)) {
          A.fame(pc, 1); BM.deed(pc, 'wrathful', 0.5, `Won a brawl behind the alehouse (${y()})`);
          return { msg: 'A brawl behind the alehouse. You win it, and the story grows each time it is told.', cls: 'good' };
        }
        const w = A.chance(0.5) ? A.addWound(pc, 'broken_nose') : null;
        if (!w) { pc.health = clamp(pc.health - 8, 0, A.maxHealth(pc)); pc.lastHurt = 'a brawl'; }
        return { msg: `A brawl behind the alehouse, and you lose it${w ? ', and your nose with it' : ''}.`, cls: 'bad' };
      }
      if (A.chance(0.12)) {
        A.applyFx(pc, { coin: -2, honor: -2 }, {});
        return { msg: 'The watch catches the lot of you on the bridge after curfew. A fine, and a word to your family.', cls: 'bad' };
      }
      if (A.chance(0.3)) { const f = A.makeAcquaintance(pc, 'friend', true); A.link(pc, f, 'friend', 30, 'friend'); return { msg: `Races on the common, and a new friend: ${f.given}.`, cls: 'good' }; }
      return { msg: 'Races on the common, a stolen jug, a night under the stars.' };
    },
    bm_hire(pc, arg, dim) {
      const k = A.pick(['husbandry', 'craft', 'trade', pc.bmTrade || 'husbandry']);
      const pay = Math.round((2 + A.ri(0, 4) + A.skill(pc, k) / 15) * dim);
      pc.coin += pay;
      A.trainSkill(pc, k, 1.2 * dim);
      touch(pc, { purpose: 8, rest: -10, comfort: 4 });
      return { msg: `A season's hire: ${k === 'husbandry' ? 'a neighbour\'s harvest' : k === 'craft' ? 'carrying for a builder' : 'minding a stall'}. ${A.coin(pay)} of your own.` };
    },
    bm_double(pc, arg, dim) {
      const C = pc.job && GD.CAREERS[pc.job.c];
      const pay = Math.round((5 + 4 * A.classOf(pc)) * dim);
      pc.coin += pay;
      if (C) { pc.job.perf = Math.min(100, (pc.job.perf || 50) + 8); if (C.skill) A.trainSkill(pc, C.skill, 1.2 * dim); }
      touch(pc, { rest: -30, purpose: 10 });
      pc.health = clamp(pc.health - 3, 0, A.maxHealth(pc));
      BM.deed(pc, 'diligent', 0.4, `Worked double (${y()})`);
      if (A.chance(0.12 * (1.5 - A.stat(pc, 'sta') / 100))) {
        pc.health = clamp(pc.health - 10, 0, A.maxHealth(pc)); pc.lastHurt = 'overwork';
        return { msg: `You work two days in one for a season and earn ${A.coin(pay)}, and then your back goes. A week on the floor.`, cls: 'bad' };
      }
      return { msg: `You work two days in one for a season: ${A.coin(pay)} more, and you sleep like the dead.` };
    },
    bm_moot(pc, arg, dim) {
      const where = MOOT[Math.min(9, A.classOf(pc))] || 'the village moot';
      const odds = 0.3 + (A.skill(pc, 'persuasion') * 0.6 + A.skill(pc, 'diplomacy') * 0.4) / 120 + (pc.fame || 0) / 400;
      A.trainSkill(pc, 'persuasion', 1.2 * dim); A.trainSkill(pc, 'diplomacy', 0.6 * dim);
      touch(pc, { purpose: 10, company: 6 });
      const who = A.relsOf(pc, ['acquaint', 'friend', 'rival']).map(x => x.p).filter(p => p.alive);
      if (A.chance(clamp(odds, 0.1, 0.9))) {
        A.fame(pc, 2); if (pc.job) pc.job.rep = (pc.job.rep || 0) + 3;
        if (who.length) A.addOp(pc, A.pick(who), 5);
        BM.deed(pc, 'gregarious', 0.3, `Spoke up at ${where} (${y()})`);
        return { msg: `You speak at ${where}, and they listen. Afterwards people stop you in the street to say so.`, cls: 'good' };
      }
      pc.happy = clamp(pc.happy - 3, 0, 100);
      if (who.length) A.addOp(pc, A.pick(who), -5);
      return { msg: `You speak at ${where}. Someone laughs in the wrong place, and the rest is lost.`, cls: 'bad' };
    },
    bm_putby(pc) {
      if ((pc.coin || 0) < 5) return { ok: false, msg: 'You have nothing to put by.' };
      const amt = Math.max(5, Math.round(pc.coin * 0.1));
      pc.coin -= amt; pc.bmStore = (pc.bmStore || 0) + amt;
      touch(pc, { comfort: -4, purpose: 4 });
      BM.deed(pc, 'patient', 0.3, `Put coin by for old age (${y()})`);
      return { msg: `You put ${A.coin(amt)} in a pot under the hearthstone. There is ${A.coin(pc.bmStore)} there now, for when you are old.` };
    },
    bm_teach(pc, arg, dim) {
      const k = (pc.bmPupil && pc.bmPupil.k) || BM.bestSkill(pc);
      let P = pc.bmPupil && A.P(pc.bmPupil.id);
      const R2 = GD.RACES[pc.race];
      if (!P || !P.alive || A.age(P) > R2.adult + 15) {
        P = A.relsOf(pc, ['grandchild', 'child', 'nephew']).map(x => x.p).find(p => p.alive && A.age(p) >= 8 && A.age(p) <= R2.adult + 8 && p.skills);
        if (!P) { P = A.makeAcquaintance(pc, 'student'); P.born = A.S.year - A.ri(12, 17); P.occ = 'a youngster of ' + A.provName(pc.home); A.link(pc, P, 'student', 25, 'mentor'); }
        pc.bmPupil = { id: P.id, k, n: 0 };
      }
      P.skills[k] = Math.min(100, (P.skills[k] || 0) + A.rf(2, 4) * (1 + A.stat(pc, 'int') / 200) * dim);
      pc.bmPupil.n = (pc.bmPupil.n || 0) + 1;
      A.addOp(pc, P, 3);
      touch(pc, { purpose: 15, company: 6 });
      pc.happy = clamp(pc.happy + 2, 0, 100); A.fame(pc, 0.5);
      if (!pc.bmPupil.passed && P.skills[k] >= A.skill(pc, k)) {
        pc.bmPupil.passed = A.S.year; pc.flags.bm_surpassed = A.S.year; A.fame(pc, 3);
        BM.deed(pc, 'humble', 0.5, `Taught ${P.given} until ${A.he ? A.he(P) : 'they'} passed you (${y()})`);
        return { msg: `${P.given} is better at ${GD.SKILLS[k].toLowerCase()} than you now. You taught that, too.`, cls: 'good' };
      }
      return { msg: `You teach ${P.given} ${GD.SKILLS[k].toLowerCase()}: ${Math.round(P.skills[k])} now, to your ${A.skill(pc, k)}.` };
    },
    bm_memoir(pc) {
      if (!pc.literate && (pc.coin || 0) < 3) return { ok: false, msg: 'You cannot write, and a scribe costs 3 suns.' };
      if (!pc.literate) pc.coin -= 3;
      const M = pc.bmMemoir = pc.bmMemoir && typeof pc.bmMemoir === 'object' ? pc.bmMemoir : { ch: 0 };
      M.ch = (M.ch || 0) + 1;
      const deeds = (pc.deeds || []).filter(d => d && d.t), tl = Array.isArray(pc.traitLog) ? pc.traitLog.filter(x => x[1]) : [];
      const subj = M.ch === 1 ? `a childhood in ${A.provName(pc.home)}`
        : deeds.length && A.chance(0.6) ? `${deeds[Math.min(deeds.length - 1, M.ch - 2)].t.replace(/\.$/, '')} (${deeds[Math.min(deeds.length - 1, M.ch - 2)].y})`
        : tl.length ? `how you came to be ${(GD.TRAITS[tl[tl.length - 1][1]] || { name: 'what you are' }).name.toLowerCase()}` : 'the people you have buried';
      A.trainSkill(pc, 'learning', 1); touch(pc, { purpose: 12 });
      if (M.ch === 3) {
        pc.works = pc.works || []; pc.works.push({ y: A.S.year, t: 'The memoirs of ' + A.fullName(pc) });
        pc.deeds.push({ y: A.S.year, t: 'Set down your memoirs' }); A.fame(pc, 4); pc.flags.bm_memoir = A.S.year;
        return { msg: `Chapter three: ${subj}. The book is done. ${pc.literate ? 'It is in your own hand' : 'The scribe binds it'}, and people ask to read it.`, cls: 'good' };
      }
      if (M.ch > 3 && M.ch <= 8) A.fame(pc, 0.5);
      return { msg: `${pc.literate ? '' : 'A scribe takes it down. '}Chapter ${M.ch}: ${subj}.` };
    },
    bm_tend(pc) {
      const fee = Math.max(2, Math.round((pc.coin || 0) * 0.02));
      if ((pc.coin || 0) < fee) return { ok: false, msg: `The baths and the physician's regimen cost ${A.coin(fee)}.` };
      pc.coin -= fee;
      pc.health = clamp(pc.health + A.ri(6, 12), 0, A.maxHealth(pc));
      pc.bmCare = Math.min(4, (pc.bmCare || 0) + 0.4);
      touch(pc, { rest: 15, comfort: 4 });
      BM.deed(pc, 'temperate', 0.3, `Minded your body (${y()})`);
      return { msg: `Hot baths, a walk each morning, less wine (${A.coin(fee)}). Your knees thank you, a little.` };
    },
  });

  // what was put by comes back, grown, when old age comes; at death it is in the estate
  A.onMonth.push(pc => {
    if (!pc || !pc.alive || !(pc.bmStore > 0) || BM.stageOf(pc) !== 'old') return;
    const amt = Math.round(pc.bmStore * 1.5);
    pc.coin += amt; pc.bmStore = 0;
    A.log(`The pot under the hearthstone: ${A.coin(amt)}, with what it earned lent out at the mill. You are glad of it now.`, 'good');
  });
  const death = A.pcDeath;
  A.pcDeath = function () { const pc = A.pc(); try { if (pc && pc.alive && pc.bmStore > 0) { pc.coin += pc.bmStore; pc.bmStore = 0; } } catch (e) {} return death.apply(this, arguments); };

  // "What now" points at the stage's own play, one action a year each, below love and below the urgent things
  const wn = A.whatNow;
  A.whatNow = function (pc) {
    const L = wn.apply(this, arguments);
    try {
      if (!pc || !pc.alive || !Array.isArray(L)) return L;
      const s = BM.stageOf(pc), k = (BM.STAGE_ACTS[s] || []).find(x => !A.S.yearActs[x] && A.canAct(x)[0]);
      if (k && L.length < 3) L.push({ score: 28, t: GD.ACTIVITIES[k].name, why: `Only now, in ${BM.STAGE_NAME[s]}: ${GD.ACTIVITIES[k].desc}`, go: 'life', act: ['act', k], cls: '' });
      else if (k && L[L.length - 1].score < 28) { L[L.length - 1] = { score: 28, t: GD.ACTIVITIES[k].name, why: `Only now, in ${BM.STAGE_NAME[s]}: ${GD.ACTIVITIES[k].desc}`, go: 'life', act: ['act', k], cls: '' }; }
      L.sort((a, b) => b.score - a.score);
    } catch (e) { console.error('what now stage', e); }
    return L;
  };

  // ---- the Life tab: "Only now", before the release's activity groups
  BM.stageHtml = function (pc) {
    const s = BM.stageOf(pc), L = BM.STAGE_ACTS[s];
    if (!L) return '';
    const items = L.map(k => {
      const D = GD.ACTIVITIES[k], [ok, why] = A.canAct(k);
      if (!ok && /Too young|Too old/.test(why || '')) return '';
      return `<button class="act" data-a="act" data-v="${k}" ${ok ? '' : 'disabled'} title="${UI.esc(ok ? D.desc : why)}"><span class="cost">${D.cost}⧗</span><div class="an">${UI.esc(D.name)}</div><div class="ad">${UI.esc(ok ? D.desc : why)}</div></button>`;
    }).filter(Boolean);
    return items.length ? `<div class="group-h">Only now: ${UI.esc(BM.STAGE_NAME[s])}</div><div class="acts bm-stage">${items.join('')}</div>` : '';
  };
  const life = UI.TAB.life;
  UI.TAB.life = function (pc) {
    const h = life.apply(this, arguments);
    if (!pc || !pc.alive) return h;
    try {
      const row = h.indexOf('<div class="row small muted" style="margin:6px 0 4px">'), at = row >= 0 ? h.indexOf('<div class="group-h">', row) : -1;
      const add = BM.stageHtml(pc);
      return add && at > 0 ? h.slice(0, at) + add + h.slice(at) : h + add;
    } catch (e) { console.error('stage acts', e); return h; }
  };

  // ---- a child is not offered what a child cannot do
  const court = UI.courtTabBasic;
  if (court) UI.courtTabBasic = function (pc) {
    let h = court.apply(this, arguments);
    try {
      const gentle = pc.noble || ['royal', 'noble', 'gentry'].includes(pc.status);
      if (A.isAdult(pc) && gentle) return h;
      const before = h;
      h = h.replace(/\s*<button class="act" data-a="nAct" data-v="[a-z]+">[\s\S]*?<\/button>/g, '');
      if (!A.isAdult(pc)) h = h.replace(/\s*<button class="act" data-a="act" data-v="plot_throne"[\s\S]*?<\/button>/, '');
      if (h !== before) {
        const why = !A.isAdult(pc) ? 'You are too young for the court. For now it is something the grown-ups talk about over your head.' : 'Only those of gentle birth, or with a rung of their own, attend court.';
        h = h.replace('<div class="acts" style="margin-top:8px">', `<div class="small muted" style="margin-top:8px">${UI.esc(why)}</div><div class="acts" style="margin-top:8px">`);
      }
    } catch (e) { console.error('court for children', e); }
    return h;
  };
  const plan = UI.planCard;
  UI.planCard = function (pc) {
    let h = plan.apply(this, arguments);
    if (!pc || A.isAdult(pc)) return h;
    try {
      h = h.replace(/<button class="small[^"]*" data-a="planInt" data-v="brutal"[\s\S]*?<\/button>/, '');
      h = h.replace(/<option value="[a-z_]+"\s+disabled>[^<]*— Too young\.<\/option>/g, '');
    } catch (e) { console.error('plan for children', e); }
    return h;
  };
})();
