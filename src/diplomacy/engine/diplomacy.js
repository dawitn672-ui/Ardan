// Living international relations. Every relation is a sum of named reasons (never a bare number),
// recomputed monthly, so alliances form, sour and break for reasons a player can read.
// Also fixes "two houses are rivals but married to each other": a bond's status is derived from all
// its parts at once, so a marriage and a feud produce "uneasy marriage alliance" with both reasons shown.
import { clamp } from '../../core/engine/rng.js';

export function makeDiplomacy(realms, rng) {
  const rel = new Map(); // key "a|b" (a<b) -> { factors: Map(name -> {value, decayPerMonth, since}) , pact: null|'alliance'|'truce'|'war' }
  const key = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
  const get = (a, b) => { const k = key(a, b); if (!rel.has(k)) rel.set(k, { a: Math.min(a, b), b: Math.max(a, b), factors: new Map(), pact: null, pactSince: null }); return rel.get(k); };
  for (const r of realms) r.ruler ??= { traits: [rng.pick(['ambitious', 'cautious', 'honourable', 'greedy', 'pious', 'paranoid'])] };
  return { rel, get, key, log: [] };
}

export function setFactor(d, a, b, name, value, { decay = 0, year, text } = {}) {
  const r = d.get(a, b); r.factors.set(name, { value, decay, since: year, text: text ?? name });
}
export function score(d, a, b) { let s = 0; for (const f of d.get(a, b).factors.values()) s += f.value; return s; }
export function reasons(d, a, b) {
  const seen = new Set();
  return [...d.get(a, b).factors.values()].filter((f) => Math.abs(f.value) >= 1).sort((x, y) => Math.abs(y.value) - Math.abs(x.value))
    .filter((f) => (seen.has(f.text) ? false : seen.add(f.text))).map((f) => ({ toward: f.value > 0, text: f.text, strong: Math.abs(f.value) >= 15 }));
}

// Status words derived from the parts, never contradicting them.
export function statusOf(d, a, b) {
  const r = d.get(a, b), s = score(d, a, b);
  const hasMarriage = [...r.factors.keys()].some((k) => k.startsWith('marriage'));
  const hasFeud = [...r.factors.entries()].some(([k, f]) => (k.startsWith('feud') || k.startsWith('claim') || k.startsWith('grudge')) && f.value <= -10);
  if (r.pact === 'war') return hasMarriage ? 'at war despite a marriage tie' : 'at war';
  if (r.pact === 'alliance') return hasFeud ? 'allied, but old wounds remain' : 'allied';
  if (hasMarriage && hasFeud) return 'uneasy marriage alliance';
  if (r.pact === 'truce') return 'under truce';
  return s >= 40 ? 'close friends' : s >= 15 ? 'friendly' : s > -15 ? 'cordial' : s > -40 ? 'cold' : 'hostile';
}

// Monthly world step: borders chafe, power balances, grudges fade, rulers act on their traits.
export function monthTick(d, world, rng, year, month) {
  const { realms } = world;
  const power = realms.map((r) => r.provinces.length * (r.treasuryFactor ?? 1));
  const top = power.indexOf(Math.max(...power));
  const events = [];
  for (const [k, r] of d.rel) {
    for (const [name, f] of r.factors) if (f.decay) { f.value -= Math.sign(f.value) * Math.min(Math.abs(f.value), f.decay); if (Math.abs(f.value) < 0.5) r.factors.delete(name); }
  }
  for (let i = 0; i < realms.length; i++) for (let j = i + 1; j < realms.length; j++) {
    const A = realms[i], B = realms[j];
    const shared = sharedBorder(world, A, B);
    if (shared) setFactor(d, i, j, 'border', -Math.min(18, 4 + shared * 1.5), { text: `share a ${shared > 6 ? 'long' : 'short'} border` });
    // balance of power: two realms next to the strongest realm draw together
    const alliedTop = d.get(i, top).pact === 'alliance' || d.get(j, top).pact === 'alliance';
    if (i !== top && j !== top && !alliedTop && sharedBorder(world, A, realms[top]) && sharedBorder(world, B, realms[top]))
      setFactor(d, i, j, 'common-threat', 14, { text: `both fear ${realms[top].name}` });
    else d.get(i, j).factors.delete('common-threat');
    // incidents: border clashes, trade disputes, insults at court — interests shift
    if (rng.chance(shared ? 0.012 : 0.004)) {
      const what = rng.pick(shared ? ['a border clash', 'raids across the border', 'a disputed river crossing'] : ['a trade dispute', 'an insult to an envoy', 'a quarrel over a bride-price']);
      setFactor(d, i, j, `incident-${year}-${month}`, -rng.int(8, 22), { decay: 0.6, year, text: `${what} in ${year}` });
    }
    if (rng.chance(0.002)) setFactor(d, i, j, `favour-${year}-${month}`, rng.int(6, 14), { decay: 0.4, year, text: `aid in a hard winter, ${year}` });
    const s = score(d, i, j), r = d.get(i, j);
    const ambitious = (X) => X.ruler.traits.includes('ambitious') || X.ruler.traits.includes('greedy');
    const honourable = (X) => X.ruler.traits.includes('honourable');
    // alliances form on mutual interest
    if (!r.pact && s >= 22 && rng.chance(0.08)) { r.pact = 'alliance'; r.pactSince = year; events.push({ kind: 'alliance', a: i, b: j, year, month, text: `${A.name} and ${B.name} sign an alliance (${reasons(d, i, j).slice(0, 2).join('; ')})` }); }
    // alliances break when interests part; honourable rulers hold on longer
    else if (r.pact === 'alliance' && s < (honourable(A) || honourable(B) ? -5 : 8) && rng.chance(0.12)) {
      r.pact = null; setFactor(d, i, j, `grudge-broken-${year}`, -15, { decay: 0.25, year, text: `broke their alliance in ${year}` });
      events.push({ kind: 'alliance-broken', a: i, b: j, year, month, text: `${A.name} and ${B.name} end their alliance` });
    }
    // wars: ambition + hostility + opportunity
    else if (!r.pact && shared && ((s <= -25 && (ambitious(A) || ambitious(B)) && rng.chance(0.03)) || (s <= -45 && rng.chance(0.02)))) {
      r.pact = 'war'; r.pactSince = year;
      const aggressor = ambitious(A) ? A : B, target = aggressor === A ? B : A;
      events.push({ kind: 'war', a: aggressor.id, b: target.id, year, month, text: `${aggressor.name} declares war on ${target.name}` });
    } else if (r.pact === 'war' && rng.chance(0.03)) {
      r.pact = 'truce'; r.pactSince = year; setFactor(d, i, j, `grudge-war-${year}`, -20, { decay: 0.15, year, text: `fought a war ending in ${year}` });
      events.push({ kind: 'peace', a: i, b: j, year, month, text: `${A.name} and ${B.name} make peace` });
    } else if (r.pact === 'truce' && year - r.pactSince >= 5) r.pact = null;
    // marriages between ruling houses: likelier when relations are decent, and used to end feuds
    const recentMarriage = [...r.factors.keys()].some((k) => k.startsWith('marriage-') && year - (r.factors.get(k).since ?? 0) < 12);
    if (!r.pact && s > -10 && !recentMarriage && rng.chance(0.0009)) {
      setFactor(d, i, j, `marriage-${year}`, 16, { decay: 0.05, year, text: `royal marriage in ${year}` });
      events.push({ kind: 'marriage', a: i, b: j, year, month, text: `A royal marriage joins ${A.name} and ${B.name}` });
    }
  }
  for (const R of realms) if (rng.chance(1 / (12 * 22))) {
    const old = R.ruler.traits[0];
    R.ruler = { traits: [rng.pick(['ambitious', 'cautious', 'honourable', 'greedy', 'pious', 'paranoid'])] };
    events.push({ kind: 'new-ruler', a: R.id, b: -1, year, month, text: `The ruler of ${R.name} dies; the heir is said to be ${R.ruler.traits[0]}` });
  }
  d.log.push(...events);
  return events;
}

function sharedBorder(world, A, B) {
  const provs = world.map.provinces.list, ro = world.realmOf;
  let n = 0; for (const p of A.provinces) for (const nb of provs[p].neighbors) if (ro[nb] === B.id) n++;
  return n;
}

// News reaches you only if it touches you, or as delayed, possibly garbled rumour.
export function newsFor(event, playerRealmId, rng) {
  if (event.a === playerRealmId || event.b === playerRealmId) return { heard: true, text: event.text, certain: true };
  if (!rng.chance(0.35)) return { heard: false };
  const garbled = rng.chance(0.25);
  return { heard: true, certain: false, text: `Travellers say that ${garbled ? event.text.replace(/declares war on|sign an alliance/, 'quarrel with') : event.text}.` };
}

// House-to-house bonds (nobles within and across realms): same machinery, same honest status.
export function houseBond() { return { factors: new Map() }; }
export function houseStatus(bond) {
  const f = [...bond.factors.entries()];
  const marriage = f.find(([k]) => k.startsWith('marriage')), feud = f.find(([k, v]) => k.startsWith('feud') && v.value <= -10);
  const s = f.reduce((a, [, v]) => a + v.value, 0);
  if (marriage && feud) return { status: 'uneasy marriage alliance', why: [marriage[1].text, feud[1].text] };
  return { status: s >= 25 ? 'allied houses' : s >= 8 ? 'friendly houses' : s > -8 ? 'neutral' : s > -25 ? 'rivals' : 'blood feud', why: f.map(([, v]) => v.text) };
}
