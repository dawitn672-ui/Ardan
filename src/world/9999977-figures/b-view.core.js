// The figures registry, part 2: "Figures of the Age", a page of the codex (order 96, D-193). The categories in two groups
// (of the realms, beyond the realms), each a button; the chosen one's figures, each a row that opens its profile in place.
// Only what the player should know (order 93; A.FIG.knows): a figure he has not heard of is a line without a name, its
// arts and arms once he has met it, its heart (goals, grudges, the secret story) once he has learned it.
// Pure: reads A.FIG, A.POWER and the state, writes only UI's own choice (UI.figCat, UI.figOpen), draws nothing. Every value
// through UI.esc; every description opens on a press (UI.note, data-note), never on hover; no percentages; controls 44
// points; a column from 375 px.
(function () {
  const FIG = A.FIG, PW = A.POWER;
  if (!FIG || !PW || typeof UI === 'undefined') return;
  const e = s => UI.esc(String(s == null ? '' : s));
  const note = (text, label) => (UI.note ? UI.note(text, e(label)) : `<span data-note="${e(text)}">${e(label)}</span>`);
  const capWords = g => Object.keys(g || {}).filter(k => k !== 'power' && k !== 'level' && g[k]).map(k => `${g[k] > 0 ? '+' : ''}${g[k]} ${PW.capName(k)}`)
    .concat(g && g.level ? ['a higher level'] : []).concat(g && g.power ? ['more fighting power'] : []).join(', ');
  const RACE = r => (GD.RACES && GD.RACES[r] ? GD.RACES[r].name : (PW.BD.families[r] || {}).n || r || '');
  const COUNT_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
  const nWord = n => (n < COUNT_WORDS.length ? COUNT_WORDS[n] : String(n));
  const bare = s => String(s || '').replace(/[.\s]+$/, '');
  const liegeName = id => { const L = PW.LEG.get(id); return L ? L.n : id; };

  // ---------------------------------------------------------------- one profile, as far as he knows it
  const levelBit = p => note(`Level ${p.level}: rank ${PW.band(p.level).r}, ${PW.band(p.level).w}. ${PW.band(p.level).d}`, 'Level ' + p.level);
  const titleBit = t => note(`${t.n}.${capWords(t.buffs) ? ' It gives ' + capWords(t.buffs) + '.' : ''} What earned it is not told.`, t.n);
  const skillBit = k => {
    const lab = k.label || `${k.rank} · Lv ${k.lvl}`;
    return `<li>${note(`${k.n}: ${k.kind ? k.kind + ', ' : ''}${lab}.${k.does ? ' ' + k.does : ''}${k.from ? ' (' + k.from + ')' : ''}`, k.n)} <span class="muted">${e(lab)}</span></li>`;
  };
  // an item's make and its rarity above basic (the one ladder, D-200): 'a masterwork, legendary maul'
  const itemWords = i => [A.RARITY ? A.RARITY.itemWords(i) : '', i.kind].filter(Boolean).join(' ');
  const itemBit = i => `<li>${note(`${i.n}${itemWords(i) ? ' (' + itemWords(i) + ')' : ''}.${i.does ? ' ' + i.does : ''}${capWords(i.gives) ? ' It gives ' + capWords(i.gives) + '.' : ''}`, i.n)}</li>`;
  FIG.profileHtml = function (pc, p, k) {
    k = k || FIG.knows(pc, p);
    let h = '<div class="fig-body">';
    const kind = p.type === 'being' ? `${p.kindName}${p.liege ? ', sworn to ' + liegeName(p.liege) : ''}` : p.type === 'legend' ? (p.group || 'A legend') : RACE(p.race);
    h += `<div class="small">${e(kind)} · ${levelBit(p)}${p.cls ? ' · ' + note(`Class: ${p.cls.name}.${p.cls.road && p.cls.road.length > 1 ? ' The road: ' + p.cls.road.join(', then ') + '.' : ''} A class adds things to do: a technique, a gift that fires when its moment comes, a way to earn.`, p.cls.name) : ''}${p.age != null ? ' · ' + e(p.age) + ' years' : ''}</div>`;
    if (p.titles && p.titles.length) h += `<div class="small"><b>Titles:</b> ${p.titles.map(titleBit).join(', ')}</div>`;
    h += `<div class="small"><b>Home:</b> ${p.home && p.home.name && (p.home.known || k.secret) ? e(p.home.name) + (p.home.domain ? ', ' + e(p.home.domain) : '') : '<span class="muted">not known</span>'}</div>`;
    const tw = FIG.temperWords(p.temper), tr = p.freeTraits ? (p.traits || []) : (p.traits || []).map(FIG.traitName);
    if (tw.length || tr.length) h += `<div class="small"><b>Known as:</b> ${e(tw.concat(tr.map(x => String(x).toLowerCase())).filter((x, i, a) => a.indexOf(x) === i).join(', '))}</div>`;
    if (p.looks) h += `<div class="small muted">${e(p.looks)}</div>`;
    for (const s of p.story || []) h += `<p class="small fig-story">${e(s)}</p>`;
    if (k.arts) {
      // a great being's own arts are one set of one rarity (order 97, D-202): the Primordials', the Dragon King's and the
      // Sword Saint's mythical, the ancients' legendary
      const set = p.type !== 'person' && A.RARITY ? A.RARITY.setOf(p, p.cat) : null;
      if (p.skills && p.skills.length) h += `<div class="small"><b>Skills</b>${set ? ` <span class="muted">${e(A.RARITY.word(set))} arts</span>` : ''}</div><ul class="fig-list small">${p.skills.map(skillBit).join('')}</ul>`;
      if (p.arts && p.arts.length) h += `<div class="small"><b>Arts readied:</b> ${e(p.arts.join(', '))}</div>`;
      if (p.items && p.items.length) h += `<div class="small"><b>Carries</b></div><ul class="fig-list small">${p.items.map(itemBit).join('')}</ul>`;
    } else h += `<div class="small muted">What ${p.type === 'person' ? 'this one' : 'it'} can do, and what ${p.type === 'person' ? 'they carry' : 'it carries'}, you would learn only by meeting ${p.type === 'person' ? 'them' : 'it'}.</div>`;
    if (k.secret) {
      if (p.goals && p.goals.length) h += `<div class="small"><b>Wants:</b> ${e(p.goals.map(g => bare(g.why)).join('; '))}.</div>`;
      if (p.grudges && p.grudges.length) h += `<div class="small"><b>Grudges:</b> ${e(p.grudges.map(g => `${g.atName}: ${bare(g.why)}`).join('; '))}.</div>`;
      for (const s of (p.secret && p.secret.story) || []) h += `<p class="small fig-secret">${e(s)}</p>`;
    } else h += `<div class="small muted">What drives ${p.type === 'person' ? 'them' : 'it'}, and whom ${p.type === 'person' ? 'they hate' : 'it hates'}, only those close ${p.type === 'person' ? 'to them' : 'to it'} know.</div>`;
    return h + '</div>';
  };

  // ---------------------------------------------------------------- the page
  const row = (pc, p, open, k) => {
    const sub = p.style && p.style !== p.name ? p.style : '';
    return `<div class="fig-item${open ? ' open' : ''}"><button type="button" class="fig-row" data-a="figOpen" data-v="${e(p.id)}" aria-expanded="${open ? 'true' : 'false'}"><span class="fig-name"><b>${e(p.name)}</b>${sub ? ` <span class="muted">${e(sub)}</span>` : ''}</span><span class="fig-lv">Lv ${e(p.level)}</span></button>${open ? FIG.profileHtml(pc, p, k) : ''}</div>`;
  };
  // "Marquis of the Burning Court" -> "Marquises of the Burning Court", "Pit Wyrm" -> "Pit Wyrms"
  const plural = k => { const s = String(k), i = s.indexOf(' of '), head = i >= 0 ? s.slice(0, i) : s, tail = i >= 0 ? s.slice(i) : ''; return head + (/(s|sh|ch|x)$/.test(head) ? 'es' : 's') + tail; };
  UI.figuresPage = function (pc) {
    if (!pc) return '';
    const cats = FIG.CATS, cat = cats.find(c => c.id === UI.figCat) || cats[0];
    let h = `<div class="fig"><div class="group-h">Figures of the Age</div><p class="tiny muted">The strongest and most influential people and beings of the continent, by kind. What you have not heard of, or learned, is not written here.</p>`;
    for (const g of FIG.GROUPS) {
      const mine = cats.filter(c => c.group === g.id); if (!mine.length) continue;
      h += `<div class="fig-gh small">${e(g.name)}</div><div class="fig-cats">` + mine.map(c => `<button type="button" class="small fig-cat ${c === cat ? 'primary' : ''}" data-a="figCat" data-v="${e(c.id)}">${e(c.name)}</button>`).join('') + '</div>';
    }
    const list = FIG.list(cat.id), shown = list.map(p => [p, FIG.knows(pc, p)]);
    h += `<div class="small fig-note">${e(cat.note)}</div>`;
    const known = shown.filter(x => x[1].listed), hidden = shown.length - known.length;
    const by = cat.groupBy === 'liege' ? x => 'Sworn to ' + liegeName(x[0].liege) : cat.id === 'legends' ? x => x[0].group || '' : cat.kind === 'generated' && cat.id !== 'rulers' ? x => { const r = A.realm(x[0].realm); return r ? r.name : ''; } : null;
    // the beings he has not heard of: one line a group, by kind and count ("Four Marquises of the Burning Court ...")
    let last = null, unk = [];
    const flush = () => {
      if (!unk.length) return;
      const by = {}; for (const p of unk) by[p.kindName] = (by[p.kindName] || 0) + 1;
      const parts = Object.keys(by).map(k => by[k] === 1 ? 'a ' + k : nWord(by[k]) + ' ' + plural(k));
      h += `<div class="fig-item fig-unknown small muted">${e(cap(parts.join(', ').replace(/, ([^,]*)$/, ' and $1')))}: no name has reached you.</div>`;
      unk = [];
    };
    const items = cat.kind === 'fixed' ? shown : known;
    if (!items.length) h += '<div class="small muted">You have heard of none of them yet.</div>';
    for (const x of items) {
      const gk = by ? by(x) : null;
      if (gk && gk !== last) { flush(); h += `<div class="fig-sub small">${e(gk)}</div>`; last = gk; }
      if (x[1].listed) h += row(pc, x[0], UI.figOpen === x[0].id, x[1]); else unk.push(x[0]);
    }
    flush();
    if (cat.kind !== 'fixed' && hidden > 0) h += `<div class="tiny muted fig-more">${e(cap(nWord(hidden)))} more ${hidden === 1 ? 'is' : 'are'} not known to you.</div>`;
    return h + '</div>';
  };
  const cap = s => String(s).charAt(0).toUpperCase() + String(s).slice(1);
  Object.assign(UI.A, {
    figCat(v) { UI.figCat = v; UI.figOpen = null; UI.refreshTab ? UI.refreshTab() : UI.render(); },
    figOpen(v) { UI.figOpen = UI.figOpen === v ? null : v; UI.refreshTab ? UI.refreshTab() : UI.render(); },
  });

  const CSS = `
.fig-cats{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 8px}
.fig-cat{min-height:44px;padding:0 12px}
.fig-gh{font-weight:600;margin-top:6px}
.fig-note{margin:4px 0 8px}
.fig-sub{font-weight:600;margin:10px 0 4px;border-bottom:1px solid var(--line,#ccc)}
.fig-item{margin:4px 0}
.fig-row{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:44px;text-align:left;padding:6px 10px;box-sizing:border-box}
.fig-name{min-width:0;overflow-wrap:anywhere}
.fig-lv{flex:none;white-space:nowrap}
.fig-unknown{padding:8px 10px;min-height:44px;box-sizing:border-box;display:flex;align-items:center}
.fig-body{padding:6px 10px 10px;border-left:2px solid var(--accent,#a77);margin:2px 0 8px;overflow-wrap:anywhere}
.fig-body .small{margin:3px 0}
.fig-list{margin:2px 0 4px;padding-left:18px}
.fig-story,.fig-secret{margin:4px 0}
.fig-secret{font-style:italic}
`;
  const put = () => { if (typeof document === 'undefined' || document.getElementById('fig-style')) return; const st = document.createElement('style'); st.id = 'fig-style'; st.textContent = CSS; (document.head || document.documentElement).appendChild(st); };
  if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }
})();
