// War in the Far Lands: the council of war and the taken home (e-lore.core.js queues both, ctx.fwq; a scene drawn by
// chance without it is dropped).
(function () {
  const only = (p, ctx) => { if (!ctx.fwq) ctx.skip = true; };
  A.defEvents([
    {
      id: 'fw_war_council', title: 'The council of war', w: 0.01, cool: 0,
      cond: (p, C) => C.adult(p) && (C.ruler(p) || C.soldier(p)) && C.atWar(p),
      setup: only,
      text: 'The captains of the host stand round a map of the border with {foe}. {war} is a month old. One wants to strike before the harvest, one wants to dig in at the fords, and the oldest says the war will go as it goes whatever is said in this tent. They wait for your word.',
      choices: [
        { t: 'Strike where their line is thinnest', check: { s: 'tactics', s2: 'command', d: 50 },
          win: { r: 'The captains go out to their men with a plan they can repeat. The armies that answer to you are told to build up and strike.', fx: { fwStance: 'attack', fame: 2, skill: { tactics: 2 } } },
          lose: { r: 'The plan is sound and nobody believes it. The armies are told to strike, and the captains mutter about it.', fx: { fwStance: 'attack', happy: -2, skill: { tactics: 1 } } } },
        { t: 'Hold the fords and let them come to you', r: 'The armies spread along the front and dig in. It will be a long war, and a cheaper one.', fx: { fwStance: 'front', skill: { logistics: 2 }, wil: 1 } },
        { t: 'Leave the war to the generals in the field', r: 'You go back to the accounts. The generals pick their own targets, which is what generals like best.', fx: { fwStance: 'free', happy: 2 } },
      ],
    },
    {
      id: 'fw_home_taken', title: 'New masters', w: 0.01, cool: 0,
      cond: (p, C) => C.adult(p) && !C.ruler(p),
      setup: only,
      text: 'Riders of {newr} come into {place} with a clerk and a new banner. The clerk reads the peace from the well steps: {place} is theirs now. Those who swear stay as they were. Those who will not have until the new moon to be gone to {oldr}.',
      choices: [
        { t: 'Swear to {newr} and stay', req: (p) => !p.mil, r: 'You put your hand on the clerk\'s book with your neighbours. The tax collector who comes in spring has a different accent and the same demands.', fx: { fwSwear: 1, honor: -2, happy: -1 } },
        { t: 'Load a cart and go to {oldr}', r: 'You leave the house as it is and take the road at dawn. The lodging in the capital costs more than the house was worth.', fx: { fwLeave: 1, coinPct: -15, honor: 2, happy: -3 } },
        { t: 'Keep your head down and say nothing', r: 'You swear nothing and pay what they ask. For now nobody comes to ask which banner you keep.', fx: { happy: -2, wil: 1 } },
      ],
    },
  ]);
})();
