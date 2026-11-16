// E3: does a promotion hand over real command, and does leaving a post have consequences? (owner's complaint 2)
// Loads a soldier's save, raises him a rank at a time through the same steps the game's promotion runs
// (rank++, the council seat at Marshal, A.wsAttachPC), and reads at each rank what the game says he commands,
// who else holds the rank, and who commands each army. Then he resigns. Nothing is saved.
const D = require('./drive.js');
const fs = require('fs');
const file = process.argv[2] || '/tmp/ardan/critique/design/L2/state.json';
(async () => {
  const { b, page, errs } = await D.open(1366);
  await D.load(page, file);
  const out = await page.evaluate(() => {
    { const p0 = A.pc(); const me = p0.mil.realm; if (!A.atWar(me).length) { const en = A.neighbors(me).find(x => A.realm(x) && A.realm(x).alive); A.startWar(me, en, null, "conquest"); } for (let i = 0; i < 12; i++) A.wsDay(); }
    const pc = A.pc(), m = pc.mil, rid = m.realm, r = A.realm(rid);
    const nm = id => { const p = A.P(id); return p ? `${A.fullName(p, false)}${p.alive ? '' : ' (dead)'}` : String(id); };
    const read = (label) => {
      const role = A.cmdRole(pc);
      const armies = A.armiesOf(rid).map(a => ({ name: a.name, gen: nm(a.gen), genIsMe: a.gen === pc.id, sub: a.sub ? nm(a.sub) : null, divs: a.divs.length }));
      // anyone else in the realm called by this rank's title, or by "Marshal"
      const title = GD.MIL[m.rank].title;
      const same = [], marshals = [];
      for (const p of Object.values(A.S.people)) {
        if (!p.alive || p.id === pc.id || p.realm !== rid) continue;
        const t = (A.milTitle ? (p.mil ? A.milTitle(p) : '') : '') + ' ' + (p.occ || '') + ' ' + (p.title || '');
        if (p.mil && p.mil.rank === m.rank) same.push(nm(p.id));
        if (p.milRank != null && p.milRank === m.rank) same.push(nm(p.id) + ' [milRank]');
        if (/marshal/i.test(t)) marshals.push(nm(p.id) + ' — ' + t.trim());
      }
      UI.tab = 'path'; UI.render();
      const path = document.querySelector('main').innerText;
      const i = path.indexOf('WHERE YOU STAND');
      return {
        label, rank: m.rank, title: A.milTitle ? A.milTitle(pc) : title, ladderTitle: title, leads: GD.MIL[m.rank].leads,
        role: { key: role.key, title: role.title, armies: role.armies.size, divs: role.divs.size, desc: role.desc },
        myArmy: m.army, myDiv: m.div, unit: m.unit,
        councilMarshal: r.council && r.council.marshal ? nm(r.council.marshal) : null,
        armies, sameRankOthers: same.slice(0, 12), sameRankCount: same.length, calledMarshal: marshals.slice(0, 10),
        path: path.slice(i, i + 900),
      };
    };
    const res = [read('start')];
    while (m.rank < 9) {
      m.rank++;
      A.fame(pc, 2 + m.rank);
      if (m.rank === 9 && !m.merc) { r.council = r.council || {}; r.council.marshal = pc.id; }
      A.wsAttachPC && A.wsAttachPC();
      res.push(read('promoted to ' + GD.MIL[m.rank].title));
    }
    // leaving the post
    const war = A.atWar(rid).length;
    const rs = A.resign();
    const after = { resign: rs, war, mil: pc.mil, councilMarshal: r.council && r.council.marshal ? nm(r.council.marshal) : null, office: pc.office || null,
      armies: A.armiesOf(rid).map(a => ({ name: a.name, gen: nm(a.gen), genIsMe: a.gen === pc.id })), veteran: pc.veteran };
    UI.tab = 'path'; UI.render();
    after.path = document.querySelector('main').innerText.slice(0, 900);
    return { res, after };
  });
  fs.writeFileSync('/tmp/ardan/critique/design/e3-ranks-war.json', JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1).slice(0, 20000));
  console.log('errs', errs);
  await b.close();
})();
