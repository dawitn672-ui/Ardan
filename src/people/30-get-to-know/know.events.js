// "Get to know" as a scene. Queued by A.getToKnow with ctx.pid; A.KNOW.setup reads the person, sets each approach's
// difficulty (ctx.gk_*) and, for a sharp eye, a reading of them (ctx.read).
(function () {
const K = () => A.KNOW;
const meet = (lo, hi, note, extra) => (p, ctx) => { if (extra) A.applyFx(p, extra, ctx); return K().meet(p, ctx, A.ri(lo, hi), typeof note === 'function' ? note(ctx) : note); };

A.defEvents([
  { id: 'gk_meet', title: 'A first meeting', trigger: true,
    cond: (p, C) => !C.prison(p),
    setup: (p, ctx) => K().setup(p, ctx),
    text: 'You find {them} in {where}, {doing}.{read}',
    choices: [
      { t: 'Ask about {khis} affairs, and listen', check: { s: 'persuasion', s2: 'ins', d: 45, dctx: 'gk_ask' },
        win: { r: '{them} talks for an hour and seems surprised, at the end, to have enjoyed it.', fx: meet(22, 34, 'You asked, and listened') },
        lose: { r: '{khe} answers in single words, and soon finds a reason to be elsewhere.', fx: meet(0, 8, `Your questions went unanswered`) } },
      { t: 'Tell a story of your own', check: { s: 'persuasion', s2: 'int', d: 45, dctx: 'gk_story' },
        win: { r: '{khe} laughs in the right place, and then tells one back. It is a better story than yours.', fx: meet(20, 32, 'You traded stories') },
        lose: { r: 'You hear yourself going on too long. {them} is polite about it, which is worse.', fx: meet(-2, 6, 'You talked too much') } },
      { t: 'Offer help with {trouble}', check: { s: 'persuasion', s2: 'wil', d: 40, dctx: 'gk_help' },
        win: { r: '{khe} looks at you for a moment, then takes the help, and does not forget it.', fx: meet(30, 42, ctx => 'You helped with ' + ctx.trouble, { coin: -10 }) },
        lose: { r: '{them} stiffens. {khe} did not ask for your help, {khe} says, and does not need it.', fx: meet(-10, 0, 'You offered help that was not wanted') } },
      { t: 'Keep it short and proper', check: { s: 'etiquette', s2: 'ins', d: 35, dctx: 'gk_proper' },
        win: { r: 'A few right words, and you take your leave before you outstay them. {khe} remembers your name.', fx: meet(12, 20, 'You were courteous') },
        lose: { r: 'Stiff on both sides. You part with a nod and nothing much else.', fx: meet(2, 8, 'You met, briefly') } },
    ] },
]);
})();
