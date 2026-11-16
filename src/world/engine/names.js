// Names for people, houses and places (C7, D-058). One common English pool names most realms; the far and the
// non-human peoples draw from pools of their own (data/names.json, built from docs/research/c7-name-data.json by
// tools/c7/build-names-data.mjs). A culture names itself through a pool: its id, then `cultures[id].uses`.
//
// Flavour is a weighting, not a language: a culture sees a deterministic subset of the common pool (a hash of the
// name and the culture's id keeps about 60% of it), a realm a smaller one of that (about 80%), and a few plain
// names the culture or the realm leans to (`accent`, `lean`) are tried first. Everything here is pure: the draws go
// through the rng the caller gives, and the subsets come from a hash, never from Math.random or the clock.
//
// The data is set once by `setNameData` (the page's `A.DATA.names`, or a test's copy of data/names.json). Without it
// the namer still names from a few dozen plain names, so a worker or a bare module never fails.
let DATA = null;
const CACHE = new Map();
export function setNameData(d) { DATA = d && d.common ? d : null; CACHE.clear(); }
export const hasNameData = () => !!DATA;

// the four keys of the old syllable namer (v2's first draft; archive/c7-syllable-names/) map onto cultures of the game
export const LEGACY = { aldic: 'CUL-02', solenne: 'CUL-01', khuul: 'CUL-03', orcish: 'CUL-22' };
const MINI = { male: ['John', 'Thomas', 'Walter', 'Hugh', 'Edmund', 'Roger', 'Simon', 'Peter'], female: ['Alice', 'Agnes', 'Maud', 'Joan', 'Edith', 'Emma', 'Anne', 'Ruth'],
  family: ['Miller', 'Fletcher', 'Ashford', 'Hill', 'Fox', 'Baker', 'Marsh', 'Wood'], places: ['Ashford', 'Kingsbridge', 'Thornbury', 'Elmstead', 'Brookfield', 'Oakham', 'Hartley', 'Stanton'] };

// FNV-1a over a string: the same on every machine
export function hash32(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; }

export function stockOf(culture) {
  if (!DATA) return { id: String(culture), uses: 'mini', common: true, pool: MINI, accent: null };
  const id = LEGACY[culture] || culture;
  const c = DATA.cultures[id] || DATA.cultures['CUL-02'];
  const common = c.uses === 'common';
  return { id: DATA.cultures[id] ? id : 'CUL-02', uses: c.uses, common, pool: common ? DATA.common : DATA.pools[c.uses], accent: c.accent || null };
}
const sexKey = sex => (sex === 'F' || sex === 'female' ? 'female' : 'male');

// the list a culture (and a realm of it) draws from: a deterministic subset, kept per (pool, field, culture, realm)
function view(st, field, realm) {
  const k = `${st.uses}|${field}|${st.id}|${realm || ''}`;
  let v = CACHE.get(k);
  if (!v) {
    const all = st.pool[field] || [];
    const cPct = st.common ? 60 : 100, rPct = st.common ? 80 : 85;
    v = all.filter((n) => hash32(`${n}|${st.id}`) % 100 < cPct && (!realm || hash32(`${n}|${realm}`) % 100 < rPct));
    if (v.length < 40) v = all;
    CACHE.set(k, v);
  }
  return v;
}
// draw from a list, trying again a few times for a name the caller says is taken
function draw(rng, list, avoid, tries = 6) {
  let n = rng.pick(list);
  for (let t = 0; t < tries && avoid && avoid.has(n); t++) n = rng.pick(list);
  return n;
}
const LEAN_P = 0.28, ACCENT_P = 0.12;
function lists(st, field, sexOrNull, realm) {
  const lean = DATA && realm && DATA.lean && DATA.lean[realm], f = sexOrNull || field;
  return { lean: lean ? lean[f] : null, accent: st.accent ? st.accent[f] : null, base: view(st, field, realm) };
}
function pickFrom(rng, L, avoid, leanP = LEAN_P, accentP = ACCENT_P) {
  const u = rng.next();
  let list = L.base;
  if (L.lean && L.lean.length && u < leanP) list = L.lean;
  else if (L.accent && L.accent.length && u < (L.lean ? leanP : 0) + accentP) list = L.accent;
  return draw(rng, list, avoid);
}

// rng: anything with next() in [0, 1) and pick(array). opts: { realm, avoid: Set of names to try not to give }
export function givenName(rng, culture, sex, opts = {}) {
  const st = stockOf(culture), sx = sexKey(sex);
  return pickFrom(rng, lists(st, sx, null, opts.realm), opts.avoid);
}
export function familyName(rng, culture, opts = {}) {
  const st = stockOf(culture);
  return pickFrom(rng, lists(st, 'family', null, opts.realm), opts.avoid, 0.15, ACCENT_P);
}
// a place of this people: a village or fief name from their own list, never another people's
export function placeName(rng, culture, opts = {}) {
  const st = stockOf(culture);
  // two draws, like the given and family names and the old syllable namer: a court's structure shares this stream (nobility.js buildHierarchy), and a name that drew one fewer moved every title drawn after it
  rng.next();
  return draw(rng, view(st, 'places', opts.realm), opts.avoid);
}
// the pool a culture draws from, for a test or a tool: { given: {male, female}, family, places } as the culture sees them
export function sees(culture, realm) {
  const st = stockOf(culture);
  return { id: st.id, uses: st.uses, male: view(st, 'male', realm), female: view(st, 'female', realm), family: view(st, 'family', realm), places: view(st, 'places', realm) };
}
export const poolKey = (culture) => stockOf(culture).uses;

export function makeNamer(rng) {
  return {
    given(culture, sex, opts) { return givenName(rng, culture, sex, opts); },
    house(culture, opts) { return familyName(rng, culture, opts); },
    place(culture, opts) { return placeName(rng, culture, opts); },
  };
}
