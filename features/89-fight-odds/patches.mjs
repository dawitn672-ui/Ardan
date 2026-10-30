// 89-fight-odds: the badge on a choice that starts a beast fight. See README.md.
export default [
  {
    id: 'FO-BADGE',
    blob: 'ardan-core',
    why: 'The event modal drew a badge only for a choice with odds (a check or a group fight). A choice whose effect is a beast ' +
      'fight (fx.beast, or a function effect calling A.startDuel/startDuelFront) had none, so the deadliest answer in the scene ' +
      'looked like the one without risk. It now shows the fight\'s chance (UI.fightBadge, from c.fight set in A.eventView); a ' +
      'check whose outcome is a fight shows both, the check\'s odds and then the fight\'s.',
    edits: [[
      'c.odds!=null?`<span class="risk">${c.risk}</span>`:""}</button>`).join("")}</div>`;return h+"</div>"},UI.duelModalBasic=',
      'c.odds!=null?`<span class="risk">${c.risk}</span>${c.fight&&UI.fightBadge?UI.fightBadge(c):""}`:c.fight&&UI.fightBadge?UI.fightBadge(c):""}</button>`).join("")}</div>`;return h+"</div>"},UI.duelModalBasic=',
    ], [
      '${c.odds}% · ${c.risk}</span>`:c.odds!=null?',
      '${c.odds}% · ${c.risk}</span>${c.fight&&UI.fightBadge?UI.fightBadge(c):""}`:c.odds!=null?',
    ]],
  },
];
