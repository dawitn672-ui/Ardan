// 9997-companies, part 4: on screen. The order of battle under a division in the war room, your company card (war
// room and Path tab), the battle's "your command" panel, morale tooltips with every part, couriers on the army row.
// Drawing only reads: no random numbers, no writes to A.S (d.bs missing is drawn from a temporary build).
(function () {
  const CO = A.CO, F = GD.FORMATIONS, esc = s => UI.esc(s);
  const pct = (v, m) => Math.max(0, Math.min(100, Math.round(100 * v / Math.max(1, m))));
  const bar = (v, m, cls, label) => `<span class="co-bar ${cls}" role="img" aria-label="${esc(label)}"><i style="width:${pct(v, m)}%"></i></span>`;
  const nominal = c => (GD.BN[c] ? GD.BN[c].men : GD.SUP[c] ? GD.SUP[c].men : 100);
  const word = mo => (mo >= 75 ? 'eager' : mo >= 60 ? 'steady' : mo >= 45 ? 'sullen' : mo >= 30 ? 'shaken' : 'near breaking');
  // tooltips: resting morale with its parts, for a company or a battalion ("divId|b|ci", ci -1 for the battalion)
  UI.TIPS = UI.TIPS || {};
  UI.TIPS.coMo = function (arg) {
    const [id, b, ci] = String(arg).split('|'), d = A.divById(id);
    if (!d || !CO.ok(d)) return '';
    const i = +b, c = +ci, rec = d.bs[i];
    if (!rec) return '';
    const R = CO.restOne(d, i, c >= 0 ? c : 0), now = c >= 0 ? rec.q[c] : CO.bMo(rec);
    return `<b>${esc(c >= 0 ? CO.coName(d, i, c) : CO.bnName(d, i))}</b><div class="tiny">Morale ${Math.round(now)} (${word(now)}); it settles towards ${Math.round(R.total)}:</div><ul class="tiny co-parts">${R.parts.map(([l, v]) => `<li>${esc(l)} <b>${v > 0 && l !== 'Base' ? '+' : ''}${esc(String(v))}</b></li>`).join('')}</ul>` +
      `<div class="tiny muted">On the war map morale sets the division's order: ×${(CO.K.ORG_LO + CO.K.ORG_K * (d.mo || 50) / 100).toFixed(2)} at ${Math.round(d.mo || 50)}.</div>`;
  };
  UI.TIPS.coCap = function (arg) {
    const [id, b, s] = String(arg).split('|'), d = A.divById(id);
    if (!d || !CO.ok(d)) return '';
    const c = CO.cap(d, +b, +s);
    if (!c) return '<b>No senior captain</b><div class="tiny">The post is vacant until the year\'s promotions.</div>';
    const G = A.GENERALS, sat = c.sat || 0;
    return `<b>${c.pc ? 'You' : esc((+s === 4 ? 'Senior Captain ' : 'Captain ') + c.name)}</b><div class="tiny">Command ${Math.round(c.cmd)} · ${esc(G && G.NAMES ? G.NAMES[c.temper] || c.temper : c.temper)} · ${sat >= 30 ? 'content' : sat <= -30 ? 'unhappy' : 'neither pleased nor not'} (${sat})</div>`;
  };
  const view = d => (CO.ok(d) ? d.bs : null);
  // one battalion row (pure)
  CO.bnRow = function (d, i, open) {
    const b = d.bs[i], m = CO.bm(b), mo = CO.bMo(b), sup = CO.isSup(b.c), sen = sup ? null : CO.cap(d, i, 4), mine = CO.mineIs(d, i);
    const hon = (b.hon || []).map(h => `<span class="co-seal" title="${esc(h[0] + ', ' + h[1])}">${esc(h[0].replace(/^(Battle of|Fight at) /, '').slice(0, 1))}</span>`).join('');
    let h = `<div class="co-row${mine ? ' co-mine' : ''}"><div class="co-name"><b>${esc(CO.bnName(d, i))}</b>${hon ? ' ' + hon : ''}${mine ? ' <span class="tag">yours</span>' : ''}<div class="tiny muted">${sup ? 'support' : `<span data-tt="coCap" data-v="${esc(d.id + '|' + i + '|4')}">${sen ? esc(sen.pc ? 'You' : 'Sen. Capt. ' + sen.name) : 'no senior captain'}</span>`}</div></div>` +
      `<div class="co-bars"><span class="tiny">${A.fmt(m)}</span>${bar(m, nominal(b.c), 'men', `${m} of ${nominal(b.c)} men`)}` +
      `<span class="tiny" data-tt="coMo" data-v="${esc(d.id + '|' + i + '|-1')}">mo ${Math.round(mo)}</span>${bar(mo, 100, 'mo', `morale ${Math.round(mo)}`)}<span class="tiny">xp ${Math.round(b.x)}</span>${b.wd >= 1 ? `<span class="tiny muted">${Math.round(b.wd)} hurt</span>` : ''}</div></div>`;
    if (open && !sup) {
      h += '<div class="co-coys">';
      for (let ci = 0; ci < b.k.length; ci++) {
        const c = CO.cap(d, i, ci);
        h += `<div class="co-coy${CO.mineIs(d, i, ci) ? ' co-mine' : ''}"><span>${esc(CO.coName(d, i, ci, true))}</span> <span class="tiny muted" data-tt="coCap" data-v="${esc(d.id + '|' + i + '|' + ci)}">${esc(c.pc ? 'you' : 'Capt. ' + c.name)}</span> <span class="tiny">${A.fmt(b.k[ci])}</span> <span class="tiny" data-tt="coMo" data-v="${esc(d.id + '|' + i + '|' + ci)}">mo ${Math.round(b.q[ci])}</span></div>`;
      }
      h += '</div>';
    }
    return h;
  };
  CO.oobHtml = function (d) {
    if (!d || !view(d)) return '';
    const mine = CO.mine(), t = A.tplOf(d), cap = t && (t.sup || []).includes('train') ? CO.K.FOOD_TRAIN : CO.K.FOOD_CAP;
    let h = `<div class="group-h">Order of battle</div><div class="tiny muted">Bread for ${Math.round(d.food != null ? d.food : CO.K.FOOD0)} of ${cap} days${d.pay ? ` · pay ${d.pay} month${d.pay > 1 ? 's' : ''} behind` : ' · paid'} · morale ${Math.round(d.mo || 50)} (${word(d.mo || 50)})</div><div class="co-oob">`;
    for (let i = 0; i < d.bs.length; i++) h += CO.bnRow(d, i, !!(mine && mine.d === d && mine.b === i));
    return h + '</div>';
  };
  // the player's company (pure)
  CO.companyCard = function (pc) {
    const C = CO.myCompany(pc);
    if (!C) return '';
    const sq = A.squad(pc).slice(0, 3), dead = (pc.mil.coDead || 0), des = (pc.mil.coDes || 0);
    const cap = C.cap, sj = C.serjeants[0];
    const men = `<span>${A.fmt(C.men)} fit</span> · <span>${A.fmt(C.wd)} hurt</span>${dead ? ` · <span>${A.fmt(dead)} dead</span>` : ''}${des ? ` · <span>${A.fmt(des)} deserted</span>` : ''}`;
    return `<div class="card co-card" role="region" aria-label="Your company"><div class="row"><b>${esc(C.name)}</b><span class="right tag">${esc(word(C.mo))}</span></div>` +
      `<div class="small">${cap.pc ? 'You are its captain' : `Captain <b>${esc(cap.name)}</b> <span class="muted">(${esc((A.GENERALS && A.GENERALS.NAMES && A.GENERALS.NAMES[cap.temper]) || cap.temper)}, command ${Math.round(cap.cmd)})</span>`}${C.sen ? ` · senior captain ${esc(C.sen.pc ? 'you' : C.sen.name)}` : ''}</div>` +
      `<div class="small">Serjeant ${esc(sj.name)}${sq.length ? ` · beside you: ${sq.map(p => esc(p.given)).join(', ')}` : ''}</div>` +
      `<div class="small">${men}</div>` +
      `<div class="small"><span data-tt="coMo" data-v="${esc(C.d.id + '|' + C.b + '|' + C.i)}">Morale ${Math.round(C.mo)}</span> · bread for ${Math.round(C.food)} days · ${C.pay ? `pay ${C.pay} month${C.pay > 1 ? 's' : ''} behind` : 'paid up'}${C.hon.length ? ' · honours: ' + C.hon.map(h => esc(h[0] + ' ' + h[1])).join(', ') : ''}</div></div>`;
  };
  const divPanel = UI.wrDivPanel;
  if (typeof divPanel === 'function') UI.wrDivPanel = function (ids, R2) {
    const h = divPanel.apply(this, arguments);
    try {
      const ds = (ids || []).map(A.divById).filter(Boolean);
      if (ds.length !== 1) return h;
      const d = ds[0], pc = A.pc(), intel = !A.hostile(UI.wrMyR ? UI.wrMyR(pc) : pc.realm, d.r) || (UI.wrIntel && UI.wrIntel(d));
      if (!intel) return h;
      const add = CO.oobHtml(d), at = h.lastIndexOf('</div>');
      return at < 0 ? h + add : h.slice(0, at) + add + h.slice(at);
    } catch (e) { console.error('companies oob', e); return h; }
  };
  const myDiv = UI.wrMyDivCard;
  if (typeof myDiv === 'function') UI.wrMyDivCard = function (pc) {
    const h = myDiv.apply(this, arguments);
    try { const c = CO.companyCard(pc); if (!c) return h; const at = h.lastIndexOf('</div>'); return h.slice(0, at) + c + h.slice(at); } catch (e) { return h; }
  };
  const pathCard = UI.armyPathCard;
  if (typeof pathCard === 'function') UI.armyPathCard = function (pc) {
    const h = pathCard.apply(this, arguments);
    try { const c = CO.companyCard(pc); return c ? h + c : h; } catch (e) { return h; }
  };
  const armyRow = UI.wrArmyRow;
  if (typeof armyRow === 'function') UI.wrArmyRow = function (a) {
    const h = armyRow.apply(this, arguments);
    try {
      const t = CO.courierText(a);
      if (!t) return h;
      const at = h.lastIndexOf('</div>');
      return h.slice(0, at) + `<div class="tiny co-courier">${esc(t)}</div>` + h.slice(at);
    } catch (e) { return h; }
  };

  // 72's book: under the men beside you, the company they stand in and the captain over them
  const TSq = A.TS && A.TS.squadHtml;
  if (typeof TSq === 'function') A.TS.squadHtml = function (m) {
    const h = TSq.apply(this, arguments);
    try {
      if (m && m.ts && m.ts.levy) return h;
      const C = CO.myCompany(A.pc());
      if (!C) return h;
      return h + `<p class="ts-coy tiny">${esc(C.name)}: ${esc(C.cap.pc ? 'your own company' : 'Captain ' + C.cap.name)}, Serjeant ${esc(C.serjeants[0].given)}. ${A.fmt(C.men)} in the ranks, morale ${Math.round(C.mo)} (${esc(word(C.mo))}).</p>`;
    } catch (e) { return h; }
  };

  // ---- the battle: your command
  CO.commandPanel = function (B) {
    if (!B || !B.co || B.phase === 'end') return '';
    const me = B.sides[B.pcSide].units.filter(u => CO.commands(B, u) && u.status !== 'gone');
    if (B.co.rank >= 7) return '';
    if (!me.length) return '<div class="card small co-cmd"><b>Your command</b> <span class="muted">— nothing left on the field to command</span></div>';
    let h = `<div class="card small co-cmd" role="region" aria-label="Your command"><b>Your command</b> <span class="muted">${B.co.rank === 6 ? 'your battalion\'s four companies' : 'your company'}; the rest of the line moves on its captains' orders</span>`;
    if (B.co.rank === 6) h += `<label class="row tiny"><input type="checkbox" data-c="coFollow" ${B.co.follow ? 'checked' : ''}> Follow me: the four act together</label>`;
    for (const u of me) {
      const I = CO.unitInfo(B, u), forms = CO.formsFor(B, u);
      h += `<div class="co-unit"><div class="row"><b>${esc(I.name)}</b><span class="right tiny">${A.fmt(u.men)} · morale ${I.morale}${u.status !== 'ok' ? ' · ' + esc(u.status === 'rout' ? 'routing' : u.status) : ''}</span></div>` +
        `<div class="row wrap">${Object.keys(CO.ORDERS).map(k => { const ok = CO.orderOk(B, u, k); return `<button class="small ${I.order === k ? 'primary' : ''}" data-a="coOrd" data-v="${esc(u.id + '|' + k)}" ${ok ? '' : 'disabled'} ${ok ? '' : `title="${esc(k === 'withdraw' ? 'Your men never drilled a withdrawal in step' : 'Not now')}"`}>${esc(CO.ORDERS[k])}</button>`; }).join('')}` +
        `<select data-c="coForm" data-k="${esc(u.id)}" aria-label="Shape for ${esc(I.name)}">${forms.map(f => `<option value="${f.k}" ${f.k === I.form ? 'selected' : ''} ${f.ok ? '' : 'disabled'}>${esc(F[f.k].name + (f.why ? ' · ' + f.why : ''))}</option>`).join('')}</select></div></div>`;
    }
    // the enemy's next moves (honest: the engine has already chosen them)
    const en = B.sides[B.pcSide === 'A' ? 'B' : 'A'].units.filter(u => u.next && u.status !== 'gone');
    if (en.length) h += `<div class="tiny muted co-intent">Their next move: ${en.slice(0, 6).map(u => esc(`${u.name} ${u.next}`)).join(' · ')}</div>`;
    return h + '</div>';
  };
  const modal = UI.battleModalBasic;
  UI.battleModalBasic = function (B) {
    let h = modal.apply(this, arguments);
    try {
      if (!B || !B.co || B.phase === 'end' || B.co.rank >= 7) return h;
      h = h.replace(/<select data-c="bTac"/g, '<select data-c="bTac" disabled title="The wings move on the general\'s orders and their captains\'"');
      h = h.replace(/<button class="small" data-a="bRes"[^>]*>[^<]*<\/button>/g, '');
      const at = h.indexOf('<div class="wingctl');
      const p = CO.commandPanel(B);
      return at >= 0 ? h.slice(0, at) + p + h.slice(at) : h;
    } catch (e) { console.error('companies battle panel', e); return h; }
  };
  Object.assign(UI.A, {
    coOrd(el) { const [u, k] = String(el.dataset.v).split('|'); A.coOrder(u, k); UI.renderModal ? UI.renderModal() : UI.refresh(); },
  });
  Object.assign(UI.C, {
    coForm(el) { A.coForm(el.dataset.k, el.value); UI.renderModal ? UI.renderModal() : UI.refresh(); },
    coFollow(el) { A.coFollow(el.checked); UI.renderModal ? UI.renderModal() : UI.refresh(); },
  });
  // styles, in the look's tokens
  try {
    const css = `.co-oob{display:flex;flex-direction:column;gap:2px;margin-top:4px}.co-row{display:flex;gap:8px;align-items:center;justify-content:space-between;padding:2px 4px;border-bottom:1px solid var(--line,#ccc3)}
.co-row.co-mine,.co-coy.co-mine{background:var(--gold-wash,#d4a01722)}.co-name{min-width:0;flex:1 1 auto}.co-bars{display:flex;gap:4px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
.co-bar{display:inline-block;width:44px;height:6px;background:var(--line,#8884);border-radius:3px;overflow:hidden}.co-bar i{display:block;height:100%;background:var(--ink,#333)}.co-bar.mo i{background:var(--accent,#a33)}
.co-coys{padding-left:14px}.co-coy{display:flex;gap:6px;align-items:baseline;flex-wrap:wrap}.co-seal{display:inline-block;min-width:14px;height:14px;line-height:14px;text-align:center;border-radius:50%;background:var(--accent,#a33);color:var(--paper,#fff);font-size:9px}
.co-card{margin-top:6px}.co-cmd .co-unit{border-top:1px solid var(--line,#ccc3);padding-top:4px;margin-top:4px}.co-cmd select{max-width:100%}.co-parts{margin:2px 0 2px 14px;padding:0}`;
    if (typeof document !== 'undefined' && !document.getElementById('co-css')) { const s = document.createElement('style'); s.id = 'co-css'; s.textContent = css; document.head.appendChild(s); }
  } catch (e) {}
})();
