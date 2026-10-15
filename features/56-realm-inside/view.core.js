// The realm from inside, drawn: the court card (who sits, what they want and fear, what is before the court, what the
// court did lately), the crown's purse, and the year's money in the Holdings tab. Views only read: no dice, no
// writes to A.S. Every value goes through UI.esc.

const RI = A.RI = A.RI || {};
const esc = s => UI.esc(String(s == null ? '' : s));
const fmt = n => A.fmt ? A.fmt(Math.round(n)) : String(Math.round(n));
const nameOf = id => { const p = A.P(id); return p ? A.fullName(p, false) : 'someone'; };
const who = id => { const p = A.P(id); return p ? `<span class="click u" data-a="ov" data-v="person:${esc(p.id)}">${esc(A.fullName(p, false))}</span>` : 'someone'; };
const house = id => { const h = A.S.houses && A.S.houses[id]; return h ? `<span class="click u" data-a="ov" data-v="house:${esc(h.id)}">${esc(h.name)}</span>` : 'a house'; };
const list = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0] || '';
const facName = k => ((A.FACTIONS || {})[k] || {}).name || 'faction';

// one line of the court's record, in words (pure)
RI.courtLine = function (r, e) {
  const P = RI.PUSH && RI.PUSH[e.k], seat = e.seat && A.COUNCIL[e.seat] ? A.COUNCIL[e.seat].name : null;
  const by = e.who ? `${who(e.who)}${seat ? ` (${esc(seat)})` : e.house ? ` of ${house(e.house)}` : ''}` : 'The court';
  if (P && e.ruler) return `${by} pressed for ${esc(P.t)}; ${e.yes ? 'you granted it' : 'you said no'}.`;
  if (P && e.k === 'taxDown' && e.p === 100) return `Full coffers: ${e.who ? by + ' had' : 'the crown had'} the taxes lightened.`;
  if (P) return `${by} pressed for ${esc(P.t)}${e.sup && e.sup.length > 1 ? `, with ${list(e.sup.slice(1).map(who))}` : ''}${e.opp && e.opp.length ? `; ${list(e.opp.map(who))} spoke against` : ''}. The crown ${e.yes ? 'agreed' : 'refused'}${e.p != null ? ` (${e.p}%)` : ''}.${e.pcSide ? ` You spoke ${e.pcSide === 'for' ? 'for it' : 'against it'}.` : ''}`;
  if (e.k === 'seat') return `${who(e.who)} named ${esc(seat || 'councillor')}${e.out ? `, in place of ${who(e.out)}` : ''}.`;
  if (e.k === 'pension') return `A pension of ${fmt(e.amt || 0)} suns to ${house(e.house)} (${who(e.who)}), to quiet the ${esc(facName(e.fac))}.`;
  if (e.k === 'seatdeal') return `${who(e.who)} of the ${esc(facName(e.fac))} given the seat of ${esc(seat || 'councillor')}${e.out ? `; ${who(e.out)} loses it` : ''}.`;
  if (e.k === 'refuse') return `The crown would not treat with ${house(e.house)} and the ${esc(facName(e.fac))}.`;
  if (e.k === 'feast') return `A feast for the lords: ${fmt(e.amt || 0)} suns.`;
  if (e.k === 'claim') return `${who(e.who)} claims the throne${e.back && e.back.length ? `, backed by ${list(e.back.slice(0, 3).map(house))}` : ''}.`;
  if (e.k === 'claimwon') return `${who(e.who)} won the throne; the houses that backed the claim are honoured.`;
  if (e.k === 'claimlost') return `The claim of ${who(e.who)} failed${e.hunted && e.hunted.length ? `; the heads of ${esc(list(e.hunted))} were taken` : ''}.`;
  if (e.k === 'claimwhite') return `The war for ${who(e.who)}'s claim ended in a bargain.`;
  if (e.k === 'revolt') return `${who(e.who)} of ${house(e.house)} raised the ${esc(facName(e.fac))} in revolt${e.back && e.back.length > 1 ? `, with ${list(e.back.slice(1, 4).map(house))}` : ''}.`;
  if (e.k === 'secede') return `${who(e.who)} of ${house(e.house)} led the ${esc(facName(e.fac))} out of the realm, with the crown's leave.`;
  return esc(e.k);
};
const whyLine = e => (e.why || []).length ? `<div class="tiny muted">Because: ${(e.why || []).slice(0, 4).map(x => esc(x[0])).join('; ')}</div>` : '';
const aimCell = p => { const a = RI.aims(p); return a ? `<td class="small">${esc(RI.wantText(a.want))}</td><td class="small muted">${esc(RI.fearText(a.fear))}</td>` : '<td></td><td></td>'; };
const aimTitle = p => { const a = RI.aims(p); if (!a) return ''; const w = a.words; return w ? ` title="${esc(w.wants + ' ' + w.fears)}"` : a.wantWhy.length ? ` title="${esc('From: ' + a.wantWhy.concat(a.fearWhy).join(', '))}"` : ''; };

UI.riCourtCard = function (r, pc) {
  if (!r || !RI.voices) return '';
  const L = RI.lawNow(r), mine = pc && pc.ruler === r.id;
  let h = `<div class="card ri-court"><div class="row"><b>The court of ${esc(r.short)}</b><span class="right"></span><span class="tag">${esc(L.tax)} taxes · ${esc(L.auth)} authority · ${esc(L.levy)}</span></div>`;
  // the council
  h += '<div class="group-h">The council</div><div class="tscroll"><table class="t small"><tr><th>Seat</th><th>Who</th><th>Wants</th><th>Fears</th></tr>';
  for (const seat of Object.keys(A.COUNCIL)) {
    const p = A.P((r.council || {})[seat]);
    if (p && p.alive) h += `<tr${aimTitle(p)}><td>${esc(A.COUNCIL[seat].name)}</td><td>${p.id === A.S.pc ? '<b>you</b>' : who(p.id)}</td>${p.id === A.S.pc ? '<td></td><td></td>' : aimCell(p)}</tr>`;
    else h += `<tr><td>${esc(A.COUNCIL[seat].name)}</td><td class="muted" colspan="3">empty</td></tr>`;
  }
  h += '</table></div>';
  // the great lords
  const top = RI.topHouses(r.id);
  if (top.length) {
    h += '<div class="group-h">The great lords</div><div class="tscroll"><table class="t small"><tr><th>House</th><th>Head</th><th>Loyalty</th><th>Wants</th><th>Faction</th></tr>';
    for (const x of top) {
      const p = x.headPid ? A.P(x.headPid) : null, f = A.factionsOf(r.id).find(f => f.members.includes(x.id));
      h += `<tr${p ? aimTitle(p) : ''}><td>${house(x.id)}</td><td>${p && p.alive ? who(p.id) : '—'}</td><td>${Math.round(x.op != null ? x.op : 50)}</td><td class="small">${p && p.alive ? esc(RI.wantText(RI.aims(p).want)) : ''}</td><td class="small">${f ? esc(facName(f.kind)) : ''}</td></tr>`;
    }
    h += '</table></div>';
  }
  // the factions are people
  for (const f of A.factionsOf(r.id)) {
    const lead = A.S.houses[f.leader], head = lead && lead.headPid ? A.P(lead.headPid) : null, back = RI.backers(f);
    h += `<div class="tiny">${esc(facName(f.kind))}: led by ${head && head.alive ? who(head.id) + ' of ' + house(lead.id) : lead ? house(lead.id) : 'nobody'}${head && head.alive ? `, who wants ${esc(RI.wantText(RI.aims(head).want))}` : ''}${back.length ? `; on the council, ${list(back.map(p => who(p.id)))} lean${back.length > 1 ? '' : 's'} its way` : ''}.</div>`;
  }
  // what is before the court next
  const ag = r.riAgenda;
  if (ag && RI.PUSH[ag.k] && ag.y === A.S.year + 1) {
    const T = RI.tally(r, ag.pc ? { k: ag.k, side: ag.pc.side, w: ag.pc.w } : null)[ag.k], o = RI.odds(r, T), p = A.P(ag.who), a = p && RI.aims(p);
    h += `<div class="group-h">Before the court at the new year</div><div class="small">${who(ag.who)} presses for <b>${esc(RI.PUSH[ag.k].t)}</b>${a ? `: ${esc(A.he(p))} wants ${esc(RI.wantText(a.want))}` : ''}.`;
    if (T.pro.length > 1) h += ` With ${esc(A.him(p))}: ${list(T.pro.slice(1, 4).map(x => who(x[0].p.id)))}.`;
    if (T.con.length) h += ` Against: ${list(T.con.slice(0, 3).map(x => who(x[0].p.id) + ' (fears ' + esc(RI.fearText(RI.aims(x[0].p).fear)) + ')'))}.`;
    h += `</div><div class="tiny muted">${mine ? 'The council will put it to you.' : `If it came to the crown today: ${Math.round(o.p * 100)}% it passes.`} ${esc(o.why.slice(2).map(x => x[0] + (x[1] > 0 ? ' (for)' : ' (against)')).join('; '))}</div>`;
    const [ok, why] = RI.canSpeak(pc, r);
    if (ok) {
      const spoke = ag.pc ? `You have spoken ${ag.pc.side === 'for' ? 'for' : 'against'} it.` : '';
      h += `<div class="row" style="margin-top:4px">${spoke ? `<span class="tiny">${esc(spoke)}</span>` : `<button class="small" data-a="riVoice" data-v="for" ${A.S.time >= 1 && !A.S.yearActs.riVoice ? '' : 'disabled'}>Speak for it (1⧗)</button><button class="small" data-a="riVoice" data-v="against" ${A.S.time >= 1 && !A.S.yearActs.riVoice ? '' : 'disabled'}>Speak against it (1⧗)</button>`}${p && p.alive ? `<button class="small ghost" data-a="riGift" data-v="${esc(p.id)}" ${pc.coin >= RI.giftCost(pc, p) ? '' : 'disabled'}>Send ${esc(p.given)} a gift (${A.coin(RI.giftCost(pc, p))})</button>` : ''}</div>`;
    } else if (!mine && pc) h += `<div class="tiny muted">${esc(why)}</div>`;
  }
  // lately at court
  const log = (r.riCourt || []).slice(0, 6);
  if (log.length) {
    h += '<div class="group-h">Lately at court</div>';
    for (const e of log) h += `<div class="small"><b>${esc(e.y)}</b> ${RI.courtLine(r, e)}${whyLine(e)}</div>`;
  }
  return h + '</div>';
};

// the crown's purse: last year's income and where it went (pure)
UI.riLedgerCard = function (r) {
  const B = r && r.riBook;
  if (!B || B.pr) return '';
  const rows = [['Taxes and dues collected', B.inc], ["The host's upkeep", -B.up]];
  if (B.int) rows.push(['Interest to the banks', -B.int]);
  if (B.d0 > B.d1) rows.push(['Debts repaid', -(B.d0 - B.d1)]);
  for (const k of RI.CATS) if (B.cats[k]) rows.push([RI.CAT_T[k], -B.cats[k]]);
  if (B.other) rows.push(['Tribute, war and the forges', B.other]);
  const yrs = Math.round(10 * (B.t1 || 0) / Math.max(1, r.income)) / 10;
  return `<div class="card ri-ledger small"><div class="row"><b>The crown's purse, ${esc(B.y)}</b><span class="right"></span><span class="tag">${fmt(B.t1 || 0)} in the treasury · ${esc(yrs)} years of income</span></div>` +
    `<table class="t small">${rows.map(([l, v]) => `<tr><td>${esc(l)}</td><td class="${v < 0 ? 'bad' : 'good'}" style="text-align:right">${v < 0 ? '−' : '+'}${fmt(Math.abs(v))}</td></tr>`).join('')}</table>` +
    `<div class="tiny muted">A crown of this temper keeps about ${esc(RI.reserveYears(r))} years of income in hand and spends the rest.${(r.riBuilt || []).length ? ' Lately built: ' + esc((r.riBuilt || []).slice(-3).map(([y, pid, b]) => `${(A.BUILDINGS[b] || {}).name || b} in ${A.provName ? A.provName(pid) : pid} (${y})`).join('; ')) + '.' : ''}</div></div>`;
};

// the year's money, line by line (pure)
UI.riPurseCard = function (pc) {
  const P = pc && pc.riPurse;
  if (!P || !P.cur) return '';
  const show = (B, title) => {
    const L = Object.values((B && B.lines) || {}).filter(x => x && x[1]);
    if (!L.length) return '';
    L.sort((a, b) => b[1] - a[1]);
    const tot = L.reduce((a, x) => a + x[1], 0);
    return `<div class="tiny" style="margin-top:6px"><b>${esc(title)}</b></div><table class="t small">${L.map(([l, v]) => `<tr><td>${esc(l)}</td><td class="${v < 0 ? 'bad' : 'good'}" style="text-align:right">${v < 0 ? '−' : '+'}${A.coin(Math.abs(v))}</td></tr>`).join('')}<tr><td><b>All told</b></td><td style="text-align:right"><b>${tot < 0 ? '−' : '+'}${A.coin(Math.abs(tot))}</b></td></tr></table>`;
  };
  const a = show(P.cur, `This year, since New Year ${P.cur.y}`), b = P.last ? show(P.last, `The year before (${P.last.y})`) : '';
  if (!a && !b) return '';
  return `<div class="card ri-purse small"><div class="row"><span class="tag">Where the money goes</span></div>${a}${b}<div class="tiny muted">Regular income and costs: pay, rents, upkeep, taxes, gifts, ransoms and rebuilding. Trade, purchases and events are not listed.</div></div>`;
};

// ---------------------------------------------------------------- where they appear

const baseCourtTab = UI.courtTab;
UI.courtTab = function (pc) {
  let h = baseCourtTab.apply(this, arguments);
  try {
    const r = A.realm(pc && (pc.noble ? pc.noble.realm : pc.realm));
    if (r && r.alive) {
      const add = UI.riCourtCard(r, pc) + UI.riLedgerCard(r), i = h.indexOf('<div class="group-h">The ladder');
      h = i >= 0 ? h.slice(0, i) + add + h.slice(i) : h + add;
    }
  } catch (e) { console.error('[ri] court view', e); }
  return h;
};
const baseRealmTab = UI.TAB.realm;
UI.TAB.realm = function (pc) {
  let h = baseRealmTab.apply(this, arguments);
  try { const r = A.myRealm && A.myRealm(); if (r && (UI.realmView || 'state') === 'court') h += UI.riCourtCard(r, pc); } catch (e) { console.error('[ri] realm view', e); }
  return h;
};
const baseHoldings = UI.TAB.holdings;
UI.TAB.holdings = function (pc) {
  let h = baseHoldings.apply(this, arguments);
  try {
    const mark = "a good sword costs a month of a craftsman's work.</div></div>", i = h.indexOf(mark);
    const card = UI.riPurseCard(pc);
    if (card) h = i >= 0 ? h.slice(0, i + mark.length) + card + h.slice(i + mark.length) : card + h;
    (pc.assets || []).forEach((a, k) => {
      if (!a || !a.burnt) return;
      const n = RI.rebuildCost(a), btn = `data-a="sellProp" data-v="${k}">Sell</button>`;
      h = h.replace(btn, `${btn}<span class="bad tiny">burned in ${esc(a.burnt)}${a.burntBy ? ' by ' + esc(A.realmShort(a.burntBy)) : ''}: pays nothing</span><button class="small" data-a="riRebuild" data-v="${k}" ${pc.coin >= n ? '' : 'disabled'}>Rebuild (${A.coin(n)})</button>`);
    });
  } catch (e) { console.error('[ri] holdings view', e); }
  return h;
};
