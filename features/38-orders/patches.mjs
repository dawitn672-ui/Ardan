// Generals with a temper: A.armyThink reads four dials from the army's general (A.GENERALS, orders.core.js).
// A steady general's dials are 1, 1/3, 1 and 1, which is the release's army.
export default [
  {
    id: 'GO-ARMY-TEMPER',
    blob: 'ardan-core',
    why: 'Every AI army thought alike: the odds an attack had to reach, the odds at which it took the offensive, and the third of ' +
      'its divisions it sent at once, and the rest and planning a division needed before it attacked, were fixed. They now come from the general\'s temper (A.GENERALS.need, spear, prep and weak): ' +
      'a bold general attacks at worse odds, sooner, with half his divisions, a cautious one wants better odds and rested men and sends fewer, a ' +
      'cunning one is drawn to undefended provinces and kept off forts.',
    edits: [
      ['a.stance=k==="attack"||k==="free"&&ratio>1.15?"attack":"defend"', 'a.stance=k==="attack"||k==="free"&&ratio>1.15*A.GENERALS.need(a)?"attack":"defend"'],
      ['need=(k==="attack"?1.05:ratio>1.15?1.25:1.6)-Math.min(.45,Math.max(0,quiet-30)/200)', 'need=((k==="attack"?1.05:ratio>1.15?1.25:1.6)-Math.min(.45,Math.max(0,quiet-30)/200))*A.GENERALS.need(a)'],
      ['+(def<1?25:0)+Math.min(30,(odds-1)*20)-(P.fort||0)*3', '+(def<1?25*A.GENERALS.weak(a):0)+Math.min(30,(odds-1)*20)-(P.fort||0)*3*A.GENERALS.weak(a)'],
      ['spear=Math.max(1,Math.round(ds.length/3))', 'spear=Math.max(1,Math.round(ds.length*A.GENERALS.spear(a)))'],
      ['ready=d=>d.atk==null&&!d.path.length&&d.org>=A.divMaxOrg(d)*.7', 'prep=A.GENERALS.prep(a),ready=d=>d.atk==null&&!d.path.length&&d.org>=A.divMaxOrg(d)*Math.min(.95,.7*prep)'],
      ['(def<1||(d.plan||0)>=.09)', '(def<1||(d.plan||0)>=.09*prep)'],
    ],
  },
  {
    id: 'GO-ARMY-TEMPO',
    blob: 'ardan-core',
    why: 'Every AI army thought once in three ticks of the war clock. The four dials above barely moved a war: over 96 wars a ' +
      'temper, bold and cautious armies made the same number of assaults (331 and 353), because a division is rarely rested, ' +
      'next to the enemy and near the odds bar at once. Now the general sets the tempo too (A.GENERALS.every): a bold one ' +
      'thinks every second tick and catches his men the moment they are ready, a cautious one every fourth.',
    edits: [
      ['S.armies.forEach((a,i)=>{(S.warClock+i)%3===0&&A.armyThink(a)})', 'S.armies.forEach((a,i)=>{(S.warClock+i)%(A.GENERALS?A.GENERALS.every(a):3)===0&&A.armyThink(a)})'],
    ],
  },
  {
    id: 'GO-ARMY-DECIDE',
    blob: 'ardan-core',
    why: 'The dials above are bars, and a bar only delays an attack. Measured in the full world (36 wars a temper), a ' +
      'cautious army passed 21% fewer chances to attack than a steady one would have at the same moment, in every build ' +
      'with or without the richer, drilled hosts of 56-realm-inside and 60-drill, and still made as many assaults: the ' +
      'division held back went in a few days later. The share sent at once never bound (an army rarely has more targets ' +
      'than a third of its divisions), so the cunning pull, which only orders the targets, did nothing either. The ' +
      'temper now makes four decisions (A.GENERALS.opens, held, commit and fortNeed): whether to take the offensive at ' +
      'all (a cautious general outnumbered on his front only frees his own land, as an army ordered to hold the front ' +
      'does); which divisions may attack at all (a cautious one keeps a third in reserve, fixed by their ids); how many ' +
      'go in at one province (the release: 4; a bold one sends 6); and whether to storm a defended fort (a cunning one ' +
      'wants half again the odds for each step of walls). A steady general decides as the release does.',
    edits: [
      ['offensive=k==="attack"||k==="free"', 'offensive=k==="attack"||k==="free"&&A.GENERALS.opens(a,ratio)'],
      ['k==="front"&&!offensive', '(k==="front"||k==="free")&&!offensive'],
      ['atk.length&&(def<1||odds>need)', 'atk.length&&(def<1||odds>need*A.GENERALS.fortNeed(a,P))'],
      ['d.org>=A.divMaxOrg(d)*Math.min(.95,.7*prep)', 'd.org>=A.divMaxOrg(d)*Math.min(.95,.7*prep)&&!A.GENERALS.held(a,d)'],
      ['slice(0,defPow(c.j)<1?1:4)', 'slice(0,defPow(c.j)<1?1:A.GENERALS.commit(a))'],
    ],
  },
  {
    id: 'GO-ARMY-MOVES',
    blob: 'ardan-core',
    why: 'With the bars and decisions above, a bold army made about as many assaults as a steady one (a bold army already ' +
      'sends every division it has free) and a cunning one only left defended forts alone. What sets them apart now is ' +
      'where they go (A.GENERALS.pull, and A.GENERALS.moves after the think, orders.core.js): a bold general is drawn to ' +
      'the enemy\'s main host rather than to empty walls, and a cunning one to the weakest division, to men already ' +
      'fighting elsewhere and to depots. And a bold general\'s divisions break later in a fight: at 2% of their order ' +
      'instead of 4% (A.GENERALS.stand), so they hold on at worse odds and lose more men. A cunning general\'s divisions ' +
      'march round walled or held provinces of the enemy (A.GENERALS.road, in A.wsOrderDiv), and one that finds the enemy ' +
      'across its road on the march goes round instead of attacking (A.GENERALS.sidestep, in A.divMove): in the release ' +
      'most of the fights an army starts are not assaults its general chose but divisions walking into an enemy stack on ' +
      'the way to their posts, and they lose nine in ten. A steady army\'s pull is 0, its stand 1, its road the ' +
      'release\'s and it never sidesteps, which is the release.',
    edits: [
      ['-(P.fort||0)*3*A.GENERALS.weak(a);', '-(P.fort||0)*3*A.GENERALS.weak(a)+A.GENERALS.pull(a,j,def);'],
      ['d.org<Math.max(1,A.divMaxOrg(d)*.04)', 'd.org<Math.max(1,A.divMaxOrg(d)*.04*(A.GENERALS?A.GENERALS.stand(d):1))', 2],
      ['const path=A.wsPath(d.loc,dest,d.r);return path?', 'const path=A.GENERALS?A.GENERALS.road(d,dest):A.wsPath(d.loc,dest,d.r);return path?'],
      ['if(A.divsAt(next).some(x=>A.hostile(d.r,x.r))){d.atk=next;return}', 'if(A.divsAt(next).some(x=>A.hostile(d.r,x.r))){if(A.GENERALS&&A.GENERALS.sidestep(d,next))return;d.atk=next;return}'],
    ],
  },
];
