// Variety guard: the event roll uses a 10-year default cooldown and the shape weights from variety.core.js.
export default [
  {
    id: 'VAR-COOLDOWN',
    blob: 'ardan-core',
    why: 'Both event rolls (A.rollEvents, yearly, and A.rollEventsN, monthly) let an event without its own cooldown come back ' +
      'after 6 years. The plan asks for no repeat within 10. The default now reads A.EV_COOL (10); an author-set cool still wins.',
    edits: [['S.year-S.evRecent[id]<(e.cool||6)', 'S.year-S.evRecent[id]<(e.cool||A.EV_COOL||6)', 2]],
  },
  {
    id: 'VAR-SHAPE-WEIGHT',
    blob: 'ardan-core',
    why: 'Nothing stopped two tavern scenes, or three letters, from coming one after another. Both rolls now multiply each ' +
      'event\'s weight by A.evVariety (0.15 for the shape just seen, 0 for a third in a row, 1 otherwise).',
    edits: [
      ['wts.set(e,(e.w||1)*fit)', 'wts.set(e,(e.w||1)*fit*(A.evVariety?A.evVariety(e,pc):1))'],
      ['const e=A.wpick(elig,x=>x.w||1);', 'const e=A.wpick(elig,x=>(x.w||1)*(A.evVariety?A.evVariety(x,pc):1));'],
    ],
  },
  {
    id: 'VAR-POOL-RECENCY',
    blob: 'ardan-core',
    why: 'A.dutyEvent and A.flowEvent pick from small per-job and per-path pools with 3- and 4-year cooldowns, so the same ' +
      'duty came back every 3 years. Both now weigh each candidate by A.evRecency: a quarter if seen in the last 10 years, ' +
      'times the shape guard. The pools are kept; only the preference changes.',
    edits: [['const e=A.wpick(pool,x=>x.w||1);', 'const e=A.wpick(pool,x=>(x.w||1)*(A.evRecency?A.evRecency(x,pc):1));', 2]],
  },
];
