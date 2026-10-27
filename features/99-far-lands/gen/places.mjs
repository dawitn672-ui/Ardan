// far@2: every far province is named from its people's own place names (peoples-and-faiths.json, each culture's
// names.places). A culture gives about a dozen; a realm of a hundred provinces needs more, so more are made from the
// same list the way the list itself is made: its names are roots and endings (Khas + ghal, Dzan + ul, Rinn + giri),
// and new names put a root of the list to an ending of the list. Only when those run out does a name take a side of
// the country ("Upper Henden"). The largest provinces get the list's own names first. No name is used twice in the
// world, and none holds markup.
const MARK = /[<>"&]/;
const VOW = /[aeiouy]/i;
const ok = s => s.length >= 3 && s.length <= 13 && !MARK.test(s) && !/(.)\1\1/i.test(s) && !/[aeiouy]{4}/i.test(s) && !/[^aeiouy' -]{5}/i.test(s) && VOW.test(s);
const hashS = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const SIDES = ['Upper', 'Lower', 'East', 'West', 'North', 'South', 'Old', 'High'];

// the names a culture's list gives, in order: the list, then roots with endings, then sides of the country
export function placeNames(list) {
  const L = [...new Set((list || []).map(s => String(s).trim()).filter(s => s && !MARK.test(s)))];
  const lower = new Set(L.map(s => s.toLowerCase()));
  const roots = new Map(), ends = new Map();
  const addRoot = r => { if (r.length >= 3 && VOW.test(r) && !/['-]$/.test(r) && !roots.has(r)) roots.set(r, roots.size); };
  const addEnd = e => { if (e.length >= 2 && !ends.has(e)) ends.set(e, ends.size); };
  // whole names that begin another name are roots; what follows them is an ending
  for (const n of L) for (const m of L) if (m !== n && m.length > n.length + 1 && m.toLowerCase().startsWith(n.toLowerCase())) { addRoot(n); addEnd(m.slice(n.length).toLowerCase()); }
  // two names that end alike share an ending; what comes before it is a root
  for (let a = 0; a < L.length; a++) for (let b = a + 1; b < L.length; b++) {
    const x = L[a].toLowerCase(), y = L[b].toLowerCase(); let k = 0;
    while (k < Math.min(x.length, y.length) - 1 && x[x.length - 1 - k] === y[y.length - 1 - k]) k++;
    if (k >= 2 && k <= 6) { const e = x.slice(x.length - k); addEnd(e); addRoot(L[a].slice(0, L[a].length - k)); addRoot(L[b].slice(0, L[b].length - k)); }
  }
  // two names that begin alike share a root
  for (let a = 0; a < L.length; a++) for (let b = a + 1; b < L.length; b++) {
    const x = L[a], y = L[b]; let k = 0;
    while (k < Math.min(x.length, y.length) - 1 && x[k].toLowerCase() === y[k].toLowerCase()) k++;
    if (k >= 3) { addRoot(x.slice(0, k)); addEnd(x.slice(k).toLowerCase()); addEnd(y.slice(k).toLowerCase()); }
  }
  const combos = [];
  for (const r of roots.keys()) for (const e of ends.keys()) {
    const s = r[0].toUpperCase() + r.slice(1) + e;
    if (r.toLowerCase() === e || lower.has(s.toLowerCase()) || !ok(s)) continue;
    // the joint reads as one word: no doubled letter and no run of three consonants across it
    const joint = (r.slice(-2) + e.slice(0, 2)).toLowerCase();
    if (r[r.length - 1].toLowerCase() === e[0] || /[^aeiouy']{3}/.test(joint)) continue;
    combos.push(s);
  }
  combos.sort((a, b) => hashS(a) - hashS(b) || (a < b ? -1 : 1));
  const out = L.slice();
  const seen = new Set(lower);
  for (const s of combos) if (!seen.has(s.toLowerCase())) { seen.add(s.toLowerCase()); out.push(s); }
  const sides = [];
  for (const side of SIDES) for (const n of L) sides.push(`${side} ${n}`);
  return { main: out, sides };
}

// names for provinces P (each with k, pop, owner realm index or none): owner's cultures first, else the nearest
// held province's, else the land's. `used` holds every name already in the world (lower case) and is added to.
// cycle 1 (world review B7): a name that stutters (a run of two letters or more said twice, as in Moinwinwan,
// Kethpopora, Tukatuk) is never used; no root (its first four letters) names more than ROOT_CAP provinces of one realm;
// and a name is at least NEAR_EDIT letters' edits from every neighbour already named (Inulan beside Inu-lan)
export const ROOT_CAP = 3, NEAR_EDIT = 3;
export const stutters = s => String(s).toLowerCase().split(/\s+/).some(w => {
  w = w.replace(/[^a-z]/g, '');
  for (let len = 2; len <= 4; len++) for (let i = 0; i + len <= w.length; i++) {
    const c = w.slice(i, i + len);
    if (!/[aeiouy]/.test(c) || !/[^aeiouy]/.test(c)) continue;
    const j = w.indexOf(c, i + len);
    if (j >= 0 && j <= i + len + 2) return true;
  }
  return false;
});
const bare = s => s.toLowerCase().replace(/[^a-z]/g, '');
export function editDist(a, b) {
  a = bare(a); b = bare(b);
  if (Math.abs(a.length - b.length) >= NEAR_EDIT) return NEAR_EDIT;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

// names for provinces P (each with k, pop, owner realm index or none): owner's cultures first, else the nearest
// held province's, else the land's. `used` holds every name already in the world (lower case) and is added to.
// poolOf.group(p) names the realm a province is counted in for the root cap, poolOf.near(p) its neighbours' names.
export function nameProvinces(P, poolOf, used) {
  const gens = new Map(), roots = new Map();
  const rootOf = s => bare(s).slice(0, 4);
  const fits = (s, p) => {
    if (used.has(s.toLowerCase()) || stutters(s)) return false;
    const g = poolOf.group ? poolOf.group(p) : null;
    if (g != null && (roots.get(g + '|' + rootOf(s)) || 0) >= ROOT_CAP) return false;
    if (poolOf.near) for (const n of poolOf.near(p)) if (n && editDist(n, s) < NEAR_EDIT) return false;
    return true;
  };
  // a culture's own names and its roots-with-endings first, from each of the realm's peoples in turn; a side of the
  // country only when every one of them has run out
  const next = (key, part, p) => {
    let g = gens.get(key);
    if (!g) { const L = placeNames(poolOf.list(key)); g = { main: L.main, sides: L.sides, i: { main: 0, sides: 0 } }; gens.set(key, g); }
    const list = g[part];
    while (g.i[part] < list.length && used.has(list[g.i[part]].toLowerCase())) g.i[part]++;
    for (let i = g.i[part]; i < list.length; i++) { const s = list[i]; if (fits(s, p)) return s; }
    return null;
  };
  const order = P.slice().sort((a, b) => b.pop - a.pop || a.k - b.k);
  let fromList = 0, fallback = 0, sided = 0;
  for (const p of order) {
    let s = null;
    const keys = poolOf.keys(p);
    for (const key of keys) { s = next(key, 'main', p); if (s) break; }
    if (!s) for (const key of keys) { s = next(key, 'sides', p); if (s) { sided++; break; } }
    if (!s) for (const key of poolOf.all || []) { s = next(key, 'main', p); if (s) { fallback++; break; } }
    if (!s) continue;
    used.add(s.toLowerCase()); p.base = s; p.name = s; fromList++;
    if (poolOf.done) poolOf.done(p);
    const g = poolOf.group ? poolOf.group(p) : null;
    if (g != null) roots.set(g + '|' + rootOf(s), (roots.get(g + '|' + rootOf(s)) || 0) + 1);
  }
  return { fromList, fallback, sided, unnamed: P.length - fromList };
}
