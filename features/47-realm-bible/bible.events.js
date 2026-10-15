// The first time a custom of your realm touches you (47-realm-bible): keep it, or defy it and pay for that. The scene's
// words come from the custom's own data (bible.*.data.core.js); after this first meeting it is simply applied.
const RB = (p, ctx) => {
  const B = A.BIBLE, c = ctx && ctx.cid ? B.custom(ctx.cid) : null;
  return c || null;
};

A.defEvents([
  { id: 'rb_custom', trigger: true, cool: 1,
    title: (p, ctx) => { const c = RB(p, ctx); return c ? c.name : 'A custom'; },
    cond: (p, C) => C.adult(p),
    setup: (p, ctx) => {
      // queued with the custom's id; the linter and old saves come without one, so take the first of the realm's
      if (!ctx.cid) { const c = A.BIBLE.mine(p)[0]; if (!c) { ctx.skip = 1; return; } ctx.cid = c.id; }
      if (!A.BIBLE.custom(ctx.cid)) ctx.skip = 1;
    },
    text: (p, ctx) => { const c = RB(p, ctx); return c ? A.BIBLE.fill(p, c.text, ctx) : ''; },
    choices: [
      { t: (p, ctx) => { const c = RB(p, ctx); return (c && c.keepT) || 'Do as is done here'; },
        r: (p, ctx) => { const c = RB(p, ctx); return c ? A.BIBLE.fill(p, c.keep, ctx) : ''; },
        fx: { custom: 'keep' } },
      { t: (p, ctx) => { const c = RB(p, ctx); return (c && c.defy && c.defy.t) || 'Refuse'; },
        r: (p, ctx) => { const c = RB(p, ctx); return c && c.defy ? A.BIBLE.fill(p, c.defy.r, ctx) : ''; },
        fx: (p, ctx) => { const c = RB(p, ctx); if (c && c.defy && c.defy.fx) A.applyFx(p, c.defy.fx, ctx); p.rb = p.rb || {}; if (c && p.rb[c.id]) p.rb[c.id].defied = A.S.year; return ''; } },
    ] },
]);
