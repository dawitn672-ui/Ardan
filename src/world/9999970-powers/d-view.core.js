// Powers wave 1, part 4: what the player can read (the codex's "Power & scale" page, below the human tiers).
// Pure: reads A.POWER and A.S.pw, writes nothing, draws nothing. Every value goes through UI.esc; every number and every
// description opens on click (UI.note, data-note), never on hover; no percentages. The codex reveals what is known: a
// great being is listed once a tale, news or a meeting has told of it (its titles and story); its skills and items once he
// has met it, or, for the Sword Saint, from childhood (every child knows his class, his sword and his arts). Titles show
// their names and what they give, never what earned them.
(function () {
  const PW = A.POWER;
  if (!PW || typeof UI === 'undefined') return;
  const e = s => UI.esc(String(s == null ? '' : s));
  const num = (v, note) => (UI.note ? UI.note(note, e(v)) : `<span data-note="${e(note)}">${e(v)}</span>`);
  const capWords = g => Object.keys(g || {}).filter(k => k !== 'power' && k !== 'level' && g[k]).map(k => `${g[k] > 0 ? '+' : ''}${g[k]} ${PW.capName(k)}`).concat(g && g.power ? [g.power > 0 ? 'more fighting power' : 'less fighting power'] : []).join(', ');
  // how much the player knows of a being: 0 nothing, 1 heard of it, 2 its skills and items too
  PW.knowLevel = function (id) {
    const st = (A.S && A.S.pw) || {};
    if ((st.metLeg || {})[id] != null || (id === 'sword-saint' && (st.known || {})[id] != null)) return 2;
    return (st.known || {})[id] != null ? 1 : 0;
  };
  UI.powersPage = function (pc) {
    if (!pc) return '';
    const st = (A.S && A.S.pw) || {}, met = st.met || {};
    const me = PW.being(pc), band = PW.band(me.level);
    let h = `<div class="group-h">The scale of all beings</div>`;
    h += `<div class="small"><b>You stand at level ${num(me.level, band.d)}</b>, rank ${e(band.r)}: ${e(band.w)}.</div>`;
    h += '<table class="t small"><tr><th>Rank</th><th>From level</th><th>What stands there</th></tr>' +
      PW.D.bands.map(b => `<tr class="${band === b ? 'sel' : ''}"><td>${e(b.r)}</td><td>${num(b.from, `Rank ${b.r} begins at level ${b.from}. ${b.d}`)}</td><td data-note="${e(b.d)}">${e(b.w)}</td></tr>`).join('') + '</table>';
    h += '<div class="tiny muted">Each level is worth more than the one before. The level is not the whole of it: titles, the rank of a being\'s skills, its arms, and whether it flies, wears a hide no blade bites, comes as many or burns all before it decide as much.</div>';
    const great = PW.great(), seen = great.filter(x => PW.knowLevel(x.id) > 0);
    h += `<div class="group-h">The great beings of the world</div>`;
    if (!seen.length) h += '<div class="small muted">You have heard no tales of them yet.</div>';
    else h += '<table class="t small"><tr><th>Place</th><th>Who</th><th>Level</th></tr>' + seen.map(x => {
      const L = PW.LEG.get(x.id) || PW.MAS.get(x.id), kn = PW.knowLevel(x.id);
      const t = (x.titles || []).map(y => y.n).join(', ');
      let more = L && L.tellings ? ` Your people tell it: ${L.tellings[pc.race] || L.tellings.human}${L.sword ? ' His sword: ' + L.sword.n + ', ' + L.sword.d : ''}${L.places ? ' Places named for him: ' + L.places.join('; ') + '.' : ''}` : '';
      if (L && L.titles) more += ' Titles: ' + L.titles.map(y => y.n + (capWords(y.buffs) ? ' (' + capWords(y.buffs) + ')' : '')).join('; ') + '.';
      if (L && kn >= 2) {
        if (L.class) more += ` Class: ${L.class}.`;
        // its own arts, one set of one rarity (order 97, D-202)
        const set = A.RARITY ? A.RARITY.setOf(L, PW.LEG.has(x.id) ? 'legends' : null) : null;
        if (L.skills) more += (set ? ` Its arts are ${A.RARITY.word(set)}.` : '') + ' Skills: ' + L.skills.map(k => `${k.n}, ${k.rank}-rank, level ${k.lvl} of 10: ${k.does}${k.from ? ' (' + k.from + ')' : ''}`).join(' ');
        if (L.items && L.items.length) more += ' Carries: ' + L.items.map(i => `${i.n} (${[A.RARITY ? A.RARITY.itemWords(i) : '', i.kind].filter(Boolean).join(' ')}): ${i.does}${capWords(i.gives) ? ' Gives ' + capWords(i.gives) + '.' : ''}`).join(' ');
      } else if (L) more += ' What it can do, and what it carries, you would only learn by meeting it.';
      const where = PW.great().length;
      return `<tr><td>${num(x.rank, `Of the ${where} greatest beings of the world, by fighting power: level, titles, skills and arms together.`)}</td><td data-note="${e((L && L.d ? L.d : 'A named monster of the wilds.') + more)}"><b>${e(x.n)}</b>${t ? ' <span class="muted">' + e(t) + '</span>' : ''}</td><td>${num(x.level, PW.band(x.level).d)}</td></tr>`;
    }).join('') + '</table>';
    if (great.length > seen.length) h += `<div class="tiny muted">There are others no tale has reached you of.</div>`;
    const ms = Object.keys(met).map(id => PW.species(id)).filter(Boolean).sort((a, b) => b.level - a.level);
    if (ms.length) {
      h += `<div class="group-h">Beasts you have met</div><table class="t small"><tr><th>Beast</th><th>Level</th><th>Mind</th></tr>` + ms.map(s => {
        const b = s.beh, note = `${PW.BD.families[s.fam].n}. Lives in ${(s.terr.length ? s.terr.join(', ') : 'the sea')}. ${b.day}; ${b.year}. Provoked by ${(b.provoked || []).join(', ') || 'nothing much'}; ${b.nature ? 'by its nature ' + b.nature.k + ': it ' + b.nature.spec : 'turned by ' + (b.calmed || []).join(', ')}. Leaves ${s.drops.map(d => d.k).join(', ')}.`;
        return `<tr><td data-note="${e(note)}">${e(s.n)}</td><td>${num(s.level, PW.band(s.level).d)}</td><td>${e(s.int)}</td></tr>`;
      }).join('') + '</table>';
    }
    return h;
  };
})();
