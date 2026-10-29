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
  poPropOdds(v) {
    const [rid, k] = String(v || '').split('|'), r = realmOf(rid); if (!r || !RI.PUSH[k]) return D('No such law.');
    const B = POL.billTarget(r, k), e = POL.billEffect(r, k);
    return H(`A bill for ${esc(RI.PUSH[k].t)}`, pct(B.P)) + (e ? D(effLine(e)) : '') + R("The court's odds for it (56)", pct(B.p0)) + R(`Legitimacy ${Math.round(r.legit || 0)}`, '×' + POL.legitF(r).toFixed(2)) +
      R('Chance it passes within a year', pct(B.P), 'tt-sum') + R('Balance m (support against opposition)', B.m) + D('It is counted six times, every 60 days: three stalls and it fails.');
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

// a folding section: its header is one button (aria-expanded), with a one-line summary that informs while closed. What
// the player opens or closes is remembered in the browser through 90-fold's store, never in the save.
const FOLDK = 'realm';
const isOpen = (key, dflt) => { try { const F = UI.FOLD; if (F && F.isOpen) return F.isOpen(FOLDK, 'po-' + key, dflt); } catch (e) {} return UI.poFold && key in UI.poFold ? UI.poFold[key] : dflt; };
POL.OPEN = { crown: true, bill: true, elect: true, fief: true, council: false, estates: false, laws: false, factions: false, lords: false, offices: false, place: true, props: false };
const card = (id, title, body, extra, sum) => {
  const pc = A.pc(), open = isOpen(id, id === 'place' && pc && pc.ruler ? false : POL.OPEN[id] !== false);
  return `<section class="po-card${open ? ' po-open' : ''}" id="po-${esc(id)}"><button class="po-head" data-a="poFold" data-v="${esc(id)}" aria-expanded="${open}" aria-controls="po-${esc(id)}-b"><span class="po-chev" aria-hidden="true">▸</span><span class="po-h">${title}</span>${sum ? `<span class="po-sum">${sum}</span>` : ''}</button>${extra ? `<div class="po-extra">${extra}</div>` : ''}<div class="po-body" id="po-${esc(id)}-b"${open ? '' : ' hidden'}>${body}</div></section>`;
};
POL.card = (...a) => card(...a);
const bar = (v, max, cls) => `<span class="po-bar${cls ? ' ' + cls : ''}" aria-hidden="true"><i style="width:${Math.max(0, Math.min(100, Math.round(100 * v / (max || 1))))}%"></i></span>`;
const bust = (p, n) => { try { if (!p) return ''; const s = UI.ANIME && UI.set && UI.set.anime !== false ? UI.ANIME.svg(p, n, { bust: true }) : UI.portrait ? UI.portrait(p, n) : ''; return s ? `<span class="po-bust" style="width:${n}px;height:${n}px">${s}</span>` : ''; } catch (e) { return ''; } };
const ring = (v, n = 40) => { const c = 2 * Math.PI * 16, d = Math.max(0, Math.min(1, v)) * c; return `<svg class="po-ring" viewBox="0 0 40 40" width="${n}" height="${n}" aria-hidden="true"><circle cx="20" cy="20" r="16" class="po-ring-t"/><circle cx="20" cy="20" r="16" class="po-ring-v" stroke-dasharray="${d.toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 20 20)"/></svg>`; };
const band = ap => ap >= 5 ? 'po-good' : ap <= -5 ? 'po-bad' : ap <= -2 ? 'po-warn' : '';

// what a law push would do, in words: the change, what the engine does with it, who gains and who loses; pure
const LAW_FX = {
  tax: i => `the crown takes ${Math.round(((RI.TAXES || [])[i] || 1) * 100)}% of its customary dues`,
  auth: i => `${['the great houses keep their governors', 'the crown names some governors', 'the crown names the governors', 'the crown names every office'][i]}; houses drift ${(A.AUTH && A.AUTH[i] ? A.AUTH[i][2] / 4 : 0) >= 0 ? 'warmer' : 'colder'}`,
  levy: i => `the muster calls ×${A.LEVY && A.LEVY[i] ? A.LEVY[i][1] : 1}`,
  obl: i => `new oaths owe ${['a twentieth', 'a tenth', 'three twentieths'][i]} of rents and ×${POL.OBL_LEVY[i]} the men`,
  just: i => `${['the lords judge their own people', 'the crown\'s magistrates sit in every shire', 'magistrates must be lettered'][i]}`,
  comm: i => `${['the lords\' rents rise a tenth; the commons count for less', 'rents as they are', 'the commons count for half again; rents fall a twentieth'][i]}`,
  trade: i => `${['the guilds set craft prices', 'the treasury takes a share of trade; the guilds hate it', 'caravans run freer; prices fall'][i]}`,
  faith: i => `${['the clergy weigh more', 'other faiths are suffered; the clergy weigh less', 'the clergy weigh half again'][i]}`,
};
POL.billEffect = function (r, k) {
  const x = POL.keyOf(r, k); if (!x) return null;
  const L = GD.POL_LAWS[x.g], from = POL.pos(r, x.g), gain = POL.EST.filter(e => POL.estGain(r, k, e) > 0).map(e => POL.EST_SHORT[e]), lose = POL.EST.filter(e => POL.estGain(r, k, e) < 0).map(e => POL.EST_SHORT[e]);
  return { law: L.n, from: L.pos[from], to: L.pos[x.to], what: LAW_FX[x.g] ? LAW_FX[x.g](x.to) : '', gain, lose };
};
const effLine = e => e ? `${esc(e.law)}: ${esc(e.from)} → <b>${esc(e.to)}</b>. ${esc(e.what.charAt(0).toUpperCase() + e.what.slice(1))}.${e.gain.length ? ` <span class="po-for-t">For: ${esc(e.gain.join(', '))}</span>` : ''}${e.lose.length ? ` <span class="po-against-t">Against: ${esc(e.lose.join(', '))}</span>` : ''}` : '';

POL.crownCard = function (r) {
  const ru = A.P(r.ruler), T = POL.legitTarget(r), el = r.pol.elect, last = r.pol.vote;
  let next = '';
  if (r.gov === 'hereditary') { const h = A.P(r.heir); next = `Heir: ${h ? who(h) : '<span class="muted">none named</span>'}`; }
  else if (el) next = `An election is coming${el.due ? `, at the end of the term (${esc(el.due)})` : ', when the ruler dies'}: ${el.cands.length} candidates, ${el.electors.length} electors.`;
  else next = r.gov === 'council' ? `The council elects every ${POL.ELECT.term} years; the next in ${Math.max(0, POL.ELECT.term - (A.S.year - (r.pol.since || A.S.year)))}.` : 'Chosen by election when the ruler dies.';
  const L = Math.round(r.legit || 0);
  const body = `<div class="po-crown">${bust(ru, 48)}<div class="po-crown-t"><div class="po-name">${ru ? who(ru) : 'No ruler'}</div><div class="po-small muted">${esc(POL.CAME[POL.cameOf(r)] ? POL.CAME[POL.cameOf(r)][0] : '')}</div><div class="po-small">${next}</div></div>
<div class="po-legit">${tt('poLegit', r.id, `<span class="po-legit-n ${L < 45 ? 'po-bad' : L < 60 ? 'po-warn' : ''}">${L}</span>`)}<span class="po-cap">Legitimacy → ${T}</span>${bar(L, 100, L < 45 ? 'po-against' : '')}</div></div>
${last ? `<div class="po-small muted">Last vote, ${esc(last.y)}: ${esc(A.P(last.winner) ? A.fullName(A.P(last.winner), false) : '?')} chosen, ${Object.values(last.rounds[last.rounds.length - 1]).filter(x => x === last.winner).length} of ${last.electors.length}${last.rounds.length > 1 ? ' in a second round' : ''}.</div>` : ''}`;
  return card('crown', 'The crown', body, '', `Legitimacy ${L}, mark ${T}`);
};
POL.billCard = function (r, pc) {
  const b = r.pol.bill;
  if (!b) {
    const Lst = r.pol.last;
    let h = Lst ? `<div class="po-small">Last: the bill for ${esc((RI.PUSH[Lst.k] || {}).t || Lst.k)} ${Lst.yes ? '<span class="good">passed</span>' : '<span class="bad">failed</span>'} (${esc(Lst.y)}).</div>` : '<div class="po-small muted">No bill before the realm.</div>';
    let n = 0;
    if (POL.canPropose(pc, r)) {
      const T = RI.tally(r), opts = Object.keys(RI.PUSH).filter(k => RI.PUSH[k].law && RI.PUSH[k].ok(r));
      n = opts.length;
      const open = isOpen('props', false);
      h += `<button class="po-subhead" data-a="poFold" data-v="props" aria-expanded="${open}"><span class="po-chev" aria-hidden="true">${open ? '▾' : '▸'}</span> Bring a bill (1⧗): ${opts.length} laws you could change, each with what it does and its chance to pass</button><div class="po-props"${open ? '' : ' hidden'}>${opts.map(k => { const B = POL.billTarget(r, k, T), e = POL.billEffect(r, k); return `<div class="po-prop"><div class="po-small">${effLine(e)}</div><span class="po-num">${tt('poPropOdds', r.id + '|' + k, Math.round(B.P * 100) + '%')}</span><button class="small" data-a="poPropose" data-v="${esc(k)}">Bring it</button></div>`; }).join('')}</div>`;
    }
    return card('bill', 'The bill', h, '', n ? `none before the realm · ${n} you could bring (1⧗)` : 'none before the realm');
  }
  const o = POL.billOdds(r), sd = POL.sides(r, b.k), P = RI.PUSH[b.k] || { t: b.k }, e = POL.billEffect(r, b.k);
  const nodes = [];
  for (let i = 0; i < POL.BILL.checks; i++) { const x = b.log[i]; nodes.push(x ? `<b class="po-node po-g-${esc(x[1])}" title="${esc(dateOf(x[0]))}">${esc(POL.GLYPH[x[1]])}</b>` : `<b class="po-node${i === b.log.length ? ' po-now' : ''}">${i + 1}</b>`); }
  const tot = Math.max(.01, sd.S + sd.O);
  const seg = (list, cls) => list.filter(x => x.w > 0).map(x => `<span class="${cls}" style="width:${Math.round(100 * x.w / tot)}%" title="${esc(POL.estName(x.e, r.id) + ' ' + x.w.toFixed(2))}">${esc(POL.EST_SHORT[x.e])}</span>`).join('');
  const court = Math.max(0, sd.t.sup || 0), courtO = Math.max(0, sd.t.opp || 0);
  const odds = [['pass', o.pass, 'po-o-pass'], ['advance', o.adv, 'po-o-adv'], ['stall', o.stall, 'po-o-stall'], ['debate', o.deb, 'po-o-deb']];
  const by = A.P(b.by);
  let h = `<div class="po-small">${effLine(e)}</div><div class="po-small muted">${by ? who(by) : 'The court'} brought it${b.src === 'estate' ? ', for ' + esc(POL.estName(b.est || 'comm', r.id)) : ''}. Next count: ${esc(dateOf(b.next))}.</div>
<div class="po-track" aria-label="The counts so far">${nodes.join('<i class="po-link"></i>')}</div>
<div class="po-cap">For and against</div><div class="po-stack" aria-label="Support against opposition">${seg(sd.est.filter(x => x.g > 0), 'po-s-for')}${court ? `<span class="po-s-for po-s-court" style="width:${Math.round(100 * court / tot)}%" title="the court's voices">court</span>` : ''}${seg(sd.est.filter(x => x.g < 0), 'po-s-against')}${courtO ? `<span class="po-s-against po-s-court" style="width:${Math.round(100 * courtO / tot)}%" title="the court's voices">court</span>` : ''}</div>
<div class="po-cap">The next count</div><div class="po-stack po-odds">${odds.map(([l, v, c]) => v > .005 ? `<span class="${c}" style="width:${Math.round(v * 100)}%">${v >= .12 ? esc(l) + ' ' : ''}${Math.round(v * 100)}%</span>` : '').join('')}</div>
<div class="po-small">${tt('poBill', r.id, `In the end it passes ${Math.round(o.eventual * 100)}% of the time`)}</div>`;
  if (pc && pc.alive && (POL.canPropose(pc, r) || (RI.canSpeak && RI.canSpeak(pc, r)[0])) && b.spoke !== pc.id) h += `<div class="po-btns"><button class="small" data-a="poVoice" data-v="for">Speak for it (1⧗)</button><button class="small" data-a="poVoice" data-v="against">Speak against it (1⧗)</button></div>`;
  return card('bill', `The bill: ${esc(P.t)}`, h, '', `count ${b.n + 1} of 6 on ${esc(dateOf(b.next))} · passes ${Math.round(o.eventual * 100)}% in the end`);
};
POL.councilCard = function (r, pc) {
  let set = 0;
  const cells = Object.keys(A.COUNCIL).map(seat => {
    const p = A.P((r.council || {})[seat]), t = r.pol.task[seat], ok = r.pol.taskOk ? r.pol.taskOk[seat] : null;
    if (t) set++;
    let task = t ? esc(POL.TASKS[seat][t]) + (ok === true ? ' <span class="good">✓</span>' : ok === false ? ' <span class="muted">✗</span>' : '') : '<span class="muted">no task</span>';
    if (pc && p && p.id === pc.id) task = `<span class="po-seg" role="group" aria-label="Your task">${Object.keys(POL.TASKS[seat]).map(k => `<button class="small${t === k ? ' primary' : ''}" data-a="poTask" data-v="${esc(k)}" aria-pressed="${t === k}">${esc(POL.TASKS[seat][k])}</button>`).join('')}</span>`;
    return `<div class="po-seat">${live(p) ? bust(p, 32) : '<span class="po-bust po-empty"></span>'}<div class="po-seat-t"><div class="po-cap">${esc(A.COUNCIL[seat].name)}</div><div class="po-small">${live(p) ? who(p) : '<span class="muted">empty</span>'}${live(p) ? ` <span class="muted">${esc(POL.EST_SHORT[POL.estateOf(p)])}</span>` : ''}</div><div class="po-small po-task">${task}</div></div></div>`;
  }).join('');
  return card('council', 'The council', `<div class="po-seats">${cells}</div>`, '', `${Object.keys(A.COUNCIL).length} seats, ${set} tasks set`);
};
POL.estatesCard = function (r, pc) {
  const ES = POL.estState(r), mine = pc ? POL.pcEstate(pc) : null;
  const tiles = POL.EST.map(k => { const e = ES[k]; return `<div class="po-est${k === mine ? ' po-mine' : ''}">${tt('poEst', r.id + '|' + k, `${ring(e.cl)}<span class="po-est-n ${band(e.ap)}">${sg(e.ap)}</span>`)}<div class="po-small po-est-name">${esc(e.name)}${k === mine ? ' <span class="muted">(yours)</span>' : ''}</div><div class="po-small muted">${Math.round(e.cl * 100)}% · ${e.lead ? esc(A.fullName(e.lead, false)) : '—'}</div></div>`; }).join('');
  const angry = POL.EST.filter(k => ES[k].angry).map(k => POL.EST_SHORT[k]), loyal = POL.EST.filter(k => ES[k].loyal).length;
  return card('estates', 'The estates', `<div class="po-ests">${tiles}</div><div class="po-small muted">The ring is clout; the number, approval from −10 to +10 (angry at −5, loyal at +5).</div>`, '', angry.length ? `angry: ${esc(angry.join(', '))}` : `${loyal} loyal, none angry`);
};
POL.lawsCard = function (r) {
  const off = POL.GROUPS.filter(g => POL.pos(r, g) !== POL.custom(r, g)).length;
  const cells = POL.GROUPS.map(g => { const i = POL.pos(r, g), c = POL.custom(r, g); return `<div class="po-law${i !== c ? ' po-off' : ''}" title="${esc(GD.POL_LAWS[g].n + (i !== c ? ': custom is ' + POL.posName(g, c) : ': as custom has it'))}"><span class="po-cap">${esc(GD.POL_LAWS[g].n)}</span><span class="po-small">${esc(POL.posName(g, i))}</span></div>`; }).join('');
  return card('laws', 'The laws', `<div class="po-laws">${cells}</div>`, '', off ? `${off} of 8 away from custom` : 'all as custom has them');
};
POL.factionsCard = function (r, pc) {
  const fs = A.factionsOf(r.id);
  if (!fs.length) return card('factions', 'Factions', '<div class="po-small muted">No faction stirs.</div>', '', 'none stirs');
  let top = null;
  const rows = fs.map(f => {
    const pw = f.power != null ? f.power : A.factionPower(f), F = (A.FACTIONS || {})[f.kind] || {}, rate = (pw > .3 ? 12 : 4) - ((r.stability || 0) > 70 ? 6 : 0);
    if (!top || pw > top[1]) top = [f, pw];
    const left = Math.max(0, 60 - (f.discontent || 0)), months = rate > 0 ? Math.round(12 * left / rate) : null;
    const lead = A.S.houses[f.leader], head = lead && lead.headPid ? A.P(lead.headPid) : null;
    const mem = f.members.map(id => A.S.houses[id]).filter(Boolean).slice(0, 4).map(h => esc(h.name)).join(', ');
    const can = pc && !pc.ruler && pc.realm === r.id && pc.faction !== f.id;
    return `<div class="po-fac"><div class="po-row po-small"><b>${esc(POL.facName(f))}</b><span class="po-num">${tt('poFac', f.id, pct(pw))}</span></div>
<div class="po-meter" aria-label="${esc(pct(pw))} of the swords, against 40%"><i style="width:${Math.min(100, Math.round(pw * 100 / .6))}%"></i><s style="left:${Math.round(40 / .6)}%"></s></div>
<div class="po-small muted">Demands ${esc(F.demand || '?')} at 40% and discontent 60. ${months == null ? 'Discontent does not grow.' : months === 0 ? 'Demands are due.' : `At this pace, in about ${months} month${months === 1 ? '' : 's'}.`}</div>
<div class="po-small">Led by ${head ? who(head) : esc(lead ? lead.name : '?')}${mem ? `; ${mem}` : ''}.${can ? ` <button class="small ghost" data-a="poJoin" data-v="${esc(f.id)}">Join (${POL.officesOf(pc).length ? 2 : 1}⧗)</button>` : ''}</div></div>`;
  }).join('');
  return card('factions', 'Factions', rows, '', `${fs.length}, ${esc(POL.facName(top[0]))} at ${Math.round(100 * top[1] / .4)}% of its demand`);
};
POL.officesCard = function (r) {
  const by = {};
  for (const o of r.pol.off) (by[o.at] = by[o.at] || []).push(o);
  const rows = Object.keys(by).map(at => `<div class="po-shire"><div class="po-cap">${esc((A.S.prov[at] || {}).name || 'A shire')}</div>${by[at].map(o => { const p = A.P(o.pid); return `<div class="po-row po-small"><span>${tt('poOffice', r.id + '|' + o.id, esc(POL.offName(o.k, r.id)))}</span><span>${live(p) ? who(p) : '<span class="muted">vacant</span>'}</span></div>`; }).join('')}</div>`).join('');
  const held = r.pol.off.filter(o => live(A.P(o.pid))).length;
  return card('offices', 'Offices', `<div class="po-shires">${rows || '<div class="po-small muted">No offices yet: they are named at the New Year.</div>'}</div>`, '', `${held} of ${r.pol.off.length} held, in ${Object.keys(by).length} shire${Object.keys(by).length === 1 ? '' : 's'}`);
};
POL.electCard = function (r, pc) {
  const el = r.pol.elect; if (!el) return '';
  const C = el.cands.map(A.P).filter(live), E = el.electors.map(A.P).filter(live), exact = POL.seeExact(pc, r), cand = pc && el.cands.includes(pc.id), elector = pc && el.electors.includes(pc.id);
  const lean = e => { const top = C.slice().sort((a, b) => POL.score(r, e, b) - POL.score(r, e, a))[0]; if (!top) return '—'; if (exact) return 'for ' + esc(A.fullName(top, false)); return POL.score(r, e, top) - Math.max(...C.filter(c => c !== top).map(c => POL.score(r, e, c)), -999) > 20 ? 'leans ' + esc(top.given) : 'unknown'; };
  const rows = E.map(e => `<div class="po-row po-small"><span>${who(e)}</span><span>${tt('poVote', r.id + '|' + e.id, lean(e))}</span>${cand && e.id !== pc.id ? `<span class="po-btns"><button class="small ghost" data-a="poElect" data-v="visit|${esc(e.id)}">Visit</button><button class="small ghost" data-a="poElect" data-v="promise|${esc(e.id)}">Promise</button><button class="small ghost" data-a="poElect" data-v="gift|${esc(e.id)}">Gift</button></span>` : ''}</div>`).join('');
  const cands = C.map(c => `<div class="po-row po-small">${bust(c, 26)}<span>${who(c)}${c.id === (pc && pc.id) ? ' <span class="muted">(you)</span>' : ''}</span><span class="muted">renown ${Math.round(c.fame || 0)}</span>${cand && c.id !== pc.id ? `<span class="po-btns"><button class="small ghost" data-a="poElect" data-v="slander|${esc(c.id)}">Slander</button><button class="small ghost" data-a="poElect" data-v="withdraw|${esc(c.id)}">Stand aside for</button></span>` : ''}${elector && c.id !== pc.id ? `<button class="small${el.pcVote === c.id ? ' primary' : ''}" data-a="poElect" data-v="vote|${esc(c.id)}">Vote</button>` : ''}</div>`).join('');
  return card('elect', 'The election', `<div class="po-cap">Candidates</div>${cands}<div class="po-cap">Electors${exact ? '' : ' (leanings guessed)'}</div>${rows}${cand ? '<div class="po-small muted">Each visit, promise, gift or slander costs 1 initiative.</div>' : ''}`, '', `${C.length} candidates, ${E.length} electors`);
};
POL.placeCard = function (r, pc) {
  if (!pc || !pc.alive) return '';
  const mine = POL.pcEstate(pc), offs = POL.officesOf(pc), oath = POL.pcOath(pc);
  let h = `<div class="po-small">You stand with ${esc(POL.estName(mine, r.id))} of ${esc(r.short)}.</div>`;
  if (offs.length) h += `<div class="po-small">You hold: ${offs.map(([x, o]) => `${esc(POL.offName(o.k, x.id))} of ${esc((A.S.prov[o.at] || {}).name || '')} (${esc(A.coin(o.pay || 0))} a year)`).join('; ')}.</div>`;
  if (oath) h += `<div class="po-small">Your oath to the crown of ${esc(r.short)}: ${esc(['a twentieth', 'a tenth', 'three twentieths'][oath.c.tax])} of your rents, ${esc(oath.men)} men at the muster${oath.c.rights.length ? '; rights: ' + oath.c.rights.map(x => esc(POL.RIGHTS[x].toLowerCase())).join(', ') : ''}.</div>`;
  const pr = (pc.pol && pc.pol.promises || []).filter(x => !x.kept && !x.broken);
  if (pr.length) h += `<div class="po-small">Promises: ${pr.map(x => `${esc(A.P(x.to) ? A.fullName(A.P(x.to), false) : '?')}${x.due ? ' (due ' + esc(x.due) + ')' : ''}`).join(', ')}.</div>`;
  const all = POL.seekable(pc), S = all.filter(x => !x.bar.length).slice(0, 5), why = all.length && !S.length ? all[0].bar[0] : null;
  if (S.length) h += `<div class="po-cap">Offices you could seek (1⧗)</div>` + S.map(x => `<div class="po-row po-small"><span>${esc(POL.offName(x.o.k, r.id))} of ${esc((A.S.prov[x.o.at] || {}).name || '')}</span><span>${x.holder ? 'held by ' + who(x.holder) : '<span class="muted">vacant</span>'}</span><span class="po-num">${tt('poSeek', x.o.id, pct(x.p))}</span><button class="small" data-a="poSeek" data-v="${esc(x.o.id)}"${x.cool ? ' disabled aria-disabled="true" title="Asked this year"' : ''}>Seek${x.price ? ' (' + esc(A.coin(x.price)) + ')' : ''}</button></div>`).join('');
  else if (why) h += `<div class="po-small muted">No office is open to you: you must be ${esc(why)}.</div>`;
  return card('place', 'Your place', h, '', `${esc(POL.EST_SHORT[mine])}${offs.length ? ` · ${offs.length} office${offs.length === 1 ? '' : 's'}` : ''}`);
};
POL.lordsCard = function (r, pc) {
  if (!pc || pc.ruler !== r.id) return '';
  const hs = A.realmHouses(r.id).filter(POL.landed).sort((a, b) => A.houseStrength(b) - A.houseStrength(a)).slice(0, 8);
  const lvl = ['Low', 'Medium', 'High'];
  const seg = (h, key, cur) => `<span class="po-seg" role="group" aria-label="${esc(key === 'tax' ? 'Tax owed' : 'Men owed')}">${lvl.map((l, i) => { const d = i - cur, q = d === 1 ? POL.oblCost(r, h, key, 1, pc) : null, dis = Math.abs(d) > 1 || (q && !q.ok); const title = d === 0 ? 'Now' : d < 0 ? '+10 opinion with them' : q && q.ok ? (q.free ? 'Free: spends the favour their head owes you' : 'Tyranny: −15 with them, −3 with every landed house') : q ? q.why : 'One step at a time'; return `<button class="small${d === 0 ? ' primary' : ''}"${d === 0 || dis ? ' disabled aria-disabled="true"' : ` data-a="poOath" data-v="${esc(h.id + '|' + key + '|' + (d > 0 ? 1 : -1))}"`} aria-pressed="${d === 0}" title="${esc(title)}">${l}</button>`; }).join('')}</span>`;
  const rows = hs.map(h => {
    const c = POL.contractOf(h, r), head = h.headPid && A.P(h.headPid), free = Object.keys(POL.RIGHTS).filter(x => !c.rights.includes(x));
    return `<div class="po-lord">${bust(live(head) ? head : null, 26)}<div class="po-lord-t"><div class="po-small"><b>${esc(h.name)}</b> <span class="muted">loyalty ${Math.round(h.op != null ? h.op : 50)}</span></div><div class="po-small po-oath"><span class="po-cap">Tax</span>${seg(h, 'tax', c.tax)}<span class="po-cap">Men</span>${seg(h, 'levy', c.levy)}</div>${free.length ? `<div class="po-small"><button class="small ghost" data-a="poOath" data-v="${esc(h.id + '|right|' + free[0])}" title="+15 with them; −0.1 on the next authority bill">Grant a right: ${esc(POL.RIGHTS[free[0]].toLowerCase())}</button></div>` : ''}</div></div>`;
  }).join('');
  return card('lords', 'The great lords and their oaths', rows || '<div class="po-small muted">No landed houses.</div>', '', `${hs.length} houses`);
};
// the whole view; pure
UI.polityView = function (pc, r) {
  if (!r || !r.pol) return '<div class="po-wrap"><div class="po-small muted">The Polity sits at the next New Year.</div></div>';
  const bill = POL.billCard(r, pc);
  const parts = r.pol.bill ? [bill, POL.crownCard(r)] : [POL.crownCard(r), bill];
  parts.push(POL.fiefCard ? POL.fiefCard(r, pc) : '', POL.electCard(r, pc), POL.placeCard(r, pc), POL.councilCard(r, pc), POL.estatesCard(r, pc), POL.lawsCard(r), POL.factionsCard(r, pc), POL.lordsCard(r, pc), POL.officesCard(r));
  return `<div class="po-wrap">${parts.filter(Boolean).join('')}</div>`;
};
Object.assign(UI.A, {
  poFold(k) {
    const pc = A.pc(), F = UI.FOLD, key = 'po-' + k, open = isOpen(k, k === 'place' && pc && pc.ruler ? false : POL.OPEN[k] !== false);
    if (F && F.state) { F.state[FOLDK + '|' + key] = !open; F.save && F.save(); } else { UI.poFold = UI.poFold || {}; UI.poFold[k] = !open; }
    UI.refreshTab ? UI.refreshTab() : UI.refresh();
  },
});

// ---------------------------------------------------------------- the Realm tab

const realmTab = UI.TAB && UI.TAB.realm;
if (typeof realmTab === 'function') UI.TAB.realm = function (pc) {
  let h = realmTab.apply(this, arguments);
  try {
    if (!POL.on || !pc) return h;
    const mine = A.myRealm && A.myRealm();
    if (mine) {
      // a ruler: Politics is the first view of the realm, and it is politics alone (the realm's band, the switch, the view)
      h = h.replace(/(<button class="small ?[a-z]*" data-a="realmView" data-v="state">)/, `<button class="small ${UI.realmView === 'pol' ? 'primary' : ''}" data-a="realmView" data-v="pol">Politics</button>$1`);
      if (UI.realmView === 'pol') {
        const at = h.lastIndexOf('data-a="realmView"'), end = at >= 0 ? h.indexOf('</div>', at) : -1;
        if (end >= 0) h = h.slice(0, end + 6);
        h += UI.polityView(pc, mine);
      }
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

const CSS = `.po-wrap{display:flex;flex-direction:column;gap:6px;margin-top:8px;min-width:0;max-width:100%}
.po-wrap [hidden]{display:none!important}
.po-card{border:1px solid var(--line);background:var(--surface);border-radius:var(--r-m,10px);min-width:0;max-width:100%;box-sizing:border-box;overflow:hidden}
.po-head{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:8px;width:100%;min-height:36px;padding:6px 12px;cursor:pointer;min-width:0;max-width:100%;overflow:hidden}
.po-head:focus-visible{outline:2px solid var(--focus);outline-offset:-2px}
.po-chev{display:inline-block;color:var(--ink-3);transition:transform .16s;font-size:12px}.po-open .po-chev{transform:rotate(90deg)}
.po-h{font-size:var(--t-cap,12px);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-2);font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.po-sum{margin-left:auto;font-size:var(--t-small,13px);color:var(--ink-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.po-body{padding:0 12px 10px}.po-extra{padding:0 12px}
.po-cap{display:block;font-size:var(--t-cap,12px);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);margin:8px 0 3px}
.po-row{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;min-height:26px;border-bottom:1px solid var(--line);padding:2px 0}
.po-row:last-child{border-bottom:0}.po-row>span{min-width:0;overflow-wrap:anywhere}
.po-small{font-size:var(--t-small,13px);line-height:var(--lh-small,1.38);color:var(--ink)}
.po-num{font-variant-numeric:tabular-nums;font-weight:700;white-space:nowrap}
.po-good{color:var(--ok)}.po-bad{color:var(--danger)}.po-warn{color:var(--warn)}
.po-for-t{color:var(--info)}.po-against-t{color:var(--danger)}
.po-bust{display:inline-block;flex:none;border-radius:50%;overflow:hidden;background:var(--sunken);vertical-align:middle}.po-bust svg,.po-bust img{width:100%;height:100%;display:block}
.po-empty{width:32px;height:32px;border:1px dashed var(--line-strong)}
.po-bar{display:inline-block;width:64px;height:6px;border-radius:var(--r-xs,3px);background:var(--sunken);vertical-align:middle;overflow:hidden}
.po-bar i{display:block;height:100%;background:var(--accent)}.po-bar.po-against i{background:var(--danger)}
.po-crown{display:grid;grid-template-columns:48px 1fr auto;gap:10px;align-items:center}
.po-name{font-family:var(--f-name,inherit);font-size:var(--t-name,16px);font-weight:700}
.po-legit{display:flex;flex-direction:column;align-items:flex-end;gap:2px}.po-legit .po-cap{margin:0}
.po-legit-n{font-size:var(--t-num-lg,20px);font-weight:700;font-variant-numeric:tabular-nums}
.po-track{display:flex;align-items:center;gap:0;margin:8px 0}
.po-node{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;flex:none;border-radius:50%;border:1px solid var(--line-strong);background:var(--sunken);color:var(--ink-3);font-weight:700;font-size:12px}
.po-node.po-now{border:2px solid var(--accent);color:var(--accent)}
.po-link{flex:1 1 8px;height:2px;background:var(--line);min-width:6px}
.po-g-pass{color:var(--ok);border-color:var(--ok)}.po-g-stall{color:var(--danger);border-color:var(--danger)}.po-g-deb{color:var(--warn);border-color:var(--warn)}.po-g-adv{color:var(--info);border-color:var(--info)}
.po-stack{display:flex;height:22px;border-radius:var(--r-xs,3px);overflow:hidden;background:var(--sunken);font-size:11px;line-height:22px}
.po-stack>span{display:block;overflow:hidden;white-space:nowrap;text-overflow:clip;padding:0 4px;color:var(--bg)}
.po-s-for{background:var(--info)}.po-s-against{background:var(--danger)}.po-s-court{opacity:.7}
.po-o-pass{background:var(--ok)}.po-o-adv{background:var(--info)}.po-o-stall{background:var(--danger)}.po-o-deb{background:var(--warn)}
.po-subhead{all:unset;box-sizing:border-box;display:block;width:100%;cursor:pointer;margin:8px 0 4px;font-size:var(--t-small,13px);color:var(--accent)}.po-subhead:focus-visible{outline:2px solid var(--focus)}
.po-props{display:flex;flex-direction:column;gap:4px}.po-prop{display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center;border-bottom:1px solid var(--line);padding:3px 0}
.po-seats{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.po-seat{display:flex;gap:8px;align-items:flex-start;min-width:0}.po-seat-t{min-width:0}.po-seat .po-cap{margin:0}
.po-ests{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:6px}
.po-est{display:flex;flex-direction:column;align-items:center;text-align:center;padding:6px 2px;border-radius:var(--r-m,10px);background:var(--raised);min-width:0}
.po-est .tt{position:relative;display:inline-block;width:44px;height:44px}.po-est-n{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:700;font-variant-numeric:tabular-nums}
.po-est-name{overflow-wrap:anywhere}
.po-ring{display:block}.po-ring-t{fill:none;stroke:var(--sunken);stroke-width:4}.po-ring-v{fill:none;stroke:var(--accent);stroke-width:4;stroke-linecap:round}
.po-mine{outline:2px solid var(--accent);outline-offset:-2px}
.po-laws{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:4px}
.po-law{display:flex;flex-direction:column;padding:4px 8px;border:1px solid var(--line-strong);border-radius:var(--r-s,6px)}.po-law .po-cap{margin:0}
.po-law.po-off{border-color:var(--warn)}
.po-meter{position:relative;height:6px;border-radius:var(--r-xs,3px);background:var(--sunken);margin:4px 0}
.po-meter i{display:block;height:100%;background:var(--warn);border-radius:var(--r-xs,3px)}
.po-meter s{position:absolute;top:-3px;width:2px;height:12px;background:var(--ink);text-decoration:none}
.po-fac{padding:4px 0;border-bottom:1px solid var(--line)}.po-fac:last-child{border-bottom:0}
.po-lord{display:flex;gap:8px;align-items:flex-start;padding:4px 0;border-bottom:1px solid var(--line)}.po-lord:last-child{border-bottom:0}.po-lord-t{min-width:0}
.po-oath{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px}.po-oath .po-cap{margin:0}
.po-seg{display:inline-flex;border:1px solid var(--line-strong);border-radius:var(--r-s,6px);overflow:hidden;background:var(--sunken)}
.po-seg button{border:0;border-radius:0;min-width:44px;margin:0}.po-seg button[disabled]{opacity:.55}
.po-btns{display:inline-flex;flex-wrap:wrap;gap:4px}
.po-shires{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:4px 12px}
.po-sub{margin-top:10px}
@media (max-width:760px){.po-crown{grid-template-columns:40px 1fr}.po-legit{grid-column:1/-1;flex-direction:row;align-items:center;gap:8px}.po-prop{grid-template-columns:1fr auto}.po-prop button{grid-column:1/-1}.po-sum{display:none}}
@media (pointer:coarse){.po-head{min-height:44px}}`;
const put = () => { if (typeof document === 'undefined' || document.getElementById('po-style')) return; const s = document.createElement('style'); s.id = 'po-style'; s.textContent = CSS; document.head.appendChild(s); };
if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }

// 59's faction power tooltip: the Polity's parts (angry estates, a loyal nobility, a split election) get their own
// rows, so the rows add up to the power shown (ttSums2)
const TT = UI.TT, G = UI.TIPS;
if (TT && typeof TT.facParts === 'function') {
  const baseParts = TT.facParts;
  TT.facParts = function (f) {
    const S = baseParts.apply(this, arguments);
    try {
      const add = POL.facAdd(f);
      if (add.length) {
        const before = S.now, sum = add.reduce((a, x) => a + x[1], 0);
        S.pol = add; S.now = Math.max(0, before + sum);
        if (S.now !== before + sum) S.pol = add.concat([['No faction falls below nothing', S.now - before - sum]]);
      }
    } catch (e) {}
    return S;
  };
}
if (G && typeof G.facPower === 'function' && TT && TT.K) {
  const baseTip = G.facPower;
  G.facPower = function (id) {
    const f = (A.S.factions || []).find(x => x.id === id);
    const S = f ? TT.facParts(f) : null;
    if (!S || !S.pol || !S.pol.length) return baseTip.apply(this, arguments);
    const K = TT.K, F0 = A.FACTIONS[f.kind] || {}, sw = S.mem.reduce((a, x) => a + x[1], 0);
    const stale = f.power != null && Math.round(f.power * 100) !== Math.round(S.now * 100);
    const pts = [[`Its swords: ${esc(A.fmt(Math.round(sw)))} of the realm's ${esc(A.fmt(Math.round(S.all)))}`, sw / Math.max(1, S.all) * 100]];
    if (S.back) pts.push([`On the council, ${S.nb} lean${S.nb === 1 ? 's' : ''} its way${S.lead ? ', and its leader wants what it wants' : ''} (56-realm-inside, at most 15%)`, S.back * 100]);
    for (const [l, v] of S.pol) pts.push([esc(l), v * 100]);
    return K.H('Power', K.pct(S.total), esc(F0.name || '')) + K.D('Its houses\' swords, against all the realm\'s: every house, a quarter of the army and a twentieth of the levy; and what the estates make of the crown (9996-polity).') +
      `<div class="tip-row tt-sum"><span>Its swords</span><b></b></div>` + TT.sumRows(S.mem, sw, 'Swords', v => esc(A.fmt(v))) +
      `<div class="tip-row tt-sum"><span>${stale ? 'Today' : 'Its power'}</span><b></b></div>` + K.pts(pts, Math.round(S.now * 100), 'Power') +
      (stale ? K.D(`The card shows ${K.pct(f.power)}, reckoned at the new year; the realm's swords have moved since.`) : '') +
      K.F('At 40% and 60 discontent it makes its demand.');
  };
}
