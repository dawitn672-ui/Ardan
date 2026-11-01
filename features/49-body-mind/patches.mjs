// The smallest hooks for 49-body-mind. The systems themselves are in the *.core.js files.
export default [
  {
    id: 'BM-ILLNESS-MONTHS',
    blob: 'ardan-core',
    why: 'A disease was one damage roll at the new year (A.bodyYear) and gone. The roll still decides who falls ill, with ' +
      'what, and how hard (the same draws), but the blow is handed to A.bmFallIll, which strikes a third of it now and ' +
      'spreads the rest over the illness\'s months, where a treatment choice and the medicine skill shape it. In the real ' +
      'source: a sickness record on the person, ticked monthly, instead of an immediate health loss.',
    edits: [[
      'D=GD.DISEASES[k],dmg=A.ri(D.dmg[0],D.dmg[1])*(1.2-A.stat(pc,"sta")/200);if(pc.health=A.clamp(pc.health-dmg,0,mh),',
      'D=GD.DISEASES[k],dmg=A.ri(D.dmg[0],D.dmg[1])*(1.2-A.stat(pc,"sta")/200);if(A.bmFallIll&&A.bmFallIll(pc,k,D,dmg,mh));else if(pc.health=A.clamp(pc.health-dmg,0,mh),',
    ]],
  },
];
