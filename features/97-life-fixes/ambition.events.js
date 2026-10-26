// 97-life-fixes: the choice of an ambition (c-ambition.core.js queues it at coming of age, at 35 and at a first reign).
// The offers are worked out in setup from the life as it stands (A.LF.ambOffer), ranked without a draw, so whoever
// looks at the scene first sees the same three. Each choice sets p.amb = { k, y }, the field C.ambition reads.
(function () {
  const L = () => A.LF;
  const offer = (ctx, i) => (ctx && Array.isArray(ctx.amb) ? ctx.amb[i] : null);
  const label = (p, ctx, i) => {
    const k = offer(ctx, i), D = k && L().AMB[k];
    if (!D) return '';
    const cur = p.amb && p.amb.k === k && !p.amb.done;
    return cur ? 'Hold to it: ' + D.name.charAt(0).toLowerCase() + D.name.slice(1) : D.t;
  };
  const take = i => (p, ctx) => { L().setAmb(p, offer(ctx, i)); return ''; };
  const said = i => (p, ctx) => {
    const k = offer(ctx, i), D = k && L().AMB[k];
    if (!D) return 'You will see what comes.';
    let step = '';
    try { step = D.step(p); } catch (e) { step = ''; }
    return `So that is what it is for. ${step}`.trim();
  };
  const slot = i => ({
    t: (p, ctx) => label(p, ctx, i),
    req: (p, C, ctx) => !!offer(ctx, i),
    r: said(i),
    fx: take(i),
  });
  A.defEvents([
    { id: 'lfx_amb_choose', trigger: true, title: (p, ctx) => (ctx && ctx.when === 'reign' ? 'What the crown is for' : ctx && ctx.when === 'mid' ? 'Half a life' : 'What you want'),
      setup: (p, ctx) => { ctx.when = ctx.when || 'young'; ctx.amb = L().ambOffer(p, ctx.when); if (!ctx.amb.length) ctx.skip = 1; },
      text: (p, ctx) => ctx.when === 'reign'
        ? 'The crown is heavier than it looks. In the first quiet hour of your reign, with the hall cleared and the candles low, you ask yourself what it is for. Every ruler is remembered for one thing, if at all.'
        : ctx.when === 'mid'
          ? 'Half your life is behind you, more or less. You have done some of what you meant to and not the rest. Lying awake one night, you take stock of what the remaining years are for.'
          : 'By the law of your people you are grown. The question your elders asked at every feast has stopped being a joke: what do you mean to make of your life? It is easier to answer now than it will ever be again.',
      choices: [slot(0), slot(1), slot(2),
        { t: 'Take life as it comes', r: 'You will see what comes. Most people do.', fx: p => { L().setAmb(p, null); return ''; } }] },
  ]);
})();
