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
];
