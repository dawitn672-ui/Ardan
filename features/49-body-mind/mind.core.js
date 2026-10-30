// Personality changes from what you do, and shows why (Road to Ten, Character 5). In the release 372 events add a trait
// the moment you choose (`fx.trait`), silently, the opposite drops without a word, and nothing caps the count (a bot life
// ended with 13). Now:
//  - deeds are counted by kind. A choice an event marks with a trait is a strong deed of that kind (2); a choice whose
//    words or effects show it (hang, spare, give, lie, pray; coin taken against honour, piety spent) is a deed (1); a
//    habit kept (prayers, crimes, vigils, the tavern) is a small one (a quarter to a half);
//  - a trait comes when the deeds of its kind, less those of its opposite, reach 3 within 12 years, and it goes when the
//    opposite's do; the log says so, with the deeds ("You have become cruel: “Hang him. The law is the law” (The poacher,
//    1112); ...");
//  - at most 5 traits: a new one pushes out the one your deeds hold least;
//  - the profile shows, for every trait, why you have it, and what you are leaning toward.
// Engine side: the wrapped choice, effect and activity record deeds; rendering only reads. pc.deedLog, pc.traitWhy and
// pc.traitLog are new optional fields.
(function () {
  const BM = A.BM = A.BM || {};
  const isPC = p => p && A.S && p.id === A.S.pc;
  BM.CAP = 5;          // traits at most
  BM.LINE = 3;         // deeds of a kind (less its opposite's) that make a trait
  BM.WINDOW = 12;      // years a deed counts
  BM.cur = null;       // what is being done: { title, label } while a choice or an activity runs

  // what a choice's words show, when its event did not say (the start of the label, as the player reads it)
  BM.SAY = [
    ['cruel', /^(hang|flog|whip|torture|maim|thrash|brand|starve|burn (him|her|them|the|it)\b|kill (him|her|them|the|it)\b|beat (him|her|them|the)\b|cut off|have (him|her|them) (flogged|whipped|hanged))/i],
    ['kind', /^(nurse|comfort|feed|spare|forgive|pardon|shelter|tend (to )?(him|her|them|the)|help (him|her|them|the)\b|take (him|her|them) in\b|carry (him|her|them)\b)/i],
    ['brave', /^(fight|charge|step in|stand (your ground|and fight|firm)|face (him|her|them|it|the)\b|attack|go in first|leap|jump in|hold the (line|gate|door|wall))/i],
    ['craven', /^(run\b|flee|surrender|back away|yield|hand it over|give (him|her|them) up|beg for (your|mercy))/i],
    ['honest', /^(tell (him|her|them) the truth|tell the truth|confess|own up|admit it)/i],
    ['deceitful', /^(lie\b|lie to|cheat|bluff|pretend|forge|swear, but)/i],
    ['wrathful', /^(strike|punch|hit (him|her|them)\b|fists|smash|rage\b)/i],
    ['calm', /^(walk away|let it go|hold your tongue|bear it with|ignore (him|her|them)\b)/i],
    ['greedy', /^(take the (purse|silver|coin|gold|money|lot)|double the price|keep (it all|the (purse|silver|coin|money|gold)))/i],
    ['generous', /^(give (him|her|them|the|your|away|half|bread|alms)\b|pay (his|her|their) |donate|share (it|out|your)\b)/i],
  ];
  // habits: what an activity is worth as a deed
  BM.HABIT = {
    pray: ['zealous', 0.25], pilgrimage: ['zealous', 0.6], meditate: ['calm', 0.25], study: ['curious', 0.25], tavern: ['gregarious', 0.25],
    festival: ['gregarious', 0.2], duel: ['proud', 0.5], beast_hunt: ['brave', 0.5], tournament: ['proud', 0.34], moneylend: ['greedy', 0.4],
    crime_pick: ['deceitful', 0.34], crime_burgle: ['greedy', 0.4], crime_rob: ['cruel', 0.4], crime_smuggle: ['greedy', 0.34], gamble: ['impetuous', 0.25],
    make_friend: ['gregarious', 0.2], chores: ['diligent', 0.25],
  };
  const yearOf = () => A.S.year;
  BM.log = pc => (pc.deedLog = pc.deedLog && typeof pc.deedLog === 'object' && !Array.isArray(pc.deedLog) ? pc.deedLog : {});
  BM.score = (pc, kind) => {
    const L = (pc.deedLog || {})[kind]; if (!Array.isArray(L)) return 0;
    const y0 = yearOf() - BM.WINDOW; let s = 0;
    for (const d of L) if (Array.isArray(d) && d[0] >= y0) s += +d[1] || 0;
    return Math.round(s * 100) / 100;
  };
  BM.lean = (pc, kind) => { const T = GD.TRAITS[kind]; return BM.score(pc, kind) - (T && T.opp ? BM.score(pc, T.opp) : 0); };
  BM.receipts = (pc, kind, n) => {
    const L = (pc.deedLog || {})[kind] || [], y0 = yearOf() - BM.WINDOW;
    return L.filter(d => Array.isArray(d) && d[0] >= y0 && d[2]).slice(-(n || 3)).map(d => d[2]);
  };
  // a deed of a kind
  BM.deed = function (pc, kind, w, txt) {
    if (!isPC(pc) || !GD.TRAITS[kind] || !(w > 0)) return;
    const L = BM.log(pc), a = L[kind] = Array.isArray(L[kind]) ? L[kind] : [];
    a.push([yearOf(), w, String(txt || `in ${yearOf()}`).slice(0, 120)]);
    if (a.length > 8) a.shift();
    BM.weigh(pc, kind);
  };
  // the deeds of a kind cross the line: the trait comes
  BM.weigh = function (pc, kind) {
    if (pc.traits.includes(kind) || BM.lean(pc, kind) < BM.LINE) return;
    BM.gain(pc, kind);
  };
  BM.why = pc => (pc.traitWhy = pc.traitWhy && typeof pc.traitWhy === 'object' ? pc.traitWhy : {});
  const nm = t => (GD.TRAITS[t] ? GD.TRAITS[t].name : t).toLowerCase();
  // the trait your deeds hold least: no deeds at all first, then the longest held
  BM.weakest = function (pc, except) {
    const W = BM.why(pc);
    const c = pc.traits.filter(t => t !== except && GD.TRAITS[t]);
    if (!c.length) return null;
    return c.map(t => [t, BM.score(pc, t), (W[t] && W[t].y) || 0]).sort((a, b) => a[1] - b[1] || a[2] - b[2])[0][0];
  };
  BM.gain = function (pc, kind) {
    const T = GD.TRAITS[kind]; if (!T) return;
    const opp = T.opp && pc.traits.includes(T.opp) ? T.opp : null;
    let dropped = null;
    if (!opp && pc.traits.filter(t => GD.TRAITS[t]).length >= BM.CAP) { dropped = BM.weakest(pc, kind); if (dropped) A.removeTrait(pc, dropped); }
    BM.adding = true;
    let ok; try { ok = A.addTrait(pc, kind); } finally { BM.adding = false; }
    if (!ok) return;
    const r = BM.receipts(pc, kind, 3);
    BM.why(pc)[kind] = { y: yearOf(), by: 'deeds', r };
    if (opp) delete BM.why(pc)[opp];
    if (dropped) delete BM.why(pc)[dropped];
    const L = pc.traitLog = Array.isArray(pc.traitLog) ? pc.traitLog : [];
    L.push([yearOf(), kind, opp || dropped || '', r.slice(0, 3)]); if (L.length > 30) L.shift();
    A.log(`You have become ${nm(kind)}: ${r.join('; ')}.` + (opp ? ` You are not ${nm(opp)} any more.` : '') + (dropped ? ` There is less room in you for being ${nm(dropped)}.` : ''), 'big');
  };
  // a trait that arrives some other way (another feature calling A.addTrait) is logged with what was being done
  const add = A.addTrait;
  A.addTrait = function (p, t) {
    if (!isPC(p) || BM.adding) return add.apply(this, arguments);
    const T = GD.TRAITS[t], opp = T && T.opp && p.traits.includes(T.opp) ? T.opp : null;
    const r = add.apply(this, arguments);
    try {
      if (r) {
        const why = BM.cur ? BM.receipt(BM.cur) : `in ${yearOf()}`;
        BM.why(p)[t] = { y: yearOf(), by: 'deeds', r: [why] }; if (opp) delete BM.why(p)[opp];
        const L = p.traitLog = Array.isArray(p.traitLog) ? p.traitLog : []; L.push([yearOf(), t, opp || '', [why]]); if (L.length > 30) L.shift();
        A.log(`You have become ${nm(t)}: ${why}.` + (opp ? ` You are not ${nm(opp)} any more.` : ''), 'big');
        BM.capCheck(p);
      }
    } catch (e) { console.error('trait log', e); }
    return r;
  };
  // the cap also holds against traits that arrive some other way
  BM.capCheck = function (pc) {
    let n = 0;
    while (pc.traits.filter(t => GD.TRAITS[t]).length > BM.CAP && n++ < 10) {
      const t = BM.weakest(pc, pc.traits[pc.traits.length - 1]); if (!t) break;
      A.removeTrait(pc, t); delete BM.why(pc)[t];
      A.log(`There is less room in you for being ${nm(t)}.`, 'muted');
    }
  };
  A.onMonth.push(pc => { if (pc && pc.alive) BM.capCheck(pc); });

  // what you do: the choice taken (its words), its effects (an event's own trait mark, piety, coin and honour)
  const choose = A.eventChoose;
  A.eventChoose = function (idx) {
    const q = A.S.queue[0], pc = A.pc();
    let cur = null;
    try {
      if (pc && q && q.type === 'event' && !q.result) {
        const v = A.eventView(q), c = v && v.choices[idx], e = A.EV[q.ev];
        if (c && c.i >= 0 && e) cur = { title: v.title || e.title || '', label: c.t || '', ch: e.choices[c.i], seen: new Set() };
      }
    } catch (err) {}
    const prev = BM.cur; BM.cur = cur;
    let r;
    try { r = choose.apply(this, arguments); }
    finally { BM.cur = prev; }
    try {
      if (cur && pc && pc.alive) {
        const say = cur.label.replace(/^[\s“"']+/, '');
        for (const [k, rx] of BM.SAY) if (!cur.seen.has(k) && rx.test(say) && (k !== 'generous' || BM.costs(cur.ch))) { BM.deed(pc, k, 1, BM.receipt(cur)); break; }
      }
    } catch (err) { console.error('deeds', err); }
    return r;
  };
  for (const k of Object.keys(choose)) A.eventChoose[k] = choose[k];
  BM.costs = ch => { const fx = ch && (ch.fx || (ch.win && ch.win.fx)); return !!(fx && typeof fx === 'object' && (fx.coin < 0 || fx.coinPct < 0 || fx.family < 0)); };
  BM.receipt = cur => `“${String(cur.label).replace(/[.!]+$/, '')}” (${cur.title ? cur.title + ', ' : ''}${yearOf()})`;
  const apply = A.applyFx;
  A.applyFx = function (pc, fx, ctx) {
    if (!isPC(pc) || !fx || typeof fx !== 'object' || Array.isArray(fx)) return apply.apply(this, arguments);
    const cur = BM.cur, why = cur ? BM.receipt(cur) : `in ${yearOf()}`;
    let rest = fx, mark = null;
    if (fx.trait && GD.TRAITS[fx.trait]) { mark = fx.trait; rest = Object.assign({}, fx); delete rest.trait; }
    const had = fx.untrait && pc.traits.includes(fx.untrait);
    const r = apply.call(this, pc, rest, ctx);
    try {
      if (mark) { BM.deed(pc, mark, 2, why); if (cur) cur.seen.add(mark); }
      else if (cur) {
        if (fx.piety >= 3) { BM.deed(pc, 'zealous', 1, why); cur.seen.add('zealous'); }
        else if (fx.piety <= -3) { BM.deed(pc, 'cynical', 1, why); cur.seen.add('cynical'); }
        if (fx.coin > 0 && fx.honor < 0) { BM.deed(pc, 'greedy', 1, why); cur.seen.add('greedy'); }
      }
      if (had && !pc.traits.includes(fx.untrait)) {
        delete BM.why(pc)[fx.untrait];
        const L = pc.traitLog = Array.isArray(pc.traitLog) ? pc.traitLog : [];
        L.push([yearOf(), '', fx.untrait, [why]]); if (L.length > 30) L.shift();
        A.log(`You are not ${nm(fx.untrait)} any more: ${why}.`, 'big');
      }
    } catch (err) { console.error('deeds fx', err); }
    return r;
  };
  const act = A.doActivity;
  A.doActivity = function (key) {
    const pc = A.pc(), D = GD.ACTIVITIES[key];
    const prev = BM.cur; BM.cur = D ? { title: '', label: D.name, seen: new Set() } : null;
    let r; try { r = act.apply(this, arguments); } finally { BM.cur = prev; }
    try { const H = BM.HABIT[key]; if (H && pc && pc.alive && r && r.ok !== false) BM.deed(pc, H[0], H[1], `${D.name} (${yearOf()})`); } catch (err) {}
    return r;
  };

  // ---- what the profile shows
  BM.reasonOf = function (pc, t) {
    const W = (pc.traitWhy || {})[t];
    if (W && W.by === 'deeds' && W.r && W.r.length) return `Since ${W.y}, from what you did: ${W.r.join('; ')}.`;
    const r = BM.receipts(pc, t, 3);
    if (r.length) return `Your deeds bear it out: ${r.join('; ')}.`;
    return 'You were this way as long as anyone remembers.';
  };
  BM.leanings = function (pc) {
    const out = [];
    for (const k in GD.TRAITS) { if (pc.traits.includes(k)) continue; const l = BM.lean(pc, k); if (l >= 1) out.push([k, l]); }
    return out.sort((a, b) => b[1] - a[1]).slice(0, 4);
  };
  BM.mindHtml = function (pc) {
    const esc = UI.esc;
    const rows = pc.traits.filter(t => GD.TRAITS[t]).map(t => `<div class="small"><b>${esc(GD.TRAITS[t].name)}</b> <span class="tiny muted">${esc(BM.reasonOf(pc, t))}</span></div>`);
    const lean = BM.leanings(pc).map(([k, l]) => `<div class="tiny">Leaning ${esc(nm(k))} (${esc(Math.round(l * 10) / 10)} of ${BM.LINE}): ${esc(BM.receipts(pc, k, 2).join('; '))}</div>`);
    const log = (Array.isArray(pc.traitLog) ? pc.traitLog : []).slice(-4).map(x => `<div class="tiny muted">${esc(x[0])}: ${x[1] ? 'became ' + esc(nm(x[1])) : ''}${x[1] && x[2] ? ', ' : ''}${x[2] ? 'no longer ' + esc(nm(x[2])) : ''}</div>`);
    return `<div class="group-h">Who you are (at most ${BM.CAP} traits)</div>${rows.join('') || '<div class="small muted">No marked traits.</div>'}${lean.join('')}${log.join('')}`;
  };
  // the side profile's trait chips carry their reasons
  const side = UI.renderProfile;
  UI.renderProfile = function () {
    let h = side.apply(this, arguments);
    const pc = A.pc(); if (!pc) return h;
    try {
      for (const t of pc.traits) {
        const T = GD.TRAITS[t]; if (!T) continue;
        const was = `title="${UI.esc(T.desc)}">${T.name}</span>`;
        h = h.replace(was, `title="${UI.esc(T.desc + ' ' + BM.reasonOf(pc, t))}">${T.name}</span>`);
      }
    } catch (e) { console.error('trait chips', e); }
    return h;
  };
  // the full profile: who you are, and why
  const prof = UI.profileModal;
  UI.profileModal = function (pc) {
    const h = prof.apply(this, arguments);
    try {
      const i = h.indexOf('<div class="grid2" style="margin-top:8px">');
      return i > 0 ? h.slice(0, i) + `<div class="card" style="margin-top:8px">${BM.mindHtml(pc)}</div>` + h.slice(i) : h;
    } catch (e) { console.error('profile mind', e); return h; }
  };
})();
