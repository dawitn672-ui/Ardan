// Where the player sees a casus belli, a plan and a debt. Every function here only reads: no A.rand, no write to A.S.
//   UI.csWarLine(w)     the war room (patch CB-WAR-ROOM): "Why it began: ..." under the sides of each war
//   UI.csPlanText(r)    what a crown is preparing, in words: "Varenna nurses a grudge against Aldmark ..."
//   UI.diplCard         (wrapper) the diplomacy card of a realm: its wars and why, its plan, what it owes and is owed
//   UI.TAB.realm        (wrapper) the Realm tab: "Why wars begin", for the player's realm and the realms around it
(function () {
  const CS = A.CASUS, FE = A.BONDS && A.BONDS.FEUD;
  if (!CS) return;
  const esc = s => UI.esc(s == null ? '' : String(s));
  const short = id => (A.realm(id) ? A.realmShort(id) : String(id || ''));

  UI.csWarLine = function (w) {
    try {
      const c = w && w.casus;
      if (!c || !c.t) return '';
      return `<div class="tiny cs-why" style="margin-top:2px"><span class="muted">Why it began (${esc(short(w.leadA))}, ${esc(c.y)}):</span> ${esc(c.t)}</div>`;
    } catch (e) { return ''; }
  };
  UI.csPlanText = function (r) {
    const pl = r && r.csPlan;
    if (!pl || !A.realm(pl.t)) return '';
    const t = short(pl.t), me = short(r.id);
    let why = '';
    if (pl.k === 'feud' && FE) { const e = FE.top(r.id, pl.t, -1); why = e ? `nurses a grudge against ${t}: ${FE.origin(e)}` : `nurses a grudge against ${t}`; }
    else { const W = CS.wantOf(r.id, pl.t); why = `wants ${W ? W.s.replace(/^to /, 'to ') : 'something of ' + t}`; }
    const busy = A.atWar(pl.t).length ? `${t} is at war elsewhere, and the moment may have come` : `it waits for ${t} to be at war elsewhere, worn out or weaker`;
    return `${me} ${why}. Since ${pl.y} it has kept more gold and sought friends against ${t}; ${busy}.`;
  };
  const debtsOf = rid => {
    if (!FE) return [];
    const out = [];
    for (const o of Object.keys(A.S.realms || {})) {
      if (o === rid || !A.S.realms[o].alive) continue;
      for (const e of FE.list(rid, o)) if (e.w >= 2) out.push([o, e]);
    }
    return out.sort((x, y) => y[1].w - x[1].w);
  };
  // the block for one realm o, as seen by realm r (the player's)
  UI.csRealmBlock = function (o, r) {
    const rows = [];
    for (const w of A.atWar(o.id)) if (w.casus && w.casus.t) rows.push(`<div class="tiny">${esc(w.name)}: <span class="muted">${esc(short(w.leadA))}'s cause:</span> ${esc(w.casus.t)}</div>`);
    if (!rows.length && Array.isArray(o.csHist) && o.csHist.length) { const h = o.csHist[o.csHist.length - 1]; rows.push(`<div class="tiny muted">Its last war, in ${esc(h.y)}, against ${esc(short(h.o))}: ${esc(h.t)}</div>`); }
    const pl = UI.csPlanText(o);
    if (pl) rows.push(`<div class="tiny ${o.csPlan && r && o.csPlan.t === r.id ? 'bad' : ''}">${esc(pl)}</div>`);
    const d = debtsOf(o.id).slice(0, 3);
    if (d.length) rows.push(`<div class="tiny good">${esc(o.short)} owes: ${d.map(([x, e]) => `${esc(short(x))} (${esc(FE.origin(e))})`).join('; ')}. It will not attack them, and marches when they are attacked, if its ruler keeps faith.</div>`);
    return rows.length ? `<div class="cs-block" style="margin-top:6px"><div class="group-h">Grudges, wants and debts</div>${rows.join('')}</div>` : '';
  };
  if (typeof UI.diplCard === 'function') {
    const dc = UI.diplCard;
    UI.diplCard = function (r, o) {
      const h = dc.apply(this, arguments);
      try {
        const b = o ? UI.csRealmBlock(o, r) : '';
        return b ? h.replace(/<\/div>\s*$/, b + '</div>') : h;
      } catch (e) { return h; }
    };
  }
  // the Realm tab: why wars begin around you
  UI.csCard = function (pc) {
    const rid = pc && (pc.ruler || pc.realm), r = A.realm(rid);
    if (!r) return '';
    const rows = [];
    for (const w of A.atWar(rid)) if (w.casus && w.casus.t) rows.push(`<div class="tiny"><b>${esc(w.name)}</b> <span class="muted">(${esc(short(w.leadA))} against ${esc(short(w.leadD))}, ${esc(w.casus.y)})</span>: ${esc(w.casus.t)}</div>`);
    const mine = UI.csPlanText(r);
    if (mine) rows.push(`<div class="tiny">${esc(mine)}</div>`);
    for (const o of A.neighbors(rid).map(A.realm).filter(x => x && x.alive && x.csPlan && x.csPlan.t === rid)) rows.push(`<div class="tiny bad">${esc(UI.csPlanText(o))}</div>`);
    const others = (A.S.wars || []).filter(w => w.casus && w.casus.t && !w.att.includes(rid) && !w.def.includes(rid)).slice(0, 4);
    if (others.length) rows.push(`<div class="tiny muted" style="margin-top:4px">Elsewhere</div>` + others.map(w => `<div class="tiny">${esc(w.name)}: ${esc(w.casus.t)}</div>`).join(''));
    if (!rows.length) return '';
    return `<div class="card small cs-card" aria-label="Why wars begin"><b>Why wars begin</b>${rows.join('')}</div>`;
  };
  const realmTab = UI.TAB && UI.TAB.realm;
  if (typeof realmTab === 'function') UI.TAB.realm = function (pc) {
    const h = realmTab.apply(this, arguments);
    try { const c = pc ? UI.csCard(pc) : ''; return c ? h + c : h; } catch (e) { return h; }
  };
})();
