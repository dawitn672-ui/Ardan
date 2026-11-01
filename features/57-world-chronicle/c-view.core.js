// The world record on the page (Road to Ten, World 5 and Replayability 5): the World tab's "Annals" view, paged and
// filtered, and "The world in your time", the great entries of the run in prose, at the end of the Chronicle (the Book
// page and its text export, by wrapping 22-chronicle's functions). All of it only reads: no A.rand, no change to A.S.
(function () {
  const WC = A.WC;
  if (!WC) return;
  const esc = s => UI.esc(s);
  const rs = id => (id ? (A.realm(id) ? A.realm(id).short : WC.name(id) || 'a realm now gone') : '');
  const pn = i => (i != null && A.S.prov[i] ? A.S.prov[i].name : '');
  const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
  const say = n => (n < NUM.length ? NUM[n] : String(n));
  const times = n => (n === 1 ? 'once' : n === 2 ? 'twice' : `${say(n)} times`);

  // ---- the Annals: every entry, newest first, by kind and by place
  WC.GROUPS = [
    ['all', 'All', null],
    ['war', 'Wars', ['war', 'peace']],
    ['field', 'Battles and sieges', ['battle', 'siege', 'fall', 'order']],
    ['land', 'Lands', ['cede', 'fallen', 'founded', 'trib']],
    ['crown', 'Thrones', ['ruler', 'crown', 'revolt', 'legend']],
    ['want', 'Hunger and sickness', ['famine', 'plague']],
    ['ties', 'Marriages and alliances', ['wedding', 'alliance']],
  ];
  WC.PAGE = 40;
  WC.annalsRows = function (pc, group, near) {
    const g = WC.GROUPS.find(x => x[0] === group) || WC.GROUPS[0], ks = g[2] ? new Set(g[2]) : null;
    const realms = near && pc ? WC.nearRealms(pc) : null, provs = near && pc ? WC.nearProvs(pc) : null;
    const R = A.S && A.S.wrec, out = [];
    if (!R) return out;
    for (let i = R.e.length - 1; i >= 0; i--) {
      const e = R.e[i];
      if (ks && !ks.has(e[0])) continue;
      if (realms && !((e[3] != null && provs.has(e[3])) || realms.has(e[4]) || realms.has(e[5]))) continue;
      out.push(i);
    }
    return out;
  };
  WC.annals = function (pc) {
    const R = A.S && A.S.wrec;
    const group = UI.wcGroup || 'all', near = UI.wcNear != null ? !!UI.wcNear : !!(A.WORLD1 && A.WORLD1.great()), rows = WC.annalsRows(pc, group, near);
    const pages = Math.max(1, Math.ceil(rows.length / WC.PAGE)), page = Math.min(Math.max(0, UI.wcPage || 0), pages - 1);
    const kinds = R ? new Set(R.e.map(e => e[0])).size : 0;
    let h = `<div class="group-h">The annals of Ardan</div><p class="small muted">Everything the world has done since the record opened in 1105: ${A.fmt(R ? R.e.length : 0)} entries of ${kinds} kinds, none dropped. ` +
      `The newest first. Far news reached people as hearsay; this is what happened.</p>`;
    h += `<div class="row" style="flex-wrap:wrap;gap:4px;margin:6px 0">${WC.GROUPS.map(([k, n]) => `<button class="small ${group === k ? 'primary' : ''}" data-a="wcGroup" data-v="${esc(k)}">${esc(n)}</button>`).join('')}` +
      `<button class="small ${near ? 'primary' : ''}" data-a="wcNear" data-v="${near ? 0 : 1}">${near ? 'Near you' : 'All Ardan'}</button></div>`;
    if (!rows.length) return h + '<p class="small muted">Nothing of this kind is set down yet.</p>';
    let last = null;
    for (const i of rows.slice(page * WC.PAGE, (page + 1) * WC.PAGE)) {
      const e = WC.ent(i);
      if (e.y !== last) { h += `<div class="tiny muted" style="margin-top:6px"><b>${e.y}</b></div>`; last = e.y; }
      const who = WC.people(e);
      h += `<div class="small wc-entry" style="margin:2px 0">${esc(WC.line(e))}${who.length ? ` <span class="tiny muted">(${esc(who.join(', '))})</span>` : ''}</div>`;
    }
    if (pages > 1) {
      h += `<div class="row" style="gap:6px;margin-top:8px;align-items:center">` +
        `<button class="small" data-a="wcPage" data-v="${page - 1}"${page <= 0 ? ' disabled' : ''}>Newer</button>` +
        `<span class="small muted">Page ${page + 1} of ${pages}</span>` +
        `<button class="small" data-a="wcPage" data-v="${page + 1}"${page >= pages - 1 ? ' disabled' : ''}>Older</button></div>`;
    }
    return h;
  };
  Object.assign(UI.A, {
    wcGroup(v) { UI.wcGroup = String(v || 'all'); UI.wcPage = 0; UI.refreshTab ? UI.refreshTab() : UI.render(); },
    wcNear(v) { UI.wcNear = String(v) === '1'; UI.wcPage = 0; UI.refreshTab ? UI.refreshTab() : UI.render(); },
    wcPage(v) { UI.wcPage = Math.max(0, parseInt(v, 10) || 0); UI.refreshTab ? UI.refreshTab() : UI.render(); },
  });
  const world = UI.TAB && UI.TAB.world;
  if (typeof world === 'function') UI.TAB.world = function (pc) {
    const mine = UI.worldView === 'annals';
    let h;
    if (mine) {
      // the release's button row, drawn from its history view, with the annals marked as the view shown
      UI.worldView = 'history';
      try { h = world.apply(this, arguments); } finally { UI.worldView = 'annals'; }
      const cut = h.indexOf('</div>');
      h = (cut > 0 ? h.slice(0, cut) : '').replace(/ primary"/g, '"').replace(/class="small primary"/g, 'class="small"');
      h += `<button class="small primary" data-a="wview" data-v="annals">Annals</button></div>`;
      return h + WC.annals(pc);
    }
    h = world.apply(this, arguments);
    const btn = 'data-v="history">History</button>', at = h.indexOf(btn);
    return at >= 0 ? h.slice(0, at + btn.length) + `<button class="small" data-a="wview" data-v="annals">Annals</button>` + h.slice(at + btn.length) : h;
  };

  // ---- the world in your time: the great entries, by decade, in prose
  // the realms the lives of this save lived among
  WC.livesRealms = function () {
    const S = A.S, set = new Set(), ids = new Set();
    for (const e of S.log || []) if (e.pc) ids.add(e.pc);
    if (S.pc) ids.add(S.pc);
    for (const id of ids) { const p = A.P(id); if (p) for (const r of WC.nearRealms(p)) set.add(r); }
    return set;
  };
  WC.legends = function () {
    const R = A.S && A.S.wrec; if (!R || !R.e.length) return [];
    const mine = WC.livesRealms(), all = WC.all();
    const isMine = e => mine.has(e.a) || mine.has(e.b);
    const wars = {}; for (const e of all) if (e.k === 'peace' && Array.isArray(e.x)) wars[e.x[0]] = e;
    const decades = new Map();
    // decades from 1105; what began before the record opened (a war already being fought) goes first, on its own
    const dec = y => (y < 1105 ? -1 : Math.floor((y - 1105) / 10));
    const add = (e, s, w) => { const d = dec(e.y); if (!decades.has(d)) decades.set(d, []); decades.get(d).push({ e, s, w }); };
    const byKind = k => all.filter(e => e.k === k);
    for (const e of byKind('war')) {
      const id = Array.isArray(e.x) ? e.x[0] : null, end = id && wars[id];
      let s = WC.line(e).replace(/\.$/, '');
      if (end) {
        const res = Array.isArray(end.x) ? end.x[1] : 'white', got = Array.isArray(end.x) && Array.isArray(end.x[2]) ? end.x[2].map(pn).filter(Boolean) : [];
        s += res === 'white' ? `. It ended in ${end.y} in a white peace` : `. It ended in ${end.y}${end.n ? `, after ${say(end.n)} year${end.n > 1 ? 's' : ''},` : ''} with ${rs(end.a)} the victor${got.length ? `, and ${got.slice(0, 3).join(', ')} passed to ${rs(end.a)}` : ''}`;
      } else if (A.S.wars.some(w => w.id === id)) s += '. It is still being fought';
      add(e, s + '.', isMine(e) ? 6 : 4);
    }
    for (const k of ['fallen', 'founded', 'legend', 'revolt']) for (const e of byKind(k)) add(e, WC.line(e), isMine(e) ? 6 : 4);
    for (const e of byKind('ruler')) if (isMine(e)) add(e, WC.line(e), 4);
    for (const e of byKind('crown')) if (isMine(e)) add(e, WC.line(e), 3);
    for (const k of ['wedding', 'alliance', 'trib']) for (const e of byKind(k)) if (isMine(e)) add(e, WC.line(e), 2);
    for (const e of byKind('famine').concat(byKind('plague'))) if (isMine(e)) add(e, WC.line(e), 3);
    // the field: the greatest battles and the sacked towns of each decade, and any the lives were part of
    const top = (k, n, f) => { const by = new Map(); for (const e of byKind(k)) { if (f && !f(e)) continue; const d = dec(e.y); if (!by.has(d)) by.set(d, []); by.get(d).push(e); } for (const L of by.values()) for (const e of L.sort((a, b) => (b.n || 0) - (a.n || 0)).slice(0, n)) add(e, WC.line(e), 3); };
    top('battle', 2, e => !isMine(e)); top('battle', 3, isMine);
    top('fall', 2, e => (e.x || 0) >= 2);
    const out = [];
    for (const [d, L] of [...decades.entries()].sort((a, b) => a[0] - b[0])) {
      const y0 = d < 0 ? 0 : 1105 + d * 10, y1 = d < 0 ? 1104 : Math.min(A.S.year, y0 + 9);
      const seen = new Set(), lines = [];
      let lastY = null;
      for (const x of L.sort((a, b) => a.e.y - b.e.y || a.e.d - b.e.d)) {
        if (seen.has(x.s)) continue;
        seen.add(x.s);
        // a second line of the same year does not repeat the year, and one of the year after counts on from it
        let s = x.s;
        const mo = WC.month(x.e), gap = lastY == null ? -1 : x.e.y - lastY;
        const alt = gap === 0 ? [`That ${mo}, `, `In ${mo} of the same year, `, `The same year, in ${mo}, `]
          : gap === 1 ? [`The next year, in ${mo}, `, `A year later, in ${mo}, `, `In ${mo} of the year after, `]
          : gap === 2 ? [`Two years on, in ${mo}, `, `In ${mo} ${x.e.y}, `] : null;
        if (alt) s = s.replace(`In ${mo} ${x.e.y}, `, alt[(x.e.i + x.e.y) % alt.length]);
        lastY = x.e.y;
        lines.push(s);
      }
      // the sum of the hunger and sickness of the decade, across Ardan
      const fam = all.filter(e => e.k === 'famine' && e.y >= y0 && e.y <= y1), pl = all.filter(e => e.k === 'plague' && e.y >= y0 && e.y <= y1);
      const sum = [];
      if (fam.length) sum.push(`the harvest failed ${times(fam.length)} across Ardan`);
      if (pl.length) sum.push(`sickness broke out ${times(pl.length)}`);
      const bt = all.filter(e => e.k === 'battle' && e.y >= y0 && e.y <= y1).length, fl = all.filter(e => e.k === 'fall' && e.y >= y0 && e.y <= y1).length;
      if (bt) sum.push(`${say(bt)} great battle${bt > 1 ? 's were' : ' was'} fought`);
      if (fl) sum.push(`${say(fl)} walled town${fl > 1 ? 's' : ''} fell`);
      if (sum.length) lines.push(`In these years ${sum.slice(0, -1).join(', ')}${sum.length > 1 ? ', and ' : ''}${sum[sum.length - 1]}.`);
      out.push({ title: d < 0 ? 'Before 1105' : y0 === y1 ? `The year ${y0}` : `The years ${y0} to ${y1}`, lines });
    }
    return out;
  };
  WC.legendsText = function () {
    const L = WC.legends(); if (!L.length) return '';
    const out = ['THE WORLD IN YOUR TIME', '', 'What the world did while these lives were lived, from the record kept since 1105.', ''];
    for (const d of L) { out.push(d.title, ''); out.push(d.lines.join(' ')); out.push(''); }
    return out.join('\n');
  };
  const text = A.chronicleText;
  if (typeof text === 'function') A.chronicleText = function () {
    const t = text.apply(this, arguments), w = WC.legendsText();
    return w ? t.replace(/\s*$/, '\n\n') + w : t;
  };
  const book = UI.TAB && UI.TAB.book;
  if (typeof book === 'function') UI.TAB.book = function () {
    const h = book.apply(this, arguments), L = WC.legends();
    if (!L.length) return h;
    const sec = `<section class="chron-world"><h3>The world in your time</h3><p class="tiny muted">From the record of the world kept since 1105. The full record is in World, Annals.</p>` +
      L.map(d => `<h4>${esc(d.title)}</h4><p class="chron-line">${esc(d.lines.join(' '))}</p>`).join('') + '</section>';
    const end = h.lastIndexOf('</div>');
    return end > 0 ? h.slice(0, end) + sec + h.slice(end) : h + sec;
  };
})();
