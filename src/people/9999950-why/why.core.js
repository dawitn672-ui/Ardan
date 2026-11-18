// W1-2 "minds" (R1's core; rule 18, D-062; D-064 point 9; D-069): A.WHY, one way of deciding for every decider.
//
// The pure logic is the v2 engine's src/people/engine/why.js (A.V2.why, unit-tested by tests/v2/why.test.js, the owner's
// two lab kings among them). This file wires it to the game:
//   A.WHY.decide(who, kind, options, ctx)  who: a person, a person's id, a realm id (its ruler decides), or a mind; the
//        temper is 20-ai-personality's persona of that person (A.personPersona) plus ambition; the feelings are his own.
//        The draw is A.rand, consumed only when options come within the band. The record goes into A.S.why (newest
//        first, at most W.T.logCap: bounded, rule 21) unless ctx.log is false or ctx.logIf(rec) says no.
//   A.WHY.feel(who, k, cause, heat)  lights a feeling on a person (p.feel, at most four); cooled every month for the
//        people in A.S.whyHot only (never a loop over everyone).
//   A.WHY.tell(rec, pubOnly) / A.WHY.tellFor(rec, rid)  "Because: ...; Despite: ..." in plain words, keeping to what the
//        player could know (the council's count of spears is for the ruler and his council only).
// The decisions routed through it here: a realm declaring war (A.aiWarCheck, its yearly council and the council an
// insult calls at once), a great house joining, staying in or leaving a faction (A.factionsYear), and the crown naming
// the General of its first host (999990-posts' P.fillGenerals). The rest are listed in docs/design/r1-audit.md and held
// by tools/lint-reasons.mjs.
// State (all optional, old saves load): A.S.why, A.S.whyHot, A.S.whyAsk, A.S.whyTick, p.feel, w.why, f.why.
(function () {
  const E = A.V2 && A.V2.why;
  if (!E) { console.error('[why] the v2 engine has no why module'); return; }
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const r2 = x => Math.round(x * 100) / 100;
  const cap = s => { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); };
  const clean = (s, n) => String(s == null ? '' : s).replace(/[<>"{}]/g, '').replace(/\s+/g, ' ').trim().slice(0, n || 140);
  const short = id => (A.realm(id) ? A.realmShort(id) : String(id || ''));
  const ln = x => Math.log(Math.max(1e-6, x));
  const logit = q => Math.log(q / (1 - q));

  const W = A.WHY = {
    E,
    T: Object.assign({
      logCap: 150,     // records kept in A.S.why (rule 21: nothing grows forever; about 450 bytes each)
      kindCap: { war: 60, faction: 50, appoint: 20, other: 20 },   // and of each kind
      hotCap: 400,     // people who may carry feelings at once
      askCap: 24,      // councils called at once by a wrong
      warBand: 3,      // the war council: options within this of the best go to the draw (log-odds; see D-069)
      peace: 2.2,      // the weight of "the cost of a war" in the yearly war council: ln(1 / 0.11), the release's yearly odds
      peaceOcc: .2,    // added to it when v2 diplomacy names a hostile month (DV.tryWar): the war's own reasons carry
                       // temper, strength, cause and infamy, which the old roll there did not; this keeps the pace (D-069)
      facBand: 1.5,    // a house's choice about a faction
      apptBand: .3,    // the crown's choice of a General: merit nearly settles it
      hotAt: .5,       // a feeling this hot opens the question of war even without bad blood
      courtP0: .35,    // the court's own reasons (68's plan and its moment, an old wrong or want; 55's feud ledger) were
      courtCap: .97,   // tuned as multipliers on the chance of a hostile month turning to war (DV.WAR.p, .35): a factor
                       // above 1 weighs logit(min(cap, p0 x m)) - logit(p0), as it did in that roll (see W.courtW)
      askAt: .8,       // and this hot calls the council at once
    }, (A.WHY && A.WHY.T) || {}),
  };

  // ---------------------------------------------------------------- minds
  const AMB = { ambitious: .6, content: -.6, greedy: .2, humble: -.3, proud: .2, lazy: -.2, diligent: .1 };
  const tcache = new Map();   // person id -> { key, T } (a lookup by id, never stored)
  W.temper = function (p) {
    const traits = p && Array.isArray(p.traits) ? p.traits : [];
    const key = traits.join(',');
    const id = p && p.id != null ? String(p.id) : null;
    const hit = id != null ? tcache.get(id) : null;
    if (hit && hit.key === key) return hit.T;
    const P = A.personPersona ? A.personPersona({ id, traits }) : {};
    const T = {};
    for (const k of E.AXES) T[k] = isFinite(P[k]) ? P[k] : 0;
    T.ambition = clamp(traits.reduce((a, t) => a + (AMB[t] || 0), 0) + (P.warLog || 0) * .25, -1, 1);
    if (id != null) { if (tcache.size > 4000) tcache.clear(); tcache.set(id, { key, T }); }
    return T;
  };
  const personOf = who => {
    if (who == null) return null;
    if (typeof who === 'object') return who.temper ? null : who;
    const r = typeof who === 'string' && A.realm(who);
    if (r && r.id === who) return r.ruler != null ? A.P(r.ruler) : null;
    return A.P(who) || null;
  };
  // a mind: { id, temper, feel }. A mind object passes through; a realm with no ruler decides with an even temper.
  W.mind = function (who) {
    if (who && typeof who === 'object' && who.temper) return who;
    const p = personOf(who);
    if (!p) return { id: typeof who === 'string' ? who : null, temper: {}, feel: [] };
    return { id: p.id, temper: W.temper(p), feel: Array.isArray(p.feel) ? p.feel : [], p };
  };
  // a house's mind: its living head's, else its lore family's traits (no one is made for it)
  W.houseMind = function (h) {
    const hp = h && h.headPid != null ? A.P(h.headPid) : null;
    if (hp && hp.alive) return W.mind(hp);
    const F = h && A.famData ? A.famData(h.id) : null;
    return { id: h ? 'house:' + h.id : null, temper: W.temper({ id: h ? 'house:' + h.id : null, traits: (F && F.traits) || [] }), feel: [] };
  };

  // ---------------------------------------------------------------- deciding and the record
  const log = () => { const S = A.S; if (!Array.isArray(S.why)) S.why = []; return S.why; };
  W.log = () => (A.S && Array.isArray(A.S.why) ? A.S.why : []);
  W.decide = function (who, kind, options, ctx) {
    ctx = ctx || {};
    const mind = W.mind(who);
    // the draw: A.rand, or a stream the caller keeps apart (v2 diplomacy's own seeded stream)
    const rec = E.decide(mind, kind, options, { rand: ctx.rand || (() => A.rand()), year: A.S.year, band: ctx.band, at: ctx.at });
    if (!rec) return null;
    if (ctx.r != null) rec.r = ctx.r;
    // only a record that is kept is cleaned for the save (most choices are "wait" or "stay", and kept nowhere)
    if (ctx.log !== false && (!ctx.logIf || ctx.logIf(rec))) {
      rec.d = A.today ? A.today() : 0;
      for (const list of [rec.why, rec.not]) for (const x of list) { x[0] = clean(x[0]); if (x[3] && typeof x[3] === 'object') x[3] = srcOut(x[3]); }
      const L = log(), capK = W.T.kindCap[kind] || W.T.kindCap.other;
      L.unshift(rec);
      // each kind keeps its own share, so the crowns' many appointments never push the wars out of the record
      let n = 0;
      for (let i = 0; i < L.length; i++) if (L[i].k === kind && ++n > capK) { L.splice(i, 1); break; }
      // over the whole cap, the oldest records go first, a war's last (W1-5 added the kinds yield and terms; the kinds'
      // shares together may pass the whole, and a war's record is the one the game shows longest)
      for (let i = L.length - 1; i >= 0 && L.length > W.T.logCap; i--) if (L[i].k !== 'war') L.splice(i, 1);
      if (L.length > W.T.logCap) L.length = W.T.logCap;
    }
    return rec;
  };
  // a source kept small: its kind, year, target and id (labels are in the reason already)
  const srcOut = s => { const o = {}; for (const k of ['t', 'y', 'at', 'id', 'r']) if (s[k] != null) o[k] = typeof s[k] === 'number' ? r2(s[k]) : clean(s[k]); return o; };
  W.recent = (n, f) => W.log().filter(e => !f || f(e)).slice(0, n || 20);
  W.tell = (rec, pubOnly) => E.tell(rec, pubOnly);
  // does the player know a realm's council's secrets? its ruler, a councillor, its senior General
  W.knows = function (rid) {
    const pc = A.pc && A.pc();
    if (!pc || !pc.alive || pc.realm !== rid) return false;
    if (pc.ruler === rid) return true;
    const r = A.realm(rid);
    if (r && r.council) for (const k in r.council) if (r.council[k] === pc.id) return true;
    return false;
  };
  W.tellFor = (rec, rid) => (rec ? E.tell(rec, !W.knows(rid != null ? rid : rec.r)) : '');

  // ---------------------------------------------------------------- feelings
  W.feel = function (who, k, cause, heat) {
    const p = personOf(who);
    if (!p || !p.alive || !E.FEELINGS[k]) return null;
    const mind = { id: p.id, temper: W.temper(p), feel: Array.isArray(p.feel) ? p.feel : [] };
    const c = cause ? Object.assign({}, cause, { label: clean(cause.label) }) : null;
    const f = E.feel(mind, k, c, heat == null ? 1 : heat, { year: A.S.year });
    p.feel = mind.feel;
    const S = A.S, hot = S.whyHot = Array.isArray(S.whyHot) ? S.whyHot : [];
    if (!hot.includes(p.id)) { hot.push(p.id); if (hot.length > W.T.hotCap) { const old = A.P(hot.shift()); if (old) delete old.feel; } }
    return f;
  };
  W.heat = (who, at) => { const p = personOf(who); return p && p.feel ? E.heatAt({ feel: p.feel }, at) : 0; };
  // cool the people who carry feelings (A.S.whyHot), never everyone; E.cool replaces the mind's list, written back here
  W.cool = function (months) {
    const S = A.S;
    if (!S || !Array.isArray(S.whyHot) || !S.whyHot.length) return;
    S.whyHot = S.whyHot.filter(id => {
      const p = A.P(id);
      if (!p || !p.alive || !Array.isArray(p.feel)) { if (p) delete p.feel; return false; }
      const m = { temper: W.temper(p), feel: p.feel };
      E.cool(m, months || 1);
      if (m.feel.length) { p.feel = m.feel; return true; }
      delete p.feel;
      return false;
    });
  };
  A.onMonth.push(function () { try { W.cool(1); } catch (e) { console.error('[why] cool', e); } });

  // the wrongs between realms that light feelings in a ruler (the release's incidents): who feels, what, how hot
  const WRONG = {
    envoy: [['b', 'pride', 1, (a, b) => `the shaming of his envoy at the court of ${short(a)}`]],
    border: [['a', 'anger', .5, (a, b) => `men killed at a border ford by soldiers of ${short(b)}`], ['b', 'anger', .5, (a, b) => `men killed at a border ford by soldiers of ${short(a)}`]],
    ships: [['b', 'anger', .5, (a, b) => `his merchant ships seized in the harbors of ${short(a)}`]],
    spy: [['b', 'anger', .3, (a, b) => `a spy of ${short(a)} caught in his lands`]],
    raid: [['b', 'anger', .8, (a, b) => `villages burned by raiders out of ${short(a)}`]],
    heretic: [['a', 'zeal', .5, (a, b) => `his preachers stoned in ${short(b)}`], ['b', 'zeal', .4, (a, b) => `blasphemy preached in his lands by men of ${short(a)}`]],
    murder: [['b', 'anger', 1, (a, b) => `a lord of his murdered with a knife paid for in ${short(a)}`]],
    defector: [['a', 'pride', .5, (a, b) => `a captain of his gone over to ${short(b)} with his maps`]],
    elope: [['a', 'pride', .4, (a, b) => `a princess of his house run off with a knight of ${short(b)}`], ['b', 'pride', .3, (a, b) => `the scandal of the princess of ${short(a)}`]],
  };
  W.wrong = function (k, a, b) {
    const L = WRONG[k];
    if (!L) return;
    for (const [side, feeling, heat, label] of L) {
      const me = side === 'a' ? a : b, them = side === 'a' ? b : a, r = A.realm(me);
      if (!r || !r.alive || r.ruler == null) continue;
      const f = W.feel(r.ruler, feeling, { t: k, y: A.S.year, at: them, label: label(a, b), pub: 1 }, heat);
      // a hot wrong is taken up at council at once, not at the year's council
      if (f && f.heat >= W.T.askAt) { const S = A.S, q = S.whyAsk = Array.isArray(S.whyAsk) ? S.whyAsk : []; if (!q.some(x => x[0] === me && x[1] === them) && q.length < W.T.askCap) q.push([me, them]); }
    }
  };
  if (Array.isArray(A.INCIDENTS)) for (const I of A.INCIDENTS) {
    if (!I || !WRONG[I.k] || typeof I.fx !== 'function' || I.fx.whyWrapped) continue;
    const fx = I.fx;
    I.fx = function (a, b) { const out = fx.apply(this, arguments); try { W.wrong(I.k, a, b); } catch (e) { console.error('[why] wrong', e); } return out; };
    I.fx.whyWrapped = true;
  }
  // a war lost shames its ruler before the victor
  A.on && A.on('warEnd', function (w, result) {
    try {
      if (!w || (result !== 'att' && result !== 'def')) return;
      const lose = result === 'att' ? w.leadD : w.leadA, win = result === 'att' ? w.leadA : w.leadD, r = A.realm(lose);
      if (r && r.alive && r.ruler != null) W.feel(r.ruler, 'shame', { t: 'defeat', y: A.S.year, at: win, label: `the lost war with ${short(win)}`, pub: 1 }, .8);
    } catch (e) { console.error('[why] defeat', e); }
  });

  // ---------------------------------------------------------------- the war council (A.aiWarCheck)
  // Each AI crown sits once a year (its month fixed by its id: no dice), and at once when a hot wrong calls it. It weighs
  // every neighbour war is thinkable against, and peace. The reasons are the release's own factors (20's persona, 68's
  // plan and moment, 55's feud ledger, relations, cause, strength, infamy), each a log-odds weight with its source, so a
  // council that hears the same reasons as the old monthly roll goes to war about as often in a year; the feelings and
  // the heat that discounts a hot king's count of spears are new. D-069.
  const hash = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  W.councilMonth = rid => hash(rid) % 12;
  W.tick = function () { const S = A.S; S.whyTick = ((S.whyTick || 0) + 1) % 12; return S.whyTick; };
  // the councils a hot wrong has called: [realm, at whom]
  W.takeAsks = function () { const S = A.S, q = Array.isArray(S.whyAsk) ? S.whyAsk.filter(x => Array.isArray(x)) : []; if (S.whyAsk && S.whyAsk.length) S.whyAsk = []; return q; };
  // with v2 diplomacy on (the release's yearly council is muted in its turn), a called council is v2's war question,
  // asked at once with the wronged crown as the one who would declare
  A.onMonth.push(function () {
    try {
      const DV = A.V2DIP;
      if (!DV || !DV.ON || typeof DV.tryWar !== 'function' || !A.S || !Array.isArray(A.S.whyAsk) || !A.S.whyAsk.length) return;
      for (const [me, at] of W.takeAsks()) {
        const r = A.realm(me), o = A.realm(at);
        if (!r || !o || !r.alive || !o.alive || r.isRebel || o.isRebel || A.hostile(me, at)) continue;
        const rel = DV.relation(me, at);
        DV.tryWar(me, at, rel ? rel.score : 0, { fixed: true });
      }
    } catch (e) { console.error('[why] council', e); }
  });
  W.hot = (rid, at) => W.heat(rid, at) >= W.T.hotAt;
  const strengthWord = x => (x >= 2 ? 'more than twice' : x >= 1.4 ? 'clearly more than' : x >= 1 ? 'a little more than' : x >= .7 ? 'less than' : 'far less than');
  const CBN = { justified: 'a forged claim', reconquest: 'lost land to take back', rivalry: 'an old rivalry', holy: 'a holy war', incident: 'a border incident',
    insult: 'an insult to avenge', tribute: 'refused tribute', conquest: 'conquest', coalition: 'a league against them' };
  const persona = rid => (A.rulerPersona ? A.rulerPersona(rid) : { warLog: 0, traits: [], parts: {} });
  const female = rid => { const r = A.realm(rid), ru = r && r.ruler != null ? A.P(r.ruler) : null; return !!(ru && ru.sex === 'F'); };
  const temperLabel = rid => {
    const P = persona(rid), ts = (P.parts.war || []).filter(x => Math.abs(x[1]) >= .2).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 2).map(x => x[0]);
    if (!ts.length) return P.cult > 1 ? 'A warlike realm' : 'A peaceable realm';
    const t = `${ts.join(', ')} ${female(rid) ? 'queen' : 'king'}`;
    return (/^[aeiou]/i.test(t) ? 'An ' : 'A ') + t;
  };
  // the reasons for war on o, or null when it is not to be thought of (a debt honoured)
  // A court reason's weight. 68's plan (x1 to x9 when its moment comes) and an old wrong or want (x1 to x4), and 55's feud
  // ledger (up to x2.1), were tuned as multipliers on a probability, capped at certainty: the old roll made a planned war
  // all but sure once its moment came. As plain log-odds (ln m) they were drowned by the war's other reasons (the count of
  // spears, no accepted cause, temper), and the wars that answer a memory or a want fell from 31% to 17% of AI wars on
  // CI 140, under the 23% they reach with 68 switched off. So a factor above 1 is read as the multiplier it was, at the
  // old roll's base chance: x9 weighs 4.1 (not 2.2), x2 1.5 (not 0.7), x1.5 0.7 (not 0.4). A factor below 1 (waiting
  // for the moment, plans elsewhere, an old debt) stays ln m. (D-069 addendum, H-064 addendum.)
  W.courtW = function (m) {
    if (!(m > 1)) return ln(m);
    const p0 = W.T.courtP0;
    return logit(Math.min(W.T.courtCap, p0 * m)) - logit(p0);
  };
  W.warReasons = function (r, o, P, rel, cb) {
    const a = r.id, b = o.id, out = [], his = female(a) ? 'Her' : 'His';
    const add = (kind, weight, label, source, pub) => { if (isFinite(weight) && Math.abs(weight) >= .02) out.push({ kind, weight: r2(weight), label, source, pub: !!pub }); };
    add('temper', ln(A.aiWarHaz(a)), temperLabel(a), { t: 'temper', id: r.ruler }, 0);
    // short of the edge his temper wants (20's nerve), the count weighs so heavily that only heat (a hot king's count
    // discounted) carries a war: the old nerve gate, made a reason (D-069)
    const nerve = A.aiNerve(a), f = clamp(P.ratio - nerve, 0, 2.5);
    add('reckoning', ln(Math.max(f, .05)) - (f <= 0 ? 2 + 8 * (nerve - P.ratio) : 0), `${his} Generals count ${strengthWord(P.ratio)} the strength of ${short(b)}`, { t: 'count', at: b, r: P.ratio }, 0);
    add('grudge', ln(Math.max(.05, 1 + (-rel - 25) / 60)), `Bad blood with ${short(b)}`, { t: 'opinion', at: b, r: Math.round(rel) }, 1);
    if (cb) add('claim', ln(cb === 'justified' || cb === 'reconquest' ? 2.2 : 1.5), `A cause the crowns accept: ${CBN[cb] || cb}`, { t: 'cause', at: b, id: cb }, 1);
    else add('duty', ln(A.aiNoCause(a)), 'No cause the crowns would accept', { t: 'cause', at: b }, 1);
    if ((r.rivals || []).includes(b)) add('grudge', ln(1.5), `Sworn rivals of ${short(b)}`, { t: 'rival', at: b }, 1);
    const fm = A.feudWarMul ? A.feudWarMul(a, b) : 1;
    if (fm !== 1) {
      const FE = A.BONDS && A.BONDS.FEUD, e = FE && FE.top ? FE.top(a, b, fm > 1 ? -1 : 1) : null;
      add(fm > 1 ? 'grudge' : 'debt', W.courtW(fm), e ? `${fm > 1 ? 'An old wrong' : 'An old debt'}: ${FE.label(e).toLowerCase()}, in ${e.y}` : (fm > 1 ? 'Old wrongs between the crowns' : 'An old debt to them'), { t: 'feud', at: b, y: e ? e.y : null }, 1);
    }
    const cm = A.cbWarMul ? A.cbWarMul(a, b, P) : 1;
    if (cm <= 0) return null;   // 68's debts: an honourable crown will not attack its benefactor
    if (cm !== 1) {
      const CS = A.CASUS, pl = r.csPlan, mo = CS && CS.moment && pl && pl.t === b ? CS.moment(a, b, P) : null;
      const he = his === 'Her' ? 'she' : 'he', hi = his.toLowerCase();
      const label = cm > 1 ? (pl && pl.t === b && mo ? `The moment ${he} waited for: ${mo.t}` : `An old wrong or an old want turns ${hi === 'her' ? 'her' : 'him'} to them`)
        : pl && pl.t === b ? `Not yet the moment ${he} waits for` : pl ? `${his} plans lie against ${short(pl.t)}` : `${his} mind is on other plans`;
      // a plan's moment is the crown's own resolve, not a count of spears: 'want' (ambition bends it; heat never discounts it)
      add(cm > 1 ? (pl && pl.t === b ? 'want' : 'grudge') : pl ? 'reckoning' : 'grudge', W.courtW(cm), label, { t: 'plan', at: pl ? pl.t : b }, 0);
    }
    if (o.playerRun) add('fear', ln(.8), 'A crown that answers for itself', { t: 'player', at: b }, 0);
    add('fear', ln(clamp(1 - (r.infamy || 0) / 90, .15, 1)), `${his} name is already black among the crowns`, { t: 'infamy', r: Math.round(r.infamy || 0) }, 1);
    const ov = clamp(1.2 - A.overext(r) * 1.5, .3, 1.2);
    add('reckoning', ln(ov), ov < 1 ? 'Lands still unsettled from the last war' : 'A realm at peace with itself', { t: 'overext' }, 0);
    if (A.hasNap(a, b)) add('duty', ln(.1), `A pact of peace sworn with ${short(b)}`, { t: 'pact', at: b }, 1);
    return out;
  };
  // one crown's question of war on another: war against peace (o.pace, the weight of the cost of a war), with the
  // ruler's feelings at them; the record, or null when the war is not to be thought of (a debt honoured).
  // o: { pace, rand, log }. DV.tryWar and the lab test ask it.
  W.warDecision = function (RA, RT, P, host, cb, o) {
    o = o || {};
    const reasons = W.warReasons(RA, RT, P, host, cb);
    if (!reasons) return null;
    const peace = [{ kind: 'cost', weight: o.pace != null ? o.pace : W.T.peace, label: 'The cost of a war in men, coin and the harvest', source: { t: 'peace', r: RA.id }, pub: 0 }];
    return W.decide(RA.id, 'war', [{ id: 'war', at: RT.id, feeds: W.WAR_FEEDS, reasons }, { id: 'wait', at: RT.id, reasons: peace }],
      { band: W.T.warBand, r: RA.id, at: RT.id, rand: o.rand, log: o.log, logIf: x => x.chose !== 'wait' });
  };
  // the pull toward war on b at a's yearly council, as odds (no draw, no record): what A.aiWarCheck would weigh for this
  // pair now, or null when war is not thinkable (a gate, the opinion bar, a debt). Tests read it in place of the old roll.
  W.warOdds = function (a, b) {
    const r = A.realm(a), o = A.realm(b), S = A.S;
    if (!r || !o || !o.alive || A.hostile(a, b) || (r.truce && r.truce[b] > S.year) || (r.allies || []).includes(b) || A.hasTr(a, b, 'def')) return null;
    const cb = A.cbOn(a, b), rel = A.relBetween(a, b) - A.claimsOn(a, b).length * 12 - (cb ? 10 : 0) - (A.cbPress ? A.cbPress(a, b) : 0);
    if (rel > A.aiWarBar(a) && !W.hot(a, b)) return null;
    const P = A.cbPreview ? A.cbPreview(a, b) : A.warPreview(a, b), reasons = W.warReasons(r, o, P, rel, cb);
    if (!reasons) return null;
    const x = E.odds(W.mind(a), [{ id: 'war', at: b, feeds: W.WAR_FEEDS, reasons }, { id: 'wait', at: b, reasons: W.peaceReasons(r) }], { year: S.year, band: W.T.warBand, at: b });
    return x ? x.war : null;
  };
  W.peaceReasons = r => [{ kind: 'cost', weight: W.T.peace, label: 'The cost of a war in men, coin and the harvest', source: { t: 'peace', r: r.id }, pub: 0 }];
  W.WAR_FEEDS = ['pride', 'anger', 'shame', 'zeal', 'grief'];

  // ---------------------------------------------------------------- factions (A.factionsYear)
  // A great house with a grievance that fits a faction, or in one whose cause is no longer its own, decides: join (or
  // stay in), keep out, or leave. Reasons: its grievance with the crown (its opinion), the faction's own want (the war's
  // weariness, a crown of doubtful right, the crown's heavy hand, a house of the sword, lands it could rule alone), the
  // houses already sworn, the throne's firmness, old loyalties; the head's temper bends them.
  const FAC_WANT = {
    peace: (r, h) => ['want', .4 + ((r.exhaustion || 0) - 35) / 25, 'The war has bled the realm white'],
    independence: (r, h) => ['ambition', .8, 'His house could rule its own lands'],
    claimant: (r, h) => ['claim', .3 + (45 - (r.legit || 50)) / 25, 'The crown sits on a doubtful right'],
    liberty: (r, h) => ['want', .6, 'The crown\'s hand lies heavy on the lords'],
    war: (r, h) => ['ambition', .5 + (h.military ? .3 : 0) + ((A.AGGRO && A.AGGRO[r.id]) || 1) - 1, h.military ? 'A house of the sword wants a war' : 'He wants glory, land and plunder'],
  };
  W.factionChoice = function (r, h, cur, want, members) {
    const op = h.op != null ? h.op : 50, opts = [];
    const F = A.FACTIONS || {}, name = k => (F[k] && F[k].name) || k;
    const grievance = { kind: 'grudge', weight: r2((50 - op) / 18), label: op < 50 ? 'His grievance with the crown' : 'He has little against the crown', source: { t: 'opinion', id: h.id, r: Math.round(op) }, pub: 1 };
    const firm = { kind: 'fear', weight: r2(-((r.stability || 50) - 50) / 40), label: (r.stability || 50) >= 50 ? 'The throne stands firm' : 'The throne is shaking', source: { t: 'stability', r: Math.round(r.stability || 50) }, pub: 1 };
    if (want && !(cur && cur.kind === want)) {
      const [kind, w, label] = FAC_WANT[want](r, h), n = members || 0;
      const rs = [grievance, { kind, weight: r2(w), label, source: { t: 'want', id: want }, pub: 1 }, firm];
      rs.push(n ? { kind: 'kin', weight: r2(.25 * Math.min(4, n)), label: `${n} house${n === 1 ? '' : 's'} already sworn to the ${name(want)}`, source: { t: 'faction', id: want }, pub: 1 }
        : { kind: 'ambition', weight: -.4, label: 'No one has raised the banner yet', source: { t: 'faction', id: want }, pub: 0 });
      opts.push({ id: 'join', reasons: rs });
    }
    if (cur) {
      const n = Math.max(0, (cur.members || []).length - 1);
      opts.push({ id: 'stay', reasons: [
        cur.kind === want ? grievance : { kind: 'loyalty', weight: .5, label: `His word given to the ${name(cur.kind)}`, source: { t: 'faction', id: cur.id }, pub: 1 },
        { kind: 'kin', weight: r2(.2 * Math.min(4, n)), label: 'The houses beside him', source: { t: 'faction', id: cur.id }, pub: 1 },
        { kind: 'insult', weight: .3, label: 'He will not be seen to waver', source: { t: 'temper' }, pub: 0 },
      ] });
      opts.push({ id: 'leave', reasons: [
        { kind: 'want', weight: cur.kind === want ? -1 : .9, label: cur.kind === want ? 'Its cause is still his' : 'Its cause is no longer his', source: { t: 'faction', id: cur.id }, pub: 1 },
        { kind: 'loyalty', weight: r2((op - 50) / 25), label: op >= 50 ? 'Old loyalty to the crown' : 'Little love for the crown', source: { t: 'opinion', id: h.id, r: Math.round(op) }, pub: 1 },
      ] });
    } else {
      opts.push({ id: 'stay', reasons: [
        { kind: 'loyalty', weight: r2(.9 + (op - 40) / 30), label: 'Old loyalties hold', source: { t: 'opinion', id: h.id, r: Math.round(op) }, pub: 1 },
        { kind: 'fear', weight: .3, label: 'A faction is a dangerous thing to be seen in', source: { t: 'risk' }, pub: 0 },
      ] });
    }
    if (opts.length < 2) return null;
    return W.decide(W.houseMind(h), 'faction', opts, { band: W.T.facBand, r: r.id, at: want || (cur && cur.kind), logIf: rec => rec.chose !== 'stay' });
  };

  // a new faction: its first member's public reasons stay with it (f.why, shown on the Factions card), and the player's
  // own realm hears of it
  W.factionFormed = function (r, f, h, rec) {
    if (!f || !rec) return;
    const told = clean(E.tell(rec, true), 240);
    if (told) f.why = told;
    const pc = A.pc && A.pc(), F = (A.FACTIONS || {})[f.kind];
    if (pc && pc.alive && pc.realm === r.id && h && F) A.news(clean(`${h.name} raises the ${F.name} in ${short(r.id)}.`) + (told ? ' ' + told : ''), 'crown');
  };

  // ---------------------------------------------------------------- the crown names a General (999990-posts)
  // cands: [{ p, v }] best first. Merit (command, renown, a General's grade) nearly settles it; the king's own temper
  // and ties bend it: kin of his house, a paranoid or cautious king wary of a famous man.
  W.appointGeneral = function (r, cands) {
    if (!cands.length) return null;
    const ru = r.ruler != null ? A.P(r.ruler) : null, kingT = ru ? W.temper(ru) : {};
    const opts = cands.map(({ p, v }) => {
      const rs = [{ kind: 'merit', weight: r2(v / 40), label: `${A.skill(p, 'command') >= 60 ? 'A proven commander' : 'An able commander'}${(p.milRank || 0) >= 6 ? ' of a General\'s grade' : ''}`, source: { t: 'merit', id: p.id, r: Math.round(v) }, pub: 1 }];
      if (ru && p.house && ru.house && p.house === ru.house) rs.push({ kind: 'kin', weight: .3, label: 'Of the king\'s own house', source: { t: 'kin', id: p.id }, pub: 1 });
      if ((p.fame || 0) >= 60 && (kingT.caution || 0) > .2) rs.push({ kind: 'fear', weight: -.3, label: 'A man the soldiers may love more than their king', source: { t: 'fame', id: p.id, r: Math.round(p.fame) }, pub: 0 });
      return { id: String(p.id), reasons: rs };
    });
    return W.decide(ru || r.id, 'appoint', opts, { band: W.T.apptBand, r: r.id, at: 'general' });
  };
})();
