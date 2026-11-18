// W1-6 part e: the three disputes W1-3 left as hooks (docs/design/war.md §9.4; D-084 point 3; D-101). Each begins with
// a named grievance, climbs one rung at a time and may stop at any rung; each rung is a person's decision through A.WHY.
//
//   a private war   two great houses of one realm. Begins with something real between them: a shared border (a
//                   boundary, a mill, a toll), precedence (one of the same rank holds a seat or a command the other
//                   does not), a command given over him to the other's man (W1-3's grievance), their heads' enmity.
//                   Two such things at least, or nothing begins. Rungs: the aggrieved lord complains to the crown or
//                   lets it lie ('feud') -> the king judges for one, for the other, splits it, or will not hear it
//                   ('judge': his regard for each house, their swords, kin, a war abroad, his temper); a judgment lost
//                   is a new grievance on the house -> the loser accepts or defies ('feud') -> raids, and the king
//                   decides whether to step in: enforce his peace, crush both, or let them fight ('peace': his
//                   authority, his strength beside theirs, a war abroad, his temper) -> a fight in the field, which
//                   the stronger house is likelier to win (a battle's chance, not a decision); the loser submits.
//   a border war    a march lord raids across his frontier into a hostile crown's land ('raid': his ambition, the
//                   hostility, a raid suffered). His own king disowns him and pays, backs him (a war between realms),
//                   or leaves it a border war of the march lords' own men ('border': his authority, his relations
//                   with the other crown, his appetite for war, a war elsewhere).
//   the army's      a great lord under a General of lesser birth (W1-3's commission) obeys coldly, comes late, or
//     quarrel       takes his host home ('quarrel': the slight, his oath, his temper, the war at his border).
// State: A.S.feuds (at most 24 kept: live first, then the newest ended; each about 160 bytes).
(function () {
  const PE = A.PEACE, W = () => A.WHY;
  if (!PE) return;
  const { clamp, live, short } = PE;
  const r2 = x => Math.round(x * 100) / 100;
  const rs = (kind, weight, label, source, pub) => ({ kind, weight: r2(weight), label, source, pub: pub ? 1 : 0 });
  Object.assign(PE.T, { feudCap: 24, feudBand: 1, pairsCap: 10 });
  W().T.kindCap = Object.assign({ feud: 20, judge: 10, peace: 10, raid: 10, border: 10, quarrel: 10 }, W().T.kindCap || {});
  const feuds = () => { const S = A.S; if (!Array.isArray(S.feuds)) S.feuds = []; return S.feuds; };
  PE.feuds = () => (A.S && Array.isArray(A.S.feuds) ? A.S.feuds : []);
  const keep = () => {
    const L = feuds();
    for (let i = L.length - 1; i >= 0 && L.length > PE.T.feudCap; i--) if (L[i].end) L.splice(i, 1);
    if (L.length > PE.T.feudCap * 2) L.length = PE.T.feudCap * 2;
  };
  const headOf = h => (h && h.headPid != null ? A.P(h.headPid) : null);
  const hasPost = (p, rx) => live(p) && A.POSTS && A.POSTS.held(p.id).some(k => rx.test(k));
  const crownMen = r => Math.max(1, (r.army || 0) + (A.MEN ? A.MEN.reserve(r) * .1 : (r.roll || 0) * .1));

  // ---------------------------------------------------------------- what is between two houses
  PE.between = function (a, b) {
    const out = [], pa = headOf(a), pb = headOf(b);
    const near = PE.tieOf && PE.tieOf(a, b) === 'a shared border';
    if (near) out.push(rs('want', .7, `A boundary with ${b.name}: a mill, a toll, a wood both claim`, { t: 'border', id: b.id }, 1));
    if (a.rung && a.rung === b.rung && hasPost(pb, /^(seat|army|div):/) && !hasPost(pa, /^(seat|army|div):/)) out.push(rs('grudge', .7, `${b.name}, no greater than his own house, sits higher at court`, { t: 'precedence', id: b.id }, 1));
    if (live(pa) && live(pb)) {
      const rel = pa.rel && pa.rel[pb.id];
      if (rel && (rel.type === 'rival' || rel.type === 'enemy' || (rel.op || 0) <= -30)) out.push(rs('grudge', 1.4, `Bad blood between ${A.fullName(pa, false)} and ${A.fullName(pb, false)}`, { t: 'enmity', id: pb.id, r: Math.round(rel.op || 0) }, 1));
    }
    if (live(pb)) for (const g of (A.CMD && A.CMD.griefs ? A.CMD.griefs(a) : [])) if (g[1] === 'passed' && A.S.year - g[0] <= 6 && String(g[2]).includes(A.fullName(pb, false))) { out.push(rs('grudge', 1, `${A.fullName(pb, false)} given the command over him`, { t: 'passed', id: b.id, y: g[0] }, 1)); break; }
    return out;
  };
  const live2 = (a, b) => PE.feuds().some(f => !f.end && ((f.a === a.id && f.b === b.id) || (f.a === b.id && f.b === a.id)));
  // the realm's year: the great houses with two grievances or more against another weigh a complaint
  PE.feudYear = function (r) {
    if (!r || !r.alive || r.isRebel) return;
    const hs = (A.CMD && A.CMD.tics ? A.CMD.tics(r.id) : []).concat(A.realmHouses(r.id).filter(h => h.great !== false && ['N04', 'N05'].includes(h.rung)));
    const list = hs.filter((h, i) => hs.indexOf(h) === i && live(headOf(h)) && headOf(h).id !== A.S.pc).slice(0, 14);
    let asked = 0;
    for (const a of list) for (const b of list) {
      if (a === b || asked >= PE.T.pairsCap || live2(a, b)) continue;
      const g = PE.between(a, b);
      if (g.length < 2) continue;
      asked++;
      const pa = headOf(a);
      const rec = W().decide(pa, 'feud', [
        { id: 'complain', at: b.id, feeds: ['anger', 'pride', 'grudge'], reasons: g.concat([rs('reckoning', (A.houseStrength(a) / Math.max(1, A.houseStrength(b)) - 1) * .5, 'His men against theirs', { t: 'ratio', id: b.id }, 0)]) },
        { id: 'lie', at: b.id, feeds: ['fear'], reasons: [rs('loyalty', 1.6, 'The king\'s peace', { t: 'peace' }, 1), rs('fear', .4, 'A quarrel is costly', { t: 'cost' }, 0)] },
      ], { band: PE.T.feudBand, r: r.id, at: b.id, logIf: x => x.chose === 'complain' });
      if (!rec || rec.chose !== 'complain') continue;
      const F = { id: 'Q' + (A.S.nextFeud = (A.S.nextFeud || 0) + 1), k: 'private', r: r.id, a: a.id, b: b.id, y: A.S.year, rung: 'complaint', why: PE.clean(W().tell(rec, true), 160) };
      feuds().unshift(F);
      keep();
      PE.note(r, { k: 'feud', chose: 'complain', h: a.id, o: b.id, feud: F.id }, rec);
      PE.tell(r, `${a.name} brings a complaint against ${b.name} before the crown of ${short(r.id)}.`, 'court', F.why, [a.id, b.id, pa.id, headOf(b) && headOf(b).id]);
    }
  };

  // ---------------------------------------------------------------- the rungs
  const regard = h => (h.op != null ? h.op : 50);
  PE.judgeOptions = function (r, F) {
    const a = A.S.houses[F.a], b = A.S.houses[F.b], ru = A.P(r.ruler);
    const busy = A.atWar(r.id).length > 0, kinA = ru && ru.house && a.id === ru.house, kinB = ru && ru.house && b.id === ru.house;
    const side = (h, o, kin) => [
      rs('loyalty', (regard(h) - regard(o)) / 20, regard(h) >= regard(o) ? `${h.name} has been the more loyal` : `${h.name} has been the less loyal`, { t: 'regard', id: h.id, r: Math.round(regard(h)) }, 1),
      rs('reckoning', (A.houseStrength(h) / Math.max(1, A.houseStrength(o)) - 1) * .4, `The swords of ${h.name}`, { t: 'swords', id: h.id }, 0),
      kin ? rs('kin', 1, `${h.name} is of his own blood`, { t: 'kin', id: h.id }, 1) : null,
      rs('merit', .3, `The right of ${h.name}'s complaint`, { t: 'right', id: h.id }, 1),
    ].filter(Boolean);
    return [
      { id: 'forA', at: a.id, reasons: side(a, b, kinA) },
      { id: 'forB', at: b.id, reasons: side(b, a, kinB) },
      { id: 'split', at: null, reasons: [rs('duty', .6, 'Justice even-handed', { t: 'justice' }, 1)] },
      { id: 'ignore', at: null, feeds: ['fear'], reasons: [rs('reckoning', busy ? 1 : -.4, busy ? 'He has a war abroad to mind' : 'A quarrel left alone grows', { t: 'busy' }, 1)] },
    ];
  };
  PE.peaceOptions = function (r, F) {
    const a = A.S.houses[F.a], b = A.S.houses[F.b], auth = r.laws && r.laws.authority != null ? r.laws.authority : 1;
    const ratio = crownMen(r) / Math.max(1, A.houseStrength(a) + A.houseStrength(b)), busy = A.atWar(r.id).length > 0;
    return [
      { id: 'enforce', at: null, reasons: [rs('duty', .6 + .4 * auth, 'The king\'s peace is his to keep', { t: 'auth', r: auth }, 1), rs('reckoning', Math.min(2, ratio) - 1, ratio >= 1 ? 'His hosts outnumber both houses' : 'Both houses together match his hosts', { t: 'ratio', r: r2(ratio) }, 0)] },
      { id: 'crush', at: null, feeds: ['anger', 'pride'], reasons: [rs('grudge', .2, 'Lords who make war in his realm', { t: 'defiance' }, 0), rs('reckoning', 1.2 * (Math.min(3, ratio) - 2), 'Strength enough to crush them both', { t: 'ratio', r: r2(ratio) }, 0)] },
      { id: 'let', at: null, feeds: ['fear'], reasons: [rs('reckoning', busy ? 1.4 : .3, busy ? 'A war abroad needs his hosts' : 'Let them bleed each other', { t: 'busy' }, 0), rs('fear', auth <= 0 ? .8 : 0, 'His authority does not reach so far', { t: 'auth', r: auth }, 0)] },
    ];
  };
  const close = (F, how) => { F.end = A.S.year; F.how = how; };
  // a feud's yearly rung (from the realm's month)
  PE.feudTurn = function (F) {
    const S = A.S, r = A.realm(F.r), a = S.houses[F.a], b = S.houses[F.b];
    if (F.end) return;
    if (!r || !r.alive || !a || !b || a.extinct || b.extinct || a.realm !== r.id || b.realm !== r.id) return close(F, 'gone');
    const ru = A.P(r.ruler), pa = headOf(a), pb = headOf(b), parties = [a.id, b.id, pa && pa.id, pb && pb.id];
    if (F.rung === 'complaint') {
      if (!live(ru)) return;
      const rec = ru.id === S.pc ? null : W().decide(ru, 'judge', PE.judgeOptions(r, F), { band: .8, r: r.id, at: F.id });
      if (ru.id === S.pc) { if (!F.asked) { F.asked = 1; A.queue({ type: 'event', ev: 'pe_judge', ctx: { pid: pa && pa.id, fq: F.id, aT: a.name, bT: b.name, whyT: F.why || 'an old quarrel', npcMove: true } }); } return; }
      if (!rec) return;
      F.judged = rec.chose;
      PE.note(r, { k: 'judge', chose: rec.chose, feud: F.id, h: a.id, o: b.id }, rec);
      return PE.afterJudgment(r, F, rec.chose, PE.clean(W().tell(rec, true), 160));
    }
    if (F.rung === 'defied') {
      if (!live(pa)) return close(F, 'dead');
      const loser = F.loser === 'b' ? b : a, other = loser === a ? b : a, pl = headOf(loser);
      if (!live(pl) || pl.id === S.pc) return close(F, 'quiet');
      F.raids = (F.raids || 0) + 1;
      other.op = clamp((other.op || 50) - 2, 0, 100);
      if (other.men) other.men = Math.round(other.men * .97);
      PE.tell(r, `Riders of ${loser.name} burn the villages of ${other.name}.`, 'court', null, parties);
      // the king steps in, or not
      if (!live(ru) || ru.id === S.pc) { F.rung = 'field'; return; }
      const rec = W().decide(ru, 'peace', PE.peaceOptions(r, F), { band: .8, r: r.id, at: F.id });
      if (!rec) return;
      PE.note(r, { k: 'peace', chose: rec.chose, feud: F.id, h: a.id, o: b.id }, rec);
      const told = PE.clean(W().tell(rec, true), 160);
      if (rec.chose === 'enforce') { for (const h of [a, b]) h.op = clamp((h.op || 50) - 4, 0, 100); r.treasury = (r.treasury || 0) + Math.round((r.income || 0) * .02); PE.tell(r, `The crown of ${short(r.id)} summons ${a.name} and ${b.name}, fines both and enforces its peace.`, 'court', told, parties); return close(F, 'enforced'); }
      if (rec.chose === 'crush') { for (const h of [a, b]) { h.op = clamp((h.op || 50) - 12, 0, 100); if (h.men) h.men = Math.round(h.men * .85); } r.legit = Math.min(100, (r.legit || 0) + 2); PE.tell(r, `The crown of ${short(r.id)} sends its host against both ${a.name} and ${b.name}. Every lord learns to fear it.`, 'realm', told, parties); return close(F, 'crushed'); }
      F.rung = 'field';
      PE.tell(r, `The crown of ${short(r.id)} lets ${a.name} and ${b.name} fight it out.`, 'court', told, parties);
      return;
    }
    if (F.rung === 'field') {
      const sa = A.houseStrength(a), sb = A.houseStrength(b);
      // lint-reasons: ok (a battle's outcome: the stronger house is likelier to win the field; no one decides it)
      const aWins = A.rand() < sa / Math.max(1, sa + sb);
      const win = aWins ? a : b, lose = aWins ? b : a, pw = headOf(win);
      if (live(pw)) pw.fame = Math.min(100, (pw.fame || 0) + 3);
      lose.op = clamp((lose.op || 50) - 6, 0, 100);
      if (lose.men) lose.men = Math.round(lose.men * .8);
      if (A.CMD && A.CMD.grieve) A.CMD.grieve(lose, 'feud', `beaten in the field by ${win.name}`);
      PE.note(r, { k: 'field', chose: aWins ? 'a' : 'b', feud: F.id, h: win.id, o: lose.id, n: 2, why: `The swords of each house; the field went to ${win.name}` });
      PE.tell(r, `${win.name} beats ${lose.name} in the field. ${lose.name} submits.`, 'realm', null, parties);
      return close(F, 'field');
    }
  };
  // what a judgment does: the loser's grievance with the crown, and his answer
  PE.afterJudgment = function (r, F, how, told) {
    const S = A.S, a = S.houses[F.a], b = S.houses[F.b], pa = headOf(a), pb = headOf(b), parties = [a.id, b.id, pa && pa.id, pb && pb.id];
    if (how === 'split') { for (const h of [a, b]) h.op = clamp((h.op || 50) - 2, 0, 100); PE.tell(r, `The crown of ${short(r.id)} splits the quarrel of ${a.name} and ${b.name}.`, 'court', told, parties); return close(F, 'split'); }
    const loser = how === 'forA' ? b : how === 'forB' ? a : a;
    if (how !== 'ignore') {
      loser.op = clamp((loser.op || 50) - 6, 0, 100);
      if (A.CMD && A.CMD.grieve) A.CMD.grieve(loser, 'judged', `a judgment given against him for ${(loser === a ? b : a).name}`);
      PE.tell(r, `The crown of ${short(r.id)} judges for ${(loser === a ? b : a).name} against ${loser.name}.`, 'court', told, parties);
    } else PE.tell(r, `The crown of ${short(r.id)} will not hear the quarrel of ${a.name} and ${b.name}.`, 'court', told, parties);
    const pl = headOf(loser);
    F.loser = loser === a ? 'a' : 'b';
    if (!live(pl) || pl.id === S.pc) return close(F, 'judged');
    const busy = A.atWar(r.id).length > 0, ratio = A.houseStrength(loser) / Math.max(1, A.houseStrength(loser === a ? b : a));
    const rec = W().decide(pl, 'feud', [
      { id: 'accept', at: r.id, feeds: ['fear'], reasons: [rs('loyalty', 1.2, 'The crown has spoken', { t: 'crown' }, 1), rs('fear', how === 'ignore' ? 0 : .5, 'The crown would punish defiance', { t: 'auth' }, 0)] },
      { id: 'defy', at: (loser === a ? b : a).id, feeds: ['anger', 'pride', 'grudge'], reasons: [
        rs('insult', how === 'ignore' ? .6 : 1, how === 'ignore' ? 'The crown would not even hear him' : 'A judgment he holds unjust', { t: 'judgment', id: how }, 1),
        rs('reckoning', (ratio - 1) * .8, ratio >= 1 ? 'His men outnumber theirs' : 'Their men outnumber his', { t: 'ratio', r: r2(ratio) }, 0),
        busy ? rs('reckoning', .5, 'The crown is busy with a war abroad', { t: 'busy' }, 1) : null,
      ].filter(Boolean) },
    ], { band: .8, r: r.id, at: F.id, logIf: x => x.chose === 'defy' });
    if (!rec || rec.chose === 'accept') return close(F, 'accepted');
    F.rung = 'defied';
    PE.note(r, { k: 'feud', chose: 'defy', feud: F.id, h: loser.id }, rec);
    PE.tell(r, `${loser.name} sends a formal defiance to ${(loser === a ? b : a).name}. A private war in ${short(r.id)}.`, 'realm', PE.clean(W().tell(rec, true), 160), parties);
  };
  // the ruling player's judgment (pe_judge's effect)
  PE.pcJudge = function (fid, how) {
    const F = PE.feuds().find(x => x.id === fid), r = F && A.realm(F.r);
    if (!F || !r || F.end) return;
    F.judged = how;
    PE.note(r, { k: 'judge', chose: how, feud: F.id, n: 2, why: 'Judged by the ruler himself' });
    PE.afterJudgment(r, F, how, '');
  };

  // ---------------------------------------------------------------- a border war (a march lord's own)
  PE.borderYear = function (r) {
    if (!r || !r.alive || r.isRebel || !A.CMD || !A.CMD.march) return;
    for (const h of A.CMD.tics(r.id)) {
      const hp = headOf(h);
      if (!live(hp) || hp.id === A.S.pc || !A.CMD.march(h)) continue;
      const foes = A.CMD.near(h).filter(o => { const x = A.realm(o); return x && x.alive && !x.isRebel && !A.hostile(r.id, o) && !(r.truce && r.truce[o] > A.S.year) && A.relBetween(r.id, o) < -50; });
      if (!foes.length || PE.feuds().some(f => !f.end && f.k === 'border' && f.a === h.id)) continue;
      const o = foes[0], T = W().temper(hp), raided = PE.feuds().some(f => f.k === 'border' && f.o === r.id && A.S.year - f.y <= 3);
      const rec = W().decide(hp, 'raid', [
        { id: 'raid', at: o, feeds: ['anger', 'pride', 'greed'], reasons: [
          rs('grudge', Math.min(1.5, (-A.relBetween(r.id, o) - 50) / 25), `Bad blood across the border with ${short(o)}`, { t: 'hostility', at: o, r: A.relBetween(r.id, o) }, 1),
          rs('ambition', .3 + .6 * (T.ambition || 0), 'Cattle, ransoms and a name', { t: 'plunder' }, 0),
          raided ? rs('grudge', 1.2, `Raiders out of ${short(o)} burned his villages`, { t: 'raided', at: o }, 1) : null,
        ].filter(Boolean) },
        { id: 'hold', at: o, feeds: ['fear'], reasons: [rs('loyalty', 2.4, 'The king\'s peace with the neighbours', { t: 'peace' }, 1), rs('fear', .8, 'A raid answered is a war', { t: 'risk' }, 0)] },
      ], { band: 1, r: r.id, at: o, logIf: x => x.chose === 'raid' });
      if (!rec || rec.chose !== 'raid') continue;
      const F = { id: 'Q' + (A.S.nextFeud = (A.S.nextFeud || 0) + 1), k: 'border', r: r.id, a: h.id, o, y: A.S.year, rung: 'raid', why: PE.clean(W().tell(rec, true), 160) };
      feuds().unshift(F); keep();
      A.addRel && A.addRel(o, r.id, -6);
      PE.note(r, { k: 'raid', chose: 'raid', h: h.id, o, feud: F.id }, rec);
      PE.tell(r, `${h.name}, a march lord of ${short(r.id)}, raids across the border into ${short(o)}.`, 'realm', F.why, [h.id, hp.id]);
      PE.borderAnswer(r, F);
      return;
    }
  };
  // the pull of war on o at r's council this year, as a reason (logit of A.WHY.warOdds; not thinkable: very heavy against)
  const warPull = (r, o) => {
    const x = A.WHY && A.WHY.warOdds ? A.WHY.warOdds(r.id, o.id) : null;
    if (x == null) return rs('reckoning', -3, `No cause for war with ${short(o.id)} his council would accept`, { t: 'council', at: o.id }, 0);
    const q = clamp(x, .01, .99);
    return rs('reckoning', Math.log(q / (1 - q)), `His council's count of a war with ${short(o.id)}`, { t: 'council', at: o.id, r: r2(q) }, 0);
  };
  // each king decides what to do with his own man's war
  PE.borderAnswer = function (r, F) {
    const ru = A.P(r.ruler), h = A.S.houses[F.a], o = A.realm(F.o);
    if (!live(ru) || ru.id === A.S.pc || !h || !o) { F.rung = 'border'; return; }
    const ratio = A.realmPower(r) / Math.max(1, A.realmPower(o)), busy = A.atWar(r.id).length > 0, rel = A.relBetween(r.id, o.id);
    const rec = W().decide(ru, 'border', [
      { id: 'disown', at: o.id, reasons: [rs('reckoning', busy ? 1 : .4, busy ? 'A war abroad already' : 'A raid is not worth a war', { t: 'busy' }, 0), rs('coin', -.3, 'The damages paid', { t: 'damages' }, 0), rs('duty', .4, 'The peace between the crowns', { t: 'peace', at: o.id }, 1)] },
      // backing him is a war: weighed as his war council weighs one (A.WHY.warOdds, the pull of war on them this year),
      // with his man's raid as the occasion
      { id: 'back', at: o.id, feeds: ['anger', 'pride'], reasons: [warPull(r, o), rs('grudge', .5, `His march lord's raid gives him the occasion`, { t: 'occasion', id: h.id }, 1), busy ? rs('reckoning', -2, 'A war abroad already', { t: 'busy' }, 0) : null].filter(Boolean) },
      { id: 'leave', at: o.id, reasons: [rs('reckoning', .7, 'Let the march lords settle it with their own men', { t: 'march' }, 0)] },
    ], { band: .8, r: r.id, at: F.id });
    if (!rec) return;
    F.king = rec.chose;
    PE.note(r, { k: 'border', chose: rec.chose, feud: F.id, h: h.id, o: o.id }, rec);
    const told = PE.clean(W().tell(rec, true), 160);
    if (rec.chose === 'disown') {
      const pay = Math.round((r.income || 0) * .03);
      r.treasury = (r.treasury || 0) - pay; o.treasury = (o.treasury || 0) + pay;
      h.op = clamp((h.op || 50) - 8, 0, 100);
      if (A.CMD && A.CMD.grieve) A.CMD.grieve(h, 'disowned', `disowned by the crown for his raid into ${short(o.id)}`);
      PE.tell(r, `The crown of ${short(r.id)} disowns the raid of ${h.name} and pays ${short(o.id)} for the damage.`, 'realm', told, [h.id]);
      return close(F, 'disowned');
    }
    if (rec.chose === 'back') {
      const w = A.startWar(r.id, o.id, null, 'incident');
      if (w) { w.kind = 'border'; w.feud = F.id; }
      PE.tell(r, `The crown of ${short(r.id)} backs its march lord: war with ${short(o.id)}.`, 'world', told, [h.id]);
      return close(F, 'war');
    }
    F.rung = 'border';
    PE.tell(r, `A border war between the march lords of ${short(r.id)} and ${short(o.id)}; the crowns stay at peace.`, 'realm', told, [h.id]);
  };
  // a border war burns a year or two, then the march lords tire of it
  PE.borderTurn = function (F) {
    const r = A.realm(F.r), o = A.realm(F.o), h = A.S.houses[F.a];
    if (F.end) return;
    if (!r || !o || !h || !r.alive || !o.alive) return close(F, 'gone');
    if (F.rung !== 'border') return;
    F.raids = (F.raids || 0) + 1;
    A.addRel && A.addRel(o.id, r.id, -3);
    r.exhaustion = Math.min(100, (r.exhaustion || 0) + 1);
    o.exhaustion = Math.min(100, (o.exhaustion || 0) + 1);
    if (F.raids >= 2 || A.hostile(r.id, o.id)) close(F, A.hostile(r.id, o.id) ? 'war' : 'spent');
  };

  // ---------------------------------------------------------------- the army's quarrel (precedence)
  // called by W1-3's A.CMD.chooseCommand when a commission sets a General of lesser birth over great lords
  PE.quarrel = function (a, h, g) {
    const hp = headOf(h), r = A.realm(a.realm);
    if (!live(hp) || hp.id === A.S.pc || !r) return null;
    const w = (A.S.wars || []).find(x => x.att.includes(r.id) || x.def.includes(r.id));
    const atBorder = w && A.CMD.near(h).some(x => (A.warSide(w, r.id) === 'att' ? w.def : w.att).includes(x));
    const rec = W().decide(hp, 'quarrel', [
      { id: 'obey', at: g ? g.id : null, reasons: [rs('duty', 1.4, 'His oath and the king\'s commission', { t: 'oath' }, 1), atBorder ? rs('claim', 1.2, 'The war is at his own border', { t: 'border' }, 1) : null].filter(Boolean) },
      { id: 'slow', at: g ? g.id : null, feeds: ['pride'], reasons: [rs('insult', .8, `Under ${g ? A.fullName(g, false) : 'a General'}, a man of lesser birth`, { t: 'precedence', id: g ? g.id : null }, 1), rs('grudge', ((50 - (h.op || 50)) / 25), 'His grievance with the crown', { t: 'opinion', id: h.id }, 1)] },
      { id: 'home', at: g ? g.id : null, feeds: ['pride', 'anger'], reasons: [rs('insult', .6, 'He will not serve under such a man', { t: 'precedence', id: g ? g.id : null }, 1), rs('fear', -1, 'Taking his host home is close to treason', { t: 'risk' }, 0)] },
    ], { band: .8, r: r.id, at: a.id, logIf: x => x.chose !== 'obey' });
    if (!rec || rec.chose === 'obey') return rec;
    PE.note(r, { k: 'quarrel', chose: rec.chose, h: h.id, army: a.id }, rec);
    const ds = A.CMD.divs(A.CMD.house(h)).filter(d => d.army === a.id && !A.CMD.held(d));
    if (rec.chose === 'home' && w) { for (const d of ds) { A.CMD.hold(d, w, null); A.CMD.withdraw(d); } }
    else if (rec.chose === 'slow' && w) for (const d of ds) A.CMD.hold(d, w, A.CMD.now() + 30);
    PE.tell(r, rec.chose === 'home' ? `${h.name} takes ${hp.sex === 'F' ? 'her' : 'his'} host home rather than serve under ${g ? A.fullName(g, false) : 'the General'}.` : `${h.name}'s host comes late and slow to ${g ? A.fullName(g, false) : 'the General'}'s orders.`, 'court', PE.clean(W().tell(rec, true), 160), [h.id, hp.id]);
    return rec;
  };
})();
