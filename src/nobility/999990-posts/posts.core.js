// 999990-posts: one registry of posts (round 2 A2, the owner's rule "one holder per post"; design: docs/DECISIONS.md
// D-031 and docs/reviews/round-2/posts-map.md section 5).
//
// A post is a named place that one person holds or that stands vacant: a council seat (seat:<rid>:<seat>), a shire
// office of the polity (office:<rid>:<office id>), the command of an army in the field (army:<army id>) or of a
// division (div:<division id>). Its record in A.S.posts.h is the source of truth; the old fields (r.council[seat],
// pc.office, o.pid, a.gen, d.cmd) are its mirrors, written only by A.POSTS.appoint and A.POSTS.vacate. The writers
// already routed through it are listed in README.md; any other write to a mirror is adopted by A.POSTS.sync at the
// end of the month (counted in A.POSTS.stats.adopted, so what remains to route can be measured) and held to the
// same rules. Nothing here draws from the random stream, and the views only read.
//
// The rules (A.POSTS.audit): one holder per post; the holder alive, of age for his people, free, of the post's realm
// and not a ruler (a ruler may lead an army); one council seat a person, no seat with a shire office or with a field
// command (the Marshal may lead one army in person), one field command a person; the Marshal's seat (D-017) is filled
// only when a war needs one (two armies or two enemies) and stands empty again at peace; the player is Marshal (grade
// 9) exactly when he holds that seat, and it needs a General's commission.
(function () {
  const P = A.POSTS = A.POSTS || {};
  P.V = 1;
  const live = p => !!(p && p.alive);
  const adultOk = p => { const R = GD.RACES && GD.RACES[p.race]; return !R || A.age(p) >= R.adult; };
  const nm = p => (p ? A.fullName(p, false) : 'nobody');
  const day = () => (A.absDay ? A.absDay() : A.S.year * 365);
  const isPC = id => !!id && id === A.S.pc;
  P.stats = { adopted: {}, repaired: {}, appointed: 0, vacated: 0 };

  // ---- keys ---------------------------------------------------------------------------------------------------------
  P.seatKey = (rid, k) => `seat:${rid}:${k}`;
  P.offKey = (rid, oid) => `office:${rid}:${oid}`;
  P.armyKey = aid => `army:${aid}`;
  P.divKey = did => `div:${did}`;
  P.parse = key => {
    const i = key.indexOf(':'), kind = key.slice(0, i), rest = key.slice(i + 1);
    if (kind === 'seat' || kind === 'office') { const j = rest.indexOf(':'); return { kind, rid: rest.slice(0, j), id: rest.slice(j + 1) }; }
    return { kind, id: rest };
  };
  const CLS = { seat: 'SEAT', office: 'OFFICE', army: 'FIELD', div: 'FIELD' };
  const RANK = { SEAT: 3, OFFICE: 2, FIELD: 1 };
  P.cls = key => CLS[P.parse(key).kind];
  const isMarshalKey = key => key.startsWith('seat:') && key.endsWith(':marshal');

  // ---- the mirrors: where each kind of post was kept before the registry ----------------------------------------------
  const offOf = (rid, oid) => { const r = A.S.realms[rid]; return r && r.pol && Array.isArray(r.pol.off) ? r.pol.off.find(o => o && o.id === oid) || null : null; };
  const armyOf = id => (A.S.armies || []).find(a => a && a.id === id) || null;
  const MIR = {
    seat: {
      get: k => { const r = A.S.realms[k.rid]; return (r && r.council && r.council[k.id]) || null; },
      set(k, pid) {
        const r = A.S.realms[k.rid]; if (!r) return;
        r.council = r.council || {};
        const was = r.council[k.id];
        if (pid) r.council[k.id] = pid; else delete r.council[k.id];
        const pc = A.pc();
        if (pc && isPC(pid) && pc.office !== k.id) { pc.office = k.id; pc.officeSince = A.S.year; }
        if (pc && isPC(was) && !pid && pc.office === k.id) pc.office = null;
      },
      realm: k => k.rid,
      exists: k => { const r = A.S.realms[k.rid]; return !!(r && r.alive !== false && A.COUNCIL && A.COUNCIL[k.id]); },
      style: k => `${(A.COUNCIL[k.id] || {}).name || k.id} of ${A.realmShort ? A.realmShort(k.rid) : k.rid}`,
    },
    office: {
      get: k => { const o = offOf(k.rid, k.id); return (o && o.pid) || null; },
      set(k, pid) { const o = offOf(k.rid, k.id); if (o) { o.pid = pid || null; if (pid) o.since = A.S.year; } },
      realm: k => k.rid,
      exists: k => { const r = A.S.realms[k.rid]; return !!(r && r.alive !== false && offOf(k.rid, k.id)); },
      style: k => { const o = offOf(k.rid, k.id); return o && A.POL && A.POL.offName ? A.POL.offName(o.k, k.rid) : 'officer'; },
    },
    army: {
      get: k => { const a = armyOf(k.id); return (a && a.gen) || null; },
      set(k, pid) { const a = armyOf(k.id); if (a) a.gen = pid || null; },
      realm: k => { const a = armyOf(k.id); return a ? a.realm : null; },
      exists: k => !!armyOf(k.id),
      style: k => { const a = armyOf(k.id); return a ? `General of the ${String(a.name).replace(/^the /i, '')}` : 'General'; },
    },
    div: {
      get: k => { const d = A.divById && A.divById(k.id); return (d && d.cmd) || null; },
      set(k, pid) { const d = A.divById && A.divById(k.id); if (d) d.cmd = pid || null; },
      realm: k => { const d = A.divById && A.divById(k.id); return d ? d.r : null; },
      exists: k => !!(A.divById && A.divById(k.id)),
      style: k => { const d = A.divById && A.divById(k.id); return d ? `Commander of the ${String(d.name || 'division').replace(/^the /i, '')}` : 'Commander'; },
    },
  };
  const mir = key => { const k = P.parse(key); return [MIR[k.kind], k]; };
  P.mirror = key => { const [M, k] = mir(key); return M ? M.get(k) : null; };
  P.style = key => { const [M, k] = mir(key); return M ? M.style(k) : key; };

  // ---- the store and the index of who holds what (derived, never saved) --------------------------------------------------
  P.store = function () {
    const S = A.S; if (!S) return null;
    if (!S.posts || typeof S.posts !== 'object' || !S.posts.h) S.posts = { v: P.V, h: {} };
    return S.posts;
  };
  let IX = null;
  const index = function () {
    const st = A.S && A.S.posts;           // read only: a view asking who holds what never makes the store
    if (!st || !st.h) return new Map();
    if (IX && IX.S === A.S && IX.h === st.h) return IX.m;
    const m = new Map();
    for (const key in st.h) { const p = st.h[key].p; if (p) { let s = m.get(p); if (!s) m.set(p, (s = new Set())); s.add(key); } }
    IX = { S: A.S, h: st.h, m };
    return m;
  };
  const ixAdd = (pid, key) => { const m = index(); let s = m.get(pid); if (!s) m.set(pid, (s = new Set())); s.add(key); };
  const ixDel = (pid, key) => { const s = index().get(pid); if (s) { s.delete(key); if (!s.size) index().delete(pid); } };
  P.holder = key => { const st = A.S && A.S.posts, h = st && st.h && st.h[key]; return h ? h.p : null; };
  P.held = pid => { if (!pid || !A.S) return []; const s = index().get(pid); return s ? [...s] : []; };
  P.holds = (pid, kind) => P.held(pid).filter(k => !kind || k.startsWith(kind + ':'));
  P.seatOf = (pid, rid) => { const k = P.holds(pid, 'seat').find(x => !rid || P.parse(x).rid === rid); return k ? P.parse(k).id : null; };

  // ---- the rules ----------------------------------------------------------------------------------------------------
  // may these two posts be held together?
  P.compatible = function (a, b) {
    if (a === b) return true;
    const ca = P.cls(a), cb = P.cls(b);
    if (ca === 'SEAT' && cb === 'SEAT') return false;
    if ((ca === 'SEAT' && cb === 'OFFICE') || (ca === 'OFFICE' && cb === 'SEAT')) return false;
    if (ca === 'FIELD' && cb === 'FIELD') return false;
    if (ca === 'SEAT' && cb === 'FIELD') return isMarshalKey(a) && b.startsWith('army:');
    if (ca === 'FIELD' && cb === 'SEAT') return isMarshalKey(b) && a.startsWith('army:');
    return true;      // a shire office beside a field command or another office (9996 holds its own two-office rule)
  };
  // does realm r need a Marshal (D-017: a war more than one general can hold together: two armies in the field, or
  // two enemies at once)? keep: the seat already held stays filled while the realm is at war at all.
  P.marshalNeeded = function (r, keep) {
    if (!r || r.alive === false) return false;
    const wars = A.atWar ? A.atWar(r.id) : [];
    if (!wars.length) return false;
    if (keep) return true;
    return (A.armiesOf ? A.armiesOf(r.id).length : 0) >= 2 || (A.enemiesOf ? A.enemiesOf(r.id).length : 0) >= 2;
  };
  // why pid may not hold key ('' when he may). Pure.
  P.can = function (key, pid, o) {
    o = o || {};
    const p = A.P(pid), [M, k] = mir(key);
    if (!M) return 'no such post';
    if (!M.exists(k)) return 'the post no longer exists';
    if (!live(p)) return `${nm(p)} is not alive`;
    if (!adultOk(p)) return `${nm(p)} is not of age`;
    const kind = k.kind;
    if (kind === 'seat' || kind === 'office') {
      if (p.ruler) return 'a ruler sits on no council';
      if (p.prison) return `${nm(p)} is in prison`;
      if (p.realm !== k.rid) return `${nm(p)} is not of the realm`;
    }
    if (kind === 'div' && p.ruler) return 'a ruler commands no single division';
    if (isMarshalKey(key)) {
      const r = A.S.realms[k.rid];
      if (!o.force && !P.marshalNeeded(r, P.holder(key) === pid)) return 'the realm needs no Marshal: in peace a General leads';
      if (isPC(pid) && !(p.mil && !p.mil.merc && p.mil.rank >= 7 && p.mil.realm === k.rid)) return 'the seat of Marshal goes to a General';
    }
    return '';
  };

  // ---- writing: appoint, vacate, leave ------------------------------------------------------------------------------
  const rec = key => { const st = P.store(); return st.h[key] || (st.h[key] = { p: null }); };
  const pushPrev = (r, pid, why) => { if (!pid) return; r.prev = (r.prev || []).concat([[pid, r.s != null ? r.s : null, day(), why || '']]).slice(-3); };
  // a grudge without dice: the one who lost the post thinks less of the one who took it (and of who gave it)
  const grudge = function (a, b, d) {
    if (!live(a) || !live(b) || a.id === b.id) return;
    a.rel = a.rel || {};
    if (a.rel[b.id]) a.rel[b.id].op = A.clamp(a.rel[b.id].op + d, -100, 100);
    else if (isPC(a.id) || isPC(b.id)) a.rel[b.id] = { type: 'acquaint', op: A.clamp(d, -100, 100), since: A.S.year };
  };
  // a stored title that names a post its owner lost becomes a past one ("once Chancellor of Varenna")
  const STYLE_RX = /Marshal|Chancellor|Treasurer|Spymaster|Chaplain|General|Commander|Governor|Magistrate|Reeve|Warden|Collector|Sheriff/;
  P.unstyle = function (p, key) {
    if (!p) return;
    const style = P.style(key);
    if (typeof p.occ === 'string' && p.occ === style) p.occ = 'once ' + style;
  };
  const say = (t, c) => { if (A.log) A.log(t, c || 'warn'); };
  // the player's grade follows the Marshal's seat: 9 while he holds it, his General's grade again when he leaves it
  const pcMarshal = function (pid, on, why) {
    const pc = A.pc(); if (!pc || pc.id !== pid || !pc.mil || pc.mil.merc) return;
    if (on) {
      if (pc.mil.rank < 9) { pc.mil.preMarshal = pc.mil.rank; pc.mil.rank = 9; pc.mil.rankSince = day(); }
      if (A.ach) A.ach('marshal');
    } else if (pc.mil.rank >= 9 && !pc.ruler) {
      pc.mil.rank = Math.min(8, Math.max(7, pc.mil.preMarshal || 7));
      delete pc.mil.preMarshal;
      pc.mil.rankSince = day();
      if (why === 'peace') {
        say(`The war is over and the Marshal's baton goes back into its case. You serve on as ${GD.MIL[pc.mil.rank].title}.`, 'good');
        A.fame && A.fame(pc, 2);
      } else if (why === 'replaced' || why === 'dismissed') say(`You no longer hold the Marshal's seat. You serve on as ${GD.MIL[pc.mil.rank].title}.`, 'warn');
    }
  };

  // vacate key: the holder leaves it for why ('died', 'resigned', 'deserted', 'imprisoned', 'dismissed', 'promoted',
  // 'replaced', 'peace', 'under age', 'crowned', 'left the realm', ...). Returns the one who left, or null.
  P.vacate = function (key, why, o) {
    o = o || {};
    const st = P.store(); if (!st) return null;
    const r = st.h[key], [M, k] = mir(key);
    const pid = (r && r.p) || (M ? M.get(k) : null);
    if (M) M.set(k, null);
    if (r) { pushPrev(r, pid, why); r.p = null; r.s = null; r.vac = day(); r.w = why || ''; }
    if (!pid) return null;
    ixDel(pid, key);
    P.stats.vacated++;
    const p = A.P(pid);
    if (live(p) && why !== 'died') P.unstyle(p, key);
    if (isMarshalKey(key)) pcMarshal(pid, false, why);
    // a post whose object is gone keeps no record
    if (M && !M.exists(k)) delete st.h[key];
    return p || null;
  };

  // appoint pid to key: his posts that cannot go with it are handed over first, the holder he replaces is moved (a field
  // command swaps into the one the appointee freed) or dismissed with a grudge, then the record and the mirror are written.
  // o: { why, by (pid of who appoints), force (skip can(): the caller has decided), quiet }
  P.appoint = function (key, pid, o) {
    o = o || {};
    const no = P.can(key, pid, o);
    if (no && !o.force) return { ok: false, why: no };
    const r = rec(key), [M, k] = mir(key);
    const curId = r.p || M.get(k) || null;
    if (curId === pid) { if (M.get(k) !== pid) M.set(k, pid); if (r.p !== pid) { r.p = pid; ixAdd(pid, key); } return { ok: true, same: true }; }
    // 1. what the appointee must give up
    const freed = [];
    for (const k2 of P.held(pid)) if (!P.compatible(key, k2)) { P.vacate(k2, 'promoted'); freed.push(k2); }
    // 2. the one replaced
    let out = null;
    if (curId) {
      out = P.vacate(key, 'replaced');
      const by = A.P(o.by);
      if (live(out)) {
        grudge(out, A.P(pid), P.cls(key) === 'SEAT' ? -30 : -15);
        if (by && by.id !== out.id) grudge(out, by, -10);
        // a field command swaps into the command the appointee freed (the nearest echelon), else the man waits for one
        if (P.cls(key) === 'FIELD') {
          const kind = P.parse(key).kind, swap = freed.find(f => f.startsWith(kind + ':')) || freed.find(f => P.cls(f) === 'FIELD');
          if (swap && !P.can(swap, out.id, { force: true })) P.appoint(swap, out.id, { why: 'swap', force: true, quiet: true });
        }
      }
    }
    // 3. the record and the mirror
    pushPrev(r, null);
    r.p = pid; r.s = day(); r.w = o.why || ''; delete r.vac;
    if (o.by) r.by = o.by;
    M.set(k, pid);
    ixAdd(pid, key);
    P.stats.appointed++;
    if (isMarshalKey(key)) pcMarshal(pid, true);
    return { ok: true, out: out ? out.id : null, freed };
  };

  // everything pid holds is left for why. o.cls: only these classes ('SEAT', 'OFFICE', 'FIELD'); o.marshal: with FIELD,
  // the Marshal's seat too (it needs the commission); o.keepArmy: a new ruler keeps one army he leads in person.
  P.leaveAll = function (pid, why, o) {
    o = o || {};
    const id = pid && pid.id ? pid.id : pid;
    if (!id || !A.S) return [];
    const out = [];
    for (const key of P.held(id)) {
      const c = P.cls(key);
      const pick = !o.cls || o.cls.includes(c) || (o.marshal && isMarshalKey(key));
      if (!pick) continue;
      if (o.keepArmy && key.startsWith('army:')) continue;
      P.vacate(key, why); out.push(key);
    }
    // the player's place in a company or battalion (9997) is a field post kept by its own store
    const pc = A.pc();
    if (pc && pc.id === id && (!o.cls || o.cls.includes('FIELD')) && pc.mil && A.CO && A.CO.clearMe) A.CO.clearMe(pc);
    return out;
  };

  // ---- the month's reconciliation: adopt what other code wrote, then hold everything to the rules ---------------------
  const repair = (why, line) => { P.stats.repaired[why] = (P.stats.repaired[why] || 0) + 1; if (line && P._lines) P._lines.push(line); };
  const realmsAlive = () => Object.keys(A.S.realms || {}).map(id => A.S.realms[id]).filter(r => r && r.alive !== false);
  // every mirror in a fixed order: [key, pid]
  P.mirrors = function () {
    const out = [];
    for (const r of realmsAlive()) {
      if (r.council && A.COUNCIL) for (const s of Object.keys(A.COUNCIL)) if (r.council[s]) out.push([P.seatKey(r.id, s), r.council[s]]);
      if (r.pol && Array.isArray(r.pol.off)) for (const o of r.pol.off) if (o && o.id && o.pid) out.push([P.offKey(r.id, o.id), o.pid]);
    }
    for (const a of (A.S.armies || [])) if (a && a.id && a.gen) out.push([P.armyKey(a.id), a.gen]);
    for (const r of realmsAlive()) if (r.forces && Array.isArray(r.forces.divs)) for (const d of r.forces.divs) if (d && d.id && d.cmd) out.push([P.divKey(d.id), d.cmd]);
    return out;
  };
  // why the holder of key may not keep it ('' if he may): the parts of can() that hold for a sitting holder
  const unfit = function (key, pid) {
    const p = A.P(pid), k = P.parse(key);
    if (!p) return 'missing';
    if (!p.alive) return 'died';
    if (!adultOk(p)) return 'under age';
    if (k.kind === 'seat' || k.kind === 'office') {
      if (p.ruler) return 'crowned';
      if (p.prison) return 'imprisoned';
      if (p.realm !== k.rid) return 'left the realm';
    }
    if (k.kind === 'div' && p.ruler) return 'crowned';
    return '';
  };

  // sync(mode): mode 'load' builds the registry from an older state (the first seen of two clashing posts is kept);
  // 'month' adopts the month's writes (a new write wins over an older post of its class or a lower one). No dice.
  P.sync = function (mode) {
    const st = P.store(); if (!st || !A.S.people) return [];
    P._lines = [];
    const fresh = new Set(), seen = new Set();
    for (const [key, pid] of P.mirrors()) {
      seen.add(key);
      const r = st.h[key];
      if (r && r.p === pid) continue;
      // a write from outside the registry: adopt it
      const kind = P.parse(key).kind;
      if (mode !== 'load') P.stats.adopted[kind] = (P.stats.adopted[kind] || 0) + 1;
      const R = rec(key);
      if (R.p && R.p !== pid) { const was = A.P(R.p); ixDel(R.p, key); pushPrev(R, R.p, 'replaced'); if (live(was)) P.unstyle(was, key); }
      // clashes with what the same person already holds
      let drop = false;
      for (const k2 of P.held(pid)) {
        if (P.compatible(key, k2)) continue;
        const a = RANK[P.cls(key)], b = RANK[P.cls(k2)];
        const keepNew = a > b || (a === b && mode !== 'load' && !fresh.has(k2));
        if (keepNew) { P.vacate(k2, 'moved'); repair('two posts', `${nm(A.P(pid))} gives up ${P.style(k2)} for ${P.style(key)}`); }
        else { drop = true; break; }
      }
      if (drop) { const [M, k] = mir(key); M.set(k, null); R.p = null; R.vac = day(); R.w = 'two posts'; repair('two posts', `${nm(A.P(pid))} cannot also hold ${P.style(key)}`); continue; }
      R.p = pid; R.s = R.s && mode === 'load' ? R.s : day(); R.w = mode === 'load' ? 'found' : 'adopted'; delete R.vac;
      ixAdd(pid, key); fresh.add(key);
    }
    // records whose mirror was cleared (or whose object is gone) by code outside the registry
    for (const key of Object.keys(st.h)) {
      if (seen.has(key)) continue;
      const r = st.h[key], [M, k] = mir(key);
      if (!M || !M.exists(k)) { if (r.p) ixDel(r.p, key); delete st.h[key]; continue; }
      if (r.p) { ixDel(r.p, key); pushPrev(r, r.p, 'cleared'); r.p = null; r.vac = day(); }
      else if (!r.prev && !r.by) delete st.h[key];
    }
    // every holder able to hold
    for (const key of Object.keys(st.h)) {
      const r = st.h[key]; if (!r.p) continue;
      const why = unfit(key, r.p);
      if (why) { const p = A.P(r.p); P.vacate(key, why); repair(why, `${P.style(key)}: ${nm(p)} (${why}) leaves it`); }
    }
    syncPC(mode);
    marshals(mode);
    const lines = P._lines; P._lines = null;
    return lines;
  };

  // the player: a field command needs a commission; the Marshal's seat a General's; grade 9 needs the seat
  const syncPC = function (mode) {
    const pc = A.pc(); if (!pc || !pc.alive) return;
    const commissioned = !!(pc.mil && !pc.mil.merc);
    for (const key of P.held(pc.id)) {
      if (P.cls(key) === 'FIELD' && !commissioned && !(pc.ruler && key.startsWith('army:'))) { P.vacate(key, 'resigned'); repair('no commission', `You no longer command ${P.style(key).replace(/^\w+ of /, '')}.`); }
      else if (isMarshalKey(key) && !(commissioned && pc.mil.rank >= 7)) { P.vacate(key, 'no commission'); repair('no commission', 'The seat of Marshal goes to a General: you give it up.'); }
    }
    // pc.office mirrors his seat
    const seat = P.seatOf(pc.id);
    if (seat && pc.office !== seat) { pc.office = seat; repair('office field'); }
    else if (!seat && pc.office) { const r = A.realm(pc.realm); if (!(r && r.council && r.council[pc.office] === pc.id)) { pc.office = null; repair('office field'); } }
    // a Marshal's grade without the seat
    if (commissioned && pc.mil.rank >= 9 && !pc.ruler && !P.holds(pc.id, 'seat').some(isMarshalKey)) {
      const r = A.realm(pc.mil.realm), key = r ? P.seatKey(r.id, 'marshal') : null;
      if (key && !P.holder(key) && !P.can(key, pc.id)) P.appoint(key, pc.id, { why: 'grade', force: true });
      else { pc.mil.rank = 8; pc.mil.rankSince = day(); repair('marshal grade', 'There is no Marshal in peace: you serve as High General.'); }
    }
  };

  // D-017: the Marshal's seat is filled by the crown only when a war needs one, and stands empty again at peace
  P.pickMarshal = function (r) {
    const pcId = A.S.pc, key = P.seatKey(r.id, 'marshal'), C = [];
    for (const a of (A.armiesOf ? A.armiesOf(r.id) : [])) {
      const g = A.P(a.gen);
      if (!live(g) || g.id === pcId || g.ruler || !adultOk(g) || g.realm !== r.id) continue;
      if (P.holds(g.id, 'seat').length || P.can(key, g.id)) continue;
      C.push([g, A.skill(g, 'command') * 2 + (g.fame || 0) / 4 + A.armyMen(a) / 20000]);
    }
    C.sort((x, y) => y[1] - x[1] || (String(x[0].id) < String(y[0].id) ? -1 : 1));
    return C.length ? C[0][0] : null;
  };
  const marshals = function () {
    const pc = A.pc();
    for (const r of realmsAlive()) {
      if (!r.council && !A.COUNCIL) continue;
      const key = P.seatKey(r.id, 'marshal'), cur = P.holder(key);
      if (cur && !P.marshalNeeded(r, true)) { P.vacate(key, 'peace'); continue; }
      if (cur || !P.marshalNeeded(r) || (pc && pc.ruler === r.id) || r.landless) continue;
      const m = P.pickMarshal(r);
      if (!m) continue;
      P.appoint(key, m.id, { why: 'war', by: r.ruler });
      if (!m.occ || /^(a lord of the realm|a general)$/.test(m.occ) || /^once /.test(m.occ)) m.occ = P.style(key);
      // the Marshal takes the main host in person; its general takes the Marshal's old army
      const main = (A.armiesOf(r.id) || []).slice().sort((x, y) => y.divs.length - x.divs.length)[0];
      if (main && main.gen !== m.id && !isPC(main.gen) && P.holds(m.id, 'army').length) P.appoint(P.armyKey(main.id), m.id, { why: 'marshal', by: r.ruler, force: true });
      if (pc && pc.mil && !pc.mil.merc && pc.mil.realm === r.id && A.log) A.log(`${A.rulerStyle ? A.rulerStyle(A.P(r.ruler), r) : 'The crown'} names ${nm(m)} Marshal of ${r.short} for the war.`, 'war');
    }
  };

  // a council for a realm born in play with nobody to fill it (engine only: it makes people with the game's dice)
  P.raiseCouncil = function (r) {
    const pc = A.pc(), ru = A.P(r.ruler);
    if (!ru || !ru.alive || (pc && pc.ruler === r.id) || !A.genNoble || !A.COUNCIL) return 0;
    let n = 0;
    for (const seat of Object.keys(A.COUNCIL)) {
      if (seat === 'marshal' || (r.council && r.council[seat])) continue;
      const p = A.genNoble(r.id, 'gentry', null, A.ri(30, 55));
      if (!adultOk(p)) p.born = A.S.year - Math.round((A.S.year - p.born) * GD.RACES[p.race].adult / 16);
      const sk = A.COUNCIL[seat].skill;
      p.skills = p.skills || {}; p.skills[sk] = Math.max(p.skills[sk] || 0, A.ri(25, 50));
      if (P.appoint(P.seatKey(r.id, seat), p.id, { why: 'crown', by: ru.id }).ok) { p.occ = P.style(P.seatKey(r.id, seat)); n++; }
    }
    return n;
  };

  // ---- titles follow posts ------------------------------------------------------------------------------------------
  // the title line of someone who holds a post (the highest: a seat, then a field command, then an office)
  P.title = function (p) {
    if (!p) return '';
    const ks = P.held(p.id);
    if (!ks.length) return '';
    const by = c => ks.find(k => P.cls(k) === c);
    const k = by('SEAT') || ks.find(k2 => k2.startsWith('army:')) || ks.find(k2 => k2.startsWith('div:')) || by('OFFICE');
    return k ? P.style(k) : '';
  };
  // a stored style that names a council seat of the person's realm he does not hold becomes a past one. On load and at
  // the New Year; between, P.unstyle catches each seat that changes hands.
  const SEATW = { marshal: 'Marshal', chancellor: 'Chancellor', treasurer: 'Treasurer', spymaster: 'Spymaster', chaplain: 'Chaplain' };
  const QUICK = /Marshal|Chancellor|Treasurer|Spymaster|Chaplain/;
  P.restyle = function () {
    const styled = A.COHERENCY && A.COHERENCY.styledAs;
    if (!styled) return 0;
    let n = 0;
    for (const id in A.S.people) {
      const p = A.S.people[id];
      if (!p || !p.alive || p.realm == null || p.ruler) continue;
      for (const f of ['occ', 'title']) {
        const s = p[f];
        if (!s || typeof s !== 'string' || !QUICK.test(s)) continue;
        for (const k in SEATW) {
          if (!styled(s, SEATW[k])) continue;
          if (P.holder(P.seatKey(p.realm, k)) === p.id) continue;
          p[f] = 'once ' + s; n++;
          break;
        }
      }
    }
    if (n) repair('stale style');
    return n;
  };

  // ---- the audit: every rule, read only ------------------------------------------------------------------------------
  // The rules are read on what the game shows (the mirrors). strict: also every mirror equals its record, which holds
  // right after A.POSTS.sync (code not yet routed writes a mirror between two syncs; the sync adopts it).
  P.audit = function (o) {
    const bad = [], st = A.S && A.S.posts;
    if (!st || !st.h) return bad;
    const strict = o && o.strict, by = new Map();
    for (const [key, pid] of P.mirrors()) {
      const r = st.h[key];
      if (strict && (!r || r.p !== pid)) bad.push(`${P.style(key)}: the old field names ${nm(A.P(pid))}, the registry ${r && r.p ? nm(A.P(r.p)) : 'nobody'}`);
      const why = unfit(key, pid);
      if (why) bad.push(`${P.style(key)}: held by ${nm(A.P(pid))} (${why})`);
      (by.get(pid) || by.set(pid, []).get(pid)).push(key);
    }
    if (strict) for (const key in st.h) { const r = st.h[key]; if (r.p && P.mirror(key) !== r.p) bad.push(`${P.style(key)}: held by ${nm(A.P(r.p))} in the registry, not in the old field`); }
    for (const [pid, ks] of by) for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++)
      if (!P.compatible(ks[i], ks[j])) bad.push(`${nm(A.P(pid))} holds ${P.style(ks[i])} and ${P.style(ks[j])}`);
    for (const r of realmsAlive()) {
      const m = r.council && r.council.marshal;
      if (m && !P.marshalNeeded(r, true)) bad.push(`${r.short || r.id}: a Marshal (${nm(A.P(m))}) in peace`);
    }
    const pc = A.pc && A.pc();
    if (pc && pc.alive && pc.mil && !pc.mil.merc && !pc.ruler) {
      const r = A.realm(pc.mil.realm), seated = !!(r && r.council && r.council.marshal === pc.id);
      if (seated !== (pc.mil.rank >= 9)) bad.push(`the player's grade (${GD.MIL[pc.mil.rank].title}) and the Marshal's seat (${seated ? 'held' : 'not held'}) disagree`);
    }
    if (pc && pc.alive && pc.office) { const r = A.realm(pc.realm); if (!(r && r.council && r.council[pc.office] === pc.id)) bad.push(`the player's office (${pc.office}) is not a seat he holds`); }
    return bad;
  };

  // ---- when it runs ------------------------------------------------------------------------------------------------
  const runSync = mode => { try { if (A.S && A.S.people && A.S.realms) P.sync(mode); } catch (e) { console.error('[posts] sync', e); } };
  // the end of every month (after the other features' month work), and after the New Year's passes
  // a realm born in play gets a council (round 2 A3a: 8 of 42 had none at year 60)
  const councils = function () {
    try {
      if (A.RI && A.RI.fillCouncil) for (const r of realmsAlive()) {
        if (r.landless || (r.isRebel && !r.isNew) || !A.COUNCIL) continue;
        if (!r.council || !Object.values(r.council).some(Boolean)) { A.RI.fillCouncil(r); runSync('month'); }
        // a realm too new to have houses or kin of age: the crown raises men of its own to the four seats of peace
        if (!r.council || !Object.values(r.council).some(Boolean)) P.raiseCouncil(r);
      }
    } catch (e) { console.error('[posts] councils', e); }
  };
  A.onMonth.push(function () { runSync('month'); councils(); });
  (A.onYear = A.onYear || []).push(function () { runSync('month'); councils(); try { P.restyle(); } catch (e) { console.error('[posts] restyle', e); } });
  // a new world: the registry is built from the first councils, offices and armies
  A.on && A.on('worldInit', function () { P.store(); IX = null; runSync('load'); try { P.restyle(); } catch (e) { console.error('[posts] restyle', e); } });
  // an older save: build the registry and repair it, one line in the log for each repair the player would notice
  const des = A.deserialize;
  if (des) A.deserialize = function () {
    const out = des.apply(this, arguments);
    try {
      if (A.S && A.S.people) {
        const had = !!(A.S.posts && A.S.posts.h);
        IX = null; P.store();
        const lines = P.sync('load') || [];
        P.restyle();
        P.lastLoad = { had, lines };
        if (!had && lines.length && A.log) for (const l of lines.slice(0, 6)) A.log(`The realm's rolls are set straight: ${l}.`, 'warn');
      }
    } catch (e) { console.error('[posts] load', e); }
    return out;
  };

  // the coherency net (src/core/08-coherency-checks): the registry's own rules
  if (A.COHERENCY && A.COHERENCY.add) A.COHERENCY.add('one holder per post', () => P.audit(), { owner: 'src/nobility/999990-posts' });
})();
