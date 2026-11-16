// W1-4: following, desertion and mutiny (docs/design/war.md §10.4; D-064 point 8; D-089).
//
// Every company in the field keeps a short ledger of what holds it and what pulls at it, each line with its source:
//   holds  the oath (sworn men), pay on the day (enlisted men), the cause (their own doors, their faith), a captain who
//          wins, each other (time served together), plunder hoped for, the provost's rope, deep enemy country (few dare)
//   pulls  hunger (the war map's supply), pay in arrears (an empty treasury), the harvest at home (conscripts and roll men
//          in the reaping months), a defeat and friends dead (half the company gone), winter, a term served and still held,
//          home near and easy to reach
// It is read once a month for each division in an army of a realm at war (a few hundred at most; nothing else).
// Desertion is men leaving one by one: the share that goes is worked out from the ledger, with no dice, and the kind of
// men sets how readily (conscripts first and most, sworn men last and least). Every desertion is written with the two
// heaviest pulls that made it (A.S.deserts, bounded). Deserters have fates: a third are taken and hanged, a third take to
// the woods as brigands, a third creep home and hide (a conscript's count goes back to his call's hearths).
// A mutiny is a company refusing as a body and needs three things, each with a name: a grievance (pay, bread, a broken
// term), a voice (an old soldier or sergeant the others follow: a company with time served together or veterans in it)
// and an occasion (a defeat, the term's end, winter quarters, the harvest month, pay day missed). It climbs a rung a month
// while all three stand (grumbling, a deputation to the captain, refusal, leaving in a body) and falls back when one
// goes. At the deputation the commander decides through A.WHY (kind 'mutiny'): pay, promise, punish the voice, give way,
// or stand in front of them and speak; each has its price.
// State (all optional): d.mut { lv, why, voice, since }, d.led (the last reading, kept small), A.S.deserts (bounded),
// A.S.mutinies (bounded), r.arrears (months the treasury has been empty while at war).
(function () {
  const L = A.LEDGER = A.LEDGER || {};
  const M = A.MEN;
  L.T = Object.assign({
    rate: .02,           // the share of a conscript company a month that goes when the pulls outweigh the holds by one; by
                         // the gap to the power 1.5 (by two: about 6 in 100 a month; by three: about 10)
    KIND: { conscript: 1, roll: .6, enlisted: .35, sworn: .03 },
    keep: 40,            // desertions and mutinies kept
    min: 25,             // a desertion smaller than this is not written down
  }, L.T || {});
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const r2 = x => Math.round(x * 100) / 100;
  const month = () => (A.monthOf && A.today ? A.monthOf(A.today()).m : 0);
  const now = () => (A.absDay ? A.absDay() : A.S.year * 365);
  const hashId = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const GRIEF = { arrears: 1, hunger: 1, held: 1, harvest: 1 };   // the pulls that are a grievance a company can name

  // the ledger of one division: { holds: [[label, w, key]], pulls: [[label, w, key]], net, kind }
  L.read = function (d, o) {
    o = o || {};
    const r = A.realm(d.r);
    if (!r) return null;
    const kind = M.kindOf(d), mo = month(), P = d.loc != null ? A.S.prov[d.loc] : null;
    const call = d.call && A.CALLS ? A.CALLS.byId(d.call) : null;
    const holds = [], pulls = [];
    const h = (l, w, k) => { if (w > .02) holds.push([l, r2(w), k]); };
    const p = (l, w, k) => { if (w > .02) pulls.push([l, r2(w), k]); };
    // holds
    if (kind === 'sworn') h('The oath to their own lord', 2.5, 'oath');
    if (kind === 'enlisted' && !(r.arrears > 0)) h('Pay received on the day', 1.2, 'pay');
    const home = P && P.owner === d.r;
    const soil = A.CALLS && call && call.need.t === 'home';
    if (home && (soil || (A.CALLS && A.CALLS.onSoil(d.r).men > 0))) h('Their own doors to defend', 1.5, 'cause');
    const w = A.atWar(d.r)[0];
    if (w && /holy/i.test(w.cb || '')) h('Their faith', .8, 'faith');
    const g = A.divGen ? A.divGen(d) : null;
    if (g && A.skill(g, 'command') >= 55) h('A captain who knows his trade', .6, 'captain');
    if ((d.wins || 0) > (d.losses || 0)) h('They have won', .4 + .2 * Math.min(3, (d.wins || 0) - (d.losses || 0)), 'wins');
    const years = Math.max(0, A.S.year - (d.born || A.S.year));
    if (years >= 1) h('Each other: years served together', .3 * Math.min(3, years), 'comrades');
    if (P && !home && A.ctrl && A.ctrl(P) !== d.r) h('Deep in enemy country, few dare', .8, 'far');
    if (P && !home && w && A.warSide(w, d.r) === 'att') h('Plunder hoped for', .3, 'plunder');
    if (r.laws && r.laws.authority >= 2) h('Fear of the provost', .5, 'provost');
    // pulls
    const sr = d.sr != null ? d.sr : 1;
    if (sr < .7) p(sr < .35 ? 'Hunger: bread promised and not come' : 'Short rations', (1 - sr) * 2.4, 'hunger');
    if (r.arrears > 0 && kind !== 'sworn') p(`Pay in arrears ${r.arrears} month${r.arrears === 1 ? '' : 's'}`, .8 * Math.min(4, r.arrears) * (kind === 'conscript' ? .4 : 1), 'arrears');
    if ((kind === 'conscript' || kind === 'roll') && A.CALLS && A.CALLS.T.reap.includes(mo)) p('The harvest at home', 1.4, 'harvest');
    const s = A.divS ? A.divS(d) : null, full = s ? Math.min(s.men, d.call && A.CALLS ? A.CALLS.T.divMen : s.men) : d.men;
    if (full > 0 && d.men < full * .55) p('Friends dead: half the company gone', 1, 'losses');
    if ((d.losses || 0) > (d.wins || 0)) p('A defeat', .5 + .2 * Math.min(3, (d.losses || 0) - (d.wins || 0)), 'defeat');
    if (mo >= 10 || mo <= 1) p('Winter in the field', .5, 'winter');
    if (call && call.held) p('Their term is up, and still they are held', 2, 'held');
    if (home && kind === 'conscript') p('Home near and easy to reach', .9, 'near');
    if (o.unpaid) p(`Pay in arrears ${o.unpaid} months`, .8 * Math.min(4, o.unpaid), 'arrears');
    holds.sort((a, b) => b[1] - a[1]); pulls.sort((a, b) => b[1] - a[1]);
    const net = r2(holds.reduce((a, x) => a + x[1], 0) - pulls.reduce((a, x) => a + x[1], 0));
    return { kind, holds, pulls, net };
  };

  // the share that deserts this month: none while the holds outweigh the pulls; then it grows with the gap, by kind
  L.rate = (led) => led.net >= 0 ? 0 : clamp(L.T.rate * L.T.KIND[led.kind] * Math.pow(Math.min(4, -led.net), 1.5), 0, .2);

  // ---------------------------------------------------------------- mutiny: grievance, voice, occasion
  L.parts = function (d, led, o) {
    o = o || {};
    const gr = led.pulls.find(x => GRIEF[x[2]] && x[1] >= 1.2);
    const years = Math.max(0, A.S.year - (d.born || A.S.year));
    const months = Math.max(0, (now() - (d.mustered || (d.born || A.S.year) * 365)) / 30.4);
    const voice = led.kind === 'sworn' ? null : (d.exp || 0) >= 18 || years >= 1 || months >= 4 ? L.voiceName(d) : null;
    const mo = month();
    const call = d.call && A.CALLS ? A.CALLS.byId(d.call) : null;
    const occ = o.occasion || (d.lostNow ? 'a defeat' : call && call.until != null && Math.abs(now() - call.until) < 31 ? 'the end of their term' : (mo === 10 || mo === 11) && !(d.path && d.path.length) ? 'winter quarters' : A.CALLS && A.CALLS.T.reap.includes(mo) && led.kind !== 'sworn' && led.kind !== 'enlisted' ? 'the harvest month' : A.realm(d.r) && A.realm(d.r).arrears === 1 ? 'pay day missed' : null);
    return { grievance: gr ? gr[0] : null, voice, occasion: occ };
  };
  const SURN = ['Hale', 'Brandt', 'Corve', 'Dunmore', 'Esker', 'Fenn', 'Garrow', 'Holt', 'Ivell', 'Jessop', 'Kerr', 'Lowe', 'Marrick', 'Nash', 'Orme', 'Pell', 'Quill', 'Rook', 'Stave', 'Thorne'];
  L.voiceName = d => `${(hashId(d.id) >> 3) % 3 ? 'Sergeant' : 'old'} ${SURN[hashId(d.id + ':v') % SURN.length]}`;
  L.RUNGS = ['', 'grumbling', 'a deputation to the captain', 'refusal', 'leaving in a body'];
  const keep = k => { const S = A.S; if (!Array.isArray(S[k])) S[k] = []; return S[k]; };
  const write = (k, e) => { const Lk = keep(k); Lk.unshift(e); if (Lk.length > L.T.keep) Lk.length = L.T.keep; };

  // the commander's answer at the deputation (kind 'mutiny'), through A.WHY
  L.answerOptions = function (d, r, parts, led) {
    const rs = (kind, weight, label, source, pub) => ({ kind, weight: r2(weight), label, source: Object.assign({ d: d.id }, source || {}), pub: pub ? 1 : 0 });
    const g = A.divGen ? A.divGen(d) : null, cmd = g ? A.skill(g, 'command') : 30;
    const feared = r.laws && r.laws.authority >= 2;
    const loyal = (A.armyDivs && d.army ? A.armyDivs(A.army(d.army)) : []).some(x => x !== d && M.kindOf(x) === 'sworn');
    const owed = parts.grievance && /arrears/i.test(parts.grievance), coin = (r.treasury || 0) > (d.men || 0) * 2;
    return [
      { id: 'pay', reasons: [rs('coin', coin ? -.3 : -3, coin ? 'Coin spent on a company that threatens' : 'There is no coin', { t: 'treasury' }, 0), owed ? rs('duty', 1, 'What is owed is owed', { t: 'arrears' }, 1) : rs('reckoning', -.5, 'Coin does not mend this grievance', { t: 'grievance' }, 0)] },
      { id: 'promise', reasons: [rs('reckoning', .4, 'A promise costs nothing today', { t: 'promise' }, 0), d.promised ? rs('fear', -1.2, 'They remember the last promise', { t: 'promise' }, 1) : null].filter(Boolean) },
      { id: 'punish', reasons: [rs('insult', .6, 'Mutiny is not to be borne', { t: 'temper' }, 0), rs('reckoning', feared && loyal ? .8 : -1.2, feared && loyal ? 'Loyal men at hand, and the provost feared' : 'No loyal men at hand to do it', { t: 'force' }, 0)] },
      { id: 'yield', reasons: [rs('reckoning', -.8, 'Giving way is remembered by every company', { t: 'yield' }, 0), led.kind === 'conscript' ? rs('kin', .5, 'They are farmers, not soldiers', { t: 'kind' }, 0) : null].filter(Boolean) },
      { id: 'speak', reasons: [rs('merit', (cmd - 50) / 20, cmd >= 50 ? 'A captain they will hear' : 'A captain they do not trust', { t: 'command', id: Math.round(cmd) }, 0)] },
    ];
  };
  L.answer = function (d, r, parts, led, o) {
    o = o || {};
    const g = A.divGen ? A.divGen(d) : null;
    const rec = A.WHY.decide(g || r.id, 'mutiny', L.answerOptions(d, r, parts, led), { band: 1, r: r.id, at: d.id, rand: o.rand, log: false });
    const m = d.mut, ch = rec ? rec.chose : 'promise';
    const g0 = A.divGen ? A.divGen(d) : null, cmd = g0 ? A.skill(g0, 'command') : 30;
    const feared = r.laws && r.laws.authority >= 2;
    if (ch === 'pay') { r.treasury = (r.treasury || 0) - (d.men || 0) * 2; r.arrears = 0; m.lv = 0; }
    else if (ch === 'promise') { m.lv = Math.max(0, m.lv - 1); d.promised = A.S.year; }
    else if (ch === 'punish') m.lv = feared ? 0 : Math.min(4, m.lv + 1);
    else if (ch === 'yield') { m.lv = 0; m.gone = 1; }   // given way: the company is let go home (L.month sends it)
    else if (ch === 'speak') m.lv = cmd >= 50 ? Math.max(0, m.lv - 1) : Math.min(4, m.lv + 1);
    m.ans = ch;
    return ch;
  };

  // one division's month: desertion, then the mutiny's rung
  L.month = function (d, o) {
    o = o || {};
    const r = A.realm(d.r);
    if (!r || !d.men) return null;
    const led = L.read(d, o);
    if (!led) return null;
    d.led = [led.net, led.pulls.slice(0, 2).map(x => x[2]).join(',')];
    const rate = L.rate(led);
    let n = Math.round(d.men * rate);
    if (n > 0 && d.men - n < 50) n = Math.max(0, d.men - 50);
    if (n > 0) {
      A.divLose(d, n);
      const call = d.call && A.CALLS ? A.CALLS.byId(d.call) : null;
      if (call) { call.home = (call.home || 0) + Math.round(n / 3); call.gone = (call.gone || 0) + Math.round(n / 3); }
      else if (led.kind !== 'sworn') r.roll = (r.roll || 0) + Math.round(n / 3);
      if (n >= L.T.min) write('deserts', { y: A.S.year, d: d.id, r: d.r, k: led.kind, n, why: led.pulls.slice(0, 2).map(x => x[0]) });
      L.count(d.r, led.kind, n);
    }
    // the mutiny
    const parts = L.parts(d, led, o);
    const m = d.mut = d.mut || { lv: 0 };
    if (parts.grievance && parts.voice && parts.occasion) {
      m.lv = Math.min(4, m.lv + 1); m.why = parts.grievance; m.voice = parts.voice; m.occ = parts.occasion; m.since = m.since || A.S.year;
      if (m.lv === 2) L.answer(d, r, parts, led, o);
      if (m.lv >= 3) d.org = 0;   // refusal: the company will not march or fight
      if (m.lv >= 2) write('mutinies', { y: A.S.year, d: d.id, r: d.r, k: led.kind, lv: m.lv, why: [m.why, `the voice of ${m.voice}`, m.occ], ans: m.ans || null });
      if (m.lv >= 4 || m.gone) { L.leave(d, r, m.gone ? 'yield' : 'leave'); return { led, n, mut: m.gone ? 2 : 4 }; }
    } else if (m.lv > 0) m.lv--;
    if (!m.lv) delete d.mut;
    return { led, n, mut: m.lv || 0 };
  };
  // a company leaving in a body: conscripts go home, the roll's and enlisted men too (a deserter's fate is theirs now)
  L.leave = function (d, r, how) {
    const call = d.call && A.CALLS ? A.CALLS.byId(d.call) : null;
    const yielded = how === 'yield';
    if (call) { call.home = (call.home || 0) + Math.round(d.men / (yielded ? 1 : 2)); if (!yielded) call.gone = (call.gone || 0) + Math.round(d.men / 2); }
    else if (yielded) r.roll = (r.roll || 0) + Math.round(d.men * .8);
    if (!yielded) L.count(d.r, M.kindOf(d), d.men, 1);
    else { const S = A.S, t = S.desertTally = S.desertTally || {}; t.yielded = (t.yielded || 0) + 1; }
    if (A.CMD && A.CMD.withdraw && d.army) A.CMD.withdraw(d);
    d.men = 0;
    A.divRemove(d);
    A.forcesSync(r);
  };
  // the realm's tally of deserters (the world record, the tests)
  L.count = function (rid, kind, n, mut) {
    const S = A.S, t = S.desertTally = S.desertTally || {};
    const k = kind || 'enlisted';
    t[k] = (t[k] || 0) + n;
    if (mut) t.mutinies = (t.mutinies || 0) + 1;
  };

  // the month: each division in an army of a realm at war; and the treasury's arrears
  L.tick = function () {
    const S = A.S;
    if (!S || !S.realms) return;
    for (const id of Object.keys(S.realms)) {
      const r = S.realms[id];
      if (!r || r.alive === false) continue;
      const war = A.atWar(id).length > 0;
      r.arrears = war && (r.treasury || 0) < 0 ? (r.arrears || 0) + 1 : 0;
      if (!r.arrears) delete r.arrears;
      if (!war || !r.forces) continue;
      for (const d of r.forces.divs.slice()) if (d && d.army && !d.elite) L.month(d);
    }
  };
  // a division that lost a battle this month has its occasion (read by L.parts, cleared monthly)
  A.onMonth.push(function () { try { for (const id of Object.keys(A.S.realms || {})) { const r = A.S.realms[id]; for (const d of (r && r.forces && r.forces.divs) || []) { if (d.lostNow) delete d.lostNow; if (d.lossSeen == null) d.lossSeen = d.losses || 0; else if ((d.losses || 0) > d.lossSeen) { d.lostNow = 1; d.lossSeen = d.losses; } } } } catch (e) { console.error('[ledger] losses', e); } });
  A.onMonth.push(function () { try { L.tick(); } catch (e) { console.error('[ledger] month', e); } });

  // the ledger in words, for the player within his company (no numbers)
  L.words = function (d) {
    const led = L.read(d);
    if (!led) return null;
    const lean = led.net >= 2 ? 'The company holds together.' : led.net >= 0 ? 'The company holds, just.' : led.net >= -1.5 ? 'Men slip away at night.' : 'The company is coming apart.';
    const m = d.mut && d.mut.lv ? `There is ${L.RUNGS[d.mut.lv]} over ${String(d.mut.why || '').toLowerCase()}, and ${d.mut.voice} speaks for them.` : '';
    return { lean, holds: led.holds.slice(0, 3).map(x => x[0]), pulls: led.pulls.slice(0, 3).map(x => x[0]), mut: m, kind: led.kind };
  };
})();
