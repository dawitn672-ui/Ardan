const out = {};
const starts = [
  ['peasant', 'POL-01', 'human'], ['serf', 'POL-01', 'human'], ['noble', 'POL-01', 'human'], ['royal', 'POL-01', 'human'],
  ['peasant', 'POL-11', 'orc'], ['noble', 'POL-25', 'human'], ['artisan', 'POL-04', 'human'], ['merchant', 'POL-21', 'human'],
];
for (const [status, realm, race] of starts) {
  for (const seed of [11, 12, 13]) {
    A.newGame({ seed, race, realm, status, sex: seed % 2 ? 'M' : 'F', startAge: 0 });
    UI.screen = 'game'; UI.tab = 'life'; UI.render();
    const pc = A.pc(), P = A.S.people;
    const rels = Object.entries(pc.rel || {}).map(([id, r]) => {
      const q = P[id];
      return { id, type: r.type, op: r.op, name: q ? (q.given + ' ' + (q.sur || '')).trim() : '?', age: q ? A.S.year - q.born : null, alive: q ? q.alive : null, status: q && q.status, title: q && q.title, job: q && q.job && (q.job.k || q.job.key || JSON.stringify(q.job).slice(0, 40)), label: (A.relLabel ? (() => { try { return A.relLabel(pc, q); } catch (e) { return 'ERR' } })() : null) };
    });
    const types = {};
    for (const r of rels) types[r.type] = (types[r.type] || 0) + 1;
    out[`${status}/${realm}/${race}/${seed}`] = { n: rels.length, types, name: pc.given + ' ' + pc.sur, rels: seed === 11 ? rels : undefined, family: A.S.family ? JSON.stringify(A.S.family).slice(0, 400) : null };
  }
}
out.relFns = Object.keys(A).filter(k => /rel|kin|label/i.test(k)).slice(0, 80);
return out;
