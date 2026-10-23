// Drill on screen: the battle's wing menus, the drill yard and the war room's battle orders say what each unit has
// drilled and what that opens. Rendering only reads: no random draws, no state change, every value through UI.esc.
(function () {
  const D = A.DRILL;
  if (!D) return;
  const esc = s => UI.esc(String(s));
  const pct = v => Math.round((v || 0) * 100);
  const tacName = k => (GD.BATTLE_TACTICS[k] || {}).name || k;
  const recOf = (B, side, w) => { const us = (B.sides[side] || {}).units || []; const u = us.find(x => x.wing === w && x.dl) || us.find(x => x.dl); return u ? u.dl : null; };

  // " · drilled 62" after a tactic's name in the wing menu (plain text; the caller escapes it)
  A.drillTag = function (B, side, w, k) {
    const fam = D.LINE[k], rec = fam && recOf(B, side, w);
    return rec ? ` · ${D.word(rec[fam] || 0)} ${pct(rec[fam])}` : '';
  };
  // under the menu: what this wing never drilled, so cannot use (escaped HTML)
  A.drillWingNote = function (B, side, w) {
    const rec = recOf(B, side, w);
    if (!rec) return '';
    const all = D.allTactics(B, side, w), fams = [...new Set(all.map(k => D.LINE[k]).filter(Boolean))];
    const locked = all.filter(k => D.LINE[k] && (rec[D.LINE[k]] || 0) < D.GATE);
    let h = fams.length ? `Drill: ${fams.map(f => `${D.NAME[f]} ${pct(rec[f])}`).join(' · ')}.` : '';
    if (locked.length) h += ` Never drilled, so not offered: ${locked.map(k => `${tacName(k)} (${D.NAME[D.LINE[k]]} ${pct(D.GATE)} needed)`).join(', ')}.`;
    return h ? `<div class="tiny muted drill-note">${esc(h)}</div>` : '';
  };

  // the line and war-map tactics each drill opens
  const LINE_BY = {}, MAP_BY = {};
  for (const [k, f] of Object.entries(D.LINE)) (LINE_BY[f] = LINE_BY[f] || []).push(k);
  for (const [k, f] of Object.entries(D.MAP)) (MAP_BY[f] = MAP_BY[f] || []).push(k);
  D.unlocks = function (rec) {
    return Object.keys(D.NAME).filter(f => LINE_BY[f] || MAP_BY[f]).map(f => {
      const v = rec[f] || 0;
      return { fam: f, v, word: D.word(v), open: v >= D.GATE, strength: Math.round(D.scale(v) * 100),
        line: (LINE_BY[f] || []).map(tacName), map: (MAP_BY[f] || []).map(k => (A.WTAC[k] || {}).n || k) };
    });
  };
  const unlockRows = rec => D.unlocks(rec).map(x =>
    `<div class="dr-unl ${x.open ? '' : 'muted'}"><b>${esc(GD.DRILLS[x.fam] ? GD.DRILLS[x.fam].short || GD.DRILLS[x.fam].name : x.fam)} ${pct(x.v)}</b> ` +
    `<span class="tiny">${esc(x.open ? `${x.word}, at ${x.strength}% of a drilled unit's effect` : `never drilled: needs ${pct(D.GATE)}`)}</span>` +
    `<div class="tiny ${x.open ? 'ink2' : 'muted'}">${esc([x.line.join(', '), x.map.length ? 'in the field: ' + x.map.join(', ') : ''].filter(Boolean).join('; '))}</div></div>`).join('');

  // the general's own army, its divisions' best two drills
  const armyRows = pc => {
    if (!pc.mil || pc.mil.rank < 7 || !pc.mil.army) return '';
    const a = A.army(pc.mil.army); if (!a || !a.divs || !a.divs.length) return '';
    const rows = a.divs.map(A.divById).filter(Boolean).slice(0, 12).map(d => {
      const r = D.of(d), top = Object.entries(r).filter(([k]) => D.NAME[k]).sort((x, y) => y[1] - x[1]).slice(0, 2);
      return `<div class="tiny">${esc(d.name)}: ${esc(top.map(([k, v]) => `${D.NAME[k]} ${pct(v)}`).join(', '))}</div>`;
    }).join('');
    const f = (pc.mil.drill || {}).focus;
    return `<div class="group-h">Your army's drill</div><div class="tiny muted">${esc(`In camp, the ${a.name} drills ${f && D.NAME[f] ? D.NAME[f] : 'what its colonels choose'}, as you set it here.`)}</div>${rows}`;
  };

  const card = UI.drillCard;
  if (typeof card === 'function' && !card.drill) {
    UI.drillCard = function (pc) {
      const h = card.apply(this, arguments);
      if (!h || !pc) return h;
      const rec = D.mine(pc); if (!rec) return h;
      const box = `<div class="drill-unlocks"><div class="group-h">What the drill opens</div><div class="tiny muted">${esc(`A formation your men have never drilled (under ${pct(D.GATE)}) is not offered in battle. Above that it grows with the drill.`)}</div>${unlockRows(rec)}${armyRows(pc)}</div>`;
      const i = h.lastIndexOf('</div>');
      return i < 0 ? h + box : h.slice(0, i) + box + h.slice(i);
    };
    UI.drillCard.drill = true;
  }

  // the war room's standing orders: which of them the player's own troops have not drilled
  D.pcSide = function (pc) {
    if (!pc) return null;
    if (pc.mil && !pc.mil.merc && pc.mil.rank >= 7 && pc.mil.army) { const a = A.army(pc.mil.army); if (a && a.divs && a.divs.length) return D.side(a.divs.map(A.divById).filter(Boolean)); }
    const m = pc.mil && !pc.mil.merc ? D.mine(pc) : null;
    if (m) return m;
    return pc.ruler ? D.realm(pc.ruler) : null;
  };
  const orders = UI.wrTacOrders;
  if (typeof orders === 'function' && !orders.drill) {
    UI.wrTacOrders = function (pc) {
      let h = orders.apply(this, arguments);
      if (!h || !pc) return h;
      const rec = D.pcSide(pc); if (!rec) return h;
      const locked = [];
      for (const [k, f] of Object.entries(D.MAP)) {
        if (!A.WTAC[k] || (rec[f] || 0) >= D.GATE) continue;
        locked.push(A.WTAC[k].n);
        h = h.split(`>${UI.esc(A.WTAC[k].n)}</option>`).join(`>${UI.esc(A.WTAC[k].n + ' (not drilled)')}</option>`);
      }
      if (locked.length) {
        const note = `<div class="tiny muted drill-note">${esc(`Your troops have never drilled ${locked.join(', ').toLowerCase()}; that order falls to the commanders' judgment.`)}</div>`;
        const i = h.lastIndexOf('</div>');
        h = h.slice(0, i) + note + h.slice(i);
      }
      return h;
    };
    UI.wrTacOrders.drill = true;
  }
})();
