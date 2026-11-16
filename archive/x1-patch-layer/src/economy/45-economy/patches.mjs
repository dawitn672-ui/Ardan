// Goods that come from somewhere and go somewhere: the market table shows each good's stock and why (economy.core.js).
export default [
  {
    id: 'ECON-MARKET-WHY',
    blob: 'ardan-core',
    why: 'The market table said only cheap, fair or dear. It now adds the stock in words (famine, scarce, short, ample, glut) and, ' +
      'on hover, why: months of need in store, what was made and used last month, the harvest, armies at war, caravans in and out.',
    edits: [[
      '<td class="${rel<.85?"good":rel>1.2?"bad":"muted"} small hide-s">${rel<.85?"cheap":rel>1.2?"dear":"fair"}</td>',
      '<td class="${rel<.85?"good":rel>1.2?"bad":"muted"} small hide-s" title="${UI.esc(A.ECON?A.ECON.why(home,k):"")}">${rel<.85?"cheap":rel>1.2?"dear":"fair"}${A.ECON&&m.s?`<span class="tiny"> · ${UI.esc(A.ECON.word(m,k))}</span>`:""}</td>',
    ], [
      "h+='</table></div><div class=\"tiny muted\">A load is what a mule carries.",
      "h+='</table></div>'+(A.ECON?A.ECON.card(home):'')+'<div class=\"tiny muted\">A load is what a mule carries.",
    ]],
  },
  {
    id: 'ECON-GOOD-DEPTH',
    blob: 'ardan-core',
    why: 'Each extra load bought or sold moved the price by the market\'s size (its people), the same for grain as for pearls, so ' +
      'fourteen loads of pearls sold into a realm whose rich buy a third of a load a month as freely as grain. The per-load ' +
      'slide now asks for the depth of that good\'s own market (A.mktDepth(rid, k)); found by the exploit test.',
    edits: [
      ['cost+=A.buyPrice(rid,k)*(1+i*.6/A.mktDepth(rid))', 'cost+=A.buyPrice(rid,k)*(1+i*.6/A.mktDepth(rid,k))'],
      ['m.p[k]*=1+n*.6/A.mktDepth(rid)/2', 'm.p[k]*=1+n*.6/A.mktDepth(rid,k)/2'],
      ['got+=A.sellPrice(rid,k)*Math.max(.3,1-i*.6/A.mktDepth(rid))', 'got+=A.sellPrice(rid,k)*Math.max(.3,1-i*.6/A.mktDepth(rid,k))'],
      ['m.p[k]*=Math.max(.5,1-n*.6/A.mktDepth(rid)/2)', 'm.p[k]*=Math.max(.5,1-n*.6/A.mktDepth(rid,k)/2)'],
      ['s+=A.sellPrice(dest,k)*Math.max(.3,1-i*.6/A.mktDepth(dest))', 's+=A.sellPrice(dest,k)*Math.max(.3,1-i*.6/A.mktDepth(dest,k))'],
      ['const c=A.buyPrice(dest,opts.buyBack)*(1+n*.6/A.mktDepth(dest))', 'const c=A.buyPrice(dest,opts.buyBack)*(1+n*.6/A.mktDepth(dest,opts.buyBack))'],
      ['A.mkt(dest).p[opts.buyBack]*=1+n*.3/A.mktDepth(dest)', 'A.mkt(dest).p[opts.buyBack]*=1+n*.3/A.mktDepth(dest,opts.buyBack)'],
    ],
  },
];
