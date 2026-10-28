// The Polity, part six: fiefs by vote (Bannerlord). When a house's head is taken for treason after a failed claim
// (56-realm-inside hunts the backers), half its land is forfeit to the crown and a grant opens for 60 days: up to three
// candidates (the heads of the realm's lesser houses, and the player when 994's bar for a fief is met), each
// councillor and each great house head backing one (a seat weighs 1, a house 0.5 + opinion/200), the ruler deciding.
// Overriding the leader costs 10 with each of its backers' houses. The player may lobby a backer (1 initiative).
//
// State: r.pol.fief = { h, from, due, cands: [pid], back: {pid: cand}, share }.
const POL = A.POL;
const clamp = POL.clamp, live = p => !!(p && p.alive);
const CAR = () => A.CAR || null;

POL.fiefBackers = function (r) {
  const out = [], seen = new Set();
  for (const s in (r.council || {})) { const p = A.P(r.council[s]); if (live(p) && !seen.has(p.id)) { seen.add(p.id); out.push({ p, w: 1 }); } }
  for (const h of (A.RI && A.RI.topHouses ? A.RI.topHouses(r.id) : [])) { const p = h.headPid && A.P(h.headPid); if (live(p) && !seen.has(p.id)) { seen.add(p.id); out.push({ p, w: null, h }); } }
  return out.filter(b => b.p.id !== A.S.pc);
};
// whom a backer backs: their own lobbying first, then the candidate they think most of; pure
POL.fiefPick = function (r, b) {
  const F = r.pol.fief; if (!F) return null;
  if (F.back && F.back[b.p.id] && F.cands.includes(F.back[b.p.id])) return F.back[b.p.id];
  let best = null, bs = -1e9;
  for (const id of F.cands) { const c = A.P(id); if (!live(c)) continue; const s = A.opinion(b.p, c) + (c.fame || 0) / 4 + (c.house && c.house === b.p.house ? 40 : 0); if (s > bs || (s === bs && best && id < best)) { bs = s; best = id; } }
  return best;
};
// the weights behind each candidate; pure
POL.fiefTally = function (r) {
  const F = r.pol.fief, t = {}; if (!F) return t;
  for (const id of F.cands) t[id] = 0;
  for (const b of POL.fiefBackers(r)) { const c = POL.fiefPick(r, b); if (c == null) continue; const w = b.w != null ? b.w : .5 + clamp(A.opinion(b.p, A.P(c)), -100, 100) / 200; t[c] = Math.round(((t[c] || 0) + w) * 100) / 100; }
  return t;
};
POL.openFief = function (r, h) {
  const pol = POL.init(r); if (!pol || pol.fief) return null;
  const pc = A.pc();
  const C = A.realmHouses(r.id).filter(x => x !== h && x.great === false && x.headPid && live(A.P(x.headPid))).sort((a, b) => (A.P(b.headPid).fame || 0) - (A.P(a.headPid).fame || 0) || String(a.id).localeCompare(String(b.id))).slice(0, 3).map(x => x.headPid);
  const pcOk = pc && pc.alive && pc.realm === r.id && !pc.ruler && (CAR() && CAR().fiefable ? CAR().fiefable(pc) : !!(pc.noble && pc.noble.rung >= 2 && (pc.fame || 0) >= 55));
  if (pcOk) { if (C.length >= 3) C.pop(); C.push(pc.id); }
  if (!C.length) return null;
  const share = Math.round(A.houseStrength(h) / 2);
  pol.fief = { h: h.id, from: A.S.year, due: A.absDay() + 60, cands: C, back: {}, share };
  h.levy = Math.max(1, Math.round(A.houseStrength(h) - share));
  if (pc && pc.alive && pc.realm === r.id && (pcOk || POL.fiefBackers(r).some(b => b.p.id === pc.id) || POL.inCouncil(pc, r)) && A.EV.po_fief_vote) A.queue({ type: 'event', ev: 'po_fief_vote', ctx: { rid: r.id, houseT: h.name, realmT: r.short, cand: pcOk ? 1 : 0 } });
  return pol.fief;
};
POL.closeFief = function (r) {
  const F = r.pol.fief; if (!F) return null;
  r.pol.fief = null;
  const t = POL.fiefTally(r), ids = Object.keys(t).filter(id => live(A.P(id)));
  if (!ids.length) return null;
  ids.sort((a, b) => t[b] - t[a] || String(a).localeCompare(String(b)));
  const lead = ids[0], pc = A.pc(), ru = A.P(r.ruler);
  let win = lead;
  if (pc && pc.ruler === r.id) win = F.pcPick && ids.includes(F.pcPick) ? F.pcPick : lead;
  else if (ru && ids.length > 1) { const P = A.rulerPersona ? A.rulerPersona(r.id) : { caution: 0 }; if (!A.chance(clamp(.7 + .2 * (P.caution || 0), .4, .95))) win = ids.slice().sort((a, b) => A.opinion(ru, A.P(b)) - A.opinion(ru, A.P(a)))[0]; }
  if (win !== lead) for (const b of POL.fiefBackers(r)) if (POL.fiefPick(r, b) === lead && b.p.house && A.S.houses[b.p.house]) { const hh = A.S.houses[b.p.house]; hh.op = clamp((hh.op != null ? hh.op : 50) - 10, 0, 100); }
  const w = A.P(win), from = A.S.houses[F.h];
  if (w.id === (pc && pc.id)) {
    if (CAR() && CAR().enfeoff && !(pc.noble && pc.noble.rung >= 4)) CAR().enfeoff(pc); else if (pc.noble) pc.noble.rung = Math.max(pc.noble.rung, 4);
    A.log(`The crown grants you the forfeit lands of ${from ? from.name : 'a traitor house'}.`, 'crown');
  } else {
    const hh = w.house && A.S.houses[w.house];
    if (hh) { hh.levy = Math.round((+hh.levy || A.houseStrength(hh)) + F.share); hh.op = clamp((hh.op != null ? hh.op : 50) + 10, 0, 100); }
    if (pc && pc.alive && F.cands.includes(pc.id) && A.EV.po_passed_over) A.queue({ type: 'event', ev: 'po_passed_over', ctx: { pid: w.id, rid: r.id, houseT: from ? from.name : 'the traitor house' } });
  }
  POL.offLog(r, { k: 'fief', who: w.id, h: F.h, lead, t });
  A.news(`${r.short}: the forfeit lands of ${from ? from.name : 'a traitor house'} go to ${A.fullName(w, false)}${win !== lead ? ', though the council backed another' : ''}.`, 'crown');
  POL.stats.fiefs = (POL.stats.fiefs || 0) + 1;
  return w;
};
A.onMonth.push(function () {
  if (!POL.on) return;
  try { const d = A.absDay(); for (const r of POL.realms()) if (r.pol && r.pol.fief && d >= r.pol.fief.due) POL.closeFief(r); } catch (e) { console.error('[po] fief', e); }
});
// after 56 hunts a failed claimant's backers: the houses whose heads were taken forfeit half their land
A.on && A.on('warEnd', function (w, result) {
  try {
    if (!POL.on || !w || w.cb !== 'throne' || result !== 'def' || !Array.isArray(w.riBack)) return;
    const r = A.realm(w.leadD); if (!r || !r.alive || !r.pol) return;
    const h = w.riBack.map(id => A.S.houses[id]).find(x => x && !x.extinct && x.realm === r.id && !x.headPid);
    if (h) POL.openFief(r, h);
  } catch (e) { console.error('[po] forfeit', e); }
});
// the player lobbies a backer (1 initiative): persuasion, or a favour they owe you
Object.assign(UI.A, {
  poLobby(pid) {
    const pc = A.pc(), r = POL.myRealm(pc), F = r && r.pol && r.pol.fief, b = A.P(pid);
    if (!F || !live(b) || !F.cands.includes(pc.id)) return;
    if ((A.S.time || 0) < 1) { A.log('Not enough initiative.', 'warn'); return; }
    A.S.time -= 1;
    const fav = A.favorsOf && A.favorsOf(pc, b.id) > 0;
    const ok = fav || A.chance(clamp(.3 + A.skill(pc, 'persuasion') / 110, .1, .85));
    if (fav) A.addFavor(pc, b.id, -1);
    if (ok) F.back[b.id] = pc.id;
    A.log(ok ? `${A.fullName(b, false)} will speak for you when the lands are granted.${fav ? ' The favour is spent.' : ''}` : `${A.fullName(b, false)} hears you out and promises nothing.`, ok ? 'good' : 'warn');
    UI.refreshTab ? UI.refreshTab() : UI.refresh();
  },
  poFiefPick(pid) { const pc = A.pc(), r = POL.myRealm(pc), F = r && r.pol && r.pol.fief; if (F && pc.ruler === r.id && F.cands.includes(pid)) { F.pcPick = pid; UI.refreshTab ? UI.refreshTab() : UI.refresh(); } },
});
// the grant on the Politics view; pure
POL.fiefCard = function (r, pc) {
  const F = r.pol.fief; if (!F) return '';
  const esc = s => UI.esc(String(s == null ? '' : s)), t = POL.fiefTally(r), h = A.S.houses[F.h];
  const who = p => p ? `<span class="click u" data-a="ov" data-v="person:${esc(p.id)}">${esc(A.fullName(p, false))}</span>` : '?';
  const rows = F.cands.map(id => { const c = A.P(id); return `<div class="po-row po-small"><span>${who(c)}${pc && id === pc.id ? ' <span class="muted">(you)</span>' : ''}</span><span class="po-num" title="${esc('Councillors weigh 1, house heads 0.5 + their opinion / 200')}">${esc((t[id] || 0).toFixed(2))}</span>${pc && pc.ruler === r.id ? `<button class="small${F.pcPick === id ? ' primary' : ''}" data-a="poFiefPick" data-v="${esc(id)}">Grant</button>` : ''}</div>`; }).join('');
  const lob = pc && F.cands.includes(pc.id) ? `<div class="po-cap">Lobby a backer (1⧗)</div><div class="po-btns">${POL.fiefBackers(r).filter(b => POL.fiefPick(r, b) !== pc.id).slice(0, 6).map(b => `<button class="small ghost" data-a="poLobby" data-v="${esc(b.p.id)}">${esc(A.fullName(b.p, false))}</button>`).join('')}</div>` : '';
  return `<section class="card po-card" id="po-fief"><div class="po-head"><h4 class="po-h">Forfeit lands: ${esc(h ? h.name : 'a traitor house')}</h4></div><div class="po-small">The crown grants them on ${esc(POL.dateOf ? POL.dateOf(F.due) : F.due)}. Overriding the council's choice costs the crown its backers' goodwill.</div>${rows}${lob}</section>`;
};
