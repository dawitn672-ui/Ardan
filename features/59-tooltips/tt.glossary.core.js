// Nested tooltips: the glossary. Each UI.TIPS[key](arg) returns the popover's HTML, worked out from the live game.
// They are pure: they read A.S and the person, never write to either, and never draw a random number (the tests hash
// the state and the random stream around them). Where a number is a sum, the rows add up to the number shown; a
// rounding row appears only when the parts, rounded one by one, miss the total by a point.
//
// Words inside a popover are links (UI.tt) to their own entry: fighting worth -> body -> Strength -> a trait.
(function () {
  const G = UI.TIPS = UI.TIPS || {};
  const esc = s => UI.esc(String(s == null ? '' : s));
  const r0 = v => Math.round(v || 0);
  const r1 = v => Math.round((v || 0) * 10) / 10;
  const sg = v => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v);
  const pct = v => Math.round(v * 100) + '%';
  const H = (title, val, sub) => `<div class="tip-h">${title}${val != null ? ` <b>${val}</b>` : ''}${sub ? ` <span class="muted">${sub}</span>` : ''}</div>`;
  const R = (label, val, cls) => `<div class="tip-row${cls ? ' ' + cls : ''}"><span>${label}</span><b>${val}</b></div>`;
  const D = t => `<div class="tip-d">${t}</div>`;
  const F = t => `<div class="tip-f">${t}</div>`;
  const FEEDS = list => list.length ? `<div class="tt-feeds"><i>Feeds</i> ${list.join(' · ')}</div>` : '';
  const L = (key, arg, label) => UI.tt(key, arg, label);
  const pc = () => A.pc();
  const person = id => (id ? A.P(id) : null) || A.pc();
  const SN = k => (GD.STAT_NAMES && GD.STAT_NAMES[k]) || k;
  const statL = k => L('stat', k, esc(SN(k)));
  const traitL = t => GD.TRAITS[t] ? L('trait', t, esc(GD.TRAITS[t].name)) : esc(t);
  const TT = UI.TT = UI.TT || {};

  // rows that add up: parts are [labelHtml, value]; the values are rounded, and any point lost to rounding is a row
  TT.sumRows = function (parts, total, totalLabel = 'Total') {
    const P = parts.filter(x => x && x[1] != null).map(([l, v, c]) => [l, r0(v), c]).filter(x => x[1] !== 0 || x[2] === 'keep');
    const sum = P.reduce((a, x) => a + x[1], 0), diff = r0(total) - sum;
    if (diff) P.push(['Rounding', diff, 'tt-sub']);
    return P.map(([l, v, c]) => R(l, sg(v), c && c !== 'keep' ? c : '')).join('') + R(totalLabel, r0(total), 'tt-sum');
  };
  TT.sumOf = (parts, total) => { const P = parts.filter(x => x && x[1] != null).map(x => r0(x[1])); const s = P.reduce((a, b) => a + b, 0); return s + (r0(total) - s); };

  // ---- the six stats: what makes each one, and what it feeds ------------------------------------------------------
  TT.statParts = function (p, k) {
    const base = (p.st && p.st[k]) || 0, af = A.ageFactor ? A.ageFactor(p, k) : 1, parts = [['Trained so far', base]];
    if (af !== 1) parts.push([`${L('age', p.id, 'Age')} ×${r1(af * 100) / 100}`, base * af - base]);
    let v = base * af;
    for (const t of p.traits || []) { const T = GD.TRAITS[t]; if (T && T.fx && T.fx[k]) { parts.push([traitL(t), T.fx[k]]); v += T.fx[k]; } }
    for (const w of p.wounds || []) { const W = GD.WOUNDS[w.k]; if (W && W.fx && W.fx[k]) { parts.push([esc(W.name || w.k), W.fx[k]]); v += W.fx[k]; } }
    const BF = p.app && GD.BUILD_FX && GD.BUILD_FX[p.app.build];
    if (BF && BF[k]) { parts.push([`Build: ${esc(p.app.build)}`, BF[k]]); v += BF[k]; }
    if (p.flags && p.flags.weary) parts.push(['Weary (−8%)', -v * 0.08]);
    return { parts, total: A.stat(p, k) };
  };
  TT.STAT_FEEDS = {
    str: () => [`${L('worth', A.S.pc, 'fighting worth')} ×0.2`, 'carrying armor', 'hard labor'],
    spd: () => [`${L('worth', A.S.pc, 'fighting worth')} ×0.24`, 'striking first', 'dodging'],
    ins: () => [`${L('worth', A.S.pc, 'fighting worth')} ×0.26`, 'reading a fight', 'entering a school'],
    sta: () => [`${L('health', '', 'health')}: mends ⅕ of it a year`, 'how many you can face at once', 'heavy armor below 50'],
    int: () => [`${L('charm', '', 'charm')} ×0.3`, 'study', 'plans and trade'],
    wil: () => [`${L('worth', A.S.pc, 'fighting worth')} ×0.08`, 'standing when hurt', 'adapting to a stronger foe'],
  };
  const statBase = G.stat;   // the release's (and 49-body-mind's) words on each stat
  G.stat = function (k) {
    const p = pc(); if (!p || !GD.STATS.includes(k)) return statBase ? statBase.apply(this, arguments) : '';
    let h = statBase ? statBase.apply(this, arguments) : H(esc(SN(k)), A.stat(p, k));
    const S = TT.statParts(p, k), add = TT.sumRows(S.parts, S.total) + FEEDS(TT.STAT_FEEDS[k] ? TT.STAT_FEEDS[k]() : []);
    const i = h.indexOf('<div class="tip-f">');
    h = i > 0 ? h.slice(0, i) + add + h.slice(i) : h + add;
    return h.replace('of ' + Math.round(p.pot[k]) + ' potential', `of ${L('potential', k, Math.round(p.pot[k]) + ' potential')}`);
  };
  G.potential = function (k) {
    const p = pc(); if (!p) return '';
    const v = A.stat(p, k), pot = r0(p.pot[k]);
    return H('Potential', pot, esc(SN(k))) + D('The height your body was born able to reach. Training below it is quick; past it, each point comes slowly.') +
      R('Now', A.stat(p, k)) + R('Room left', Math.max(0, pot - v)) + F(`Aptitudes and potential are set at birth. Age wears ${statL(k)} down later, whatever the potential.`);
  };

  // ---- fighting worth: body + skill + gear, each of which opens again ------------------------------------------------
  const crOf = f => A.CR(Object.assign({ fat: 0, burst: 0, fury: 0, hp: 100, maxHp: 100, adapt: 0, mounted: false }, f), { round: 5 });
  const without = (p, o) => Object.assign({}, p, o);
  const rawOf = p => without(p, { gear: {}, skills: {}, styles: {}, flags: Object.assign({}, p.flags, { chain: null }) });
  TT.bodyParts = function (p) {
    const W = A.worthParts(p), f = A.fighterFrom(rawOf(p), {}), base = crOf(f), parts = [];
    for (const k of ['str', 'spd', 'ins', 'wil']) parts.push([statL(k), base - crOf(Object.assign({}, f, { [k]: 0 }))]);
    parts.push([statL('sta'), 0, 'keep']);
    const hands = (f.wdmg || 0) * 0.9 + (f.wspd || 0) * 1.6;
    if (hands) parts.push(['Bare hands', hands]);
    // what is left of the rating: your people's frame and blood (a burst, a hide), once the stats and fists are out
    const frame = base + (f.wdmg || 0) * 0.9 + (f.prot || 0) * 1.1 + (f.shield || 0) * 1.4 - parts.reduce((a, x) => a + x[1], 0);
    if (Math.abs(frame) >= 0.5) parts.push([`Frame: ${L('race', p.race, esc((GD.RACES[p.race] || {}).name || p.race))}, blood`, frame]);
    return { parts, total: W.body };
  };
  TT.skillParts = function (p) {
    const W = A.worthParts(p), fr = A.fighterFrom(rawOf(p), {}), fb = A.fighterFrom(without(p, { gear: {} }), {});
    const ws = (fb.skill - fr.skill) * 0.42;
    return { parts: [[esc(GD.SKILLS[W.skillK] || W.skillK) + ' (and 30% of melee)', ws], ['Perks, techniques and style', W.skill - r0(ws)]], total: W.skill };
  };
  TT.gearParts = function (p) {
    const g = p.gear || {}, parts = [], cur = {};
    let prev = A.fightWorth(without(p, { gear: {} }));
    for (const sl of ['weapon', 'armor', 'shield', 'helm']) {
      if (!g[sl]) continue;
      cur[sl] = g[sl];
      const w = A.fightWorth(without(p, { gear: Object.assign({}, cur) }));
      parts.push([`${esc(A.cap(sl))}: ${esc((GD.GEAR[g[sl]] || {}).name || g[sl])}`, w - prev]);
      prev = w;
    }
    const total = A.fightWorth(p) - A.fightWorth(without(p, { gear: {} }));
    const rest = A.fightWorth(p) - prev;
    if (rest) parts.push(['Mount, cloak and the rest', rest]);
    return { parts, total };
  };
  G.worth = function (pid) {
    const p = person(pid), W = p && A.worthParts(p); if (!W) return '';
    const t = A.tierOf(W.total), i = GD.TIERS.indexOf(t), nx = GD.TIERS[i + 1];
    return H('Fighting worth', W.total, '· ' + L('tier', t.k, esc(t.n))) +
      TT.sumRows([[L('worthBody', p.id, 'Body'), W.body], [L('worthSkill', p.id, 'Skill'), W.skill], [L('worthGear', p.id, 'Gear'), W.gear]], W.total, 'Fighting worth') +
      (nx ? D(`${L('tier', nx.k, esc(nx.n))} from ${nx.min}: ${nx.min - W.total} to go.`) : '') +
      F(esc(t.d));
  };
  G.worthBody = function (pid) {
    const p = person(pid); if (!p || !A.worthParts(p)) return '';
    const B = TT.bodyParts(p);
    return H('Body', B.total) + D('Your stats with no training and bare hands. Each is weighed: instincts and speed count most, will least.') +
      TT.sumRows(B.parts, B.total, 'Body') +
      F(`${statL('sta')} adds nothing to a blow; it sets how long you last. Against a crowd you can face about ${esc(A.crowdN(A.bodyCap(p)))} regulars' worth before your wind goes.`);
  };
  G.worthSkill = function (pid) {
    const p = person(pid), W = p && A.worthParts(p); if (!W) return '';
    const S = TT.skillParts(p);
    return H('Skill', sg(W.skill)) + D(`What training adds to the body. The weapon in your hand decides which ${L('skill', W.skillK, 'skill')} counts.`) +
      TT.sumRows(S.parts, S.total, 'Skill') +
      R(L('skill', W.skillK, esc(GD.SKILLS[W.skillK] || W.skillK)), A.skill(p, W.skillK), 'tt-sub') + R(L('skill', 'melee', 'Melee'), A.skill(p, 'melee'), 'tt-sub') +
      (W.style ? R(esc(W.style), 'rank ' + W.styleRank, 'tt-sub') : '');
  };
  G.worthGear = function (pid) {
    const p = person(pid), W = p && A.worthParts(p); if (!W) return '';
    const S = TT.gearParts(p);
    return H('Gear', sg(W.gear)) + (S.parts.length ? D('Each piece as it is put on, in this order.') + TT.sumRows(S.parts, S.total, 'Gear') : D('Nothing yet: fists and clothes. The armorer in Holdings sells weapons and armor.')) +
      F(`Better quality adds more. Heavy armor tires a body with ${statL('sta')} under 50.`);
  };
  G.tier = function (k) {
    const t = GD.TIERS.find(x => x.k === k); if (!t) return '';
    const i = GD.TIERS.indexOf(t), nx = GD.TIERS[i + 1], p = pc(), w = p ? A.fightWorth(p) : null;
    return H(esc(t.n), null, `worth ${t.min}${nx ? '–' + (nx.min - 1) : '+'}`) + D(esc(t.d)) +
      GD.TIERS.map(x => R(x.k === t.k ? `<span class="tt-on-row">${esc(x.n)}</span>` : esc(x.n), x.min + '+', 'tt-sub')).join('') +
      (w != null ? F(`You: ${L('worth', p.id, 'fighting worth ' + w)}, ${esc(A.tierOf(w).n)}.`) : '');
  };

  // ---- the body and the life ----------------------------------------------------------------------------------------
  TT.illParts = function (p) {
    const parts = [['Every year', 0.07]];
    if (p.status === 'artisan' || p.status === 'slave') parts.push(['Crowded work (' + esc(p.status) + ')', 0.04]);
    if (p.mil && A.atWar(p.mil.realm).length) parts.push(['A camp at war', 0.06]);
    let dz = parts.reduce((a, x) => a + x[1], 0);
    const mul = [];
    if (A.has(p, 'robust')) mul.push([traitL('robust'), 0.6]);
    if (A.has(p, 'sickly')) mul.push([traitL('sickly'), 1.7]);
    const B = A.bloodDef(p);
    if (B && B.diseaseRes && p.blood && p.blood.show) mul.push(['Blood', 1 - B.diseaseRes]);
    if (p.race === 'elf') mul.push([L('race', 'elf', 'Elf'), 0.25]);
    if (p.race === 'dwarf') mul.push([L('race', 'dwarf', 'Dwarf'), 0.6]);
    for (const m of mul) dz *= m[1];
    return { parts, mul, chance: dz };
  };
  G.health = function () {
    const p = pc(); if (!p) return '';
    const R2 = GD.RACES[p.race], age = A.age(p), mh = A.maxHealth(p), ls = A.LIFESTYLE[p.lifestyle || A.lifestyleDefault(p)];
    const cap = [['Full health', 100]]; if (mh < 100) cap.push([L('age', p.id, 'Old age') + ` (past ${R2.old})`, mh - 100]);
    const mend = [['Each year', 30], [statL('sta') + ' ⅕', A.stat(p, 'sta') / 5]];
    const perk = A.perkSum ? A.perkSum(p, 'heal') : 0; if (perk) mend.push(['Perks', perk]);
    if (A.isAdult(p) && ls.health) mend.push([L('lifestyle', '', esc(ls.name) + ' living'), ls.health]);
    const I = TT.illParts(p);
    return H('Health', r0(p.health), 'of ' + mh) +
      D('Wounds, illness and age take it; each new year gives some back. At 0 you die.') +
      TT.sumRows(cap, mh, 'Most you can have') +
      `<div class="tip-row tt-sum"><span>Mends each new year</span><b></b></div>` + TT.sumRows(mend, TT.sumOf(mend), 'Mended') +
      R('Chance of falling ill this year', pct(I.chance), 'tt-sum') + I.parts.map(x => R(x[0], pct(x[1]), 'tt-sub')).join('') + I.mul.map(x => R(x[0], '×' + x[1], 'tt-sub')).join('') +
      ((p.wounds || []).length ? D('Marks: ' + p.wounds.map(w => esc((GD.WOUNDS[w.k] || {}).name || w.k) + (w.until ? ' (heals ~' + esc(w.until) + ')' : '')).join(', ') + '.') : '') +
      (p.lastHurt ? F('Last hurt by ' + esc(p.lastHurt) + '.') : '');
  };
  G.happy = function () {
    const p = pc(); if (!p) return '';
    const ls = A.LIFESTYLE[p.lifestyle || A.lifestyleDefault(p)], v = p.happy || 0, rows = [];
    rows.push(['Drifts toward 55 (15% of the gap)', (55 - v) * 0.15]);
    if (A.isAdult(p) && ls.happy) rows.push([L('lifestyle', '', esc(ls.name) + ' living') + ' (half)', ls.happy * 0.5]);
    if ((p.debt || 0) > 50) rows.push(['Debt over 50 suns', -5]);
    let mood = '';
    const M = A.MOODS;
    if (M && A.age(p) >= 6) {
      const n = M.needs(p), avg = M.NEEDS.reduce((a, k) => a + n[k], 0) / 4, m = M.mood(p);
      mood = R(`${L('needs', '', 'Your needs')} (average ${r0(avg)}), each month`, sg(r1((avg - 50) / 25))) +
        (m ? D(`${L('mood', m.k, esc(m.name))}: ${esc(m.why)}.`) : '');
    }
    return H('Happiness', r0(v), 'of 100') + D('How your life sits with you. Events move it most.') +
      `<div class="tip-row tt-sum"><span>Next new year, before luck (±4)</span><b>${sg(r0(rows.reduce((a, x) => a + x[1], 0)))}</b></div>` +
      rows.map(x => R(x[0], sg(r1(x[1])), 'tt-sub')).join('') + mood +
      F('An illness costs 6 more. A choice in a scene can cost or give 10.');
  };
  G.charm = function () {
    const p = pc(); if (!p) return '';
    const parts = [[statL('int') + ' ×0.3', A.stat(p, 'int') * 0.3], [L('looks', '', 'Looks') + ' ×0.35', p.looks * 0.35], [L('skill', 'diplomacy', esc(GD.SKILLS.diplomacy || 'Diplomacy')) + ' ×0.4', A.skill(p, 'diplomacy') * 0.4]];
    if (A.has(p, 'gregarious')) parts.push([traitL('gregarious'), 8]);
    if (A.has(p, 'shy')) parts.push([traitL('shy'), -6]);
    if (A.has(p, 'stutter')) parts.push([traitL('stutter'), -5]);
    const v = A.charm ? A.charm(p) : TT.sumOf(parts);
    return H('Charm', r0(v)) + D('How well you win people over: friends, a match, a patron.') + TT.sumRows(parts, v, 'Charm');
  };
  G.looks = function () {
    const p = pc(); if (!p) return '';
    const R2 = GD.RACES[p.race];
    return H('Looks', r0(p.looks), 'of 100') + D('Set at birth. They shift in the teens, then hold.') +
      R('Fades after', (R2.primeEnd || R2.old) + ' (about a point every three years)', 'tt-sub') +
      FEEDS([`${L('charm', '', 'charm')} ×0.35`, 'courting', 'a match']);
  };
  G.fame = function () {
    const p = pc(); if (!p) return '';
    const f = p.fame || 0, keep = Math.max(0.08, 1 - f / 105);
    return H('Renown', r0(f), 'of 100') + D('How far your name has travelled. Deeds, offices and victories raise it; scandal and defeat lower it.') +
      R('A deed worth 10 now gives', r1(10 * keep)) + D(`The higher you stand, the less each deed adds: at ${r0(f)}, ${pct(keep)} of it.`) +
      FEEDS([`your ${L('score', '', 'score')} ×10`, 'votes for an office ×0.3', 'a plot for the throne ×0.4', 'a master taking you on ×0.2', `as a ruler, ${L('realmLegit', p.ruler || p.realm, 'legitimacy')}`]);
  };
  G.score = function () {
    const p = pc(); if (!p || !A.score) return '';
    return H('Score', r0(A.score(p))) + D('How the chronicle weighs a life at its end: renown ×10, wealth, rank, battles, kills, titles.') +
      R(L('fame', '', 'Renown') + ' ×10', r0(p.fame * 10), 'tt-sub');
  };
  G.honor = function () {
    const p = pc(); if (!p) return '';
    return H('Honor', r0(p.honor), 'of 100') + D('What people believe of your word. Keeping it raises honor; lies, theft and broken oaths lower it.') +
      FEEDS(['entry to the knightly orders (each names a minimum)', 'how lords and comrades judge you']);
  };
  G.piety = function () {
    const p = pc(); if (!p) return '';
    const fa = A.faith(p.faith);
    return H('Piety', r0(p.piety), 'of 100') + D(`Standing with ${fa ? L('faith', p.faith, esc(fa.name)) : 'the gods'}. Prayer, pilgrimage and gifts to the temple raise it.`) +
      FEEDS(['a post in the clergy: +20% to the odds above 50', 'a holy war: needs 50', 'what the priests will forgive']);
  };
  G.faith = function (id) {
    const fa = A.faith(id || (pc() || {}).faith); if (!fa) return '';
    return H(esc(fa.name)) + (fa.belief ? D(esc(fa.belief)) : '') + (pc() ? R(L('piety', '', 'Your piety'), r0(pc().piety)) : '');
  };
  G.race = function (k) {
    const R2 = GD.RACES[k || (pc() || {}).race]; if (!R2) return '';
    return H(esc(R2.name)) + R('Adult at', R2.adult) + R('Old from', R2.old) + R('Lives at most', R2.maxLife) + (R2.primeEnd ? R('Looks fade after', R2.primeEnd) : '') +
      F(`Each people ages on its own clock; see ${L('stage', k || pc().race, 'stages of life')}.`);
  };
  G.stage = function (k) {
    const R2 = GD.RACES[k || (pc() || {}).race]; if (!R2) return '';
    const cur = pc() && pc().race === (k || pc().race) ? A.stage(pc()) : null, mark = (s, t) => s === cur ? `<span class="tt-on-row">${t}</span>` : t;
    const free = { infant: 0, child: 4, teen: 6, adult: 7, old: 6 };
    return H('Stages of life', null, esc(R2.name)) +
      R(mark('infant', 'Infant'), 'to ' + r0(Math.max(1, R2.adult * 0.2))) + R(mark('child', 'Child'), 'to ' + r0(R2.adult * 0.8)) + R(mark('teen', 'Youth'), 'to ' + R2.adult) +
      R(mark('adult', 'Adult'), 'to ' + R2.old) + R(mark('old', 'Old'), R2.old + '+') +
      F(`${L('initiative', '', 'Free days')} a week by stage: child ${free.child}, youth ${free.teen}, adult ${free.adult}, old ${free.old}.`);
  };
  G.age = function (pid) {
    const p = person(pid); if (!p) return '';
    const R2 = GD.RACES[p.race], a = A.age(p), st = A.stage(p), name = { infant: 'Infant', child: 'Child', teen: 'Youth', adult: 'Adult', old: 'Old' }[st] || st;
    return H('Age', a, '· ' + L('stage', p.race, esc(name))) + R('Born', p.born + ' AR') +
      (st !== 'old' ? R('Old from', R2.old + ` (in ${Math.max(0, R2.old - a)} years)`) : R(L('health', '', 'Health') + ' capped at', A.maxHealth(p))) +
      R('Lives at most', R2.maxLife) +
      F(`A ${L('race', p.race, esc(R2.name))} body turns at its own ages; each stat has its own curve.`);
  };
  G.date = function () {
    const p = pc(); if (!p) return '';
    return H(esc(A.dateStr())) + R('Year', A.S.year + ' AR') + R(L('age', p.id, 'Your age'), A.age(p)) + F('A new year brings healing, growth, wages and the bills.');
  };

  // ---- time and money ------------------------------------------------------------------------------------------------
  G.initiative = function () {
    const p = pc(); if (!p) return '';
    const st = A.stage(p), cap = A.initiativeCap(p), rate = A.initiativeRate(p), t = A.S.time || 0;
    const parts = [[L('stage', p.race, 'Your stage of life') + ` (${esc(st)})`, { infant: 0, child: 4, teen: 6, adult: 7, old: 6 }[st] || 0]];
    if (A.age(p) < 3) parts[0][1] = 0;
    const B = A.bloodDef(p);
    if (B && B.extraTime && p.blood.show) parts.push(['Blood', B.extraTime]);
    if (p.mil && A.atWar(p.mil.realm).length) parts.push(['At war', -1]);
    const free = A.freeTime(p);
    return H('Initiative', r1(t), 'of ' + cap) + D('Free days to spend on actions. It refills as time passes and stops when full.') +
      (p.prison ? R('In prison: free days', 2, 'tt-sum') : TT.sumRows(parts, free, 'Free days a week')) +
      R('Refills each month', r1(rate * 30)) + (A.initiativeMul && A.initiativeMul(p) !== 1 ? R('Rate ×', r1(A.initiativeMul(p)), 'tt-sub') : '');
  };
  G.lifestyle = function () {
    const p = pc(), cur = p ? p.lifestyle || A.lifestyleDefault(p) : null;
    return H('Living') + D('What you spend on bread, beds and show each year. Set it in Holdings.') +
      Object.entries(A.LIFESTYLE).map(([k, l]) => R(k === cur ? `<span class="tt-on-row">${esc(l.name)}</span>` : esc(l.name), `${A.coin(l.cost)} · happy ${sg(l.happy)} · health ${sg(l.health)}`, 'tt-sub')).join('') +
      F('Deep in debt, you are forced one step down.');
  };
  G.coin = function () {
    const p = pc(); if (!p) return '';
    const key = p.lifestyle || A.lifestyleDefault(p), ls = A.LIFESTYLE[key], kids = (p.children || []).map(A.P).filter(k => k && k.alive && !A.isAdult(k)).length;
    let cost = ls.cost; const parts = [[L('lifestyle', '', esc(ls.name) + ' living'), ls.cost]];
    if (p.flags && p.flags.unfree) { parts.push(['Not free: your keep is found', -cost]); cost = 0; }
    else {
      if (p.prison) { parts.push(['In prison (a tenth)', -cost * 0.9]); cost *= 0.1; }
      if (p.mil) { parts.push(['In the army (half)', -cost * 0.5]); cost *= 0.5; }
    }
    if (kids) parts.push([`${kids} child${kids > 1 ? 'ren' : ''} at home`, kids * ls.cost * 0.15]);
    const out = TT.sumOf(parts);
    return H('Coin', esc(A.coin(p.coin))) + (p.debt ? R('<span class="bad">Debt</span>', esc(A.coin(p.debt))) : '') +
      (p.job && p.job.lastPay ? R('Last wage', esc(A.coin(p.job.lastPay))) : '') +
      `<div class="tip-row tt-sum"><span>Each new year you spend</span><b></b></div>` + TT.sumRows(parts, out, 'Spent a year') +
      D('Parents may carry part of a young person\'s keep. Wages, an allowance from your house and a ruler\'s stipend come in at the same time.') +
      (p.debt ? F('Debt over 50 suns costs 5 happiness a year, and moneylenders talk.') : '');
  };

  // ---- skills, traits, keywords --------------------------------------------------------------------------------------
  G.skill = function (k) {
    const p = pc(); if (!p || !GD.SKILLS[k]) return '';
    const v = A.skill(p, k), raw = r0((p.skills || {})[k] || 0), apt = p.apt && p.apt[k], tierW = GD.profTier(v);
    const parts = [['Practised', raw]];
    for (const w of p.wounds || []) { const W = GD.WOUNDS[w.k]; if (W && W.skillPen && W.skillPen[k]) parts.push([esc(W.name || w.k), W.skillPen[k]]); }
    const perks = (GD.PERKS && GD.PERKS[k]) || [], next = perks.find(x => x[0] > v);
    return H(esc(GD.SKILLS[k]), v, '· ' + L('profTier', tierW, esc(tierW))) + (GD.SKILL_DESC && GD.SKILL_DESC[k] ? D(esc(GD.SKILL_DESC[k])) : '') +
      (parts.length > 1 || v !== raw ? TT.sumRows(parts, v, GD.SKILLS[k]) : '') +
      (apt && apt !== 1 ? R('Aptitude', '×' + r1(apt) + ' to learning', 'tt-sub') : '') +
      perks.filter(x => x[0] <= v).map(x => R('✦ ' + esc(x[1]), 'at ' + x[0], 'tt-sub')).join('') +
      (next ? F(`Next: ${esc(next[1])} at ${next[0]} (${next[0] - v} to go). ${esc(next[2] || '')}`) : '');
  };
  G.profTier = function (name) {
    const p = pc();
    return H('Proficiency', null, esc(name)) + D('How a skill is named by its number.') +
      GD.PROF_TIERS.map(([m, n]) => R(n === name ? `<span class="tt-on-row">${esc(n)}</span>` : esc(n), m + '+', 'tt-sub')).join('') +
      (p ? F(`A skill counts for more in a fight than in a trade: see ${L('worthSkill', p.id, 'skill in fighting worth')}.`) : '');
  };
  G.trait = function (t) {
    const T = GD.TRAITS[t]; if (!T) return '';
    const p = pc(), fx = T.fx ? Object.entries(T.fx).filter(([k, v]) => GD.STATS.includes(k) && v) : [];
    const why = p && p.traits.includes(t) && A.BM && A.BM.reasonOf ? A.BM.reasonOf(p, t) : '';
    return H(esc(T.name), null, 'trait') + D(esc(T.desc || '')) + fx.map(([k, v]) => R(statL(k), sg(v))).join('') + (why ? F(esc(why)) : '');
  };
  G.quirk = function (q) {
    const Q = GD.QUIRKS && GD.QUIRKS[q]; if (!Q) return '';
    return H(esc(Q.name), null, 'quirk') + D(esc(Q.desc || ''));
  };
  G.blood = function () {
    const p = pc(); if (!p || !p.blood) return '';
    const BL = LORE.bloodlines && LORE.bloodlines[p.blood.id], bd = A.bloodDef(p);
    return H(esc(BL ? BL.name : bd ? bd.short : 'Bloodline'), null, p.blood.show || (bd && bd.mode === 'x') ? 'shown' : 'carried') +
      (BL ? D(esc(BL.trait)) + `<div class="tip-d bad">Price: ${esc(BL.cost)}</div>` : '') + (p.blood.copies === 2 ? F('Two copies: your children all carry it.') : '');
  };
  G.house = function (id) {
    const h = A.house(id); if (!h) return '';
    return H(esc(h.name)) + (h.notes ? D(esc(h.notes)) : '') + (h.wealth != null ? R('Wealth', h.wealth) : '') + F('Click the chip for the house itself.');
  };
  G.rep = function () {
    const p = pc(); if (!p || !p.job) return '';
    const v = p.job.rep != null ? p.job.rep : 20 + (p.house ? 6 : 0), word = A.repWord(v);
    return H('Reputation', r0(v), '· ' + esc(word)) + D('What your trade thinks of your work. Good work and a name raise it; failures lower it.') +
      [[85, 'Legendary'], [70, 'Renowned'], [55, 'Respected'], [40, 'Known'], [25, 'Unremarkable'], [0, 'Doubted']].map(([m, n]) => R(n === word ? `<span class="tt-on-row">${n}</span>` : n, m + '+', 'tt-sub')).join('') +
      F('An office in a guild or the council needs 65.');
  };

  // ---- people ---------------------------------------------------------------------------------------------------------
  const opWord = v => v >= 70 ? 'devoted' : v >= 40 ? 'warm' : v >= 10 ? 'friendly' : v > -10 ? 'indifferent' : v > -40 ? 'cool' : v > -70 ? 'hostile' : 'hateful';
  G.opinion = function (pid) {
    const p = pc(), o = A.P(pid); if (!p || !o) return '';
    const mine = (p.rel || {})[o.id], theirs = (o.rel || {})[p.id];
    const rows = [];
    if (mine) rows.push(R('Yours of them', `${sg(r0(mine.op || 0))} · ${opWord(mine.op || 0)}`));
    if (theirs) rows.push(R('Theirs of you', `${sg(r0(theirs.op || 0))} · ${opWord(theirs.op || 0)}`));
    return H('Opinion', null, esc(A.fullName(o))) + rows.join('') +
      (mine ? D(`${esc(A.relLabel ? A.relLabel(o, mine) : mine.type)}${mine.since ? ', since ' + esc(mine.since) : ''}.`) : '') +
      F('From −100 to 100. Time together, gifts and favors raise it; slights, rivalry and betrayal lower it. The game keeps the number, not a list of reasons.');
  };

  // ---- the realm ------------------------------------------------------------------------------------------------------
  const realmOf = id => A.realm(id) || (pc() && A.realm(pc().ruler || pc().realm));
  const council = (r, k, p) => { const c = r.council && A.P(r.council[k]); return c && c.alive ? A.skill(c, A.COUNCIL[k].skill) : k === 'marshal' && p ? A.skill(p, 'command') * 0.5 : 10; };
  TT.stabParts = function (r) {
    const p = pc(), mine = p && p.ruler === r.id && r.playerRun, parts = [];
    if (mine) {
      const T = A.TAX[r.laws && r.laws.tax || 1] || ['', 0];
      parts.push([`Taxes: ${esc(T[0] || 'customary')}`, T[1]]);
      parts.push(['Chaplain', (council(r, 'chaplain', p) - 30) / 25]);
      if (r.exhaustion) parts.push([L('realmWeary', r.id, 'War weariness'), -r.exhaustion / 20]);
      if (r.debt > r.income * 2) parts.push(['Debt over two years\' income', -4]);
      parts.push([L('realmLegit', r.id, 'Legitimacy'), (r.legit - 50) / 25]);
      if (A.atWar(r.id).length) parts.push(['At war', -2]);
    } else {
      const Lr = LORE.realms && LORE.realms[r.id], tgt = (A.STAB[Lr ? Lr.stability : 'steady'] || 55);
      parts.push([`Settles toward ${tgt} (a ${esc(Lr ? Lr.stability : 'steady')} realm), 15% of the gap`, (tgt - r.stability) * 0.15]);
      if (r.exhaustion) parts.push([L('realmWeary', r.id, 'War weariness') + ' ¼', -r.exhaustion * 0.25 * 0.15]);
      if (r.debt > r.income) parts.push(['Debt over a year\'s income', -8 * 0.15]);
    }
    const law = r.ind && GD.ECON && GD.ECON[r.ind.law];
    if (law && law.stab) parts.push([esc(law.name), law.stab]);
    return parts;
  };
  G.realmStab = function (id) {
    const r = realmOf(id); if (!r) return '';
    const parts = TT.stabParts(r), sum = parts.reduce((a, x) => a + x[1], 0);
    return H('Stability', r0(r.stability), esc(r.short)) + D('Order in the land: low stability brings revolts and pretenders, and below 18 a rising becomes likely.') +
      `<div class="tip-row tt-sum"><span>Next year, before luck (±3)</span><b>${sg(r1(sum))}</b></div>` + parts.map(x => R(x[0], sg(r1(x[1])), 'tt-sub')).join('') +
      (r.playerRun ? F('As ruler, stability also sets your income: ×' + r1(0.6 + r.stability / 250) + '.') : '');
  };
  G.realmLegit = function (id) {
    const r = realmOf(id); if (!r) return '';
    const p = pc(), mine = p && p.ruler === r.id;
    return H('Legitimacy', r0(r.legit), esc(r.short)) + D('How rightful the ruler seems: a clean succession and a famous name hold it up; usurpers start low.') +
      (mine ? R('Each year', sg(r1(2 + (p.fame - 40) / 30))) + R('Of which your ' + L('fame', '', 'renown'), sg(r1((p.fame - 40) / 30)), 'tt-sub') : '') +
      FEEDS([`${L('realmStab', r.id, 'stability')}: (legitimacy − 50) ÷ 25 a year`]);
  };
  G.realmWeary = function (id) {
    const r = realmOf(id); if (!r) return '';
    return H('War weariness', r0(r.exhaustion), esc(r.short)) + D('Dead sons and burned fields. It rises in war and falls by 10 to 12 a year of peace.') +
      FEEDS([`${L('realmStab', r.id, 'stability')}`, 'how soon a realm sues for peace']);
  };
  G.infamy = function (id) {
    const r = realmOf(id); if (!r) return '';
    return H('Infamy', r0(r.infamy || 0), esc(r.short)) + D('It rises when a realm takes land without a claim. At 40 neighbors start a coalition; above 60 they march together.');
  };
  G.realmGold = function (id) {
    const r = realmOf(id); if (!r) return '';
    const p = pc(), mine = p && p.ruler === r.id && r.playerRun, parts = [];
    if (mine) {
      const inc = r.income * (0.6 + r.stability / 250) * (1 + council(r, 'treasurer', p) / 400);
      parts.push([`Income at ${L('realmStab', r.id, 'stability')} ${r0(r.stability)}, with the treasurer`, inc]);
      parts.push(['Army and levy upkeep', -(r.army * 3.2 + r.levy * 0.05)]);
      if (r.debt) parts.push(['Interest (9%)', -r.debt * 0.09]);
      parts.push([`Court (${L('lifestyle', '', 'living')} ×2)`, -A.LIFESTYLE[p.lifestyle || 'lavish'].cost * 2]);
      const bld = Object.values(r.bldUpkeep || {}).reduce((a, b) => a + b, 0); if (bld) parts.push(['Buildings', -bld]);
    } else {
      parts.push(['Income less waste', r.income * 0.92]);
      parts.push(['Army and levy upkeep', -(r.army * 3.2 + r.levy * 0.05)]);
      if (r.debt) parts.push(['Interest (8%)', -r.debt * 0.08]);
    }
    const net = parts.reduce((a, x) => a + Math.round(x[1]), 0);
    return H('Treasury', esc(A.fmt(r.treasury)), 'suns') + (r.debt ? R('<span class="bad">Debt</span>', esc(A.fmt(r.debt))) : '') +
      `<div class="tip-row tt-sum"><span>A year at this pace</span><b></b></div>` +
      parts.map(x => R(x[0], (x[1] < 0 ? '−' : '+') + esc(A.fmt(Math.abs(Math.round(x[1])))), 'tt-sub')).join('') + R('Net', (net < 0 ? '−' : '+') + esc(A.fmt(Math.abs(net))), 'tt-sum') +
      F('An empty treasury costs 6 stability and forces a loan.');
  };

  // ---- needs and moods (35-moods), when that feature is in the build -------------------------------------------------
  const NEED_NAME = { rest: 'Rest', company: 'Company', purpose: 'Purpose', comfort: 'Comfort' };
  TT.needParts = function (p, k) {
    const M = A.MOODS, young = A.age(p) < 16, parts = [];
    if (k === 'rest') {
      const P = A.plan ? A.plan(p) : null, I = (P && P.intensity) || 'steady', d = { rest: 15, light: 8, steady: 0, hard: -25, brutal: -45 }[I] || 0;
      parts.push(['Sleep and Sundays', 70]); if (d) parts.push([`A ${esc(I)} plan`, d]);
      if (p.mil && A.atWar && A.atWar(p.mil.realm).length) parts.push(['At war', -20]);
      if (p.health < 40) parts.push([L('health', '', 'Poor health'), -15]);
    } else if (k === 'company') {
      const rels = A.relsOf ? A.relsOf(p, null).filter(x => x.p.alive && (x.r.op || 0) >= 30).length : 0;
      const sp = p.spouse && A.P(p.spouse), love = sp && sp.alive && ((sp.rel || {})[p.id] || {}).op >= 30;
      const kids = (p.children || []).filter(c => A.P(c) && A.P(c).alive).length;
      parts.push(['Alone', 25]); if (rels) parts.push([`${Math.min(4, rels)} friend${rels > 1 ? 's' : ''} (up to 4)`, Math.min(4, rels) * 9]);
      if (love) parts.push(['A spouse who loves you', 15]); if (kids) parts.push([`Children (up to 2)`, Math.min(2, kids) * 4]); if (young) parts.push(['A child\'s household', 25]);
    } else if (k === 'purpose') {
      parts.push(['Being alive', 35]); if (p.job) parts.push([`Work and its rank`, 10 + 3 * (p.job.r || 0)]); if (p.mil) parts.push(['Army rank', 10 + 2 * p.mil.rank]);
      if (p.ruler) parts.push(['A crown', 25]); if (p.office) parts.push(['An office', 15]); if (young) parts.push(['Growing up', 30]);
    } else return null;
    return parts;
  };
  G.need = function (k) {
    const p = pc(), M = A.MOODS; if (!p || !M || !M.NEEDS.includes(k)) return '';
    const n = M.needs(p)[k], T = M.targets(p)[k], parts = TT.needParts(p, k);
    return H(NEED_NAME[k], r0(n), 'of 100') + D('Each month a need moves a quarter of the way toward where your life puts it; what you do pushes it up or down.') +
      (parts ? TT.sumRows(parts, T, 'Settles at') : R('Settles at', r0(T), 'tt-sum') + D(`Your ${L('coin', '', 'coin')} against what feels like enough at your rank, plus your ${L('health', '', 'health')}, your freedom, and prison.`)) +
      (n < M.LOW ? F(`Below ${M.LOW} it sets a ${L('mood', k, 'mood')}.`) : '');
  };
  G.needs = function () {
    const p = pc(), M = A.MOODS; if (!p || !M) return '';
    const n = M.needs(p);
    return H('Needs') + M.NEEDS.map(k => R(L('need', k, NEED_NAME[k]), r0(n[k]))).join('') + F(`Their average moves ${L('happy', '', 'happiness')} every month.`);
  };
  G.mood = function (k) {
    const M = A.MOODS; if (!M) return '';
    const m = k === 'content' ? { name: 'Content', why: 'your days are full and your nights are quiet' } : M.MOOD[k]; if (!m) return '';
    return H(esc(m.name), null, 'mood') + D(esc(A.cap ? A.cap(m.why) : m.why) + '.') +
      (k === 'content' ? F('Every need at 65 or more.') : F(`Your lowest need, ${L('need', k, NEED_NAME[k])}, is below ${M.LOW}.`));
  };
})();
