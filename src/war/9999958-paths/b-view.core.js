// D11+: the road on the War tab. What this rung trains (in words, with his aptitude for each), what proves a man here,
// what it opens, what the next rung wants and how he stands for it, his specialism on the road. Pure; notes open on a
// tap (44 points); no numbers and no letters.
(function () {
  const PA = A.PATHS, MU = A.MUSTER;
  const esc = s => (UI.esc ? UI.esc(String(s == null ? '' : s)) : String(s));
  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const list = a => (a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
  UI.pathCard = function (pc) {
    if (!pc || !pc.alive || !pc.mil || pc.mil.merc) return '';
    const P = PA.of(pc), t = PA.tier(pc);
    if (!P || !t) return '';
    const S = A.SK, idx = PA.tierIdx(pc);
    let h = `<div class="card pa-card"><div class="row">${UI.icon ? UI.icon('flag', 's') : ''}<span class="tag">Your road</span><b class="grow">${esc(cap(P.name))}</b></div>`;
    const plan = PA.plan(pc).map(x => PA.skillWords(pc, x.k));
    h += `<div class="row small"><span class="grow">At this rung it trains ${esc(list(plan))}</span><button class="small pa-why" data-note="${esc('A little of every month goes to it, more to what you have a gift for and less to what comes slowly. A teacher, a rival and real work go further.')}">how</button></div>`;
    if (t.trial) h += `<div class="row small"><span class="grow muted">What proves a man here: ${esc(t.trial[1])}</span><button class="small pa-why" data-note="${esc(`When you stand at the edge of a new rank in ${S ? S.name(t.trial[0]).toLowerCase() : t.trial[0]}, with all it asks grasped, the trial is set. Standing it is the deed the rank asks.`)}">the trial</button></div>`;
    const next = PA.wants(pc, idx + 1);
    if (next.length && idx < 4) {
      const stand = next.map(k => { const w = A.SK2 ? A.SK2.label(pc, k, { bare: true }) : ''; return `${S ? S.name(k).toLowerCase() : k}: ${w}${PA.talentWord(pc, k) ? ', ' + PA.talentWord(pc, k) : ''}`; });
      h += `<div class="row small"><span class="grow">The next rung wants ${esc(list(next.map(k => S ? S.name(k).toLowerCase() : k)))}</span><button class="small pa-why" data-note="${esc(`Where you stand: ${stand.join('; ')}.${PA.trialsAt(pc, idx) ? ' You have stood this rung\'s trial.' : ''}`)}">where you stand</button></div>`;
    }
    const sp = PA.specFor(pc);
    if (sp && S) {
      const have = S.specsOf(pc, S.canon(sp[0])[0]) || [];
      h += `<div class="row small"><span class="grow muted">${have.length ? `Your way with the ${esc(S.name(sp[0]).toLowerCase())}: ${esc(have.map(id => S.specName(S.canon(sp[0])[0], id)).join(', '))}` : `The road leads a man of your way to ${esc(S.specName(S.canon(sp[0])[0], sp[1]))}`}</span></div>`;
    }
    if (t.opens) { const R = MU.R(t.opens); if (R) h += `<div class="row small"><span class="grow muted">This rung opens the ${esc(R.name)}'s work</span><button class="small pa-why" data-note="${esc(`The ${R.name}: ${R.adds}. A captain offers it to a man who has the skill for it (${R.say}).`)}">the role</button></div>`; }
    return h + '</div>';
  };
  {
    try {
      const st = document.createElement('style');
      st.textContent = '.pa-card .pa-why{min-height:44px;min-width:44px;padding:0 10px}.pa-card .row{align-items:center;gap:6px;flex-wrap:wrap}';
      document.head.appendChild(st);
    } catch (e) {}
  }
})();
