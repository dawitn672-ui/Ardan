// 9999-advisors: the ring of advisors (backtests #4, after King of Dragon Pass's clan ring). See README.md.
//
// A few real people around you, each with a voice and an agenda, speak on the choices that matter. Who they are comes
// from the life you lead: a ruler hears the council (56's seats), a lord his spouse and eldest, a soldier his captain
// (9997) and a comrade, anyone else a parent, a confidant (999) and a master. They are people in A.S: their loyalty is
// their own opinion of you, their judgement comes from their skills, trade, wits and years, and their wants from 56's
// RI.aims and from where your life stands (a mother wants you safe while you are young, and grandchildren later).
//
// - Counsel is worked out once, when an event's view is built (A.eventView), from the state as it stands: no dice, and
//   lines picked by hashing the event, the advisor and the year. It is kept on the view (v.adv), as the release keeps
//   the view itself, so drawing it again reads the same thing. Rendering only reads.
// - Honest: an advisor who knows the matter (judgement 60 or more) favours the choice that is best for you by the
//   engine's own odds and effects; one under 30 favours what their want calls for; between, a blend. One who dislikes
//   you (their opinion of you under -25) argues for their want and against your good: whom to trust is learned.
// - Memory: when you choose, each counsel is booked as heeded or not, and whether it went well (pc.adv.m[id]). Being
//   heeded warms them; being ignored three times running cools them and brings a scene; good counsel heeded warms you
//   to them, bad counsel cools you. Scenes (advisors.events.js, prefix adv_) are NPC moves on 21's budget.
// - Hooks: A.ADV.counsel.push(fn) adds counsel to any event (fn({ pc, q, e, v, ring, dom }) returns entries
//   { id, i, line }), A.ADV.big.push(fn) marks events big or not (fn(e, q, pc) returns true, false or undefined),
//   A.ADV.roles.push(fn) adds ring candidates (fn(pc) returns [{ id, role, pri }]), and A.ADV.advise(pc, spec) gives
//   counsel on a choice that is not an event (the war declaration below uses it).
(function () {
  const ADV = A.ADV = A.ADV || {};
  ADV.counsel = ADV.counsel || [];
  ADV.big = ADV.big || [];
  ADV.roles = ADV.roles || [];
  ADV.V = 1;
  (A.FX_EXTRA = A.FX_EXTRA || []).push('adv');
  A.SIGNATURE = Object.assign(A.SIGNATURE || {}, { ring: true });

  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const esc = s => UI.esc(String(s == null ? '' : s));
  const hash = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  ADV.hash = hash;
  const live = id => { const p = id && A.P(id); return p && p.alive ? p : null; };
  const age = p => { try { return A.age(p); } catch (e) { return 30; } };
  const adult = p => { try { return A.isAdult(p); } catch (e) { return age(p) >= 16; } };
  const theirOp = (t, pc) => (t && t.rel && t.rel[pc.id] ? t.rel[pc.id].op || 0 : 0);
  const myOp = (pc, t) => (pc.rel && t && pc.rel[t.id] ? pc.rel[t.id].op || 0 : 0);
  const sk = (p, k) => { try { return A.skill(p, k); } catch (e) { return (p.skills && p.skills[k]) || 0; } };
  const given = p => (p && (p.given || p.name)) || 'someone';

  // ---------------------------------------------------------------- what people want

  // b: how much each family of outcome weighs with them (see ADV.vec)
  ADV.WANTS = {
    glory:   { t: 'war, and a name won in it', b: { war: 2, name: 1.2, life: -0.2 } },
    peace:   { t: 'peace, and nothing risked for pride', b: { war: -2, life: 1.2, free: 0.6, risk: -1 } },
    wealth:  { t: 'gold', b: { coin: 2.2, risk: -0.3 } },
    order:   { t: 'a strong crown and full coffers', b: { realm: 2, free: 0.6, coin: 0.4 } },
    liberty: { t: "the lords' old liberties", b: { realm: -0.6, name: 1, bond: 0.6 } },
    faith:   { t: 'the faith honoured', b: { faith: 2.5, name: 0.3 } },
    works:   { t: 'things built that will last', b: { realm: 1.2, coin: 1, skill: 0.5 } },
    crown:   { t: 'the throne, one day', b: { name: 1.6, war: 0.6, realm: -0.6 } },
    safety:  { t: 'you safe and whole', b: { life: 2.5, free: 2, war: -1, risk: -1.5 } },
    kin:     { t: 'the family first', b: { kin: 2.5, bond: 1, happy: 0.5 } },
    craft:   { t: 'good work, and a name in the trade', b: { skill: 2, name: 1, coin: 0.5 } },
    company: { t: 'you near, and in good heart', b: { bond: 2, happy: 1.5, life: 0.5 } },
    rise:    { t: 'you risen high', b: { name: 2, coin: 0.6, war: 0.3 } },
  };
  ADV.FEARS = { war: { war: -1.5 }, ruin: { coin: 1.2, risk: -0.5 }, tyranny: { realm: -0.6 }, unrest: { realm: 0.8 }, heresy: { faith: 1 }, rival: { name: 0.6 } };
  // what is good for you, as a loyal advisor who knows the matter judges it
  ADV.TRUE = { coin: 1, life: 2.5, free: 2, name: 1, faith: 0.3, bond: 0.6, kin: 0.8, happy: 0.7, skill: 0.5, realm: 0.3, war: 0 };

  // ---------------------------------------------------------------- the ring: who has your ear

  ADV.ROLE = {
    chancellor: 'Chancellor', marshal: 'Marshal', treasurer: 'Treasurer', spymaster: 'Spymaster', chaplain: 'Chaplain',
    liege: 'your liege', spouse: null, father: 'your father', mother: 'your mother', eldest: null, friend: 'your friend',
    master: 'your master', captain: 'your captain', comrade: 'a comrade',
  };
  ADV.roleName = function (role, p) {
    if (A.COUNCIL && A.COUNCIL[role]) return A.COUNCIL[role].name;
    if (role === 'spouse') return p && p.sex === 'F' ? 'your wife' : 'your husband';
    if (role === 'eldest') return p && p.sex === 'F' ? 'your eldest daughter' : 'your eldest son';
    return ADV.ROLE[role] || role;
  };
  // the domain each role knows from their place, before their own skills
  ADV.ROLE_DOM = { chancellor: 'court', marshal: 'war', treasurer: 'money', spymaster: 'court', chaplain: 'faith', liege: 'court',
    spouse: 'kin', father: 'kin', mother: 'kin', eldest: 'kin', friend: 'any', master: 'work', captain: 'war', comrade: 'war' };
  const KIN = { father: 1, mother: 1 }, FRIEND = ['friend', 'best friend', 'bestfriend', 'comrade', 'student', 'lover', 'betrothed'];
  const MASTER = ['mentor', 'master', 'patron', 'superior'];
  ADV.size = function (pc) {
    if (pc.ruler) return 6;
    if (age(pc) < 16) return 2;
    if (pc.noble || pc.status === 'royal' || pc.status === 'noble') return 4;
    if (pc.mil) return 4;
    return 3;
  };
  // pure: who could sit in your ring now, best first ({ id, role, pri })
  ADV.candidates = function (pc) {
    const out = [], seen = new Set([pc.id]), a = age(pc);
    const add = (p, role, pri) => { if (!p || !p.alive || seen.has(p.id) || p.id === pc.id || age(p) < 14) return; seen.add(p.id); out.push({ id: p.id, role, pri }); };
    const rr = pc.ruler && A.realm(pc.ruler);
    if (rr && rr.council) for (const seat of Object.keys(A.COUNCIL || {})) add(live(rr.council[seat]), seat, 90);
    // a councillor of another's realm hears the crown
    const home = A.realm(pc.realm);
    if (!rr && home && home.council && Object.values(home.council).includes(pc.id)) add(live(home.ruler), 'liege', 72);
    const rel = pc.rel || {};
    if (pc.spouse) add(live(pc.spouse), 'spouse', 82);
    for (const id in rel) if (KIN[rel[id].type]) add(live(id), rel[id].type, a < 25 ? 86 : a < 40 ? 62 : 40);
    // the captain of your company (9997), a person by then
    try {
      const M = A.CO && A.CO.mine ? A.CO.mine(pc) : null;
      if (M && M.rec && M.rec.p) { const c = live(M.rec.p[M.i]) || live(M.rec.p[4]); if (c && c.id !== pc.id) add(c, 'captain', 78); }
    } catch (e) { /* no companies */ }
    // your master at work, or a mentor
    let bm = null, bmv = -1e9;
    if (pc.job && pc.job.boss) { const b = live(pc.job.boss); if (b) { bm = b; bmv = 1e6; } }
    for (const id in rel) if (MASTER.includes(rel[id].type)) { const t = live(id); const v = myOp(pc, t) + theirOp(t, pc); if (t && v > bmv) { bm = t; bmv = v; } }
    if (bm) add(bm, 'master', pc.job ? 66 : 50);
    // the confidant: the highest rank of 999's ladder, then the warmest bond
    const fr = [];
    for (const id in rel) {
      const r = rel[id], t = live(id);
      if (!t || !adult(t) || !(FRIEND.includes(r.type) || (r.cf || 0) > 0)) continue;
      fr.push({ t, v: (r.cf || 0) * 25 + (r.op || 0) + theirOp(t, pc), comrade: r.type === 'comrade' });
    }
    fr.sort((x, y) => y.v - x.v || (x.t.id < y.t.id ? -1 : 1));
    if (fr[0] && fr[0].v > 30) add(fr[0].t, 'friend', 68 + Math.min(15, (rel[fr[0].t.id].cf || 0) * 3));
    if (pc.mil) { const c = fr.find(x => x.comrade && !seen.has(x.t.id)); if (c) add(c.t, 'comrade', 52); }
    // the eldest grown child
    let el = null;
    for (const id in rel) if (rel[id].type === 'child') { const t = live(id); if (t && adult(t) && (!el || t.born < el.born || (t.born === el.born && t.id < el.id))) el = t; }
    if (el) add(el, 'eldest', pc.noble || pc.ruler ? 58 : 44);
    for (const f of ADV.roles) { try { for (const c of f(pc) || []) add(live(c.id), c.role || 'friend', c.pri || 50); } catch (e) { console.error('advisors roles hook', e); } }
    return out.sort((x, y) => y.pri - x.pri || (x.id < y.id ? -1 : 1));
  };

  // the state: pc.adv = { ring: [{ id, role, w, y, wy }], m: { id: memory }, past: [...], n: counters, out: { id: year } }
  ADV.st = function (pc) {
    let s = pc.adv;
    if (!s || typeof s !== 'object') s = pc.adv = {};
    s.ring = Array.isArray(s.ring) ? s.ring : [];
    s.m = s.m && typeof s.m === 'object' ? s.m : {};
    s.past = Array.isArray(s.past) ? s.past : [];
    s.n = s.n && typeof s.n === 'object' ? s.n : {};
    s.out = s.out && typeof s.out === 'object' ? s.out : {};
    s.dis = s.dis && typeof s.dis === 'object' ? s.dis : {};
    return s;
  };
  ADV.ring = pc => (pc && pc.adv && Array.isArray(pc.adv.ring) ? pc.adv.ring.filter(x => live(x.id)) : []);
  ADV.mem = (pc, id) => (pc && pc.adv && pc.adv.m && pc.adv.m[id]) || null;

  // pure: what this person wants of you now, from who they are to you and where your life stands
  ADV.wantOf = function (t, role, pc) {
    const aims = A.RI && A.RI.aims ? A.RI.aims(t) : null, tr = t.traits || [], has = x => tr.includes(x), a = age(pc);
    const court = aims && aims.want;
    if (A.COUNCIL && A.COUNCIL[role] || role === 'liege') return court || 'order';
    const lean = has('greedy') ? 'wealth' : has('zealous') ? 'faith' : has('ambitious') ? 'rise' : (has('brave') || has('wrathful')) ? 'glory' : null;
    if (role === 'father' || role === 'mother') {
      if (a < 22) return 'safety';
      if (age(t) >= 66) return 'company';
      if (!pc.spouse || !(pc.children && pc.children.length)) return 'kin';
      return lean === 'wealth' || lean === 'faith' ? lean : 'kin';
    }
    if (role === 'spouse') return lean === 'wealth' || lean === 'rise' ? lean : pc.children && pc.children.length ? 'kin' : 'company';
    if (role === 'eldest') return age(t) < 26 ? 'rise' : lean === 'wealth' ? 'wealth' : 'kin';
    if (role === 'master') return 'craft';
    if (role === 'captain') return has('cautious') || has('craven') ? 'safety' : court === 'peace' ? 'safety' : 'glory';
    if (role === 'comrade') return has('craven') || has('cautious') || has('kind') ? 'safety' : 'glory';
    if (pc.mil && A.C && A.C.atWar && (() => { try { return A.C.atWar(pc); } catch (e) { return false; } })()) return 'safety';
    return lean || 'company';
  };
  ADV.fearOf = t => { const a = A.RI && A.RI.aims ? A.RI.aims(t) : null; return a ? a.fear : null; };

  // engine: bring the ring up to date (the month hook). Joins, leavings and changed wants are logged quietly.
  ADV.refresh = function (pc, quiet) {
    if (!pc || !pc.alive || age(pc) < 10) return;
    const s = ADV.st(pc), y = A.S.year, n = ADV.size(pc);
    const out = s.out;
    for (const id in out) if (y - out[id] >= 10) delete out[id];
    const want = ADV.candidates(pc).filter(c => {
      if (out[c.id] != null) return false;
      const t = A.P(c.id);
      // a person who hates you will not counsel you, unless their seat makes them
      return !(theirOp(t, pc) < -40 && !(A.COUNCIL && A.COUNCIL[c.role]));
    }).slice(0, n);
    const old = new Map(s.ring.map(x => [x.id, x]));
    const next = [];
    const firstFill = !s.ring.length && !s.past.length;
    for (const c of want) {
      const t = A.P(c.id), w = ADV.wantOf(t, c.role, pc), was = old.get(c.id);
      if (was) {
        if (was.w !== w && !quiet && !firstFill && adult(pc)) A.log(`${A.cap ? A.cap(ADV.roleName(c.role, t)) : ADV.roleName(c.role, t)}, ${given(t)}, wants something else of you now: ${ADV.WANTS[w] ? ADV.WANTS[w].t : w}.`, 'muted');
        next.push({ id: c.id, role: c.role, w, y: was.y, wy: was.w !== w ? y : was.wy });
        old.delete(c.id);
      } else {
        next.push({ id: c.id, role: c.role, w, y, wy: y });
        // a person in your ring knows you, and you them (a seat or a captain may not have met you yet)
        if (!t.rel[pc.id]) t.rel[pc.id] = { type: c.role === 'captain' ? 'subordinate' : 'councillor', op: 10, since: y };
        if (!pc.rel[t.id]) pc.rel[t.id] = { type: c.role === 'captain' ? 'superior' : 'councillor', op: 10, since: y, seen: y };
        if (!quiet && !firstFill && adult(pc)) A.log(`${A.fullName(t, false)} (${ADV.roleName(c.role, t)}) now has your ear.`, 'muted');
      }
    }
    for (const [id, was] of old) {
      const t = A.P(id);
      s.past.push({ id, role: was.role, y0: was.y, y1: y, why: !t || !t.alive ? 'died' : out[id] != null ? 'sent away' : 'moved on' });
    }
    if (s.past.length > 16) s.past.splice(0, s.past.length - 16);
    s.ring = next;
    s.ry = y;
  };

  // ---------------------------------------------------------------- judgement: how well each knows a matter

  ADV.DOM_SK = {
    war: ['command', 'tactics', 'logistics', 'siegecraft', 'melee', 'sword', 'spear', 'axe', 'bow', 'mounted'],
    money: ['stewardship', 'trade'],
    court: ['diplomacy', 'intrigue', 'persuasion', 'etiquette', 'deception'],
    faith: ['faith', 'learning'],
    body: ['medicine', 'survival', 'tracking', 'athletics', 'sea'],
    work: ['craft', 'husbandry', 'trade', 'stewardship'],
    kin: [], any: [],
  };
  ADV.DOM_NAME = { war: 'war', money: 'money', court: 'the court', faith: 'the faith', body: 'the body and the road', work: 'work', kin: 'family', any: 'most things' };
  ADV.domOfSkill = s => { for (const d in ADV.DOM_SK) if (ADV.DOM_SK[d].includes(s)) return d; return null; };
  // 0..100, pure: skills, a trade, a seat, wits and years
  ADV.judge = function (t, dom, role) {
    if (!t) return 0;
    const st = t.st || {}, wits = ((st.int || 30) + (st.ins || 30) + (st.wil || 30)) / 3, a = age(t);
    const years = clamp((a - 18) * 0.6, 0, 18) - (a > 72 ? (a - 72) * 1.5 : 0);
    const general = clamp(wits * 0.75 + years, 0, 75);
    let best = 0;
    for (const k of ADV.DOM_SK[dom] || []) best = Math.max(best, sk(t, k));
    const J = t.job && GD.CAREERS && GD.CAREERS[t.job.c];
    if (J && J.skill && (ADV.DOM_SK[dom] || []).includes(J.skill)) best = Math.max(best, 25 + (t.job.r || 0) * 12 + (t.job.perf || 50) / 10);
    if (role && A.COUNCIL && A.COUNCIL[role] && ADV.domOfSkill(A.COUNCIL[role].skill) === dom) best = Math.max(best, sk(t, A.COUNCIL[role].skill));
    if (role === 'captain' && dom === 'war') best = Math.max(best, sk(t, 'command'), 30);
    if (dom === 'kin' || dom === 'any') return Math.round(clamp(general, 0, 100));
    return Math.round(clamp(Math.max(best, general * 0.55), 0, 100));
  };
  // a sentence on what they are good for: "often right about war, seldom about money"
  ADV.knack = function (t, role) {
    const ds = ['war', 'money', 'court', 'faith', 'work'].map(d => [d, ADV.judge(t, d, role)]).sort((a, b) => b[1] - a[1]);
    const hi = ds[0], lo = ds[ds.length - 1];
    const word = v => v >= 60 ? 'often right' : v >= 40 ? 'sound' : 'seldom right';
    return hi[1] - lo[1] < 8 ? `${word(hi[1])} about most things` : `${word(hi[1])} about ${ADV.DOM_NAME[hi[0]]}, ${word(lo[1])} about ${ADV.DOM_NAME[lo[0]]}`;
  };

  // ---------------------------------------------------------------- reading a choice: what it does, by families

  const V0 = () => ({ coin: 0, life: 0, free: 0, name: 0, faith: 0, bond: 0, kin: 0, happy: 0, skill: 0, realm: 0, war: 0 });
  const num = (o, k) => (o && typeof o[k] === 'number' ? o[k] : 0);
  const vcache = new WeakMap();
  // a written effect as families (coin raw, in suns; the rest in rough points)
  ADV.vec = function (fx) {
    const v = V0();
    if (!fx) return v;
    if (typeof fx === 'object') {
      if (vcache.has(fx)) return vcache.get(fx);
      v.coin += num(fx, 'coin');
      v.coinPct = num(fx, 'coinPct');
      if (fx.die) v.life -= 12;
      if (fx.wound) v.life -= 3;
      v.life += num(fx, 'health') / 5;
      if (fx.prison) v.free -= 6;
      if (fx.punish) v.free -= 2;
      if (fx.free) v.free += 3;
      v.name += (num(fx, 'fame') + num(fx, 'honor') + num(fx, 'rep')) / 5 + num(fx, 'merit') / 12 + num(fx, 'perf') / 10 - num(fx, 'infamy') / 5 + num(fx, 'authority') / 5;
      if (fx.promote) v.name += 3;
      if (fx.epithet || fx.deed) v.name += 1;
      v.faith += num(fx, 'piety') / 4;
      if (fx.them && typeof fx.them === 'object') v.bond += num(fx.them, 'op') / 8;
      if (fx.newRel) v.bond += 1;
      v.bond += num(fx, 'bossOp') / 10 + num(fx, 'patronOp') / 10 + num(fx, 'rulerOp') / 10 + num(fx, 'houseOp') / 10;
      v.kin += num(fx, 'family') / 5;
      if (fx.lover) v.kin += 2;
      v.happy += num(fx, 'happy') / 4;
      if (fx.skill && typeof fx.skill === 'object') for (const k in fx.skill) v.skill += num(fx.skill, k) / 2;
      v.skill += ['str', 'spd', 'ins', 'sta', 'int', 'wil'].reduce((a, k) => a + num(fx, k), 0);
      if (fx.literate) v.skill += 2;
      v.realm += (num(fx, 'realmStab') + num(fx, 'stability') + num(fx, 'legit')) / 5 + num(fx, 'realmRel') / 10 + Math.sign(num(fx, 'treasury') + num(fx, 'realmGold')) * Math.min(3, Math.abs(num(fx, 'treasury') + num(fx, 'realmGold')) / 200);
      if (fx.warOn) v.war += 3;
      if (fx.duel) { v.war += 2; v.life -= 1; }
      v.war += num(fx, 'armyXp') / 5;
      if (fx.claim) v.war += 1;
      if (fx.pact || fx.ally) v.war -= 1;
      vcache.set(fx, v);
      return v;
    }
    if (typeof fx === 'function') {
      const s = String(fx);
      const n = (rx) => { let t = 0, m; const r = new RegExp(rx, 'g'); while ((m = r.exec(s))) t += +m[1] || 0; return t; };
      v.coin += n('\\bcoin\\s*:\\s*(-?\\d+)') + n('\\.coin\\s*\\+=\\s*(\\d+)') - n('\\.coin\\s*-=\\s*(\\d+)');
      if (/\bdie\s*:|pcDeath\(/.test(s)) v.life -= 12;
      if (/\bwound\s*:|addWound\(/.test(s)) v.life -= 3;
      v.life += n('\\bhealth\\s*:\\s*(-?\\d+)') / 5;
      if (/\bprison\s*:|imprison\(/.test(s)) v.free -= 6;
      v.name += (n('\\bfame\\s*:\\s*(-?\\d+)') + n('\\bhonor\\s*:\\s*(-?\\d+)')) / 5;
      v.happy += n('\\bhappy\\s*:\\s*(-?\\d+)') / 4;
      v.faith += n('\\bpiety\\s*:\\s*(-?\\d+)') / 4;
      v.bond += n('\\bop\\s*:\\s*(-?\\d+)') / 8;
      if (/\bwarOn\s*:|declareWar\(/.test(s)) v.war += 3;
      if (/trainSkill\(|\bskill\s*:\s*\{/.test(s)) v.skill += 1;
      const tr = n('\\btreasury\\s*\\+=\\s*(\\d+)') - n('\\btreasury\\s*-=\\s*(\\d+)');
      if (tr) v.realm += Math.sign(tr) * Math.min(3, Math.abs(tr) / 200);
      return v;
    }
    return v;
  };
  // the value of a family vector to someone who weighs things by W, in the life of pc (coin against their purse)
  ADV.worth = function (vec, W, pc, bondSign) {
    const purse = Math.max(15, (pc.coin || 0) * 0.12 + 10);
    let s = 0;
    for (const k in W) {
      if (k === 'risk') continue;
      let x = vec[k] || 0;
      if (k === 'coin') x = clamp(x / purse + (vec.coinPct || 0) / 12, -4, 4);
      if (k === 'bond' && bondSign != null) x *= bondSign;
      s += (W[k] || 0) * x;
    }
    return s;
  };
  // a view choice's odds of going your way (0..1), or null when nothing is thrown
  const oddsOf = vc => (vc && vc.odds != null ? vc.odds / 100 : vc && vc.fight && vc.fight.pct != null ? vc.fight.pct / 100 : null);
  // what one written choice is worth under W, and the harm if it fails (risk)
  ADV.choiceWorth = function (c, vc, W, pc, bondSign) {
    if (!c) return { ev: 0, risk: 0 };
    if (c.check || c.group) {
      const p = oddsOf(vc), pp = p == null ? 0.5 : p;
      let win = ADV.worth(ADV.vec(c.win && c.win.fx), W, pc, bondSign), lose = ADV.worth(ADV.vec(c.lose && c.lose.fx), W, pc, bondSign);
      let harm = Math.max(0, -ADV.worth(ADV.vec(c.lose && c.lose.fx), ADV.TRUE, pc, bondSign));
      // a written effect that cannot be read (a function that calls the engine): winning is taken to be good and
      // losing bad, as the scene's writer meant, so the odds still tell
      if (Math.abs(win) < 1e-6 && Math.abs(lose) < 1e-6) { const g = W === ADV.TRUE ? 1 : 0.4; win = g; lose = -g; harm = Math.max(harm, 1); }
      return { ev: pp * win + (1 - pp) * lose, risk: (1 - pp) * (harm + 0.5), p };
    }
    return { ev: ADV.worth(ADV.vec(c.fx), W, pc, bondSign), risk: 0, p: null };
  };
  ADV.biasOf = function (want, fear) {
    const W = Object.assign({}, (ADV.WANTS[want] || ADV.WANTS.company).b);
    const F = fear && ADV.FEARS[fear];
    if (F) for (const k in F) W[k] = (W[k] || 0) + F[k];
    return W;
  };

  // ---------------------------------------------------------------- which choice each advisor favours

  // pure: the advisor's pick among the view's choices, or null when the choices are all alike to them.
  // opts: { W (their bias), comp, loyal, bondSign }
  ADV.pick = function (pc, e, v, o) {
    const rows = [];
    v.choices.forEach((vc, j) => {
      const c = vc && vc.i >= 0 ? e.choices[vc.i] : null;
      if (!c) return;
      const tr = ADV.choiceWorth(c, vc, ADV.TRUE, pc, o.bondSign), bi = ADV.choiceWorth(c, vc, o.W, pc, o.bondSign);
      rows.push({ j, t: tr.ev - tr.risk * 0.6, b: bi.ev + (o.W.risk || 0) * bi.risk, p: tr.p });
    });
    if (rows.length < 2) return null;
    const norm = k => { const m = Math.max(...rows.map(r => Math.abs(r[k]))); for (const r of rows) r[k + 'n'] = m > 1e-6 ? r[k] / m : 0; return m; };
    const mt = norm('t'), mb = norm('b');
    if (mt < 1e-6 && mb < 1e-6) return null;
    const w = clamp((o.comp - 30) / 30, 0, 1);
    const hostile = o.loyal < -25;
    for (const r of rows) r.s = hostile ? r.bn - 0.6 * w * r.tn : w * r.tn + (1 - w) * r.bn;
    const tie = r => (hash(o.key + '|' + r.j) % 1000) / 1e6;
    rows.sort((x, y) => (y.s + tie(y)) - (x.s + tie(x)));
    const best = rows[0];
    if (rows.length > 1 && Math.abs(best.s - rows[1].s) < 0.02) return null;   // no view worth giving
    const tBest = rows.slice().sort((x, y) => y.t - x.t)[0], bBest = rows.slice().sort((x, y) => y.b - x.b)[0];
    const why = hostile || w < 0.5 ? 'want' : best.j === tBest.j && best.j === bBest.j ? 'both' : best.j === tBest.j ? 'sense' : 'want';
    return { j: best.j, why, p: best.p, trueBest: tBest.j, biasBest: bBest.j, w };
  };

  // the matter of the scene: a check's skill first, then 9992's scene kind, then a few words
  const KIND_DOM = { fight: 'war', talk: 'court', court: 'court', money: 'money', faith: 'faith', wild: 'body', body: 'body', kin: 'kin', any: 'any' };
  ADV.domOf = function (q, v, e) {
    for (const c of e.choices || []) { const s = c && c.check && c.check.s, d = s && ADV.domOfSkill(s); if (d) return d; }
    try { if (A.ID && A.ID.sceneKind) { const k = A.ID.sceneKind(q, v, e); if (k && KIND_DOM[k] && k !== 'any') return KIND_DOM[k]; } } catch (err) { /* pure fallback below */ }
    const t = `${v.title || ''} ${v.text || ''}`;
    if (/\b(war|army|host|battle|siege|march|raid)\b/i.test(t)) return 'war';
    if (/\b(coin|suns|debt|price|tax|trade|market)\b/i.test(t)) return 'money';
    if (/\b(court|council|lord|king|queen|law|bill)\b/i.test(t)) return 'court';
    if (/\b(wed|marry|marriage|betroth|child|son|daughter|mother|father)\b/i.test(t)) return 'kin';
    return 'any';
  };

  // ---------------------------------------------------------------- which choices matter

  const bigCache = new Map();
  const BIG_COND = /C\.ruler\(|C\.atWar\(|C\.office\(|C\.holds\(|myRealm\(|C\.claim|C\.sworn\(|C\.faction\(/;
  const BIG_FX = /\b(warOn|claim|pact|ally|duel|die|prison|lover|spouse|marry|betroth|wedding|asset|coinPct|promote|treasury|legit|realmStab|stability|authority|epithet|untrait|job|poBill|poOff|poVote|poCrown|poMuster|sworn|exile)\b/;
  ADV.isBig = function (e, q, pc) {
    if (!e) return false;
    for (const f of ADV.big) { try { const r = f(e, q, pc); if (r === true || r === false) return r; } catch (err) { console.error('advisors big hook', err); } }
    if (e.big === true || e.big === false) return e.big;
    if (bigCache.has(e.id)) return bigCache.get(e.id);
    let b = false;
    if (/^(adv|cf)_/.test(e.id) || (e.choices || []).length < 2) b = false;
    else if (e.once) b = true;
    else {
      let cs = '', ch = '';
      try { cs = e.cond ? String(e.cond) : ''; } catch (err) { cs = ''; }
      try { ch = JSON.stringify(e.choices, (k, x) => (typeof x === 'function' ? String(x) : x)); } catch (err) { ch = ''; }
      b = BIG_COND.test(cs) || BIG_FX.test(ch) || /\bcoin\b["']?\s*:\s*-\s*(\d{3,})/.test(ch) || /^(po|ri|co|cb|du)_/.test(e.id);
    }
    bigCache.set(e.id, b);
    return b;
  };

  // ---------------------------------------------------------------- counsel: who speaks, and what they say

  ADV.LINES = {
    // they think it best for you, all told
    sense: {
      war: ['Count their spears, then ours. This is the road that brings men home.', 'I have seen this ground before. Go this way.', 'Pick the fight you can win, not the one you want.'],
      money: ['Do the sums. This is the one that pays.', 'A purse leaks from small holes. This one has fewest.', 'It costs less than it looks, and the other costs more.'],
      court: ['Watch who smiles. This way, nobody is owed.', 'The room will turn on this. Be on the right side of it.', 'Speak this way and they will remember it kindly.'],
      faith: ['The rite is plain on this. So is sense.', 'The old books and the old priests agree, for once.'],
      body: ['Mind the body first. The rest mends.', 'I have dressed wounds for less. Take the safe road.'],
      work: ['Good work is slow work. This is the better job.', 'Your hands know this already. Trust them.'],
      kin: ['I know you. This is the one you will not regret.', 'Think of the years after, not the week.'],
      any: ['I have weighed it. This is the better way.', 'This one, I think. The rest only look easier.', 'Sleep on it if you like. You will choose this.'],
    },
    // their want speaks
    want: {
      glory: ['Men remember the one who struck first.', 'No one sings of a man who waited.', 'Take it. Fortune likes a bold hand.'],
      peace: ['Let it pass. None of this is worth blood.', 'The quiet road. It is never the wrong one.', 'Wait. Most quarrels die if left alone.'],
      wealth: ['Think of the purse. It outlasts the quarrel.', 'There is silver in this, if you are not proud.', 'A coin kept is a coin earned.'],
      order: ['The crown first, and the law with it.', 'A realm holds by rules kept. Keep this one.', 'Strength now saves trouble later.'],
      liberty: ['No one should bow lower than he must.', 'Give the crown an inch and it takes the field.'],
      faith: ['The gods see this. Do it their way.', 'Say the prayer first. Then choose this.', 'The shrine will remember what you give it.'],
      works: ['Build for your grandchildren. This lasts.', 'Stone outlives speeches.'],
      crown: ['Climb while the ladder holds.', 'Every step up is a step nearer the high seat.'],
      safety: ['Come home whole. That is all I ask.', 'There is no shame in the safe road.', 'I have buried enough. Do not make me bury you.'],
      kin: ['Think of the family. They will be here after.', 'Blood first. Strangers last.', 'Do what you could own to at the table, after.'],
      craft: ['Good work speaks louder than a good speech.', 'Learn from it. That is worth more than the fee.', 'Your name in the trade is your fortune.'],
      company: ['Stay near. Whatever you choose, choose it here.', 'Do the thing that lets you sleep tonight.', 'Have a little joy of it, for once.'],
      rise: ['People are watching. Give them something to see.', 'This is how a name is made.', 'Aim higher. You were not made for the back of the hall.'],
    },
  };
  // the line: their want's words, or (for one who knows the matter) the matter's; never a line already said
  ADV.lineFor = function (t, role, want, dom, why, key, used) {
    const L = why === 'want' ? ADV.LINES.want[want] || ADV.LINES.sense.any : (ADV.LINES.sense[dom] || ADV.LINES.sense.any).concat(why === 'both' ? ADV.LINES.want[want] || [] : []);
    const h = hash(key + '|line');
    for (let k = 0; k < L.length; k++) { const l = L[(h + k) % L.length]; if (!used || !used.includes(l)) return l; }
    return L[h % L.length];
  };
  // the speaker's manner (54-voices): ", smiling", " quietly"
  ADV.manner = function (t, key) {
    try {
      if (!A.VOICE || !A.VOICE.npcLine) return '';
      const m = A.VOICE.npcLine(t, key, 'tag');
      return m && m.text ? m.text.replace(/\{[^}]+\}/g, '').replace(/^\s*,?\s*/, ', ').replace(/\s+$/, '') : '';
    } catch (e) { return ''; }
  };

  ADV.lineCap = pc => (ADV.ring(pc).length >= 4 ? 3 : 2);
  // pure: the counsel on this event, as entries { id, r (role), i (view choice index), l (line), y (why), m (manner) }
  ADV.counselFor = function (pc, q, v) {
    if (ADV.OFF || !pc || !pc.alive || !q || q.type !== 'event' || !v || v.skip || age(pc) < 10) return null;
    const e = A.EV[q.ev];
    if (!e || !Array.isArray(v.choices) || v.choices.length < 2 || !ADV.isBig(e, q, pc)) return null;
    const ring = ADV.ring(pc), pid = q.ctx && q.ctx.pid, dom = ADV.domOf(q, v, e), y = A.S.year;
    const cand = [];
    for (const x of ring) {
      if (x.id === pid) continue;
      const t = A.P(x.id);
      const ed = ADV.ROLE_DOM[x.role] || 'any';
      const comp = ADV.judge(t, dom, x.role), loyal = theirOp(t, pc);
      let bondSign = null;
      if (pid && t.rel && t.rel[pid]) { const o = t.rel[pid].op || 0; bondSign = o < -20 ? -1 : o > 30 ? 1.5 : 1; }
      const key = `${q.ev}|${x.id}|${y}`;
      const pk = ADV.pick(pc, e, v, { W: ADV.biasOf(x.w, ADV.fearOf(t)), comp, loyal, bondSign, key });
      if (!pk) continue;
      const rel = (ed === dom ? 40 : 0) + comp / 2 + (x.role in (A.COUNCIL || {}) ? 6 : 0) + (hash(key) % 12);
      cand.push({ x, t, comp, pk, rel, key });
    }
    cand.sort((a, b) => b.rel - a.rel || (a.x.id < b.x.id ? -1 : 1));
    const out = [], cap = ADV.lineCap(pc);
    while (out.length < cap && cand.length) {
      // a second voice who sees it otherwise is worth more than a third who agrees
      let bi = 0, bv = -1e9;
      cand.forEach((c, k) => { const v2 = c.rel + (out.length && !out.some(o => o.i === c.pk.j) ? 25 : 0); if (v2 > bv) { bv = v2; bi = k; } });
      const c = cand.splice(bi, 1)[0];
      out.push({ id: c.x.id, r: c.x.role, i: c.pk.j, y: c.pk.why, c: c.comp, l: ADV.lineFor(c.t, c.x.role, c.x.w, dom, c.pk.why, c.key, out.map(o => o.l)), m: ADV.manner(c.t, c.key) });
    }
    for (const f of ADV.counsel) {
      try {
        for (const x of f({ pc, q, e, v, ring, dom }) || []) {
          const t = live(x.id);
          if (!t || !(x.i >= 0 && x.i < v.choices.length) || !x.line || out.some(o => o.id === t.id)) continue;
          out.push({ id: t.id, r: x.role || (ring.find(r => r.id === t.id) || {}).role || 'friend', i: x.i, y: x.why || 'want', c: ADV.judge(t, dom, x.role), l: String(x.line).replace(/[<>"]/g, '').slice(0, 140), m: '' });
        }
      } catch (err) { console.error('advisors counsel hook', err); }
    }
    return out.length ? out : null;
  };

  // pure: counsel on a choice that is not an event (a bill, a war, a match). spec = { key, dom, options: [{ t, fx, odds }] }
  ADV.advise = function (pc, spec) {
    if (!pc || !spec || !Array.isArray(spec.options) || spec.options.length < 2) return [];
    const e = { id: spec.key || 'adv_choice', choices: spec.options.map(o => (o.odds != null ? { t: o.t, check: { s: 'int', d: 45 }, win: { fx: o.fx }, lose: { fx: o.loseFx || {} } } : { t: o.t, fx: o.fx })) };
    const v = { choices: spec.options.map((o, i) => ({ t: o.t, i, odds: o.odds != null ? o.odds : null })) };
    const dom = spec.dom || 'any', y = A.S.year, out = [];
    for (const x of ADV.ring(pc)) {
      const t = A.P(x.id), comp = ADV.judge(t, dom, x.role), key = `${e.id}|${x.id}|${y}`;
      const pk = ADV.pick(pc, e, v, { W: ADV.biasOf(x.w, ADV.fearOf(t)), comp, loyal: theirOp(t, pc), key });
      if (pk) out.push({ id: x.id, r: x.role, i: pk.j, y: pk.why, c: comp, l: ADV.lineFor(t, x.role, x.w, dom, pk.why, key), m: ADV.manner(t, key), rel: ((ADV.ROLE_DOM[x.role] === dom) ? 40 : 0) + comp / 2 });
    }
    return out.sort((a, b) => b.rel - a.rel).slice(0, ADV.lineCap(pc));
  };

  // ---------------------------------------------------------------- the view: counsel kept with the event as it is drawn

  const view = A.eventView;
  A.eventView = function (q) {
    const fresh = !!q && q.type === 'event' && !q.view;
    const v = view.apply(this, arguments);
    try {
      if (fresh && v && !v.skip && q.view === v && !q.result) {
        const pc = A.pc(), e = A.EV[q.ev];
        if (pc && e && ADV.isBig(e, q, pc) && age(pc) >= 10) { v.big = 1; const c = ADV.counselFor(pc, q, v); if (c) v.adv = c; }
      }
    } catch (err) { console.error('advisors view', err); }
    return v;
  };

  // ---------------------------------------------------------------- memory: did you listen, and did it go well

  const snapOf = pc => ({ coin: pc.coin || 0, health: pc.health || 0, happy: pc.happy || 0, fame: pc.fame || 0, honor: pc.honor || 0, piety: pc.piety || 0, prison: !!pc.prison, alive: !!pc.alive, wounds: (pc.wounds || []).length });
  ADV.outcome = function (pc, s0, success) {
    const s1 = snapOf(pc);
    const d = { coin: s1.coin - s0.coin, life: (s1.health - s0.health) / 5 - (s1.wounds - s0.wounds) * 3 - (s0.alive && !s1.alive ? 12 : 0), free: s1.prison && !s0.prison ? -6 : 0,
      name: (s1.fame - s0.fame + s1.honor - s0.honor) / 5, faith: (s1.piety - s0.piety) / 4, happy: (s1.happy - s0.happy) / 4 };
    const val = ADV.worth(d, ADV.TRUE, pc);
    if (success === false || !s1.alive || (s1.prison && !s0.prison)) return { good: false, bad: true, val };
    if (success === true) return { good: true, bad: false, val };
    return { good: val > 0.15, bad: val < -0.15, val };
  };
  const bump = (t, pc, d) => { if (t && t.rel && t.rel[pc.id]) t.rel[pc.id].op = clamp((t.rel[pc.id].op || 0) + d, -100, 100); };
  const bumpMine = (pc, t, d) => { if (pc.rel && t && pc.rel[t.id]) pc.rel[t.id].op = clamp((pc.rel[t.id].op || 0) + d, -100, 100); };
  ADV.book = function (pc, entries, idx, out, evId) {
    const s = ADV.st(pc), y = A.S.year, n = s.n, follow = [];
    n.adv = (n.adv || 0) + 1;
    for (const x of entries) {
      const t = live(x.id); if (!t) continue;
      const m = s.m[x.id] = s.m[x.id] || { h: 0, k: 0, kg: 0, kb: 0, ig: 0, igb: 0, st: 0 };
      m.h++; m.y = y;
      const heeded = x.i === idx;
      if (heeded) {
        m.k++; m.st = 0; n.k = (n.k || 0) + 1;
        bump(t, pc, 1.5);
        if (out.good) { m.kg++; n.kg = (n.kg || 0) + 1; bumpMine(pc, t, 2); }
        if (out.bad) { m.kb++; n.kb = (n.kb || 0) + 1; bumpMine(pc, t, -2); }
        if (out.bad && theirOp(t, pc) < -20) follow.push({ ev: 'adv_warning', foe: t.id, w: 3 });
        if (out.good && m.kg - (m.paid || 0) >= 3 && theirOp(t, pc) >= 15) follow.push({ ev: 'adv_due', pid: t.id, w: 1 });
      } else {
        m.ig++; m.st++; n.ig = (n.ig || 0) + 1;
        bump(t, pc, m.pr && y - m.pr <= 3 ? -4 : -1);
        if (m.pr && y - m.pr <= 3) { A.log(`${given(t)} notes that you promised to listen.`, 'muted'); delete m.pr; }
        if (out.good) n.igg = (n.igg || 0) + 1;
        if (out.bad) { m.igb++; n.igb = (n.igb || 0) + 1; if (x.c >= 45 && theirOp(t, pc) >= -10) follow.push({ ev: 'adv_told_you', pid: t.id, w: 2 }); }
        if (m.st >= 3 && theirOp(t, pc) >= 0 && (!m.uy || y - m.uy >= 8)) follow.push({ ev: 'adv_unheeded', pid: t.id, w: 2.5 });
      }
      m.last = { ev: evId, y, k: heeded ? 1 : 0, g: out.good ? 1 : out.bad ? -1 : 0 };
    }
    // two voices who keep disagreeing: the count of it, by pair
    for (let a = 0; a < entries.length; a++) for (let b = a + 1; b < entries.length; b++) {
      if (entries[a].i === entries[b].i) continue;
      const k = [entries[a].id, entries[b].id].sort().join('|');
      s.dis[k] = (s.dis[k] || 0) + 1;
      if (s.dis[k] >= 5 && live(entries[a].id) && live(entries[b].id)) follow.push({ ev: 'adv_quarrel', pid: entries[a].i === idx ? entries[b].id : entries[a].id, foe: entries[a].i === idx ? entries[a].id : entries[b].id, pair: k, w: 1.5 });
    }
    return follow;
  };
  // one follow-up at a time, as an NPC move on 21's budget
  ADV.follow = function (pc, list) {
    if (!list.length || !pc.alive || !adult(pc)) return;
    const S = A.S, y = S.year;
    if (S.queue.some(q => q && q.type === 'event' && /^adv_/.test(q.ev || ''))) return;
    const NI = A.NPCI, st = NI && NI.state ? NI.state(pc) : null;
    if (st && (st.b < 1 || (NI.room && !NI.room(pc, y)))) return;
    const s = ADV.st(pc);
    s.fy = s.fy || {};
    const ok = list.filter(f => A.EV[f.ev] && (!s.fy[f.ev] || y - s.fy[f.ev] >= (f.ev === 'adv_due' ? 6 : 3)));
    if (!ok.length) return;
    ok.sort((a, b) => b.w - a.w);
    const f = ok[0], ctx = { npcMove: true };
    if (f.ev === 'adv_warning') {
      // who warns you: the shrewdest other voice in the ring who holds you dear
      const w = ADV.ring(pc).filter(x => x.id !== f.foe).map(x => A.P(x.id)).filter(t => theirOp(t, pc) >= 10).sort((a, b) => ADV.judge(b, 'court') - ADV.judge(a, 'court') || (a.id < b.id ? -1 : 1))[0];
      if (!w) return;
      ctx.pid = w.id; ctx.foeId = f.foe;
    } else { ctx.pid = f.pid; if (f.foe) ctx.foeId = f.foe; if (f.pair) ctx.pair = f.pair; }
    s.fy[f.ev] = y;
    if (f.ev === 'adv_unheeded' && s.m[ctx.pid]) s.m[ctx.pid].uy = y;
    if (f.ev === 'adv_quarrel' && f.pair) s.dis[f.pair] = 0;
    if (st) { st.b -= 1; st.hy[y] = (st.hy[y] || 0) + 1; st.tot = (st.tot || 0) + 1; }
    A.queue({ type: 'event', ev: f.ev, ctx });
  };

  ADV.stats = { big: 0, adv: 0, lines: 0 };   // this page's tally (not saved), for the bench
  const choose = A.eventChoose;
  A.eventChoose = function (idx) {
    const q = A.S && A.S.queue[0], pc = A.pc();
    let pre = null;
    try {
      if (q && q.type === 'event' && !q.result && pc && pc.alive) {
        const v = A.eventView(q);
        if (v && v.big) {
          const s = ADV.st(pc); s.n.big = (s.n.big || 0) + 1; ADV.stats.big++;
          if (v.adv && v.adv.length) { pre = { adv: v.adv, s0: snapOf(pc) }; ADV.stats.adv++; ADV.stats.lines += v.adv.length; }
        }
      }
    } catch (err) { console.error('advisors before', err); }
    const r = choose.apply(this, arguments);
    try {
      if (pre && q.result) {
        const out = ADV.outcome(pc, pre.s0, q.result.success);
        const vc = q.view && q.view.choices && q.view.choices[idx];
        const follow = ADV.book(pc, pre.adv, vc ? idx : -1, out, q.ev);
        ADV.follow(pc, follow);
      }
    } catch (err) { console.error('advisors after', err); }
    return r;
  };

  // ---------------------------------------------------------------- the month: the ring, and an old voice's last word

  ADV.month = function (pc) {
    if (ADV.OFF || !pc || !pc.alive || pc.id !== A.S.pc) return;
    const s = pc.adv;
    const m = A.monthOf ? A.monthOf(A.today()).m : 0;
    // the ring is looked at each quarter, and at once when it is empty or someone in it has died
    if (!s || !Array.isArray(s.ring) || !s.ring.length || m % 3 === 0 || s.ring.some(x => !live(x.id))) ADV.refresh(pc);
    // an old advisor who has been with you a long while has a last word for you, once
    if (m === 6 && adult(pc) && pc.adv) {
      const S = A.S, y = S.year;
      for (const x of pc.adv.ring) {
        const t = live(x.id), mm = pc.adv.m[x.id];
        if (!t || age(t) < 68 || y - x.y < 5 || !mm || mm.h < 4 || mm.last1) continue;
        if (S.queue.some(q => q && /^adv_/.test(q.ev || ''))) break;
        const NI = A.NPCI, st = NI && NI.state ? NI.state(pc) : null;
        if (st && (st.b < 1 || (NI.room && !NI.room(pc, y)))) break;
        if (st) { st.b -= 1; st.hy[y] = (st.hy[y] || 0) + 1; st.tot = (st.tot || 0) + 1; }
        mm.last1 = y;
        A.queue({ type: 'event', ev: 'adv_last_word', ctx: { pid: t.id, npcMove: true } });
        break;
      }
    }
  };
  A.onMonth.push(pc => { try { ADV.month(pc); } catch (e) { console.error('advisors', e); } });

  // ---------------------------------------------------------------- the fx key: adv: { trust, promise, drop, unseat, paid, side }

  const baseFx = A.applyFx;
  A.applyFx = function (pc, fx, ctx) {
    const out = baseFx.apply(this, arguments);
    try {
      if (!fx || typeof fx !== 'object' || !fx.adv || !pc || pc.id !== A.S.pc) return out;
      const a = fx.adv, s = ADV.st(pc), y = A.S.year, t = ctx && live(ctx.pid), foe = ctx && live(ctx.foeId);
      const mOf = id => (s.m[id] = s.m[id] || { h: 0, k: 0, kg: 0, kb: 0, ig: 0, igb: 0, st: 0 });
      if (a.promise && t) { const m = mOf(t.id); m.pr = y; m.st = 0; }
      if (a.paid && t) { const m = mOf(t.id); m.paid = m.kg; }
      if (a.drop) {
        const who = a.drop === 'foe' ? foe : t;
        if (who) {
          s.out[who.id] = y;
          bump(who, pc, -8);
          // a ruler sends a councillor from the council itself; 56 fills the seat at the next court
          const rr = pc.ruler && A.realm(pc.ruler);
          if (a.unseat && rr && rr.council) for (const k in rr.council) if (rr.council[k] === who.id) { delete rr.council[k]; A.log(`${A.fullName(who, false)} gives up the seat of ${A.COUNCIL[k] ? A.COUNCIL[k].name : k}.`, 'warn'); }
          ADV.refresh(pc, true);
        }
      }
      if (a.side && t && foe) { const k = a.side > 0 ? 1 : -1; bump(t, pc, 6 * k); bump(foe, pc, -6 * k); }
    } catch (e) { console.error('advisors fx', e); }
    return out;
  };

  // a few words on how often you listened to someone (the scenes' {record})
  ADV.record = function (pc, id) {
    const m = ADV.mem(pc, id);
    if (!m || !m.h) return 'never asked';
    const r = m.k / m.h;
    return r >= 0.6 ? 'mostly listened' : r >= 0.34 ? 'listened about half the time' : 'seldom listened';
  };

  // ---------------------------------------------------------------- drawing (pure: reads the view and the ring)

  ADV.whoTip = function (pc, id) {
    const t = A.P(id); if (!t) return '';
    const x = (pc.adv && pc.adv.ring || []).find(r => r.id === id), m = ADV.mem(pc, id);
    const role = x ? ADV.roleName(x.role, t) : '';
    const w = x && ADV.WANTS[x.w] ? ADV.WANTS[x.w].t : '', f = ADV.fearOf(t);
    const loyal = theirOp(t, pc), lw = loyal >= 50 ? 'holds you dear' : loyal >= 20 ? 'well disposed to you' : loyal >= -10 ? 'cool toward you' : loyal >= -25 ? 'no friend of yours' : 'against you, whatever they say';
    const rec = m && m.h ? `You heeded ${A.he(t)} ${m.k} of ${m.h} times; it went well ${m.kg} of those.` : 'You have not yet had counsel from ' + A.him(t) + '.';
    const fT = f && A.RI && A.RI.fearText ? ` Fears ${A.RI.fearText(f)}.` : '';
    return `${A.fullName(t, false)}${role ? ', ' + role : ''}.${w ? ` Wants ${w}.` : ''}${fT} ${A.cap ? A.cap(A.he(t)) : A.he(t)} is ${ADV.knack(t, x && x.role)}, and ${lw}. ${rec}`;
  };
  ADV.html = function (pc, list, labels) {
    if (!list || !list.length) return '';
    const rows = list.map(x => {
      const t = A.P(x.id); if (!t) return '';
      const lab = labels[x.i] != null ? String(labels[x.i]) : '';
      const short = lab.length > 44 ? lab.slice(0, 42).replace(/\s+\S*$/, '') + '…' : lab;
      return `<div class="adv-row" title="${esc(ADV.whoTip(pc, x.id))}"><span class="adv-who">${esc(given(t))}<span class="adv-role">${esc(ADV.roleName(x.r, t))}</span></span>` +
        `<span class="adv-line">${x.m ? `<span class="adv-man">${esc(x.m.replace(/^,\s*/, ''))}:</span> ` : ''}“${esc(x.l)}”</span>` +
        (short ? `<span class="adv-for"><span aria-hidden="true">→ </span><span class="adv-sr">favours choice </span><b>${x.i + 1}</b> ${esc(short)}</span>` : '') + '</div>';
    }).join('');
    return rows ? `<div class="adv-ring" role="note" aria-label="Counsel">${rows}</div>` : '';
  };
  const qm = UI.queueModal;
  if (typeof qm === 'function') {
    UI.queueModal = function (q) {
      const h = qm.apply(this, arguments);
      try {
        if (typeof h !== 'string' || !q || q.type !== 'event' || q.result || !q.view || !q.view.adv || h.indexOf('adv-ring') >= 0) return h;
        if (UI.set && UI.set.advisors === false) return h;
        const pc = A.pc(), labels = q.view.choices.map(c => c.t);
        const box = ADV.html(pc, q.view.adv, labels);
        const at = h.indexOf('<div class="choices');
        return at >= 0 ? h.slice(0, at) + box + h.slice(at) : h;
      } catch (e) { console.error('advisors draw', e); return h; }
    };
  }

  // the ring on the People tab
  ADV.card = function (pc) {
    const ring = ADV.ring(pc);
    if (!ring.length) return '';
    const rows = ring.map(x => {
      const t = A.P(x.id), m = ADV.mem(pc, x.id), loyal = theirOp(t, pc);
      const rec = m && m.h ? `heeded ${m.k} of ${m.h}` : 'not yet heard';
      return `<div class="adv-person" title="${esc(ADV.whoTip(pc, x.id))}"><span class="adv-pn"><b>${esc(A.fullName(t, false))}</b> <span class="muted">${esc(ADV.roleName(x.role, t))}</span></span>` +
        `<span class="adv-pw">wants ${esc(ADV.WANTS[x.w] ? ADV.WANTS[x.w].t : x.w)}</span>` +
        `<span class="adv-pr tiny muted">${esc(ADV.knack(t, x.role))} · ${loyal >= 20 ? 'loyal' : loyal >= -10 ? 'cool' : 'hostile'} · ${esc(rec)}</span></div>`;
    }).join('');
    return `<div class="card adv-card"><h3>${pc.ruler ? 'Your council' : 'Those whose counsel you hear'}</h3>${rows}</div>`;
  };
  const people = UI.TAB && UI.TAB.people;
  if (typeof people === 'function') UI.TAB.people = function (pc) {
    const h = people.apply(this, arguments);
    try {
      const c = pc && UI.set.advisors !== false ? ADV.card(pc) : '';
      if (!c) return h;
      const at = h.indexOf('<p class="small muted" style="margin-top:0">');
      return at >= 0 ? h.slice(0, at) + c + h.slice(at) : c + h;
    } catch (e) { return h; }
  };

  // ---------------------------------------------------------------- the council on a declaration of war

  ADV.warSpec = function (pc, tid) {
    const r = A.myRealm && A.myRealm(), t = A.realm(tid);
    if (!r || !t || !A.warPreview) return null;
    const P = A.warPreview(r.id, t.id), ratio = P.ratio || 1;
    const odds = Math.round(clamp(50 + (ratio - 1) * 45, 8, 92));
    return { key: 'adv_war_' + tid, dom: 'war', options: [
      { t: 'Declare war', odds, fx: { warOn: 1, fame: 10, realmStab: -(Math.abs(P.stab || 0)), legit: -(Math.abs(P.legit || 0)), treasury: 200 }, loseFx: { warOn: 1, health: -10, realmStab: -10, legit: -8, treasury: -600, fame: -5 } },
      { t: 'Not now', fx: { realmStab: 1 } }] };
  };
  const wdm = UI.warDeclModal;
  if (typeof wdm === 'function') UI.warDeclModal = function (tid) {
    const h = wdm.apply(this, arguments);
    try {
      const pc = A.pc(), spec = pc && UI.set.advisors !== false && ADV.warSpec(pc, tid);
      if (!spec) return h;
      const list = ADV.advise(pc, spec);
      if (!list.length) return h;
      const box = ADV.html(pc, list, spec.options.map(o => o.t));
      const at = h.indexOf('<div class="choices"');
      return at >= 0 ? h.slice(0, at) + box + h.slice(at) : h;
    } catch (e) { console.error('advisors war', e); return h; }
  };
  // the declaration itself is booked engine side, so a replay keeps the same memory (the outcome is not known yet)
  const dd = A.diplDo;
  if (typeof dd === 'function') A.diplDo = function (k, id) {
    const pc = A.pc();
    let list = null;
    try { if (k === 'war' && pc && !ADV.OFF) { const spec = ADV.warSpec(pc, id); list = spec ? ADV.advise(pc, spec) : null; } } catch (e) { list = null; }
    const r = dd.apply(this, arguments);
    try {
      if (list && list.length && A.myRealm() && A.hostile && A.hostile(A.myRealm().id, id)) {
        const s = ADV.st(pc);
        s.n.big = (s.n.big || 0) + 1;
        ADV.book(pc, list, 0, { good: false, bad: false, val: 0 }, 'war');
      }
    } catch (e) { console.error('advisors war book', e); }
    return r;
  };

  // ---------------------------------------------------------------- the setting, and the style

  const menu = UI.ILLUM && UI.ILLUM.menu;
  if (typeof menu === 'function') UI.ILLUM.menu = function () { return menu.apply(this, arguments) + `<label class="row"><input type="checkbox" data-c="setAdvisors" ${UI.set.advisors !== false ? 'checked' : ''}> Counsel in scenes</label>`; };
  Object.assign(UI.C, { setAdvisors(el) { UI.set.advisors = el.checked; UI.saveSettings && UI.saveSettings(); UI.renderModal ? UI.renderModal() : UI.render(); } });

  const CSS = `.adv-ring{margin:6px 0 8px;display:flex;flex-direction:column;gap:4px}
.adv-row{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 8px;font-size:13px;line-height:1.35;padding:3px 8px;border-left:2px solid var(--line,rgba(127,127,127,.35));color:var(--ink-2,inherit)}
.adv-who{font-weight:600;font-size:12px;white-space:nowrap}
.adv-role{font-weight:normal;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;opacity:.75;margin-left:5px}
.adv-line{font-family:var(--f-prose,inherit);font-style:italic;flex:1 1 220px;min-width:0}
.adv-man{font-style:normal;opacity:.75}
.adv-for{font-size:12px;opacity:.85;white-space:normal}
.adv-sr{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;padding:0}
.adv-card .adv-person{display:flex;flex-wrap:wrap;gap:0 10px;padding:4px 0;border-top:1px solid var(--line,rgba(127,127,127,.2))}
.adv-card .adv-person:first-of-type{border-top:0}
.adv-pn{flex:1 1 200px;min-width:0}.adv-pw{flex:1 1 180px;font-style:italic;font-size:13px}.adv-pr{flex:1 1 100%}
.sc-card .adv-ring{margin:6px 14px 8px}
@media (max-width:760px){.sc-card .adv-ring{margin:4px 12px 6px}.adv-row{font-size:12.5px;padding:2px 6px}.adv-line{flex-basis:100%}}`;
  const put = () => { if (typeof document === 'undefined' || document.getElementById('adv-style')) return; const st = document.createElement('style'); st.id = 'adv-style'; st.textContent = CSS; document.head.appendChild(st); };
  if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }
})();
