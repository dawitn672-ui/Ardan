// D11-1: the soldier's place on the War tab (docs/design/war.md §14.1; R14). One card: his rank and what he leads in
// the one glossary's words (A.MUSTER.post), his branch and its command, his role, what his branch beats and what beats
// it, and its work in peace. Every description opens on a tap (data-note, 44 points); no numbers but men.
(function () {
  const MU = A.MUSTER;
  const esc = s => (UI.esc ? UI.esc(String(s == null ? '' : s)) : String(s));
  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  MU.cmdName = function (pc) {
    const m = pc.mil;
    if (m.merc) return m.company || 'a free company';
    const c = m.cmd && A.CMD ? A.CMD.get(m.cmd) : null;
    if (c && c.k === 'house') return `${c.name}'s command`;
    return `the crown's command, ${A.realmShort(m.realm)}`;
  };
  UI.placeCard = function (pc) {
    if (!pc || !pc.alive || !pc.mil) return '';
    const m = pc.mil, P = MU.post(pc), B = MU.B(MU.branchOf(pc));
    if (!P || !B) return '';
    const c = m.cmd && A.CMD ? A.CMD.get(m.cmd) : null;
    const name = MU.nameOf(B, c);
    let h = `<div class="card md-place"><div class="row">${UI.icon ? UI.icon('flag', 's') : ''}<span class="tag">Your place</span><b class="grow">${esc(MU.postWords(pc))}</b></div>`;
    h += `<div class="row small"><span class="grow">${esc(name)}, ${esc(MU.cmdName(pc))}</span><button class="small md-why" data-note="${esc(B.desc)}">what they are</button></div>`;
    h += `<div class="row small"><span class="grow muted">Their work in peace: ${esc((B.duties || []).join('; '))}</span><button class="small md-why" data-note="${esc(`What ${B.short} beat: ${B.beats}. What beats them: ${B.loses}.`)}">in the field</button></div>`;
    const R = m.role && MU.R(m.role.k), LD = A.LADDER;
    if (R) h += `<div class="row small"><span class="grow">You are the company's ${esc(LD && LD.roleTitle ? LD.roleTitle(pc) : R.name)}</span><button class="small md-why" data-note="${esc(`The ${R.name}: ${R.adds}. The road on from it: ${(R.line || []).join(', then ')}.`)}">the role</button></div>`;
    // D11-3: the branch's ladder, and what the next board will weigh (in words)
    if (LD && LD.line) {
      const line = LD.line(pc), bm = LD.boardMod(pc);
      if (line.length) h += `<div class="row small"><span class="grow muted">${esc(cap(LD.doesNow(pc)))}</span><button class="small md-why" data-note="${esc(line.map(x => `${x.rank}: ${x.does}`).join('. ') + '.')}">the ladder</button><button class="small md-why" data-note="${esc((bm.why.length ? 'The next board will weigh: ' + bm.why.map(x => x[0]).join('; ') : 'The next board weighs a deed that stands out, steady service and a post falling open') + '.')}">the next rank</button></div>`;
    }
    return h + '</div>';
  };
  {
    try {
      const st = document.createElement('style');
      st.textContent = '.md-place .md-why{min-height:44px;min-width:44px;padding:0 10px}.md-place .row{align-items:center;gap:6px;flex-wrap:wrap}';
      document.head.appendChild(st);
    } catch (e) {}
  }
})();
