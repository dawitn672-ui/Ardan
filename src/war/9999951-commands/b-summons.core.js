// W1-3: the summons, the muster, the king's command and what follows (docs/design/war.md §9.1, §9.3, §9.4; D-064 points
// 2, 5 and 6; D-081). Every decision here goes through A.WHY.decide with named reasons (rule 18, D-069).
//
//   A.CMD.summon(w)            when the crown goes to war (warStart), each tenant-in-chief answers: in full, with part,
//                              late, by a deputy, with coin, or not at all. The muster (A.S.musters) keeps each answer with
//                              the reason he gave and the true one. A contingent that stays home holds its hosts back
//                              (d.hold: the war map's mobilising passes them by); a late one comes on its day.
//   A.CMD.chooseCommand(a)     an army of two hosts or more: the king leads it in person, commissions one General by his
//                              written word for this war (army:<id>, which already exists), or names nobody and his
//                              Generals hold a council of war (slower: a day longer to agree each order).
//   A.CMD.sentence(m, e)       a refusal is a grievance the crown records; the king decides how far he dares punish it
//                              (accept, fine, hostages, strip a command, forsworn, attaint), as far as his strength reaches;
//                              the lord answers (submit, sulk, league).
//   seasons                    a lord's men serve the first season at his own cost; after it the crown pays, or he weighs
//                              again each season whether to take them home.
//   border                     a march lord whose men stayed home raises them when the enemy stands on his border.
// State (all optional; old saves load): A.S.musters (bounded), d.own, d.hold, a.cmdBy, a.king, a.cmdWhy, h.cmRef, h.cmGr,
// w.kind, r.cmdDeal.
(function () {
  const CM = A.CMD;
  if (!CM) return;
  CM.on = true;
  Object.assign(CM.T, {
    season: 182,        // days in a campaigning season
    scutPerMan: 6,      // shield money for each man of a house's full strength (the polity's muster: 2 x 3)
    payPerMan: 4,       // the crown's pay a season for each man of a contingent past its first season
    keepMusters: 12,    // musters kept (each a war and a realm): a live war's first, then the newest of ended wars
    sumBand: 1.5,       // the summons: options within this of the best go to the draw
    cmdBand: 1,         // the king's choice of command
    senBand: 1,         // the sentence
  });
  const W = () => A.WHY;
  const live = p => !!(p && p.alive);
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const r2 = x => Math.round(x * 100) / 100;
  const ln = x => Math.log(Math.max(1e-6, x));
  const clean = (s, n) => String(s == null ? '' : s).replace(/[<>"{}]/g, '').replace(/\s+/g, ' ').trim().slice(0, n || 120);
  const short = id => (A.realm(id) ? A.realmShort(id) : String(id || ''));
  const now = () => A.S.year * 365 + (A.today ? A.today() : 0);
  const month = () => Math.floor((A.today ? A.today() : 0) / 30.42);
  CM.now = now;
  const warLive = id => (A.S.wars || []).some(w => w.id === id);
  CM.ANSWERS = ['full', 'part', 'late', 'deputy', 'coin', 'refuse'];
  CM.WORDS = { full: 'came in full', part: 'came with part of his men', late: 'came late', deputy: 'sent a deputy', coin: 'sent coin instead of men', refuse: 'refused', home: 'took his men home', ask: 'has not yet answered' };

  // ---------------------------------------------------------------- holding a contingent back
  CM.held = function (d) {
    const h = d && d.hold;
    if (!h) return false;
    if (!warLive(h.w)) return false;
    return h.u == null || now() < h.u;
  };
  const hold = (d, w, until) => { d.hold = { w: w.id || w, u: until == null ? null : until }; };
  // take a division out of its army (a man going home). Not while it fights or sits before a wall: next month.
  CM.withdraw = function (d) {
    if (!d || !d.army) return true;
    if (d.atk != null || d.sieging || (A.S.fights && A.S.fights[d.loc])) return false;
    const a = A.army(d.army);
    d.army = null;
    if (a) { a.divs = a.divs.filter(x => x !== d.id); if (a.divs.length) A.armySync(a); }
    d.path = []; d.prog = 0; d.plan = 0;
    if (A.locDirty) A.locDirty();
    return true;
  };

  // ---------------------------------------------------------------- the muster store (bounded)
  const store = () => { const S = A.S; if (!Array.isArray(S.musters)) S.musters = []; return S.musters; };
  CM.musters = () => (A.S && Array.isArray(A.S.musters) ? A.S.musters : []);
  CM.musterOf = (wid, rid) => CM.musters().find(m => m.w === wid && m.r === rid) || null;
  CM.store = store;
  CM.hold = hold;
  const keep = function () {
    const L = store();
    if (L.length <= CM.T.keepMusters) return;
    // drop the oldest of ended wars first; a live war's muster goes only past twice the bound (it is still read)
    for (let i = L.length - 1; i >= 0 && L.length > CM.T.keepMusters; i--) if (!warLive(L[i].w)) L.splice(i, 1);
    if (L.length > CM.T.keepMusters * 2) L.length = CM.T.keepMusters * 2;
  };

  // ---------------------------------------------------------------- the facts a lord weighs
  CM.facts = function (h, r, w) {
    const S = A.S, side = A.warSide(w, r.id), foes = side === 'att' ? w.def : w.att;
    const hp = h.headPid != null ? A.P(h.headPid) : null;
    const near = CM.near(h), P = CM.seatProv(h);
    const foeAt = near.filter(x => foes.includes(x));
    const hostile = near.filter(x => !foes.includes(x) && x !== r.id && ((A.hostile && A.hostile(r.id, x)) || (A.relBetween && A.relBetween(r.id, x) < -40)));
    const fac = (S.factions || []).find(f => f && f.realm === r.id && Array.isArray(f.members) && f.members.includes(h.id));
    const cap = r.capitalProv != null && S.prov[r.capitalProv] ? r.capitalProv : null;
    const dist = P && cap != null && A.wsDist ? A.wsDist(P.id, cap) : 120;
    const age = hp ? A.age(hp) : 40;
    const c = h.contract || {};
    const wealth = typeof h.wealth === 'string' ? h.wealth.toLowerCase() : '';
    return {
      hp, side, foes, foeAt, hostile, fac, dist, age, m: month(),
      op: h.op != null ? h.op : 50,
      levy: c.levy != null ? c.levy : 1,
      auth: r.laws && r.laws.authority != null ? r.laws.authority : 1,
      stab: r.stability != null ? r.stability : 50, legit: r.legit != null ? r.legit : 60,
      unrest: P ? P.unrest || 0 : 0,
      purse: /very rich|great|vast/.test(wealth) ? 1 : /rich|wealthy/.test(wealth) ? .6 : /poor|debt|ruin/.test(wealth) ? -1 : 0,
      seat: hp ? A.POSTS && A.POSTS.held(hp.id).some(k => /^seat:/.test(k)) : false,
      canLead: live(hp) && A.isAdult(hp) && age < 62 && (hp.health == null || hp.health >= 30),
      refused: CM.refusals(h),
      defend: side === 'def',
      far: foeAt.length ? 0 : 1,
      hostage: !!(h.cmHost && S.year - h.cmHost < 10),
    };
  };
  const FAC_AGAINST = { liberty: 1, independence: 1, claimant: 1, peace: 1 };
  const facName = k => ((A.FACTIONS || {})[k] && A.FACTIONS[k].name) || k;

  // the six answers and their reasons (log-odds). An excuse he could give carries ex: a word for it.
  CM.summonsOptions = function (h, r, w, F, tally) {
    const king = r.ruler != null ? A.P(r.ruler) : null, kingId = king ? king.id : null;
    const rs = (kind, weight, label, source, pub) => ({ kind, weight: r2(weight), label, source: Object.assign({ h: h.id }, source || {}), pub: pub ? 1 : 0 });
    const g = (50 - F.op) / 25;   // his grievance with the crown (+), or his love for it (-)
    const oath = rs('duty', .9 + .3 * (F.levy - 1), 'His oath to the crown', { t: 'oath', r: F.levy }, 1);
    const grudge = (k, label) => rs('grudge', k * g, g > 0 ? label : 'He has little against the crown', { t: 'opinion', r: Math.round(F.op) }, 1);
    const fear = rs('fear', .4 * (F.auth - 1) + .5 * (F.stab - 50) / 50 + (F.hostage ? .6 : 0), F.hostage ? 'A son of his house is at court as surety' : F.auth >= 2 ? 'The crown\'s hand is heavy, and it punishes' : 'The crown is not feared', { t: 'authority', r: F.auth }, 1);
    const standing = rs('loyalty', (F.legit - 60) / 40, F.legit >= 60 ? 'The king\'s right is not in doubt' : 'The king sits on a doubtful right', { t: 'legit', r: Math.round(F.legit) }, 1);
    const own = F.foeAt.length ? rs('claim', 1.6, `The enemy is at his own border: ${short(F.foeAt[0])}`, { t: 'border', at: F.foeAt[0] }, 1) : null;
    const notHis = !F.defend && F.far ? rs('want', .5, 'A far war of the king\'s, not his', { t: 'cause', at: F.foes[0] }, 1) : null;
    const danger = F.hostile.length ? rs('reckoning', 1.5, `A hostile neighbour on his border: ${short(F.hostile[0])}`, { t: 'danger', at: F.hostile[0], ex: 'border' }, 1) : null;
    const unrest = F.unrest >= 30 ? rs('reckoning', .6, 'Unrest in his own lands', { t: 'unrest', r: Math.round(F.unrest), ex: 'unrest' }, 1) : null;
    const harvest = F.m >= 7 && F.m <= 9 ? rs('reckoning', 1, 'The harvest is not in', { t: 'season', r: F.m, ex: 'harvest' }, 1)
      : (F.m >= 11 || F.m <= 1) ? rs('reckoning', .6, 'Winter roads', { t: 'season', r: F.m, ex: 'winter' }, 1) : null;
    const facAg = F.fac && FAC_AGAINST[F.fac.kind] ? rs('ambition', 1, `Sworn to the ${facName(F.fac.kind)}, who want this king weaker`, { t: 'faction', id: F.fac.id }, 0) : null;
    const facWar = F.fac && F.fac.kind === 'war' ? rs('ambition', .8, `Sworn to the ${facName('war')}`, { t: 'faction', id: F.fac.id }, 1) : null;
    const glory = F.age < 30 || (h.military) ? rs('ambition', .5, F.age < 30 ? 'A young lord wants glory' : 'A house of the sword', { t: 'glory' }, 1) : null;
    const others = tally.refuse ? rs('want', .25 * Math.min(4, tally.refuse), `${tally.refuse} lord${tally.refuse === 1 ? '' : 's'} already stay${tally.refuse === 1 ? 's' : ''} home`, { t: 'others', r: tally.refuse }, 1) : null;
    const came = tally.full ? rs('fear', .08 * Math.min(4, tally.full), 'No lord likes to be the only one absent', { t: 'others', r: tally.full }, 1) : null;
    const lead = !F.canLead ? rs('duty', 2.2, F.age >= 62 ? 'He is too old to ride at the head of his men' : !F.hp || !F.hp.alive ? 'His house has no lord to lead it' : !A.isAdult(F.hp) ? 'He is a child' : 'He is not fit to ride', { t: 'lead', r: Math.round(F.age), ex: 'age' }, 1)
      : F.seat ? rs('duty', 1.2, 'His place is at the king\'s council', { t: 'seat', ex: 'council' }, 1) : null;
    const purse = rs('reckoning', F.purse >= .6 ? .6 : F.purse < 0 ? -1.2 : .2, F.purse >= .6 ? 'His chests are full' : F.purse < 0 ? 'His chests are empty' : 'Coin is easier to spare than men', { t: 'purse', r: F.purse, ex: F.purse < 0 ? 'purse' : null }, F.purse < 0 ? 1 : 0);
    const many = F.refused ? rs('grudge', .4 * Math.min(3, F.refused), 'He has refused before', { t: 'refused', r: F.refused }, 1) : null;
    const opts = [
      { id: 'full', at: kingId, feeds: ['love', 'zeal'], reasons: [oath, grudge(-.8, 'His grievance with the crown'), fear, standing, own, facWar, glory, came, F.canLead ? null : rs('reckoning', -2, 'He cannot lead them himself', { t: 'lead' }, 1)].filter(Boolean) },
      { id: 'part', at: kingId, feeds: ['anger', 'pride'], reasons: [rs('reckoning', -.7, 'The rest of his men are needed', { t: 'part' }, 0), rs('reckoning', .3, 'A careful lord keeps men back', { t: 'temper' }, 0), danger, unrest, harvest && harvest.source.ex === 'harvest' ? rs('reckoning', .5, harvest.label, harvest.source, 1) : null, grudge(.3, 'His grievance with the crown'), F.purse < 0 ? rs('coin', .3, 'His chests are empty', { t: 'purse', ex: 'purse' }, 1) : null].filter(Boolean) },
      { id: 'late', at: kingId, feeds: ['anger', 'pride'], reasons: [rs('reckoning', -1, 'Lateness is remembered', { t: 'late' }, 0), rs('insult', .2, 'He will not be seen to run at the king\'s call', { t: 'temper' }, 0), harvest, F.dist > 400 ? rs('reckoning', .4, 'A long road to the muster', { t: 'road', r: Math.round(F.dist), ex: 'road' }, 1) : null, grudge(.2, 'His grievance with the crown'), facAg ? rs('ambition', .4, facAg.label, facAg.source, 0) : null].filter(Boolean) },
      { id: 'deputy', at: kingId, feeds: [], reasons: [rs('duty', -1.4, 'The king wants his lords, not their captains', { t: 'deputy' }, 0), rs('kin', .2, 'A son of his house could win his spurs', { t: 'kin' }, 1), lead, grudge(.3, 'His grievance with the crown'), F.hostage ? rs('fear', .3, 'A son of his house already rides for the crown', { t: 'hostage' }, 1) : null].filter(Boolean) },
      { id: 'coin', at: kingId, feeds: ['anger', 'pride'], reasons: [rs('duty', -.9, 'Shield money is lawful, and not loved', { t: 'coin' }, 1), purse, rs('coin', -.2, 'He hates to part with coin', { t: 'greed' }, 0), notHis, grudge(.6, 'His grievance with the crown')].filter(Boolean) },
      { id: 'refuse', at: kingId, feeds: ['anger', 'pride', 'shame'], reasons: [rs('duty', -2, 'A broken oath', { t: 'oath' }, 1), grudge(1.3, 'His grievance with the crown'), danger ? rs('reckoning', .6, danger.label, danger.source, 1) : null, facAg, notHis ? rs('want', .3, notHis.label, notHis.source, 1) : null, others, many, F.purse < 0 ? rs('coin', .4, 'His chests are empty', { t: 'purse', ex: 'purse' }, 1) : null].filter(Boolean) },
    ];
    // a house whose lord cannot pay coin does not offer it
    if (F.purse < 0) opts.find(o => o.id === 'coin').reasons.push(rs('coin', -1, 'He has no coin to send', { t: 'purse' }, 0));
    return opts;
  };
  // what he says: the first excuse among the chosen option's reasons, else a courteous nothing; the truth: the heaviest
  const EXCUSE = { border: 'his border must be held', unrest: 'unrest in his lands', harvest: 'the harvest', winter: 'the winter roads', road: 'the length of the road', age: 'his years', council: 'his place at the king\'s council', purse: 'an empty chest' };
  CM.EXCUSE = EXCUSE;
  CM.given = function (rec, opt) {
    if (!rec || rec.chose === 'full') return '';
    const o = opt || {};
    const ex = (o.reasons || []).filter(x => x && x.source && x.source.ex && x.weight > 0).sort((a, b) => b.weight - a.weight)[0];
    return ex ? EXCUSE[ex.source.ex] : rec.chose === 'coin' ? 'coin serves the crown as well as men' : 'pressing business at home';
  };

  // one lord's answer: { rec, entry }
  CM.answer = function (h, r, w, tally, o) {
    o = o || {};
    const F = CM.facts(h, r, w), opts = CM.summonsOptions(h, r, w, F, tally);
    const rec = W().decide(W().houseMind(h), 'summons', opts, { band: CM.T.sumBand, r: r.id, at: h.id, log: false, rand: o.rand });
    if (!rec) return null;
    const chosen = opts.find(x => x.id === rec.chose);
    // the true reason: the heaviest for the answer; the same as the one he gives (an excuse that is true) is left empty
    const top = rec.why[0] || ['His oath to the crown', 0, 'duty', null, 1];
    const gx = (chosen && chosen.reasons || []).filter(x => x && x.source && x.source.ex && x.weight > 0).sort((a, b) => b.weight - a.weight)[0];
    const divs = CM.divs(CM.house(h));
    const e = {
      h: h.id, p: F.hp && F.hp.alive ? F.hp.id : null, a: rec.chose, m: divs.reduce((a, d) => a + (d.men || 0), 0), n: CM.full(h),
      g: CM.given(rec, chosen), t: rec.chose === 'full' || (gx && top[0] === gx.label) ? '' : clean(top[0], 90), tp: top[4] ? 1 : 0, d: now(), s: 0,
      // the heaviest reasons (one for a lord who came in full, two otherwise: the muster stays small, D-082)
      why: rec.why.slice(0, rec.chose === 'full' ? 1 : 2).map(x => [clean(x[0], 70), Math.round(x[1] * 10) / 10]), drawn: rec.drawn ? 1 : 0,
    };
    return { rec, e, F, divs };
  };

  // the contingent follows the answer: part holds half (rounded up), late holds all till the day, coin and refusal all
  CM.apply = function (e, h, r, w, divs) {
    const n = divs.length;
    if (e.a === 'part') divs.slice(0, Math.ceil(n / 2)).forEach(d => hold(d, w, null));
    else if (e.a === 'late') { e.arr = now() + clamp(Math.round(30 + (e.dist || 0) / 15), 30, 90); divs.forEach(d => hold(d, w, e.arr)); }
    else if (e.a === 'coin' || e.a === 'refuse' || e.a === 'ask') divs.forEach(d => hold(d, w, null));
    else divs.forEach(d => { if (d.hold && d.hold.w === w.id) delete d.hold; });
    if (e.a === 'coin') { const c = Math.round(e.n * CM.T.scutPerMan); r.treasury = (r.treasury || 0) + c; e.c = c; }
    if (e.a === 'full') h.op = clamp((h.op != null ? h.op : 50) + 2, 0, 100);
    if (e.a === 'refuse') {
      const L = h.cmRef = Array.isArray(h.cmRef) ? h.cmRef : [];
      L.push(A.S.year); if (L.length > 4) L.splice(0, L.length - 4);
      const king = r.ruler != null ? A.P(r.ruler) : null;
      if (live(king) && e.p != null) W().feel(king, 'anger', { t: 'refusal', y: A.S.year, at: e.p, label: `${h.name} refused his summons`, pub: 1 }, .6);
    }
  };

  // ---------------------------------------------------------------- the summons of one realm
  CM.musterRealm = function (w, rid, o) {
    o = o || {};
    const r = A.realm(rid);
    if (!r || r.alive === false || r.isRebel || CM.musterOf(w.id, rid)) return null;
    CM.deal(rid);
    const side = A.warSide(w, rid);
    if (!side) return null;
    const m = { w: w.id, r: rid, y: A.S.year, d: now(), side, k: CM.kindOf(w), name: String(w.name || '').slice(0, 80), e: [] };
    const tally = { full: 0, refuse: 0 };
    const pc = A.pc();
    for (const h of CM.tics(rid)) {
      const hp = h.headPid != null ? A.P(h.headPid) : null;
      if (pc && hp && hp.id === pc.id) {
        // the player's own house: his men wait for his answer (the card)
        const e = { h: h.id, p: pc.id, a: 'ask', m: CM.men(CM.house(h)), n: CM.full(h), g: '', t: '', tp: 0, d: now(), s: 0, why: [] };
        CM.apply(e, h, r, w, CM.divs(CM.house(h)));
        m.e.push(e);
        continue;
      }
      const x = CM.answer(h, r, w, tally, o);
      if (!x) continue;
      x.e.dist = Math.round(x.F.dist);
      CM.apply(x.e, h, r, w, x.divs);
      delete x.e.dist;
      if (x.e.a === 'full') tally.full++;
      if (x.e.a === 'refuse') tally.refuse++;
      m.e.push(x.e);
    }
    store().unshift(m);
    keep();
    return m;
  };
  // when the crown goes to war: every realm on both sides that was not already at war musters
  CM.summon = function (w, o) {
    if (!w || !A.S) return [];
    if (!w.kind) w.kind = CM.kindOf(w);
    const out = [];
    for (const rid of (w.att || []).concat(w.def || [])) {
      if (A.atWar(rid).some(x => x !== w && x.raised)) continue;   // its host is already in the field for another war
      const m = CM.musterRealm(w, rid, o);
      if (m) out.push(m);
    }
    if (CM.tellMuster) for (const m of out) CM.tellMuster(m);
    if (CM.pcSummons) CM.pcSummons(w);
    return out;
  };

  // ---------------------------------------------------------------- keeping contingents whole
  CM.keepWhole = function (rid) {
    const arms = A.armiesOf ? A.armiesOf(rid) : [];
    if (arms.length < 2) return 0;
    const by = new Map();
    for (const a of arms) for (const id of a.divs) { const d = A.divById(id); const h = d && CM.houseOf(d); if (h) { if (!by.has(h.id)) by.set(h.id, []); by.get(h.id).push(d); } }
    let moved = 0;
    for (const [, ds] of by) {
      const cnt = new Map();
      for (const d of ds) cnt.set(d.army, (cnt.get(d.army) || 0) + 1);
      if (cnt.size < 2) continue;
      const target = A.army([...cnt.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0][0]);
      if (!target) continue;
      for (const d of ds) {
        if (d.army === target.id || target.divs.length >= 24) continue;
        if (d.atk != null || (A.S.fights && A.S.fights[d.loc])) continue;
        const from = A.army(d.army);
        if (from) { from.divs = from.divs.filter(x => x !== d.id); if (from.divs.length) A.armySync(from); }
        d.army = target.id; target.divs.push(d.id); moved++;
      }
      A.armySync(target);
    }
    // an army left empty by the moves stands down
    for (const a of arms) if (!a.divs.length && A.wsDemobilize) A.wsDemobilize(a);
    return moved;
  };

  // ---------------------------------------------------------------- the king's three ways of command
  CM.commandOptions = function (a, r) {
    const king = r.ruler != null ? A.P(r.ruler) : null, g = a.gen ? A.P(a.gen) : null;
    const rs = (kind, weight, label, source, pub) => ({ kind, weight: r2(weight), label, source, pub: pub ? 1 : 0 });
    const opts = [];
    const hostsOf = A.HOSTS.armyHosts(a);
    const lords = hostsOf.map(d => CM.houseOf(d)).filter(Boolean).filter((h, i, L) => L.indexOf(h) === i);
    const great = lords.filter(h => h.rung === 'N01' || h.rung === 'N02');
    if (live(king) && A.isAdult(king) && !(A.S.armies || []).some(b => b !== a && b.cmdBy === 'king' && b.king === king.id)) {
      const sk = A.skill(king, 'command') || 0, age = A.age(king);
      opts.push({ id: 'king', at: king.id, feeds: ['pride', 'anger', 'zeal'], reasons: [
        rs('temper', -.8, 'A king in the field leaves his throne behind him', { t: 'away' }, 0),
        rs('merit', (sk - 40) / 25, sk >= 50 ? 'He knows how to command' : 'He has little skill in command', { t: 'skill', id: king.id, r: Math.round(sk) }, 1),
        rs('ambition', .4, 'Victory is a king\'s to win', { t: 'glory' }, 0),
        A.atWar(r.id).some(w => w.def.includes(r.id)) ? rs('duty', .5, 'His own realm is attacked', { t: 'defend' }, 1) : null,
        age >= 60 ? rs('reckoning', -1, 'His years are against it', { t: 'age', r: age }, 1) : null,
        (r.stability || 50) < 35 ? rs('fear', -.8, 'The throne is not safe to leave', { t: 'stability', r: Math.round(r.stability || 0) }, 0) : null,
      ].filter(Boolean) });
    }
    if (live(g) && g.id !== (king && king.id)) {
      const sk = A.skill(g, 'command') || 0, op = live(king) ? A.opinion(king, g) : 0;
      const gh = g.house && A.S.houses[g.house], gRung = gh ? CM.rungIdx(gh.rung) : -1;
      opts.push({ id: 'commission', at: g.id, feeds: [], reasons: [
        rs('merit', .6 + (sk - 40) / 25, sk >= 55 ? `A proven commander: ${A.fullName(g, false)}` : `The best General at hand: ${A.fullName(g, false)}`, { t: 'merit', id: g.id, r: Math.round(sk) }, 1),
        op ? rs('loyalty', op / 40, op > 0 ? 'The king trusts him' : 'The king does not trust him', { t: 'trust', id: g.id, r: Math.round(op) }, 0) : null,
        live(king) && g.house && king.house && g.house === king.house ? rs('kin', .4, 'Of the king\'s own house', { t: 'kin', id: g.id }, 1) : null,
        (g.fame || 0) >= 60 && live(king) && (W().temper(king).caution || 0) > .2 ? rs('fear', -.6, 'A man the soldiers may love more than their king', { t: 'fame', id: g.id }, 0) : null,
        great.length && gRung < 7 ? rs('reckoning', -.4, `The great lords will not like to serve under him`, { t: 'precedence', r: great.length }, 1) : null,
      ].filter(Boolean) });
    }
    opts.push({ id: 'council', at: null, feeds: [], reasons: [
      rs('reckoning', -.8, 'A council of war is slow and quarrels', { t: 'council' }, 1),
      rs('fear', .3, 'He trusts no one man with all his hosts', { t: 'trust' }, 0),
      great.length >= 2 ? rs('kin', .5, `${great.length} great lords lead hosts, and none will yield to another`, { t: 'rivals', r: great.length }, 1) : null,
      !live(g) ? rs('merit', .8, 'No General stands out', { t: 'merit' }, 1) : null,
    ].filter(Boolean) });
    return { opts, lords, great };
  };
  CM.chooseCommand = function (a, o) {
    o = o || {};
    const r = A.realm(a.realm);
    if (!r || !A.HOSTS || A.HOSTS.armyHosts(a).length < 2) return null;
    const { opts, lords, great } = CM.commandOptions(a, r);
    const king = r.ruler != null ? A.P(r.ruler) : null;
    const rec = W().decide(live(king) ? king : r.id, 'command', opts, { band: CM.T.cmdBand, r: r.id, at: a.id, rand: o.rand });
    if (!rec) return null;
    a.cmdBy = rec.chose === 'king' ? 'king' : rec.chose === 'council' ? 'council' : 'commission';
    if (a.cmdBy === 'king') a.king = king.id; else delete a.king;
    a.cmdWhy = clean(W().tell(rec, true), 240);
    a.cmdYear = A.S.year;
    // the king in person: the men see his banner
    if (a.cmdBy === 'king') for (const d of A.armyDivs(a)) if (d.mo != null) d.mo = Math.min(100, d.mo + 4);
    // a commission over great lords of higher birth than the General: a grievance in their houses (the army's quarrel, W1-6)
    if (a.cmdBy === 'commission') {
      const g = A.P(a.gen), gh = g && g.house && A.S.houses[g.house], gr = gh ? CM.rungIdx(gh.rung) : -1;
      for (const h of great) if (h !== gh && CM.rungIdx(h.rung) > gr) { CM.grieve(h, 'passed', `${A.fullName(g, false)} given the command over them`); h.op = clamp((h.op != null ? h.op : 50) - 2, 0, 100); }
    }
    void lords;
    return rec;
  };
  // after a war's hosts are raised: contingents whole, then the king's word over each army of two hosts or more
  CM.onRaise = function (w) {
    try {
      for (const rid of (w.att || []).concat(w.def || [])) {
        CM.keepWhole(rid);
        const arms = (A.armiesOf ? A.armiesOf(rid) : []).slice().sort((x, y) => (A.armyMen(y) - A.armyMen(x)) || (x.id < y.id ? -1 : 1));
        for (const a of arms) if (!a.cmdBy) CM.chooseCommand(a);
      }
    } catch (e) { console.error('[commands] raise', e); }
  };

  // ---------------------------------------------------------------- the crown's General for a new army (A.wsGeneralFor)
  // The crown commissions a great house's head, or raises a man of no house for it. The four likeliest heads (by rung,
  // then id) are weighed against raising one: a great name, merit in command, the king's kin, the house's loyalty, a
  // house of the sword; a tenant-in-chief leads his own command and is less free to take the crown's. Returns the house,
  // or null to raise a man. The record is kept (kind 'general').
  CM.generalChoice = function (rid, hs, busy) {
    const r = A.realm(rid), king = r && r.ruler != null ? A.P(r.ruler) : null;
    const ok = h => { const p = h.headPid != null ? A.P(h.headPid) : null; return live(p) && p.id !== A.S.pc && !(busy && busy.has(p.id)) && A.isAdult(p) && !(A.POSTS && (A.POSTS.holds(p.id, 'seat').length || (A.POSTS.isSeniorGeneral && A.POSTS.isSeniorGeneral(p.id)))); };
    const cands = hs.filter(ok).sort((a, b) => CM.rungIdx(b.rung) - CM.rungIdx(a.rung) || (a.id < b.id ? -1 : 1)).slice(0, 4);
    if (!cands.length) return null;
    const rs = (kind, weight, label, source, pub) => ({ kind, weight: r2(weight), label, source, pub: pub ? 1 : 0 });
    const opts = cands.map(h => {
      const p = A.P(h.headPid), sk = A.skill(p, 'command') || 0, ri = Math.max(0, CM.rungIdx(h.rung));
      return { id: h.id, at: p.id, reasons: [
        rs('claim', ri / 8 * 1.2, `A great name: ${h.name}`, { t: 'rung', id: h.id, r: ri }, 1),
        rs('merit', (sk - 40) / 30, sk >= 50 ? 'He knows how to command' : 'He has little skill in command', { t: 'merit', id: p.id, r: Math.round(sk) }, 1),
        king && p.house && king.house && p.house === king.house ? rs('kin', .4, 'Of the king\'s own house', { t: 'kin', id: p.id }, 1) : null,
        rs('loyalty', ((h.op != null ? h.op : 50) - 50) / 40, (h.op || 50) >= 50 ? 'A loyal house' : 'A house with a grievance', { t: 'opinion', id: h.id, r: Math.round(h.op || 50) }, 0),
        h.military ? rs('merit', .4, 'A house of the sword', { t: 'military', id: h.id }, 1) : null,
        CM.isTic(h, rid) ? rs('reckoning', -.5, 'He leads his own command', { t: 'command', id: h.id }, 1) : null,
      ].filter(Boolean) };
    });
    opts.push({ id: 'raise', reasons: [rs('merit', .3, 'A soldier raised for his skill', { t: 'raise' }, 1), rs('reckoning', -.2, 'A man of no house has nobody behind him', { t: 'raise' }, 0)] });
    const rec = W().decide(live(king) ? king : rid, 'general', opts, { band: 1.5, r: rid, at: 'army' });
    return rec && rec.chose !== 'raise' ? A.S.houses[rec.chose] || null : null;
  };

  // ---------------------------------------------------------------- a league member called against a conqueror (A.callExtra)
  // Join the war against the conqueror, or stay out. Reasons: the league's oath, the conqueror's black name (infamy), the
  // cost of a war, the realm's weariness. Calibrated to the release's pace (it joined 4 times in 10): oath .5 against
  // cost .9. The record is kept when it joins (kind 'war').
  CM.leagueJoins = function (rid, att, w) {
    const r = A.realm(rid), ra = A.realm(att);
    if (!r || !ra) return false;
    const rs = (kind, weight, label, source, pub) => ({ kind, weight: r2(weight), label, source, pub: pub ? 1 : 0 });
    const opts = [
      { id: 'join', at: att, feeds: ['anger', 'fear'], reasons: [
        rs('duty', .5, 'The league\'s oath against a conqueror', { t: 'league', at: att }, 1),
        rs('fear', ((ra.infamy || 0) - 50) / 50 * .6, `A black name among the crowns: ${short(att)}`, { t: 'infamy', at: att, r: Math.round(ra.infamy || 0) }, 1),
      ] },
      { id: 'stay', at: att, reasons: [
        rs('cost', .9, 'The cost of a war in men, coin and the harvest', { t: 'peace', r: rid }, 0),
        (r.exhaustion || 0) > 0 ? rs('reckoning', (r.exhaustion || 0) / 100, 'The realm is weary of war', { t: 'weary', r: Math.round(r.exhaustion || 0) }, 1) : null,
      ].filter(Boolean) },
    ];
    const rec = W().decide(rid, 'war', opts, { band: W().T.warBand, r: rid, at: att, logIf: x => x.chose === 'join' });
    return !!(rec && rec.chose === 'join');
  };

  // ---------------------------------------------------------------- a refusal: the king's ladder, the lord's answer
  CM.SENTENCES = ['accept', 'fine', 'hostages', 'strip', 'forsworn', 'attaint'];
  CM.SENT_WORDS = { accept: 'accepted his excuse', fine: 'fined him', hostages: 'took a son of his house as surety', strip: 'took a host of his into the crown\'s command', forsworn: 'declared him forsworn before the court', attaint: 'attainted him: his lands are forfeit if they can be taken' };
  CM.sentenceOptions = function (r, h, e, F) {
    const rs = (kind, weight, label, source, pub) => ({ kind, weight: r2(weight), label, source, pub: pub ? 1 : 0 });
    const crownMen = CM.men(CM.crown(r.id)) || 1;
    const fac = F.fac;
    const allies = fac && Array.isArray(fac.members) ? fac.members.filter(x => x !== h.id).map(x => A.S.houses[x]).filter(Boolean).reduce((a, x) => a + CM.full(x) * .3, 0) : 0;
    const theirs = Math.max(1, CM.full(h) + (e.m || 0) + allies), rho = crownMen / theirs;
    const n = Math.max(0, CM.refusals(h) - 1), harsh = .6 + .5 * n;
    const busy = (A.atWar(r.id) || []).length > 0;
    const excuse = e.g && e.g === EXCUSE.border && F.hostile.length;
    const need = (k, label) => rs('reckoning', Math.min(0, ln(rho / k) * 1.2) - (busy && k >= 3 ? 1 : 0), label, { t: 'strength', r: r2(rho) }, 0);
    const lawW = .3 * ((F.auth || 1) - 1);
    return [
      { id: 'accept', at: e.p, feeds: [], reasons: [rs('fear', .3 + (busy ? .5 : 0), busy ? 'He cannot afford a quarrel at home while at war' : 'A quarrel with a great lord is costly', { t: 'busy' }, 0), excuse ? rs('duty', .8, 'His excuse is true: his border is threatened', { t: 'excuse' }, 1) : null, rs('loyalty', -.3 - .4 * n, n ? 'He has refused before' : 'Other lords are watching', { t: 'refused', r: n + 1 }, 1)].filter(Boolean) },
      { id: 'fine', at: e.p, feeds: [], reasons: [rs('duty', .6, 'The law sets a fine for it', { t: 'law' }, 1), rs('coin', .2, 'The treasury could use it', { t: 'coin' }, 0)] },
      { id: 'hostages', at: e.p, feeds: ['anger'], reasons: [rs('fear', .3, 'A son at court keeps a father honest', { t: 'surety' }, 1), rs('duty', -.5 + .5 * n + lawW, n ? 'He has refused before' : 'A first refusal', { t: 'law', r: n }, 1), need(.5, 'Taking a hostage needs some strength')] },
      { id: 'strip', at: e.p, feeds: ['anger', 'pride'], reasons: [rs('insult', .3, 'A lord who will not lead his men should not keep them', { t: 'men' }, 1), rs('duty', -1.1 + .6 * n + lawW, n ? 'He has refused before' : 'A first refusal', { t: 'law', r: n }, 1), need(1, 'The crown must be stronger than he is'), String(h.id).startsWith('pc:') || CM.divs(CM.house(h)).length ? null : rs('reckoning', -3, 'He has no host to take', { t: 'none' }, 0)].filter(Boolean) },
      { id: 'forsworn', at: e.p, feeds: ['anger', 'pride'], reasons: [rs('insult', .3, 'Every lord should hear what an oath is worth', { t: 'oath' }, 1), rs('duty', -1.9 + .7 * n + .4 * harsh, n ? 'He has refused before' : 'A first refusal', { t: 'law', r: n }, 1), need(1.5, 'A sentence that cannot be enforced costs a king')] },
      { id: 'attaint', at: e.p, feeds: ['anger', 'pride'], reasons: [rs('grudge', .2, 'He would make an example of him', { t: 'example' }, 0), rs('duty', -3.2 + .8 * n, 'Only treason earns attainder', { t: 'law', r: n }, 1), need(3, 'He would have to send a host to take the lands')] },
    ];
  };
  // decide and apply the king's sentence on a refusal (an AI lord's, or the player's: o.pc)
  CM.sentence = function (m, e, o) {
    o = o || {};
    const r = A.realm(m.r), h = o.h || A.S.houses[e.h];
    if (!r || !h || e.sen) return null;
    const king = r.ruler != null ? A.P(r.ruler) : null;
    const w = (A.S.wars || []).find(x => x.id === m.w) || { id: m.w, att: [], def: [] };
    const F = CM.facts(h, r, w);
    const crownMen = CM.men(CM.crown(r.id)) || 1, theirs = Math.max(1, CM.full(h) + (e.m || 0));
    const rec = W().decide(live(king) ? king : r.id, 'sentence', CM.sentenceOptions(r, h, e, F), { band: CM.T.senBand, r: r.id, at: e.p, rand: o.rand });
    if (!rec) return null;
    e.sen = rec.chose;
    e.senWhy = clean(W().tell(rec, true), 200);
    const rho = crownMen / theirs, req = { strip: 1, forsworn: 1.5, attaint: 3 }[e.sen] || 0;
    // a sentence the crown cannot enforce costs it before every lord who watches
    if (req && rho < req) { e.unf = 1; r.stability = clamp((r.stability || 50) - 2, 0, 100); CM.grieve(h, 'defied', 'a sentence the crown could not enforce'); return rec; }
    const op = d => { h.op = clamp((h.op != null ? h.op : 50) + d, 0, 100); };
    if (e.sen === 'accept') { r.stability = clamp((r.stability || 50) - .5, 0, 100); }
    if (e.sen === 'fine') { const f = Math.round(CM.full(h) * CM.T.scutPerMan * 1.5); r.treasury = (r.treasury || 0) + f; e.fine = f; op(-6); }
    if (e.sen === 'hostages') { h.cmHost = A.S.year; op(-10); }
    if (e.sen === 'strip') { const d = CM.firstOf(CM.house(h)) || CM.divs(CM.house(h))[0]; if (d) delete d.own; op(-15); }
    if (e.sen === 'forsworn') { h.cmForsworn = A.S.year; op(-25); }
    if (e.sen === 'attaint') { h.cmAttaint = A.S.year; for (const d of CM.divs(CM.house(h))) delete d.own; op(-40); }
    if (e.sen !== 'accept') CM.grieve(h, 'sentence', `${CM.SENT_WORDS[e.sen]} for a refused summons`);
    if (e.sen !== 'accept' && !o.pc) CM.lordAnswer(m, e, h, r, o);
    return rec;
  };
  // the lord's answer to a sentence: submit, sulk at home, or seek out the others who stayed home (a league: W1-6 raises it)
  CM.lordAnswer = function (m, e, h, r, o) {
    o = o || {};
    const rs = (kind, weight, label, source, pub) => ({ kind, weight: r2(weight), label, source, pub: pub ? 1 : 0 });
    const crownMen = CM.men(CM.crown(r.id)) || 1, rho = crownMen / Math.max(1, CM.full(h) + (e.m || 0));
    const g = (50 - (h.op != null ? h.op : 50)) / 25;
    const others = CM.musterOf(m.w, m.r) ? CM.musterOf(m.w, m.r).e.filter(x => x !== e && x.a === 'refuse').length : 0;
    const libF = (A.S.factions || []).find(f => f && f.realm === r.id && (f.kind === 'liberty' || f.kind === 'independence'));
    const king = r.ruler != null ? A.P(r.ruler) : null;
    const opts = [
      { id: 'submit', at: king && king.id, feeds: ['fear'], reasons: [rs('reckoning', .3, 'Submission costs least', { t: 'cost' }, 0), rs('fear', .1 + .5 * Math.min(2, ln(rho)), rho >= 1 ? 'The crown is stronger than he is' : 'The crown is weaker than it thinks', { t: 'strength', r: r2(rho) }, 0), rs('loyalty', -g * .6, g > 0 ? 'His grievance with the crown' : 'Old loyalty to the crown', { t: 'opinion' }, 1)] },
      { id: 'sulk', at: king && king.id, feeds: ['pride', 'shame'], reasons: [rs('insult', .5, 'He will not be seen to bend', { t: 'pride' }, 0), rs('grudge', .3 * g, 'His grievance with the crown', { t: 'opinion' }, 1)] },
      { id: 'league', at: king && king.id, feeds: ['anger', 'pride'], reasons: [rs('ambition', .2, 'Lords together are harder to punish', { t: 'league' }, 1), rs('ambition', -1.2 + .4 * Math.min(3, others) + (libF ? .6 : 0), others ? `${others} other lord${others === 1 ? '' : 's'} stayed home too` : 'He would stand alone', { t: 'others', r: others }, 1), rs('grudge', .5 * g, 'His grievance with the crown', { t: 'opinion' }, 1), rs('fear', -.4 * Math.min(2, ln(rho)), 'A league against a strong crown is treason', { t: 'strength' }, 0)] },
    ];
    const rec = W().decide(W().houseMind(h), 'answer', opts, { band: 1.5, r: r.id, at: e.p, rand: o.rand, log: false });
    if (!rec) return null;
    e.ans = rec.chose;
    if (rec.chose === 'submit') { if (e.sen === 'fine' && e.fine) h.op = clamp((h.op || 50) + 2, 0, 100); }
    if (rec.chose === 'sulk') { h.op = clamp((h.op || 50) - 4, 0, 100); if (e.p != null && live(king)) W().feel(e.p, 'pride', { t: 'sentence', y: A.S.year, at: king.id, label: `the sentence for his refusal`, pub: 1 }, .5); }
    if (rec.chose === 'league') {
      h.op = clamp((h.op || 50) - 8, 0, 100);
      if (libF && !libF.members.includes(h.id)) libF.members.push(h.id);
      if (e.p != null && live(king)) W().feel(e.p, 'anger', { t: 'sentence', y: A.S.year, at: king.id, label: `the sentence for his refusal`, pub: 1 }, .7);
    }
    return rec;
  };

  // ---------------------------------------------------------------- the seasons: who pays, who stays
  CM.seasonOptions = function (r, h, e, w) {
    const rs = (kind, weight, label, source, pub) => ({ kind, weight: r2(weight), label, source, pub: pub ? 1 : 0 });
    const cost = Math.round((e.m || 0) * CM.T.payPerMan), tr = Math.max(1, r.treasury || 1);
    const men = (A.armiesOf ? A.armiesOf(r.id) : []).reduce((a, x) => a + (x.men || 0), 0) || 1;
    return {
      cost,
      crown: [
        { id: 'pay', reasons: [rs('coin', -3 * cost / tr, cost > tr ? 'The treasury cannot bear it' : 'The pay of his men', { t: 'cost', r: cost }, 0), rs('reckoning', 2 * (e.m || 0) / men, 'His men are a large part of the host', { t: 'share', r: r2((e.m || 0) / men) }, 0), rs('loyalty', ((h.op || 50) - 50) / 50, 'A loyal house is worth keeping', { t: 'opinion' }, 0)] },
        { id: 'leave', reasons: [rs('coin', .4, 'His oath binds him to serve', { t: 'oath' }, 1)] },
      ],
      lord: [
        { id: 'stay', reasons: [rs('duty', .9 + .3 * ((h.contract && h.contract.levy != null ? h.contract.levy : 1) - 1), 'His oath', { t: 'oath' }, 1), CM.near(h).some(x => (A.warSide(w, r.id) === 'att' ? w.def : w.att).includes(x)) ? rs('claim', 1.4, 'The war is at his own border', { t: 'border' }, 1) : null, rs('loyalty', ((h.op || 50) - 50) / 30, 'Old loyalty to the crown', { t: 'opinion' }, 1)].filter(Boolean) },
        { id: 'home', reasons: [rs('coin', .3 + .4 * (e.s || 1), `${e.s || 1} season${(e.s || 1) === 1 ? '' : 's'} at his own cost`, { t: 'cost', r: e.s || 1 }, 1), month() >= 7 && month() <= 9 ? rs('reckoning', .6, 'The harvest calls the men home', { t: 'season' }, 1) : null, rs('grudge', ((50 - (h.op || 50)) / 25) * .5, 'His grievance with the crown', { t: 'opinion' }, 1)].filter(Boolean) },
      ],
    };
  };
  CM.seasonTick = function (m, e, w, r, h, o) {
    o = o || {};
    if (!['full', 'part', 'deputy', 'late'].includes(e.a) || e.gone) return;
    // a house with no host on the war map has nothing to pay or take home (its called men are W1-4's)
    if (!CM.divs(CM.house(h)).length) return;
    if (e.a === 'late' && e.arr && now() < e.arr) return;
    const start = e.a === 'late' && e.arr ? e.arr : e.d, served = Math.floor((now() - start) / CM.T.season);
    if (served <= (e.s || 0)) return;
    e.s = served;
    const S = CM.seasonOptions(r, h, e, w), king = r.ruler != null ? A.P(r.ruler) : null;
    const pay = W().decide(live(king) ? king : r.id, 'pay', S.crown, { band: 1, r: r.id, at: h.id, log: false, rand: o.rand });
    if (pay && pay.chose === 'pay' && (r.treasury || 0) >= S.cost) { r.treasury -= S.cost; e.pay = (e.pay || 0) + 1; return; }
    const stay = W().decide(W().houseMind(h), 'season', S.lord, { band: 1, r: r.id, at: h.id, log: false, rand: o.rand });
    if (!stay || stay.chose === 'stay') { e.own = (e.own || 0) + 1; return; }
    // he takes his men home: a lawful end to his service, remembered by nobody but the clerks
    const ds = CM.divs(CM.house(h)).filter(d => !CM.held(d));
    let ok = true;
    for (const d of ds) { hold(d, w, null); if (!CM.withdraw(d)) ok = false; }
    e.gone = ok ? 1 : 0;
    e.goneWhy = clean(W().tell(stay, true), 160);
    if (ok) CM.tellLine && CM.tellLine(m, `${h.name} takes ${r.ruler === A.S.pc ? 'their' : 'his'} men home after ${e.s} season${e.s === 1 ? '' : 's'}: the crown would not pay them.`, h);
  };

  // ---------------------------------------------------------------- a march lord fights for his border unsummoned
  CM.borderTick = function (m, e, w, r, h, o) {
    o = o || {};
    if (e.bd || !['part', 'late', 'coin', 'refuse'].includes(e.a) && !e.gone) return;
    const foes = A.warSide(w, r.id) === 'att' ? w.def : w.att, P = CM.seatProv(h);
    if (!P) return;
    const at = [P.id].concat(P.adj || []).find(j => (A.divsAt ? A.divsAt(j) : []).some(d => d && foes.includes(d.r)));
    if (at == null) return;
    const ds = CM.divs(CM.house(h)).filter(d => CM.held(d));
    if (!ds.length) return;
    e.bd = 1;
    const rs = (kind, weight, label, source, pub) => ({ kind, weight: r2(weight), label, source, pub: pub ? 1 : 0 });
    const g = (50 - (h.op != null ? h.op : 50)) / 25;
    const rec = W().decide(W().houseMind(h), 'border', [
      { id: 'fight', reasons: [rs('claim', 2, `The enemy is in his own lands: ${short(foes.find(x => (A.divsAt(at) || []).some(d => d.r === x)) || foes[0])}`, { t: 'border', at: at }, 1), rs('duty', .4, 'A march lord holds his march', { t: 'march' }, 1)] },
      { id: 'stay', reasons: [rs('grudge', .6 * g, 'His grievance with the crown', { t: 'opinion' }, 1), rs('fear', .3, 'The enemy is many', { t: 'count' }, 0)] },
    ], { band: 1, r: r.id, at: h.id, log: false, rand: o.rand });
    if (!rec || rec.chose !== 'fight') return;
    for (const d of ds) delete d.hold;
    e.bf = 1;
    CM.tellLine && CM.tellLine(m, `${h.name} raises ${r.ruler === A.S.pc ? 'their' : 'his'} men unsummoned: the enemy stands on ${A.S.prov[at] ? A.S.prov[at].name : 'his border'}.`, h);
  };

  // ---------------------------------------------------------------- the month
  CM.month = function () {
    const S = A.S;
    if (!S || !S.realms) return;
    CM.tidy();
    // every war is of a kind (an old save's is read once). A crown that joins a war already raised brings its host as it
    // stands: its lords were not summoned (W1-6 may add a second summons)
    for (const w of S.wars || []) if (!w.kind) w.kind = CM.kindOf(w);
    for (const m of CM.musters()) {
      const w = (S.wars || []).find(x => x.id === m.w); if (!w) continue;
      const r = A.realm(m.r); if (!r || r.alive === false) continue;
      for (const e of m.e) {
        const h = S.houses[e.h]; if (!h) continue;
        if (e.a === 'refuse' && !e.sen && e.p !== S.pc && now() - m.d >= 25) CM.sentence(m, e);
        if (e.a === 'late' && e.arr && !e.came && now() >= e.arr) { e.came = 1; CM.tellLine && CM.tellLine(m, `${h.name}'s men come in at last, ${Math.round((e.arr - m.d) / 30)} months after the muster.`, h); }
        CM.seasonTick(m, e, w, r, h);
        CM.borderTick(m, e, w, r, h);
      }
    }
    // the king's word over any army of two hosts that has none yet (a new army, a new king)
    for (const a of S.armies || []) {
      if (a.cmdBy === 'king' && (!a.king || !live(A.P(a.king)) || (A.realm(a.realm) || {}).ruler !== a.king)) { delete a.cmdBy; delete a.king; }
      if (!a.cmdBy && A.HOSTS && A.HOSTS.armyHosts(a).length >= 2) CM.chooseCommand(a);
    }
  };
  A.onMonth.push(function () { try { CM.month(); } catch (e) { console.error('[commands] month', e); } });
  // a war's end closes its musters (the views read m.end: a view may see the wars narrowed to the player's own)
  A.on && A.on('warEnd', function (w) { try { for (const m of CM.musters()) if (m.w === (w && w.id)) m.end = A.S.year; } catch (e) { console.error('[commands] end', e); } });
  A.on && A.on('warStart', function (w) { try { CM.summon(w); } catch (e) { console.error('[commands] summons', e); } });
})();
