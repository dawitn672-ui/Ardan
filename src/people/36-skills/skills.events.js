// S1b: the moments of a skill (docs/design/skills.md §2.5, §3.6): the master's word, the deed offered, the rival, the
// quiet winter, the specialism, the blind spot named, the better hand watched, a pupil, the rust, the scattered hours,
// pride humbled, the old hands. Each card is a moment the engine can turn into a breakthrough (fx.grasp), a proving
// moment (fx.proof) or plain experience, and each choice has its price.
(function () {
  const SK = () => A.SK;
  // the skill a card is about, with its name, its next word and the concept it lacks (the first, in the data's order)
  const fill = (p, ctx, k) => {
    if (!k) { ctx.skip = true; return false; }
    const s = p.sk[k], w = SK().wordOf(s.lv) + 1, open = SK().E().openConcepts(SK().view(p), k);
    ctx.sk = k; ctx.skn = SK().name(k); ctx.skl = ctx.skn.toLowerCase(); ctx.word = SK().WORDS[Math.min(6, w)] || 'Legend';
    ctx.concept = open.length ? open[0].name : 'what comes next';
    return true;
  };
  const work = (p, ctx, eu, q, why) => { A.gainXp(p, ctx.sk, eu, { q, why }); return ''; };
  const teacherOf = (p, k) => { const T = A.teacherFor ? A.teacherFor(p, k) : null; return T && T.p && SK().wordOf(SK().lvOf(T.p, k)) > SK().wordOf(SK().lvOf(p, k)) ? T.p : null; };

  A.defEvents([
    // ---- the master's word: stuck at an edge, with someone in reach who holds the next word ----------------------------
    { id: 'sk_masters_word', title: 'What you have not seen', scene: 'workshop',
      cond: (p, C) => C.adult(p) && C.stuck(p), w: 2, cool: 4,
      setup: (p, ctx) => { if (!fill(p, ctx, SK().edgeSkill(p, 'stuck'))) return; const t = teacherOf(p, ctx.sk); if (!t) { ctx.skip = true; return; } ctx.pid = t.id; },
      text: '{them} watches you at your {skl} for a long while and says nothing. Then: "You work hard. You have not seen {concept}. Until you do, you will stay where you are."',
      choices: [
        { t: 'Ask {them} to show you', r: 'An evening, then another. {them} does not explain; {khe} makes you do it wrong until you see why.', fx: { grasp: { k: 'ctx' }, coin: -15, them: { op: 4 } } },
        { t: 'Thank {khim}, and work it out alone', r: 'You go back to the work with the word in your head and no one to check you.', fx: (p, ctx) => work(p, ctx, 0.6, 'practice', 'working it out alone') },
        { t: 'Say you know your own trade', r: '{them} shrugs. It costs nothing to say, and it closes a door.', fx: { them: { op: -6 }, wil: 0.5, happy: 1 } },
      ] },

    // ---- the deed offered: ready for a word, wanting a proof ----------------------------------------------------------
    { id: 'sk_deed_offered', title: 'A chance to be judged', scene: 'court',
      cond: (p, C) => C.adult(p) && C.ready(p), w: 3, cool: 2,
      setup: (p, ctx) => {
        if (!fill(p, ctx, SK().edgeSkill(p, 'ready'))) return;
        const g = SK().BY[ctx.sk].group;
        ctx.how = g === 'Arms' || g === 'The body' ? 'a bout before witnesses who know the difference' : g === 'Crafts' ? 'a commission, to be judged by the masters of the guild' : g === 'Letters' || g === 'Faith' ? 'a disputation before learned men' : g === 'War' ? 'a command, with older soldiers watching' : 'a task your betters will judge';
      },
      text: 'Your {skl} has been ready for {word} work for a while, and people have begun to say so. Now there is {how}. If it goes well, the name follows. If it goes badly, everyone saw.',
      choices: [
        { t: 'Take it', check: { s: 'wil', s2: 'int', d: 50 },
          win: { r: 'It goes the way it went in your head, which almost never happens. Afterwards people use a new word for you.', fx: { proof: 'ctx', fame: 2, happy: 4 } },
          lose: { r: 'Your hands know it and your nerve does not. It will be talked about for a season.', fx: { happy: -4, fame: -1 } } },
        { t: 'Not yet', r: 'You let it pass. There will be another, and you will be readier. Or you will not.', fx: { need: { rest: 6 }, happy: -1 } },
      ] },

    // ---- the rival ---------------------------------------------------------------------------------------------------
    { id: 'sk_rival_contest', title: 'Against your rival', scene: 'street',
      cond: (p, C) => C.adult(p) && C.hasRel(p, 'rival'), w: 1.5, cool: 3,
      setup: (p, ctx) => {
        let best = null;
        for (const { p: r } of A.relsOf(p, ['rival'])) { if (!r.alive) continue; for (const k in p.sk) { const lv = SK().lvOf(r, k); if (lv > 0 && p.sk[k].lv > 0 && (!best || lv > best.lv)) best = { r, k, lv }; } }
        if (!best || !fill(p, ctx, best.k)) { ctx.skip = true; return; }
        ctx.pid = best.r.id;
      },
      text: '{them} is in town, and everyone knows you two cannot be in the same room without it turning into a contest of {skl}. Today someone has put money on it.',
      choices: [
        { t: 'Meet {khim}', check: { s: 'wil', s2: 'ins', d: 50 },
          win: { r: 'You beat {khim}, narrowly, in front of people who will remember. {them} does not shake your hand.', fx: (p, ctx) => { A.gainXp(p, ctx.sk, 1, { q: 'stretch', d: SK().lvOf(A.P(ctx.pid), ctx.sk), why: 'the contest with ' + A.P(ctx.pid).given, trigger: 'rival' }); A.addOp && A.addOp(p, A.P(ctx.pid), -4); return ''; } },
          lose: { r: '{them} wins. You watch what {khe} did and cannot stop watching it all the way home.', fx: (p, ctx) => { A.gainXp(p, ctx.sk, 1, { q: 'stretch', d: SK().lvOf(A.P(ctx.pid), ctx.sk) + 1, failed: true, why: 'the contest with ' + A.P(ctx.pid).given, trigger: 'defeat' }); p.happy = Math.max(0, p.happy - 4); return ''; } } },
        { t: 'Refuse; there is nothing to prove', r: 'Some say you are afraid. You say nothing, which costs you more than you expected.', fx: { fame: -1, wil: 0.5 } },
      ] },

    // ---- a quiet winter after long work ---------------------------------------------------------------------------------
    { id: 'sk_quiet_winter', title: 'A quiet winter', scene: 'home',
      cond: (p, C) => C.adult(p) && C.stuck(p), w: 1.5, cool: 5,
      setup: (p, ctx) => { fill(p, ctx, SK().edgeSkill(p, 'stuck')); },
      text: 'Snow on the roads and nothing to be done. Your {skl} has stood still for a long time, short of {concept}. You find yourself going over it in your head, by the fire, with no one to show.',
      choices: [
        { t: 'Let it sit; think it through', r: 'Nights of turning it over, slowly, like a stone in your pocket.', fx: { grasp: { k: 'ctx' }, need: { rest: 10 }, coin: -5 } },
        { t: 'Drill through the winter anyway', r: 'Cold hands, a cold yard, the same thing done a thousand times.', fx: (p, ctx) => work(p, ctx, 0.8, 'practice', 'a winter of drill') },
        { t: 'Put it away until spring', r: 'You think about other things. It is a relief, and a little like giving up.', fx: { need: { rest: 15 }, happy: 2 } },
      ] },

    // ---- a specialism offered (Advanced, none yet) -----------------------------------------------------------------------
    { id: 'sk_specialism', title: 'Narrowing your art', scene: 'workshop',
      cond: (p, C) => C.adult(p) && C.lvl(p, 'any', 'advanced'), w: 1.5, cool: 6,
      setup: (p, ctx) => {
        const k = Object.keys(p.sk).filter(x => SK().wordOf(p.sk[x].lv) >= 2 && !p.sk[x].sp.length).sort((a, b) => p.sk[b].lv - p.sk[a].lv)[0];
        if (!fill(p, ctx, k)) return;
        const S = SK().BY[k].specialisms; if (S.length < 2) { ctx.skip = true; return; }
        const pick = A.S.year % S.length;
        ctx.sp1 = S[pick].id; ctx.sp1n = S[pick].name; ctx.sp2 = S[(pick + 1) % S.length].id; ctx.sp2n = S[(pick + 1) % S.length].name;
      },
      text: 'In {skl} you can do most things passably now. The ones who are better than you are better at one thing. A choice is wanted: {sp1n}, or {sp2n}, or the whole art, done as well as you can.',
      choices: [
        { t: 'Make {sp1n} your own', r: 'You give it your hours. Inside it you will be better than your level; outside it a little worse, and slower to learn.', fx: { specialism: { ctx: 'ctx.sp1' }, need: { purpose: 6 } } },
        { t: 'Make {sp2n} your own', r: 'You give it your hours. The rest of the art will come slower now.', fx: { specialism: { ctx: 'ctx.sp2' }, need: { purpose: 6 } } },
        { t: 'Keep to the whole art', r: 'Nothing gained, nothing given up.', fx: { wil: 0.5 } },
      ] },

    // ---- the blind spot named, after years at the edge --------------------------------------------------------------
    { id: 'sk_never_see', title: 'Some never see it', scene: 'home',
      cond: (p, C) => C.adult(p) && C.stuck(p) && C.age(p) >= 25, w: 1, cool: 10,
      setup: (p, ctx) => {
        const k = SK().edgeSkill(p, 'stuck'); if (!fill(p, ctx, k)) return;
        const s = p.sk[k]; if (s.stallAt == null || SK().ageF(p) - s.stallAt < 5) { ctx.skip = true; return; }
        const t = teacherOf(p, k); if (!t || SK().wordOf(SK().lvOf(t, k)) < 4) { ctx.skip = true; return; }
        ctx.pid = t.id;
      },
      text: 'Five years at the same edge. {them}, who is a master of {skl}, says it kindly: "Some men never see {concept}. I do not say you are one. I say it happens."',
      choices: [
        { t: 'Seek a master in another land', r: 'You will go where they do it differently. It may be what you need; it will cost what travel costs.', fx: { coin: -40, flag: 'sk_seek_master', need: { purpose: 10 } } },
        { t: 'Keep at it', r: 'You go back to the work. If it comes, it comes.', fx: (p, ctx) => work(p, ctx, 0.6, 'practice', 'keeping at it') },
        { t: 'Turn your hours to something else', r: 'You set it down. It is strange how light it feels, and how much you miss it.', fx: { need: { rest: 10 }, happy: -2, wil: 0.5 } },
      ] },

    // ---- watching a better hand --------------------------------------------------------------------------------------
    { id: 'sk_better_hand', title: 'A better hand at work', scene: 'market',
      cond: (p, C) => C.adult(p) && C.town(p), w: 1, cool: 5,
      setup: (p, ctx) => {
        const k = Object.keys(p.sk).filter(x => p.sk[x].lv >= 6 && SK().E().openConcepts(SK().view(p), x).length).sort((a, b) => p.sk[b].lv - p.sk[a].lv)[0];
        fill(p, ctx, k);
      },
      text: 'A stranger in the market square is doing what you do, {skl}, and doing it better. A small crowd has gathered. Nobody else sees what you see.',
      choices: [
        { t: 'Watch until the end', r: 'An hour gone and your work undone. You saw something; you are not yet sure what.', fx: (p, ctx) => { A.gainXp(p, ctx.sk, 0.2, { q: 'stretch', d: Math.min(35, p.sk[ctx.sk].lv + 5), why: 'watching a better hand', trigger: 'watch' }); return ''; } },
        { t: 'Ask the stranger how', r: 'The stranger laughs and tells you, and it sounds like nothing. Maybe it is nothing.', fx: { coin: -3, need: { company: 6 } } },
        { t: 'Walk on; you have work', r: 'You have work, and you do it.', fx: { coin: 3 } },
      ] },

    // ---- a pupil -----------------------------------------------------------------------------------------------------
    { id: 'sk_pupil', title: 'A youngster who wants to learn', scene: 'workshop',
      cond: (p, C) => C.adult(p) && C.age(p) >= 25 && C.lvl(p, 'any', 'advanced'), w: 1, cool: 8,
      setup: (p, ctx) => { const k = Object.keys(p.sk).sort((a, b) => p.sk[b].lv - p.sk[a].lv)[0]; fill(p, ctx, k); },
      text: 'A youngster has been hanging about while you work at your {skl}, asking questions you have to think about before you answer. Their family cannot pay much.',
      choices: [
        { t: 'Teach them, for what they can pay', r: 'Explaining it out loud, you find out what you actually know.', fx: (p, ctx) => { A.gainXp(p, ctx.sk, 0.4, { q: 'practice', why: 'teaching a pupil' }); p.coin = Math.max(0, p.coin - 4); p.needs && (p.needs.purpose = Math.min(100, (p.needs.purpose || 0) + 10)); return ''; } },
        { t: 'Send them to someone better', r: 'They go, a little hurt. You keep your evenings.', fx: { need: { rest: 6 } } },
      ] },

    // ---- the rust: a skill left a long time ---------------------------------------------------------------------------
    { id: 'sk_rusty', title: 'Out of practice', scene: 'home',
      cond: (p, C) => C.adult(p), w: 1, cool: 6,
      setup: (p, ctx) => { const k = Object.keys(p.sk).filter(x => p.sk[x].rust > 0).sort((a, b) => p.sk[b].lv - p.sk[a].lv)[0]; fill(p, ctx, k); },
      text: 'You try your {skl} for the first time in years. It is all still there, somewhere, behind a door that sticks.',
      choices: [
        { t: 'Work it back in, a month of evenings', r: 'It comes back faster than it went. Most of it.', fx: (p, ctx) => work(p, ctx, 1, 'practice', 'getting the rust off') },
        { t: 'Let it go', r: 'You cannot keep everything. You choose not to keep this.', fx: { need: { rest: 5 }, happy: -1 } },
      ] },

    // ---- hours shared between too many studies ----------------------------------------------------------------------
    { id: 'sk_scattered', title: 'Too many things at once', scene: 'home',
      cond: (p, C) => C.adult(p) && C.flag(p, 'sk_scattered'), w: 2, cool: 4,
      setup: (p, ctx) => { const k = A.plan && A.plan(p).train; fill(p, ctx, k && SK().canon(k)[0] && p.sk[SK().canon(k)[0]] ? SK().canon(k)[0] : Object.keys(p.sk)[0]); },
      text: 'You are learning three things at once and none of them well. Your {skl} gets the leftovers of tired evenings.',
      choices: [
        { t: 'Give {skl} your best hours', r: 'The rest will wait. You feel the difference within a month.', fx: (p, ctx) => { delete p.flags.sk_scattered; return work(p, ctx, 0.8, 'practice', 'your best hours'); } },
        { t: 'Keep all of them going', r: 'Slower on every front, and still on every front.', fx: { wil: 0.5, unflag: 'sk_scattered' } },
      ] },

    // ---- pride humbled ------------------------------------------------------------------------------------------------
    { id: 'sk_humbled', title: 'Beaten in front of everyone', scene: 'street',
      cond: (p, C) => C.adult(p) && (C.trait(p, 'proud') || C.trait(p, 'arrogant')) && C.flag(p, 'sk_lost_public') && !C.flag(p, 'sk_humbled'), w: 3, cool: 10,
      text: 'You lost, and everyone saw it, and some of them were glad. The worst of it is that the other one was better, plainly, and you could see exactly how.',
      choices: [
        { t: 'Admit it, and ask how', r: 'It is the hardest thing you have said in years. Afterwards, you find you can be taught.', fx: { flag: 'sk_humbled', honor: 1, happy: -3, wil: 1 } },
        { t: 'Call it luck', r: 'Nobody believes it, including you. It is easier, for now.', fx: { happy: 2, honor: -1, unflag: 'sk_lost_public' } },
      ] },

    // ---- the old hands -----------------------------------------------------------------------------------------------
    { id: 'sk_old_hands', title: 'Hands that learn slower', scene: 'home',
      cond: (p, C) => C.age(p) >= 50 && C.stuck(p), w: 1, cool: 10,
      setup: (p, ctx) => { fill(p, ctx, SK().edgeSkill(p, 'stuck')); },
      text: 'At your age the {skl} you have is the {skl} you have. A young one picks up in a season what costs you a year. Still short of {concept}, and the years are not getting longer.',
      choices: [
        { t: 'Keep reaching for it', r: 'Slower, yes. Not stopped.', fx: (p, ctx) => work(p, ctx, 0.6, 'practice', 'an old hand reaching') },
        { t: 'Pass on what you have instead', r: 'You find someone young and give them your mistakes to skip. It is its own kind of mastery.', fx: { need: { purpose: 12 }, fame: 1 } },
      ] },
  ]);
})();
