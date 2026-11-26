// W1-3 "commands and the summons" (docs/design/war.md §9, D-064 points 2, 4, 5 and 6, D-066, D-069; D-081):
// whose men they are.
//
// Every armed man of a realm is in exactly one command, and a command has one owner. The crown's command (the king's:
// royal knights, the crown's regiments, crown lands, the elite orders, hired men) is led by Generals he commissions. A
// tenant-in-chief (a duke; a marquis or count with no duke over him) has his own command: his first host is led by him by
// right, else by a General he names, and its officers are his own men (A.oobLeader's seeds, sworn to him: no person is
// made for them). GD.NOBLE_RUNGS' numbers stand as each house's full strength.
//
// Commands are a reading, not a store: the crown's, plus one for each living tenant-in-chief of the realm, worked out
// from A.S.houses (cached per realm by a Map, rebuilt when the houses change). The one thing written is which command a
// division of the war map is in: d.own = the house's id, absent for the crown. So an old save maps every army into the
// crown's command by default, and the first time a realm is read its standing hosts are dealt out (A.CMD.deal: the
// crown keeps its first host, the orders and its share; each great house takes hosts by its full strength, largest
// remainder first, the order fixed by ids). A host whose house is gone or has left the realm returns to the crown.
// A contingent (a command's hosts in one war) is kept whole: one army, never broken up.
//
// Pure readings here; the decisions (the summons, the king's command, the sentence, the seasons) are b-summons.core.js.
(function () {
  const CM = A.CMD = A.CMD || {};
  CM.T = Object.assign({
    crownShare: 0.5,    // of the hosts a realm stands (after its first host and orders), the crown's own regiments keep this share
    tics: ['N01', 'N02', 'N03'],   // duke, marquis, count: a tenant-in-chief when no duke stands over him
  }, CM.T || {});
  const live = p => !!(p && p.alive);
  const rungIdx = code => { const R = GD.NOBLE_RUNGS || []; for (let i = 0; i < R.length; i++) if (R[i].code === code) return i; return -1; };
  CM.rungIdx = rungIdx;
  // a house's full strength at full call (GD.NOBLE_RUNGS' numbers, D-064 point 4)
  CM.full = h => { const i = h ? rungIdx(h.rung) : -1; return i >= 0 ? (GD.NOBLE_RUNGS[i].men || 0) : 0; };
  CM.rungTitle = h => { const i = h ? rungIdx(h.rung) : -1; return i >= 0 ? GD.NOBLE_RUNGS[i].title : 'Lord'; };

  // ---------------------------------------------------------------- who holds of the crown
  // a tenant-in-chief: a great house of the realm, living, a duke, or a marquis or count with no duke over him
  CM.isTic = function (h, rid) {
    if (!h || h.extinct || h.kind === 'royal' || !CM.T.tics.includes(h.rung)) return false;
    if (rid && h.realm !== rid) return false;
    if (h.rung === 'N01') return true;
    const lg = h.liege && A.S.houses ? A.S.houses[h.liege] : null;
    return !(lg && !lg.extinct && lg.rung === 'N01' && lg.realm === h.realm);
  };
  // the tenants-in-chief of each realm, by a Map (rebuilt when the houses change: their count, a death, a new rung)
  let IX = null;
  const houseKey = () => { const S = A.S; return S ? Object.keys(S.houses || {}).length + ':' + S.year : ''; };
  CM.index = function () {
    const S = A.S;
    if (!S || !S.houses) return new Map();
    const key = houseKey();
    if (IX && IX.key === key && IX.S === S) return IX.m;
    const m = new Map();
    for (const id of Object.keys(S.houses)) {
      const h = S.houses[id];
      if (!CM.isTic(h)) continue;
      if (!m.has(h.realm)) m.set(h.realm, []);
      m.get(h.realm).push(id);
    }
    for (const L of m.values()) L.sort((a, b) => CM.full(S.houses[b]) - CM.full(S.houses[a]) || (a < b ? -1 : 1));
    IX = { key, S, m };
    return m;
  };
  CM.dirty = () => { IX = null; };
  CM.tics = rid => (CM.index().get(rid) || []).map(id => A.S.houses[id]).filter(h => CM.isTic(h, rid));

  // ---------------------------------------------------------------- commands
  CM.crownId = rid => 'crown:' + rid;
  CM.houseCmd = hid => 'house:' + hid;
  // { id, k: 'crown'|'house', r, h, owner (pid or null), name }
  CM.crown = function (rid) {
    const r = A.realm(rid);
    return { id: CM.crownId(rid), k: 'crown', r: rid, h: null, owner: r && r.ruler != null ? r.ruler : null, name: `the crown of ${r ? A.realmShort(rid) : rid}` };
  };
  CM.house = function (h) {
    if (!h) return null;
    const hp = h.headPid != null ? A.P(h.headPid) : null;
    return { id: CM.houseCmd(h.id), k: 'house', r: h.realm, h: h.id, owner: live(hp) ? hp.id : null, name: h.name || h.id };
  };
  CM.of = function (rid) { return [CM.crown(rid)].concat(CM.tics(rid).map(CM.house)); };
  CM.get = function (id) {
    if (!id) return null;
    if (id.startsWith('crown:')) return CM.crown(id.slice(6));
    if (id.startsWith('house:')) { const h = A.S.houses[id.slice(6)]; return h && CM.isTic(h) ? CM.house(h) : null; }
    return null;
  };
  // the command a division is in: its house's, while that house holds of the crown in the division's realm; else the crown's
  CM.divCmd = function (d) {
    if (!d) return null;
    const h = d.own ? A.S.houses[d.own] : null;
    return h && CM.isTic(h, d.r) ? CM.houseCmd(h.id) : CM.crownId(d.r);
  };
  CM.houseOf = d => { const h = d && d.own ? A.S.houses[d.own] : null; return h && CM.isTic(h, d.r) ? h : null; };
  // the hosts of a command (its divisions on the war map)
  CM.divs = function (c) {
    const r = c && A.realm(c.r);
    if (!r || !r.forces || !Array.isArray(r.forces.divs)) return [];
    return r.forces.divs.filter(d => d && CM.divCmd(d) === c.id);
  };
  CM.men = c => CM.divs(c).reduce((a, d) => a + (d.men || 0), 0);

  // the command's General: the owner by right (an adult who holds no field post or seat elsewhere, and is not the player,
  // whose own hosts take his orders through the summons), else a General he names (a seed name, sworn to him)
  CM.general = function (c) {
    if (!c) return null;
    if (c.k === 'crown') {
      const r = A.realm(c.r), fh = r && A.POSTS && A.POSTS.firstHost ? A.POSTS.firstHost(r) : null, g = fh && fh.cmd ? A.P(fh.cmd) : null;
      return live(g) ? { pid: g.id, name: A.fullName(g, false), by: 'senior' } : null;
    }
    const p = c.owner != null ? A.P(c.owner) : null;
    const busy = p && A.POSTS ? A.POSTS.held(p.id).some(k => /^(army|div|order|seat|bn|coy):/.test(k)) : false;
    if (live(p) && p.id !== A.S.pc && A.isAdult(p) && !busy && A.age(p) < 66) return { pid: p.id, name: A.fullName(p, false), by: 'right' };
    const s = A.oobLeader ? A.oobLeader(c.r, 'C:' + c.h, 6) : { name: 'a General he names' };
    return { pid: null, name: s.name, by: 'named' };
  };
  // the host a lord leads by right: his command's first (oldest) host
  CM.firstOf = function (c) {
    const ds = CM.divs(c).filter(d => A.HOSTS && A.HOSTS.isHost(d) && !d.elite);
    return ds.length ? ds.reduce((a, d) => ((d.born || 0) < (a.born || 0) || ((d.born || 0) === (a.born || 0) && d.id < a.id) ? d : a)) : null;
  };

  // ---------------------------------------------------------------- dealing the hosts (old saves; a new world)
  const hashId = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  CM.hashId = hashId;
  // the crown keeps its first host, its orders and its share; each tenant-in-chief takes hosts by his full strength
  // (largest remainder first). No dice: the order is fixed by the ids. Written once a realm (r.cmdDeal).
  CM.deal = function (rid, force) {
    const r = A.realm(rid);
    if (!r || r.alive === false || !r.forces || !Array.isArray(r.forces.divs)) return 0;
    if (r.cmdDeal && !force) return 0;
    r.cmdDeal = A.S.year;
    const tics = CM.tics(rid);
    if (!tics.length) return 0;
    const first = A.POSTS && A.POSTS.firstHost ? A.POSTS.firstHost(r) : null;
    const pool = r.forces.divs.filter(d => d && !d.elite && d !== first && !(d.own && CM.isTic(A.S.houses[d.own], rid)))
      .sort((a, b) => hashId(a.id) - hashId(b.id) || (a.id < b.id ? -1 : 1));
    const already = r.forces.divs.filter(d => d && d.own && CM.isTic(A.S.houses[d.own], rid)).length;
    const total = pool.length + already, give = Math.floor(total * (1 - CM.T.crownShare)) - already;
    if (give <= 0) return 0;
    const sum = tics.reduce((a, h) => a + CM.full(h), 0) || 1;
    const quota = tics.map(h => ({ h, q: (give * CM.full(h)) / sum, n: 0 }));
    for (const x of quota) x.n = Math.floor(x.q);
    let left = give - quota.reduce((a, x) => a + x.n, 0);
    quota.slice().sort((a, b) => (b.q - b.n) - (a.q - a.n) || (a.h.id < b.h.id ? -1 : 1)).forEach(x => { if (left > 0) { x.n++; left--; } });
    let i = 0;
    for (const x of quota) for (let k = 0; k < x.n && i < pool.length; k++) pool[i++].own = x.h.id;
    return i;
  };
  // a host whose house no longer holds of the crown in its realm returns to the crown (written; the reading already says so)
  CM.tidy = function () {
    const S = A.S;
    for (const id of Object.keys(S.realms || {})) {
      const r = S.realms[id];
      if (!r || r.alive === false || !r.forces || !Array.isArray(r.forces.divs)) continue;
      if (!r.cmdDeal) CM.deal(id);
      for (const d of r.forces.divs) if (d && d.own && !CM.isTic(S.houses[d.own], d.r)) delete d.own;
    }
  };

  // ---------------------------------------------------------------- an army's command (the king's three ways)
  // a.cmdBy: 'king' (in person, a.king), 'commission' (a.gen, by his written word for this war), 'council' (nobody named)
  CM.armyBy = function (a) {
    if (!a) return null;
    const r = A.realm(a.realm), hosts = A.HOSTS ? A.HOSTS.armyHosts(a).length : 0;
    if (a.cmdBy === 'king' && r && a.king != null && r.ruler === a.king && live(A.P(a.king))) return 'king';
    if (a.cmdBy === 'council' && hosts >= 2) return 'council';
    return a.gen && live(A.P(a.gen)) ? (hosts >= 2 ? 'commission' : 'general') : hosts >= 2 ? 'council' : 'none';
  };
  // who decides the army's moves (its temper is his): the king in person, else the General; a council has no one temper
  CM.leaderOf = function (a) {
    const by = CM.armyBy(a);
    return by === 'king' ? A.P(a.king) : by === 'council' ? null : a && a.gen ? A.P(a.gen) : null;
  };
  // a council of war takes a day longer to agree a joint order (war.md §9.1): the army thinks one tick later
  CM.slow = a => (CM.armyBy(a) === 'council' ? 1 : 0);

  // ---------------------------------------------------------------- the war's kind (one record for every kind of fighting)
  // w.kind: realm, private, border, rebellion or civil (D-064 point 6). Written at a war's start; an old war is read.
  CM.kindOf = function (w) {
    if (!w) return null;
    if (w.kind) return w.kind;
    const reb = (w.att || []).concat(w.def || []).some(id => { const r = A.realm(id); return r && r.isRebel; });
    return reb ? 'rebellion' : w.cb === 'throne' ? 'civil' : 'realm';
  };
  // the four disputes (war.md §9.4): what is built and the hook the rest stand on (W1-6 builds their ladders)
  CM.DISPUTES = {
    summons: { built: true, words: 'a refused summons', hook: 'A.CMD.sentence: the crown\'s ladder (accept, fine, hostages, strip, forsworn, attaint) and the lord\'s (submit, sulk, league)' },
    army: { built: false, words: 'a quarrel inside the army', hook: 'a General passed over and a great lord under a General of lesser birth are grievances on the house (A.CMD.griefs, t: passed)' },
    border: { built: false, words: 'a border lord\'s own war', hook: 'A.CMD.march(h); a march lord fights for his border unsummoned (A.CMD.borderMonth); w.kind border' },
    private: { built: false, words: 'a private war', hook: 'w.kind private; the grievances on each house (A.CMD.griefs)' },
  };

  // ---------------------------------------------------------------- a march lord
  // his seat borders a foreign crown's land
  // the seat's province: h.seatId is the map's place id (prov.pid), looked up through a Map kept with the province list
  let PX = null;
  CM.seatProv = function (h) {
    if (!h || h.seatId == null || !A.S || !A.S.prov) return null;
    if (!PX || PX.list !== A.S.prov || PX.len !== A.S.prov.length) { PX = { list: A.S.prov, len: A.S.prov.length, m: new Map() }; for (const p of A.S.prov) if (p && p.pid != null) PX.m.set(p.pid, p.id); }
    const i = PX.m.get(h.seatId);
    return i != null ? A.S.prov[i] : null;
  };
  CM.near = function (h) {
    const P = CM.seatProv(h);
    if (!P) return [];
    const out = new Set();
    for (const j of [P.id].concat(P.adj || [])) { const q = A.S.prov[j]; if (q) { const o = A.ctrl ? A.ctrl(q) : q.owner; if (o && o !== h.realm && A.realm(o)) out.add(o); } }
    return [...out];
  };
  CM.march = h => CM.near(h).length > 0;

  // ---------------------------------------------------------------- grievances on a house (bounded; W1-6 reads them)
  // h.cmGr: [[year, kind, label]] at most four: a refusal punished, a General passed over, a duke under a man of no birth
  CM.grieve = function (h, t, label) {
    if (!h) return;
    const L = h.cmGr = Array.isArray(h.cmGr) ? h.cmGr : [];
    L.push([A.S.year, t, String(label || '').replace(/[<>"]/g, '').slice(0, 120)]);
    if (L.length > 4) L.splice(0, L.length - 4);
  };
  CM.griefs = h => (h && Array.isArray(h.cmGr) ? h.cmGr : []);
  // the crown's record of a house's refusals (years), at most four
  CM.refusals = (h, years) => (h && Array.isArray(h.cmRef) ? h.cmRef.filter(y => A.S.year - y <= (years || 12)).length : 0);

  // ---------------------------------------------------------------- the audit (tests, coherency)
  // every armed man in exactly one command, each command with one owner, no person General of two commands
  CM.audit = function () {
    const out = [], gens = new Map();
    for (const id of Object.keys(A.S.realms || {})) {
      const r = A.S.realms[id];
      if (!r || r.alive === false || !r.forces || !Array.isArray(r.forces.divs)) continue;
      const cmds = CM.of(id), ids = new Set(cmds.map(c => c.id));
      for (const d of r.forces.divs) { if (!d) continue; const c = CM.divCmd(d); if (!ids.has(c)) out.push(`${d.id}: in ${c}, not a command of ${id}`); }
      for (const c of cmds) {
        if (c.k === 'house' && c.owner != null) { const o = A.P(c.owner); if (!live(o)) out.push(`${c.id}: a dead owner`); }
        const g = CM.general(c);
        if (g && g.pid != null && c.k === 'house') { if (gens.has(g.pid)) out.push(`${g.pid} is General of ${gens.get(g.pid)} and ${c.id}`); gens.set(g.pid, c.id); }
      }
    }
    // a house's contingent in one war is in one army
    // (D-194: a division in a fight is left where it is until the fight ends, as CM.keepWhole leaves it)
    const busy = d => !!(A.S.fights && ((d.atk != null && A.S.fights[d.atk]) || A.S.fights[d.loc]));
    for (const a of A.S.armies || []) for (const did of a.divs || []) {
      const d = A.divById(did); if (!d || !d.own || busy(d)) continue;
      const h = CM.houseOf(d); if (!h) continue;
      const other = (A.S.armies || []).find(b => b !== a && b.realm === a.realm && b.divs.some(x => { const e = A.divById(x); return e && e.own === h.id && !busy(e); }));
      if (other && a.id < other.id && a.divs.length < 24 && other.divs.length < 24) out.push(`${h.id}'s contingent split between ${a.id} and ${other.id}`);
    }
    return out;
  };

  A.on && A.on('worldInit', function () { try { CM.dirty(); for (const id of Object.keys(A.S.realms || {})) CM.deal(id); } catch (e) { console.error('[commands] deal', e); } });
})();
