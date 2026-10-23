// Every rank's battle moves the war: the soldier's line battle reports its grade to the map fight (rankbattles.core.js).
export default [
  {
    id: 'RB-LINE-RESULT',
    blob: 'ardan-core',
    why: 'A soldier\'s line battle nudged its war-map fight by a fixed amount, which never changed a result in 30 measured ' +
      'fights. Its grade (triumph, success, mixed, failure) now becomes a performance that moves both sides\' order (A.rankResult).',
    edits: [[
      'm.wsKey&&A.wsNudge&&A.wsNudge(m.wsKey,m.result==="triumph"||m.result==="success",m.result==="triumph"?.6:.35)',
      'm.wsKey&&(A.rankResult?A.rankResult(m.wsKey,"line",m):A.wsNudge&&A.wsNudge(m.wsKey,m.result==="triumph"||m.result==="success",m.result==="triumph"?.6:.35))',
    ]],
  },
];
