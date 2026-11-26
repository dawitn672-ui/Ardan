// Titles (docs/design/skills-v2.md §11, with the owner's answers of §15; orders 79, 82, 83, 84, 89; D-183).
//
// A title is a name the world gives a person (or a being) for what he has done or become: earned, never bought, never
// trained, never rolled for. It stacks with the others, gives honour and renown once and, while held, buffs and stat
// boosts through the skills adapter's own vocabulary and caps (37-skills2's c-effects: A.CAPS), so ten titles cannot
// snowball. Its requirements are hidden: nothing a player reads names them (tools/lint-titles.mjs holds the UI to it), and
// nothing hints at one before it is earned (order 92: the tavern rumours of D-183 are gone, archive/titles-hints/).
//
// A.TT
//   A.deedDone(p, kind, ctx)  the one door of the deed ledger (p.dl = { kind: [count, streak, lastYear, best, keys] }):
//                             counts the deed, breaks the streaks it breaks, takes away the titles it loses, then checks
//                             only the titles that watch that kind (an index built once from the data)
//   TT.met(p, req)            the hidden predicates (vocab.json predicates), pure: no dice, no writes
//   TT.check(p, titles, x)    earns each title whose conditions are met, in id order; a unique title only while no other
//                             living holder has it (the census, A.S.tt.u), a title given once an age only once (A.S.tt.first),
//                             a title someone grants only when he grants it (A.WHY.decide, on a seeded stream of its own)
//   TT.month(pc)              the player's month: the deed lines read (a tourney won), then the titles watched by 'month'
//   TT.year()                 everyone else who matters, once a year in id order: rulers, the holders of posts, and anyone
//                             with a ledger; and the census cleaned of the dead
//   TT.held(p) / heldDefs(p)  what he holds; TT.xHeld(p) the same as skill sources for the adapter (A.CAPS)
//   TT.socialOf(h, v)         what h's titles add to v's opinion of him (A.opinion), the best group v belongs to, at most +10
//   TT.reasons(p, kind)       the reasons a title gives a decider (A.WHY: soldiers follow an Undefeated captain)
// State (optional; old saves load): p.dl (the ledger), p.tt = { h: { id: { y, w, n?, k? } } (held: the year, the world's
// sentence why, the name when it differs, the census key when it is per realm), x: { id: [y0, y1] } (lost), b (the title
// borne beside the name), hd ([ids] of the rumours heard before order 92; read by nothing now), dc (deed lines read), lw (the day of the last serious wound), gw
// ({ id: year } a grant last refused) }; A.S.tt = { u: { key: holder id }, first: { id: [holder id, year] } }.
(function () {
  const DD = A.DATA || {}, V = DD['titles/vocab'];
  if (!V) { console.error('[titles] data/titles/vocab.json is missing'); return; }
  const files = Object.keys(DD).filter(k => /^titles\//.test(k) && k !== 'titles/vocab').sort();
  const LIST = [];
  for (const f of files) for (const t of (DD[f] && DD[f].titles) || []) LIST.push(t);
  A.DATA.titles = { vocab: V, titles: LIST };
  const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const TT = A.TT = { V, LIST, BY: new Map(LIST.map(t => [t.id, t])) };
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const isPc = p => !!(p && A.S && p.id === A.S.pc);
  const RANKS = ['D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'X'], rix = r => RANKS.indexOf(r);

  // ---------------------------------------------------------------- the titles a person may earn, and the watch index
  TT.PERSON = LIST.filter(t => (t.beings || []).includes('person') && t.requires).sort(byId);
  const WATCH = TT.WATCH = new Map(), LOSE = new Map();
  for (const t of TT.PERSON) {
    for (const k of t.watch || []) { if (!WATCH.has(k)) WATCH.set(k, []); WATCH.get(k).push(t); }
    for (const l of t.lose || []) if (l && l.deed) { if (!LOSE.has(l.deed)) LOSE.set(l.deed, []); LOSE.get(l.deed).push(t); }
  }
  const SERIOUS = new Set(V.seriousWounds || []);

  // ---------------------------------------------------------------- the census (A.S.tt)
  TT.st = function () { const S = A.S; if (!S.tt || typeof S.tt !== 'object') S.tt = { u: {}, first: {} }; S.tt.u = S.tt.u || {}; S.tt.first = S.tt.first || {}; return S.tt; };
  TT.keyOf = (t, p) => (t.per === 'realm' ? t.id + ':' + ((p && p.realm) || '') : t.id);
  const legendLives = id => {
    const PW = A.POWER; if (!PW) return false;
    if (PW.MAS && PW.MAS.has(id)) return true;
    if (!PW.LEG || !PW.LEG.has(id)) return false;
    const g = A.S && A.S.pw && A.S.pw.leg && A.S.pw.leg[id];
    return !(g && g.slain);
  };
  // the living holder of a unique title's key (a person, or a great being whose sheet names the title), or null. Pure.
  TT.holder = function (key) {
    const st = A.S && A.S.tt, id = st && st.u && st.u[key], tid = String(key).split(':')[0];
    if (id != null) { const q = A.P(id); if (q && q.alive !== false && TT.holds(q, tid)) return id; }
    const t = TT.BY.get(tid);
    if (t && t.unique) for (const h of t.holders || []) if (legendLives(h)) return h;
    return null;
  };

  // ---------------------------------------------------------------- what a person holds
  TT.holds = (p, id) => !!(p && p.tt && p.tt.h && p.tt.h[id]);
  TT.held = p => (p && p.tt && p.tt.h ? Object.keys(p.tt.h).sort() : []);
  TT.heldDefs = p => TT.held(p).map(id => TT.BY.get(id)).filter(Boolean);
  TT.nameOf = (p, id) => { const h = p && p.tt && p.tt.h && p.tt.h[id], t = TT.BY.get(id); return (h && h.n) || (t && t.name) || id; };
  // the title borne beside the name ("Aldric the Undefeated"), if he bears one he still holds
  TT.borne = p => (p && p.tt && p.tt.b && TT.holds(p, p.tt.b) ? p.tt.b : null);
  TT.styled = function (p) {
    const id = TT.borne(p); if (!id) return null;
    const t = TT.BY.get(id), n = TT.nameOf(p, id), given = p.given || (A.fullName ? A.fullName(p, false) : '');
    return (t && t.style ? t.style : '{name}, ' + n).replace('{name}', given).replace('{title}', n);
  };
  // the title he chooses to bear (a press on the profile, or the earned card's choice); null bears none
  TT.bear = function (p, id) {
    if (!p) return;
    const tt = p.tt && typeof p.tt === 'object' ? p.tt : (p.tt = {});
    tt.b = id && TT.holds(p, id) ? id : null;
  };
  // a class a title carries (the Sword Saint is both a title and a class)
  TT.classOf = p => { for (const t of TT.heldDefs(p)) if (t.class) return t.class; return null; };
  // as A.POWER.being lists a being's titles: the name and the honour, never what earned it
  TT.shownOf = p => TT.heldDefs(p).map(t => ({ id: t.id, n: TT.nameOf(p, t.id), honour: t.honour || 0, buffs: {} }));

  // ---------------------------------------------------------------- the ledger
  TT.led = (p, kind) => (p && p.dl && p.dl[kind]) || null;
  A.deedDone = TT.deedDone = function (p, kind, ctx) {
    if (!p || !p.st || !A.S || p.alive === false || !V.deeds[kind]) return false;
    const dl = p.dl && typeof p.dl === 'object' ? p.dl : (p.dl = {});
    const e = Array.isArray(dl[kind]) ? dl[kind] : (dl[kind] = [0, 0, 0]);
    e[0] = (e[0] || 0) + 1; e[1] = (e[1] || 0) + 1; e[2] = A.S.year;
    if (ctx && Number.isFinite(+ctx.v) && ctx.v !== null) e[3] = Math.max(e[3] || 0, Math.round(+ctx.v));
    if (ctx && ctx.key != null && ctx.key !== '') {
      const k = String(ctx.key).replace(/[<>"]/g, '').slice(0, 40);
      if (e[3] == null) e[3] = 0;
      const ks = Array.isArray(e[4]) ? e[4] : (e[4] = []);
      if (!ks.includes(k) && ks.length < 8) ks.push(k);
    }
    for (const b of V.deeds[kind].breaks || []) if (Array.isArray(dl[b])) dl[b][1] = 0;
    for (const t of LOSE.get(kind) || []) if (TT.holds(p, t.id)) TT.lose(p, t, ctx);
    TT.check(p, WATCH.get(kind) || [], Object.assign({ deed: kind }, ctx || {}));
    return true;
  };

  // ---------------------------------------------------------------- the hidden predicates (pure)
  TT.skillAt = function (p, q) {
    const SK2 = A.SK2; if (!SK2 || !SK2.rungFor) return false;
    const want = rix(q.rank), lv = q.lv || 1;
    const ok = r => !!r && (rix(r.rank) > want || (rix(r.rank) === want && r.lv >= lv));
    if (q.fam !== 'any') return ok(SK2.rungFor(p, q.fam));
    for (const f of SK2.IX().fams) if (ok(SK2.rungFor(p, f.id))) return true;
    return false;
  };
  // the best living by a skill in his realm (ties to the lower id): read only when the cheaper conditions are met
  TT.bestIn = function (p, q) {
    if (!p.realm || !A.skill) return false;
    const k = q.measure, v = A.skill(p, k);
    if (!(v > 0)) return false;
    for (const id in A.S.people) {
      const o = A.S.people[id];
      if (!o || o === p || o.alive === false || !o.st || o.realm !== p.realm) continue;
      const w = A.skill(o, k);
      if (w > v || (w === v && String(o.id) < String(p.id))) return false;
    }
    return true;
  };
  TT.met = function (p, q, x) {
    if (!q) return true;
    if (Array.isArray(q)) return q.every(r => TT.met(p, r, x));
    if (q.all) return q.all.every(r => TT.met(p, r, x));
    if (q.any) return q.any.some(r => TT.met(p, r, x));
    if (q.not) return !TT.met(p, q.not, x);
    if (q.count) {
      const e = TT.led(p, q.count), n = e ? e[0] || 0 : 0;
      if (q.min != null && n < q.min) return false;
      if (q.max != null && n > q.max) return false;
      if (q.distinct != null && !(e && Array.isArray(e[4]) && e[4].length >= q.distinct)) return false;
      return true;
    }
    if (q.streak) { const e = TT.led(p, q.streak); return !!e && (e[1] || 0) >= (q.min || 1); }
    if (q.best) { const e = TT.led(p, q.best); return !!e && (e[3] || 0) >= (q.min || 1); }
    if (q.skill) return TT.skillAt(p, q.skill);
    if (q.has) return TT.holds(p, q.has);
    if (q.age) { const a = A.age(p); return a >= q.age[0] && a <= q.age[1]; }
    if (q.race) return q.race.includes(p.race);
    if (q.faith) return !!p.faith && (q.faith === 'any' || (Array.isArray(q.faith) && q.faith.includes(p.faith)));
    if (q.stat) return Object.keys(q.stat).every(s => A.stat(p, s) >= q.stat[s]);
    if (q.fame != null) return (p.fame || 0) >= q.fame;
    if (q.honor != null) return (p.honor || 0) >= q.honor;
    if (q.flag) return !!(p.flags && p.flags[q.flag] != null);
    if (q.only) return TT.bestIn(p, q.only);
    if (q.ruling) {
      const e = TT.led(p, q.ruling.kind);
      if (!e || !Array.isArray(e[4]) || A.S.year - (e[2] || 0) < (q.ruling.years || 0)) return false;
      return e[4].some(k => { const r = A.P(k); return !!(r && r.alive !== false && r.ruler && r.id !== p.id); });
    }
    return false;   // an unknown predicate is never met (tools/lint-titles.mjs fails it)
  };

  // ---------------------------------------------------------------- earning, granting, losing
  const tok = (s, x) => String(s || '').replace(/\{(\w+)\}/g, (m, k) => (x && x[k] != null ? String(x[k]) : m));
  TT.nameFor = (t, x) => tok(t.name, x);
  // a seeded stream of its own (the seed, the person, the title, the year): the main stream never moves for a grant
  const hash = s => { let h = 2166136261 >>> 0; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const stream = key => { let s = hash(key) >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  // a title someone grants: the realm's ruler decides through A.WHY whether to name him (once a year at most)
  TT.granted = function (p, t) {
    const r = p.realm && A.realm ? A.realm(p.realm) : null, ru = r && r.ruler != null ? A.P(r.ruler) : null;
    if (!ru || ru.id === p.id) return true;
    const tt = p.tt || (p.tt = {}), gw = tt.gw || (tt.gw = {});
    if (gw[t.id] != null && A.S.year - gw[t.id] < 1) return false;
    if (!A.WHY || !A.WHY.decide) return true;
    const op = A.opinion ? A.opinion(ru, p) : 0;
    const name = [{ kind: 'merit', weight: 1.4, label: `the best in the realm by every measure the court can see`, source: { t: 'title', id: t.id }, pub: 1 }];
    if (op) name.push({ kind: op > 0 ? 'kin' : 'fear', weight: clamp(op / 40, -1.5, 1), label: op > 0 ? 'a man the crown thinks well of' : 'a man the crown does not trust', source: { t: 'op', id: p.id }, pub: 0 });
    const opts = [{ id: 'name', reasons: name },
      { id: 'withhold', reasons: [{ kind: 'caution', weight: 0.6, label: `a name the crown gives, the crown must answer for`, source: null, pub: 1 }] }];
    const rec = A.WHY.decide(ru, 'title', opts, { rand: stream(`${A.S.seed != null ? A.S.seed : 'ardan'}|tt|${p.id}|${t.id}|${A.S.year}`), at: t.id, r: r.id });
    if (rec && rec.chose === 'name') return true;
    gw[t.id] = A.S.year;
    // nothing is said to the player when the crown withholds it: a line here told him he had met the title's conditions,
    // a hint before it was earned (order 92)
    return false;
  };
  // a title marked since is for what is reached in this age: whoever already met its conditions when titles came into the
  // world (a new game, or the first pass after an older save loads) is written down once and never earns it (the kingdom's
  // old masters are not the first of an age that began after them)
  TT.ageStart = function () {
    const st = TT.st(); if (st.pre && typeof st.pre === 'object') return st.pre;
    st.pre = {};
    for (const t of TT.PERSON) if (t.since) {
      const ids = [];
      for (const id in A.S.people) { const p = A.S.people[id]; if (p && p.alive !== false && p.st && TT.met(p, t.requires)) ids.push(String(p.id)); }
      st.pre[t.id] = ids.sort().slice(0, 400);
    }
    return st.pre;
  };
  TT.check = function (p, list, x) {
    if (!p || !p.st || p.alive === false || !A.S || !list || !list.length) return [];
    const out = [];
    for (const t of list) {
      if (TT.holds(p, t.id)) continue;
      if (t.since && (TT.ageStart()[t.id] || []).includes(String(p.id))) continue;
      if (t.once && TT.st().first[t.id]) continue;
      if (t.unique && TT.holder(TT.keyOf(t, p)) != null) continue;
      if (!TT.met(p, t.requires, x)) continue;
      if (t.grant && !TT.granted(p, t, x)) continue;
      TT.earn(p, t, x || {});
      out.push(t.id);
    }
    return out;
  };
  const placeOf = x => (x && (x.place || x.key)) || '';
  TT.earn = function (p, t, x) {
    const S = A.S, y = S.year, st = TT.st();
    const tt = p.tt && typeof p.tt === 'object' ? p.tt : (p.tt = {});
    const h = tt.h || (tt.h = {});
    const r = p.realm && A.realm ? A.realm(p.realm) : null;
    const tk = { place: placeOf(x), realm: r ? r.short || r.name : '' };
    const n = TT.nameFor(t, tk);
    const why = tok(t.earned || 'What you have done has a name now, and people have begun to say it: {title}.', Object.assign({ title: n }, tk));
    const rec = h[t.id] = { y, w: String(why).replace(/[<>"]/g, '') };
    if (n !== t.name) rec.n = n.replace(/[<>"]/g, '');
    if (t.unique) { const key = TT.keyOf(t, p); st.u[key] = p.id; if (key !== t.id) rec.k = key; }
    if (t.once) st.first[t.id] = [p.id, y];
    if (tt.x && tt.x[t.id]) delete tt.x[t.id];
    if (t.honour) p.honor = clamp((p.honor || 0) + t.honour, 0, 100);
    if (t.renown && A.fame) A.fame(p, t.renown);
    if (!TT.borne(p) && t.style) tt.b = t.id;
    (p.deeds = p.deeds || []).push({ y, t: `Called ${n}` });
    if (isPc(p)) {
      if (A.cacheResetAll) try { A.cacheResetAll(); } catch (e) {}
      A.S.queue.push({ type: 'event', ev: 'tt_earned', ctx: { tid: t.id, ttl: n, why: rec.w }, forced: true });
    } else if (t.unique || t.rarity === 'legendary') {
      if (A.news) A.news(`${A.fullName ? A.fullName(p, false) : 'Someone'}${r ? ' of ' + (r.short || r.name) : ''} is called ${n} now.`, 'crown');
    }
    return rec;
  };
  TT.lose = function (p, t) {
    const tt = p.tt, rec = tt && tt.h && tt.h[t.id]; if (!rec) return false;
    const n = TT.nameOf(p, t.id);
    delete tt.h[t.id];
    (tt.x = tt.x || {})[t.id] = [rec.y, A.S.year];
    if (tt.b === t.id) tt.b = TT.held(p).find(id => (TT.BY.get(id) || {}).style) || null;
    const st = A.S.tt; if (t.unique && st && st.u) { const key = rec.k || t.id; if (st.u[key] === p.id) delete st.u[key]; }
    if (isPc(p)) {
      if (A.cacheResetAll) try { A.cacheResetAll(); } catch (e) {}
      A.S.queue.push({ type: 'event', ev: 'tt_lost', ctx: { tid: t.id, ttl: n, lost: tok(t.lost || 'No one calls you {title} any more. The name has gone where names go.', { title: n }) }, forced: true });
    }
    return true;
  };

  // ---------------------------------------------------------------- the player's month, everyone's year
  // the release's deed lines ("Champion of ...") are deeds a title watches: read once each (vocab.json deedLines)
  const LINES = (V.deedLines || []).map(d => [new RegExp(d.rx), d.kind]);
  TT.readLines = function (p) {
    const d = Array.isArray(p.deeds) ? p.deeds : [], tt = p.tt && typeof p.tt === 'object' ? p.tt : (p.tt = {});
    if (tt.dc == null || tt.dc > d.length) { tt.dc = d.length; return; }   // the ledger starts at the first deed after it exists
    for (let i = tt.dc; i < d.length; i++) { const t = d[i] && d[i].t; if (t) for (const [rx, k] of LINES) if (rx.test(t)) TT.deedDone(p, k, { key: t.replace(rx, '').slice(0, 40) }); }
    tt.dc = d.length;
  };
  TT.month = function (pc) {
    if (!pc || pc.alive === false || !pc.st || !A.S) return;
    TT.readLines(pc);
    TT.check(pc, WATCH.get('month') || []);
  };
  TT.year = function () {
    const S = A.S; if (!S || !S.people) return 0;
    const ids = new Set();
    for (const r of Object.values(S.realms || {})) if (r && r.alive !== false && r.ruler != null) ids.add(String(r.ruler));
    const ph = S.posts && S.posts.h; if (ph) for (const k in ph) if (ph[k] && ph[k].p != null) ids.add(String(ph[k].p));
    for (const id in S.people) { const p = S.people[id]; if (p && p.dl && p.alive !== false) ids.add(String(p.id)); }
    let n = 0;
    for (const id of [...ids].sort()) {
      const p = A.P(id);
      if (!p || p.alive === false || !p.st || isPc(p)) continue;
      n += TT.check(p, WATCH.get('month') || []).length;
    }
    // the census keeps only the living
    const st = S.tt; if (st && st.u) for (const key of Object.keys(st.u)) { const q = A.P(st.u[key]); if (!q || q.alive === false) delete st.u[key]; }
    return n;
  };

  // ---------------------------------------------------------------- the sources a deed comes from (called, guarded, from
  // the release and the powers: see the README's list)
  const dayStamp = () => A.S.year * 365 + (A.today ? A.today() : 0);
  TT.wound = function (p, k) {
    if (!p || !p.st || !SERIOUS.has(k)) return;
    const tt = p.tt && typeof p.tt === 'object' ? p.tt : null;
    if (tt || isPc(p)) (p.tt = tt || {}).lw = dayStamp();
    TT.deedDone(p, 'wound_serious', { key: k });
  };
  TT.battle = function (p) {
    if (!p || !p.st) return;
    TT.deedDone(p, 'battle');
    if (p.tt && p.tt.lw != null && dayStamp() - p.tt.lw <= 31) TT.deedDone(p, 'battle_wounded');
  };
  const DRAGON_CRE = new Set(['CRE-01', 'CRE-02']);
  TT.beastSlain = function (p, beast) {
    const PW = A.POWER; if (!p || !p.st || !beast || !PW) return;
    const b = PW.being(beast); if (!b) return;
    const spId = b.sp || (typeof beast === 'string' ? beast : null), sp = spId ? PW.species(spId) || (PW.speciesOfCre ? PW.speciesOfCre(spId) : null) : null;
    const L = b.level || 0, mine = A.LV ? A.LV.level(p) : PW.level(p);
    TT.deedDone(p, 'beast_slain', { v: L });
    if (L > mine) TT.deedDone(p, 'beast_above', { v: L });
    const fam = sp && sp.fam;
    if (fam === 'dragons' || fam === 'wyrms' || (typeof beast === 'string' && DRAGON_CRE.has(beast))) TT.deedDone(p, 'dragon_slain', { v: L });
  };
  // a realm's champion: one who holds a fighting title, has won a tourney, or commands a host of his realm
  TT.isChampion = function (q) {
    if (!q || !q.st) return false;
    if (TT.heldDefs(q).some(t => (t.effects || []).some(e => e.type === 'fight'))) return true;
    const e = TT.led(q, 'tourney_won'); if (e && e[0] > 0) return true;
    if (A.POSTS && A.POSTS.holds) { try { if (A.POSTS.holds(q.id, 'army').length) return true; } catch (e2) {} }
    return false;
  };
  // A.duelConsequences: the outcome is known (beside the level's A.LV.duel)
  TT.duel = function (pc, D) {
    const b = D && D.b; if (!pc || !b || D.kind === 'spar') return;
    const foe = b.pid ? A.P(b.pid) : null;
    if (D.result === 'win' || D.result === 'beastfled') {
      if (b.beast) { if (D.result === 'win' && D.lethal && b.hp <= 0) TT.beastSlain(pc, b.beast); return; }
      if (foe && TT.isChampion(foe) && foe.realm) TT.deedDone(pc, 'champion_beaten', { key: foe.realm });
      TT.deedDone(pc, 'duel_won');
      if (foe && foe.alive !== false && foe.st) TT.deedDone(foe, 'duel_lost');
    } else if (D.result === 'lose' || D.result === 'yield') {
      if (b.beast) return;
      TT.deedDone(pc, 'duel_lost');
      if (foe && foe.alive !== false && foe.st) TT.deedDone(foe, 'duel_won');
    }
  };
  // A.fightEnd (through the level's field): the commanders of a field battle's winning divisions
  TT.field = function (won) { for (const p of won || []) TT.deedDone(p, 'battle_won'); };
  // the siege tick: a walled place whose siege was given up, after standing `days`
  TT.siegeLifted = function (P, days) {
    if (!P || !(days > 0)) return;
    const out = [], N = A.V2N || A.NOB, POSTS = A.POSTS;
    try {
      const c = N && N.countyOf ? N.countyOf(P.owner, P.id) : null;
      const h = c && POSTS && POSTS.holder ? POSTS.holder(POSTS.titleKey(c.k)) : null;
      if (h != null) out.push(A.P(h));
    } catch (e) {}
    const pc = A.pc ? A.pc() : null;
    if (pc && pc.alive && pc.home === P.id && pc.mil && !out.includes(pc)) out.push(pc);
    for (const p of out) if (p && p.alive !== false) TT.deedDone(p, 'siege_held', { v: days, key: P.name });
  };
  // a war ended by terms (not by a realm's fall): each side's ruler made the peace
  TT.warEnd = function (w, result) {
    if (!w || !w.att || !w.def) return;
    const lead = ids => { for (const rid of ids) { const r = A.realm(rid); if (r && r.alive !== false && r.ruler != null) return A.P(r.ruler); } return null; };
    if ([...w.att, ...w.def].some(rid => { const r = A.realm(rid); return r && r.alive === false; })) return;
    for (const p of [lead(w.att), lead(w.def)]) if (p && p.alive !== false) TT.deedDone(p, 'treaty_made', { key: w.id });
  };
  if (A.on) A.on('warEnd', function (w, result, text, live) { if (live) try { TT.warEnd(w, result); } catch (e) { console.error('[titles] war end', e); } });
  // a card's choice (A.eventChoose): the choices vocab.json names as deeds
  const CHOICE = new Map();
  for (const c of (V.choices && V.choices.list) || []) CHOICE.set(c.ev, c);
  TT.chose = function (pc, ev, i, success, ctx) {
    const c = CHOICE.get(ev); if (!c) return;
    const k = c.on && c.on[i]; if (!k) return;
    if (c.win && success === false) return;
    TT.deedDone(pc, k, { key: (c.key && ctx && ctx[c.key]) || '' });
  };

  // ---------------------------------------------------------------- the adapter's sources (A.CAPS) and what others read
  // a title as a skill source: rank = its weight, held at level 1, its effects as written (37-skills2/c-effects); its
  // rarity and uniqueness set the cap of its share boosts (order 95, D-192: E.CAP_BOOST, lowered by vocab.json's boost.cap)
  const XS = TT.XS = new Map();
  const BC = (V.boost && V.boost.cap) || {};
  for (const t of TT.PERSON) if (Array.isArray(t.effects) && t.effects.length) {
    const tier = t.unique ? 'unique' : t.rarity;
    XS.set(t.id, { id: 'title:' + t.id, rank: t.weight, rarity: t.rarity, unique: !!t.unique, kind: 'title', boostCap: BC[tier] != null ? BC[tier] : 0, levels: [{ at: 1, effects: t.effects }] });
  }
  TT.xHeld = function (p) {
    if (!p || !p.tt || !p.tt.h) return null;
    let out = null;
    for (const id of Object.keys(p.tt.h).sort()) { const s = XS.get(id); if (s) (out = out || []).push({ id: s.id, lv: 1 }); }
    return out;
  };
  if (A.SK2 && A.SK2.addSource) for (const s of XS.values()) A.SK2.addSource(s);
  if (A.SK2) A.SK2.xHeld = TT.xHeld;
  // the groups a viewer belongs to (for social effects)
  TT.groupsOf = function (v, h) {
    const out = ['all'], occ = String(v.occ || ''), c = v.job && v.job.c;
    if (v.mil || /soldier|guard|captain|knight|sergeant|man-at-arms|archer/i.test(occ)) out.push('soldiers');
    if (c === 'priest' || c === 'monk' || /priest|monk|nun|bishop|friar|abbot/i.test(occ)) out.push('clergy');
    if (v.status === 'noble' || v.status === 'royal' || v.status === 'gentry') out.push('nobles');
    if (v.status === 'peasant' || v.status === 'serf' || v.status === 'slave') out.push('peasants');
    if (v.status === 'merchant' || c === 'merchant') out.push('merchants');
    if (h && v.faith && v.faith === h.faith) out.push('faith');
    return out;
  };
  TT.socialOf = function (h, v) {
    if (!h || !h.tt || !h.tt.h || !v || v === h || !A.CAPS) return 0;
    const P = A.CAPS(h), soc = (P && P.social) || {};
    let best = 0;
    for (const g of TT.groupsOf(v, h)) if ((soc[g] || 0) > best) best = soc[g];
    return Math.min(V.socialMax || 10, best);
  };
  // the reasons a title gives a decider about its holder (data: a title's reasons[kind])
  TT.reasons = function (p, kind) {
    const out = [];
    for (const t of TT.heldDefs(p)) { const r = t.reasons && t.reasons[kind]; if (r) out.push({ kind: r.kind || 'merit', weight: r.weight || 0.2, label: tok(r.label || 'called {title}', { title: TT.nameOf(p, t.id) }), source: { t: 'title', id: t.id }, pub: 1 }); }
    return out;
  };
  // what a title gives, in words (no numbers): its effects' cost, from data/skills/vocab.json's prices, and its share
  // boosts at vocab.json's boost.words a whole share (D-192)
  TT.strength = function (t) {
    let c = 0;
    try { const SK2 = A.SK2; if (SK2 && SK2.E) for (const e of t.effects || []) c += e.type === 'boost' ? Math.abs(+e.v || 0) * ((V.boost && V.boost.words) || 0) : SK2.E().effectCost(SK2.IX(), e); } catch (e) {}
    for (const [at, w] of V.strength || []) if (c >= at) return w;
    return 'slight';
  };

  // no hints (order 92: "no hints throughout the games on titles"): the rumours of D-183 (TT.hintable, TT.heard, the card
  // tt_hint and Records' "Things you have heard") are in archive/titles-hints/; a save's p.tt.hd is left and read by nothing

  // ---------------------------------------------------------------- the save (version 19): the census; nothing else
  TT.migrate = function (S) {
    S = S || A.S;
    if (S && (!S.tt || typeof S.tt !== 'object')) S.tt = { u: {}, first: {} };
    return S ? Object.keys(S.tt.u || {}).length : 0;
  };

  A.onMonth = A.onMonth || [];
  A.onMonth.push(pc => { try { TT.month(pc); } catch (e) { console.error('[titles] month', e); } });
  (A.onYear = A.onYear || []).push(function () { try { TT.year(); } catch (e) { console.error('[titles] year', e); } });
})();
