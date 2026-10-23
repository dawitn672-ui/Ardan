// Market towns with distance pricing: the market card names the player's own market town and rates its prices
// (markets.core.js).
export default [
  {
    id: 'MT-MARKET-HERE',
    blob: 'ardan-core',
    why: 'Each realm now has several market towns, each with its own stock and price. The market card named the realm\'s ' +
      'capital and rated each good (cheap, fair, dear) by the realm\'s price; it now names the town the player trades at ' +
      'and rates the price there. Without 66-markets (or before its first month) both read as before.',
    edits: [
      ['The market of ${UI.esc(hr.capital)}', 'The market of ${UI.esc(A.MT&&A.MT.on()?A.MT.name(A.MT.here(pc)):hr.capital)}'],
      ['rel=m.p[k]/G.base', 'rel=(A.MT&&A.MT.on()?A.MT.price(home,k,pc):m.p[k])/G.base'],
    ],
  },
];
