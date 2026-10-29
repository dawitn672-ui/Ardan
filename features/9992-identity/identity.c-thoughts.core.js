// 9992-identity, part 3: thoughts you adopt (design review cycle 1, #19, after Disco Elysium's Thought Cabinet and
// CK3's ripening traits). Scenes and people offer an idea ("The lord's barn is always full"). You may hold two at a
// time. A held thought costs something while you turn it over (half its cost, on its skill), and after its months it
// ripens: you take its trait, a lasting gain on two skills' checks, and the full cost on a third. A held or ripe thought
// also speaks, now and then, as an inner voice (part 2).
//
// State: pc.thoughts = { held: { id: absDay adopted }, ripe: { id: year }, dropped: { id: year } } (new; old saves have none).
// fx: thought: 'id' (or 'ctx' for ctx.th) adopts one. A.thDrop(id) lets one go (journaled, the screen's button).
(function () {
  const ID = A.ID = A.ID || {};
  const esc = s => UI.esc(String(s == null ? '' : s));
  const hash = ID.hash;
  ID.SLOTS = 2;
  // gain: { skill: +n } on checks once ripe; cost: { skill: -n } once ripe (half of it while held); trait: taken on ripening
  ID.THOUGHTS = {
    barn: { name: "The lord's barn is always full", months: 12, trait: 'cynical', gain: { intrigue: 4, stewardship: 3 }, cost: { etiquette: -4 },
      voice: 'Ask who owns the grain before you ask who is hungry.' },
    steel: { name: 'Steel answers what words cannot', months: 12, trait: 'wrathful', gain: { melee: 4, intimidation: 3 }, cost: { diplomacy: -4 },
      voice: 'You have heard enough. Your hand knows the rest.' },
    seed: { name: 'Every coin is a seed', months: 10, trait: 'ambitious', gain: { trade: 5, stewardship: 2 }, cost: { persuasion: -3 },
      voice: 'Spend nothing you could plant.' },
    silence: { name: 'The gods keep their own counsel', months: 14, trait: 'calm', gain: { learning: 4, medicine: 3 }, cost: { faith: -4 },
      voice: 'No sign is coming. Decide as if none ever will.' },
    blood: { name: 'Blood remembers', months: 12, trait: 'proud', gain: { etiquette: 4, command: 3 }, cost: { persuasion: -4 },
      voice: 'Your grandfather would not have bowed to this man.' },
    road: { name: 'The road is the only home', months: 10, trait: 'fickle', gain: { survival: 4, riding: 3 }, cost: { stewardship: -4 },
      voice: 'Pack light. You will not stay.' },
    nobody: { name: 'No one is coming to save you', months: 12, trait: 'stubborn', gain: { athletics: 3, survival: 4 }, cost: { persuasion: -3 },
      voice: 'Nobody will do this for you. Get up.' },
    promise: { name: 'A promise is a debt', months: 12, trait: 'honest', gain: { persuasion: 4, diplomacy: 3 }, cost: { deception: -5 },
      voice: 'You said you would. That settles it.' },
    kindness: { name: 'Kindness is the harder strength', months: 12, trait: 'kind', gain: { medicine: 3, persuasion: 4 }, cost: { intimidation: -4 },
      voice: 'Anyone can hurt him. Try the other thing.' },
    fear: { name: 'Fear is a teacher', months: 10, trait: 'brave', gain: { athletics: 4, tactics: 3 }, cost: { stealth: -3 },
      voice: 'You have been afraid before, and you lived. Listen to it, then go.' },
    sea: { name: 'The sea does not hate you', months: 10, trait: 'content', gain: { sea: 5, survival: 2 }, cost: { riding: -3 },
      voice: 'The water is only water. Read it.' },
    costume: { name: 'Rank is a costume', months: 12, trait: 'humble', gain: { deception: 4, etiquette: 3 }, cost: { command: -3 },
      voice: 'Under the fur he is a man who needs his supper.' },
    children: { name: 'Children are the only deed that lasts', months: 14, trait: 'loyal', gain: { learning: 3, husbandry: 3 }, cost: { tactics: -3 },
      voice: 'Think what the little ones will remember of this.' },
    ink: { name: 'Write it down or it is lost', months: 10, trait: 'curious', gain: { learning: 5, stewardship: 2 }, cost: { melee: -3 },
      voice: 'Remember the date. You will want it.' },
    faces: { name: 'Every face hides a ledger', months: 12, trait: 'deceitful', gain: { intrigue: 5, deception: 2 }, cost: { diplomacy: -4 },
      voice: 'What does he want? Everyone wants something.' },
    tools: { name: 'The body is a tool, and tools wear', months: 12, trait: 'patient', gain: { medicine: 3, athletics: 3 }, cost: { gambling: -3 },
      voice: 'Spare the knee. You will need it at sixty.' },
  };
  // which thought a person you trust is likely to press on you, by their trait (ix_th_friend)
  ID.THOUGHT_OF_TRAIT = { kind: 'kindness', generous: 'kindness', honest: 'promise', cynical: 'barn', brave: 'fear', greedy: 'seed', proud: 'blood',
    curious: 'ink', zealous: 'children', wrathful: 'steel', deceitful: 'faces', calm: 'silence', patient: 'tools', humble: 'costume', ambitious: 'blood' };

  const T = pc => { const t = pc.thoughts; if (t && typeof t === 'object') { t.held = t.held || {}; t.ripe = t.ripe || {}; t.dropped = t.dropped || {}; return t; } return null; };
  ID.thoughtState = pc => (pc && pc.thoughts && typeof pc.thoughts === 'object' ? pc.thoughts : { held: {}, ripe: {}, dropped: {} });
  ID.monthsLeft = function (pc, id) {
    const t = ID.thoughtState(pc), th = ID.THOUGHTS[id];
    if (!th || !t.held || t.held[id] == null) return null;
    return Math.max(0, Math.ceil((th.months * 30 - (A.absDay() - t.held[id])) / 30));
  };
  ID.adopt = function (pc, id) {
    const th = ID.THOUGHTS[id];
    if (!pc || !th) return false;
    pc.thoughts = pc.thoughts && typeof pc.thoughts === 'object' ? pc.thoughts : {};
    const t = T(pc);
    if (t.ripe[id] != null || t.held[id] != null) return false;
    const held = Object.keys(t.held).sort((a, b) => t.held[a] - t.held[b]);
    if (held.length >= ID.SLOTS) { delete t.held[held[0]]; t.dropped[held[0]] = A.S.year; A.log(`You let go of a thought to make room: "${ID.THOUGHTS[held[0]].name}".`, ''); }
    t.held[id] = A.absDay();
    A.log(`You turn a thought over: "${th.name}". It will ripen in about ${th.months} months.`, '');
    return true;
  };
  A.thDrop = function (id) {
    const pc = A.pc(), t = pc && T(pc);
    if (!t || t.held[id] == null) return false;
    delete t.held[id]; t.dropped[id] = A.S.year;
    return true;
  };
  A.COMMANDS.push('thDrop');
  // Ripening asks first (cycle 2, lives F5: a third of all trait changes came from here, logged "in 1120", and lives
  // converged). The month hook queues ix_ripe; its choice either lets the trait in, under 49-body-mind's receipt for
  // that choice ("“Let it become part of you” (Every coin is a seed, 1120)"), or keeps the thought as a thought: the
  // gains and the cost on checks stay, the trait does not come.
  ID.ripen = function (pc, id, mode) {
    const t = T(pc), th = ID.THOUGHTS[id];
    if (!t || !th || t.held[id] == null) return false;
    delete t.held[id];
    t.ripe[id] = A.S.year;
    if (mode === 'keep') { t.kept = t.kept || {}; t.kept[id] = A.S.year; return true; }
    if (th.trait && GD.TRAITS[th.trait] && !(pc.traits || []).includes(th.trait) && A.addTrait) {
      const opp = GD.TRAITS[th.trait].opp;
      if (opp && (pc.traits || []).includes(opp) && A.removeTrait) A.removeTrait(pc, opp);
      A.addTrait(pc, th.trait);
    }
    return true;
  };
  ID.ripeDue = function (pc) {
    const t = ID.thoughtState(pc), now = A.absDay();
    return Object.keys(t.held || {}).filter(id => ID.THOUGHTS[id] && now - t.held[id] >= ID.THOUGHTS[id].months * 30).sort((a, b) => t.held[a] - t.held[b]);
  };
  ID.thoughtMonth = function (pc) {
    if (!pc || !pc.alive || !pc.thoughts) return;
    const t = T(pc);
    for (const id of Object.keys(t.held)) if (!ID.THOUGHTS[id]) delete t.held[id];
    const due = ID.ripeDue(pc);
    if (!due.length || A.S.queue.some(q => q && q.ev === 'ix_ripe')) return;
    const id = due[0], th = ID.THOUGHTS[id];
    // a thought whose trait you already have, or that has none, simply ripens: there is nothing to ask
    if (!th.trait || !GD.TRAITS[th.trait] || (pc.traits || []).includes(th.trait) || !A.EV.ix_ripe) { ID.ripen(pc, id, 'keep'); A.log(`A thought has ripened: "${th.name}".`, 'good'); return; }
    A.queue({ type: 'event', ev: 'ix_ripe', ctx: { th: id, thName: th.name } });
  };
  // fx ripe: 'in' | 'keep' takes the ripening thought (ctx.th) one way or the other
  (A.FX_EXTRA = A.FX_EXTRA || []).push('ripe');
  const apR = A.applyFx;
  A.applyFx = function (pc, fx, ctx) {
    const r = apR.apply(this, arguments);
    try { if (fx && typeof fx === 'object' && fx.ripe && ctx && ctx.th) ID.ripen(pc, ctx.th, fx.ripe === 'keep' ? 'keep' : 'in'); } catch (e) { console.error('ripe fx', e); }
    return r;
  };
  A.onMonth.push(pc => { try { ID.thoughtMonth(pc); } catch (e) { console.error('thoughts', e); } });

  // what thoughts add to a check on a skill: the gain and cost of ripe ones, half the cost of held ones
  ID.thoughtMod = function (pc, k) {
    if (!pc || !pc.thoughts || !k) return 0;
    const t = ID.thoughtState(pc);
    let m = 0;
    for (const id in (t.ripe || {})) { const th = ID.THOUGHTS[id]; if (th) m += (th.gain[k] || 0) + (th.cost[k] || 0); }
    for (const id in (t.held || {})) { const th = ID.THOUGHTS[id]; if (th && th.cost[k]) m += Math.round(th.cost[k] / 2); }
    return m;
  };
  const cv = A.checkVal;
  A.checkVal = function (pc, check) {
    const v = cv.apply(this, arguments);
    try { if (pc && pc.thoughts && check) { const m = ID.thoughtMod(pc, check.s) * 0.6 + (check.s2 ? ID.thoughtMod(pc, check.s2) * 0.4 : ID.thoughtMod(pc, check.s) * 0.4); return v + m; } } catch (e) {}
    return v;
  };

  (A.FX_EXTRA = A.FX_EXTRA || []).push('thought');
  const ap = A.applyFx;
  A.applyFx = function (pc, fx, ctx) {
    const r = ap.apply(this, arguments);
    try { if (fx && typeof fx === 'object' && fx.thought) ID.adopt(pc, fx.thought === 'ctx' ? ctx && ctx.th : fx.thought); } catch (e) { console.error('thought fx', e); }
    return r;
  };

  // a held or ripe thought speaks one time in four, instead of a skill (part 2 calls this; pure)
  ID.thoughtVoice = function (pc, key, kind) {
    const t = ID.thoughtState(pc), ids = Object.keys(t.held || {}).concat(Object.keys(t.ripe || {})).filter(id => ID.THOUGHTS[id]);
    if (!ids.length || hash(key + '|th') % 4) return null;
    const id = ids[hash(key + '|thw') % ids.length], th = ID.THOUGHTS[id];
    return { key: 'thought', name: th.name, line: th.voice, kind, thought: id };
  };

  // the line in "Your mark"
  const sign = n => (n > 0 ? '+' + n : String(n));
  const skn = k => String((GD.SKILLS && GD.SKILLS[k]) || k).split(/[:&,(]/)[0].trim();
  ID.thoughtDesc = th => `${Object.entries(th.gain).map(([k, n]) => `${sign(n)} ${skn(k)}`).join(', ')}; ${Object.entries(th.cost).map(([k, n]) => `${sign(n)} ${skn(k)}`).join(', ')}${th.trait && GD.TRAITS[th.trait] ? '; ' + GD.TRAITS[th.trait].name.toLowerCase() : ''}`;
  ID.thoughtsLine = function (pc) {
    const t = ID.thoughtState(pc), held = Object.keys(t.held || {}).filter(id => ID.THOUGHTS[id]), ripe = Object.keys(t.ripe || {}).filter(id => ID.THOUGHTS[id]);
    if (!held.length && !ripe.length) return '';
    let h = '<div class="id-thoughts"><div class="tiny muted" style="margin-top:6px">Thoughts</div><ul class="id-things">';
    for (const id of held) {
      const th = ID.THOUGHTS[id], left = ID.monthsLeft(pc, id);
      h += `<li class="id-thought"><i>“${esc(th.name)}”</i> <span class="tiny muted">ripens in ${esc(left)} month${left === 1 ? '' : 's'} · when ripe: ${esc(ID.thoughtDesc(th))}</span> <button class="small ghost" data-a="thDrop" data-v="${esc(id)}">Let it go</button></li>`;
    }
    for (const id of ripe) h += `<li class="id-thought ripe"><i>“${esc(ID.THOUGHTS[id].name)}”</i> <span class="tiny muted">held since ${esc(t.ripe[id])} · ${esc(ID.thoughtDesc(ID.THOUGHTS[id]))}</span></li>`;
    return h + '</ul></div>';
  };
  Object.assign(UI.A, { thDrop(v) { if (A.thDrop(String(v))) { UI.refresh ? UI.refresh() : UI.render(); } } });
})();
