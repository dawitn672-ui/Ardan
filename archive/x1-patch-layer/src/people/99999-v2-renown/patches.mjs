export default [
  {
    id: 'RN-MIL',
    blob: 'ardan-core',
    why: 'The army\'s promotion board barred the way until the merit counter reached the next rank\'s number, then rolled about an even chance each quarter: a counter that fills is linear promotion (V2_SPEC complaint 15). V2 rolls promotionCheck(): a monthly hazard from the vacancy, the standout deed of the last 18 months against what the rank asks, steady service and a patron, which can skip a rank. In the source: drop the merit surplus factor and roll the v2 hazard (scaled by the board\'s other factors) where the board rolls its chance. The merit row itself becomes a soft deed row in A.promoBoard (b-promo.core.js).',
    edits: [
      ['chance*=1+Math.min(.6,(m.merit-next.merit)/Math.max(30,next.merit))', 'chance*=A.RN&&A.RN.on?1:1+Math.min(.6,(m.merit-next.merit)/Math.max(30,next.merit))'],
      ['A.chance(A.clamp(chance,.02,.92))){m.rank++', '(A.RN&&A.RN.on?A.RN.milRoll(pc,chance,board):A.chance(A.clamp(chance,.02,.92)))){m.rank++'],
    ],
  },
  {
    id: 'RN-JOB',
    blob: 'ardan-core',
    why: 'A post\'s promotion waited for the merit counter (30r(1+0.55r), filled month by month by performance), then came at about 18% a month: linear. V2 rolls promotionCheck() each month on the deeds and months of good service of that career\'s field, scaled by the old chance\'s factors (performance, patron, the superior). In the source: roll the v2 hazard where pathMonth rolls the post\'s chance. The merit row becomes a soft deed row in A.jobBoard (b-promo.core.js).',
    edits: [['A.chance(A.clamp(ch,.03,.6))&&A.jobRankUp(pc)', '(A.RN&&A.RN.on?A.RN.jobRoll(pc,ch,board):A.chance(A.clamp(ch,.03,.6)))&&A.jobRankUp(pc)']],
  },
  {
    id: 'RN-WORDS',
    blob: 'ardan-core',
    why: 'Merit was shown as a counter ("Merit 112 / 30") in the year\'s summary and explained as a bar to meet; it no longer decides promotion. In the source: say where you stand for the next rank in words, and say how the board decides.',
    edits: [
      ['add(`Merit ${Math.round(pc.mil.merit)}/${GD.MIL[pc.mil.rank+1].merit}`,"")', 'add(A.RN&&A.RN.on?`For ${GD.MIL[pc.mil.rank+1].title}: ${A.RN.standWords(pc,"mil",pc.mil.rank)}`:`Merit ${Math.round(pc.mil.merit)}/${GD.MIL[pc.mil.rank+1].merit}`,"")'],
      ['<div class="tiny muted">Merit comes from battles your division wins, ground it takes, missions and war games. Meeting the bar makes promotion likely each year, not certain.</div>',
        '<div class="tiny muted">The board sits every three months. A deed that beat the odds in front of the army counts most; steady service and a patron help; a post must fall open. It can come twice in a year, or not for years, and a great deed can carry you past a rank.</div>'],
      ['Merit from battles, missions and ground taken moves you up the ladder; the board meets every three months.', 'Deeds in battle and on missions, seen by the army, move you up the ladder; the board meets every three months, and a post must fall open.'],
      ['Your post is a ladder. Merit earned month by month, skill, reputation and time move you up;', 'Your post is a ladder. Work that stands out, skill, reputation, a patron and a post falling open move you up;'],
      // the army card on the Path tab, the war room's line, and the superior's answer: no counter
      ['${m.kills} enemy dead · merit ${Math.round(m.merit)}</div>', '${m.kills} enemy dead${A.RN&&A.RN.on?"":` · merit ${Math.round(m.merit)}`}</div>'],
      [' · merit ${Math.round(pc.mil.merit)} — your promotion board is in the', '${A.RN&&A.RN.on?"":` · merit ${Math.round(pc.mil.merit)}`} — your promotion board is in the'],
      ['"Not yet. Earn it." (merit ${Math.round(pc.mil.merit)}/${next.merit})', '"Not yet. Earn it."${A.RN&&A.RN.on?"":` (merit ${Math.round(pc.mil.merit)}/${next.merit})`}'],
    ],
  },
];
