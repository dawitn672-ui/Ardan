// Kinship from the family graph: exact terms (cousin, uncle, once removed, in-laws, half-siblings),
// one label resolver with strict priority so "my mother has a mutual friend who is my father" cannot happen,
// and a "notable kin" view (the uncle who is a general, his son your age, the cousin who is heir to a county).

export class People {
  constructor() { this.map = new Map(); }
  add(p) { p.spouseIds ??= []; p.childIds ??= []; this.map.set(p.id, p); return p; }
  get(id) { return id == null ? null : this.map.get(id); }
  all() { return [...this.map.values()]; }
  parents(p) { return [this.get(p.fatherId), this.get(p.motherId)].filter(Boolean); }
  children(p) { return p.childIds.map((id) => this.get(id)).filter(Boolean); }
  link(child, father, mother) {
    child.fatherId = father?.id ?? null; child.motherId = mother?.id ?? null;
    if (father && !father.childIds.includes(child.id)) father.childIds.push(child.id);
    if (mother && !mother.childIds.includes(child.id)) mother.childIds.push(child.id);
  }
  marry(a, b, year) {
    if (!a.spouseIds.includes(b.id)) a.spouseIds.push(b.id);
    if (!b.spouseIds.includes(a.id)) b.spouseIds.push(a.id);
    a.marriedYear = b.marriedYear = year;
  }
}

// ancestors with generation depth: Map(id -> depth)
function ancestors(people, p, maxDepth = 6) {
  const out = new Map(); let frontier = [[p, 0]];
  while (frontier.length) {
    const next = [];
    for (const [q, d] of frontier) {
      if (out.has(q.id) && out.get(q.id) <= d) continue;
      out.set(q.id, d);
      if (d < maxDepth) for (const par of people.parents(q)) next.push([par, d + 1]);
    }
    frontier = next;
  }
  return out;
}

const ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth'];
const REMOVED = ['', 'once removed', 'twice removed', 'three times removed'];
const g = (p, m, f) => (p.sex === 'female' ? f : m);

// Blood kinship of `other` as seen from `me`. Returns null if not blood kin.
export function bloodTerm(people, me, other) {
  if (me.id === other.id) return { term: 'self', degree: 0 };
  const A = ancestors(people, me), B = ancestors(people, other);
  let best = null;
  for (const [id, da] of A) if (B.has(id)) {
    const db = B.get(id);
    if (!best || da + db < best.da + best.db) best = { id, da, db };
  }
  if (!best) return null;
  const { da, db } = best;
  // count shared parents for half-siblings
  if (da === 0) { // other descends from me
    const t = db === 1 ? g(other, 'son', 'daughter') : db === 2 ? g(other, 'grandson', 'granddaughter') : 'great-'.repeat(db - 2) + g(other, 'grandson', 'granddaughter');
    return { term: t, degree: db, line: 'descendant' };
  }
  if (db === 0) { // other is my ancestor
    const t = da === 1 ? g(other, 'father', 'mother') : da === 2 ? g(other, 'grandfather', 'grandmother') : 'great-'.repeat(da - 2) + g(other, 'grandfather', 'grandmother');
    return { term: t, degree: da, line: 'ancestor' };
  }
  if (da === 1 && db === 1) {
    const shared = [me.fatherId, me.motherId].filter((x) => x != null && (x === other.fatherId || x === other.motherId)).length;
    return { term: (shared === 1 ? 'half-' : '') + g(other, 'brother', 'sister'), degree: shared === 1 ? 1.5 : 1, line: 'sibling' };
  }
  if (da === 1) { // other descends from my sibling
    const base = g(other, 'nephew', 'niece');
    return { term: db === 2 ? base : 'great-'.repeat(db - 3) + 'grand' + base, degree: db, line: 'sibling-line' };
  }
  if (db === 1) { // other is sibling of my ancestor
    const base = g(other, 'uncle', 'aunt');
    return { term: da === 2 ? base : da === 3 ? 'great-' + base : 'great-'.repeat(da - 3) + 'grand' + base, degree: da, line: 'parent-sibling' };
  }
  const n = Math.min(da, db) - 1, removed = Math.abs(da - db);
  return { term: `${ORD[n] ?? n + 'th'} cousin${removed ? ' ' + (REMOVED[removed] ?? removed + ' times removed') : ''}`, degree: da + db - 1, line: 'cousin' };
}

// In-law and step relations (through exactly one marriage).
export function affinalTerm(people, me, other) {
  if (me.spouseIds.includes(other.id)) return { term: g(other, 'husband', 'wife'), degree: 0.5, line: 'spouse' };
  for (const sid of me.spouseIds) {
    const sp = people.get(sid); if (!sp) continue;
    const bt = bloodTerm(people, sp, other);
    if (bt && bt.degree <= 2) {
      const map = { father: 'father-in-law', mother: 'mother-in-law', brother: 'brother-in-law', sister: 'sister-in-law', 'half-brother': 'brother-in-law', 'half-sister': 'sister-in-law',
        son: 'stepson', daughter: 'stepdaughter', uncle: 'uncle by marriage', aunt: 'aunt by marriage', nephew: 'nephew by marriage', niece: 'niece by marriage',
        grandfather: "spouse's grandfather", grandmother: "spouse's grandmother" };
      if (map[bt.term]) return { term: map[bt.term], degree: bt.degree + 0.5, line: 'in-law' };
    }
  }
  // spouse of my blood kin
  for (const sid of other.spouseIds) {
    const sp = people.get(sid); if (!sp) continue;
    const bt = bloodTerm(people, me, sp);
    if (bt && bt.degree <= 2) {
      const map = { father: 'stepmother', mother: 'stepfather', brother: 'sister-in-law', sister: 'brother-in-law', 'half-brother': 'sister-in-law', 'half-sister': 'brother-in-law',
        son: 'daughter-in-law', daughter: 'son-in-law', uncle: 'aunt by marriage', aunt: 'uncle by marriage' };
      let t = map[bt.term];
      if (t && other.sex === 'male') t = t.replace('stepmother', 'stepfather').replace('sister-in-law', 'brother-in-law').replace('daughter-in-law', 'son-in-law').replace('aunt by marriage', 'uncle by marriage');
      if (t && other.sex === 'female') t = t.replace('stepfather', 'stepmother').replace('brother-in-law', 'sister-in-law').replace('son-in-law', 'daughter-in-law').replace('uncle by marriage', 'aunt by marriage');
      // a parent's spouse who is also my parent is just my parent (handled by blood first)
      if (t) return { term: t, degree: bt.degree + 0.5, line: 'in-law' };
    }
  }
  return null;
}

// THE relation label. Strict priority: spouse > blood > in-law > feudal > personal bond > acquaintance.
// Personal bonds are kept as a qualifier ("your father, and your closest friend") never as a replacement.
export function relationLabel(people, me, other, bonds = null) {
  const parts = [];
  const aff = me.spouseIds.includes(other.id) ? affinalTerm(people, me, other) : null;
  const blood = aff ? null : bloodTerm(people, me, other);
  const inlaw = aff || blood ? null : affinalTerm(people, me, other);
  const kin = aff ?? blood ?? inlaw;
  if (kin) parts.push(kin.term);
  if (me.liegeId === other.id) parts.push('liege');
  if (other.liegeId === me.id) parts.push('vassal');
  const bond = bonds?.get?.(me.id, other.id);
  if (bond) parts.push(kin ? bondQualifier(bond) : bond.kind);
  return { primary: parts[0] ?? 'acquaintance', qualifiers: parts.slice(1), kin: kin ?? null, text: joinLabel(parts) };
}
function bondQualifier(b) {
  return { friend: 'close to you', bestFriend: 'your dearest friend', rival: 'at odds with you', enemy: 'your enemy', lover: 'your lover', mentor: 'your mentor' }[b.kind] ?? b.kind;
}
function joinLabel(parts) { if (!parts.length) return 'acquaintance'; if (parts.length === 1) return parts[0]; return parts[0] + ' (' + parts.slice(1).join(', ') + ')'; }

// "Mutual friend" can only be said of someone who is NOT kin or spouse of either party.
export function canCallMutualFriend(people, a, b, c) {
  for (const [x, y] of [[a, c], [b, c], [a, b]]) {
    if (x.spouseIds.includes(y.id)) return false;
    const bt = bloodTerm(people, x, y); if (bt && bt.degree <= 3) return false;
  }
  return true;
}

// Notable kin: everyone within reach of the family who matters to your life.
export function notableKin(people, me, { year, maxDegree = 4, peerWindow = 3, bonds = null } = {}) {
  const seen = new Set([me.id]), out = [];
  // explore the family graph up 3 generations and down 3, plus spouses
  const queue = [[me, 0]];
  while (queue.length) {
    const [p, steps] = queue.shift();
    if (steps >= 6) continue;
    const next = [...people.parents(p), ...people.children(p), ...p.spouseIds.map((id) => people.get(id)).filter(Boolean)];
    for (const q of next) if (!seen.has(q.id)) { seen.add(q.id); queue.push([q, steps + 1]); }
  }
  for (const id of seen) {
    if (id === me.id) continue;
    const q = people.get(id);
    const lab = relationLabel(people, me, q, bonds);
    if (!lab.kin || lab.kin.degree > maxDegree) continue;
    const alive = q.deathYear == null;
    const age = year - q.birthYear;
    const reasons = [];
    if (q.titles?.length) reasons.push(q.titles[0]);
    if (q.office) reasons.push(q.office);
    if (q.heirTo) reasons.push(`heir to ${q.heirTo}`);
    if (alive && Math.abs(age - (year - me.birthYear)) <= peerWindow) reasons.push('your age');
    const close = lab.kin.degree <= 2;
    if (!close && !reasons.length) continue;
    out.push({ person: q, relation: lab.text, degree: lab.kin.degree, alive, age, why: reasons,
      score: (alive ? 0 : 5) + lab.kin.degree * 2 - reasons.length * 2.5 - (q.titles?.length ? 2 : 0) });
  }
  return out.sort((a, b) => a.score - b.score);
}

// Tree layout data: generations relative to me (-2 grandparents ... +2 grandchildren), with uncles and cousins.
export function familyTree(people, me) {
  const rows = new Map();
  const put = (gen, p, rel) => { if (!p) return; if (!rows.has(gen)) rows.set(gen, []); if (!rows.get(gen).some((x) => x.p.id === p.id)) rows.get(gen).push({ p, rel }); };
  const label = (p) => relationLabel(people, me, p).text;
  for (const par of people.parents(me)) {
    for (const gp of people.parents(par)) {
      put(-2, gp, label(gp));
      for (const unc of people.children(gp)) if (unc.id !== par.id) {
        put(-1, unc, label(unc));
        for (const cz of people.children(unc)) put(0, cz, label(cz));
      }
    }
    put(-1, par, label(par));
    for (const sib of people.children(par)) if (sib.id !== me.id) { put(0, sib, label(sib)); for (const nn of people.children(sib)) put(1, nn, label(nn)); }
  }
  put(0, me, 'you');
  for (const sid of me.spouseIds) put(0, people.get(sid), label(people.get(sid)));
  for (const ch of people.children(me)) { put(1, ch, label(ch)); for (const gc of people.children(ch)) put(2, gc, label(gc)); }
  return [...rows.entries()].sort((a, b) => a[0] - b[0]).map(([gen, list]) => ({ gen, people: list.sort((a, b) => a.p.birthYear - b.p.birthYear) }));
}
