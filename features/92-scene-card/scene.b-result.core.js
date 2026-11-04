// 92-scene-card, part 2: the result in place, with a chip for every number that changed (brief §5.9, §8 item 8:
// "players compare numbers by hand").
//
// When the player picks a choice (UI.A.evChoose, the button or keys 1 to 6), the player's numbers are read before the
// engine resolves it: the six stats as shown (A.stat), the six vitals, coin and the family purse, every skill as shown
// (A.skill), the regard of the person the scene is about, traits and wounds. The second reading is taken the first time
// the result is drawn, after anything the choice set going (a fight it started, a scene it queued first), so the chips
// say what the choice did in the end. Both readings only read; the pair lives in a WeakMap keyed by the queue item, never
// in A.S, so a save or a replay never sees it. A result drawn again shows the same chips.
(function () {
  const SC = UI.SCENE;
  const esc = s => UI.esc(String(s == null ? '' : s));
  const round = x => Math.round(+x || 0);
  SC.VITALS = [['health', 'Health', 'heart'], ['happy', 'Happiness', 'joy'], ['looks', 'Looks', 'mirror'], ['fame', 'Renown', 'laurel'],
    ['honor', 'Honour', 'shield'], ['piety', 'Piety', 'candle']];

  // one reading of the player, as the screen shows the numbers
  SC.snap = function (q) {
    const pc = A.pc && A.pc();
    if (!pc) return null;
    const o = { pc: pc.id, st: {}, v: {}, sk: {}, coin: +pc.coin || 0, fam: A.S && A.S.family && typeof A.S.family.wealth === 'number' ? A.S.family.wealth : null,
      traits: (pc.traits || []).slice(), wounds: (pc.wounds || []).map(w => w && w.k).filter(Boolean) };
    for (const s of GD.STATS) o.st[s] = A.stat(pc, s);
    for (const [k] of SC.VITALS) o.v[k] = round(pc[k]);
    for (const k of Object.keys(GD.SKILLS || {})) o.sk[k] = A.skill(pc, k);
    const pid = q && q.ctx && q.ctx.pid, t = pid && A.P ? A.P(pid) : null;
    if (t && t.id !== pc.id) o.them = { id: t.id, name: t.given || '', op: t.rel && t.rel[pc.id] ? round(t.rel[pc.id].op) : null, mine: pc.rel && pc.rel[t.id] ? round(pc.rel[t.id].op) : null };
    return o;
  };

  // the difference of two readings, in the order the chips are drawn: stats, vitals, purse, regard, skills, traits, wounds
  SC.diff = function (a, b) {
    if (!a || !b || a.pc !== b.pc) return [];
    const out = [];
    for (const s of GD.STATS) { const d = b.st[s] - a.st[s]; if (d) out.push({ k: 'st.' + s, d, label: SC.longName(s), st: s, icon: UI.ICON_STAT && UI.ICON_STAT[s] }); }
    for (const [k, label, icon] of SC.VITALS) { const d = b.v[k] - a.v[k]; if (d) out.push({ k: 'v.' + k, d, label, icon, vital: k }); }
    const dc = Math.round((b.coin - a.coin) * 10) / 10;
    if (dc) out.push({ k: 'coin', d: dc, label: 'suns', icon: 'sun-coin', coin: true });
    if (a.fam != null && b.fam != null) { const df = Math.round((b.fam - a.fam) * 10) / 10; if (df) out.push({ k: 'fam', d: df, label: 'the family purse', icon: 'pouch', coin: true }); }
    if (a.them && b.them && a.them.id === b.them.id) {
      if (a.them.op != null && b.them.op != null && b.them.op !== a.them.op) out.push({ k: 'them', d: b.them.op - a.them.op, label: `${b.them.name}'s regard`, icon: 'people' });
      else if (a.them.op == null && b.them.op != null && b.them.op) out.push({ k: 'them', d: b.them.op, label: `${b.them.name}'s regard`, icon: 'people' });
    }
    for (const k of Object.keys(b.sk)) { const d = b.sk[k] - (a.sk[k] || 0); if (d) out.push({ k: 'sk.' + k, d, label: SC.longName(k), skill: k }); }
    for (const t of b.traits) if (!a.traits.includes(t)) out.push({ k: 'tr.' + t, d: 1, label: (GD.TRAITS && GD.TRAITS[t] && GD.TRAITS[t].name) || t, trait: true });
    for (const t of a.traits) if (!b.traits.includes(t)) out.push({ k: 'tr.' + t, d: -1, label: (GD.TRAITS && GD.TRAITS[t] && GD.TRAITS[t].name) || t, trait: true });
    const wa = a.wounds.slice();
    for (const w of b.wounds) { const i = wa.indexOf(w); if (i >= 0) wa.splice(i, 1); else out.push({ k: 'wd.' + w, d: -1, label: (GD.WOUNDS && GD.WOUNDS[w] && GD.WOUNDS[w].name) || 'a wound', wound: true }); }
    return out;
  };

  // the pair of readings for a queue item: { before, after, list }
  SC.res = new WeakMap();
  SC.pending = null;
  SC.deltasOf = function (q) {
    let r = SC.res.get(q);
    if (r) return r.list;
    const p = SC.pending;
    if (!p || p.q !== q || !q.result) return null;
    const after = SC.snap(q);
    r = { before: p.before, after, list: SC.diff(p.before, after) };
    SC.res.set(q, r);
    SC.pending = null;
    return r.list;
  };

  const fmtCoin = d => (A.coin ? A.coin(Math.abs(d)) : Math.abs(d) + ' suns');
  SC.chipHtml = function (x) {
    const up = x.d > 0, cls = `sc-d ${up ? 'sc-up' : 'sc-down'}${x.st ? ' sc-d-st' : ''}`;
    // a sum of coin as the purse shows it ("23 suns", "1.5 suns", "6 pence"): the number, then its unit as the label
    const cs = x.coin ? String(fmtCoin(x.d)) : '', sp = cs.indexOf(' ');
    const num = x.coin ? `${up ? '+' : '−'}${sp > 0 ? cs.slice(0, sp) : cs}` : x.trait ? (up ? 'new' : 'lost') : x.wound ? 'new' : `${up ? '+' : '−'}${Math.abs(x.d)}`;
    const label = x.coin ? (sp > 0 ? cs.slice(sp + 1) : '') + (x.k === 'fam' ? ', family purse' : '') : x.trait ? `trait: ${x.label}` : x.wound ? `wound: ${x.label}` : x.label;
    const ic = x.icon ? SC.icon(x.icon) : '';
    return `<li class="${cls}"${x.st ? ` data-st="${esc(x.st)}"` : ''} data-k="${esc(x.k)}" data-d="${esc(x.d)}">` +
      `<span class="sc-dv"><span aria-hidden="true">${up ? '▲' : '▼'}</span> ${esc(num)}</span>${ic}${label ? `<span class="sc-dl">${esc(label)}</span>` : ''}</li>`;
  };
  SC.deltasHtml = function (q) {
    const list = SC.deltasOf(q);
    if (!list || !list.length) return '';
    return `<ul class="sc-deltas" aria-label="What changed">${list.map(SC.chipHtml).join('')}</ul>`;
  };

  // the choice: read the player first, and remember which row it was (for the "you chose" line)
  const choose = UI.A.evChoose;
  if (typeof choose === 'function') {
    UI.A.evChoose = function (v) {
      try {
        const q = A.S && A.S.queue && A.S.queue[0];
        if (q && q.type === 'event' && !q.result && !SC.off()) {
          const view = q.view || A.eventView(q), vi = +v, vc = view && view.choices ? view.choices[vi] : null;
          if (vc) {
            const pct = vc.odds != null ? vc.odds : vc.fight ? vc.fight.pct : null;
            SC.chosen.set(q, { vi, label: vc.t, odds: pct, band: pct != null ? SC.band(pct) : '' });
            SC.pending = { q, before: SC.snap(q) };
          }
        }
      } catch (err) { console.error('scene card snapshot', err); SC.pending = null; }
      return choose.apply(this, arguments);
    };
  }
})();
