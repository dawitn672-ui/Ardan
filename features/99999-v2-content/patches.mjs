// 99999-v2-content: release scenes that reached the wrong life (playtest 1, #11). Each find is checked against the build
// (count 1).
export default [
  {
    id: 'V2C-UNDERCUT-MASTER',
    blob: 'ardan-content',
    why: 'du_gd_undercut ("Someone is undercutting you ... paying Hamo to ruin you") had no rank gate, so a 13-year-old ' +
      'apprentice with no shop of his own was told his trade was being ruined. Selling at a price is a master\'s business: ' +
      'the scene now needs rank 2 (a master) of a guild career.',
    edits: [['duty:["guild"],title:"Someone is undercutting you"', 'duty:["guild"],minR:2,title:"Someone is undercutting you"']],
  },
  {
    id: 'V2C-CARAVAN-MASTER',
    blob: 'ardan-content',
    why: 'du_gd_caravan ("Your caravan from the south is ten days late") came to an apprentice merchant, who owns no ' +
      'caravan. It needs rank 2 of the merchant career, as the loan scene needs rank 3.',
    edits: [['duty:["merchant"],title:"The caravan is late"', 'duty:["merchant"],minR:2,title:"The caravan is late"']],
  },
  {
    id: 'V2C-NO-LATIN',
    blob: 'ardan-content',
    why: 'fl_st_exam named Latin, which Ardan does not have. Its learned tongue is Old Solen (GD.LANG_LIST).',
    edits: [['scholars twice a year: Latin, law', 'scholars twice a year: Old Solen, law']],
  },
  {
    id: 'V2C-SCHOLAR-WORK',
    blob: 'ardan-content',
    why: 'fl_st_master ("An old scholar") left a student with under 30 suns one live choice, "You cannot afford it", ' +
      'with the real one out of reach (playtest 1, #19). A poor student may now work off part of the rent: less ' +
      'learning than paying, and it costs his evenings and some health.',
    edits: [['{t:"You cannot afford it",r:"He shrugs and goes back to his books.",fx:{}}',
      '{t:"Offer to work off his rent instead",req:p=>p.coin<30,r:"You carry his water, sweep his stair and copy his letters, and in the gaps he teaches you. It is half a schooling, paid for in sleep.",fx:{skill:{learning:3},int:1,health:-3,need:{rest:-12},them:{type:"mentor",op:20}}},{t:"You cannot afford it",r:"He shrugs and goes back to his books.",fx:{}}']],
  },
  {
    id: 'V2C-TAVERN-ROUND-ADULT',
    blob: 'ardan-content',
    why: 'bd_lucky_escape offered "Laugh, and buy the whole tavern a drink (5 suns)" from 12, so a penniless 14-year-old saw ' +
      'it on the card as an option out of reach. Standing a round is a grown man\'s choice: it needs 16 years as well as ' +
      'the coin. (9998-stakes shows a locked row only for a requirement it can read, so a child no longer sees it.)',
    edits: [['t:"Laugh, and buy the whole tavern a drink (5 suns)",req:p=>p.coin>=5,', 't:"Laugh, and buy the whole tavern a drink (5 suns)",req:p=>p.coin>=5&&A.age(p)>=16,']],
  },
];
