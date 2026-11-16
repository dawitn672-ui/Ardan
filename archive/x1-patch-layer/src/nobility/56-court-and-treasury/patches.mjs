// The realm from inside: three small hooks into the release. Everything else is in the *.core.js files. See README.md.
export default [
  {
    id: 'RI-SPEND-NOT-BURN',
    blob: 'ardan-core',
    why: 'A.forcesAI deleted 85% of any AI treasury above three years of income each year, for +1 stability and +1 ' +
      'legitimacy: about 65% of all AI income over 3 worlds x 30 years. The crown now spends it (A.RI.spend in ' +
      'treasury.core.js): sellswords at war, the upkeep of its works and the pay of its council, then drill, walls, ' +
      'roads, granaries, temples, feasts for sullen lords and gold for allies at war, in the order the ruler\'s temper ' +
      'and the court put them; full coffers lower the taxes. Debt is still paid first (WLD-AI-DEBT).',
    edits: [[
      'if(!isPlayer&&r.treasury>r.income*3){const x=Math.round((r.treasury-r.income*3)*.85);r.treasury-=x,r.stability=Math.min(100,r.stability+1),r.legit=Math.min(100,(r.legit||50)+1)}',
      '!isPlayer&&A.RI&&A.RI.spend&&A.RI.spend(r);',
    ]],
  },
  {
    id: 'RI-MONEY-BOOK',
    blob: 'ardan-core',
    why: 'A.moneyYear summed holdings income, stipends, upkeep, the cost of living and children into two numbers and ' +
      'showed none of them. It now reports its parts (A.riAssetLine, A.riMoneyParts) so the Holdings tab can show the ' +
      'year\'s money line by line, next to the new costs (horse, retainers, taxes, ransoms, rebuilding).',
    edits: [[
      'if(P.income){const v=Math.round(P.income*A.rf(.6,1.3));inc+=v}out+=P.upkeep||0}}',
      'if(P.income){const v=Math.round(P.income*A.rf(.6,1.3));inc+=v,A.riAssetLine&&A.riAssetLine(v,0)}out+=P.upkeep||0,A.riAssetLine&&A.riAssetLine(0,P.upkeep||0)}}',
    ], [
      'if(out+=kids*ls.cost*.15,pc.coin+=inc-out,pc.coin<0)',
      'if(out+=kids*ls.cost*.15,A.riMoneyParts&&A.riMoneyParts(pc,inc,out,cost,kids*ls.cost*.15),pc.coin+=inc-out,pc.coin<0)',
    ]],
  },
  {
    id: 'RI-CLAIM-ARMY',
    blob: 'ardan-core',
    why: 'A claimant in a war of succession took a random 30-60% of the realm\'s army, whoever backed them. The share now ' +
      'follows the houses that declare for them (their own house, the claimant\'s faction, houses that hate the crown): ' +
      '22% plus 90% of their share of the realm\'s swords, between 25% and 65% (A.riClaimShare). The player keeps the old roll.',
    edits: [[
      'army:Math.round(r.army*A.rf(.3,.6)),levy:Math.round(r.levy*.4)',
      'army:Math.round(r.army*(A.riClaimShare?A.riClaimShare(r,claimant):A.rf(.3,.6))),levy:Math.round(r.levy*.4)',
    ]],
  },
];
