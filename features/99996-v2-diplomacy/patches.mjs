// Step 7 of docs/v2/V2_SPEC.md: the release's treaty dice give way to A.V2.diplomacy.monthTick (diplomacy.core.js).
// Two small edits; everything else is wrappers in the core file.
export default [
  {
    id: 'V2DIP-NO-DRIFT',
    blob: 'ardan-core',
    why: 'A.diplomacyYear: every realm\'s opinion of every other moved by a random -2..+2 each year, a reason nobody could name. With v2 diplomacy on, opinion moves only for named reasons (the slow fade toward 0 stays).',
    edits: [
      ['v+=A.ri(-2,2),r.rel[o.id]', 'v+=A.V2DIP&&A.V2DIP.ON?0:A.ri(-2,2),r.rel[o.id]'],
    ],
  },
  {
    id: 'V2DIP-NO-PCT',
    blob: 'ardan-core',
    why: 'The Realm > Diplomacy header showed trade income as "+N% income". The owner asked for no percentages: say whether trade adds income, in words.',
    edits: [
      ['Trade ${Object.keys(r.pacts.trade).length} (+${Math.round((A.tradeMul(r)-1)*100)}% income)',
        'Trade ${Object.keys(r.pacts.trade).length}${A.tradeMul(r)>1.005?" (adds to your income)":""}'],
    ],
  },
];
