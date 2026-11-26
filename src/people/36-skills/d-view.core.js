// S1b stage 5: what the player sees of a skill (docs/design/skills.md §8). No percentages and no bare numbers: since the
// skills rebuild's switch (skills-v2 §6.1, D-NEW-1) a level is its rung, rank and level ("Basic Swordsmanship · C ·
// Lv 3", A.SK2.label), never a word; the way to the next level is a bar (a scaled <i>, no width animation) and a word, a
// concept's state is a word, and every reason is a sentence. A row is one control of at least 44 points; it opens the skill's
// sheet on a tap (59-descriptions' popover, G.skill), never on hover.
//
// Drawing only reads: nothing here changes A.S or draws from A.rand.
(function () {
  const SK = A.SK; if (!SK || !SK.DATA) return;
  const esc = s => UI.esc(String(s == null ? '' : s));
  const K2 = () => A.SK2;
  const isPC = p => !!(p && A.S && p.id === A.S.pc);
  const tt = k => (UI.ttAttrs ? UI.ttAttrs('skill', k, false) : '');

  // ---- reading a skill, in words --------------------------------------------------------------------------------------
  SK.bar = function (p, k) {
    const s = p.sk && p.sk[k]; if (!s) return { f: 0, word: '' };
    if (s.lv >= SK.MAX_LV) return { f: 1, word: 'at the top' };
    // the bar is the rung's level (an S1 step in C, B and A is two levels: its bar is half the step's)
    const r = K2() && K2().on ? K2().rungNow(s) : null;
    const c = r ? K2().E().cost(r.rank, r.lv) : SK.E().cost(s.lv), x = r ? r.xp : s.xp;
    const edge = s.xp >= SK.E().cost(s.lv) - 1e-6;
    const f = edge ? 1 : Math.max(0, Math.min(1, x / c));
    return { f, word: f >= 1 - 1e-6 ? 'full' : SK.E().BAR_WORDS[Math.min(4, Math.floor(5 * f))] };
  };
  // the row's two words of state: why a full bar does not move; else discipline and the life
  SK.stateWords = function (p, k) {
    const s = p.sk && p.sk[k]; if (!s) return '';
    const e = SK.edgeState ? SK.edgeState(p, k) : null;
    if (e === 'stuck') { const m = SK.E().openConcepts(SK.view(p), k); return 'held: ' + (m[0] ? m[0].name : 'a concept'); }
    if (e === 'ready') return 'ready: wants a deed';
    if (s.rust > 0) { const yrs = s.used != null ? Math.max(0, Math.floor(SK.ageF(p) - s.used)) : 0; return yrs >= 2 ? `unused ${SK.yearsWord(yrs)} years` : 'coming back'; }
    const L = p.skl && p.skl.k && p.skl.k[k], tags = (L && L.tags) || [];
    const bits = [SK.E().disciplineWord(s.streak)];
    for (const t of ['a rival ahead', 'a rival', 'a new place', 'past your talent\'s reach', 'asks nothing new', 'outside your specialism', 'hours shared', 'a mending wound']) if (tags.includes(t)) { bits.push(t === 'past your talent\'s reach' ? 'past your gift' : t === 'asks nothing new' ? 'routine work' : t); break; }
    return bits.join(' · ');
  };
  SK.yearsWord = n => (['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][n] || 'many');
  // what the level reads to others: "C · Lv 3", "Rusty · C · Lv 3" (A.SK2.label: the only way a level is printed)
  SK.levelLabel = (p, k) => K2().label(p, k);
  // what the level acts as, after rust, the body's hold and wounds (the sheet says both)
  SK.actsAs = function (p, k) {
    const v = A.skill(p, k), r = K2().rungFor(p, k); if (!r) return null;
    const own = K2().E().value(r.rank, r.lv);
    return v + 0.5 < own ? (v + 0.5 >= 1 ? K2().labelValue(v + 0.5) : 'hardly anything') : null;
  };
  // how far a teacher of S1 step tl can take a pupil (the engine's cap: the top of the band below his): printed
  SK.teachesTo = function (tl) {
    const b = SK.wordOf(tl) - 1; if (b < 0) return null;
    const r = K2().E().landed((b + 1) * SK.STEPS, 1e9); if (!r) return null;
    return r.lv >= K2().E().MAX_LV ? `the top of rank ${r.rank}` : K2().labelRung(r.rank, r.lv);
  };
  // the pace, in a word, with its reason (from this season's ledger, or the last)
  SK.pace = function (p, k) {
    const s = p.sk && p.sk[k]; if (!s) return null;
    const e = SK.edgeState ? SK.edgeState(p, k) : null;
    if (e === 'stuck') { const m = SK.E().openConcepts(SK.view(p), k); return { word: 'held', why: `you have not grasped ${m.map(x => x.name).join(' or ')}` }; }
    if (e === 'ready') return { word: 'held', why: 'ready to rise, and the deed not yet done' };
    const L = p.skl && p.skl.k && (p.skl.k[k] || (p.skl.prev && p.skl.prev.k && p.skl.prev.k[k]));
    if (!L || !(L.x > 0)) return { word: 'not at all', why: 'you have not worked at it this season' };
    const share = L.x / SK.E().cost(s.lv);   // a season's experience against the step
    const word = share >= 0.6 ? 'quickly' : share >= 0.25 ? 'steadily' : share >= 0.08 ? 'slowly' : 'hardly at all';
    const t = L.tags || [];
    const why = t.includes('past your talent\'s reach') ? 'past where your talent carries you'
      : t.includes('asks nothing new') ? 'the work asks nothing new of you'
        : t.includes('your arm cannot carry what your hand knows') ? 'your arm cannot carry what your hand knows'
          : SK.ageF(p) >= 40 && SK.BY[k].kind === 'motor' ? 'your hands learn slower than they did'
            : t.includes('teacher') ? 'a teacher above you' : t.includes('hours shared') ? 'your hours are shared between studies' : null;
    return { word, why };
  };
  // the deed a rank asks (S1's proof, now a condition of the rank: skills-v2 §3.2)
  SK.deedWords = function (k) {
    const g = SK.BY[k] && SK.BY[k].group;
    return g === 'Arms' || g === 'The body' ? 'a fight won against one of that rank' : g === 'Crafts' ? 'a work judged by masters' : g === 'War' ? 'a battle commanded and won'
      : g === 'Letters' || g === 'Faith' ? 'a case or a disputation carried' : 'a task of that rank, done before those who know';
  };

  // ---- the rows (Profile's Skills panel, the rail, the sheet overlay) -----------------------------------------------
  SK.ranked = function (p) {
    const out = [];
    if (p.sk) { for (const k in p.sk) if (p.sk[k].lv > 0 && SK.BY[k]) out.push(k); }
    else if (p.skills) for (const k in p.skills) if (SK.BY[k] && SK.lvOf(p, k) > 0) out.push(k);
    return out.sort((a, b) => SK.lvOf(p, b) - SK.lvOf(p, a) || (SK.bar(p, b).f - SK.bar(p, a).f) || (a < b ? -1 : 1));
  };
  UI.skillRow = function (p, k, opts = {}) {
    const name = SK.name(k), lab = SK.levelLabel(p, k);
    if (!p.sk || opts.slim) return `<div class="skrow slim" role="button" tabindex="0"${tt(k)} aria-label="${esc(name)}, ${esc(lab)}"><span class="skn">${esc(name)}</span><span class="skl">${esc(lab)}</span></div>`;
    const b = SK.bar(p, k), s = p.sk[k], st = SK.E().storedSteps(s), lv = s.lv;
    const next = lv < SK.MAX_LV ? K2().nextLabel(p, k) : '';
    const aria = `${name}, ${lab}${next ? `, ${b.word === 'full' ? 'the bar full' : b.word} to ${next}` : ''}`;
    return `<div class="skrow" role="button" tabindex="0"${tt(k)} aria-label="${esc(aria)}"><span class="skn">${esc(name)}</span><span class="skl">${esc(lab)}</span>` +
      `<span class="skbar" aria-hidden="true"><i style="transform:scaleX(${Math.round(b.f * 1000) / 1000})"></i></span>` +
      (st ? `<span class="skst" aria-hidden="true">${'▫'.repeat(st)}</span>` : '') +
      `<span class="sks">${esc(SK.stateWords(p, k))}</span></div>`;
  };
  UI.skillRows = function (p, n = 5, opts = {}) {
    if (!p) return '';
    const ks = SK.ranked(p).slice(0, n);
    return ks.length ? `<div class="skills">${ks.map(k => UI.skillRow(p, k, opts)).join('')}</div>`
      : '<div class="tiny muted">Nothing learned yet. Try your hand at something.</div>';
  };
  // all skills, by group, each group folded (at most 28 rows in 11 groups)
  UI.skillsBlock = function (p, opts = {}) {
    if (!p) return '';
    const held = new Set(SK.ranked(p));
    let h = '<div class="skills all">';
    for (const g of SK.DATA.groups) {
      const ks = SK.DATA.skills.filter(s => s.group === g && held.has(s.id)).map(s => s.id).sort((a, b) => SK.lvOf(p, b) - SK.lvOf(p, a));
      if (!ks.length) continue;
      h += `<details class="skgroup"${opts.open ? ' open' : ''}><summary>${esc(g)} <span class="muted">${esc(ks.length === 1 ? 'one skill' : SK.yearsWord(ks.length) + ' skills')}</span></summary>${ks.map(k => UI.skillRow(p, k, opts)).join('')}</details>`;
    }
    return held.size ? h + '</div>' : '<div class="tiny muted">Nothing learned yet. Try your hand at something.</div>';
  };

  // ---- the sheet: a tap on a row ------------------------------------------------------------------------------------
  UI.skillSheet = function (p, k) {
    k = SK.canon(k)[0]; if (!p || !k || !SK.BY[k]) return '';
    const S = SK.BY[k], name = S.name, lv = SK.lvOf(p, k), s = p.sk && p.sk[k];
    const P = (h, t) => `<div class="sk-sec"><div class="sk-h">${esc(h)}</div>${t}</div>`;
    const line = t => `<div class="sk-l">${t}</div>`;
    const r2 = K2().rungFor(p, k);
    let h = `<div class="sk-sheet"><div class="sk-title"><b>${esc(name)}</b><span class="sk-word"${UI.ttAttrs ? UI.ttAttrs("skillWord", K2().label(p, k, { bare: true })) : ""}>${esc(r2 ? `${K2().rungName(k, r2.rank)} · ${r2.rank}-rank · Lv ${r2.lv}` : 'untried')}</span></div>`;
    const desc = S.desc || (GD.SKILL_DESC && GD.SKILL_DESC[k]) || '';
    if (desc) h += `<div class="sk-desc">${esc(desc)}</div>`;
    if (!s) {   // someone else: the level, and what he is known for
      return h + (lv > 0 ? line(esc(`${SK.levelLabel(p, k)}.`)) : '') + '</div>';
    }
    // 2. the way to the next step
    const b = SK.bar(p, k), pace = SK.pace(p, k), acts = SK.actsAs(p, k);
    if (lv < SK.MAX_LV) h += P('The way to the next level', `<div class="skbar big" aria-hidden="true"><i style="transform:scaleX(${Math.round(b.f * 1000) / 1000})"></i></div>` +
      line(esc(`${b.word === 'full' ? 'The bar is full' : 'The bar: ' + b.word}${pace ? `; coming ${pace.word === 'held' ? 'no further' : pace.word}${pace.why ? ': ' + pace.why : ''}` : ''}.`)) +
      (s.st > 0 ? line(esc(`Work stored beyond the edge (${['', 'a little', 'some', 'a good deal', 'much', 'a great deal'][SK.E().storedSteps(s)] || 'some'}), which lands at once when the way opens.`)) : ''));
    if (acts) h += line(esc(`${s.rust > 0 ? 'Rusty: it' : 'It'} acts as ${acts} for now${s.rust > 0 ? '; work brings it back five times as fast as it went' : ': your body or a wound holds it there'}.`));
    // 3. what opens the next rank (or the gate inside D and S): its concepts, and the deed
    const w = SK.wordOf(lv) + 1;
    if (w >= 1 && w < SK.BANDS) {
      const v = SK.view(p), cs = SK.E().conceptsOf(k, w), years = s.stallAt != null ? SK.ageF(p) - s.stallAt : 0;
      const rows = cs.map(c => {
        const nd = SK.E().need(v, k, c), state = s.got[c.id] != null ? 'grasped' : SK.E().graspWord(s.ins[c.id] || 0, nd, years);
        return `<details class="sk-c"><summary><span>${esc(c.name.replace(/^./, x => x.toUpperCase()))}</span><b>${esc(state)}</b></summary><div class="sk-cd">${esc(c.desc || '')}${c.never && state !== 'grasped' ? `<div class="muted">Never grasped: ${esc(c.never)}</div>` : ''}</div></details>`;
      }).join('');
      const g = K2().gateLabel(w);
      h += P(/^rank /.test(g) ? `To reach ${g}` : `To pass ${g}`, rows + (w >= SK.E().PROOF_FROM ? line(esc(`And a deed: ${SK.deedWords(k)}${s.proved ? ' (done)' : ''}.`)) : ''));
    }
    // 4. this season
    const L = p.skl && p.skl.k && p.skl.k[k];
    if (L && (L.x > 0 || L.tags.length)) {
      const causes = Object.keys(L.by).filter(x => L.by[x] > 0 && x !== 'other' && x !== 'set').sort((a, c) => L.by[c] - L.by[a]).slice(0, 2);
      const tags = L.tags.filter(t => !['set', 'migrate', 'born', 'inherit', 'teacher', 'kin', 'breakthrough', 'lost', 'stored'].includes(t));
      h += P('This season', (causes.length ? line(esc('Chiefly from ' + causes.join(' and ') + '.')) : '') + (tags.length ? line(esc('In force: ' + tags.join(', ') + '.')) : ''));
    }
    // 5. discipline, talent, specialism, knacks, kin, teacher
    const t = SK.talentOf(p, k), sp = (s.sp || []).map(id => SK.specName(k, id));
    const knacks = A.perksOf ? A.perksOf(p, k) : [];
    const kin = Object.keys(S.kin || {}).map(j => SK.BY[j] ? SK.BY[j].name : j);
    const T = A.teacherFor ? A.teacherFor(p, k) : null;
    let about = line(esc(`Discipline: ${SK.E().disciplineWord(s.streak)}${s.streak >= 12 ? `, ${SK.yearsWord(Math.floor(s.streak / 12))} year${s.streak >= 24 ? 's' : ''} unbroken` : ''}.`)) +
      line(esc(`Talent: ${t}, ${SK.TALENT_WORD[t]}.`)) +
      line(esc(sp.length ? `Specialism: ${sp.join(' and ')}.` : SK.wordOf(lv) >= 2 ? 'No specialism: the whole art, at no cost.' : 'A specialism comes at rank C.'));
    if (knacks.length) about += line(esc('Knacks: ' + knacks.map(x => x[1]).join(', ') + '.'));
    if (kin.length) about += line(esc('Helps: ' + kin.join(', ') + '.'));
    if (T && T.p) { const to = SK.teachesTo(SK.lvOf(T.p, k)); about += line(esc(`A teacher in reach: ${A.fullName ? A.fullName(T.p, false) : T.p.given}, ${K2().label(T.p, k, { bare: true })}${to ? `; lessons can take you as far as ${to}` : ''}.`)); }
    h += P('You and it', about);
    // 6. its story
    const R = (p.skr || []).filter(r => r.k === k && r.t !== 'born').slice(-8);
    if (R.length) h += P('Its story', R.map(r => line(esc(`${r.y}: ${r.text.replace(new RegExp('^' + name + '[,:]?\\s*'), '')}`))).join(''));
    return h + '</div>';
  };

  // ---- the activity: Work at a skill (§3.3) -------------------------------------------------------------------------
  // how: alone (practice), lesson (a teacher in reach, for a fee; drill), test (a stretch with stakes), think (no
  // experience; the month's insight as a quiet season's, when a concept is in reach)
  SK.WORK_HOWS = [['alone', 'Practise alone'], ['lesson', 'Take a lesson'], ['test', 'Seek a harder test'], ['think', 'Think it over']];
  SK.workWords = function (pc, k, how) {
    const c = SK.canon(k)[0]; if (!c) return '';
    const lv = SK.lvOf(pc, c), edge = SK.edgeState ? SK.edgeState(pc, c) : null;
    if (how === 'alone') return lv > 0 ? 'Steady, with no one to correct you.' : 'A first try, on your own.';
    if (how === 'lesson') { const z = SK.teachCause(pc, c); return z.q === 'drill' ? `${z.who} can teach you, for a fee. Worth more than practice alone.` : 'No one in reach knows it better than you.'; }
    if (how === 'test') return 'Something beyond you, with something at stake. Teaches most, and you may fail in front of others.';
    if (how === 'think') return edge === 'stuck' ? 'No new skill in the hands; a better chance that what you lack comes clear.' : 'Nothing at the edge to turn over yet.';
    return '';
  };
  SK.work = function (pc, arg, d) {
    const [k0, how0] = String(arg || '').split(':'), how = how0 || 'alone';
    const k = k0 && GD.SKILLS[k0] ? k0 : A.weaponSkillOf ? A.weaponSkillOf(pc) : 'melee';
    const c = SK.canon(k)[0], name = SK.name(c), mul = d == null ? 1 : d;
    let cz, eu = 1, msg;
    if (how === 'lesson') {
      cz = SK.teachCause(pc, c);
      if (cz.q === 'drill') { const fee = 4 + 3 * Math.max(0, SK.wordOf(cz.teacher)); pc.coin = Math.max(0, (pc.coin || 0) - fee); msg = `${cz.who} takes you through your ${name.toLowerCase()} for some days, and is paid for it.`; }
      else msg = `No one in reach knows ${name.toLowerCase()} better than you, so you practise alone.`;
    } else if (how === 'test') {
      const lv = SK.lvOf(pc, c), won = A.chance(0.45);
      cz = { q: 'stretch', d: Math.min(SK.MAX_LV, lv + 3), failed: !won, why: 'a harder test of ' + name.toLowerCase(), trigger: won ? 'feat' : 'defeat' };
      msg = won ? `You set yourself something beyond your ${name.toLowerCase()}, and manage it.` : `You set yourself something beyond your ${name.toLowerCase()}, and fail, and see why.`;
      if (!won && SK.BY[c] && (SK.BY[c].group === 'Arms' || SK.BY[c].group === 'The body')) pc.health = Math.max(1, (pc.health || 0) - A.ri(2, 6));
    } else if (how === 'think') {
      if (SK.edgeState && SK.edgeState(pc, c) === 'stuck') { eu = 0.1; cz = { q: 'practice', why: 'thinking it over', trigger: 'quiet' }; pc.flags.sk_think = A.S.year * 12 + Math.floor(Math.min(364, A.S.warClock || 0) / 30.42); msg = `You set your ${name.toLowerCase()} aside and turn it over in your head, quietly, for some days.`; }
      else { eu = 0.5; cz = { q: 'practice', why: name + ', practised alone' }; msg = `There is nothing at the edge of your ${name.toLowerCase()} to turn over yet, so you practise a little.`; }
    } else { cz = { q: 'practice', why: name + ', practised alone' }; msg = `You work at your ${name.toLowerCase()} alone for some days.`; }
    A.gainXp(pc, c, eu * mul, cz);
    const s = pc.sk && pc.sk[c];
    msg += s && s.lv > 0 ? ` ${name}: ${K2().label(pc, c)}, the bar ${SK.bar(pc, c).word}; what the work is worth shows at the month's end.` : ' What it is worth shows at the month\'s end.';
    return { msg };
  };
  // the sheet's picker and its four ways (99998-click-open puts it under "What it is")
  UI.workSheet = function (pc) {
    const ks = SK.ranked(pc), plan = A.plan ? SK.canon(A.plan(pc).train || '')[0] : null;
    const cur = UI.practiceK && SK.canon(UI.practiceK)[0] ? SK.canon(UI.practiceK)[0] : plan && pc.sk[plan] ? plan : ks[0] || (A.weaponSkillOf ? SK.canon(A.weaponSkillOf(pc))[0] : 'melee');
    const opts = SK.IDS.slice().sort((a, b) => SK.lvOf(pc, b) - SK.lvOf(pc, a) || (SK.name(a) < SK.name(b) ? -1 : 1))
      .map(k => `<option value="${esc(k)}"${k === cur ? ' selected' : ''}>${esc(SK.name(k))} — ${esc(K2().label(pc, k))}</option>`).join('');
    return `<div class="work-sheet"><label class="work-pick"><span>Which skill</span><select data-c="workPick" aria-label="Which skill">${opts}</select></label>` +
      SK.WORK_HOWS.map(([h, t]) => `<button class="work-how" data-a="workSkill" data-v="${esc(cur + ':' + h)}"><b>${esc(t)}</b><span>${esc(SK.workWords(pc, cur, h))}</span></button>`).join('') + '</div>';
  };
  Object.assign(UI.A, {
    workSkill(v) {
      const ACT = UI.ACTSHEET; if (!ACT || !ACT.run) return;
      const [ok, why] = A.canAct('practice');
      if (!ok) { UI.ov = { type: 'actSheet', id: 'practice', res: { ok: false, text: why || 'Not now.' } }; UI.renderModal(); return; }
      UI.practiceK = String(v).split(':')[0];
      ACT.after('practice', ACT.run('practice', v));
    },
  });
  Object.assign(UI.C, { workPick(el) { UI.practiceK = el.value; UI.renderModal(); } });

  // ---- the look (rule 21: one column at 375, rows of at least 44 points, transform only) -------------------------
  const css = `
  .skills{display:flex;flex-direction:column;gap:2px}
  .skrow{display:grid;grid-template-columns:1fr auto;grid-template-areas:"n l" "b s";align-items:center;column-gap:10px;row-gap:3px;min-height:52px;padding:6px 8px;border-radius:6px;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
  .skrow.slim{grid-template-areas:"n l";min-height:44px}
  .skrow:focus-visible{outline:2px solid var(--gold,#c9a24a);outline-offset:1px}
  .skrow .skn{grid-area:n;font-size:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
  .skrow .skl{grid-area:l;font-size:16px;font-variant-numeric:normal;white-space:nowrap;color:var(--ink-2,inherit)}
  .skrow .skbar{grid-area:b;display:block;height:6px;border-radius:3px;background:var(--line,rgba(127,127,127,.25));overflow:hidden;position:relative}
  .skbar i{display:block;height:100%;width:100%;transform-origin:0 50%;background:var(--gold,#c9a24a);transition:transform .3s ease}
  .skrow .skst{grid-area:b;justify-self:end;font-size:14px;letter-spacing:1px;opacity:.8}
  .skrow .sks{grid-area:s;font-size:14px;opacity:.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:46vw}
  .skgroup>summary{min-height:44px;display:flex;align-items:center;gap:8px;cursor:pointer;font-family:var(--fh,inherit);letter-spacing:.04em}
  .sk-sheet{display:flex;flex-direction:column;gap:8px;max-width:34em}
  .sk-title{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:baseline}.sk-title b{font-size:1.15em}.sk-word{min-height:44px;display:inline-flex;align-items:center;cursor:pointer;text-decoration:underline dotted}
  .sk-desc{opacity:.85}
  .sk-sec{display:flex;flex-direction:column;gap:3px}
  .sk-h{font-family:var(--fh,inherit);font-weight:600;letter-spacing:.03em;margin-top:4px}
  .sk-l{line-height:1.45}
  .skbar.big{height:8px;border-radius:4px;background:var(--line,rgba(127,127,127,.25));overflow:hidden}
  .sk-c>summary{min-height:44px;display:flex;justify-content:space-between;align-items:center;gap:10px;cursor:pointer}
  .sk-c .sk-cd{padding:0 0 6px 10px;line-height:1.4}
  .work-sheet{display:flex;flex-direction:column;gap:6px;margin:8px 0}
  .work-pick{display:flex;flex-direction:column;gap:4px}.work-pick select{min-height:44px;font-size:16px}
  .work-how{display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-height:52px;text-align:left;padding:8px 10px}
  .work-how span{font-size:14px;opacity:.8;font-weight:normal}
  @media (prefers-reduced-motion: reduce){.skbar i{transition:none}}
  `;
  if (typeof document !== 'undefined' && !document.getElementById('skills-style')) { const st = document.createElement('style'); st.id = 'skills-style'; st.textContent = css; (document.head || document.documentElement).appendChild(st); }
})();
