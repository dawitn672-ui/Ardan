// Skills rebuild, step 11 (D-186): the player's view of the three kinds. On the skills screen and the profile (beside the
// ladders, which are passives of the older sense: always at work): the places in hand and what is readied in them, every
// art held with its kind, its rank and level, and its description in words on a click (data-note: what it does at its
// level, its cooldown, its cost, how long it lasts, what it needs; never a percentage); a button to ready one, to put it
// away, or to use a month's buff. In a fight: a bar of the readied arts, each a button that says whether it is ready.
// Rule 21: one column at 375 points, every control at least 44 points, Pointer Events only (data-a), no hover.
// Pure: reads the state and the engine, writes nothing; the actions are UI.A's.
(function () {
  const SK2 = A.SK2; if (!SK2 || !SK2.arts || typeof UI === 'undefined') return;
  const E = () => SK2.E(), IX = () => SK2.IX();
  const esc = s => UI.esc(String(s == null ? '' : s));
  const KIND = { active: 'Active', passive: 'Passive', buff: 'Buff' };
  const NUMW = ['', 'one', 'two', 'three', 'four', 'five'];
  const ON = { wounded: 'when you are under half your blood', near_death: 'at the very edge', first_strike: 'in the first exchange', duel_start: 'from the start of a fight',
    attacked_first: 'when he comes at you first', parried: 'after your guard turns his blade', win: 'after a blow of yours lands', lose: 'after one of his lands on you',
    dawn: 'at first and last light', night: 'in the dark or by torchlight', outnumbered: 'when it is outnumbered', foe_stronger: 'against anyone stronger', foe_wounded: 'once he is under half his blood' };
  const WEAPON = { sword: 'a sword', spear: 'a spear or an axe', axe: 'an axe', bow: 'a bow', shield: 'a shield', mounted: 'a horse under you', ranged: 'a bow, a sling or javelins at hand', unarmed: 'bare hands', melee: 'any weapon', lance: 'a lance' };
  const STATUSW = { stun: 'stunned', knock: 'off balance', bleed: 'bleeding', slow: 'slowed', disarm: 'with a weak grip', tire: 'winded' };
  const deg = (v, a, b) => (v <= a ? 'a little' : v <= b ? 'clearly' : 'greatly');
  // what an art does at a level, in words
  SK2.doWords = function (u) {
    const out = [], states = [];
    for (const d of u.do) {
      if (d.type === 'strike') out.push(`a blow worth ${E().shareWord(d.share)} of your fighting worth on an exchange you win`);
      else if (d.type === 'status') states.push(d.of === 'stun' || d.of === 'knock' ? `${STATUSW[d.of]} ${d.v >= 2 ? 'for two exchanges' : 'for an exchange'}` : `${STATUSW[d.of]}${d.of === 'bleed' ? (d.v >= 6 ? ' badly' : '') : ''}`);
      else if (d.type === 'heal') out.push(d.of === 'wounds' ? (d.v === 1 ? 'heals a wound' : `heals ${NUMW[d.v] || 'several'} wounds`) : d.of === 'illness' ? `takes ${E().shareWord(d.share)} off a sickness` : d.of === 'wind' ? `gives back ${E().shareWord(d.share)} of your wind` : `wins back ${E().shareWord(d.share)} of your blood`);
      else if (d.type === 'raise') out.push(`your ${((GD.STAT_NAMES && GD.STAT_NAMES[d.stat]) || d.stat).toLowerCase()} rises ${deg(d.v, 2, 5)}`);
      else if (d.type === 'guard') out.push(`takes ${E().shareWord(d.share)} off every blow`);
      else if (d.type === 'fight') out.push(`${deg(d.v, 2, 6) === 'a little' ? 'a small' : deg(d.v, 2, 6) === 'clearly' ? 'a clear' : 'a great'} edge in the exchange`);
    }
    if (states.length) out.push('leaves him ' + states.join(', '));
    return out.join('; ');
  };
  SK2.condWords = function (u) {
    const ws = [];
    for (const c of u.cond || []) if (c && c.weapon) ws.push([].concat(c.weapon).map(w => WEAPON[w] || w).join(' or '));
    return ws.length ? 'Needs ' + ws.join(' and ') + '.' : '';
  };
  // the whole description of an art at a level (data-note: plain words, no digits)
  SK2.artNote = function (s, lv) {
    const u = E().artUse(IX(), s, lv || 1); if (!u) return s.text;
    const L = [s.text];
    if (s.kind === 'passive') L.push(`Passive: by itself, ${ON[u.on] || 'when its moment comes'}${u.dur && /^(duel|battle)$/.test(u.dur.unit) ? ', for the whole fight' : ''}: ${SK2.doWords(u)}.${u.cd ? ' Once a fight.' : ''}`);
    else if (!SK2.inFight(s)) L.push(`Buff, used from here: ${SK2.doWords(u)}${u.dur ? ' ' + E().durWord(u.dur) : ''}. ${E().coolWord(u.cd)[0].toUpperCase() + E().coolWord(u.cd).slice(1)}; it takes ${E().costWord(u.cost)}.`);
    else L.push(`${KIND[s.kind]}, in a fight, with your ${(A.ACTIONS && A.ACTIONS[u.base] ? A.ACTIONS[u.base].name : u.base).toLowerCase()}${u.on ? ', ' + (ON[u.on] || '') : ''}: ${SK2.doWords(u)}${u.dur ? ', ' + E().durWord(u.dur) : ''}. ${E().coolWord(u.cd)[0].toUpperCase() + E().coolWord(u.cd).slice(1)}; it costs ${E().costWord(u.cost)}.`);
    const cw = SK2.condWords(u); if (cw) L.push(cw);
    return L.join('\n');
  };
  const chip = k => `<span class="art-k art-${k}">${KIND[k]}</span>`;
  const row = (s, lv, right) => `<div class="art-row"><div class="art-t">${chip(s.kind)}<span class="art-n" data-note="${esc(SK2.artNote(s, lv))}">${esc(s.name)}</span><span class="art-l">${esc(`${s.rank} · Lv ${lv}`)}</span></div>${right ? `<div class="art-b">${right}</div>` : ''}</div>`;

  UI.artsBlock = function (p) {
    if (!p) return '';
    const pc = A.pc && A.pc(), mine = !!(pc && p.id === pc.id);
    const held = SK2.artsHeld(p);
    let h = '<div class="arts">';
    h += `<div class="group-h">Arts</div><div class="tiny muted">The skills above are passives: always at work. Arts are actives you use in a fight, passives that fire when their moment comes, and buffs that heal or raise.</div>`;
    if (!held.length) return h + `<div class="tiny muted">${mine ? 'No art yet. They come with practice, a teacher, a hard fight or growth.' : 'No art known.'}</div></div>`;
    const by = held.map(x => ({ s: IX().BY[x.id], lv: x.lv })).filter(x => x.s);
    if (!mine) return h + by.map(x => row(x.s, x.lv, '')).join('') + '</div>';
    const n = SK2.slotsOf(p), R = SK2.readiedOf(p), now = SK2.absMonth();
    h += `<div class="art-h">In hand: ${R.length === 0 ? 'nothing' : NUMW[R.length] || R.length} of ${NUMW[n] || n} ${n === 1 ? 'place' : 'places'}</div>`;
    for (const x of R) {
      const it = by.find(y => y.s.id === x.id); if (!it) continue;
      h += row(it.s, it.lv, `${x.m >= now ? '<span class="tiny muted">in hand from next month</span>' : ''}<button class="small" data-a="artUnready" data-v="${esc(x.id)}">Put away</button>`);
    }
    const rest = by.filter(x => !R.some(y => y.id === x.s.id));
    const order = { active: 0, buff: 1, passive: 2 };
    rest.sort((a, b) => order[a.s.kind] - order[b.s.kind] || E().rankIx(b.s.rank) - E().rankIx(a.s.rank) || (a.s.name < b.s.name ? -1 : 1));
    if (rest.length) h += '<div class="art-h">Known</div>';
    for (const x of rest) {
      let right = '';
      if (x.s.kind === 'passive') right = '<span class="tiny muted">always ready</span>';
      else if (!SK2.inFight(x.s)) { const r = SK2.outsideReady(p, x.s.id); right = r.ok ? `<button class="small" data-a="artUse" data-v="${esc(x.s.id)}">Use</button>` : `<span class="tiny muted">${esc(r.why)}</span>`; }
      else right = R.length < n ? `<button class="small" data-a="artReady" data-v="${esc(x.s.id)}">Ready</button>` : '<span class="tiny muted">no place free</span>';
      h += row(x.s, x.lv, right);
    }
    return h + '</div>';
  };

  // ---- in a fight: the readied arts --------------------------------------------------------------------------------------
  UI.duelArtsBar = function (D) {
    const f = D && D.a, k = f && f.k2;
    if (!k || D.over) return '';
    let h = '';
    if (k.arts.length) h += k.arts.map(u => {
      const ok = SK2.duelReady(D, f, u), s = IX().BY[u.id];
      const why = ok ? 'ready' : k.used[u.id] && !(k.next[u.id] > D.round) ? 'spent' : u.on && D.round >= 1 ? 'past its moment' : 'not yet';
      return `<button class="techbtn artbtn" data-a="duel" data-v="k:${esc(u.id)}" ${ok ? '' : 'disabled'} data-note="${esc(SK2.artNote(s, u.lv))}">✧ ${esc(u.name)}<small>${esc((A.ACTIONS[u.base] ? A.ACTIONS[u.base].name.split(' ')[0] : u.base))} · ${esc(why)}</small></button>`;
    }).join('');
    const on = [...new Set([...(k.firing || []), ...k.inForce.map(x => x.id)])].map(id => (IX().BY[id] || {}).name).filter(Boolean);
    if (on.length) h += `<div class="tiny muted">At work: ${esc(on.join(', '))}</div>`;
    return h ? `<div class="techbar artbar"><div class="tiny muted">Arts in hand</div>${h}</div>` : '';
  };

  Object.assign(UI.A, {
    artReady(v) { const r = SK2.readyArt(A.pc(), v); if (r && r.msg) UI.toast(r.msg); UI.renderModal(); },
    artUnready(v) { SK2.unready(A.pc(), v); UI.renderModal(); },
    artUse(v) { const r = SK2.useOutside(A.pc(), v); if (r && r.msg) UI.toast(r.msg); UI.renderModal(); UI.refresh(); },
  });

  const css = `
  .arts{display:flex;flex-direction:column;gap:4px;margin-top:8px}
  .art-h{font-family:var(--fh,inherit);letter-spacing:.03em;margin-top:6px}
  .art-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:4px 8px;min-height:44px;padding:4px 6px;border-radius:6px}
  .art-t{display:flex;align-items:center;gap:8px;min-width:0;flex:1 1 12em}
  .art-n{font-size:16px;overflow:hidden;text-overflow:ellipsis;min-height:44px;display:inline-flex;align-items:center}
  .art-l{white-space:nowrap;opacity:.8;font-size:14px}
  .art-k{font-size:12px;letter-spacing:.04em;padding:1px 6px;border-radius:9px;border:1px solid var(--line,rgba(127,127,127,.35));white-space:nowrap}
  .art-active{color:var(--gold,#c9a24a)}.art-buff{color:var(--good,#7fb069)}.art-passive{opacity:.8}
  .art-b{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end}
  .art-b button{min-height:44px;min-width:44px}
  .artbar .artbtn{min-height:44px}
  .pf-arts{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:4px}.pf-arts button{min-height:44px;min-width:44px}
  `;
  if (typeof document !== 'undefined' && !document.getElementById('arts-style')) { const st = document.createElement('style'); st.id = 'arts-style'; st.textContent = css; (document.head || document.documentElement).appendChild(st); }
})();
