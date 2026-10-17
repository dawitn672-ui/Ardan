// Nested tooltips: the odds. A choice's "38% · risky" opens what makes it: the check's skill or stat against its
// difficulty, the scene's own weight (30-get-to-know), what you remember (67-memory-weave), the bounds; a fight's
// measured chance (48-fight-ladder) opens the worths, the rules, the health on both sides. On Realism (42-difficulty)
// no digit is shown, so the popover names what helps and what hurts in words. The duel screen's chance, your
// instincts' read and both fighters; the battle screen's sides, wings, dead and after-action causes; the drill.
//
// A sum in percentage points: the rows add up to the number on the button. A chance that is a curve (a fight) is
// split into steps: even odds, then the worths, then each thing after, each row what it moved the chance; the steps
// add up to the number shown.
(function () {
  const G = UI.TIPS = UI.TIPS || {}, TT = UI.TT, K = TT.K;
  const { esc, r0, r1, sg, pct, H, R, D, F, L } = K;
  const pc = () => A.pc();
  TT.cur = TT.cur || {};   // what the open screen is drawing (set by the wrappers in tt.wire2.core.js): UI state only
  const digits = () => (A.DIFF && A.DIFF.showOdds ? A.DIFF.showOdds() : !!(UI.set && UI.set.odds !== false));
  const logistic = z => 1 / (1 + Math.exp(-z));
  const word = v => v >= 15 ? 'helps a great deal' : v >= 4 ? 'helps' : v > -4 ? 'about even' : v > -15 ? 'hurts' : 'hurts a great deal';
  const dWord = d => d <= 30 ? 'an easy test' : d <= 40 ? 'a fair test' : d <= 50 ? 'a typical test' : d <= 60 ? 'a hard test' : d <= 70 ? 'a very hard test' : 'a test few pass';
  const skillName = k => GD.STATS.includes(k) ? esc((GD.STAT_NAMES || {})[k] || k) : esc(GD.SKILLS[k] || k);
  const skillLink = (k, label) => GD.STATS.includes(k) ? L('stat', k, label) : GD.SKILLS[k] ? L('skill', k, label) : label;

  // the rows of a sum in points, or (on Realism) the same rows in words
  const show = (title, sub, parts, total, foot) => {
    if (!digits()) return H(title, null, sub) + parts.filter(x => x[1] != null && Math.abs(x[1]) >= 0.5 && x[2] !== 'base').map(([l, v]) => R(l, word(v))).join('') +
      F('On Realism the odds are not shown in numbers. ' + (foot || ''));
    return H(title, total + '%', sub) + K.pts(parts, total, 'The odds') + (foot ? F(foot) : '');
  };

  // what 67-memory-weave adds to a choice's odds when the scene remembers an earlier one (its own number, read back)
  TT.memOf = function (ctx, evId, ck) {
    const w = ctx && ctx.mw, e = evId && A.EV[evId];
    if (!w || w.off || !w.od || w.ev !== evId || !e || !e.choices) return 0;
    const i = e.choices.findIndex(c => c && c.check === ck);
    return i >= 0 ? +w.od[i] || 0 : 0;
  };
  // ---- a check: 50 + (your skill − the difficulty) × 1.6, between 4 and 96 ------------------------------------------
  TT.checkValue = function (p, k) {
    if (GD.STATS.includes(k)) return { v: A.stat(p, k), how: '' };
    const st = A.stats(p), avg = (st.str + st.spd + st.ins + st.sta + st.int + st.wil) / 6, eff = A.skillEff(p, k), floor = 4 + avg * 0.3;
    let how = '';
    const raw = A.skill(p, k), syn = (GD.SKILL_SYN[k] || []).map(([j, m]) => [j, A.skill(p, j) * m]).filter(x => x[1] > raw).sort((a, b) => b[1] - a[1])[0];
    if (floor > eff) how = 'untrained: your stats lend 4 + 30% of their average';
    else if (syn && Math.round(syn[1]) >= eff - 1) how = `from ${esc(GD.SKILLS[syn[0]] || syn[0])}`;
    else if (eff !== raw) how = 'with perks';
    return { v: Math.max(eff, floor), how };
  };
  TT.checkParts = function (p, ck, ctx, shown, evId) {
    const d0 = ck.d || 45, add = ck.dctx ? +((ctx || {})[ck.dctx]) || 0 : 0;
    const a = TT.checkValue(p, ck.s), b = ck.s2 ? TT.checkValue(p, ck.s2) : null, bonus = ck.bonus ? +ck.bonus(p) || 0 : 0;
    const w1 = b ? 0.6 : 1, parts = [['An even test', 50, 'base']];
    parts.push([`${skillLink(ck.s, skillName(ck.s) + ' ' + r0(a.v))}${a.how ? ' (' + a.how + ')' : ''} against ${d0}${b ? ', 60% of it' : ''}`, (a.v - d0) * w1 * 1.6]);
    if (b) parts.push([`${skillLink(ck.s2, skillName(ck.s2) + ' ' + r0(b.v))}${b.how ? ' (' + b.how + ')' : ''} against ${d0}, 40% of it`, (b.v - d0) * 0.4 * 1.6]);
    if (bonus) parts.push(['Your circumstances', bonus * 1.6]);
    if (add) parts.push([add > 0 ? `The scene makes it harder (+${add})` : `The scene makes it easier (${add})`, -add * 1.6]);
    const raw = 50 + (a.v * w1 + (b ? b.v * 0.4 : 0) + bonus - d0 - add) * 1.6, base = A.clamp(Math.round(raw), 4, 96);
    if (base !== Math.round(raw)) parts.push(['Never below 4% or above 96%', base - raw]);
    const mem = TT.memOf(ctx, evId, ck);
    if (mem && shown != null) { const v = A.clamp(base + mem, 4, 96); parts.push(['What you remember of it before (67-memory-weave)', v - base]); if (shown !== v) parts.push(['Other things in play', shown - v]); }
    else if (shown != null && shown !== base) parts.push(['Other things in play', shown - base]);
    return { parts, total: shown != null ? shown : base, d: d0 + add };
  };

  // ---- a fight (48-fight-ladder): the chance in steps --------------------------------------------------------------------
  const hf = p => A.clamp((p && p.health != null ? p.health : 100) / 100, 0.3, 1);
  const steps = (zs, lo, hi, shown, mem) => {
    // zs: [[label, dz]] added in order to a logit that starts at 0 (even odds); each row is the points it moved
    let z = 0, p0 = 50; const parts = [['Even odds', 50, 'base']];
    for (const [l, dz] of zs) { if (!dz) continue; z += dz; const p1 = logistic(z) * 100; parts.push([l, p1 - p0]); p0 = p1; }
    const cl = A.clamp(p0, lo * 100, hi * 100); if (Math.abs(cl - p0) > 1e-9) { parts.push([`Never below ${r0(lo * 100)}% or above ${r0(hi * 100)}%`, cl - p0]); p0 = cl; }
    if (mem) { const v = A.clamp(Math.round(p0) + mem, 4, 96); parts.push(['What you remember of it before (67-memory-weave)', v - p0]); p0 = v; }
    if (shown != null && Math.round(p0) !== shown) parts.push(['Other things in play', shown - p0]);
    return parts;
  };
  TT.fightParts = function (p, spec, ctx, check, shown, evId) {
    const FL = A.FL, R0 = FL.resolve(p, spec, ctx || {}, check), mem = TT.memOf(ctx, evId, check);
    const tier = w => esc(A.tierOf(w).n), me = L('worth', p.id, `you, ${tier(R0.wMe)} ${R0.wMe}`) + (R0.edge ? ` (${sg(R0.edge)} for ${esc((GD.SKILLS[spec.edge] || spec.edge).toLowerCase())})` : '');
    if (spec.scale === 'one') {
      const rule = spec.rule || 'yield', RL = FL.RULES[rule] || FL.RULES.yield, foe = R0.foe ? A.P(R0.foe) : null;
      const drew = foe && !spec.weapon && FL.draws(foe, rule) ? 1 : 0, w = R0.wMe + R0.edge;
      const them = foe ? `${esc(foe.given)}, ${tier(R0.wThem)} ${R0.wThem}` : `one ${tier(R0.wThem)} ${R0.wThem}`;
      const zs = [[`${me} against ${them}`, (w - R0.wThem) / RL[0]], [`The rules: ${esc({ yield: 'until one yields', lethal: 'to the death', brawl: 'a brawl', spar: 'sparring', tourney: 'a tourney' }[rule] || rule)}`, RL[1]],
        [`${L('health', '', 'Your health')} ${r0(p.health)}${foe ? ' against theirs ' + r0(foe.health) : ''}`, RL[2] * (hf(p) - (foe ? hf(foe) : 1))], ['They draw a weapon as it starts', FL.DREW * drew]];
      return { parts: steps(zs, FL.CLAMP[0], FL.CLAMP[1], shown, mem), total: shown != null ? shown : R0.pct, R: R0 };
    }
    if (spec.scale === 'beast' && !(R0.n > 1) && R0.w50 != null) {
      const row = FL.duelRow(R0.beast), s = R0.party ? row[3] : row[1], nm = esc(A.beastShort ? A.beastShort(R0.beast) : 'the beast');
      const zs = [[`${me} against ${nm}'s mark of ${R0.w50}${R0.party ? ', with the hunters' : ', alone'} (half of those who stand at the mark win)`, (R0.wMe + R0.edge - R0.w50) / s], [`${L('health', '', 'Your health')} ${r0(p.health)}`, FL.BEAST_HEALTH * (hf(p) - 1)]];
      return { parts: steps(zs, FL.CLAMP[0], FL.CLAMP[1], shown, mem), total: shown != null ? shown : R0.pct, R: R0 };
    }
    return { parts: null, total: shown != null ? shown : R0.pct, R: R0 };
  };

  // ---- the entry: the head event's choice vi ----------------------------------------------------------------------------
  TT.choiceOf = function (vi) {
    const q = TT.cur.ev && TT.cur.ev.view ? TT.cur.ev : A.S.queue[0];
    if (!q || q.type !== 'event' || !q.view) return null;
    const vc = q.view.choices[+vi], e = A.EV[q.ev], c = vc && e && e.choices && e.choices[vc.i];
    return c ? { q, vc, c, e } : null;
  };
  G.odds = function (vi) {
    const p = pc(), X = TT.choiceOf(vi); if (!p || !X) return '';
    const { q, vc, c } = X, shown = vc.odds, ck = c.check;
    if (ck && ck.fight && A.FL) {
      const S = TT.fightParts(p, ck.fight, q.ctx, ck, shown, q.ev), R0 = S.R;
      if (S.parts) return show('The odds of the fight', esc(vc.risk || ''), S.parts, S.total, `Measured on many fights between fighters like these; the dice decide this one. See ${L('tier', A.tierOf(R0.wMe).k, 'the tiers')}.`);
      const sides = R0.scale === 'beast' ? `${R0.n} of ${esc(A.beastShort ? A.beastShort(R0.beast) : 'them')}` : `${R0.n} ${esc((GD.CROWD[ck.fight.tier] || GD.CROWD[2]).n)}, ${R0.wThem} each`;
      return H('The odds of the fight', digits() ? S.total + '%' : null, esc(vc.risk || '')) + R(L('worth', p.id, 'You'), digits() ? `${esc(A.tierOf(R0.wMe).n)} ${R0.wMe}` : esc(A.tierOf(R0.wMe).n)) +
        (R0.allies ? R('Beside you', R0.allies) : '') + R('Against', sides) + D('One against many is reckoned side against side: each fighter\'s strength by worth, and how long the wind holds out. It does not split into parts.') +
        F(`See ${L('worthBody', p.id, 'your wind and body')}.`);
    }
    if (ck) {
      const S = TT.checkParts(p, ck, q.ctx, shown, q.ev);
      return show('The odds', esc(vc.risk || ''), S.parts, S.total, `Difficulty ${digits() ? S.d + ', ' : ''}${dWord(S.d)}. Each point of skill above it is worth 1.6%.`);
    }
    if (c.group && A.groupSpecSides) {
      const s = A.groupSpecSides(p, c.group, q.ctx || {}), sum = L0 => (L0 || []).map(x => x.w != null ? `${x.n > 1 ? x.n + ' × ' : ''}${esc(A.tierOf(x.w).n)}${digits() ? ' ' + r0(x.w) : ''}` : '').filter(Boolean).join(', ');
      return H('The odds', digits() ? shown + '%' : null, esc(vc.risk || '')) + R('Your side', sum(s.mine) || 'you') + R('Theirs', sum(s.foes) || '—') +
        D('Side against side: each fighter\'s strength by worth, and how long the wind holds out.') + F(`See ${L('worth', p.id, 'your fighting worth')}.`);
    }
    return '';
  };
  // a cost in a choice's words, against your purse
  G.cost = function (n) {
    const p = pc(); n = +n; if (!p || !(n >= 0)) return '';
    return H('A cost', esc(A.coin(n))) + R(L('coin', '', 'Your coin'), esc(A.coin(p.coin))) + R('After it', p.coin >= n ? esc(A.coin(p.coin - n)) : '<span class="bad">not enough</span>', 'tt-sum');
  };

  // ---- the duel screen --------------------------------------------------------------------------------------------------
  const duel = () => { const q = A.S.queue[0]; return TT.cur.duel || (q && q.type === 'duel' ? q.d : null); };
  TT.duelParts = function (D0) {
    const m = D0 && D0.measure, FL = A.FL; if (!m || !FL) return null;
    const a = D0.a, b = D0.b, hA = a.maxHp ? A.clamp(a.hp / a.maxHp, 0.3, 1) : 1;
    if (b.beast) {
      if (m.w50 == null) return null;
      const row = FL.duelRow(b.beast), s = m.party ? row[3] : row[1];
      return steps([[`You, ${esc(m.tA)} ${m.wA}, against the beast's mark of ${m.w50}`, (m.wA - m.w50) / s], [`Your blood ${r0(a.hp)} of ${r0(a.maxHp)}`, FL.BEAST_HEALTH * (hA - 1)]], FL.CLAMP[0], FL.CLAMP[1], m.pct);
    }
    const hB = b.maxHp ? A.clamp(b.hp / b.maxHp, 0.3, 1) : 1, RL = FL.RULES[m.rule] || FL.RULES.yield;
    return steps([[`You, ${esc(m.tA)} ${m.wA}, against ${esc(b.short || b.name)}, ${esc(m.tB)} ${m.wB}`, (m.wA - m.wB) / RL[0]], [`The rules: ${esc({ yield: 'until one yields', lethal: 'to the death', brawl: 'a brawl', spar: 'sparring', tourney: 'a tourney' }[m.rule] || m.rule)}`, RL[1]],
      [`Blood: yours ${r0(a.hp)} of ${r0(a.maxHp)}, theirs ${r0(b.hp)} of ${r0(b.maxHp)}`, RL[2] * (hA - hB)], ['They draw a weapon as it starts', FL.DREW * (m.drew ? 1 : 0)]], FL.CLAMP[0], FL.CLAMP[1], m.pct);
  };
  G.duelOdds = function () {
    const D0 = duel(), parts = TT.duelParts(D0); if (!parts) return '';
    return show('The measure', 'before the first blow', parts, D0.measure.pct, 'Fighters like you, armed and hurt as you are, over many duels. How you fight moves it.');
  };
  G.duelSide = function (side) {
    const D0 = duel(); if (!D0) return '';
    const f = side === 'b' ? D0.b : D0.a, m = D0.measure || {}, w = side === 'b' ? m.wB : m.wA, p = f.pid ? A.P(f.pid) : null;
    if (f.beast) return H(esc(A.cap(f.short || 'The beast')), null, esc((GD.TIER_INFO[m.btier] || {}).name || '')) + D(esc((GD.TIER_INFO[m.btier] || {}).who || ''));
    return H(esc(f.name || f.short), w != null && digits() ? w : null, w != null ? esc(A.tierOf(w).n) : '') +
      R('Weapon', esc(f.weapon || 'fists')) + R(L('duelBlood', side, 'Blood'), `${r0(f.hp)} of ${r0(f.maxHp)}`, 'tt-sub') + R(L('duelWind', side, 'Wind'), r0(100 - (f.fat || 0)), 'tt-sub') +
      (p && p.id === A.S.pc ? F(`Opens into ${L('worth', p.id, 'body, skill and gear')}.`) : p ? F(`Armed as they are for this fight. ${L('worth', p.id, 'Their worth, as they carry it')}.`) : '');
  };
  G.duelBlood = function (side) {
    const D0 = duel(); if (!D0) return '';
    const f = side === 'b' ? D0.b : D0.a;
    return H('Blood', `${r0(f.hp)} of ${r0(f.maxHp)}`) + (f.beast ? '' : R(`60 + ${L('stat', 'sta', 'stamina')} × 0.45${f.race && f.race !== 'human' ? ', by your people' : ''}`, r0(f.maxHp), 'tt-sub')) +
      D('Each blow that lands takes some. At none, the fight is lost; long before that, a hurt fighter is slower.') +
      F('A duel starts from your health: hurt before it, you start lower.');
  };
  G.duelWind = function (side) {
    const D0 = duel(); if (!D0) return '';
    const f = side === 'b' ? D0.b : D0.a;
    return H('Wind', r0(100 - (f.fat || 0))) + D(`Every exchange costs wind, an all-out press most of all. ${L('stat', 'sta', 'Stamina')} sets how fast it goes; a winded fighter strikes slow and guards late.`);
  };
  G.duelRead = function () {
    const D0 = duel(); if (!D0 || !D0.readHint) return '';
    const a = D0.a, b = D0.b, parts = [['Anyone reads a little', 30], ['What your training reads', (a.read || 0) * 100],
      [`${L('stat', 'ins', 'Instincts')}: yours ${r0(a.ins)}, theirs ${r0(b.ins)} (÷ 0.9)`, (a.ins - b.ins) / 0.9],
      ['The same school of fighting', a.chain && b.chain && a.chain === b.chain ? 25 : 0], ['What you have learned of them in this fight', (a.adapt || 0) / 0.6]];
    const raw = parts.reduce((x, y) => x + y[1], 0), cl = A.clamp(raw, 10, 92);
    if (cl !== raw) parts.push(['Never below 10% or above 92%', cl - raw]);
    const conf = D0.readHint.conf;
    if (Math.round(cl) !== conf) parts.push([conf >= 60 && Math.round(cl) < 60 ? 'You see a practised move coming' : 'Since then', conf - cl]);
    return H('Your instincts', conf + '% sure') + K.pts(parts, conf, 'Sure') + D('How often the read is right. When it is wrong, it names another move.');
  };

  G.duelAdapt = function (side) {
    const D0 = duel(); if (!D0) return '';
    const f = side === 'b' ? D0.b : D0.a;
    return H('Adapting', '+' + r0(f.adapt || 0)) + D(`What ${side === 'b' ? 'they have' : 'you have'} learned of the other in this fight. It sharpens the read of the next move (one point in 60) and grows faster with ${L('stat', 'wil', 'willpower')} against a stronger foe.`);
  };

  // ---- the battle screen ------------------------------------------------------------------------------------------------
  const battle = () => { const q = A.S.queue[0]; return TT.cur.battle || (q && q.type === 'battle' ? q.b : null); };
  const live = s => s.units.filter(u => u.status === 'ok' || u.status === 'shaken');
  const WING = { L: 'Left wing', C: 'Center', R: 'Right wing', X: 'Reserve' };
  G.bSide = function (k) {
    const B = battle(); if (!B || !B.sides[k]) return '';
    const S = B.sides[k], us = live(S), men = us.reduce((a, u) => a + u.men, 0), mine = B.pcSide === k;
    const out = S.units.filter(u => !(u.status === 'ok' || u.status === 'shaken')).reduce((a, u) => a + u.men, 0);
    const parts = Object.keys(WING).map(w => [L('bWing', k + '|' + w, WING[w]), us.filter(u => u.wing === w).reduce((a, u) => a + u.men, 0)]);
    return H(esc(S.name), esc(A.fmt(men)), `of ${esc(A.fmt(S.men0))}${mine ? ' · yours' : ''}`) +
      `<div class="tip-row tt-sum"><span>Still in the line</span><b></b></div>` + TT.sumRows(parts, men, 'Standing') +
      (out ? R('Routed or gone (not counted)', esc(A.fmt(out)), 'tt-sub') : '') +
      (B.dead && B.dead[k] ? R('Dead so far', esc(A.fmt(B.dead[k])), 'tt-sub') : '') +
      R(L('bMorale', k, 'Morale'), r0(A.avgMorale(B, k)), 'tt-sum') + (S.cmdSkill ? R(L('skill', 'command', 'Command') + ' of its general', r0(S.cmdSkill), 'tt-sub') : '');
  };
  G.bMorale = function (k) {
    const B = battle(); if (!B || !B.sides[k]) return '';
    const us = live(B.sides[k]), men = us.reduce((a, u) => a + u.men, 0);
    return H('Morale', r0(A.avgMorale(B, k)), esc(B.sides[k].name)) + D('Each unit\'s morale, weighed by its men. Losses, flanks and a broken wing beside it pull it down; a line breaks long before it is dead.') +
      us.map(u => R(`${esc(u.name)} (${esc(A.fmt(u.men))})`, r0(u.morale) + (u.status === 'shaken' ? ' · shaken' : ''), 'tt-sub')).join('') + (men ? '' : D('Nobody is left standing.'));
  };
  G.bWing = function (arg) {
    const B = battle(); const [k, w] = String(arg).split('|'); if (!B || !B.sides[k]) return '';
    const us = B.sides[k].units.filter(u => u.wing === w && u.status !== 'gone');
    const T = GD.BATTLE_TACTICS[(us[0] || {}).tac] || {};
    return H(WING[w] || w, esc(A.fmt(us.reduce((a, u) => a + u.men, 0))), esc(B.sides[k].name)) +
      us.map(u => R(`${esc(u.name)}${u.status === 'rout' ? ' (routing)' : u.status === 'shaken' ? ' (shaken)' : ''}`, `${esc(A.fmt(u.men))} of ${esc(A.fmt(u.men0 || u.men))} · morale ${r0(u.morale)}`, 'tt-sub')).join('') +
      (T.name ? F(`Orders: ${esc(T.name)}.`) : '');
  };
  G.bDead = function () {
    const B = battle(); if (!B || !B.dead) return '';
    const me = B.pcSide, en = me === 'A' ? 'B' : 'A', R2 = B.aar;
    return H('The dead', esc(A.fmt((B.dead[me] || 0) + (B.dead[en] || 0)))) + R('Yours', esc(A.fmt(B.dead[me] || 0))) + R('Theirs', esc(A.fmt(B.dead[en] || 0))) +
      (R2 && R2.where && R2.where.length ? `<div class="tip-row tt-sum"><span>Where they fell</span><b></b></div>` + R2.where.map(x => R(esc(A.cap(x.label)), x.pct + '%', 'tt-sub')).join('') : '') +
      F('Most of the dead fall in the rout, not the clash.');
  };
  G.aarCause = function (i) {
    const B = battle(), c = B && B.aar && B.aar.causes[+i]; if (!c) return '';
    return H(esc(A.cap(c.label)), (c.pct > 0 ? '+' : '−') + Math.abs(c.pct) + '%') + D(`The dead it ${c.pct > 0 ? 'added to the enemy and spared your side' : 'cost your side'}, as a share of all who fell in the fighting before the rout: each cause multiplies a side's blows, and adds kills × (1 − 1 ÷ its multiplier).`) + F('Causes overlap (a shield wall\'s work shows in its wing too), so they need not add up to 100.');
  };
  G.bPulse = function () {
    const B = battle(); if (!B) return '';
    return H('Pulse', `${B.pulse} of ${B.maxPulses}`) + D('A battle comes in pulses: missiles, then the clash on each wing, then the rout. When the pulses run out, the side that holds the field wins it.');
  };

  G.bScale = function () {
    const B = battle(); if (!B) return '';
    const v = UI.bview || (UI.bviewDefault ? UI.bviewDefault(B) : 'units');
    return H('The drawing', null, { coy: 'companies', bat: 'battalions', units: 'units' }[v] || v) + R('General: one block a unit', '', v === 'units' ? 'tt-on-row' : 'tt-sub') +
      R('Commander: a block for 800 men', '', v === 'bat' ? 'tt-on-row' : 'tt-sub') + R('Captain: a block for 200 men', '', v === 'coy' ? 'tt-on-row' : 'tt-sub') + D('An oblong is foot, a wedge is horse. The view changes the drawing, not the fight.');
  };

  // ---- drill (60-drill) ---------------------------------------------------------------------------------------------------
  G.drill = function (arg) {
    const Dr = A.DRILL; const [fam, v0] = String(arg).split('|'); if (!Dr || !Dr.NAME[fam]) return '';
    const v = v0 != null && v0 !== '' ? +v0 : null, Dd = GD.DRILLS[fam] || {};
    const sc = v != null ? Dr.scale(v) : null;
    return H(esc(A.cap(Dr.NAME[fam])), v != null ? pct(v) : null, v != null ? esc(Dr.word(v)) : '') + (Dd.d ? D(esc(Dd.d)) : '') +
      (v != null ? R('Its effect in battle', pct(sc) + ' of a drilled unit\'s', 'tt-sum') +
        R(`Under ${pct(Dr.GATE)}: not offered at all`, '', v < Dr.GATE ? 'tt-on-row' : 'tt-sub') +
        R(`${pct(Dr.GATE)} to ${pct(Dr.DRILLED)}: 55% rising to 100%`, '', v >= Dr.GATE && v < Dr.DRILLED ? 'tt-on-row' : 'tt-sub') +
        R(`Over ${pct(Dr.DRILLED)}: up to 130%`, '', v >= Dr.DRILLED ? 'tt-on-row' : 'tt-sub') : '') +
      F(`A month in camp on it adds ${pct(Dr.GAIN)}; every other drill fades ${r1(Dr.DECAY * 100)}% a month. Sergeants take the men to ${pct(Dr.CAP)}.`);
  };
})();
