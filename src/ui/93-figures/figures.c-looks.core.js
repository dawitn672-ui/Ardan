// 93-figures · every person has a face: A.LOOKS.
//
// A face is the game's 23-character code (src/people/engine/face.js: 39 features), kept in p.app.g.
// - A.LOOKS.born(p, parents, app) is called by A.genAppearance (src/core/release/core/03-engine-base.js) for everyone
//   who is born or made: the code comes from the parents' codes by group (the father's four times in ten, the mother's
//   four, a blend otherwise), or round the people's mean for a person with no parents in the world.
// - A.LOOKS.migrateAll(S) gives a code to everyone in an older save who has none, in birth order so children take
//   after parents who are still in the state, leaning each face by the appearance fields the save does hold (the old
//   creation screen's shape, brow, mouth, nose and eye choices, and the build). The same save gives the same faces.
// - The face made by hand at creation arrives in the start options (o.app.g, o.app.g2) and is laid over the made one.
// Nothing here draws from A.rand: a face has its own stream, seeded by the person's id (D-036). The world's dice do
// not move, so a seed plays the same world as before, now with faces.
(function () {
  const LK = A.LOOKS = A.LOOKS || {};
  const LIB = () => (A.V2 && A.V2.figure) || null;
  LK.valid = g => { const L = LIB(); return !!(L && typeof g === 'string' && L.face.unpack(g)); };
  // the code a person is drawn with: their own, or the one their id and old fields give (not stored here)
  LK.code = function (p, parents) {
    const L = LIB(); if (!L || !p) return '';
    const app = p.app || {};
    if (LK.valid(app.g)) return app.g;
    const pa = (parents || []).filter(Boolean), fa = pa.find(q => q.sex !== 'F'), mo = pa.find(q => q.sex === 'F');
    return L.codeFor(p.id, { sex: p.sex, race: p.race, app, father: fa && fa.app && fa.app.g, mother: mo && mo.app && mo.app.g });
  };
  LK.born = function (p, parents, app) {
    try { return LK.code({ id: p.id, sex: p.sex, race: p.race, app: app || p.app || {} }, parents); } catch (e) { return ''; }
  };
  // an older save: everyone without a face gets one. Returns how many were given.
  LK.migrateAll = function (S) {
    S = S || A.S; if (!S || !S.people || !LIB()) return 0;
    const ids = Object.keys(S.people).filter(id => { const p = S.people[id]; return p && typeof p === 'object' && p.app && typeof p.app === 'object' && !LK.valid(p.app.g); });
    if (!ids.length) return 0;
    ids.sort((a, b) => ((+S.people[a].born || 0) - (+S.people[b].born || 0)) || (a < b ? -1 : a > b ? 1 : 0));
    for (const id of ids) {
      const p = S.people[id], pa = (Array.isArray(p.parents) ? p.parents : []).map(x => S.people[x]).filter(Boolean);
      try { const g = LK.code(p, pa); if (g) p.app.g = g; } catch (e) { console.error('looks: no face for ' + id, e); }
    }
    return ids.length;
  };
  // a loaded state: the release's own upgrades first, then the faces (99998-v2-saves wraps this and runs after it)
  if (typeof A.deserialize === 'function') {
    const des = A.deserialize;
    A.deserialize = function () {
      const r = des.apply(this, arguments);
      try { LK.last = A.S ? LK.migrateAll(A.S) : 0; } catch (e) { console.error('looks: migrate', e); }
      return r;
    };
  }
})();
