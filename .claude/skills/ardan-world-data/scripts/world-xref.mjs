// ardan-world-data: cross-check the copies of one world fact across Ardan's data, the release lore and the code.
//
//   node .claude/skills/ardan-world-data/scripts/world-xref.mjs                 every check
//   node .claude/skills/ardan-world-data/scripts/world-xref.mjs --only=pronouns,places
//
// Read-only, no build needed, a second or two. Prints LEADS, not verdicts: each line names the files that disagree so
// you can read them. Exit code is always 0 (the linters in tools/ are the gates; this finds what they do not check).
// Checks:
//   pronouns  one being's own records (legends.json, power.json masters, data/figures/*, the titles it holds) call it
//             both he and she
//   places    a home or place name in data/ that the release lore never mentions (a place only the new data knows)
//   bands     a creature named in data/power.json's band words whose bestiary level is outside that band
//   counts    a bestiary family cap against its world counts; fixed figures against their kind's world count
//   rarity    every rarity or quality ladder in data/ side by side (they should be one)
//   masters   a master of the races seated in a realm's capital beside that realm's lore ruler (two rulers in one hall)
//   lore      the release's own copies: GD.REALM_CULTURE / GD.REALM_FAITH against LORE, the ruler against
//             rulerHistory and the house head
//   creatures a LORE creature row the bestiary maps (cre) whose lore size or tier disagrees with the bestiary tier
//   code      the great beings' names written as prose in game code (src/**/*.js outside data/): copies no linter reads
//   ids       one id used by two kinds of thing (a legend and a title, a species and a class): a rename must move both
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const only = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const want = k => !only.length || only.includes(k);
const rd = p => fs.readFileSync(path.join(root, p), 'utf8');
const J = p => JSON.parse(rd(p));
const out = [];
const lead = (check, s) => out.push(`LEAD ${check}: ${s}`);
const info = (check, s) => out.push(`     ${check}: ${s}`);

const LEG = J('data/legends.json').legends;
const POW = J('data/power.json');
const BEST = J('data/bestiary.json');
const LORE = J('src/core/release/core/00-lore.json');
const CAST = J('src/core/release/lore/01-cast.json');
const figFiles = fs.readdirSync(path.join(root, 'data/figures')).filter(f => f.endsWith('.json') && f !== 'vocab.json');
const FIGS = figFiles.map(f => [f, J('data/figures/' + f)]);
const titleFiles = fs.readdirSync(path.join(root, 'data/titles')).filter(f => f.endsWith('.json') && f !== 'vocab.json');
const TITLES = titleFiles.flatMap(f => (J('data/titles/' + f).titles || []).map(t => Object.assign({ _file: 'data/titles/' + f }, t)));
const loreText = [rd('src/core/release/core/00-lore.json')].concat(fs.readdirSync(path.join(root, 'src/core/release/lore')).filter(f => f.endsWith('.json')).map(f => rd('src/core/release/lore/' + f))).join('\n');
const strings = (o, acc = []) => { if (typeof o === 'string') acc.push(o); else if (Array.isArray(o)) o.forEach(x => strings(x, acc)); else if (o && typeof o === 'object') Object.values(o).forEach(x => strings(x, acc)); return acc; };

// every great being: id, name, its records by file
const beings = new Map();
const addB = (id, name, file, rec) => { if (!id) return; const b = beings.get(id) || { id, name, recs: [] }; if (name && !b.name) b.name = name; b.recs.push([file, rec]); beings.set(id, b); };
for (const l of LEG) addB(l.id, l.n, 'data/legends.json', l);
for (const m of POW.masters || []) addB(m.id, m.n, 'data/power.json masters', m);
for (const [f, d] of FIGS) for (const x of d.figures || []) addB(x.id, x.name, 'data/figures/' + f, x);
for (const t of TITLES) for (const h of t.holders || []) if (beings.has(h)) beings.get(h).recs.push([t._file + ' ' + t.id, t]);

if (want('pronouns')) {
  const rx = { he: /\b(he|him|his|himself)\b/gi, she: /\b(she|her|hers|herself)\b/gi, it: /\b(it|its|itself)\b/gi };
  for (const b of beings.values()) {
    const per = {};
    for (const [file, rec] of b.recs) {
      const txt = strings(rec).join(' \n ');
      const c = Object.fromEntries(Object.entries(rx).map(([k, r]) => [k, (txt.match(r) || []).length]));
      if (c.he || c.she) per[file] = c;
    }
    const hasHe = Object.values(per).some(c => c.he > c.she), hasShe = Object.values(per).some(c => c.she > c.he);
    if (hasHe && hasShe) lead('pronouns', `${b.id} (${b.name}) is he in some records and she in others: ` + Object.entries(per).map(([f, c]) => `${f} he ${c.he} / she ${c.she}`).join('; '));
  }
}

if (want('places')) {
  // proper place names only (a capital after an optional "the"); one lead per name, with every record that uses it
  const uses = new Map();
  const check = (place, who) => {
    if (!place || typeof place !== 'string') return;
    const bare = place.replace(/^the\s+/i, '');
    if (!/^[A-Z]/.test(bare)) return;
    uses.set(bare, (uses.get(bare) || []).concat(who));
  };
  for (const l of LEG) if (l.home) check(l.home.place, 'legends.json ' + l.id);
  for (const m of POW.masters || []) check(m.homeName, 'power.json ' + m.id);
  for (const [f, d] of FIGS) for (const x of d.figures || []) if (x.home) { check(x.home.name, `figures/${f} ${x.id}`); check(x.home.domain, `figures/${f} ${x.id} (domain)`); }
  for (const [bare, who] of uses) {
    const inLore = new RegExp('\\b' + bare.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(loreText);
    if (!inLore) lead('places', `"${bare}" appears nowhere in the release lore; used by ${who.length}: ${who.slice(0, 4).join(', ')}${who.length > 4 ? ', ...' : ''}`);
  }
}

if (want('bands')) {
  // a species name inside the band's words (the longest match wins: "Ogre Hetman" over "Ogre"; "frost-fell giant" is not "Fell Giant")
  const bands = POW.bands || [];
  const names = BEST.species.map(s => [s, s.n.replace(/^The\s+/, '')]).filter(([, n]) => n.length >= 3);
  bands.forEach((b, i) => {
    const lo = b.from, hi = bands[i + 1] ? bands[i + 1].from - 1 : 1000, txt = (b.d || '').toLowerCase();
    const hits = [];
    for (const [s, n] of names) {
      const re = new RegExp('(?<![-\\w])' + n.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(e?s)?\\b', 'g');
      for (const m of txt.matchAll(re)) hits.push({ s, n, a: m.index, z: m.index + m[0].length });
    }
    for (const h of hits) {
      if (hits.some(o => o !== h && o.a <= h.a && o.z >= h.z && o.z - o.a > h.z - h.a)) continue;
      if (h.s.level < lo || h.s.level > hi) lead('bands', `band ${b.r} (${lo}-${hi}) names "${h.n}", whose bestiary level is ${h.s.level} (${h.s.id})`);
    }
  });
}

if (want('counts')) {
  for (const [fam, F] of Object.entries(BEST.families)) {
    const sum = BEST.species.filter(s => s.fam === fam).reduce((a, s) => a + (s.world || 0), 0);
    if (F.cap) info('counts', `family ${fam}: cap ${F.cap}, world counts sum to ${sum}` + (sum > F.cap ? ' (OVER THE CAP)' : ''));
  }
  const byKind = new Map();
  for (const [f, d] of FIGS) for (const x of d.figures || []) if (x.kind) byKind.set(x.kind, (byKind.get(x.kind) || []).concat(f));
  for (const [k, fs_] of byKind) {
    const s = BEST.species.find(s => s.id === k);
    if (!s) lead('counts', `figures of kind ${k} (${fs_[0]}) but no bestiary species ${k}`);
    else if (s.world != null && s.world !== fs_.length) lead('counts', `bestiary ${k} world ${s.world}, figures of that kind ${fs_.length} (${fs_[0]})`);
  }
}

if (want('rarity')) {
  const sk = J('data/skills/vocab.json'), tv = J('data/titles/vocab.json'), cl = J('data/classes.json');
  info('rarity', `data/skills/vocab.json rarities: ${JSON.stringify(sk.rarities)}`);
  info('rarity', `data/titles/vocab.json rarities: ${JSON.stringify(tv.rarities)} (unique is a flag there)`);
  info('rarity', `data/classes.json rarities: ${JSON.stringify(cl.rarities)}`);
  const q = new Map();
  const walkQ = (o, f) => { if (Array.isArray(o)) o.forEach(x => walkQ(x, f)); else if (o && typeof o === 'object') { if (typeof o.quality === 'string') q.set(o.quality, (q.get(o.quality) || new Set()).add(f)); Object.values(o).forEach(x => walkQ(x, f)); } };
  walkQ(LEG, 'legends.json'); walkQ(POW.masters, 'power.json'); for (const [f, d] of FIGS) walkQ(d, 'figures/' + f);
  info('rarity', 'item quality words: ' + [...q].map(([k, s]) => `${k} (${[...s].join(', ')})`).join('; '));
  const used = new Map();
  for (const t of TITLES) used.set('titles:' + t.rarity, (used.get('titles:' + t.rarity) || 0) + 1);
  info('rarity', 'titles by rarity: ' + [...used].map(([k, n]) => `${k.slice(7)} ${n}`).join(', '));
}

if (want('masters')) {
  for (const m of POW.masters || []) {
    for (const r of Object.values(LORE.realms)) if (r.capital === m.homeName) {
      const ruler = String(r.ruler).split(';').map(id => (CAST[id] || {}).name || id).join(' and ');
      lead('masters', `${m.id} "${m.n}" sits in ${m.homeName}, the capital of ${r.id} ${r.name}, whose lore ruler is ${ruler}`);
    }
  }
}

if (want('lore')) {
  const ctx = { A: {}, console }; vm.createContext(ctx);
  try {
    for (const f of ['02-game-data-a.js', '02-game-data-b.js']) vm.runInContext(rd('src/core/release/core/' + f), ctx);
    vm.runInContext('globalThis.__GD = GD', ctx);
    const GD = ctx.__GD;
    for (const [rid, r] of Object.entries(LORE.realms)) {
      const lc = Object.values(LORE.cultures).filter(c => (c.pols || []).includes(rid)).map(c => c.id);
      if (GD.REALM_CULTURE && GD.REALM_CULTURE[rid] && lc.length && !lc.includes(GD.REALM_CULTURE[rid])) lead('lore', `${rid}: GD.REALM_CULTURE ${GD.REALM_CULTURE[rid]}, LORE.cultures lists it under ${lc.join('/')}`);
      const lf = Object.values(LORE.faiths).filter(f => (f.realms || []).includes(rid)).map(f => f.id);
      if (GD.REALM_FAITH && GD.REALM_FAITH[rid] && !lf.includes(GD.REALM_FAITH[rid])) info('lore', `${rid}: GD.REALM_FAITH ${GD.REALM_FAITH[rid]}, LORE.faiths[].realms lists it under ${lf.join('/') || 'none'}`);
    }
    const extra = Object.keys(GD.REALM_CULTURE || {}).filter(k => !LORE.realms[k]);
    if (extra.length) info('lore', `GD.REALM_CULTURE keys with no lore realm: ${extra.join(', ')}`);
  } catch (e) { info('lore', 'could not load GD: ' + e.message); }
  for (const [rid, r] of Object.entries(LORE.realms)) {
    const ids = String(r.ruler).split(';');
    const names = ids.map(id => (CAST[id] || {}).name);
    const hist = (LORE.rulerHistory[rid] || []).filter(x => x[4] === 'reigning').map(x => x[0]);
    for (const n of names) if (n && hist.length && !hist.includes(n)) lead('lore', `${rid}: ruler ${n} (cast) but rulerHistory reigning ${hist.join('/')}`);
    for (const h of Object.values(LORE.houses)) if (h.realm === rid && ids.includes(h.head) && h.headName && !names.includes(h.headName)) lead('lore', `${rid}: house ${h.id} headName ${h.headName}, cast ${h.head} is ${(CAST[h.head] || {}).name}`);
  }
}

if (want('creatures')) {
  const C = Object.fromEntries(LORE.creatures.map(c => [c.id, c]));
  for (const s of BEST.species.filter(s => s.cre)) {
    const c = C[s.cre];
    if (!c) { lead('creatures', `${s.id} maps to ${s.cre}, which LORE.creatures lacks`); continue; }
    if (c.name.replace(/^The /, '') !== s.n.replace(/^The /, '')) lead('creatures', `${s.cre} is "${c.name}" in the lore, "${s.n}" in the bestiary`);
    if (/dragon|calamity|demon/.test(s.tier) || s.level >= 500) info('creatures', `${s.cre} ${c.name}: lore size "${String(c.size).slice(0, 70)}" / bestiary level ${s.level}, tier ${s.tier}`);
  }
}

if (want('code')) {
  const files = [];
  const walk = d => { for (const f of fs.readdirSync(path.join(root, d))) { const p = d + '/' + f; const st = fs.statSync(path.join(root, p)); if (st.isDirectory()) walk(p); else if (/\.js$/.test(f) && !/a-v2\.core\.js$/.test(f)) files.push(p); } };
  walk('src');
  // the legends' and the masters' names (the fixed figures' short names, Cinder or Quill, are common words)
  const names = [...beings.values()].filter(b => b.recs.some(([f]) => /^data\/(legends|power)\.json/.test(f))).map(b => b.name).filter(n => n && n.length > 4).map(n => n.replace(/^The /, ''));
  const rx = new RegExp('\\b(' + names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b');
  for (const f of files) rd(f).split('\n').forEach((ln, i) => { if (/^\s*(\/\/|\*)/.test(ln)) return; const m = ln.match(rx); if (m && /['"`]/.test(ln)) info('code', `${f}:${i + 1} writes "${m[1]}" in code`); });
}

if (want('ids')) {
  const kinds = new Map();
  const put = (id, k) => kinds.set(id, (kinds.get(id) || new Set()).add(k));
  for (const l of LEG) put(l.id, 'legend');
  for (const m of POW.masters || []) put(m.id, 'master');
  for (const s of BEST.species) put(s.id, 'species');
  for (const [f, d] of FIGS) for (const x of d.figures || []) put(x.id, 'figure');
  for (const t of TITLES) put(t.id, 'title');
  for (const c of J('data/classes.json').classes || []) put(c.id, 'class');
  for (const f of ['arms', 'beings', 'body']) for (const s of J(`data/skills/kinds/${f}.json`).skills || []) put(s.id, 'art');
  for (const [id, ks] of kinds) if (ks.size > 1) info('ids', `${id} is a ${[...ks].join(' and a ')}`);
}

console.log(out.length ? out.join('\n') : 'no leads');
console.log(`\n${out.filter(l => l.startsWith('LEAD')).length} leads, ${out.filter(l => !l.startsWith('LEAD')).length} notes (checks: ${only.length ? only.join(',') : 'all'})`);
