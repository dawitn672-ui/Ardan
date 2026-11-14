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
// command (the Marshal may lead one army in person), one field command a person. The Marshal's seat (D-017, D-049) is
// optional: the crown fills it for a war that needs one (two armies or two enemies) and that Marshal stands down at
// peace; a ruler may also name one by his own choice at any time (and the lore's sitting Marshals are seeded so), and
// that Marshal stays. Nothing requires the seat filled or empty. The player is Marshal (grade 9) exactly when he holds
// that seat, and it needs a General's commission.
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
  // stage 2: a battalion's senior captain (9997's slot 4) and a company's captain (slots 0-3), an elite order's Grand
  // Master, a place on the player's staff, the captain of the player's free company, the head of a house, a court title
  P.coyKey = (did, b, s) => (s === 4 ? `bn:${did}:${b}` : `coy:${did}:${b}:${s}`);
  P.orderKey = (rid, oid) => `order:${rid}:${oid}`;
  P.staffKey = (pcid, slot) => `staff:${pcid}:${slot}`;
  P.freeKey = pcid => `free:${pcid}`;
  P.houseKey = hid => `house:${hid}`;
  P.titleKey = ck => `title:${ck}`;
  const PK = new Map();          // parsed keys (a key is parsed many times a month)
  P.parse = key => {
    let k = PK.get(key);
    if (k) return k;
    const i = key.indexOf(':'), kind = key.slice(0, i), rest = key.slice(i + 1);
    if (kind === 'seat' || kind === 'office' || kind === 'order' || kind === 'staff' || kind === 'title') { const j = rest.indexOf(':'); k = { kind, rid: rest.slice(0, j), id: rest.slice(j + 1) }; }
    else if (kind === 'coy' || kind === 'bn') {
      const a = rest.split(':'), s = kind === 'bn' ? 4 : +a.pop(), b = +a.pop();
      k = { kind, did: a.join(':'), b, s, id: rest };
    } else k = { kind, id: rest };
    if (PK.size > 20000) PK.clear();
    PK.set(key, k);
    return k;
  };
  // SEAT, OFFICE and FIELD as in stage 1; STAFF a place on the player's staff; HOUSE and TITLE pass by law (the house's
  // and the realm's), go with every other post and are never left by leaveAll (death hands them to the heir)
  const CLS = { seat: 'SEAT', office: 'OFFICE', army: 'FIELD', div: 'FIELD', bn: 'FIELD', coy: 'FIELD', order: 'FIELD', free: 'FIELD', staff: 'STAFF', house: 'HOUSE', title: 'TITLE' };
  const RANK = { SEAT: 3, OFFICE: 2, FIELD: 1, STAFF: 0, HOUSE: 0, TITLE: 0 };
  const LAW = { HOUSE: 1, TITLE: 1 };
  P.cls = key => CLS[P.parse(key).kind];
  const isMarshalKey = key => key.startsWith('seat:') && key.endsWith(':marshal');

  // ---- the mirrors: where each kind of post was kept before the registry ----------------------------------------------
  const offOf = (rid, oid) => { const r = A.S.realms[rid]; return r && r.pol && Array.isArray(r.pol.off) ? r.pol.off.find(o => o && o.id === oid) || null : null; };
  const armyOf = id => (A.S.armies || []).find(a => a && a.id === id) || null;
  const slotOf = k => { const d = A.divById && A.divById(k.did), b = d && Array.isArray(d.bs) ? d.bs[k.b] : null; return { d, b }; };
  const isSup = b => !!(b && A.CO && A.CO.isSup && A.CO.isSup(b.c));
  // the player's staff places (not the "Commander, <division>" and "General, <army>" places, which name the field
  // command itself): A.staffSlots, kept for as long as what decides them stands
  let SSET = null;
  const staffSet = function (pc) {
    if (!pc || !A.staffSlots) return new Set();
    const m = pc.mil, sig = `${pc.id}|${m ? m.rank + '|' + !!m.merc : '-'}|${pc.ruler || ''}|${pc.noble ? pc.noble.rung + '|' + (pc.noble.holding != null) : '-'}|${pc.job ? pc.job.c + pc.job.r : '-'}`;
    if (SSET && SSET.sig === sig && SSET.S === A.S) return SSET.set;
    let set;
    try { set = new Set(A.staffSlots(pc).filter(x => x.type !== 'div' && x.type !== 'army').map(x => x.key)); } catch (e) { set = new Set(); }
    SSET = { sig, S: A.S, set };
    return set;
  };
  // the court titles (99995-v2-nobility) ride on their holders (p.noble.court, p.noble.more): an index of the living,
  // rebuilt once a day (and when the law moves one, P.note)
  let TIX = null;
  const titleIx = function () {
    const S = A.S, key = (A.absDay ? A.absDay() : 0) + '|' + Object.keys(S.people).length;
    if (TIX && TIX.S === S && TIX.key === key) return TIX;
    const m = new Map(), dup = [], keys = new Set();
    for (const id in S.people) {
      const p = S.people[id];
      if (!p || !p.alive || !p.noble || !p.noble.court) continue;
      for (const ck of [p.noble.court].concat(p.noble.more || [])) { if (m.has(ck)) dup.push([ck, p.id]); else m.set(ck, p.id); }
    }
    const C = S.court && S.court.realms;
    if (C) for (const rid in C) for (const t of (C[rid] && C[rid].titles) || []) if (t && t.k && !t.crown) keys.add(t.k);
    TIX = { S, key, m, dup, keys };
    return TIX;
  };
  P.dirtyTitles = () => { TIX = null; };
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
    // 9997-companies: a battalion's slot 4 (its senior captain) and its companies' slots 0-3, held by a person only when
    // one is recorded (b.p[slot]); a seed (a name the slot gives itself) holds no post. A person who leaves spends the
    // slot's seed (CO.slotClear), so the same man is never in the slot and out of it at once (CRITIQUE R15)
    coy: {
      get: k => { const { b } = slotOf(k); return (b && b.p && b.p[k.s]) || null; },
      set(k, pid) {
        const { d, b } = slotOf(k); if (!b) return;
        if (pid) { (b.p = b.p || {})[k.s] = pid; if (k.s === 4) delete b.vac; if (A.CO && A.CO.touch) A.CO.touch(b); }
        else if (A.CO && A.CO.slotClear) A.CO.slotClear(d, k.b, k.s);
        else if (b.p) { delete b.p[k.s]; if (!Object.keys(b.p).length) delete b.p; }
      },
      realm: k => { const { d } = slotOf(k); return d ? d.r : null; },
      exists: k => { const { b } = slotOf(k); return !!b && (k.s === 0 || !isSup(b)); },
      style: k => {
        const { d } = slotOf(k), C = A.CO;
        if (!d || !C || !C.bnName) return k.s === 4 ? 'Senior Captain' : 'Captain';
        return k.s === 4 ? 'Senior Captain of the ' + C.bnName(d, k.b) : 'Captain of the ' + C.coName(d, k.b, k.s);
      },
    },
    // an elite order's Grand Master, who also leads the order's division (r.orders[oid] and the division's d.cmd)
    order: {
      get: k => { const r = A.S.realms[k.rid]; return (r && r.orders && r.orders[k.id]) || null; },
      set(k, pid) {
        const r = A.S.realms[k.rid]; if (!r) return;
        r.orders = r.orders || {};
        if (pid) r.orders[k.id] = pid; else delete r.orders[k.id];
        const d = A.orderDiv && A.orderDiv(k.id);
        if (d && d.r === k.rid) d.cmd = pid || null;
      },
      realm: k => k.rid,
      exists: k => { const r = A.S.realms[k.rid]; return !!(r && r.alive !== false && GD.ORDERS && GD.ORDERS[k.id]); },
      style: k => { const o = GD.ORDERS && GD.ORDERS[k.id]; return o && A.orderLeadTitle ? A.orderLeadTitle(o) : 'Grand Master'; },
    },
    // a place on the player's staff (A.staffSlots): his own pick, or the one his officer picked for him ('deleg')
    staff: {
      get: k => { const pc = A.S.people[k.rid]; if (!pc || !pc.staff) return null; const v = pc.staff[k.id]; return (v === 'deleg' ? (pc.staffD || {})[k.id] : v) || null; },
      set(k, pid) {
        const pc = A.S.people[k.rid]; if (!pc) return;
        pc.staff = pc.staff || {};
        if (pc.staff[k.id] === 'deleg') { pc.staffD = pc.staffD || {}; if (pid) pc.staffD[k.id] = pid; else delete pc.staffD[k.id]; }
        else if (pid) pc.staff[k.id] = pid; else delete pc.staff[k.id];
      },
      realm: k => { const pc = A.S.people[k.rid]; return pc ? (pc.ruler || (pc.mil && pc.mil.realm) || pc.realm) : null; },
      exists: k => isPC(k.rid) && staffSet(A.pc()).has(k.id),
      style: k => { const pc = A.S.people[k.rid]; let l = 'Staff'; try { l = A.staffLabel ? A.staffLabel(pc, k.id) : l; } catch (e) { l = 'Staff'; } return `${l} to ${nm(pc)}`; },
    },
    // the player's free company: its captain is its founder; without him it breaks up
    free: {
      get: k => { const p = A.S.people[k.id]; return p && p.company ? p.id : null; },
      set(k, pid) { const p = A.S.people[k.id]; if (p && !pid) p.company = null; },
      realm: () => null,
      exists: k => { const p = A.S.people[k.id]; return !!(p && p.company); },
      style: k => { const p = A.S.people[k.id]; return p && p.company ? `Captain of ${p.company.name}` : 'Captain of a free company'; },
    },
    // the head of a house (h.headPid): passes by the house's law (A.kill, 99994's succession), never left otherwise
    house: {
      get: k => { const h = A.S.houses && A.S.houses[k.id]; return (h && h.headPid) || null; },
      set(k, pid) { const h = A.S.houses && A.S.houses[k.id]; if (h) h.headPid = pid || null; },
      realm: k => { const h = A.S.houses && A.S.houses[k.id]; return h ? h.realm : null; },
      exists: k => { const h = A.S.houses && A.S.houses[k.id]; return !!(h && !h.extinct); },
      style: k => { const h = A.S.houses && A.S.houses[k.id]; return h ? `Head of ${h.name}` : 'Head of a house'; },
    },
    // a court title (99995): its holder carries its key; titles move only by the realm's law (A.V2F.inherit), which
    // tells the registry (P.note). The registry never writes one
    title: {
      get: k => titleIx().m.get(k.rid + ':' + k.id) || null,
      set() { TIX = null; },
      realm: k => k.rid,
      exists: k => titleIx().keys.has(k.rid + ':' + k.id),
      style: k => {
        const C = A.S.court && A.S.court.realms && A.S.court.realms[k.rid], t = C && (C.titles || []).find(x => x.k === k.rid + ':' + k.id);
        return t && t.name ? `holder of the ${t.name}` : 'a lord of the court';
      },
    },
  };
  MIR.bn = MIR.coy;
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
    if (LAW[ca] || LAW[cb]) return true;       // a house or a court title goes with any post
    // one place on the staff a person, and no councillor on it
    if (ca === 'STAFF' || cb === 'STAFF') return !(ca === cb || ca === 'SEAT' || cb === 'SEAT');
    if (ca === 'SEAT' && cb === 'SEAT') return false;
    if ((ca === 'SEAT' && cb === 'OFFICE') || (ca === 'OFFICE' && cb === 'SEAT')) return false;
    // one field command a person; a division's commander may lead one battalion of his own division in person (9997
    // puts a Commander at the head of his battalion in the line)
    if (ca === 'FIELD' && cb === 'FIELD') return ownBattalion(a, b) || ownBattalion(b, a);
    if (ca === 'SEAT' && cb === 'FIELD') return isMarshalKey(a) && b.startsWith('army:');
    if (ca === 'FIELD' && cb === 'SEAT') return isMarshalKey(b) && a.startsWith('army:');
    return true;      // a shire office beside a field command or another office (9996 holds its own two-office rule)
  };
  const ownBattalion = (a, b) => a.startsWith('div:') && b.startsWith('bn:') && P.parse(b).did === P.parse(a).id;
  // does realm r need a Marshal (D-017: a war more than one general can hold together: two armies in the field, or
  // two enemies at once)? keep: the seat already held stays filled while the realm is at war at all.
  P.marshalNeeded = function (r, keep) {
    if (!r || r.alive === false) return false;
    const wars = A.atWar ? A.atWar(r.id) : [];
    if (!wars.length) return false;
    if (keep) return true;
    return (A.armiesOf ? A.armiesOf(r.id).length : 0) >= 2 || (A.enemiesOf ? A.enemiesOf(r.id).length : 0) >= 2;
  };
  // may p take the Marshal's seat of realm rid (D-017: a General, or someone proved more capable than the generals)?
  // An NPC: he leads an army of the realm, or holds a General's grade, or commands at least as well as its best general
  // (with no army raised, as well as a seasoned one). The player's commission is checked in can().
  P.marshalFit = function (p, rid) {
    if (!p) return false;
    if (P.holds(p.id, 'army').length || (p.milRank || 0) >= 7) return true;
    const best = (A.armiesOf ? A.armiesOf(rid) : []).reduce((m, a) => { const g = A.P(a.gen); return live(g) ? Math.max(m, A.skill(g, 'command')) : m; }, 0);
    return A.skill(p, 'command') >= (best || 45);
  };
  // the ruler's own choice of a Marshal (D-049): by the ruler himself, or seeded from the lore
  const ownChoice = o => !!(o.ruler || o.why === 'ruler' || o.why === 'lore');
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
    if ((kind === 'div' || kind === 'bn' || kind === 'coy' || kind === 'order') && p.ruler) return 'a ruler commands no single division';
    if (kind === 'bn' || kind === 'coy' || kind === 'order') {
      if (p.prison) return `${nm(p)} is in prison`;
      if (p.realm !== M.realm(k)) return `${nm(p)} is not of the realm`;
    }
    if (kind === 'staff') {
      if (p.ruler) return "a ruler serves on no one's staff";
      if (p.prison) return 'a prisoner serves on no staff';
      if (P.holds(p.id, 'seat').length) return "a councillor serves on no one's staff";
      if (p.id === k.rid) return "one does not serve on one's own staff";
    }
    if (isMarshalKey(key)) {
      const r = A.S.realms[k.rid];
      // D-049: the seat is optional. A war that needs a Marshal opens it to every road (the crown's pick, the board, the
      // court, the council's offer); otherwise only the ruler's own choice fills it
      if (!o.force && !ownChoice(o) && !P.marshalNeeded(r, P.holder(key) === pid)) return 'the realm needs no Marshal now: a General leads, and only the crown may name one by its own choice';
      if (isPC(pid) && !(p.mil && !p.mil.merc && p.mil.rank >= 7 && p.mil.realm === k.rid)) return 'the seat of Marshal goes to a General';
      if (!isPC(pid) && !o.force && !P.marshalFit(p, k.rid)) return `the seat of Marshal goes to a General or a proven commander, and ${nm(p)} is neither`;
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
    // a bare seat name ("Chancellor", as some starting councils were written) is the same post: C9's re-rolled world
    // (seed 7101) kept a "Chancellor" beside the new "Chancellor of Morhaven" (coherency, one office, one styled holder)
    if (typeof p.occ === 'string' && (p.occ === style || style.startsWith(p.occ + ' of '))) p.occ = 'once ' + style;
    if (typeof p.title === 'string' && p.title && (p.title === style || style.startsWith(p.title + ' of '))) p.title = 'once ' + p.title;
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
    // an army in the field is never without a general: the crown names one at once (what A.wsDay did the next day),
    // unless it is the player's own command, or the appointment that emptied it is under way (o.keep)
    else if (k.kind === 'army' && !o.keep && why !== 'replaced' && why !== 'promoted') deputyArmy(k.id);
    // an order is never without a Grand Master while its division stands: the chapter names one at once
    else if (k.kind === 'order' && !o.keep && why !== 'replaced' && why !== 'promoted') deputyOrder(k);
    return p || null;
  };
  const deputyOrder = function (k) {
    const r = A.S.realms[k.rid], d = A.orderDiv && A.orderDiv(k.id);
    if (!r || !d || d.r !== k.rid || !A.orderMaster || P.holder(P.orderKey(k.rid, k.id))) return;
    A.orderMaster(r, k.id);
  };
  const deputyArmy = function (aid) {
    const a = armyOf(aid), pc = A.pc();
    if (!a || a.gen || !A.wsGeneralFor || (pc && pc.mil && pc.mil.army === a.id && pc.mil.rank >= 7)) return;
    const g = A.wsGeneralFor(a.realm);
    if (g && !P.can(P.armyKey(aid), g, { force: true })) P.appoint(P.armyKey(aid), g, { why: 'deputy', force: true });
  };

  const ECHELON = ['army', 'order', 'div', 'bn', 'coy'];
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
      const cur = A.P(curId);
      out = P.vacate(key, live(cur) ? 'replaced' : 'died', { keep: true });   // keep: no deputy, the appointee comes
      const by = A.P(o.by);
      if (live(out)) {
        grudge(out, A.P(pid), P.cls(key) === 'SEAT' ? -30 : -15);
        if (by && by.id !== out.id) grudge(out, by, -10);
        // a field command swaps into the command the appointee freed (the nearest echelon), else the man waits for one
        if (P.cls(key) === 'FIELD') {
          const kind = P.parse(key).kind, swap = freed.find(f => f.startsWith(kind + ':')) || ECHELON.map(e => freed.find(f => f.startsWith(e + ':'))).find(Boolean);
          if (swap && !P.can(swap, out.id, { force: true })) P.appoint(swap, out.id, { why: 'swap', force: true, quiet: true });
        }
      }
    }
    // 3. the record and the mirror
    pushPrev(r, null);
    r.p = pid; r.s = day(); r.w = o.why || ''; delete r.vac;
    if (o.by) r.by = o.by;
    // a Marshal named by the ruler's own choice (D-049) keeps the seat in peace; one named for a war stands down with it
    if (isMarshalKey(key)) { if (ownChoice(o)) r.own = 1; else delete r.own; }
    M.set(k, pid);
    ixAdd(pid, key);
    P.stats.appointed++;
    if (isMarshalKey(key)) pcMarshal(pid, true);
    return { ok: true, out: out ? out.id : null, freed };
  };

  // the write path of code that names a holder by its own lights (the crown's generals, 9996's offices, the staff's
  // commanders): appoint, unless the appointee holds a post of a higher class that cannot go with this one (a councillor
  // is not made a shire officer or a general behind the council's back); then nothing is written. The same rule the
  // month's sync applied to such writes in stage 1 (the higher class is kept), now at the moment of the write.
  P.place = function (key, pid, o) {
    const c = RANK[P.cls(key)];
    for (const k2 of P.held(pid)) if (!P.compatible(key, k2) && RANK[P.cls(k2)] > c) return { ok: false, why: `${nm(A.P(pid))} holds ${P.style(k2)}` };
    return P.appoint(key, pid, Object.assign({ force: true }, o));
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
      if (LAW[c]) continue;                       // a house or a title passes by law (A.kill names the heir)
      const pick = !o.cls || o.cls.includes(c) || (o.marshal && isMarshalKey(key));
      if (!pick) continue;
      if (o.keepArmy && key.startsWith('army:')) continue;
      if (why === 'imprisoned' && key.startsWith('free:')) continue;   // a free company waits for its captain's ransom
      P.vacate(key, why); out.push(key);
    }
    // the player's place in a company or battalion (9997): his slot is a post above; his place in the ranks goes too
    const pc = A.pc();
    if (pc && pc.id === id && (!o.cls || o.cls.includes('FIELD')) && pc.mil && A.CO && A.CO.clearMe) A.CO.clearMe(pc);
    return out;
  };

  // ---- the write paths of the stores that keep their own law (stage 2) ---------------------------------------------------
  // the head of a house: every writer of h.headPid comes here (A.kill's heir, A.houseHead, 99994's succession, 99995's
  // court, 70's split, 56's purge, the release's decisions). Before the registry exists (an old build) it writes the field.
  P.setHead = function (h, pid, why) {
    if (!h) return;
    const key = P.houseKey(h.id);
    if (pid) P.appoint(key, pid, { why: why || 'law', force: true });
    else P.vacate(key, why || 'law');
  };
  // a court title moved by the law on its holder (99994's A.V2F.inherit, 99995's court): the record follows at once
  P.note = function (key, pid, why) {
    if (!A.S || !A.S.people) return;
    if (key.startsWith('title:')) TIX = null;
    const r = rec(key);
    if (r.p === pid) return;
    if (r.p) { ixDel(r.p, key); pushPrev(r, r.p, why || 'law'); }
    if (pid) { r.p = pid; r.s = day(); r.w = why || 'law'; delete r.vac; ixAdd(pid, key); }
    else { r.p = null; r.vac = day(); }
  };
  // 9997 rebuilt a division's battalions (a recut template): a battalion kept moves its captains' posts with it, one
  // struck off takes them away
  P.rekeyDiv = function (d, old) {
    const st = A.S && A.S.posts;
    if (!st || !st.h || !d || !Array.isArray(old) || !Array.isArray(d.bs)) return;
    const moves = [];
    for (let j = 0; j < old.length; j++) { const ni = d.bs.indexOf(old[j]); if (ni !== j) moves.push([j, ni]); }
    if (!moves.length) return;
    const held = {};
    for (const [j] of moves) for (let sl = 0; sl <= 4; sl++) { const k = P.coyKey(d.id, j, sl), r = st.h[k]; if (r) { held[k] = r; delete st.h[k]; if (r.p) ixDel(r.p, k); } }
    for (const [j, ni] of moves) for (let sl = 0; sl <= 4; sl++) {
      const r = held[P.coyKey(d.id, j, sl)];
      if (!r || ni < 0) continue;
      const k2 = P.coyKey(d.id, ni, sl);
      st.h[k2] = r; if (r.p) ixAdd(r.p, k2);
    }
  };
  // a division or an army taken off the rolls: its posts are left ('disbanded'), the men who held them are named so
  const offRolls = function (keys) { for (const k of keys) if (P.holder(k) || P.mirror(k)) P.vacate(k, 'disbanded', { keep: true }); };
  P.divKeys = function (d) {
    const out = [P.divKey(d.id)];
    if (Array.isArray(d.bs)) for (let i = 0; i < d.bs.length; i++) { const b = d.bs[i]; if (b && b.p) for (const sl of Object.keys(b.p)) out.push(P.coyKey(d.id, i, +sl)); }
    return out;
  };
  const divRemove = A.divRemove;
  if (divRemove) A.divRemove = function (d) {
    try { if (d && d.id && A.S && A.S.posts && !d.elite) offRolls(P.divKeys(d)); } catch (e) { console.error('[posts] divRemove', e); }
    return divRemove.apply(this, arguments);
  };
  const demob = A.wsDemobilize;
  if (demob) A.wsDemobilize = A.wsDisband = function (a) {
    try { if (a && a.id && A.S && A.S.posts) offRolls([P.armyKey(a.id)]); } catch (e) { console.error('[posts] demobilize', e); }
    return demob.apply(this, arguments);
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
    // an elite order's division is led by its Grand Master: the order's post (below), not a division's
    for (const r of realmsAlive()) if (r.forces && Array.isArray(r.forces.divs)) for (const d of r.forces.divs) if (d && d.id && d.cmd && !d.elite) out.push([P.divKey(d.id), d.cmd]);
    // stage 2: the battalions' and companies' captains who are persons, the orders' Grand Masters, the player's staff
    // and free company, the heads of houses, the court titles
    for (const r of realmsAlive()) if (r.forces && Array.isArray(r.forces.divs)) for (const d of r.forces.divs) {
      if (!d || !d.id || !Array.isArray(d.bs)) continue;
      for (let i = 0; i < d.bs.length; i++) { const b = d.bs[i]; if (b && b.p) for (const sl of Object.keys(b.p)) if (b.p[sl]) out.push([P.coyKey(d.id, i, +sl), b.p[sl]]); }
    }
    for (const r of realmsAlive()) if (r.orders && GD.ORDERS) for (const oid of Object.keys(r.orders)) if (r.orders[oid] && GD.ORDERS[oid]) out.push([P.orderKey(r.id, oid), r.orders[oid]]);
    const pc = A.pc();
    if (pc && pc.alive) {
      if (pc.staff) { const set = staffSet(pc); for (const sl of Object.keys(pc.staff)) { if (!set.has(sl)) continue; const v = pc.staff[sl], id = v === 'deleg' ? (pc.staffD || {})[sl] : v; if (id) out.push([P.staffKey(pc.id, sl), id]); } }
      if (pc.company) out.push([P.freeKey(pc.id), pc.id]);
    }
    const H = A.S.houses || {};
    for (const hid of Object.keys(H)) { const h = H[hid]; if (h && !h.extinct && h.headPid) out.push([P.houseKey(hid), h.headPid]); }
    const T = titleIx();
    for (const [ck, pid] of T.m) if (T.keys.has(ck)) out.push([P.titleKey(ck), pid]);
    return out;
  };
  // why the holder of key may not keep it ('' if he may): the parts of can() that hold for a sitting holder
  const unfit = function (key, pid) {
    const p = A.P(pid), k = P.parse(key);
    if (!p) return 'missing';
    if (!p.alive) return 'died';
    // a child may head his house or hold his father's title (a regent acts); a free company is its founder's
    if (k.kind === 'house' || k.kind === 'title' || k.kind === 'free') return '';
    if (!adultOk(p)) return 'under age';
    if (k.kind === 'seat' || k.kind === 'office') {
      if (p.ruler) return 'crowned';
      if (p.prison) return 'imprisoned';
      if (p.realm !== k.rid) return 'left the realm';
    }
    if (k.kind === 'div' && p.ruler) return 'crowned';
    if (k.kind === 'bn' || k.kind === 'coy' || k.kind === 'order') {
      if (p.ruler) return 'crowned';
      if (p.prison && !isPC(p.id)) return 'imprisoned';
      const rr = MIR[k.kind].realm(k);
      if (rr && p.realm !== rr && !isPC(p.id)) return 'left the realm';
    }
    if (k.kind === 'staff') {
      if (p.ruler) return 'crowned';
      if (p.prison) return 'imprisoned';
    }
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
      if (drop) { const [M, k] = mir(key); M.set(k, null); R.p = null; R.vac = day(); R.w = 'two posts'; repair('two posts', `${nm(A.P(pid))} cannot also hold ${P.style(key)}`); if (k.kind === 'army') deputyArmy(k.id); continue; }
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
    // an order's division follows its Grand Master
    for (const r of realmsAlive()) if (r.orders && GD.ORDERS) for (const oid of Object.keys(r.orders)) {
      const d = r.orders[oid] && A.orderDiv && A.orderDiv(oid);
      if (d && d.r === r.id && d.cmd !== r.orders[oid]) { d.cmd = r.orders[oid]; repair('order division'); }
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
      if (P.cls(key) === 'FIELD' && !commissioned && !(pc.ruler && key.startsWith('army:')) && !key.startsWith('free:')) { P.vacate(key, 'resigned'); repair('no commission', `You no longer command ${P.style(key).replace(/^\w+ of /, '')}.`); }
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
      else { pc.mil.rank = 8; pc.mil.rankSince = day(); repair('marshal grade', 'The crown has named no Marshal: you serve as High General.'); }
    }
  };

  // D-017, D-049: the crown fills the Marshal's seat when a war needs one; that Marshal stands down at peace. A Marshal of
  // the ruler's own choice (r.own) stays in peace and war alike: nothing forces the seat filled or empty
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
      const key = P.seatKey(r.id, 'marshal'), cur = P.holder(key), R = cur && A.S.posts.h[key];
      if (cur && !(R && R.own) && !P.marshalNeeded(r, true)) { P.vacate(key, 'peace'); continue; }
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
    const by = c => ks.find(k => P.cls(k) === c), kind = x => ks.find(k2 => k2.startsWith(x + ':'));
    // a house or a court title is a rank, not a post's title line (the person view shows it beside the name)
    const k = by('SEAT') || kind('army') || kind('order') || kind('div') || kind('bn') || kind('coy') || by('OFFICE') || by('STAFF');
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
    const once = new Map();
    for (const [key, pid] of P.mirrors()) {
      const r = st.h[key];
      if (once.has(key) && once.get(key) !== pid) bad.push(`${P.style(key)}: two holders, ${nm(A.P(once.get(key)))} and ${nm(A.P(pid))}`);
      once.set(key, pid);
      if (strict && (!r || r.p !== pid)) bad.push(`${P.style(key)}: the old field names ${nm(A.P(pid))}, the registry ${r && r.p ? nm(A.P(r.p)) : 'nobody'}`);
      const why = unfit(key, pid);
      if (why) bad.push(`${P.style(key)}: held by ${nm(A.P(pid))} (${why})`);
      (by.get(pid) || by.set(pid, []).get(pid)).push(key);
    }
    if (strict) for (const key in st.h) { const r = st.h[key]; if (r.p && P.mirror(key) !== r.p) bad.push(`${P.style(key)}: held by ${nm(A.P(r.p))} in the registry, not in the old field`); }
    // a court title carried by two living people (99995 keeps the key on its holder)
    for (const [ck, pid] of titleIx().dup) bad.push(`${P.style(P.titleKey(ck))}: two holders, ${nm(A.P(titleIx().m.get(ck)))} and ${nm(A.P(pid))}`);
    // an order's division is led by its Grand Master
    for (const r of realmsAlive()) if (r.orders && GD.ORDERS) for (const oid of Object.keys(r.orders)) {
      const d = r.orders[oid] && A.orderDiv && A.orderDiv(oid);
      if (d && d.r === r.id && d.cmd !== r.orders[oid]) bad.push(`${P.style(P.orderKey(r.id, oid))}: the order's division is led by ${nm(A.P(d.cmd))}, not its Grand Master`);
    }
    for (const [pid, ks] of by) for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++)
      if (!P.compatible(ks[i], ks[j])) bad.push(`${nm(A.P(pid))} holds ${P.style(ks[i])} and ${P.style(ks[j])}`);
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
