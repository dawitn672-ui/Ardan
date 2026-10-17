// Nested tooltips: the War tab and the War Room. A division's strength, organisation (and the most it can hold),
// equipment, experience and each figure of its stat grid (the template's battalions, then each multiplier: kit,
// experience, the realm's army, the general, doctrine, drill, an order's own edge); an army's organisation, planning
// and supply, and its general's temper (38-orders); a template's figures, battalion by battalion; the host, the pool
// and the drill yards; the forges; a province; a fight on the map; the war score; the order of battle; the elite
// orders and what it takes to join one; the drill yard (60-drill). All of it only reads.
(function () {
  const G = UI.TIPS = UI.TIPS || {}, TT = UI.TT, K = TT.K;
  const { esc, r0, r1, r2, sg, pct, H, R, D, F, L, coin } = K;
  const pc = () => A.pc();
  const div = id => (A.divById ? A.divById(id) : null);
  const fmt = v => esc(A.fmt(Math.round(v)));
  const bnName = c => esc(((GD.TROOPS || {})[c] || {}).name || c);
  const myR = () => (UI.wrMyR ? UI.wrMyR(pc()) : (pc() || {}).realm);

  // ---- a division ---------------------------------------------------------------------------------------------------
  G.divStr = function (id) {
    const d = div(id); if (!d) return '';
    const s = A.divS(d), mo = A.divMaxOrg(d), t = A.tplOf(d), lv = A.xpLevel(d.exp);
    return H(esc(d.name), pct(Math.min(1, A.divStr(d))), 'strength') +
      R(L('divMen', id, 'Men'), `${fmt(d.men)} of ${fmt(s.men)}`) + R(L('divOrg', id, 'Organization'), `${r0(d.org)} of ${r0(mo)}`) +
      R(L('divEq', id, 'Equipment'), pct(A.divEqf(d))) + R(L('divExp', id, 'Experience'), `${r0(d.exp)} · ${esc(lv[1])}`) +
      (d.sr != null ? R(L('divSup', id, 'Supply'), pct(d.sr)) : '') + (t ? F(`Built to ${L('tplStat', d.r + '|' + t.id + '|soft', esc(t.name))}.`) : '') +
      D('Strength is the men in the ranks against the men the template wants. Organization is how long it keeps fighting before it breaks off.');
  };
  G.divMen = function (id) {
    const d = div(id); if (!d) return '';
    const s = A.divS(d), t = A.tplOf(d), by = {};
    for (const c of (t && t.bns) || []) if (GD.BN[c]) by[c] = (by[c] || 0) + 1;
    const parts = Object.entries(by).map(([c, n]) => [`${n} × ${bnName(c)} (${GD.BN[c].men})`, n * GD.BN[c].men]);
    for (const sp of (t && t.sup) || []) if (GD.SUP[sp] && GD.SUP[sp].men) parts.push([esc(GD.SUP[sp].name), GD.SUP[sp].men]);
    return H('Men', `${fmt(d.men)} of ${fmt(s.men)}`, esc(d.name)) + `<div class="tip-row tt-sum"><span>The template wants</span><b></b></div>` + TT.sumRows(parts, s.men, 'Full strength') +
      F('The dead and the sick are replaced from the realm\'s manpower pool as fast as it allows.');
  };
  TT.maxOrgParts = function (d) {
    const s = A.divS(d), g = A.divGen(d), Dc = A.rdoc(A.realm(d.r)), t = A.tplOf(d), lv = A.xpLevel(d.exp);
    const levy = Dc.levyOrg && t && t.bns.every(c => c === 'LV' || c === 'GA') ? Dc.levyOrg : 0;
    const f = [[`Experience: ${esc(lv[1])} (0.75 + 0.3 × ${lv[2]})`, 0.75 + 0.25 * lv[2] * 1.2], ['The realm\'s doctrine' + (levy ? ', for levies' : ''), 1 + (Dc.org || 0) + levy]];
    const base = TT.prodOf(s.org, f), cmd = g ? A.skill(g, 'command') / 12 : 0, o = d.elite && GD.ORDERS[d.elite];
    const ord = o ? 1.15 + (o.org || 0) + ((o.fx || {}).org || 0) : 1;
    return { start: s.org, f, base, cmd, g, ord, total: A.divMaxOrg(d) };
  };
  G.divOrg = function (id) {
    const d = div(id); if (!d) return '';
    const S = TT.maxOrgParts(d);
    return H('Organization', `${r0(d.org)} of ${r0(S.total)}`, esc(d.name)) +
      D('How long it keeps fighting. Each day of battle wears it down; rest in supply builds it back. At none, it breaks off.') +
      `<div class="tip-row tt-sum"><span>The most it can hold</span><b></b></div>` +
      K.mul(['The template\'s battalions, on average', S.start, 'From its men'], S.f, S.base, r1, r1) +
      (S.cmd ? R(`${L('genSkills', S.g.id, 'Its general')}'s command ${A.skill(S.g, 'command')} ÷ 12`, '+' + r1(S.cmd), 'tt-sub') : '') +
      (S.ord !== 1 ? R('An elite order', '×' + r2(S.ord), 'tt-sub') : '') + R('Most', r0(S.total), 'tt-sum');
  };
  G.divEq = function (id) {
    const d = div(id); if (!d) return '';
    const s = A.divS(d), rows = Object.entries(s.eq).map(([k, v]) => R(esc(GD.EQ[k].name), `${fmt(Math.min(v, (d.eq || {})[k] || 0))} of ${fmt(v)}`, 'tt-sub'));
    return H('Equipment', pct(A.divEqf(d)), esc(d.name)) + D('What it has of the kit its template wants, weighed by what each costs. Attack and defense fall with it: 30% of either needs no kit at all.') + rows.join('') +
      F('The forges fill the depots; a division refits from them.');
  };
  G.divExp = function (id) {
    const d = div(id); if (!d) return '';
    const lv = A.xpLevel(d.exp);
    return H('Experience', r0(d.exp), esc(lv[1])) + GD.XPLV.map(l => R(l[1] === lv[1] ? `<span class="tt-on-row">${esc(l[1])}</span>` : esc(l[1]), `${l[0]}+ · ×${l[2]}`, 'tt-sub')).join('') +
      F('Its level multiplies attack and defense, and raises the organization it can hold. Drill takes men only to Trained; war makes veterans.');
  };
  G.divSup = function (id) {
    const d = div(id); if (!d) return '';
    return H('Supply', d.sr != null ? pct(d.sr) : '—', esc(d.name)) + R('Uses a day', r2(A.divSupUse(d))) +
      D('What reaches it of what it eats. Under 70% it is hungry: it loses organization and fights worse. Depots, roads and friendly land feed it; deep in enemy country, little gets through.');
  };
  // the stat grid: the template's figure, then each multiplier of A.divCombat
  TT.divStatParts = function (d, k) {
    const s = A.divS(d), r = A.realm(d.r) || {}, eqf = A.divEqf(d), xm = A.xpLevel(d.exp)[2], q = A.clamp(0.75 + 0.25 * (r.armyQ || 1), 0.85, 1.15);
    const g = A.divGen(d), dc = g && A.doctrineOf ? A.doctrineOf(g) : null, Dc = A.rdoc(r), eqm = 0.3 + 0.7 * Math.min(1, eqf);
    const horse = s.main === 'horse', bows = s.cats.missile >= s.n / 3, dr = d.dr || {}, o = d.elite && GD.ORDERS[d.elite], c = A.divCombat(d);
    const f = [];
    const common = () => { f.push([`${L('divEq', d.id, 'Equipment')} (0.3 + 0.7 × ${pct(Math.min(1, eqf))})`, eqm]); f.push([L('divExp', d.id, 'Experience'), xm]); f.push(['The realm\'s army', q]); };
    if (k === 'soft' || k === 'hard') {
      common();
      if (g) f.push([`${L('genSkills', g.id, 'The general')}'s tactics ${A.skill(g, 'tactics')} (÷ 400)`, 1 + A.skill(g, 'tactics') / 400 + (A.perkOf ? A.perkOf(g, 'tactics', 'battle') : 0)]);
      if (dc && dc.pow) f.push([`His way of war: ${esc(dc.name || 'doctrine')}`, dc.pow]);
      if (s.fx.atkMul) f.push(['Outriders and the like', 1 + s.fx.atkMul]);
      if (horse && Dc.horseAtk) f.push(['Doctrine: horse', 1 + Dc.horseAtk]);
      if (k === 'soft' && (Dc.soft || (bows && Dc.bowSoft))) f.push(['Doctrine: killing power', 1 + (Dc.soft || 0) + (bows && Dc.bowSoft || 0)]);
      if (dr.weapons) f.push([L('drill', 'weapons|' + dr.weapons, 'Weapons drill'), 1 + dr.weapons * 0.14]);
    } else if (k === 'def') {
      common();
      if (g) f.push([`${L('genSkills', g.id, 'The general')}'s command ${A.skill(g, 'command')} (÷ 450)`, 1 + A.skill(g, 'command') / 450]);
      if (dc && dc.defPow) f.push([`His way of war: ${esc(dc.name || 'doctrine')}`, dc.defPow]);
      if (Dc.def) f.push(['Doctrine: holding', 1 + Dc.def]);
      if (dr.formation || dr.shields) f.push([`${L('drill', 'formation|' + (dr.formation || 0), 'Formation')} and ${L('drill', 'shields|' + (dr.shields || 0), 'shield-wall')} drill`, 1 + (dr.formation || 0) * 0.12 + (dr.shields || 0) * 0.08]);
    } else if (k === 'brk') {
      common();
      if (g) f.push([`${L('genSkills', g.id, 'The general')}'s command ${A.skill(g, 'command')} (÷ 450)`, 1 + A.skill(g, 'command') / 450]);
      if (dc && dc.defPow) f.push(['His way of war', dc.defPow]);
      if (dc && dc.pow) f.push(['His way of war, attacking', dc.pow]);
      if (Dc.def) f.push(['Doctrine: holding', 1 + Dc.def]);
      if (Dc.brk) f.push(['Doctrine: shock', 1 + Dc.brk]);
    } else if (k === 'hp') f.push([`Strength ${pct(A.divStr(d))}`, A.divStr(d)]);
    else return null;
    if (d.elite && ['soft', 'hard', 'def', 'brk'].includes(k)) { f.push(['Picked men', 1.15]); if (o) { const fx = o.fx || {}, P = A.S.prov[d.atk != null ? d.atk : d.loc], home = !!P && ((o.terr || []).includes(P.terr) || ((o.terr || []).includes('coast') && P.coast)); const m = k === 'def' ? (1 + (fx.def || 0)) * (home ? 1.25 : 1) : (1 + (fx[k] || 0)) * (home ? 1.35 : 1); if (m !== 1) f.push([`${L('orderTraits', d.elite, 'The order\'s own edge')}${home ? ', on its own ground' : ''}`, m]); } }
    return { start: s[k], f, total: c[k] };
  };
  const STAT = { soft: ['Soft attack', 'Attacks a day against men.'], hard: ['Hard attack', 'Attacks a day against armor and beasts.'], def: ['Defense', 'Attacks it can turn aside when it is attacked.'], brk: ['Breakthrough', 'Attacks it can turn aside when it attacks.'],
    org: ['Organization', ''], hp: ['Hit points', 'How much damage it can take: the men, at their strength.'], w: ['Width', 'How much of a front it fills. Each ground has its width: plains 70, forest 50, a mountain pass 35.'],
    sup: ['Supply', 'What it eats a day: the template\'s, at 40% plus 60% of its strength.'], spd: ['Speed', 'Kilometres a day on open ground.'], arm: ['Armor', 'An enemy with less piercing does half its attacks.'],
    prc: ['Piercing', 'Beat the enemy\'s armor or lose half your attacks.'], exp: ['Experience', ''], men: ['Men', ''], cost: ['Gear cost', 'What its kit costs the forges.'] };
  G.divStat = function (arg) {
    const [id, k] = String(arg).split('|'), d = div(id); if (!d || !STAT[k]) return '';
    if (k === 'org') return G.divOrg(id);
    if (k === 'exp') return G.divExp(id);
    const c = A.divCombat(d), P = TT.divStatParts(d, k), s = A.divS(d), t = A.tplOf(d);
    const shown = k === 'sup' ? A.divSupUse(d) : k === 'spd' ? A.divSpeed(d) : k === 'w' ? s.w : k === 'arm' ? s.arm : k === 'prc' ? s.prc : c[k];
    let body = '';
    if (P) body = K.mul([`${L('tplStat', d.r + '|' + (t ? t.id : '') + '|' + k, 'The template\'s battalions')}`, P.start, STAT[k][0]], P.f, shown, v => r1(v), r2);
    else if (k === 'sup') body = R(L('tplStat', d.r + '|' + (t ? t.id : '') + '|sup', 'The template'), r2(s.sup)) + R(`× (0.4 + 0.6 × strength ${pct(Math.min(1, A.divStr(d)))})`, r2(0.4 + 0.6 * Math.min(1, A.divStr(d))), 'tt-sub') + R('A day', r2(shown), 'tt-sum');
    else if (k === 'spd') { const g = A.divGen(d); body = R(`22 km × the slowest battalion (${r2(s.spd)})`, r1(22 * s.spd)) + (g ? R(`${L('genSkills', g.id, 'The general')}'s logistics`, '×' + r2(1 + A.perkOf(g, 'logistics', 'supply') * 0.3 + A.skill(g, 'logistics') / 600), 'tt-sub') : '') + ((d.dr || {}).march ? R(L('drill', 'march|' + d.dr.march, 'March drill'), '×' + r2(1 + d.dr.march * 0.16), 'tt-sub') : '') + R('A day', r0(shown) + ' km', 'tt-sum'); }
    else if (k === 'arm' || k === 'prc') body = R('The best battalion, 30%', '', 'tt-sub') + R('The average of all, 70%', '', 'tt-sub') + R(STAT[k][0], r1(shown), 'tt-sum');
    else body = R(STAT[k][0], r1(shown), 'tt-sum');
    return H(STAT[k][0], r1(shown), esc(d.name)) + D(STAT[k][1]) + body;
  };
  // a template's figure, battalion by battalion
  G.tplStat = function (arg) {
    const [rid, tid, k] = String(arg).split('|'), r = A.realm(rid), t = r && r.forces && r.forces.tpl[tid]; if (!t || !STAT[k]) return '';
    const s = A.tplS(rid, tid), by = {};
    for (const c of t.bns || []) if (GD.BN[c]) by[c] = (by[c] || 0) + 1;
    const add = ['soft', 'hard', 'def', 'brk', 'hp', 'w', 'men'].includes(k);
    let body = '';
    if (add) {
      const parts = Object.entries(by).map(([c, n]) => [`${n} × ${bnName(c)} (${GD.BN[c][k]})`, n * GD.BN[c][k]]);
      for (const sp of t.sup || []) { const U = GD.SUP[sp]; if (!U) continue; const v = k === 'men' ? U.men : (U.fx || {})[k]; if (v) parts.push([esc(U.name), v]); }
      body = TT.sumRows(parts, s[k], STAT[k][0]);
    } else if (k === 'org') {
      body = Object.entries(by).map(([c, n]) => R(`${n} × ${bnName(c)}`, GD.BN[c].org, 'tt-sub')).join('') + R('Their average', r1(s.org - ((s.fx || {}).org || 0))) +
        ((s.fx || {}).org ? R('Heralds, a banner guard', sg(s.fx.org), 'tt-sub') : '') + R('Organization', r1(s.org), 'tt-sum');
    } else if (k === 'sup' || k === 'spd' || k === 'arm' || k === 'prc' || k === 'cost') {
      body = Object.entries(by).map(([c, n]) => R(`${n} × ${bnName(c)}`, k === 'spd' ? r2(GD.BN[c].spd) : k === 'cost' ? '' : r2(GD.BN[c][k]), 'tt-sub')).join('') +
        R(k === 'sup' ? 'All of them' + ((s.fx || {}).supMul ? ', less the quartermasters\' share' : '') : k === 'spd' ? 'The slowest, × 22 km' : k === 'cost' ? 'Kit, at the forges\' prices' : '30% the best, 70% the average', k === 'spd' ? r0(s.spd * 22) : r2(s[k] != null ? s[k] : 0), 'tt-sum');
    }
    return H(STAT[k][0], k === 'spd' ? r0(s.spd * 22) : r1(s[k] || 0), esc(t.name)) + (STAT[k][1] ? D(STAT[k][1]) : '') + body +
      F('A division of this template multiplies the battalions\' attack and defense by its kit, experience, general and drill.');
  };

  // ---- an army ---------------------------------------------------------------------------------------------------------
  const army = id => (A.army ? A.army(id) : null);
  const avg = (ds, f) => ds.length ? ds.reduce((x, d) => x + f(d), 0) / ds.length : 0;
  G.army = function (id) {
    const a = army(id); if (!a) return '';
    const ds = A.armyDivs(a), g = a.gen ? A.P(a.gen) : null, GN = A.GENERALS;
    return H(esc(a.name), null, esc(A.realmShort(a.realm))) + R('Divisions', `${ds.length} of 24`) + R('Men', fmt(A.armyMen(a))) +
      R(L('armyOrg', id, 'Organization'), r0(a.org) + '%') + R(L('armySup', id, 'Supply'), pct(avg(ds, d => d.sr != null ? d.sr : 1))) +
      (g ? R(L('genSkills', g.id, 'General'), esc(A.fullName(g, false))) : R('General', 'none')) +
      (GN && g && g.id !== A.S.pc ? R(L('temper', id, 'Temper'), esc(GN.NAMES[GN.of(a)])) : '') + (a.hungry ? D('<span class="bad">Hungry: supply is not reaching it.</span>') : '');
  };
  G.armyOrg = function (id) {
    const a = army(id); if (!a) return '';
    const ds = A.armyDivs(a);
    return H('Organization', r0(a.org) + '%', esc(a.name)) + D('The army\'s divisions, each against the most it can hold. Under 40 it is spent: it should rest before it attacks.') +
      ds.slice(0, 10).map(d => R(L('divOrg', d.id, esc(d.name)), `${r0(d.org)} of ${r0(A.divMaxOrg(d))}`, 'tt-sub')).join('') + (ds.length > 10 ? D(`…and ${ds.length - 10} more.`) : '');
  };
  G.armyPlan = function (id) {
    const a = army(id); if (!a) return '';
    const ds = A.armyDivs(a), p = avg(ds, d => d.plan || 0);
    return H('Planning', '+' + pct(p), esc(a.name)) + D('While an army holds the front, its staff plans the attack: up to +30% on the first days of the battle (more with a planning doctrine). It is spent when the attack goes in.') +
      F('Each division\'s own planning, averaged.');
  };
  G.armySup = function (id) {
    const a = army(id); if (!a) return '';
    const ds = A.armyDivs(a), hungry = ds.filter(d => d.sr != null && d.sr < 0.7);
    return H('Supply', pct(avg(ds, d => d.sr != null ? d.sr : 1)), esc(a.name)) + D('What reaches its divisions of what they eat, averaged. Under 70% a division goes hungry.') +
      (hungry.length ? hungry.slice(0, 8).map(d => R(L('divSup', d.id, esc(d.name)), pct(d.sr), 'tt-sub')).join('') : D('None of them is hungry.'));
  };
  G.temper = function (id) {
    const a = army(id), GN = A.GENERALS; if (!a || !GN) return '';
    const t = GN.of(a), g = a.gen ? A.P(a.gen) : null, Dl = GN.DIALS[t];
    const traits = g ? (g.traits || []).filter(x => (GN.TRAITS[t] || []).includes(x)) : [];
    const WORDS = { bold: 'attacks at worse odds, sooner, with half his divisions', cautious: 'wants better odds and rested men, keeps a third in reserve, and stays on the defensive while outnumbered', cunning: 'goes for the undefended and keeps away from walls', steady: 'fights as the manuals say' };
    return H(esc(GN.NAMES[t]), null, g ? esc(A.fullName(g, false)) : '') + D(`He ${WORDS[t]}.`) +
      (traits.length ? R('From his traits', traits.map(x => L('trait', x, esc((GD.TRAITS[x] || {}).name || x))).join(', ')) : R('From his traits', 'none that lean one way')) +
      R('Odds he wants before attacking', '×' + Dl.need, 'tt-sub') + R('Divisions sent at once', pct(Dl.spear), 'tt-sub') + R('Thinks every', `${Dl.every} ticks of the war clock`, 'tt-sub') +
      (Dl.reserve ? R('Held in reserve', pct(Dl.reserve), 'tt-sub') : '') + (a.gtPlan && GN.planText ? F(esc(GN.planText(a))) : '');
  };
  G.genSkills = function (pid) {
    const g = A.P(pid); if (!g) return '';
    const c = A.skill(g, 'command'), t = A.skill(g, 'tactics'), lg = A.skill(g, 'logistics');
    return H(esc(A.fullName(g, false)), null, 'as a general') +
      R('Command ' + c, `+${r1(c / 12)} most organization · defense ×${r2(1 + c / 450)}`) + R('Tactics ' + t, `attack ×${r2(1 + t / 400)}`) + R('Logistics ' + lg, `speed ×${r2(1 + lg / 600)}`) +
      (A.GENERALS && g.id !== A.S.pc ? F(`Temper: ${esc(A.GENERALS.NAMES[A.GENERALS.temper(g)])}.`) : '');
  };

  // ---- the host, the pool, the drill yards ---------------------------------------------------------------------------------
  G.host = function (rid) {
    const r = A.realm(rid || myR()); if (!r || !r.forces) return '';
    const all = r.forces.divs, men = all.reduce((x, d) => x + d.men, 0), full = all.reduce((x, d) => x + A.divS(d).men, 0);
    return H('The host of ' + esc(r.short), `${fmt(men)} of ${fmt(full)}`) + R('Divisions', all.length) + R(L('manpower', r.id, 'Manpower pool'), fmt(r.levy)) +
      R('In training', r.forces.queue.length) + R('Army experience', Math.floor(r.forces.xp), 'tt-sub') +
      D('Army experience is earned in battle and drill, and spent on new templates and doctrines.');
  };
  G.manpower = function (rid) {
    const r = A.realm(rid || myR()); if (!r) return '';
    const cap = r.levyCap || Math.max(r.levy, 1), lv = A.LEVY && A.LEVY[(r.laws || {}).levy];
    return H('Manpower', `${fmt(r.levy)} of ${fmt(cap)}`, esc(r.short)) + R('Next year', r.levy >= cap * 0.98 ? 'full' : '+' + fmt(Math.max(0, (cap - r.levy) * 0.2)) + ' (a fifth of the gap)') +
      (lv ? R('Levy law: ' + esc(lv[0]), 'pool ×' + lv[1], 'tt-sub') : '') + D('What the land can give, at the levy law. Training a division takes its men at once; refits draw on it all the time.');
  };
  G.training = function (arg) {
    const [rid, i] = String(arg).split('|'), r = A.realm(rid), q = r && r.forces && r.forces.queue[+i]; if (!q) return '';
    const t = r.forces.tpl[q.tpl];
    return H(esc(t ? t.name : 'A division'), `${Math.ceil(Math.max(0, q.left) / 30)} mo`) + R('Men', fmt(q.men)) + R('Days', `${r0(q.days - q.left)} of ${r0(q.days)}`) +
      D('90 days, 6 more for each battalion and 12 for each of horse or beasts.');
  };
  G.trainCost = function (arg) {
    const [rid, tid] = String(arg).split('|'), s = A.tplS(rid, tid), r = A.realm(rid); if (!s || !r) return '';
    const cost = Math.round(s.men * 4 + s.cost * 6), days = Math.round(90 + s.n * 6 + (s.cats.horse + s.cats.beast) * 12);
    return H('Training one', coin(cost)) + TT.sumRows([[`${fmt(s.men)} men × 4`, s.men * 4], [`Kit worth ${fmt(s.cost)} × 6`, s.cost * 6]], cost, 'Suns') +
      `<div class="tip-row tt-sum"><span>Time</span><b></b></div>` + TT.sumRows([['To raise any division', 90], [`${s.n} battalions × 6`, s.n * 6], [`${s.cats.horse + s.cats.beast} of horse or beasts × 12`, (s.cats.horse + s.cats.beast) * 12]], days, 'Days');
  };

  // ---- the forges ---------------------------------------------------------------------------------------------------------
  G.industry = function (k) {
    const r = A.realm(myR()); if (!r || !r.ind) return '';
    const I = r.ind, law = GD.ECON[I.law] || GD.ECON.partial, free = Math.floor(I.civ * (1 - law.cg));
    if (k === 'civ') return H('Workshops', I.civ) + TT.sumRows([['Free to build', free], [`Making goods for the people (${pct(law.cg)}, by the ${esc(law.name)} law)`, I.civ - free]], I.civ, 'Workshops') + D('Free workshops build forges, walls, depots and roads.');
    if (k === 'mil') { const war = I.lines.filter(x => x.eq !== 'trade').reduce((a, x) => a + x.n, 0), tr = (I.lines.find(x => x.eq === 'trade') || { n: 0 }).n; return H('Forges', I.mil) + TT.sumRows([['On war gear', war], ['Selling arms abroad', tr], ['Idle', I.mil - war - tr]], I.mil, 'Forges') + D(`Each forge's output is ×${law.out} under the ${esc(law.name)} law.`); }
    if (k === 'ore') return H('Ore', I.ore) + D(A.oreMul && A.oreMul(r) < 1 ? `Short: metal lines work at ${pct(A.oreMul(r))}.` : 'Enough for every metal line.');
    if (k === 'sold') return H('Arms sold abroad', fmt(I.lastSold || 0), 'last year') + D('A forge on the trade line sells about 14 suns a day at full efficiency.');
    return '';
  };
  G.line = function (k) {
    const r = A.realm(myR()); if (!r || !r.ind) return '';
    const I = r.ind, L0 = I.lines.find(x => x.eq === k) || { n: 0, eff: 0 }, E = GD.EQ[k];
    if (k === 'trade') return H('Selling arms abroad', `${L0.n} forges`) + R('Efficiency', pct(L0.eff)) + R('A month', `${L0.n} × 30 days × ${pct(L0.eff)} × 14 suns`, 'tt-sub') + R('Comes to', fmt(L0.n * 30 * L0.eff * 14) + ' suns', 'tt-sum');
    if (!E) return '';
    const need = A.eqNeed(r), per = Math.round(A.lineRate(r, L0) * 30), tgt = Math.round(A.eqTarget(r, k, need)), st = Math.round(I.stock[k] || 0), sh = need.short[k] || 0;
    return H(esc(E.name), `${L0.n} forges`) + (E.desc ? D(esc(E.desc)) : '') + R('Efficiency', pct(L0.eff)) + R('Made a month', per ? '+' + fmt(per) : '—') + R('In the depots', fmt(st)) +
      R(sh > st ? 'Short now' : 'The reserve aimed for', fmt(sh > st ? sh - st : tgt), 'tt-sub') + F('Efficiency climbs the longer a line runs; a forge moved to another line starts again at 15%.');
  };
  G.build = function (arg) {
    const r = A.realm(myR()); const i = +arg, q = r && r.ind && r.ind.cq[i]; if (!q) return '';
    const per = Math.max(1, q.civ * 30 * (0.6 + 0.4 * r.stability / 100));
    return H(esc(GD.BUILD[q.k].name), null, esc(A.provName(q.prov))) + R('Done', `${r0(q.prog)} of ${r0(q.cost)}`) + R('Workshops on it', q.civ || 0) +
      R(`A month: workshops × 30 × (0.6 + 0.4 × ${L('realmStab', r.id, 'stability')} ${r0(r.stability)})`, r0(per), 'tt-sub') + (q.civ ? R('Months left', Math.ceil(Math.max(0, q.cost - q.prog) / per), 'tt-sum') : D('Waiting for free workshops.'));
  };
  G.econLaw = function (k) {
    const Lw = GD.ECON[k]; if (!Lw) return '';
    return H(esc(Lw.name), null, 'economy law') + R('Workshops on goods for the people', pct(Lw.cg)) + R('Forge output', '×' + Lw.out) + R(L('realmStab', myR(), 'Stability'), sg(Lw.stab) + ' a year') + (Lw.war ? D('A wartime law.') : '');
  };

  G.buildKind = function (k) {
    const B = GD.BUILD[k]; if (!B) return '';
    return H(esc(B.name), null, 'to build') + D(esc(B.desc || '')) + R('Work', `${B.cost} workshop-days`) + F('At most 15 workshops on one project; stability speeds the work.');
  };
  G.doctrine = function (k) {
    const Dc = GD.RDOC[k], r = A.realm(myR()); if (!Dc) return '';
    const W = { planMax: 'most planning', dig: 'digging in', horseAtk: 'horse attack', brk: 'breakthrough', bowSoft: 'archers\' killing power', soft: 'killing power', mp: 'manpower pool', levyOrg: 'levies\' organization', org: 'organization', orgReg: 'rallying', def: 'defense' };
    return H(esc(Dc.name), null, r && r.forces && r.forces.doc === k ? 'adopted' : `${Dc.cost} army experience`) + D(esc(Dc.desc || '')) +
      Object.entries(Dc.fx || {}).map(([x, v]) => R(esc(W[x] || x), x === 'dig' ? '+' + v : '+' + pct(v), 'tt-sub')).join('') + F('One doctrine at a time; changing it costs army experience.');
  };

  // ---- a province, a fight, a war ---------------------------------------------------------------------------------------------
  G.prov = function (pid) {
    const P = A.S.prov[+pid]; if (!P) return '';
    const sup = A.supplyMap(myR())[P.id];
    return H(esc(P.name), null, esc(A.cap(P.terr))) + R('Width of the front', A.WIDTH[P.terr] || 60) + R('Attacker', '×' + (A.ATK_TERR[P.terr] || 1)) +
      R('Walls', P.fort || 0) + R('Supply for you', `${r1(sup)}: feeds about ${Math.max(0, Math.floor(sup / 0.65))} divisions`, 'tt-sub') +
      R('People', fmt(P.pop), 'tt-sub') + D('A division eats about 0.65 of supply. Walls take 8% off each attack on them and add 6% to the defense, a step at a time.');
  };
  G.fight = function (pid) {
    const F0 = (A.S.fights || {})[+pid]; if (!F0) return '';
    const st = A.fightState(F0), P = A.S.prov[F0.loc], m = F0.mods || {};
    return H('Battle of ' + esc(P.name), `day ${F0.days}`) +
      R(`Attackers (${esc(A.realmShort(F0.a))})`, `${fmt(st.menA)} men · ${F0.atkA || 0} attacks a day`) + R(`Defenders (${esc(A.realmShort(F0.b))})`, `${fmt(st.menD)} men · ${F0.atkD || 0} attacks a day`) +
      R('Width used', `${F0.usedA || 0} and ${F0.usedD || 0} of ${F0.width || 0}`, 'tt-sub') +
      (m.terr && m.terr < 1 ? R('Ground', 'attacker ×' + m.terr, 'tt-sub') : '') + (m.fort ? R(`Walls (${m.fort})`, `attacker −${m.fort * 8}%, defender +${m.fort * 6}%`, 'tt-sub') : '') +
      R('Organization left: the attackers\' share', pct(st.share), 'tt-sum') + R('Dead so far', `${fmt(F0.deadA || 0)} and ${fmt(F0.deadD || 0)}`, 'tt-sub') +
      F('A fight ends when one side\'s organization is gone.');
  };
  G.warScore = function (wid) {
    const w = A.S.wars.find(x => String(x.id) === String(wid)); if (!w) return '';
    const me = myR(), side = A.warSide(w, me) || 'att', sc = side === 'att' ? w.score : -w.score, mine = side === 'att' ? w.att : w.def, theirs = side === 'att' ? w.def : w.att;
    const held = A.S.prov.filter(p => theirs.includes(p.owner) && mine.includes(p.occ)), lost = A.S.prov.filter(p => mine.includes(p.owner) && theirs.includes(p.occ));
    const cap = ps => ps.filter(p => (A.realm(p.owner) || {}).capitalProv === p.id).length;
    const won = w.battles.filter(b => b.win === side).length, lostB = w.battles.length - won;
    return H('War score', sg(sc), esc(w.name)) + D('It moves each month with the land each side holds of the other (a capital counts double), and with each battle won or lost: 6 to 13 points a battle.') +
      R('Their provinces you hold', `${held.length}${cap(held) ? ` (${cap(held)} a capital)` : ''}`) + R('Yours they hold', `${lost.length}${cap(lost) ? ` (${cap(lost)} a capital)` : ''}`) +
      R('Great battles won', won, 'tt-sub') + R('Lost', lostB, 'tt-sub') + R('At +25', 'you can demand what you hold', 'tt-sum') + F('From −100 to +100.');
  };
  G.warFront = function (rid) {
    const r = rid || myR(), as = A.armiesOf(r), fights = Object.values(A.S.fights || {}).filter(F0 => A.friendly(F0.a, r) || A.friendly(F0.b, r));
    return H('In the field', null, esc(A.realmShort(r))) + as.map(a => R(L('army', a.id, esc(a.name)), `${a.divs.length} div · ${fmt(A.armyMen(a))}`, 'tt-sub')).join('') +
      (fights.length ? fights.slice(0, 6).map(F0 => R(L('fight', F0.loc, 'Battle of ' + esc(A.provName(F0.loc))), 'day ' + F0.days, 'tt-sub')).join('') : D('No battle is being fought.'));
  };
  G.oob = function (i) {
    const p = pc(), root = A.oobArmyOf && A.oobArmyOf(p); if (!root) return '';
    const path = A.oobPath(p, root), n = path[+i]; if (!n) return '';
    const up = path[+i - 1], dn = path[+i + 1];
    return H(esc(n.name), fmt(n.men), 'men') + (n.leader && n.leader.name ? R('Led by', esc(((n.leader.title || '') + ' ' + n.leader.name).trim())) : '') +
      (up ? R('Part of', `${esc(up.name)} (${fmt(up.men)})`, 'tt-sub') : '') + (dn ? R('Of whom', `${esc(dn.name)} (${fmt(dn.men)})`, 'tt-sub') : '') +
      F('Men in the ranks today; the dead and the sick are not counted.');
  };

  // ---- the elite orders ------------------------------------------------------------------------------------------------------
  G.orderPow = function (id) {
    const S = A.orderSummary && A.orderSummary(id); if (!S || !S.d) return '';
    const c = A.divCombat(S.d), r = A.realm(S.o.realm);
    const parts = [['Killing power (soft + half the hard) × 2', (c.soft + c.hard * 0.5) * 2], ['Defense ÷ 2', c.def * 0.5], ['Breakthrough ÷ 2', c.brk * 0.5], ['Hit points × 0.6', c.hp * 0.6], [`Organization ${r0(S.d.org)} × 0.3`, S.d.org * 0.3]];
    return H(esc(A.cap(S.o.name)), `${fmt(S.men)} of ${fmt(S.full)}`, esc(S.exp)) + `<div class="tip-row tt-sum"><span>Its power</span><b></b></div>` + TT.sumRows(parts, A.divPower(S.d), 'Power') +
      (S.likeMen ? R('Fights like', `~${fmt(S.likeMen)} line soldiers`, 'tt-sum') + D(`Its power against the power a man of ${esc(r ? r.short : 'the realm')}'s strongest line division brings, to the nearest 50.`) : '') +
      F(`${L('orderTraits', id, 'What sets it apart')}.`);
  };
  G.orderTraits = function (id) {
    const o = GD.ORDERS[id]; if (!o) return '';
    const fx = o.fx || {}, rows = [];
    if (fx.brk) rows.push(R('Charge (breakthrough)', '+' + pct(fx.brk))); if (fx.soft) rows.push(R('Killing power (soft attack)', '+' + pct(fx.soft)));
    if (fx.hard) rows.push(R('Breaks armor (hard attack)', '+' + pct(fx.hard))); if (fx.def) rows.push(R('Holds ground (defense)', '+' + pct(fx.def)));
    if (fx.spd) rows.push(R('Speed', '+' + pct(fx.spd)));
    return H(esc(A.cap(o.name)), null, 'its edge') + rows.join('') + R('Picked men: attack and defense', '×1.15', 'tt-sub') +
      ((o.terr || []).length ? R('On its own ground: attack ×1.35, defense ×1.25', esc(o.terr.join(', ')), 'tt-sub') : '') + (o.org || fx.org ? D('It almost never routs.') : '');
  };
  G.orderReq = function (arg) {
    const [id, i] = String(arg).split('|'), p = pc(), x = p && A.orderReqs(p, id)[+i]; if (!x) return '';
    const o = GD.ORDERS[id], link = /^Fighting worth/.test(x.label) ? L('worth', p.id, 'your fighting worth') : /^Renown/.test(x.label) ? L('fame', '', 'your renown') : /^Honor/.test(x.label) ? L('honor', '', 'your honor') : null;
    const sk = [o.req.skill, o.req.skill2, o.req.skill3].find(s => s && x.label.startsWith(GD.SKILLS[s[0]]));
    const st = o.req.stat && x.label.startsWith(GD.STAT_NAMES[o.req.stat[0]]) ? o.req.stat[0] : null;
    return H(esc(x.label), x.have !== '' ? esc(String(x.have)) : null, x.ok ? 'met' : 'not yet') +
      D(x.ok ? 'You meet it.' : 'Not yet.') + (link ? F(`See ${link}.`) : sk ? F(`See ${L('skill', sk[0], esc(GD.SKILLS[sk[0]]))}.`) : st ? F(`See ${L('stat', st, esc(GD.STAT_NAMES[st]))}.`) : '');
  };

  G.divRecord = function (id) {
    const d = div(id); if (!d) return '';
    return H('Record', null, esc(d.name)) + R('Fights won', d.wins || 0) + R('Lost', d.losses || 0) + R('Enemy dead', fmt(d.kills || 0)) + D('Each fight won adds experience; a division that keeps losing loses heart and men.');
  };
  G.divIntel = function () {
    return H('By the campfires') + D('No reports on this division: the number is guessed from its fires, to the nearest thousand. Outriders (scouts) in a division beside it would tell you its strength.');
  };
  G.staffFit = function (arg) {
    const p = pc(); const [key, pid] = String(arg).split('|'), x = A.P(pid), s = p && A.staffSlots && A.staffSlots(p).find(y => y.key === key); if (!x || !s) return '';
    const a = A.skill(x, s.skill), b = A.skill(x, s.s2), v = Math.round(a * 0.65 + b * 0.35);
    return H('Fit for the post', v, esc(s.label)) + TT.sumRows([[`${esc(GD.SKILLS[s.skill] || s.skill)} ${a} × 0.65`, a * 0.65], [`${esc(GD.SKILLS[s.s2] || s.s2)} ${b} × 0.35`, b * 0.35]], v, 'Fit') + D(esc(s.eff || ''));
  };

  // ---- the drill yard (60-drill's card) ----------------------------------------------------------------------------------------
  G.drillShare = function () {
    const p = pc(), d = p && A.myUnit && A.myUnit(p); if (!d) return '';
    const share = A.drillShare ? A.drillShare(p) : 1, leads = GD.MIL[p.mil.rank].leads;
    return H('Your share of the drill', pct(share), esc(d.name)) + R('Men you lead', fmt(Math.min(d.men, leads))) + R('In the unit', fmt(d.men)) +
      D('Your bars show your own men. Across the whole unit your drill counts for your share; the commanders above you drill the rest.');
  };
  G.drillCap = function () {
    const p = pc(); if (!p || !p.mil) return '';
    const parts = [['Any drill yard', 50], ['Sergeants who know the work', 30], [`${L('skill', 'command', 'Your command')} ${A.skill(p, 'command')} (÷ 3.2)`, A.skill(p, 'command') / 3.2], ['Your officers and sergeant-major', (A.staffBonus ? A.staffBonus(p, 'drill') : 0) * 50]];
    if (p.mil.rank >= 6) parts.push(['A commander of a division', 10]);
    const v = (0.5 + (0.6 + A.skill(p, 'command') / 160 + (A.staffBonus ? A.staffBonus(p, 'drill') : 0) + (p.mil.rank >= 6 ? 0.2 : 0)) * 0.5) * 100;
    return H('As far as your officers teach', r0(v)) + K.pts(parts, r0(v), 'The tick').replace(/%<\/b><\/div>$/, '</b></div>') + D('Drill only takes the men to Trained; only war makes veterans.');
  };
})();
