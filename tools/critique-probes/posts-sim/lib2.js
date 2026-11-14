// ---- scenario helpers ----
L.forced = function (fn, opts = {}) {
  const ch = A.chance, pk = A.pick;
  if (opts.chance != null) A.chance = () => opts.chance;
  if (opts.pick) A.pick = (arr) => (Array.isArray(arr) && arr.includes(opts.pick) ? opts.pick : pk(arr));
  try { return fn(); } finally { A.chance = ch; A.pick = pk; }
};
L.realmSnap = function (rid) {
  const r = A.realm(rid), short = A.realmShort(rid);
  const armies = A.armiesOf(rid).map(a => ({ id: a.id, name: a.name, gen: a.gen ? L.nm(a.gen) : null, sub: a.sub ? L.nm(a.sub) : null, divs: a.divs.length, men: Math.round(A.armyMen ? A.armyMen(a) : a.men || 0) }));
  const marshals = Object.values(A.S.people).filter(p => p.alive && /marshal/i.test(String(p.occ || '')) && (p.realm === rid)).map(p => ({ who: L.nm(p.id), occ: p.occ, milRank: p.milRank, posts: L.postsOf(p.id).filter(x => !/^occ=/.test(x)) }));
  return { council: Object.fromEntries(Object.entries(r.council || {}).map(([k, v]) => [k, L.nm(v)])), armies, marshalTitled: marshals };
};
L.step = function (label, rid) {
  return { label, pc: L.pcView(), realm: L.realmSnap(rid) };
};
L.ensureWar = function (rid) {
  if (A.atWar(rid).length) return A.atWar(rid)[0];
  const nb = (A.neighbors(rid) || []).filter(x => A.realm(x) && A.realm(x).alive).sort((a, b) => A.realmPower(b) - A.realmPower(a));
  const w = A.startWar(rid, nb[0], null, 'conquest', { noAllies: true });
  return w;
};
L.advanceDays = function (n) { let g = 0; const r = A.advance(n); let h; while ((h = A.headReady()) && g++ < 300) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); } return r; };
