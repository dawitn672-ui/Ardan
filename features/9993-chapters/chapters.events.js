// 9993-chapters: the chapter card (queued by chapters.core.js when a stage of life begins) and the house's legacy
// (queued when you go on as your heir). Both are trigger-only. Prefix chp_.
(function () {
const CH = A.CH;
A.defEvents([
  { id: 'chp_card', title: (p) => (CH && p.chap && p.chap.cur ? CH.heading(p.chap.cur) : 'A new chapter'), trigger: true,
    cond: (p, C) => C.age(p) >= 3,
    setup: (p, ctx) => {
      const c = p.chap && p.chap.cur;
      if (!CH || !c || c.n !== ctx.chN || !c.aims.length) { ctx.skip = true; return; }
      ctx.chRecap = CH.recap(p);
      ctx.chStage = CH.STAGES[c.st] || 'A new stage';
      ctx.chAims = CH.aimsText(c);
      ctx.chY = String(c.y0); ctx.chAge = String(c.a0);
      ctx.chA = c.aims[Math.min(2, c.aims.length - 1)].l;
      ctx.chB = c.alt ? c.alt.l : ctx.chA;
    },
    text: (p, ctx) => `${ctx.chRecap ? ctx.chRecap + ' ' : ''}${ctx.chStage} begins, in the year {chY}, at {chAge}. For this chapter of your life you mean to: ${ctx.chAims} The aims stand on the Life tab, and each one met is set down.`,
    choices: [
      { t: 'The third aim: {chA}', r: 'So it is written at the head of the chapter. The rest is yours to write.', fx: { happy: 1 } },
      { t: 'Rather: {chB}', req: (p) => !!(p.chap && p.chap.cur && p.chap.cur.alt), r: 'So it is written instead. The rest is yours to write.', fx: { chapter: 'alt', happy: 1 } },
    ] },
  { id: 'chp_legacy', title: 'What the house carries', trigger: true,
    cond: (p, C) => C.age(p) >= 1,
    setup: (p, ctx) => {
      const ks = CH ? CH.legacyOffer(p) : [];
      if (ks.length < 2) { ctx.skip = true; return; }
      ks.forEach((k, i) => { ctx['lg' + i] = k; ctx['lgT' + i] = CH.LEGACY[k].t; });
      ctx.lgN = String(CH.renown());
      if (ks.length < 3) { ctx.lg2 = ks[0]; ctx.lgT2 = CH.LEGACY[ks[0]].t; }
      ctx.house = (A.S.dynasty && A.S.dynasty.name) || 'the family';
    },
    text: 'The old head of {house} is in the ground, and the house is yours to carry. Its name is worth {lgN} in the mouths of the county. The steward asks what the house should set itself to, so the children after you are born to it.',
    choices: [
      { t: '{lgT0}', r: 'It is entered in the house book, and the house will hold to it.', fx: { legacy: 0 } },
      { t: '{lgT1}', r: 'It is entered in the house book, and the house will hold to it.', fx: { legacy: 1 } },
      { t: '{lgT2}', req: (p, C, ctx) => !!(ctx && ctx.lg2 && ctx.lg2 !== ctx.lg0), r: 'It is entered in the house book, and the house will hold to it.', fx: { legacy: 2 } },
    ] },
]);
})();
