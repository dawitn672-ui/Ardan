// 994-careers: the scenes careers.core.js queues. A failed claim (cr_coup_fate, cr_coup_pardon, cr_coup_bounty), a
// commoner raised (cr_knighted, cr_fief), and the rung above the top (cr_honour).
(function () {
  const CAR = () => A.CAR || {};
  const ruler = (p, ctx) => { const ru = ctx && ctx.pid ? A.P(ctx.pid) : null; return ru && ru.alive ? ru : null; };
  const crownOf = (p, ctx) => { const ru = ruler(p, ctx), r = A.realm(p.realm); return ru && r ? A.rulerStyle(ru, r) : 'The crown'; };
  const exile = (p, ctx) => {
    p.flags.cr_crown = ctx.rid || p.realm;
    A.exile(p);
    p.flags.cr_exile = A.S.year;
    CAR().bountyLater && CAR().bountyLater(p);
    (p.deeds = p.deeds || []).push({ y: A.S.year, t: `Fled ${ctx.crown || 'the realm'} after a claim to the throne failed` });
    return '';
  };
  const TOP = {
    command: { title: 'A command of your own', text: '{crown} sends for you after the spring muster. The march along the border has had no warden since the old one died, and the lords there obey nobody they have not seen fight. "It is yours, if you want it. The men, the forts, the quarrels. All of it."',
      take: 'Take the wardenship of the march', takeR: 'You ride north with a seal and a list of forts. The border lords come one by one to see the new warden. Most of them stay to dinner.',
      ask: 'Ask for the high command instead', askR: { win: 'The crown hears you out and gives you the senior command, with a look that says it will be watching.', lose: 'The crown hears you out, and gives the march to another. A colder year at court follows.' } },
    guild: { title: 'The chain of office', text: 'The masters of your trade meet in the long room over the market and vote you master of the guild. The chain is heavy, the dinner is long, and the first quarrel arrives before the cheese: two houses, one apprentice, and a broken indenture.',
      take: 'Take the chain and pay for the feast', takeR: 'The feast costs what a good year earns. For a year after it, nobody in the trade does anything without asking you first.',
      ask: 'Take it, and settle the quarrel tonight', askR: { win: 'You settle it before the cheese is cleared. The masters drink to a guild that has a head again.', lose: 'You settle it badly. One house walks out, and the guild has two heads by spring.' } },
    faith: { title: 'A see falls vacant', text: 'The old bishop dies in the Lent fast. The chapter sits for nine days and sends you its choice: you, if you will have it. The see has forty parishes, a ruined palace and a debt to the bankers that nobody will speak of.',
      take: 'Accept the mitre and the debt', takeR: 'The mitre fits badly and the debt fits worse. In two years the palace roof is mended and the bankers are paid.',
      ask: 'Accept, and make the bankers wait', askR: { win: 'You preach one sermon on usury. The bankers forgive a third of the debt and send a gift for the altar.', lose: 'The bankers do not wait. They go to the crown, and the crown asks you why.' } },
  };
  const topOf = ctx => TOP[ctx && ctx.top] || TOP.command;

  A.defEvents([
    // ---- a failed claim -----------------------------------------------------------------------------------------
    {
      id: 'cr_coup_fate', title: 'The claim is lost', trigger: true, once: false,
      cond: (p, C) => C.adult(p) && C.flag(p, 'cr_claim_lost'),
      setup: (p, ctx) => { ctx.crown = ctx.crown || 'the crown'; if (p.prison) ctx.skip = 1; },
      text: 'The war is over, and you lost it. The lords who swore to you have sworn again, to {crown}, and the crown\'s riders are two valleys away. The commission, the seat and the titles went with the war. A man who brings your head to the capital can name his price.',
      choices: [
        { t: 'Ride for the border tonight', check: { s: 'survival', s2: 'spd', d: 50 },
          win: { r: 'Three nights in the hills, a ford nobody watches, a farmer who asks no questions. You cross with a horse, a sword and a price on your head.', fx: (p, ctx) => exile(p, ctx) },
          lose: { r: 'The ford is watched. They take you at the water with your boots still dry.', fx: { punish: 'treason' } } },
        { t: 'Give yourself up and plead for your life', check: { s: 'persuasion', s2: 'wil', d: 55 },
          win: { r: 'You kneel in chains in the great hall and say it plainly. The crown wants a merciful name more than your head. You keep it, and lose nearly everything else.',
            fx: (p) => { const f = Math.round((p.coin || 0) * 0.6); p.coin -= f; A.log(`The crown takes ${A.coin(f)} of your fortune as the price of your life.`, 'bad'); A.imprison(p, A.ri(3, 6), 'treason, pardoned'); return ''; } },
          lose: { r: 'The crown hears you out, and signs the warrant.', fx: { punish: 'treason' } } },
        { t: 'Hold the last keep and die a claimant', r: 'You hold the gate for a day and a night with the forty who stayed. The songs about it are not sung where the crown can hear.',
          fx: (p) => { A.fame(p, 10); (p.deeds = p.deeds || []).push({ y: A.S.year, t: 'Died holding the last keep of a lost claim' }); A.kill(p, 'the crown\'s men, at the last keep of a lost claim'); return ''; } },
      ],
    },
    {
      id: 'cr_coup_pardon', title: 'The terms', trigger: true,
      cond: (p, C) => C.adult(p) && C.flag(p, 'cr_claim_lost'),
      setup: (p, ctx) => { ctx.crown = ctx.crown || 'the crown'; ctx.fine = A.coin(Math.round((p.coin || 0) * 0.4)); if (p.prison) ctx.skip = 1; },
      text: 'The war ends in a bargain: your faction kneels, and you keep your head. The crown\'s herald reads the terms in the square. You give up every commission and seat you hold, you pay {fine}, and you live where the crown can see you. Or you can refuse them, and go.',
      choices: [
        { t: 'Accept the terms and kneel', r: 'You kneel in the mud of the square. The crown has your money and your word, and its men watch your door.',
          fx: (p, ctx) => { CAR().closeCareer(p, 'the claim'); const f = Math.round((p.coin || 0) * 0.4); p.coin -= f; p.flags.cr_watched = A.S.year; p.happy = A.clamp((p.happy || 0) - 10, 0, 100); return ''; } },
        { t: 'Refuse the terms and go abroad', r: 'You keep your money and lose your country. The herald reads your name again, this time as an outlaw.',
          fx: (p, ctx) => { CAR().closeCareer(p, 'the claim'); return exile(p, ctx); } },
      ],
    },
    {
      id: 'cr_coup_bounty', title: 'The crown\'s warrant', trigger: true,
      cond: (p, C) => C.adult(p) && C.flag(p, 'cr_exile'),
      setup: (p, ctx) => { ctx.crown = ctx.crown || 'the crown'; ctx.price = A.coin(Math.max(200, Math.round((p.coin || 0) * 0.15))); if (p.prison) ctx.skip = 1; },
      text: 'A man at the inn has been asking about you, and now he sits down at your table. He has a warrant from {crown} with your name on it and a sum written under the seal. "I can go home with you," he says, "or with something that weighs as much."',
      choices: [
        { t: 'Pay him to forget your face ({price})', r: 'He counts it twice and goes. Others will come; he has told you that much for free.',
          fx: (p) => { const f = Math.max(200, Math.round((p.coin || 0) * 0.15)); p.coin = Math.max(0, p.coin - f); return ''; } },
        { t: 'Settle it in the yard', r: 'You go out into the yard together.',
          fx: (p) => { const f = A.makeFoe({ tier: 3, realm: p.realm, title: 'a hunter of men' }); A.startDuelFront(p, f, { kind: 'duel', place: 'the inn yard', title: 'The crown\'s warrant' }); return ''; } },
        { t: 'Leave before dawn and keep moving', r: 'You leave by the stable door. Another town, another name, another inn.',
          fx: (p, ctx) => { A.exile(p); p.happy = A.clamp((p.happy || 0) - 6, 0, 100); return ''; } },
      ],
    },

    // ---- raised for merit ---------------------------------------------------------------------------------------
    {
      id: 'cr_knighted', title: 'The flat of the sword', trigger: true,
      cond: (p, C) => C.adult(p) && !C.noble(p) && !C.ruler(p),
      setup: (p, ctx) => { const ru = ruler(p, ctx); if (!ru) { ctx.skip = 1; return; } ctx.crownT = crownOf(p, ctx); },
      text: 'After the feast of the year\'s turn the steward calls your name in the great hall, in front of men who were born to it. {crownT} stands with a drawn sword. You came up from nothing, the herald says, and the realm has had the use of you. Kneel, and rise a knight.',
      choices: [
        { t: 'Kneel and rise a knight', r: 'The blade touches one shoulder and the other. You rise with a new name and three hundred suns a year, and some of the old families stop speaking when you pass.',
          fx: (p, ctx) => { CAR().knight(p); const ru = ruler(p, ctx); if (ru && A.addOp) A.addOp(ru, p, 8); p.honor = A.clamp((p.honor || 0) + 4, 0, 100); return ''; } },
        { t: 'Thank the crown, and stay what you were born', r: 'A murmur goes round the hall. The crown smiles thinly. In the market they tell it for years: the one who would not kneel for a title.',
          fx: (p, ctx) => { p.flags.cr_knight_no = A.S.year; A.fame(p, 4); const ru = ruler(p, ctx); if (ru && A.addOp) A.addOp(ru, p, -8); return ''; } },
      ],
    },
    {
      id: 'cr_fief', title: 'Land of your own', trigger: true,
      cond: (p, C) => C.adult(p) && C.noble(p) && !C.ruler(p),
      setup: (p, ctx) => { const ru = ruler(p, ctx); if (!ru || !p.noble) { ctx.skip = 1; return; } ctx.crownT = crownOf(p, ctx); ctx.place = A.provName ? A.provName(p.home) : 'your country'; },
      text: 'The lord of {place} dies without heirs, and his land comes back to the crown. {crownT} writes to you in a clerk\'s hand and signs it in its own: the manor, the mill and nine villages, if you will hold them for the crown and send their men when called.',
      choices: [
        { t: 'Take the fief and its levies', r: 'You ride the bounds in the spring. Nine villages come out to see their new lord, and three of them have a lawsuit ready.',
          fx: (p, ctx) => { CAR().enfeoff(p); A.fame(p, 4); return ''; } },
        { t: 'Ask for a pension in silver instead', check: { s: 'persuasion', s2: 'int', d: 45 },
          win: { r: 'The crown would rather keep the land. You get two thousand suns a year for life, and no lawsuits.', fx: (p) => { p.coin += 2000; p.flags.cr_pension = A.S.year; return ''; } },
          lose: { r: 'The crown does not haggle with its own gifts. The fief goes to someone else.', fx: (p, ctx) => { const ru = ruler(p, ctx); if (ru && A.addOp) A.addOp(ru, p, -10); return ''; } } },
        { t: 'Decline: a soldier has no use for mills', r: 'The crown is surprised, then pleased. The land goes to a cousin of the chancellor, and your name stays clean at court.',
          fx: (p, ctx) => { const ru = ruler(p, ctx); if (ru && A.addOp) A.addOp(ru, p, 6); p.honor = A.clamp((p.honor || 0) + 3, 0, 100); return ''; } },
      ],
    },

    // ---- above the top of the ladder ----------------------------------------------------------------------------
    {
      id: 'cr_honour', title: (p, ctx) => topOf(ctx).title, trigger: true,
      cond: (p, C) => C.adult(p) && !C.ruler(p),
      setup: (p, ctx) => { if (!ruler(p, ctx)) { ctx.skip = 1; return; } ctx.crown = crownOf(p, ctx); if (!TOP[ctx.top]) ctx.top = 'command'; },
      text: (p, ctx) => topOf(ctx).text,
      choices: [
        { t: (p, ctx) => topOf(ctx).take, r: '',
          fx: (p, ctx) => {
            p.flags['cr_' + (ctx.top || 'command')] = A.S.year; A.fame(p, 6);
            if (ctx.top === 'guild') p.coin = Math.max(0, p.coin - Math.max(1500, Math.round((p.coin || 0) * 0.05)));
            else if (ctx.top === 'faith') p.coin = Math.max(0, p.coin - Math.max(1000, Math.round((p.coin || 0) * 0.08)));
            else p.happy = A.clamp((p.happy || 0) - 4, 0, 100);
            (p.deeds = p.deeds || []).push({ y: A.S.year, t: ctx.top === 'guild' ? 'Master of the guild' : ctx.top === 'faith' ? 'Raised to a see' : 'Warden of the march' });
            return topOf(ctx).takeR;
          } },
        { t: (p, ctx) => topOf(ctx).ask, check: { s: 'persuasion', s2: 'wil', d: 55 },
          win: { r: '', fx: (p, ctx) => {
            p.flags['cr_' + (ctx.top || 'command')] = A.S.year; A.fame(p, 8);
            if (ctx.top === 'command' && p.mil && GD.MIL[p.mil.rank + 1]) p.mil.merit = Math.max(p.mil.merit || 0, GD.MIL[p.mil.rank + 1].merit);
            (p.deeds = p.deeds || []).push({ y: A.S.year, t: ctx.top === 'guild' ? 'Master of the guild' : ctx.top === 'faith' ? 'Raised to a see' : 'Given the senior command' });
            return topOf(ctx).askR.win;
          } },
          lose: { r: '', fx: (p, ctx) => { const ru = ruler(p, ctx); if (ru && A.addOp) A.addOp(ru, p, -12); A.fame(p, -2); return topOf(ctx).askR.lose; } } },
        { t: 'Decline, and keep the work you have', r: 'You send your thanks and stay where you are. Somebody younger takes it, and is grateful to you for the chance.',
          fx: (p) => { p.happy = A.clamp((p.happy || 0) + 3, 0, 100); return ''; } },
      ],
    },
  ]);
})();
