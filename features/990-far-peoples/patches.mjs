// The far peoples in the release's own scenes (990-far-peoples). Two tables in the content blob are keyed by the Known
// World's cultures and faiths and fall back to a plain word for any other: a people's everyday food ("bread") and a
// faith's priest ("the priest"). Each fallback now asks the far peoples' data first; a Known World culture or faith is
// found in the release's own table before it, so its words are unchanged.
export default [
  {
    id: 'FARP-FOOD',
    blob: 'ardan-content',
    why: 'The childhood and family scenes name a people\'s food from a table of the 24 Known World cultures, else "bread". ' +
      'A far culture now eats its own (A.FARP_FOOD, from the lore\'s food of each people).',
    edits: [['food=p=>FOOD[p.cult]||"bread"', 'food=p=>FOOD[p.cult]||A.FARP_FOOD&&A.FARP_FOOD[p.cult]||"bread"']],
  },
  {
    id: 'FARP-PRIEST',
    blob: 'ardan-content',
    why: 'The same scenes name a faith\'s priest from a table of the 19 Known World faiths, else "the priest". A far faith ' +
      'now has its own (A.FARP_FAITH[faith].priest: the examined official, the felt-keeper, the tide-caller ...).',
    edits: [['"REL-19":"an old corsair"})[p.faith]||"the priest"', '"REL-19":"an old corsair"})[p.faith]||A.FARP_FAITH&&A.FARP_FAITH[p.faith]&&A.FARP_FAITH[p.faith].priest||"the priest"']],
  },
];
