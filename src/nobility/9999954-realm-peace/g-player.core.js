// W1-6 part g: the player's part (D-103). He decides only his own choices: a ruler judges a private war brought to him
// (pe_judge); a man with access to the king is approached by plotters (pe_coup: join, keep silent, or tell the crown);
// a ruler answers a league's petition on the release's card (part b answers a refusal by the league's own reasons).
// He reads the realm's stability as a word with its reasons, opening on a press (descriptions open on click, never on
// hover; no percentages): UI.peaceNote(r) gives the note's text.
(function () {
  const PE = A.PAX;
  if (!PE) return;
  (A.FX_EXTRA = A.FX_EXTRA || []).push('peCoup', 'peJudge');
  A.addStage('A.applyFx', 'realm-peace', baseFx => function (pc, fx, ctx) {
    const out = baseFx.apply(this, arguments);
    try {
      if (!fx || typeof fx !== 'object' || !pc || pc.id !== A.S.pc || !ctx) return out;
      if (fx.peCoup && ctx.pk) PE.pcAnswer(ctx.pk, fx.peCoup);
      if (fx.peJudge && ctx.fq) PE.pcJudge(ctx.fq, fx.peJudge);
    } catch (e) { console.error('[peace] fx', e); }
    return out;
  });
  // a card left unanswered (dismissed): the plot goes on without him; the quarrel is left unheard
  A.onMonth.push(function () {
    try {
      const S = A.S;
      if (!S || !Array.isArray(S.plots)) return;
      for (const P of S.plots) if (P.wait && !(S.queue || []).some(q => q && q.ev === 'pe_coup' && q.ctx && q.ctx.pk === P.id)) {
        P.wait = (P.wait || 0) + 1;
        if (P.wait > 2) P.wait = 0;
      }
    } catch (e) { console.error('[peace] wait', e); }
  });

  // ---------------------------------------------------------------- the stability note (words, no numbers)
  const SIZE = v => { const a = Math.abs(v); return a >= 8 ? 'greatly' : a >= 4 ? 'much' : a >= 1.5 ? 'somewhat' : 'a little'; };
  PE.noteText = function (r) {
    if (!r) return '';
    const w = PE.word(r.stability), P = PE.reasons(r).filter(x => x.k !== 'custom').sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
    const up = P.filter(x => x.v > 0).slice(0, 3).map(x => `${x.label} (${SIZE(x.v)})`), dn = P.filter(x => x.v < 0).slice(0, 3).map(x => `${x.label} (${SIZE(x.v)})`);
    const L = LORE.realms && LORE.realms[r.id], old = L && L.stability ? L.stability : 'steady';
    const t = old === 'firm' ? 'an old and firm' : /^[aeiou]/i.test(old) ? 'an ' + old : 'a ' + old;
    return `${PE.cap(A.realmShort(r.id))} is ${w}: ${t} realm by its temper.` +
      (up.length ? ` Holding it up: ${up.join('; ')}.` : '') + (dn.length ? ` Pulling it down: ${dn.join('; ')}.` : '');
  };
  UI.peaceNote = r => PE.noteText(r);
})();
