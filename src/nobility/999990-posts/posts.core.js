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
// command, one field command a person.
//
// W1-1 (D-064, D-066): there is no Marshal. A division of the war map is a host and its commander a General; the
// General of the crown's first host (P.firstHost: the realm's oldest standing host, kept while it stands) is the
// realm's senior General. He sits at the council in the place the Marshal's seat had (r.council.general, a mirror of
// the first host's post, never a seat of its own: seat:<realm>:general is read as div:<first host>) and does its
// yearly task, and nothing else: he commands no other General. The crown keeps the place filled (P.fillGenerals, the
// month's engine pass). An old save's Marshal becomes his realm's senior General on load (P.migrateMarshal).
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
  // W1-1: the senior General's place at council reads the first host's post; the old Marshal's seat is gone
  const isGenSeat = key => key.startsWith('seat:') && key.endsWith(':general');
  const isOldMarshal = key => key.startsWith('seat:') && key.endsWith(':marshal');
  // the realm's first host (pure): the stored one while it stands, else the oldest standing host of 3,000 men or more
  P.firstHost = function (r) {
    if (!r || r.alive === false || !r.forces || !Array.isArray(r.forces.divs)) return null;
    const ds = r.forces.divs;
    if (r.firstHost) { const d = ds.find(x => x && x.id === r.firstHost && !x.elite); if (d) return d; }
    return ds.find(x => x && x.id && !x.elite && x.men >= 3e3) || null;
  };
  // the post a key names: the senior General's place is the first host's command
  P.realKey = function (key) {
    if (!key || !isGenSeat(key)) return key;
    const d = P.firstHost(A.S.realms[P.parse(key).rid]);
    return d ? P.divKey(d.id) : null;
  };

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
  // the court titles (99995-v2-nobility) ride on their holders (p.noble.court, p.noble.more), and each title remembers
  // its holder (t.pid, kept by 99995 at every move): an index read from the titles, never from all the people (a
  // monthly scan of the people cost the year turn; CI 112), rebuilt once a day and when the law moves one (P.note)
  let TIX = null;
  const carries = (p, ck) => !!(p && p.alive && p.noble && (p.noble.court === ck || (p.noble.more || []).includes(ck)));
  const titleIx = function () {
    const S = A.S, key = A.absDay ? A.absDay() : 0;
    if (TIX && TIX.S === S && TIX.key === key) return TIX;
    const m = new Map(), keys = new Set(), C = S.court && S.court.realms;
    if (C) for (const rid of Object.keys(C)) for (const t of (C[rid] && C[rid].titles) || []) {
      if (!t || !t.k || t.crown) continue;
      keys.add(t.k);
      if (t.pid && carries(S.people[t.pid], t.k)) m.set(t.k, t.pid);
    }
    TIX = { S, key, m, keys };
    return TIX;
  };
  // a court title carried by two living people (the audit only: it reads every person)
  const titleDups = function () {
    const S = A.S, seen = new Map(), dup = [];
    for (const id in S.people) {
      const p = S.people[id];
      if (!p || !p.alive || !p.noble || !p.noble.court) continue;
      for (const ck of [p.noble.court].concat(p.noble.more || [])) { if (seen.has(ck)) dup.push([ck, seen.get(ck), p.id]); else seen.set(ck, p.id); }
    }
    return dup;
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
      exists: k => { const r = A.S.realms[k.rid]; return !!(r && r.alive !== false && A.COUNCIL && A.COUNCIL[k.id] && k.id !== 'general'); },
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
      // W1-1: a division is a host, and its commander a General; the first host's is the senior General
      style: k => {
        const d = A.divById && A.divById(k.id);
        if (!d) return 'General';
        const r = A.S.realms[d.r], f = r && P.firstHost(r);
        return f && f.id === d.id ? `Senior General of ${A.realmShort ? A.realmShort(d.r) : d.r}` : `General of the ${String(d.name || 'host').replace(/^the /i, '')}`;
      },
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
        // W1-1: a battalion's head leads a wing: a Commander
        if (!d || !C || !C.bnName) return k.s === 4 ? 'Commander' : 'Captain';
        return k.s === 4 ? 'Commander of the ' + C.bnName(d, k.b) : 'Captain of the ' + C.coName(d, k.b, k.s);
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
  P.holder = key => { key = P.realKey(key); const st = A.S && A.S.posts, h = key && st && st.h && st.h[key]; return h ? h.p : null; };
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
    if ((ca === 'SEAT' && cb === 'FIELD') || (ca === 'FIELD' && cb === 'SEAT')) return false;
    return true;      // a shire office beside a field command or another office (9996 holds its own two-office rule)
  };
  const ownBattalion = (a, b) => a.startsWith('div:') && b.startsWith('bn:') && P.parse(b).did === P.parse(a).id;
  // may p lead the crown's first host (W1-1: a General, or someone proved as able as the realm's Generals)? An NPC: he
  // holds a host or an army, or a General's grade, or commands at least as well as the best general in the field (with
  // no army raised, as well as a seasoned one). The player's commission is checked in can().
  P.generalFit = function (p, rid) {
    if (!p) return false;
    if (P.holds(p.id, 'army').length || P.holds(p.id, 'div').length || (p.milRank || 0) >= 6) return true;
    const best = (A.armiesOf ? A.armiesOf(rid) : []).reduce((m, a) => { const g = A.P(a.gen); return live(g) ? Math.max(m, A.skill(g, 'command')) : m; }, 0);
    return A.skill(p, 'command') >= (best || 45);
  };
  // the senior General of realm r (the holder of its first host), and whether pid is one
  P.seniorGeneral = r => { const d = P.firstHost(r); return d ? P.holder(P.divKey(d.id)) : null; };
  P.isSeniorGeneral = function (pid) {
    if (!pid || !A.S) return false;
    for (const k of P.holds(pid, 'div')) { const d = A.divById && A.divById(P.parse(k).id), r = d && A.S.realms[d.r], f = r && P.firstHost(r); if (f && f.id === d.id) return true; }
    return false;
  };
  // why pid may not hold key ('' when he may). Pure.
  P.can = function (key, pid, o) {
    o = o || {};
    if (isGenSeat(key)) {
      const rk = P.realKey(key), rid = P.parse(key).rid, p = A.P(pid);
      if (!rk) return 'the realm has no standing host for a General to lead';
      if (p && p.ruler) return 'a ruler commands no single host';
      if (p && p.prison) return `${nm(p)} is in prison`;
      if (p && p.realm !== rid) return `${nm(p)} is not of the realm`;
      if (p && isPC(pid) && !(p.mil && !p.mil.merc && p.mil.rank >= 6 && p.mil.realm === rid)) return 'the first host goes to a General';
      if (p && !isPC(pid) && !o.force && !P.generalFit(p, rid)) return `the first host goes to a General or a proven commander, and ${nm(p)} is neither`;
      key = rk;
    }
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
    else if (isPC(a.id) || isPC(b.id)) {
      a.rel[b.id] = { type: 'acquaint', op: A.clamp(d, -100, 100), since: A.S.year };
      if (isPC(a.id) && A.metNote) a.rel[b.id].met = A.metNote(b, 'court');   // C6 (D-057): how you met
    }
  };
  // a stored title that names a post its owner lost becomes a past one ("once Chancellor of Varenna")
  const STYLE_RX = /Chancellor|Treasurer|Spymaster|Chaplain|General|Commander|Governor|Magistrate|Reeve|Warden|Collector|Sheriff/;
  P.unstyle = function (p, key) {
    if (!p) return;
    const style = P.style(key);
    // a bare seat name ("Chancellor", as some starting councils were written) is the same post: C9's re-rolled world
    // (seed 7101) kept a "Chancellor" beside the new "Chancellor of Morhaven" (coherency, one office, one styled holder)
    if (typeof p.occ === 'string' && (p.occ === style || style.startsWith(p.occ + ' of '))) p.occ = 'once ' + style;
    if (typeof p.title === 'string' && p.title && (p.title === style || style.startsWith(p.title + ' of '))) p.title = 'once ' + p.title;
  };
  const say = (t, c) => { if (A.log) A.log(t, c || 'warn'); };

  // vacate key: the holder leaves it for why ('died', 'resigned', 'deserted', 'imprisoned', 'dismissed', 'promoted',
  // 'replaced', 'peace', 'under age', 'crowned', 'left the realm', ...). Returns the one who left, or null.
  P.vacate = function (key, why, o) {
    o = o || {};
    key = P.realKey(key);
    const st = P.store(); if (!st || !key) return null;
    const r = st.h[key], [M, k] = mir(key);
    const pid = (r && r.p) || (M ? M.get(k) : null);
    if (M) M.set(k, null);
    if (r) { pushPrev(r, pid, why); r.p = null; r.s = null; r.vac = day(); r.w = why || ''; }
    if (!pid) return null;
    ixDel(pid, key);
    P.stats.vacated++;
    const p = A.P(pid);
    if (live(p) && why !== 'died') P.unstyle(p, key);
    // W1-1: the first host's General leaves the council's place with it
    if (k.kind === 'div') mirrorSenior();
    // a post whose object is gone keeps no record
    if (M && !M.exists(k)) delete st.h[key];
    // an army in the field is never without a general: the crown names one at once (what A.wsDay did the next day),
    // unless it is the player's own command, or the appointment that emptied it is under way (o.keep)
    else if (k.kind === 'army' && !o.keep && why !== 'replaced' && why !== 'promoted') deputyArmy(k.id);
    // an order is never without a Grand Master while its division stands: the chapter names one at once
    else if (k.kind === 'order' && !o.keep && why !== 'replaced' && why !== 'promoted') deputyOrder(k);
    // a shire office whose holder died is filled the next day (9996-polity, POL.refillSoon), not at the year's fill months
    // later; one left for a higher post is filled when that appointment is done (P.appoint; CI 119, poOfficesFilled: a
    // reeve promoted in the second month left the office empty)
    else if (k.kind === 'office' && why === 'died' && A.POL && A.POL.refillSoon) A.POL.refillSoon(k.rid);
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
    key = P.realKey(key);
    if (!key) return { ok: false, why: 'the realm has no standing host for a General to lead' };
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
        if (!o.noGrudge) grudge(out, A.P(pid), P.cls(key) === 'SEAT' ? -30 : -15);
        if (by && by.id !== out.id && !o.noGrudge) grudge(out, by, -10);
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
    delete r.own;
    M.set(k, pid);
    ixAdd(pid, key);
    P.stats.appointed++;
    // W1-1: the first host's General sits at the council at once (the month's sync keeps the mirror after)
    if (key.startsWith('div:')) mirrorSenior();
    // a shire office the appointee gave up is filled now, the appointment done (9996-polity; CI 119)
    if (A.POL && A.POL.refillNow) for (const f of freed) if (f.startsWith('office:')) A.POL.refillNow(P.parse(f).rid);
    return { ok: true, out: out ? out.id : null, freed };
  };

  // the write path of code that names a holder by its own lights (the crown's generals, 9996's offices, the staff's
  // commanders): appoint, unless the appointee holds a post of a higher class that cannot go with this one (a councillor
  // is not made a shire officer or a general behind the council's back); then nothing is written. The same rule the
  // month's sync applied to such writes in stage 1 (the higher class is kept), now at the moment of the write.
  P.place = function (key, pid, o) {
    key = P.realKey(key);
    if (!key) return { ok: false, why: 'no such post' };
    const c = RANK[P.cls(key)];
    for (const k2 of P.held(pid)) if (!P.compatible(key, k2) && RANK[P.cls(k2)] > c) return { ok: false, why: `${nm(A.P(pid))} holds ${P.style(k2)}` };
    return P.appoint(key, pid, Object.assign({ force: true }, o));
  };

  // everything pid holds is left for why. o.cls: only these classes ('SEAT', 'OFFICE', 'FIELD'; the first host, with the
  // senior General's place at council, is a FIELD post); o.keepArmy: a new ruler keeps one army he leads in person.
  P.leaveAll = function (pid, why, o) {
    o = o || {};
    const id = pid && pid.id ? pid.id : pid;
    if (!id || !A.S) return [];
    const out = [];
    for (const key of P.held(id)) {
      const c = P.cls(key);
      if (LAW[c]) continue;                       // a house or a title passes by law (A.kill names the heir)
      const pick = !o.cls || o.cls.includes(c);
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
    const out = divRemove.apply(this, arguments);
    // W1-1: a first host struck off: the council's place follows the next one
    try { if (A.S && A.S.posts && d && !d.elite) { const r = A.S.realms[d.r]; if (r && r.firstHost === d.id) fixFirstHost(r); mirrorSenior(); } } catch (e) { console.error('[posts] divRemove', e); }
    return out;
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
  // law: also the houses and the court titles (every call but the month's: their writers all go through the registry, so
  // the month's pass leaves their 1,000-odd records to the New Year's, which a bot year's turn could feel; CI 112)
  P.mirrors = function (law) {
    if (law === undefined) law = true;
    const out = [];
    for (const r of realmsAlive()) {
      // the senior General's place (r.council.general) mirrors the first host's post, which is read below
      if (r.council && A.COUNCIL) for (const s of Object.keys(A.COUNCIL)) if (s !== 'general' && r.council[s]) out.push([P.seatKey(r.id, s), r.council[s]]);
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
    if (!law) return out;
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
  // 'month' adopts the month's writes (a new write wins over an older post of its class or a lower one), and leaves the
  // houses and court titles to 'year' (the New Year's, otherwise the same as 'month'). No dice.
  const isLaw = key => key.charCodeAt(0) === 104 || key.startsWith('title:');   // house: / title:
  P.sync = function (mode) {
    const st = P.store(); if (!st || !A.S.people) return [];
    P._lines = [];
    const law = mode !== 'month';
    const fresh = new Set(), seen = new Set();
    for (const [key, pid] of P.mirrors(law)) {
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
      if (seen.has(key) || (!law && isLaw(key))) continue;
      const r = st.h[key], [M, k] = mir(key);
      if (!M || !M.exists(k)) { if (r.p) ixDel(r.p, key); delete st.h[key]; continue; }
      if (r.p) { ixDel(r.p, key); pushPrev(r, r.p, 'cleared'); r.p = null; r.vac = day(); }
      else if (!r.prev && !r.by) delete st.h[key];
    }
    // every holder able to hold
    for (const key of Object.keys(st.h)) {
      const r = st.h[key]; if (!r.p || (!law && isLaw(key))) continue;
      const why = unfit(key, r.p);
      if (why) { const p = A.P(r.p); P.vacate(key, why); repair(why, `${P.style(key)}: ${nm(p)} (${why}) leaves it`); }
    }
    // an order's division follows its Grand Master
    for (const r of realmsAlive()) if (r.orders && GD.ORDERS) for (const oid of Object.keys(r.orders)) {
      const d = r.orders[oid] && A.orderDiv && A.orderDiv(oid);
      if (d && d.r === r.id && d.cmd !== r.orders[oid]) { d.cmd = r.orders[oid]; repair('order division'); }
    }
    syncPC(mode);
    generals(mode);
    const lines = P._lines; P._lines = null;
    return lines;
  };

  // the player: a field command needs a commission; the first host a General's grade
  const syncPC = function (mode) {
    const pc = A.pc(); if (!pc || !pc.alive) return;
    const commissioned = !!(pc.mil && !pc.mil.merc);
    for (const key of P.held(pc.id)) {
      if (P.cls(key) === 'FIELD' && !commissioned && !(pc.ruler && key.startsWith('army:')) && !key.startsWith('free:')) { P.vacate(key, 'resigned'); repair('no commission', `You no longer command ${P.style(key).replace(/^\w+ of /, '')}.`); }
    }
    if (commissioned && pc.mil.rank < 6 && P.isSeniorGeneral(pc.id)) for (const key of P.holds(pc.id, 'div')) { P.vacate(key, 'no commission'); repair('no commission', 'The first host goes to a General: you give it up.'); }
    // W1-1: no grade above General (an old save's High General or Marshal is a General)
    if (pc.mil && pc.mil.rank > GD.MIL.length - 1) { pc.mil.rank = GD.MIL.length - 1; repair('old grade'); }
    // pc.office mirrors his seat, or the senior General's place
    const seat = P.seatOf(pc.id) || (P.isSeniorGeneral(pc.id) ? 'general' : null);
    if (seat && pc.office !== seat) { pc.office = seat; pc.officeSince = A.S.year; repair('office field'); }
    else if (!seat && pc.office) { const r = A.realm(pc.realm); if (!(r && r.council && r.council[pc.office] === pc.id && pc.office !== 'general')) { pc.office = null; repair('office field'); } }
  };

  // ---- the senior General (W1-1, D-064 point 3) ----------------------------------------------------------------------
  // every realm's first host is fixed (kept while it stands; else the oldest standing host of 3,000 men or more), and
  // the council's place for the army mirrors whoever leads it. No dice: the crown's naming is P.fillGenerals.
  const fixFirstHost = function (r) {
    const d = P.firstHost(r), id = d ? d.id : null;
    if ((r.firstHost || null) !== id) { if (id) r.firstHost = id; else delete r.firstHost; }
    return d;
  };
  const mirrorSenior = function () {
    const pc = A.pc();
    for (const r of realmsAlive()) {
      const d = P.firstHost(r), g = d ? P.holder(P.divKey(d.id)) : null;
      if (g) { r.council = r.council || {}; if (r.council.general !== g) r.council.general = g; }
      else if (r.council && r.council.general) delete r.council.general;
      if (pc && pc.alive && g === pc.id && A.ach) A.ach('senior_general');
    }
  };
  const generals = function () {
    for (const r of realmsAlive()) fixFirstHost(r);
    mirrorSenior();
  };
  // the crown names the General of its first host when the place is empty: its best General at hand (a General's grade
  // or a proven commander of the realm who holds no other post), else one of its great houses' heads, else a man raised
  // for it (A.wsGeneralFor). Engine only (it may make a person with the game's dice); a player ruler names his own.
  P.fillGenerals = function () {
    const pc = A.pc(), want = new Map();
    // an army in the field left without a general (an old save's Marshal took the first host on load) gets one now
    for (const a of (A.S.armies || [])) if (a && a.id && !a.gen) deputyArmy(a.id);
    for (const r of realmsAlive()) {
      if (r.landless || (r.isRebel && !r.isNew) || !r.ruler || (pc && pc.ruler === r.id)) continue;
      const d = fixFirstHost(r);
      if (d && !P.holder(P.divKey(d.id)) && !d.cmd) want.set(r.id, { r, d, top: [] });
    }
    if (!want.size) return 0;
    for (const id in A.S.people) {
      const p = A.S.people[id], w = p && p.alive && want.get(p.realm);
      if (!w || p.ruler || p.prison || isPC(p.id) || !adultOk(p)) continue;
      const RR = GD.RACES && GD.RACES[p.race];
      if (RR && RR.old && A.age(p) > RR.old + 5) continue;
      if (P.held(p.id).some(k => { const c = P.cls(k); return c === 'SEAT' || c === 'OFFICE' || c === 'FIELD' || c === 'STAFF'; })) continue;
      if (!((p.milRank || 0) >= 6 || A.skill(p, 'command') >= 45)) continue;
      const v = A.skill(p, 'command') * 2 + (p.fame || 0) / 4 + ((p.milRank || 0) >= 6 ? 20 : 0);
      // W1-2: the three best at hand go before the crown (best first; ties by id)
      const top = w.top = w.top || [];
      if (top.length < 3 || v > top[top.length - 1].v || (v === top[top.length - 1].v && String(p.id) < String(top[top.length - 1].p.id))) {
        top.push({ p, v });
        top.sort((a, b) => b.v - a.v || (String(a.p.id) < String(b.p.id) ? -1 : 1));
        if (top.length > 3) top.length = 3;
      }
    }
    let n = 0;
    for (const w of want.values()) {
      // W1-2 (D-069): the crown chooses among them through A.WHY: merit nearly settles it, the king's temper and
      // ties bend it (kin of his house; a wary king and a General the soldiers love), and the choice is recorded
      let p = w.top && w.top.length ? w.top[0].p : null;
      if (p && A.WHY && A.WHY.appointGeneral) {
        const rec = A.WHY.appointGeneral(w.r, w.top), c = rec && w.top.find(x => String(x.p.id) === String(rec.chose));
        if (c) p = c.p;
      }
      if (!p && A.wsGeneralFor) p = A.P(A.wsGeneralFor(w.r.id));
      if (!live(p) || isPC(p.id) || P.can(P.divKey(w.d.id), p.id)) continue;
      if (P.place(P.divKey(w.d.id), p.id, { why: 'crown', by: w.r.ruler }).ok) {
        n++;
        p.milRank = Math.max(p.milRank || 0, 6);
        if (!p.occ || /^(a lord of the realm|a general)$/.test(p.occ) || /^once /.test(p.occ)) p.occ = P.style(P.divKey(w.d.id));
      }
    }
    if (n) mirrorSenior();
    return n;
  };

  // a council for a realm born in play with nobody to fill it (engine only: it makes people with the game's dice)
  P.raiseCouncil = function (r) {
    const pc = A.pc(), ru = A.P(r.ruler);
    if (!ru || !ru.alive || (pc && pc.ruler === r.id) || !A.genNoble || !A.COUNCIL) return 0;
    let n = 0;
    for (const seat of Object.keys(A.COUNCIL)) {
      if (seat === 'general' || (r.council && r.council[seat])) continue;
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
  const SEATW = { general: 'Senior General', chancellor: 'Chancellor', treasurer: 'Treasurer', spymaster: 'Spymaster', chaplain: 'Chaplain' };
  const QUICK = /Senior General|Chancellor|Treasurer|Spymaster|Chaplain/;
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
    for (const [ck, a1, a2] of titleDups()) bad.push(`${P.style(P.titleKey(ck))}: two holders, ${nm(A.P(a1))} and ${nm(A.P(a2))}`);
    // an order's division is led by its Grand Master
    for (const r of realmsAlive()) if (r.orders && GD.ORDERS) for (const oid of Object.keys(r.orders)) {
      const d = r.orders[oid] && A.orderDiv && A.orderDiv(oid);
      if (d && d.r === r.id && d.cmd !== r.orders[oid]) bad.push(`${P.style(P.orderKey(r.id, oid))}: the order's division is led by ${nm(A.P(d.cmd))}, not its Grand Master`);
    }
    for (const [pid, ks] of by) for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++)
      if (!P.compatible(ks[i], ks[j])) bad.push(`${nm(A.P(pid))} holds ${P.style(ks[i])} and ${P.style(ks[j])}`);
    const pc = A.pc && A.pc();
    if (pc && pc.alive && pc.mil && !pc.mil.merc && !GD.MIL[pc.mil.rank]) bad.push(`the player's grade (${pc.mil.rank}) is above General`);
    if (pc && pc.alive && pc.office) { const r = A.realm(pc.realm); if (!(r && r.council && r.council[pc.office] === pc.id)) bad.push(`the player's office (${pc.office}) is not a seat he holds`); }
    // W1-1: no Marshal's seat anywhere; the council's place for the army is the first host's General
    for (const key in st.h) if (isOldMarshal(key)) bad.push(`${key}: an old council seat above the Generals is still on the rolls`);
    for (const r of realmsAlive()) {
      if (r.council && r.council.marshal) bad.push(`${r.id}: an old council seat above the Generals is still filled`);
      const g = P.seniorGeneral(r);
      if (strict && r.firstHost && ((r.council && r.council.general) || null) !== (g || null)) bad.push(`${r.id}: the council's General is not the first host's`);
    }
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
  const fill = () => { try { if (A.S && A.S.people && A.S.realms) P.fillGenerals(); } catch (e) { console.error('[posts] generals', e); } };
  A.onMonth.push(function () { runSync('month'); councils(); fill(); });
  (A.onYear = A.onYear || []).push(function () { runSync('year'); councils(); try { P.restyle(); } catch (e) { console.error('[posts] restyle', e); } });
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
        // W1-1: the Marshal's seat is laid down before the registry is built; its holder takes the first host after
        const pend = P.migrateMarshal();
        const lines = P.sync('load') || [];
        P.seatMarshals(pend);
        P.restyle();
        P.lastLoad = { had, lines };
        if (!had && lines.length && A.log) for (const l of lines.slice(0, 6)) A.log(`The realm's rolls are set straight: ${l}.`, 'warn');
      }
    } catch (e) { console.error('[posts] load', e); }
    return out;
  };

  // ---- an old save (W1-1, D-064, docs/design/war.md §15): no Marshal, no grade above General ---------------------------
  // the old words of a rank in a stored style (pure on a string)
  P.oldWords = s => typeof s !== 'string' || !/Marshal|High General|File-?[Ll]eader|Squad Captain|Senior Captain/.test(s) ? s
    : s.replace(/Marshal of the (Wolves|Sun|Order)/g, 'Seneschal of the $1').replace(/Spear-Marshal/g, 'Spear-Lord')
      .replace(/(Lord |Grand |Field |High )?Marshal\b/g, 'General').replace(/High General/g, 'General').replace(/File-?[Ll]eader/g, 'Sergeant')
      .replace(/Squad Captain/g, 'Captain').replace(/Senior Captain/g, 'Commander');
  // before the registry is built: the seat's records and mirrors go, grades above General fall to General, the old words
  // of the people's styles are the five ranks'. Returns [[realm, the man who sat]] for P.seatMarshals.
  P.migrateMarshal = function () {
    const S = A.S, st = S.posts, pend = [];
    if (!S || !S.realms) return pend;
    for (const rid of Object.keys(S.realms)) {
      const r = S.realms[rid]; if (!r) continue;
      const key = 'seat:' + rid + ':marshal';
      let m = r.council && r.council.marshal;
      if (st && st.h && st.h[key]) { if (!m && st.h[key].p) m = st.h[key].p; delete st.h[key]; }
      if (r.council && 'marshal' in r.council) delete r.council.marshal;
      if (m) pend.push([rid, m]);
    }
    if (st && st.h) for (const key of Object.keys(st.h)) if (isOldMarshal(key)) delete st.h[key];
    for (const id in S.people) {
      const p = S.people[id]; if (!p) continue;
      if (p.milRank > 7) p.milRank = 7;
      if (p.occ) p.occ = P.oldWords(p.occ);
      if (p.title) p.title = P.oldWords(p.title);
    }
    const pc = S.people[S.pc];
    if (pc && pc.mil) { if (pc.mil.rank > 7) pc.mil.rank = 7; delete pc.mil.preMarshal; }
    if (pc && pc.veteran && pc.veteran.rank > 7) pc.veteran.rank = 7;
    if (pc && pc.office === 'marshal') pc.office = null;
    // the advisors' ring (9999) and the polity's council tasks (9996) named the seat
    if (pc && pc.adv && Array.isArray(pc.adv.ring)) for (const x of pc.adv.ring) if (x && x.role === 'marshal') x.role = 'general';
    for (const rid of Object.keys(S.realms)) { const t = S.realms[rid] && S.realms[rid].pol && S.realms[rid].pol.task; if (t && t.marshal) { if (!t.general) t.general = t.marshal; delete t.marshal; } }
    for (const a of S.armies || []) if (a && a.sub) a.sub = null;
    if (S.ach && S.ach.marshal != null) { if (S.ach.senior_general == null) S.ach.senior_general = S.ach.marshal; delete S.ach.marshal; }
    return pend;
  };
  // after the registry is built: each man who sat becomes his realm's senior General (the General of the first host).
  // The record says the seat was laid down, and nobody is aggrieved by it; the General who led that host takes the
  // army the new one leaves, or waits for a command; an army left without its general gets one from the crown.
  P.seatMarshals = function (pend) {
    let n = 0;
    for (const [rid, m] of pend || []) {
      const r = A.S.realms[rid], p = A.P(m), d = r && fixFirstHost(r);
      if (!d || !live(p) || p.ruler || p.realm !== rid) continue;
      const key = P.divKey(d.id);
      if (P.holder(key) === p.id) continue;
      const res = P.appoint(key, p.id, { why: 'seat laid down', by: r.ruler, force: true, noGrudge: true });
      if (!res.ok) continue;
      n++;
      p.milRank = Math.max(p.milRank || 0, 6);
      // an army he leaves gets its general at the month's pass (P.fillGenerals): a load draws nothing from the stream
      if (isPC(p.id) && p.mil) {
        p.mil.div = d.id;
        if (d.army) p.mil.army = d.army; else p.mil.army = null;
        if (A.log) A.log(`The crown lays down the old seat above its Generals. You are a General, and as General of the crown's first host, the ${String(d.name).replace(/^the /i, '')}, you speak for the army at council.`, 'war');
      }
    }
    mirrorSenior();
    const pc = A.pc();
    if (pc && pc.alive) { const s = P.isSeniorGeneral(pc.id); if (s) { pc.office = 'general'; if (pc.officeSince == null) pc.officeSince = A.S.year; } }
    return n;
  };

  // the coherency net (src/core/08-coherency-checks): the registry's own rules
  if (A.COHERENCY && A.COHERENCY.add) A.COHERENCY.add('one holder per post', () => P.audit(), { owner: 'src/nobility/999990-posts' });
})();
