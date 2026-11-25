// Powers wave 1, part 4: what the player can read (the codex's "Power & scale" page, below the human tiers).
// Pure: reads A.POWER and A.S.pw, writes nothing, draws nothing. Every value goes through UI.esc; every description opens on
// click (data-note), never on hover; no percentages. The great beings are listed only once a tale, news or a meeting has
// told the player of them; titles show their names and honour, never what earned them.
(function () {
  const PW = A.POWER;
  if (!PW || typeof UI === 'undefined') return;
  const e = s => UI.esc(String(s == null ? '' : s));
  UI.powersPage = function (pc) {
    if (!pc) return '';
    const st = (A.S && A.S.pw) || {}, known = st.known || {}, met = st.met || {};
    const me = PW.being(pc), band = PW.band(me.level);
    let h = `<div class="group-h">The scale of all beings</div>`;
    h += `<div class="small" data-note="${e(band.d)}"><b>You stand at level ${e(me.level)}</b>, rank ${e(band.r)}: ${e(band.w)}.</div>`;
    h += '<table class="t small"><tr><th>Rank</th><th>From level</th><th>What stands there</th></tr>' +
      PW.D.bands.map(b => `<tr class="${band === b ? 'sel' : ''}"><td>${e(b.r)}</td><td>${e(b.from)}</td><td data-note="${e(b.d)}">${e(b.w)}</td></tr>`).join('') + '</table>';
    h += '<div class="tiny muted">Every ten levels is ten times the might. The level is not the whole of it: a being that flies, a hide no blade bites, venom, numbers or magic can beat one above it, or lose to one below.</div>';
    const great = PW.great(), seen = great.filter(x => known[x.id] != null);
    h += `<div class="group-h">The great beings of the world</div>`;
    if (!seen.length) h += '<div class="small muted">You have heard no tales of them yet.</div>';
    else h += '<table class="t small"><tr><th>Place</th><th>Who</th><th>Level</th></tr>' + seen.map(x => {
      const L = PW.LEG.get(x.id) || PW.MAS.get(x.id), t = (x.titles || []).map(y => y.n).join(', ');
      return `<tr><td>${e(x.rank)}</td><td data-note="${e(L && L.d ? L.d : 'A named monster of the wilds.')}"><b>${e(x.n)}</b>${t ? ' <span class="muted">' + e(t) + '</span>' : ''}</td><td>${e(x.level)}</td></tr>`;
    }).join('') + '</table>';
    if (great.length > seen.length) h += `<div class="tiny muted">There are others no tale has reached you of.</div>`;
    const ms = Object.keys(met).map(id => PW.species(id)).filter(Boolean).sort((a, b) => b.level - a.level);
    if (ms.length) {
      h += `<div class="group-h">Beasts you have met</div><table class="t small"><tr><th>Beast</th><th>Level</th><th>Mind</th></tr>` + ms.map(s => {
        const b = s.beh, note = `${PW.BD.families[s.fam].n}. Lives in ${(s.terr.length ? s.terr.join(', ') : 'the sea')}. ${b.day}; ${b.year}. Provoked by ${(b.provoked || []).join(', ') || 'nothing much'}; ${b.nature ? 'by its nature ' + b.nature.k + ': it ' + b.nature.spec : 'turned by ' + (b.calmed || []).join(', ')}. Leaves ${s.drops.map(d => d.k).join(', ')}.`;
        return `<tr><td data-note="${e(note)}">${e(s.n)}</td><td>${e(s.level)}</td><td>${e(s.int)}</td></tr>`;
      }).join('') + '</table>';
    }
    return h;
  };
})();
