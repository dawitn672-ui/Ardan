// Bonds, part 3 of 3: long memories across generations (Road to Ten, Diplomacy 6), for families and for realms.
//
// Families. A bond's memory no longer dies with the people in it:
//   - kill someone (a duel to the death, the release's murder, a scheme's poison, a hanging you chose) and their parents,
//     children, spouse and siblings remember it: an enemy's bond at -45 or worse, with a line that fades over 60 years;
//   - when someone you share strong memories with dies, their children and spouse take up the two strongest lines at
//     half weight ("She knows what you did for her father, Odo, in 1112: you lent him 40 suns");
//   - when you play on as your heir, the people who loved or hated you take it out on your child, at 60% ("She has not
//     forgotten 1112, when Aldo, your father, insulted her"). The family's papers (secrets found) pass down too.
// Realms. Realms already keep 26 kinds of memory with half-lives of 3 to 30 years (A.DMEM). Some wrongs and debts are
// longer than that. A realm keeps a feud ledger, r.feud[otherRealm] = [{k, w, y, place, by, heirs}], for:
//   - taking its capital (-35, half-life 80 years), holding its capital in a war (-22, 60), taking a province that held a
//     tenth of its people (-15, 60), leaving it to its enemies or breaking faith (-14, 50), and standing by it in a war
//     it was losing (+16, 50);
//   - land taken back halves what is owed for it; a war won against the realm that wronged you halves the rest;
//   - the ledger belongs to the realm, so it outlives the ruler who suffered it: each successor is written into it
//     ("in the reign of Queen Brynja; carried by King Olaf since 1121").
// The AI reads it: A.memSum (so A.relBetween, and every decision built on it: the war bar and odds in A.aiWarCheck,
// A.interest for alliances, offers and calls to arms), a vengeance factor on the war odds against the realm a ruler
// holds a grudge against (patch BONDS-FEUD-WAR), the reasons on offers (A.interestParts), the opinion tooltip
// (A.opinionParts) and the AI's war log (A.aiWhyWar, from 20-ai-personality). The Realm tab shows the ledger with its
// origins. State: r.feud and optional fields only.
(function () {
  const BD = A.BONDS, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), cap = BD.cap, low = BD.low;
  const FAM = BD.FAM = { KILL: -45, KILL_HALF: 60, CARRY: 0.5, HEIR: 0.6, STRONG: 15 };

  // ---------------------------------------------------------------- families: the kin of the dead

  // what p was to k: "father", "daughter", "wife", "brother"
  FAM.roleOf = function (p, k) {
    const F = p.sex === 'F';
    if ((k.parents || []).includes(p.id)) return F ? 'mother' : 'father';
    if ((p.parents || []).includes(k.id)) return F ? 'daughter' : 'son';
    if (p.spouse === k.id || k.spouse === p.id || (k.rel && k.rel[p.id] && k.rel[p.id].type === 'spouse')) return F ? 'wife' : 'husband';
    if (k.rel && k.rel[p.id] && k.rel[p.id].type === 'sibling') return F ? 'sister' : 'brother';
    return null;
  };
  FAM.kinOf = function (p) {
    const ids = new Set([].concat(p.children || [], p.parents || [], p.spouse ? [p.spouse] : []));
    for (const id of Object.keys(p.rel || {})) if (['sibling', 'spouse', 'child', 'mother', 'father'].includes(p.rel[id].type)) ids.add(id);
    return [...ids].map(A.P).filter(k => k && k.alive && k.id !== p.id && A.age(k) >= 8 && FAM.roleOf(p, k));
  };
  const known = (pc, k) => { if (!pc.rel[k.id]) A.link(pc, k, 'acquaint', 0, 'acquaint'); return pc.rel[k.id]; };
  // the kin of someone you killed
  FAM.killed = function (pc, p, how) {
    const out = [];
    for (const k of FAM.kinOf(p).filter(k => k.id !== pc.id && !(pc.parents || []).includes(k.id) && !(pc.children || []).includes(k.id)).slice(0, 5)) {
      const role = FAM.roleOf(p, k);
      const r = known(pc, k);
      if (!A.FAMILY_RELS.includes(r.type)) { r.type = 'enemy'; if (k.rel[pc.id]) k.rel[pc.id].type = 'enemy'; }
      if (k.rel[pc.id]) k.rel[pc.id].op = Math.min(k.rel[pc.id].op || 0, FAM.KILL);
      r.op = Math.min(r.op || 0, -10);
      const deed = `you killed ${A.his(k)} ${role}, ${p.given}`;
      BD.add(pc, k, cap(deed), { v: FAM.KILL, h: FAM.KILL_HALF, k: 'kin:' + p.id, s: 'kin', d: deed });
      out.push(k);
    }
    return out;
  };
  // the dead leave their strongest memories of you to their children and spouse
  FAM.carry = function (pc, p) {
    const r = pc.rel && pc.rel[p.id];
    if (!r || Math.abs(BD.memOfRel(r)) < FAM.STRONG) return [];
    const lines = (r.hist || []).filter(e => e && typeof e.w === 'number' && Math.abs(e.w) >= 8 && !e.of).sort((a, b) => Math.abs(b.w) - Math.abs(a.w)).slice(0, 2);
    if (!lines.length) return [];
    const out = [];
    const heirs = FAM.kinOf(p).filter(k => k.id !== pc.id && ((p.children || []).includes(k.id) || FAM.roleOf(p, k) === (k.sex === 'F' ? 'husband' : 'wife') || FAM.roleOf(p, k) === 'husband' || FAM.roleOf(p, k) === 'wife'));
    for (const k of heirs.slice(0, 3)) {
      if ((pc.children || []).includes(k.id) || (pc.parents || []).includes(k.id) || k.id === pc.spouse) continue;
      known(pc, k);
      const role = FAM.roleOf(p, k);
      for (const e of lines) {
        const src = BD.deedLine(e);
        BD.add(pc, k, `${cap(A.his(k))} ${role} ${p.given}: ${src}`, { y: e.y, v: Math.round(e.w * FAM.CARRY), h: Math.max(e.h || 6, 20), k: 'inh:' + p.id + ':' + e.y, s: 'inh', of: `${role}, ${p.given},`, src });
      }
      out.push(k);
    }
    return out;
  };
  // visit: you look in on the family of the dead person ctx.pid; they remember that you came
  BD.FX.visit = function (pc, v, ctx) {
    const p = A.P(ctx.pid); if (!p) return '';
    const kin = FAM.kinOf(p).filter(k => k.id !== pc.id).slice(0, 3);
    for (const k of kin) {
      known(pc, k);
      if (k.rel[pc.id]) k.rel[pc.id].op = clamp((k.rel[pc.id].op || 0) + 6, -100, 100);
      const d = `you came to the door after ${p.given} died`;
      BD.add(pc, k, cap(d), { v: 8, h: 8, k: 'visit:' + p.id, s: 'you', d });
    }
    return kin.length ? `(${kin.map(k => k.given).join(', ')} will remember that you came)` : '(there is nobody left at the house)';
  };
  BD.killHooks = BD.killHooks || [];
  const kill = A.kill;
  A.kill = function (p, cause) {
    const was = !!(p && p.alive), pc = A.pc();
    const res = kill.apply(this, arguments);
    try {
      if (was && p && !p.alive && pc && pc.alive && p.id !== pc.id && pc.rel) {
        const b = BD.blameCtx;
        if (b && b.pid === String(p.id)) {
          FAM.killed(pc, p, b.how);
          for (const f of BD.killHooks) f(pc, p, b.how);
          if (b.how === 'duel' && p.ruler && pc.realm && p.ruler !== pc.realm) FE.add(p.ruler, pc.realm, 'crown', { name: p.given, title: (A.realm(p.ruler) || {}).title });
        } else FAM.carry(pc, p);
      }
    } catch (e) { console.error('bonds kill', e); }
    return res;
  };
  // playing on as your heir: what people felt for you, they now feel (in part) for your child
  const swapYou = (s, name, role) => String(s).replace(/^you\b/i, `${name}, your ${role},`).replace(/\byour\b/g, `${name}'s`).replace(/\byou\b/g, name);
  FAM.inherit = function (old, heir) {
    if (!old || !heir || !old.rel) return 0;
    const role = FAM.roleOf(old, heir) || (old.sex === 'F' ? 'mother' : 'father');
    let n = 0;
    for (const id of Object.keys(old.rel)) {
      const t = A.P(id), r = old.rel[id];
      if (!t || !t.alive || t.id === heir.id || A.FAMILY_RELS.includes(r.type) || (heir.parents || []).includes(t.id) || (heir.children || []).includes(t.id)) continue;
      if (Math.abs(BD.memOfRel(r)) < FAM.STRONG) continue;
      const lines = (r.hist || []).filter(e => e && typeof e.w === 'number' && Math.abs(e.w) >= 8).sort((a, b) => Math.abs(b.w) - Math.abs(a.w)).slice(0, 2);
      if (!lines.length) continue;
      if (!heir.rel[t.id]) A.link(heir, t, Math.sign(BD.memOfRel(r)) < 0 && Math.abs(BD.memOfRel(r)) >= 30 ? 'rival' : 'acquaint', 0, Math.sign(BD.memOfRel(r)) < 0 && Math.abs(BD.memOfRel(r)) >= 30 ? 'rival' : 'acquaint');
      for (const e of lines) {
        const d = e.of ? `${old.given}, your ${role}, ${e.w > 0 ? 'stood by' : 'wronged'} ${A.his(t)} ${e.of.replace(/,$/, '')}` : swapYou(BD.deedLine(e), old.given, role);
        BD.add(heir, t, `${cap(role === 'mother' ? 'Your mother' : role === 'father' ? 'Your father' : 'Your ' + role)} ${old.given}: ${BD.deedLine(e)}`, { y: e.y, v: Math.round(e.w * FAM.HEIR), h: Math.max(e.h || 6, 20), k: 'heir:' + old.id + ':' + e.y, s: 'heir', d });
      }
      n++;
    }
    // the family's papers: what your parent found out about people, you can still use
    const os = old.bonds, hs = BD.state(heir);
    if (os && os.sec) for (const pid of Object.keys(os.sec)) { const s = os.sec[pid]; if (s && !s.out && !hs.sec[pid]) hs.sec[pid] = Object.assign({}, s, { how: 'papers', used: null }); }
    // and what people know of your parent is a shame on the house
    if (os && Array.isArray(os.mine)) for (const s of os.mine) if (!s.out && s.know && s.know.length) BD.SEC && BD.SEC.addMine(heir, 'deed', `Your ${role}'s secret: ${s.t}`, s.know, 'shunned');
    return n;
  };
  if (typeof A.continueAs === 'function') {
    const ca = A.continueAs;
    A.continueAs = function (pid) {
      const old = A.pc();
      const ok = ca.apply(this, arguments);
      try { if (ok && old && A.pc() && A.pc().id !== old.id) FAM.inherit(old, A.pc()); } catch (e) { console.error('bonds heir', e); }
      return ok;
    };
  }

  // ---------------------------------------------------------------- realms: the feud ledger

  const FE = BD.FEUD = {
    K: {
      capital: { l: 'Took our capital, {place}', v: -35, h: 80 },
      sack: { l: 'Held our capital, {place}, in war', v: -22, h: 60 },
      heart: { l: 'Took {place} from us', v: -15, h: 60 },
      betray: { l: 'Left us to our enemies', v: -14, h: 50 },
      aid: { l: 'Stood by us against {foe}', v: 16, h: 50 },
      crown: { l: 'Killed our {title}, {name}', v: -30, h: 80 },
    },
    CAP: 45,          // the most a feud ledger adds to or takes from a relation
    ON: true,         // the AI reads it (tests switch it off to compare)
    HEART: 0.1,       // a province holding this share of a realm's people is its heartland
    stats: { formed: 0, inherited: 0, wars: 0, grudgeWars: 0, carriedWars: 0, debtPairsAtWar: 0 },
  };
  FE.list = (a, b) => { const r = A.realm(a); return r && r.feud && Array.isArray(r.feud[b]) ? r.feud[b] : []; };
  FE.sum = (a, b) => { const L = FE.list(a, b); if (!L.length) return 0; let s = 0; for (const e of L) s += e.w || 0; return clamp(s, -FE.CAP, FE.CAP); };
  FE.label = e => { const K = FE.K[e.k] || { l: e.k }; return K.l.replace('{place}', e.place || 'our seat').replace('{foe}', e.foe || 'our enemies').replace('{title}', String(e.title || 'ruler').split(' / ')[0]).replace('{name}', e.name || ''); };
  // "Took our capital, Grakmar, in 1108 (under Queen Brynja; carried by King Olaf since 1121)"
  FE.origin = e => {
    const heirs = (e.heirs || []).filter(h => h && h.n);
    return `${FE.label(e)}, in ${e.y}${e.by ? ` (under ${e.by}${heirs.length ? `; carried by ${heirs.slice(-2).map(h => `${h.n} since ${h.y}`).join(', ')}` : ''})` : ''}`;
  };
  FE.add = function (holder, target, k, info) {
    info = info || {};
    const ra = A.realm(holder), rb = A.realm(target), K = FE.K[k];
    if (!ra || !rb || !K || holder === target || ra.isRebel || rb.isRebel || !ra.alive || !rb.alive) return null;
    ra.feud = ra.feud && typeof ra.feud === 'object' ? ra.feud : {};
    const L = ra.feud[target] = Array.isArray(ra.feud[target]) ? ra.feud[target] : [];
    const place = info.place ? BD.clean(info.place) : '';
    const ex = L.find(e => e.k === k && (e.place || '') === place && A.S.year - e.y <= 10);
    if (ex) { ex.w = Math.sign(K.v) * Math.max(Math.abs(ex.w || 0), Math.abs(K.v)); return ex; }
    const ru = ra.ruler != null ? A.P(ra.ruler) : null;
    const e = { k, v: K.v, w: K.v, y: A.S.year, h: K.h, place, by: ru && A.rulerStyle ? BD.clean(A.rulerStyle(ru, ra) + ' ' + (ru.given || '')) : '', byId: ru ? ru.id : null, heirs: [] };
    if (info.foe) e.foe = BD.clean(info.foe);
    if (info.name) e.name = BD.clean(info.name);
    if (info.title) e.title = BD.clean(info.title);
    L.push(e);
    if (L.length > 6) { L.sort((x, y) => Math.abs(y.w) - Math.abs(x.w)); L.length = 6; }
    FE.stats.formed++;
    return e;
  };
  // what the AI reads: memories that last generations are part of how a realm regards another
  const memSum = A.memSum;
  A.memSum = function (a, b) {
    const m = memSum.apply(this, arguments);
    if (!FE.ON) return m;
    const r = A.realm(a);
    return r && r.feud && r.feud[b] ? m + FE.sum(a, b) : m;
  };
  // vengeance in the war odds: a ruler with a grudge picks that neighbour; a debt stays the hand (patch BONDS-FEUD-WAR)
  A.feudWarMul = function (a, b) {
    if (!FE.ON) return 1;
    const G = FE.sum(a, b);
    if (G <= -5) { const wr = A.rulerPersona ? Math.max(0, A.rulerPersona(a).wrath || 0) : 0; return 1 + 0.6 * Math.min(1, -G / 35) * (1 + 0.5 * wr); }
    if (G >= 5) return Math.max(0.4, 1 - G / 40);
    return 1;
  };
  FE.top = (a, b, sign) => FE.list(a, b).filter(e => Math.abs(e.w) >= 2 && (!sign || Math.sign(e.w) === sign)).sort((x, y) => Math.abs(y.w) - Math.abs(x.w))[0] || null;
  // vengeance clouds judgement: inside A.aiWarCheck, a ruler weighing war on a realm it holds a grudge against wants
  // less of an edge in strength first (20-ai-personality's A.aiNerve, .7 for a steady ruler, falls by up to .25). The
  // target is noted when A.aiWarCheck asks for its war preview; nothing is drawn or stored.
  if (typeof A.aiWarCheck === 'function' && typeof A.warPreview === 'function') {
    const wc = A.aiWarCheck, wp = A.warPreview;
    A.aiWarCheck = function () { FE._in = true; try { return wc.apply(this, arguments); } finally { FE._in = false; FE._tgt = null; } };
    A.warPreview = function (a, b) { if (FE._in) FE._tgt = [a, b]; return wp.apply(this, arguments); };
    if (typeof A.aiNerve === 'function') {
      const nv = A.aiNerve;
      A.feudNerve = (a, b) => { if (!FE.ON) return 0; const G = FE.sum(a, b); return G <= -5 ? 0.25 * Math.min(1, -G / 35) : 0; };
      A.aiNerve = function (rid) { const v = nv.apply(this, arguments), t = FE._tgt; return t && t[0] === rid ? v - A.feudNerve(rid, t[1]) : v; };
    }
  }

  // the events that write the ledger
  A.on('provTransfer', (prov, from, to) => {
    try {
      const rf = A.realm(from), rt = A.realm(to);
      if (!rf || !rt || from === to) return;
      // land taken back: what was owed for it shrinks
      for (const e of FE.list(to, from)) if ((e.k === 'capital' || e.k === 'heart' || e.k === 'sack') && e.place === prov.name && !e.back) { e.w = Math.round(e.w * 0.4); e.back = A.S.year; }
      if (rf.capitalProv === prov.id) FE.add(from, to, 'capital', { place: prov.name });
      else if ((prov.pop || 0) >= FE.HEART * Math.max(1, rf.provPop || rf.pop || 1)) FE.add(from, to, 'heart', { place: prov.name });
    } catch (e) { console.error('feud transfer', e); }
  });
  // abandoned in a war, betrayed by an ally, or saved by one: the release's memories, with a long tail
  const remember = A.remember;
  A.remember = function (a, b, k, v) {
    const res = remember.apply(this, arguments);
    try {
      if (k === 'abandoned' || k === 'betrayal') FE.add(a, b, 'betray');
      else if (k === 'saved') { const w = (A.atWar(a) || []).find(x => (x.att.includes(a) && x.att.includes(b)) || (x.def.includes(a) && x.def.includes(b))); const foe = w ? (w.att.includes(a) ? w.leadD : w.leadA) : null; FE.add(a, b, 'aid', { foe: foe ? A.realmShort(foe) : '' }); }
    } catch (e) { console.error('feud memory', e); }
    return res;
  };
  // a capital held by an enemy army (a monthly look; the ledger merges repeats within ten years)
  FE.month = function () {
    for (const id of Object.keys(A.S.realms || {})) {
      const r = A.S.realms[id];
      if (!r.alive || r.isRebel || r.capitalProv == null) continue;
      const P = A.prov(r.capitalProv);
      if (P && P.occ && P.occ !== id && A.realm(P.occ) && A.hostile && A.hostile(id, P.occ)) FE.add(id, P.occ, 'sack', { place: P.name });
    }
  };
  // a war won against the realm that wronged you settles half of it
  A.on('warEnd', (w, result) => {
    try {
      const win = result === 'att' ? w.leadA : result === 'def' ? w.leadD : null, lose = result === 'att' ? w.leadD : result === 'def' ? w.leadA : null;
      if (!win || !lose) return;
      for (const e of FE.list(win, lose)) if (e.w < 0 && !e.avenged) { e.w = Math.round(e.w * 0.5); e.avenged = A.S.year; }
    } catch (e) { console.error('feud war end', e); }
  });
  // a new ruler takes up the ledger
  A.on('rulerDied', (r, next) => {
    try {
      if (!r || !r.feud || !next) return;
      const n = A.rulerStyle ? BD.clean(A.rulerStyle(next, r) + ' ' + (next.given || '')) : next.given;
      for (const b of Object.keys(r.feud)) for (const e of r.feud[b] || []) {
        if (Math.abs(e.w) < 2) continue;
        e.heirs = Array.isArray(e.heirs) ? e.heirs : [];
        e.heirs.push({ n, y: A.S.year, id: next.id });
        if (e.heirs.length > 4) e.heirs.splice(0, e.heirs.length - 4);
        FE.stats.inherited++;
      }
    } catch (e) { console.error('feud succession', e); }
  });
  // who goes to war against whom (for the bench): does the attacker hold a grudge, and did it inherit it?
  A.on('warStart', (w, opts) => {
    try {
      if (opts && opts.silent) return;
      FE.stats.wars++;
      const G = FE.sum(w.leadA, w.leadD);
      if (G <= -10) { FE.stats.grudgeWars++; const e = FE.top(w.leadA, w.leadD, -1); const ra = A.realm(w.leadA); if (e && ra && e.byId != null && e.byId !== ra.ruler) FE.stats.carriedWars++; }
      if (G >= 10) FE.stats.debtPairsAtWar++;
    } catch (e) {}
  });
  // the ledger fades slowly, and forgets realms that are gone
  FE.year = function () {
    for (const id of Object.keys(A.S.realms || {})) {
      const r = A.S.realms[id];
      if (!r.feud) continue;
      for (const b of Object.keys(r.feud)) {
        const rb = A.realm(b);
        const L = (r.feud[b] || []).filter(e => e && typeof e.w === 'number');
        for (const e of L) e.w = Math.round(e.w * Math.pow(0.5, 1 / Math.max(5, e.h || 50)) * 10) / 10;
        r.feud[b] = L.filter(e => Math.abs(e.w) >= 2);
        if (!r.feud[b].length || !rb || !rb.alive) delete r.feud[b];
      }
    }
  };
  A.on('worldYear', () => { try { FE.year(); } catch (e) { console.error('feud year', e); } });
  A.onMonth.push(pc => { try { FE.month(); } catch (e) { console.error('feud month', e); } });

  // ---------------------------------------------------------------- the reasons the AI shows

  // the opinion tooltip: each line of the ledger with its origin
  const opParts = A.opinionParts;
  A.opinionParts = function (a, b) {
    const out = opParts.apply(this, arguments);
    try { if (FE.ON) for (const e of FE.list(a, b)) if (Math.abs(e.w) >= 2) out.push([FE.origin(e), Math.round(e.w)]); } catch (e) {}
    return out;
  };
  // the reasons on an offer: the "Opinion" line includes the ledger already (through A.relBetween); show it apart
  const intParts = A.interestParts;
  A.interestParts = function (a, b) {
    const out = intParts.apply(this, arguments);
    try {
      const G = FE.ON ? FE.sum(a, b) : 0;
      if (Math.abs(G) >= 2 && out.length && /^Opinion /.test(out[0][0])) {
        const rel = A.relBetween(a, b), base = rel - G;
        out[0] = [`Opinion ${base > 0 ? '+' : ''}${Math.round(base)}`, Math.round(base * 0.6)];
        const e = FE.top(a, b);
        out.splice(1, 0, [e ? `${G < 0 ? 'An old grudge' : 'An old debt'}: ${FE.origin(e)}` : (G < 0 ? 'An old grudge' : 'An old debt'), Math.round(G * 0.6)]);
      }
    } catch (e) {}
    return out;
  };
  // the AI's war log (20-ai-personality)
  if (typeof A.aiWhyWar === 'function') {
    const why = A.aiWhyWar;
    A.aiWhyWar = function (a, b) {
      const out = why.apply(this, arguments);
      try { const m = A.feudWarMul(a, b), e = FE.top(a, b, -1); if (m > 1.01 && e) out.push([`An old grudge: ${FE.origin(e)}`, Math.log(m) + 0.3]); } catch (e) {}
      return out;
    };
  }

  // C.feud(p, 'held' | 'against' | 'owed'): the player's realm holds a grudge, is the object of one, or is owed a debt
  A.C.feud = (p, kind) => {
    const rid = p && (p.ruler || p.realm);
    if (!rid || !A.S.realms) return false;
    for (const o of Object.keys(A.S.realms)) {
      if (o === rid || !A.S.realms[o].alive) continue;
      if (kind === 'against' ? FE.sum(o, rid) <= -10 : kind === 'owed' ? FE.sum(rid, o) >= 10 : FE.sum(rid, o) <= -10) return true;
    }
    return false;
  };
  // the strongest line of a kind, for an event's setup: { other realm, entry }
  FE.pick = function (p, kind) {
    const rid = p && (p.ruler || p.realm);
    let best = null;
    for (const o of Object.keys(A.S.realms || {})) {
      if (o === rid || !A.S.realms[o].alive) continue;
      const e = kind === 'against' ? FE.top(o, rid, -1) : kind === 'owed' ? FE.top(rid, o, 1) : FE.top(rid, o, -1);
      if (e && (!best || Math.abs(e.w) > Math.abs(best.e.w))) best = { o, e };
    }
    return best;
  };
  // fx.bonds.feud: 'settle' (reparations, an apology: the grudge they hold against you shrinks), 'swear' (you take up
  // your realm's grudge: refreshed), 'forgive' (you let it go: halved), with ctx.rid the other realm and ctx.fk the line
  BD.FX.feud = function (pc, how, ctx) {
    const rid = pc.ruler || pc.realm, o = ctx.rid;
    if (!rid || !o) return '';
    const L = how === 'settle' ? FE.list(o, rid) : FE.list(rid, o);
    const e = L.find(x => x.y === +ctx.fy && x.k === ctx.fk) || L[0];
    if (!e) return '';
    if (how === 'settle') { e.w = Math.round(e.w * 0.4); e.set = A.S.year; }
    if (how === 'apology') { e.w = Math.round(e.w * 0.7); e.set = A.S.year; }
    if (how === 'remind') { e.w = Math.round(e.w * 0.7); for (const x of FE.list(rid, o)) if (x.w < 0) x.w = Math.round(x.w * 0.7); }
    if (how === 'forgive') { e.w = Math.round(e.w * 0.5); e.set = A.S.year; }
    if (how === 'swear') e.w = Math.sign(e.v || e.w) * Math.max(Math.abs(e.w), Math.abs(e.v || 0));
    return '';
  };

  // ---------------------------------------------------------------- the Realm tab: long memories (pure)

  FE.card = function (pc) {
    const rid = pc && (pc.ruler || pc.realm), r = A.realm(rid);
    if (!r) return '';
    const held = [], against = [];
    for (const o of Object.keys(A.S.realms || {})) {
      if (o === rid || !A.S.realms[o].alive) continue;
      for (const e of FE.list(rid, o)) if (Math.abs(e.w) >= 2) held.push([o, e]);
      for (const e of FE.list(o, rid)) if (Math.abs(e.w) >= 2) against.push([o, e]);
    }
    if (!held.length && !against.length) return '';
    const row = ([o, e]) => `<div class="tiny ${e.w < 0 ? 'bad' : 'good'}">${UI.esc(A.realmShort(o))}: ${UI.esc(FE.origin(e))} <span class="muted">(${e.w > 0 ? '+' : '−'}${Math.abs(Math.round(e.w))})</span></div>`;
    const by = (x, y) => Math.abs(y[1].w) - Math.abs(x[1].w);
    return `<div class="card small bd-feuds" aria-label="Long memories"><b>Long memories of ${UI.esc(r.short || r.name)}</b>` +
      (held.length ? `<div class="tiny muted" style="margin-top:4px">What ${UI.esc(r.short)} holds against others, or owes them</div>${held.sort(by).slice(0, 6).map(row).join('')}` : '') +
      (against.length ? `<div class="tiny muted" style="margin-top:4px">What others hold against ${UI.esc(r.short)}, or owe it</div>${against.sort(by).slice(0, 6).map(row).join('')}` : '') + '</div>';
  };
  const realmTab = UI.TAB && UI.TAB.realm;
  if (typeof realmTab === 'function') UI.TAB.realm = function (pc) {
    const h = realmTab.apply(this, arguments);
    try { const c = pc ? FE.card(pc) : ''; return c ? h + c : h; } catch (e) { return h; }
  };
})();
