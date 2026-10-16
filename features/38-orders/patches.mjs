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
      ['ready=d=>d.atk==null&&!d.path.length&&d.org>=A.divMaxOrg(d)*.7', 'prep=A.GENERALS.prep(a),ready=d=>d.atk==null&&!d.path.length&&d.org>=A.divMaxOrg(d)*Math.min(.95,.7*prep)&&A.GENERALS.rested(a,d)'],
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
    why: 'The dials above are bars, and a bar only delays: over 96 wars a temper in the full world a cautious army ' +
      'passed 22% fewer chances to attack than a steady one at the same moment, and still made as many assaults, ' +
      'because the division it held back went in a few days later. The share sent at once never bound (an army ' +
      'rarely has more targets than its third), so the cunning pull, which only orders the targets, did nothing. ' +
      'The temper now also makes four decisions (A.GENERALS.opens, commit, fortNeed and rested): whether to take ' +
      'the offensive at all (a cautious general outnumbered on his front only frees his own land, as an army ' +
      'ordered to hold the front does), how many divisions go in at one province (the release: 4), whether to ' +
      'storm a fort or leave it (a cunning one wants better odds for each step of walls), and whether a division ' +
      'goes straight back in after a fight (a cautious one rests it first). A steady general decides as the release.',
    edits: [
      ['offensive=k==="attack"||k==="free"', 'offensive=k==="attack"||k==="free"&&A.GENERALS.opens(a,ratio)'],
      ['k==="front"&&!offensive', '(k==="front"||k==="free")&&!offensive'],
      ['atk.length&&(def<1||odds>need)', 'atk.length&&(def<1||odds>need*A.GENERALS.fortNeed(a,P))'],
      ['slice(0,defPow(c.j)<1?1:4)', 'slice(0,defPow(c.j)<1?1:A.GENERALS.commit(a))'],
    ],
  },
];
