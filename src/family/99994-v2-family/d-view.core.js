// v2 family, part 4: what the player sees. The People tab opens with your line (your house, its law, its head, where
// you stand) and your kin of note (A.V2.kin.notableKin: the uncle who holds an office, the cousin your age, the aunt
// who is heir to her house); the person view says what someone holds and what they are heir to; the creation screen
// says, where the birth-position picker was, that the family decides. All of it is pure: it reads, and draws nothing.
(function () {
  const V = A.V2, F = A.V2F; if (!V || !F || !F.houseLaw) return;
  const K = V.kin, esc = s => UI.esc(String(s == null ? '' : s));
  const live = p => !!(p && p.alive);

  UI.crPlaceNote = function (c) {
    const half = c && (c.race === 'halfelf' || c.race === 'halforc') && (c.status === 'noble' || c.status === 'royal');
    return `<div class="field v2f-place"><label>Place in the family</label><div class="small muted">${half
      ? 'Of mixed blood in a noble house, you are born outside the marriage and raised by your mother\'s people.'
      : 'Not chosen. Your elder brothers and sisters, and the law of the house, decide where you stand.'}</div></div>`;
  };

  // heir claims worth naming: the first in line of your house, your mother's house and your realm's crown
  F.heirClaims = function (pc) {
    const out = new Map(), mo = F.parentOf(pc, 'F');
    for (const hid of [pc.house, mo && mo.house].filter(Boolean)) {
      const h = A.S.houses[hid]; if (!h) continue;
      const L = F.houseLine(hid, 1), first = L.line[0] && L.line[0].p;
      if (live(first) && !out.has(first.id)) out.set(first.id, h.name);
    }
    const r = A.realm(pc.realm), hr = r && r.heir && A.P(r.heir);
    if (live(hr)) out.set(hr.id, `the crown of ${r.short || r.name}`);
    return out;
  };
  F.notable = function (pc, max) {
    const P = F.people(), me = P.of(pc), claims = F.heirClaims(pc);
    for (const [id, what] of claims) { const w = P.get(id); if (w) w.heirTo = what; }
    return K.notableKin(P, me, { year: A.S.year, maxDegree: 4 }).slice(0, max || 10).map(e => {
      const L = F.label(pc, e.person.game, P);
      return { p: e.person.game, relation: L ? L.text : e.relation, why: e.why, alive: e.alive, age: e.age };
    });
  };

  F.lineCard = function (pc) {
    const h = pc.house && A.S.houses[pc.house], rows = [];
    if (h) {
      const law = F.houseLaw(h.id), head = F.headOf(h.id), pl = F.placeIn(pc, h.id);
      const hl = head && head.id !== pc.id ? F.label(pc, head) : null;
      rows.push(`<div><b>${esc(h.name)}</b>${h.seat ? ` <span class="muted">of ${esc(h.seat)}</span>` : ''}</div>`);
      rows.push(`<div class="small">${esc(F.lawText(law))}</div>`);
      if (head) rows.push(`<div class="small">Head of the house: <span class="click" data-a="ov" data-v="person:${esc(head.id)}">${esc(A.fullName(head))}</span>${hl ? ', ' + esc(hl.text.toLowerCase()) : head.id === pc.id ? ' (you)' : ''}.</div>`);
      if (pl && pl.place !== 0) rows.push(`<div class="small">${esc(pl.text)}</div>`);
    } else rows.push('<div class="small">Your family holds no title. What your father leaves is shared among his children, the eldest taking most.</div>');
    const mo = F.parentOf(pc, 'F'), mh = mo && mo.house && mo.house !== pc.house && A.S.houses[mo.house];
    if (mh) rows.push(`<div class="small muted">Your mother's house: ${esc(mh.name)}. ${esc((F.LAWS[F.houseLaw(mh.id).law] || {}).name || '')}.</div>`);
    return `<div class="group-h">Your line</div><div class="card v2f-line">${rows.join('')}</div>`;
  };
  F.kinCard = function (pc) {
    const ks = F.notable(pc, 10); if (!ks.length) return '';
    // one small card each (90-collapsible-sections folds a tall card to its first row)
    const row = k => `<div class="card v2f-kin click" data-a="ov" data-v="person:${esc(k.p.id)}"><div><b>${esc(A.fullName(k.p))}</b> <span class="muted">${esc(k.relation)} · ${k.alive ? esc(k.age) : '† ' + esc(k.p.died)}</span></div>${k.why.length ? `<div class="small">${esc(k.why.join(' · '))}</div>` : ''}</div>`;
    return `<div class="group-h">Kin of note</div>${ks.map(row).join('')}`;
  };

  const list = UI.peopleList;
  UI.peopleList = function (pc) {
    const h = list.apply(this, arguments);
    try { if (pc && pc.id === A.S.pc) return F.lineCard(pc) + F.kinCard(pc) + h; } catch (e) { console.error('v2-family view', e); }
    return h;
  };

  // the person view: heir claims
  const modal = UI.personModal;
  if (typeof modal === 'function') UI.personModal = function (t) {
    const h = modal.apply(this, arguments);
    try {
      const pc = A.pc(); if (!t || !pc || typeof h !== 'string') return h;
      const bits = [];
      // (an office or vows already show as the person's occupation)
      if (t.vows) bits.push('outside every line of succession');
      const hh = t.house && A.S.houses[t.house];
      if (live(t) && hh && hh.headPid !== t.id) { const L = F.houseLine(hh.id, 1); if (L.line[0] && L.line[0].p.id === t.id) bits.push(`heir to ${hh.name}`); }
      const r = A.realm(t.realm); if (live(t) && r && r.heir === t.id) bits.push(`heir to the crown of ${r.short || r.name}`);
      if (!bits.length) return h;
      const line = `<div class="small v2f-holds">${esc(bits.join(' · '))}</div>`;
      const at = h.indexOf('</h2>');
      return at > 0 ? h.slice(0, at + 5) + line + h.slice(at + 5) : h;
    } catch (e) { return h; }
  };

  // the family tree (the profile's "Family" button): the release drew grandparents, parents, siblings, spouse and
  // children; the uncles, aunts (with their spouses) and cousins come from A.V2.kin.familyTree, each with its label
  const tree = UI.treeModal;
  if (typeof tree === 'function') UI.treeModal = function (pc) {
    const h = tree.apply(this, arguments);
    try {
      if (!pc || typeof h !== 'string') return h;
      const P = F.people(), me = P.of(pc), rows = K.familyTree(P, me), parents = new Set(P.parents(me).map(x => x.id));
      const gen = g => (rows.find(r => r.gen === g) || { people: [] }).people.map(x => x.p);
      const unc = [];
      for (const u of gen(-1).filter(x => !parents.has(x.id))) { unc.push(u); for (const s of u.spouseIds.map(P.get).filter(Boolean)) if (!unc.includes(s)) unc.push(s); }
      const cz = gen(0).filter(x => { const k = F.kinOf(pc, x.game, P); return k && k.line === 'cousin'; });
      const box = q => { const p = q.game, L = F.label(pc, p, P); return `<div class="card click small" style="text-align:center;width:120px" data-a="ov" data-v="person:${esc(p.id)}">${PORTRAIT.svg(p, 64)}<div><b>${esc(p.given)}</b></div><div class="tiny muted">${esc(L ? L.text : '')}</div><div class="tiny muted">${p.alive ? esc(A.age(p)) : '†' + esc(p.died)}</div></div>`; };
      const row = (lbl, list) => (list.length ? `<div class="group-h">${lbl}</div><div class="row" style="justify-content:center">${list.map(box).join('')}</div>` : '');
      const add = row('Uncles and aunts', unc) + row('Cousins', cz);
      const at = h.indexOf('<div class="group-h">You and your siblings</div>');
      return add && at > 0 ? h.slice(0, at) + add + h.slice(at) : h;
    } catch (e) { console.error('v2-family tree', e); return h; }
  };

  // the heading a roster entry is shown under (patch V2F-ROSTER-GROUP): a plain soldier's messmates are beside him, not
  // under him (playtest 2, old #15: messmates "UNDER YOU" for a plain Soldier). Pure.
  F.rosterGroup = x => (x && x.grp === 'Under you' && x.role === 'in your mess' ? 'Beside you' : x && x.grp);

  const CSS ='.v2f-line>div+div{margin-top:3px}.v2f-kin{padding:6px 10px;margin:0 0 4px}.v2f-kin .small{margin-top:2px}.v2f-holds{margin:2px 0}';
  try { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); } catch (e) {}
})();
