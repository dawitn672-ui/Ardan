// NPC beliefs, part 5: where the player sees what is said of the world. Every function here only reads: no A.rand, no
// write to A.S, every value through UI.esc. The record's own account is shown only where the player knows it.
//   UI.diplCard   (wrapper) a realm's diplomacy card: "What is said in X" (its tellings) and "At court in X"
//   UI.TAB.realm  (wrapper) the Realm tab: "What is said here", for the player's realm, with the grudges it feeds
//   UI.TAB.world  (wrapper) a "Tales" view in the World tab: the great events as each realm near you tells them
//   UI.TAB.book, A.chronicleText (wrappers) the Chronicle: "What the world told …", what a life was told of the world,
//                 set beside the record where they came to know it (26-belief-truth's "As the tale is told" is of you)
(function () {
  const NB = A.NPCB; if (!NB || !NB.tellings) return;
  const esc = s => UI.esc(s == null ? '' : String(s)), cap = NB.cap;
  const rs = id => (id && A.realm(id) ? A.realm(id).short : (A.WC && A.WC.name && A.WC.name(id)) || 'a realm now gone');
  const heldOther = (pc, c) => Object.keys((pc && pc.nbk) || {}).some(id => +id !== c.id && Array.isArray(pc.nbk[id]) && Math.abs(pc.nbk[id][0]) === 1 && (() => { const x = NB.claim(id); return x && NB.isWorld(x) && x.o === c.o; })());
  // the mark after a telling: true or not where the player knows; what they heard, where they do not
  NB.worldMark = function (pc, c) {
    if (!pc) return '';
    if (NB.pcKnows(pc, c)) {
      if (c.t) return ' <span class="chip green">so it was</span>';
      const L = NB.recordLine(c);
      return ' <span class="chip red">not so</span>' + (L ? `<div class="tiny muted" style="margin-left:10px">The record: ${esc(L)}</div>` : '');
    }
    const mine = NB.pcHeld(pc, c.id);
    if (mine === 1) return ' <span class="tiny muted">(you heard it so)</span>';
    if (heldOther(pc, c)) return ' <span class="tiny muted">(you heard it otherwise)</span>';
    return ' <span class="tiny muted">(you cannot say)</span>';
  };
  NB.worldRows = function (pc, rid, max) {
    return NB.tellings(rid).slice(0, max || 6).map(x => { const s = NB.say(x.c, pc); return s ? `<div class="small prof-li">${esc(cap(s) + '.')}${NB.worldMark(pc, x.c)}</div>` : ''; }).join('');
  };
  // the grudges what is said here feeds, beyond the true ledger
  NB.grudgeRows = function (rid) {
    if (!NB.WG_ON) return '';
    const out = [];
    for (const b of Object.keys(A.S.realms || {}).sort()) { if (b === rid || !A.S.realms[b].alive) continue; const g = NB.wGrudge(rid, b); if (g <= -3) out.push([b, g]); }
    return out.sort((x, y) => x[1] - y[1]).slice(0, 3).map(([b, g]) => `<div class="tiny bad">What is said here sets ${esc(rs(rid))} against ${esc(rs(b))} (${g} on the grudge, and on opinion).</div>`).join('');
  };
  NB.courtRows = function (pc, rid) {
    const L = NB.court(rid).filter(x => x.st > 0 && 'SK'.includes(x.c.k)).slice(0, 4);
    return L.map(x => { const s = NB.say(x.c, pc); if (!s) return ''; const k = NB.pcKnows(pc, x.c); const m = k ? (x.c.t ? ' <span class="chip green">true</span>' : ' <span class="chip red">false</span>') : ' <span class="tiny muted">(you cannot say)</span>'; return `<div class="small prof-li">${esc(cap(s) + '.')}${m}</div>`; }).join('');
  };
  NB.realmBlock = function (pc, o) {
    if (!o) return '';
    const rows = NB.worldRows(pc, o.id, 5), court = NB.courtRows(pc, o.id), g = NB.grudgeRows(o.id);
    if (!rows && !court && !g) return '';
    return `<div class="nb-world" style="margin-top:6px"><div class="group-h">What is said in ${esc(o.short)}</div>` +
      (rows || '<div class="tiny muted">Nothing of the great events of late.</div>') + g +
      (court ? `<div class="tiny muted" style="margin-top:4px">At court in ${esc(o.short)}</div>${court}` : '') + '</div>';
  };
  if (typeof UI.diplCard === 'function') {
    const dc = UI.diplCard;
    UI.diplCard = function (r, o) {
      const h = dc.apply(this, arguments);
      try { const b = o ? NB.realmBlock(A.pc(), o) : ''; return b ? h.replace(/<\/div>\s*$/, b + '</div>') : h; } catch (e) { return h; }
    };
  }
  NB.realmCard = function (pc) {
    const r = pc && A.realm(pc.realm); if (!r) return '';
    const rows = NB.worldRows(pc, r.id, 6), g = NB.grudgeRows(r.id), tr = NB.traitors(r.id).filter(id => A.P(id) && A.P(id).alive);
    if (!rows && !g && !tr.length) return '';
    const trs = tr.slice(0, 2).map(id => `<div class="tiny">The court believes ${esc(NB.name(id))} ${esc(NB.secText('treason', A.P(id), false))}, and keeps ${esc(A.him(A.P(id)))} from the council.</div>`).join('');
    return `<div class="card small nb-said" aria-label="What is said here"><b>What is said here</b><div class="tiny muted">How ${esc(r.short)} tells the great events of late. The record is shown only where you know how it went.</div>${rows}${g}${trs}</div>`;
  };
  const realmTab = UI.TAB && UI.TAB.realm;
  if (typeof realmTab === 'function') UI.TAB.realm = function (pc) {
    const h = realmTab.apply(this, arguments);
    try { const c = pc ? NB.realmCard(pc) : ''; return c ? h + c : h; } catch (e) { return h; }
  };

  // ---------------------------------------------------------------- the World tab: the tales of the age
  NB.talesData = function (pc) {
    const s = NB.peek(); if (!s || !s.pb || !pc || !A.WC) return [];
    const near = [pc.realm].concat(A.neighbors ? A.neighbors(pc.realm) || [] : []);
    const by = new Map();
    for (const rid of near) for (const x of NB.tellings(rid)) { if (!by.has(x.c.o)) by.set(x.c.o, new Map()); }
    for (const rid of Object.keys(s.pb).sort()) for (const x of NB.tellings(rid)) if (by.has(x.c.o)) {
      const m = by.get(x.c.o); if (!m.has(x.c.id)) m.set(x.c.id, { c: x.c, realms: [] }); m.get(x.c.id).realms.push(rid);
    }
    const out = [];
    for (const [i, m] of by) { const e = A.WC.ent(i); if (e) out.push({ e, said: [...m.values()].sort((a, b) => (b.realms.includes(pc.realm) - a.realms.includes(pc.realm)) || b.realms.length - a.realms.length || a.c.id - b.c.id) }); }
    return out.sort((a, b) => (b.said.length > 1) - (a.said.length > 1) || b.e.y - a.e.y || b.e.i - a.e.i).slice(0, 12);
  };
  NB.talesView = function (pc) {
    const L = NB.talesData(pc);
    let h = `<div class="group-h">Tales of the age</div><p class="small muted">The great events of late as the realms around you tell them. Each realm tells its own side; the far hear it larger. ` +
      `Where you know how it went, the record's account is given.</p>`;
    if (!L.length) return h + '<p class="small muted">Nothing is told yet of the great events of late.</p>';
    for (const { e, said } of L) {
      const ref = A.WC.ref ? A.WC.ref(e) : String(e.y);
      h += `<div class="card small nb-tale" style="margin:4px 0"><b>${esc(cap(ref))}</b>`;
      for (const x of said.slice(0, 4)) {
        const where = x.realms.slice(0, 3).map(rs).join(', ') + (x.realms.length > 3 ? ` and ${x.realms.length - 3} more` : '');
        h += `<div class="small prof-li"><span class="muted">In ${esc(where)}:</span> ${esc(cap(NB.say(x.c, pc)) + '.')}${NB.pcHeld(pc, x.c.id) === 1 ? ' <span class="tiny muted">(you heard it so)</span>' : ''}</div>`;
      }
      const k = said.length && NB.pcKnows(pc, said[0].c);
      h += k ? `<div class="tiny muted">The record: ${esc(NB.recordLine(said[0].c))}</div>` : '<div class="tiny muted">Which of these is so, you cannot say from here.</div>';
      h += '</div>';
    }
    return h;
  };
  const world = UI.TAB && UI.TAB.world;
  if (typeof world === 'function') UI.TAB.world = function (pc) {
    if (UI.worldView === 'nbtales') {
      let h;
      UI.worldView = 'history';
      try { h = world.apply(this, arguments); } finally { UI.worldView = 'nbtales'; }
      const cut = h.indexOf('</div>');
      h = (cut > 0 ? h.slice(0, cut) : '').replace(/class="small primary"/g, 'class="small"');
      return h + `<button class="small primary" data-a="wview" data-v="nbtales">Tales</button></div>` + NB.talesView(pc);
    }
    const h = world.apply(this, arguments);
    for (const btn of ['data-v="annals">Annals</button>', 'data-v="history">History</button>']) {
      const at = h.indexOf(btn);
      if (at >= 0) return h.slice(0, at + btn.length) + `<button class="small" data-a="wview" data-v="nbtales">Tales</button>` + h.slice(at + btn.length);
    }
    return h;
  };

  // ---------------------------------------------------------------- the Chronicle: what a life was told of the world
  NB.toldLines = function (p) {
    if (!p || !p.nbk || typeof p.nbk !== 'object') return [];
    const he = A.he(p), out = [];
    const L = Object.keys(p.nbk).map(id => ({ c: NB.claim(id), e: p.nbk[id] })).filter(x => x.c && Array.isArray(x.e) && NB.isWorld(x.c) && x.e[1] !== null);
    for (const { c, e } of L.sort((a, b) => (a.e[3] != null ? a.e[3] : a.e[2]) - (b.e[3] != null ? b.e[3] : b.e[2]) || a.c.id - b.c.id).slice(0, 8)) {
      const said = NB.say(c, null); if (!said) continue;
      const heard = e[3] != null ? e[3] : e[2];
      if (e[0] === -2) out.push(`In ${heard}, word came ${said}. In ${e[2]} ${he} learned otherwise. ${NB.recordLine(c)}`);
      else if (e[0] === 1) out.push(`In ${heard}, word came ${said}. As far as ${he} ever knew, it was so.`);
      else if (e[0] === 2 && e[3] != null) out.push(`In ${heard}, word came ${said}, and so it was.`);
    }
    return out;
  };
  const book = UI.TAB && UI.TAB.book;
  if (typeof book === 'function' && typeof A.chronicleBook === 'function') UI.TAB.book = function () {
    let h = book.apply(this, arguments);
    try {
      for (const life of A.chronicleBook()) {
        const L = NB.toldLines(A.P(life.who)); if (!L.length) continue;
        const sec = `<h4>What the world told ${esc(life.name)}</h4><p class="tiny muted">News of the great events, as it reached ${esc(life.name)}, and the record where it came to be known.</p>` +
          L.map(t => `<p class="chron-line">${esc(t)}</p>`).join('');
        const marker = `<h3>The Life of ${esc(life.name)}</h3>`, at = h.indexOf(marker);
        if (at < 0) continue;
        const end = h.indexOf('</section>', at);
        if (end > 0) h = h.slice(0, end) + sec + h.slice(end);
      }
    } catch (e) {}
    return h;
  };
  const text = A.chronicleText;
  if (typeof text === 'function' && typeof A.chronicleBook === 'function') A.chronicleText = function () {
    let out = text.apply(this, arguments);
    try { for (const life of A.chronicleBook()) { const L = NB.toldLines(A.P(life.who)); if (L.length) out += `\nWHAT THE WORLD TOLD ${String(life.name).toUpperCase()}\n\n` + L.join('\n') + '\n'; } } catch (e) {}
    return out;
  };
})();
