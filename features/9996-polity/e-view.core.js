// The Polity, part five: the Polity view (Realm tab → Politics; for a lord, a card under the court), its tooltips,
// and the bill's next count and the election on 996's strip. Views only read: no dice, no writes to A.S. Every value
// goes through UI.esc. Actions use data-a (poPropose, poVoice, poSeek, poTask, poOath, poElect, poJoin, poTab).
const POL = A.POL, RI = A.RI = A.RI || {};
const esc = s => UI.esc(String(s == null ? '' : s));
const live = p => !!(p && p.alive);
const pct = v => Math.round((v || 0) * 100) + '%';
const sg = v => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(Math.round(v));
const tt = (key, arg, label) => (UI.tt ? UI.tt(key, arg, label) : label);
const who = p => p ? `<span class="click u" data-a="ov" data-v="person:${esc(p.id)}">${esc(A.fullName(p, false))}</span>` : '<span class="muted">nobody</span>';
const H = (t, v) => `<div class="tip-h">${t}${v != null ? ` <b>${v}</b>` : ''}</div>`;
const R = (l, v, c) => `<div class="tip-row${c ? ' ' + c : ''}"><span>${l}</span><b>${v}</b></div>`;
const D = t => `<div class="tip-d">${t}</div>`;
const realmOf = rid => { const r = A.realm(rid); return r && r.pol ? r : null; };
const dateOf = day => { try { const y = Math.floor(day / 365), d = day - y * 365, m = A.monthOf(d); return `${m.d || ''} ${(GD.MONTHS || [])[m.m] || ''} ${y}`.trim(); } catch (e) { return String(day); } };
POL.dateOf = dateOf;

// ---------------------------------------------------------------- tooltips (59-tooltips' engine)

UI.TIPS = UI.TIPS || {};
Object.assign(UI.TIPS, {
  poLegit(rid) {
    const r = realmOf(rid); if (!r) return D('No realm.');
    const parts = POL.legitParts(r), T = POL.legitTarget(r);
    return H('Legitimacy', Math.round(r.legit || 0)) + D(`Each New Year it moves a fifth of the way to its mark, ${T}. Shocks (a scandal, a lost war) move it at once and drift back.`) +
      parts.map(([l, v]) => R(esc(l), sg(v))).join('') + R('Mark', T, 'tt-sum');
  },
  poEst(v) {
    const [rid, k] = String(v || '').split('|'), r = realmOf(rid); if (!r || !POL.EST.includes(k)) return D('No estate.');
    const ES = POL.estState(r)[k], parts = POL.approvalParts(r, k);
    return H(esc(ES.name), sg(ES.ap)) + D(`Clout ${pct(ES.cl)} of the realm's weight. ${ES.ap >= 5 ? 'Loyal: it lends the crown legitimacy and joins no faction against it.' : ES.ap <= -5 ? 'Angry: its members swell the factions, and it may petition to repeal a law.' : 'Neither loyal nor angry (loyal at +5, angry at −5).'}`) +
      parts.map(([l, x]) => R(esc(l), sg(x))).join('') + R('Approval (−10 to +10)', sg(ES.ap), 'tt-sum');
  },
  poBill(rid) {
    const r = realmOf(rid), b = r && r.pol.bill; if (!b) return D('No bill.');
    const o = POL.billOdds(r), sd = POL.sides(r, b.k);
    return H(`The bill for ${esc((RI.PUSH[b.k] || {}).t || b.k)}`) + R('Support (S)', sd.S) + R('Opposition (O)', sd.O) + R('Balance m = (S − O) / (S + O)', o.m) +
      R('Pass at the next count', pct(o.pass)) + R('Advance', pct(o.adv)) + R('Stall', pct(o.stall)) + R('Debate', pct(o.deb)) +
      R('Chance it passes in the end', pct(o.eventual), 'tt-sum') +
      D(`Counts every 60 days, six at most. Three stalls and it fails. The court's odds when it was brought: ${pct(b.p0)}, times ${POL.legitF(r).toFixed(2)} for legitimacy.`);
  },
  poFac(fid) {
    const f = (A.S.factions || []).find(x => x.id === fid); if (!f) return D('Gone.');
    const pw = f.power != null ? f.power : A.factionPower(f);
    return H(esc(POL.facName(f)), pct(pw)) + D(`Rises when it holds 40% of the crown's swords and its discontent reaches 60. Discontent grows ${pw > .3 ? 12 : 4} a year at this strength${(A.realm(f.realm) || {}).stability > 70 ? ', less 6 while the realm is stable' : ''}.`) +
      R('Power', pct(pw)) + R('Discontent', Math.round(f.discontent || 0)) + R('Houses', f.members.length);
  },
  poSeek(oid) {
    const pc = A.pc(), x = pc ? POL.seekable(pc).find(s => s.o.id === oid) : null; if (!x) return D('Not open to you.');
    const r = POL.myRealm(pc), parts = POL.seekScore(r, x.o, pc, x.ap);
    return H(`${esc(POL.offName(x.o.k, r.id))} of ${esc((A.S.prov[x.o.at] || {}).name || '')}`, pct(x.p)) + D(esc(GD.POL_OFFICES[x.o.k].d)) +
      parts.map(([l, v]) => R(esc(l), sg(v))).join('') + R('Your weight', x.me, 'tt-sum') + R('The strongest rival', x.best) +
      D(`The odds are 50% plus a point for each 0.6 your weight beats the strongest rival's, between 5% and 90%. The holder counts 10 more.${x.price ? ` The crown sells this one: ${esc(A.coin(x.price))}.` : ''}`);
  },
  poVote(v) {
    const [rid, eid] = String(v || '').split('|'), r = realmOf(rid), e = A.P(eid), el = r && r.pol.elect; if (!r || !e || !el) return D('No election.');
    const C = el.cands.map(A.P).filter(live), pc = A.pc(), exact = POL.seeExact(pc, r);
    if (!exact) return H(esc(A.fullName(e, false))) + D('You cannot read this elector. A Spymaster watching the estates, or a sharp eye (insight 60), would tell you more.');
    return H(esc(A.fullName(e, false))) + C.map(c => R(esc(A.fullName(c, false)), Math.round(POL.score(r, e, c)))).join('') + D('Each elector votes for the highest score. A tie goes to the elder candidate.');
  },
  poOffice(v) {
    const [rid, oid] = String(v || '').split('|'), r = realmOf(rid), o = r && r.pol.off.find(x => x.id === oid); if (!o) return D('No office.');
    const p = A.P(o.pid), D0 = GD.POL_OFFICES[o.k];
    return H(`${esc(POL.offName(o.k, r.id))} of ${esc((A.S.prov[o.at] || {}).name || '')}`) + D(esc(D0.d)) + R('Pay a year', esc(A.coin(o.pay || 0))) + R('Held since', o.since || '—') +
      (o.term ? R('Term ends', o.term) : '') + R('Chosen by', esc({ crown: 'the crown', chancellor: 'the Chancellor', marshal: 'the Marshal', town: "the town's guildmasters", sold: 'sale, by the crown' }[D0.by])) +
      (p ? R('Estate', esc(POL.estName(POL.estateOf(p), r.id))) : '') + (o.k === 'gov' && o.g ? R('Keeps of the shire\'s tax', o.g + '%') : '');
  },
});
POL.seeExact = (pc, r) => !!(pc && r && (((r.pol.watch || {}).k === 'estates' && POL.inCouncil(pc, r)) || ((pc.st && pc.st.ins) || 0) >= 60 || pc.ruler === r.id));
POL.facName = f => (A.FARP_POWERS_NAME && A.FARP_POWERS_NAME(f)) || ((A.FACTIONS || {})[f.kind] || {}).name || 'faction';

// ---------------------------------------------------------------- the panels (pure)

const card = (id, title, body, extra) => `<section class="card po-card" id="po-${id}" aria-labelledby="po-${id}-h"><div class="po-head"><h4 id="po-${id}-h" class="po-h">${title}</h4>${extra || ''}</div>${body}</section>`;
const bar = (v, max, cls) => `<span class="po-bar${cls ? ' ' + cls : ''}" aria-hidden="true"><i style="width:${Math.max(0, Math.min(100, Math.round(100 * v / (max || 1))))}%"></i></span>`;

POL.crownCard = function (r) {
  const ru = A.P(r.ruler), T = POL.legitTarget(r), el = r.pol.elect, last = r.pol.vote;
  let next = '';
  if (r.gov === 'hereditary') { const h = A.P(r.heir); next = `Heir: ${h ? who(h) : '<span class="muted">none named</span>'}`; }
  else if (el) next = `An election is coming${el.due ? `, at the end of the term (${esc(el.due)})` : ', when the ruler dies'}: ${el.cands.length} candidates, ${el.electors.length} electors.`;
  else next = r.gov === 'council' ? `The council elects every ${POL.ELECT.term} years; the next in ${Math.max(0, POL.ELECT.term - (A.S.year - (r.pol.since || A.S.year)))}.` : 'Chosen by election when the ruler dies.';
  const body = `<div class="po-row"><span>${ru ? who(ru) : 'No ruler'}</span><span class="muted">${esc(POL.CAME[POL.cameOf(r)] ? POL.CAME[POL.cameOf(r)][0] : '')}</span></div>
<div class="po-row"><span>Legitimacy</span><span class="po-num">${tt('poLegit', r.id, `${Math.round(r.legit || 0)} <span class="muted">→ ${T}</span>`)}</span></div>
<div class="po-small">${next}</div>${last ? `<div class="po-small muted">Last vote, ${esc(last.y)}: ${esc(A.P(last.winner) ? A.fullName(A.P(last.winner), false) : '?')} chosen, ${Object.values(last.rounds[last.rounds.length - 1]).filter(x => x === last.winner).length} of ${last.electors.length}${last.rounds.length > 1 ? ' in a second round' : ''}.</div>` : ''}`;
  return card('crown', 'The crown', body);
};
POL.billCard = function (r, pc) {
  const b = r.pol.bill;
  if (!b) {
    const L = r.pol.last;
    let h = L ? `<div class="po-small">Last: the bill for ${esc((RI.PUSH[L.k] || {}).t || L.k)} ${L.yes ? '<span class="good">passed</span>' : '<span class="bad">failed</span>'} (${esc(L.y)}). <span class="po-track">${(L.log || []).map(x => `<b class="po-g po-g-${esc(x[1])}">${esc(POL.GLYPH[x[1]] || '?')}</b>`).join('')}</span></div>` : '<div class="po-small muted">No bill before the realm.</div>';
    if (POL.canPropose(pc, r)) {
      const opts = Object.keys(RI.PUSH).filter(k => RI.PUSH[k].law && RI.PUSH[k].ok(r));
      h += `<div class="po-small">Bring a bill (1 initiative):</div><div class="po-btns">${opts.map(k => `<button class="small" data-a="poPropose" data-v="${esc(k)}">${esc(RI.PUSH[k].t)}</button>`).join('')}</div>`;
    }
    return card('bill', 'The bill', h);
  }
  const o = POL.billOdds(r), sd = POL.sides(r, b.k), P = RI.PUSH[b.k] || { t: b.k };
  const notches = [];
  for (let i = 0; i < POL.BILL.checks; i++) { const x = b.log[i]; notches.push(x ? `<b class="po-g po-g-${esc(x[1])}" title="${esc(dateOf(x[0]))}">${esc(POL.GLYPH[x[1]])}</b>` : '<b class="po-g po-g-0">○</b>'); }
  const side = (list, cls) => list.filter(x => x.w > 0).map(x => `<div class="po-row po-small"><span>${esc(POL.estName(x.e, r.id))}</span><span class="po-num">${bar(x.w, Math.max(.01, sd.S + sd.O), cls)} ${tt('poEst', r.id + '|' + x.e, (x.w).toFixed(2))}</span></div>`).join('');
  const by = A.P(b.by);
  let h = `<div class="po-small">${by ? who(by) : 'The court'} brought it${b.src === 'estate' ? ', for ' + esc(POL.estName(b.est || 'comm', r.id)) : b.src === 'player' ? '' : ''}. Now ${esc(POL.posName(b.g, b.from))}; it would be ${esc(POL.posName(b.g, b.to))}.</div>
<div class="po-track" aria-label="The counts so far">${notches.join('')}<span class="po-small muted">Next count: ${esc(dateOf(b.next))}</span></div>
<div class="po-cols"><div><div class="po-cap">For</div>${side(sd.est.filter(x => x.g > 0), 'po-for') || '<div class="po-small muted">No estate</div>'}${(b.sup || []).map(A.P).filter(live).slice(0, 2).map(p => `<div class="po-small">${who(p)}</div>`).join('')}</div>
<div><div class="po-cap">Against</div>${side(sd.est.filter(x => x.g < 0), 'po-against') || '<div class="po-small muted">No estate</div>'}${(b.opp || []).map(A.P).filter(live).slice(0, 2).map(p => `<div class="po-small">${who(p)}</div>`).join('')}</div></div>
<div class="po-small">${tt('poBill', r.id, `pass ${pct(o.pass)} · advance ${pct(o.adv)} · stall ${pct(o.stall)} · debate ${pct(o.deb)}`)}</div>`;
  if (pc && pc.alive && (POL.canPropose(pc, r) || (RI.canSpeak && RI.canSpeak(pc, r)[0])) && b.spoke !== pc.id) h += `<div class="po-btns"><button class="small" data-a="poVoice" data-v="for">Speak for it (1⧗)</button><button class="small" data-a="poVoice" data-v="against">Speak against it (1⧗)</button></div>`;
  return card('bill', `The bill: ${esc(P.t)}`, h);
};
POL.councilCard = function (r, pc) {
  const rows = Object.keys(A.COUNCIL).map(seat => {
    const p = A.P((r.council || {})[seat]), t = r.pol.task[seat], ok = r.pol.taskOk ? r.pol.taskOk[seat] : null;
    let task = t ? esc(POL.TASKS[seat][t]) + (ok === true ? ' <span class="good">✓</span>' : ok === false ? ' <span class="muted">✗</span>' : '') : '<span class="muted">—</span>';
    if (pc && p && p.id === pc.id) task = `<span class="po-btns">${Object.keys(POL.TASKS[seat]).map(k => `<button class="small${t === k ? ' primary' : ''}" data-a="poTask" data-v="${esc(k)}" aria-pressed="${t === k}">${esc(POL.TASKS[seat][k])}</button>`).join('')}</span>`;
    return `<div class="po-row po-small"><span class="po-seat">${esc(A.COUNCIL[seat].name)}</span><span>${live(p) ? who(p) + ` <span class="muted">${esc(POL.EST_SHORT[POL.estateOf(p)])}</span>` : '<span class="muted">empty</span>'}</span><span class="po-task">${task}</span></div>`;
  }).join('');
  return card('council', 'The council', rows + '<div class="po-small muted">Each seat takes one task a year; the holder\'s skill decides whether it lands.</div>');
};
POL.estatesCard = function (r, pc) {
  const ES = POL.estState(r), mine = pc ? POL.pcEstate(pc) : null;
  const rows = POL.EST.map(k => { const e = ES[k]; return `<div class="po-row po-small${k === mine ? ' po-mine' : ''}"><span>${esc(e.name)}${k === mine ? ' <span class="muted">(yours)</span>' : ''}</span><span class="po-num">${bar(e.cl, .5)} ${tt('poEst', r.id + '|' + k, pct(e.cl))}</span><span class="po-num ${e.ap >= 5 ? 'good' : e.ap <= -5 ? 'bad' : ''}">${tt('poEst', r.id + '|' + k, sg(e.ap))}</span><span>${e.lead ? who(e.lead) : '<span class="muted">—</span>'}</span></div>`; }).join('');
  const laws = POL.GROUPS.map(g => { const i = POL.pos(r, g), c = POL.custom(r, g); return `<span class="po-chip${i !== c ? ' po-off' : ''}" title="${esc(GD.POL_LAWS[g].n + (i !== c ? ': custom is ' + POL.posName(g, c) : ': as custom has it'))}">${esc(GD.POL_LAWS[g].n)}: ${esc(POL.posName(g, i))}</span>`; }).join('');
  return card('estates', 'The estates', `<div class="po-row po-small po-cap"><span>Estate</span><span>Clout</span><span>Approval</span><span>Leader</span></div>${rows}<div class="po-cap" style="margin-top:8px">The laws</div><div class="po-chips">${laws}</div>`);
};
POL.factionsCard = function (r, pc) {
  const fs = A.factionsOf(r.id);
  if (!fs.length) return card('factions', 'Factions', '<div class="po-small muted">No faction stirs.</div>');
  const rows = fs.map(f => {
    const pw = f.power != null ? f.power : A.factionPower(f), F = (A.FACTIONS || {})[f.kind] || {}, rate = (pw > .3 ? 12 : 4) - ((r.stability || 0) > 70 ? 6 : 0);
    const left = Math.max(0, 60 - (f.discontent || 0)), months = rate > 0 ? Math.round(12 * left / rate) : null;
    const lead = A.S.houses[f.leader], head = lead && lead.headPid ? A.P(lead.headPid) : null;
    const mem = f.members.map(id => A.S.houses[id]).filter(Boolean).slice(0, 4).map(h => esc(h.name)).join(', ');
    const can = pc && !pc.ruler && pc.realm === r.id && pc.faction !== f.id;
    return `<div class="po-fac"><div class="po-row po-small"><b>${esc(POL.facName(f))}</b><span class="po-num">${tt('poFac', f.id, pct(pw))}</span></div>
<div class="po-meter" aria-label="${esc(pct(pw))} of the swords, against 40%"><i style="width:${Math.min(100, Math.round(pw * 100 / .6))}%"></i><s style="left:${Math.round(40 / .6)}%"></s></div>
<div class="po-small muted">${esc(pct(pw))} of the crown's swords; at 40% with discontent 60 they demand: ${esc(F.demand || '?')}. ${months == null ? 'Discontent does not grow.' : months === 0 ? 'Demands are due.' : `At this pace, demands in about ${months} month${months === 1 ? '' : 's'}.`}</div>
<div class="po-small">Led by ${head ? who(head) : esc(lead ? lead.name : '?')}${mem ? `; ${mem}` : ''}.${can ? ` <button class="small ghost" data-a="poJoin" data-v="${esc(f.id)}">Join (${POL.officesOf(pc).length ? 2 : 1}⧗)</button>` : ''}</div></div>`;
  }).join('');
  return card('factions', 'Factions', rows);
};
POL.officesCard = function (r) {
  const by = {};
  for (const o of r.pol.off) (by[o.at] = by[o.at] || []).push(o);
  const rows = Object.keys(by).map(at => `<div class="po-shire"><div class="po-cap">${esc((A.S.prov[at] || {}).name || 'A shire')}</div>${by[at].map(o => { const p = A.P(o.pid); return `<div class="po-row po-small"><span>${tt('poOffice', r.id + '|' + o.id, esc(POL.offName(o.k, r.id)))}</span><span>${live(p) ? who(p) : '<span class="muted">vacant</span>'}</span></div>`; }).join('')}</div>`).join('');
  return card('offices', `Offices (${r.pol.off.length})`, rows || '<div class="po-small muted">No offices yet: they are named at the New Year.</div>');
};
POL.electCard = function (r, pc) {
  const el = r.pol.elect; if (!el) return '';
  const C = el.cands.map(A.P).filter(live), E = el.electors.map(A.P).filter(live), exact = POL.seeExact(pc, r), cand = pc && el.cands.includes(pc.id), elector = pc && el.electors.includes(pc.id);
  const lean = e => { if (!exact) { const top = C.slice().sort((a, b) => POL.score(r, e, b) - POL.score(r, e, a))[0]; return top && POL.score(r, e, top) - Math.max(...C.filter(c => c !== top).map(c => POL.score(r, e, c)), -999) > 20 ? 'leans ' + esc(top.given) : 'unknown'; } const top = C.slice().sort((a, b) => POL.score(r, e, b) - POL.score(r, e, a))[0]; return top ? 'for ' + esc(A.fullName(top, false)) : '—'; };
  const rows = E.map(e => `<div class="po-row po-small"><span>${who(e)}</span><span>${tt('poVote', r.id + '|' + e.id, lean(e))}</span>${cand && e.id !== pc.id ? `<span class="po-btns"><button class="small ghost" data-a="poElect" data-v="visit|${esc(e.id)}">Visit</button><button class="small ghost" data-a="poElect" data-v="promise|${esc(e.id)}">Promise</button><button class="small ghost" data-a="poElect" data-v="gift|${esc(e.id)}">Gift</button></span>` : ''}</div>`).join('');
  const cands = C.map(c => `<div class="po-row po-small"><span>${who(c)}${c.id === (pc && pc.id) ? ' <span class="muted">(you)</span>' : ''}</span><span class="muted">renown ${Math.round(c.fame || 0)}</span>${cand && c.id !== pc.id ? `<span class="po-btns"><button class="small ghost" data-a="poElect" data-v="slander|${esc(c.id)}">Slander</button><button class="small ghost" data-a="poElect" data-v="withdraw|${esc(c.id)}">Stand aside for</button></span>` : ''}${elector && c.id !== pc.id ? `<button class="small${el.pcVote === c.id ? ' primary' : ''}" data-a="poElect" data-v="vote|${esc(c.id)}">Vote</button>` : ''}</div>`).join('');
  return card('elect', 'The election', `<div class="po-cap">Candidates</div>${cands}<div class="po-cap">Electors${exact ? '' : ' (leanings guessed)'}</div>${rows}${cand ? '<div class="po-small muted">Each visit, promise, gift or slander costs 1 initiative.</div>' : ''}`);
};
POL.placeCard = function (r, pc) {
  if (!pc || !pc.alive) return '';
  const mine = POL.pcEstate(pc), offs = POL.officesOf(pc), oath = POL.pcOath(pc);
  let h = `<div class="po-small">You stand with ${esc(POL.estName(mine, r.id))} of ${esc(r.short)}.</div>`;
  if (offs.length) h += `<div class="po-small">You hold: ${offs.map(([x, o]) => `${esc(POL.offName(o.k, x.id))} of ${esc((A.S.prov[o.at] || {}).name || '')} (${esc(A.coin(o.pay || 0))} a year)`).join('; ')}.</div>`;
  if (oath) h += `<div class="po-small">Your oath to the crown of ${esc(r.short)}: ${esc(['a twentieth', 'a tenth', 'three twentieths'][oath.c.tax])} of your rents, ${esc(oath.men)} men at the muster${oath.c.rights.length ? '; rights: ' + oath.c.rights.map(x => esc(POL.RIGHTS[x].toLowerCase())).join(', ') : ''}. You are owed protection and justice.</div>`;
  const pr = (pc.pol && pc.pol.promises || []).filter(x => !x.kept && !x.broken);
  if (pr.length) h += `<div class="po-small">Promises: ${pr.map(x => `${esc(A.P(x.to) ? A.fullName(A.P(x.to), false) : '?')}${x.due ? ' (due ' + esc(x.due) + ')' : ''}`).join(', ')}.</div>`;
  const S = POL.seekable(pc).filter(x => !x.bar.length).slice(0, 6);
  if (S.length) h += `<div class="po-cap">Offices you could seek (1⧗)</div>` + S.map(x => `<div class="po-row po-small"><span>${esc(POL.offName(x.o.k, r.id))} of ${esc((A.S.prov[x.o.at] || {}).name || '')}</span><span>${x.holder ? 'held by ' + who(x.holder) : '<span class="muted">vacant</span>'}</span><span class="po-num">${tt('poSeek', x.o.id, pct(x.p))}</span><button class="small" data-a="poSeek" data-v="${esc(x.o.id)}"${x.cool ? ' disabled aria-disabled="true" title="Asked this year"' : ''}>Seek${x.price ? ' (' + esc(A.coin(x.price)) + ')' : ''}</button></div>`).join('');
  return card('place', 'Your place', h);
};
POL.lordsCard = function (r, pc) {
  if (!pc || pc.ruler !== r.id) return '';
  const hs = A.realmHouses(r.id).filter(POL.landed).sort((a, b) => A.houseStrength(b) - A.houseStrength(a)).slice(0, 8);
  const lvl = ['Low', 'Medium', 'High'];
  const rows = hs.map(h => {
    const c = POL.contractOf(h, r), q = POL.oblCost(r, h, 'tax', 1, pc), ql = POL.oblCost(r, h, 'levy', 1, pc);
    const cost = q.ok ? (q.free ? 'free (a favour)' : q.tyr ? 'tyranny: −15, −3 the rest' : '') : q.why;
    const btn = (key, d, label, qq) => `<button class="small ghost" data-a="poOath" data-v="${esc(h.id + '|' + key + '|' + d)}"${qq && !qq.ok ? ' disabled aria-disabled="true"' : ''} title="${esc(d > 0 ? (qq && qq.ok ? (qq.free ? 'Free: spends the favour their head owes you' : 'Tyranny: −15 opinion with them, −3 with every landed house') : (qq ? qq.why : '')) : '+10 opinion with them')}">${label}</button>`;
    const free = Object.keys(POL.RIGHTS).filter(x => !c.rights.includes(x));
    return `<div class="po-row po-small"><span>${esc(h.name)} <span class="muted">${Math.round(h.op != null ? h.op : 50)}</span></span><span>tax ${esc(lvl[c.tax])} ${btn('tax', -1, '−')}${btn('tax', 1, '+', q)}</span><span>levy ${esc(lvl[c.levy])} ${btn('levy', -1, '−')}${btn('levy', 1, '+', ql)}</span>${free.length ? `<span>${btn('right', free[0], 'Grant: ' + esc(POL.RIGHTS[free[0]].toLowerCase()))}</span>` : ''}<span class="muted">${esc(cost)}</span></div>`;
  }).join('');
  return card('lords', 'The great lords and their oaths', rows || '<div class="po-small muted">No landed houses.</div>');
};
// the whole view; pure
UI.polityView = function (pc, r) {
  if (!r || !r.pol) return '<div class="po-wrap"><div class="po-small muted">The Polity sits at the next New Year.</div></div>';
  const bill = POL.billCard(r, pc);
  const parts = r.pol.bill ? [bill, POL.crownCard(r)] : [POL.crownCard(r), bill];
  parts.push(POL.fiefCard ? POL.fiefCard(r, pc) : '', POL.electCard(r, pc), POL.councilCard(r, pc), POL.estatesCard(r, pc), POL.factionsCard(r, pc), POL.lordsCard(r, pc), POL.officesCard(r), POL.placeCard(r, pc));
  return `<div class="po-wrap">${parts.filter(Boolean).join('')}</div>`;
};

// ---------------------------------------------------------------- the Realm tab

const realmTab = UI.TAB && UI.TAB.realm;
if (typeof realmTab === 'function') UI.TAB.realm = function (pc) {
  let h = realmTab.apply(this, arguments);
  try {
    if (!POL.on || !pc) return h;
    const mine = A.myRealm && A.myRealm();
    if (mine) {
      // a ruler: Politics is the first view of the realm
      h = h.replace(/(<button class="small ?[a-z]*" data-a="realmView" data-v="state">)/, `<button class="small ${UI.realmView === 'pol' ? 'primary' : ''}" data-a="realmView" data-v="pol">Politics</button>$1`);
      if (UI.realmView === 'pol') h += UI.polityView(pc, mine);
      return h;
    }
    const r = POL.myRealm(pc);
    if (r && r.pol && pc.alive) h += `<div class="po-sub"><button class="small${UI.poOpen ? ' primary' : ''}" data-a="poTab" aria-expanded="${UI.poOpen ? 'true' : 'false'}">${UI.poOpen ? 'Hide' : 'Show'} the politics of ${esc(r.short)}</button>${UI.poOpen ? UI.polityView(pc, r) : `<span class="po-small muted"> ${r.pol.bill ? 'A bill is before the realm. ' : ''}You stand with ${esc(POL.estName(POL.pcEstate(pc), r.id))}.</span>`}</div>`;
  } catch (e) { console.error('[po] view', e); }
  return h;
};
Object.assign(UI.A, { poTab() { UI.poOpen = !UI.poOpen; UI.refreshTab ? UI.refreshTab() : UI.refresh(); } });

// ---------------------------------------------------------------- 996's strip: the bill's next count, the election

const CU = UI.COMING;
if (CU && typeof CU.items === 'function') {
  const items = CU.items;
  CU.items = function (pc) {
    const out = items.apply(this, arguments);
    try {
      if (!POL.on || !pc || !pc.alive) return out;
      const r = POL.myRealm(pc);
      if (!r || !r.pol) return out;
      const add = [];
      if (r.pol.bill && (POL.canPropose(pc, r) || (RI.canSpeak && RI.canSpeak(pc, r)[0]))) add.push({ at: r.pol.bill.next, kind: 'promise', text: `The bill for ${(RI.PUSH[r.pol.bill.k] || {}).t || 'a law'} is counted`, icon: 'scroll' });
      if (r.pol.elect && (r.pol.elect.cands.includes(pc.id) || r.pol.elect.electors.includes(pc.id))) add.push({ at: r.pol.elect.due ? r.pol.elect.due * 365 : A.absDay() + 300, kind: 'promise', text: `The election in ${r.short}${r.pol.elect.due ? '' : ', when the throne falls empty'}`, icon: 'crown' });
      if (!add.length) return out;
      const all = out.concat(add.map(x => Object.assign(x, { when: CU.when(x.at) })));
      const fixed = all.filter(x => x.at === -1 || x.at === Infinity), dated = all.filter(x => x.at !== -1 && x.at !== Infinity).sort((a, b) => a.at - b.at);
      return fixed.filter(x => x.at === -1).concat(dated, fixed.filter(x => x.at === Infinity)).slice(0, CU.MAX);
    } catch (e) { return out; }
  };
}

// ---------------------------------------------------------------- the look (91-look's tokens, phone first)

const CSS = `.po-wrap{display:flex;flex-direction:column;gap:8px;margin-top:8px;min-width:0}
.po-card{padding:12px;border:1px solid var(--line);background:var(--surface);border-radius:var(--r-m,10px);min-width:0}
.po-head{display:flex;align-items:center;gap:8px;min-height:24px;margin-bottom:4px}
.po-h{margin:0;font-size:var(--t-cap,12px);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-2)}
.po-cap{font-size:var(--t-cap,12px);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);margin:6px 0 2px}
.po-row{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px;min-height:24px;border-bottom:1px solid var(--line);padding:2px 0}
.po-row:last-child{border-bottom:0}
.po-row>span{min-width:0;overflow-wrap:anywhere}
.po-small{font-size:var(--t-small,13px);line-height:var(--lh-small,1.38);color:var(--ink)}
.po-num{font-variant-numeric:tabular-nums;font-weight:700;white-space:nowrap}
.po-seat{min-width:88px;color:var(--ink-2)}
.po-task{margin-left:auto}
.po-mine{background:color-mix(in srgb,var(--accent) 8%,transparent)}
.po-bar{display:inline-block;width:48px;height:4px;border-radius:var(--r-xs,3px);background:var(--sunken);vertical-align:middle;overflow:hidden}
.po-bar i{display:block;height:100%;background:var(--ink-2)}
.po-bar.po-for i{background:var(--ok)}.po-bar.po-against i{background:var(--danger)}
.po-track{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:6px 0}
.po-g{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:var(--r-xs,3px);background:var(--sunken);color:var(--ink-2);font-weight:700}
.po-g-pass{color:var(--ok)}.po-g-stall{color:var(--danger)}.po-g-deb{color:var(--warn)}.po-g-adv{color:var(--info)}.po-g-0{color:var(--ink-3)}
.po-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}
.po-btns{display:inline-flex;flex-wrap:wrap;gap:4px}
.po-chips{display:flex;flex-wrap:wrap;gap:4px}
.po-chip{display:inline-block;font-size:var(--t-small,12px);padding:0 8px;line-height:22px;border-radius:var(--r-pill,999px);border:1px solid var(--line-strong);color:var(--ink-2)}
.po-chip.po-off{border-color:var(--warn);color:var(--warn)}
.po-meter{position:relative;height:6px;border-radius:var(--r-xs,3px);background:var(--sunken);margin:4px 0}
.po-meter i{display:block;height:100%;background:var(--warn);border-radius:var(--r-xs,3px)}
.po-meter s{position:absolute;top:-3px;width:2px;height:12px;background:var(--ink);text-decoration:none}
.po-fac{padding:4px 0;border-bottom:1px solid var(--line)}.po-fac:last-child{border-bottom:0}
.po-shire{margin-bottom:4px}
.po-sub{margin-top:10px}
@media (max-width:760px){.po-card{padding:12px}.po-row{gap:2px 8px}.po-seat{min-width:0}.po-task{margin-left:0;width:100%}.po-cols{grid-template-columns:1fr}}`;
const put = () => { if (typeof document === 'undefined' || document.getElementById('po-style')) return; const s = document.createElement('style'); s.id = 'po-style'; s.textContent = CSS; document.head.appendChild(s); };
if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }
