// features/991-far-war/gen.mjs: turns the war lore of the Far Lands into game data (a-data.core.js).
//
//   node features/991-far-war/gen.mjs            write a-data.core.js from canon/lore/
//   node features/991-far-war/gen.mjs --check    fail if the checked-in file is not what the lore makes
//
// Reads canon/lore/war-and-legends.json (templates, styles, orders, legends, masters, reputation groups) and
// canon/lore/far-lands.json (each polity's army: template, troop codes, elite companies, beasts; its capital's size).
// What it keeps is game data: ids, names, numbers, troop codes, ranks, and the one-line texts a style or a technique
// already is (a philosophy, a strength, a weakness, a technique's line). Prose paragraphs (a style's origin, a
// legend's deeds and mind, an order's history) are left in the lore; the game writes its own short lines for them.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..');
const LORE = path.join(ROOT, 'canon', 'lore');
const OUT = path.join(HERE, 'a-data.core.js');

const rawW = fs.readFileSync(path.join(LORE, 'war-and-legends.json'), 'utf8');
const rawF = fs.readFileSync(path.join(LORE, 'far-lands.json'), 'utf8');
const W = JSON.parse(rawW), F = JSON.parse(rawF);
const hash = crypto.createHash('sha1').update(rawW).update(rawF).digest('hex').slice(0, 12);

// one line: the first sentence (or clause) of a lore string, at most n characters, cut at a word
const line = (s, n = 140) => {
  s = String(s || '').replace(/\s+/g, ' ').replace(/[<>"{}]/g, '').trim();
  if (!s) return '';
  const m = s.match(/^(.+?[.!?])(\s|$)/);
  if (m && m[1].length <= n) return m[1];
  if (s.length <= n) return s;
  const semi = s.slice(0, n).lastIndexOf(';');
  if (semi > n * 0.45) return s.slice(0, semi) + '.';
  const sp = s.slice(0, n).lastIndexOf(' ');
  return s.slice(0, sp > 0 ? sp : n).replace(/[,;:]$/, '') + '.';
};
const pid = id => String(id || '').match(/^POL-\d+$/) ? id : null;

// ---- templates and armies
const templates = {};
for (const t of W.templates) templates[t.id] = { name: t.name, tactics: t.tactics.slice(), users: [] };
const armies = {};
for (const p of F.polities) {
  const a = p.army; if (!a) continue;
  const c = {};
  for (const k in a.composition || {}) if (a.composition[k] > 0) c[k] = a.composition[k];
  armies[p.polity_id] = {
    t: a.template, c,
    el: (a.elite || []).map(e => [line(e.name, 60), e.code, e.men | 0]),
    beasts: a.beasts && a.beasts.elephants ? a.beasts.elephants | 0 : 0,
    cap: p.capital ? { name: p.capital.name, pop: p.capital.population | 0 } : null,
  };
  if (templates[a.template]) templates[a.template].users.push(p.polity_id);
}

// ---- styles: the release's LORE.styles shape; origin is written by the game
const styles = W.styles.map(s => ({
  id: s.id, kind: s.kind, house: s.house || null, name: line(s.name, 80), prof: s.prof, weapons: s.weapons.slice(),
  philosophy: line(s.philosophy, 160), strengths: line(s.strengths, 150), weakness: line(s.weakness, 150),
  school: s.school ? { name: line(s.school.name, 80), seat: s.school.seat, fee: s.school.fee, entry: s.school.entry, master: s.school.master } : null,
  ranks: s.ranks.slice(0, 5),
  techniques: s.techniques.map(t => ({ id: t.id, name: line(t.name, 60), rank: t.rank, base: t.base, weapon: (t.weapon || []).slice(), uses: t.uses, cost: t.cost, fx: Object.assign({}, t.fx), desc: line(t.desc, 150), sid: s.id })),
  maneuver: s.maneuver ? { name: line(s.maneuver.name, 60), desc: line(s.maneuver.desc, 150), troops: s.maneuver.troops.slice(), fx: Object.assign({}, s.maneuver.fx) } : null,
  realm: s.realm,
}));

// ---- orders, legends, masters, reputation groups
const orders = W.orders.map(o => ({
  id: o.id, name: line(o.name, 70), realm: pid(o.realm), kind: o.kind, founded: o.founded || null, seat: o.seat || null, men: o.men | 0,
  troop: o.troop, style: o.style || null, head: o.head || null, oath: o.oath ? line(o.oath, 90) : null, sign: o.sign ? line(o.sign, 110) : null,
  deed: line(o.deed, 150),
}));
const age = x => x.age_on_1_jan_1105;
const legends = W.legends.map(l => ({
  id: l.id, name: l.name, epithet: l.epithet || '', race: l.race, sex: l.sex, born: l.born, age: age(l), realm: pid(l.realm), group: l.group, style: l.style,
  weak: line(l.weakness, 110), where: line(l.whereabouts_1105, 100), fight: line(l.how_they_fight, 140), gear: line(l.gear, 110), price: line(l.price_on_head, 110),
}));
const masters = W.masters.map(m => ({
  id: m.id, name: m.name, race: m.race, sex: m.sex, born: m.born, age: age(m), realm: pid(m.realm), group: m.group, style: m.style, school: line(m.school, 80),
  weak: line(m.weakness, 110), where: line(m.whereabouts_1105, 100), rival: line(m.rival, 80), deed: line(m.deed, 140),
}));
const groups = W.reputation_groups.map(g => ({ name: g.name, note: line(g.note, 140) }));

const data = { v: 1, lore: hash, templates, armies, styles, orders, legends, masters, groups };
const text = `// features/991-far-war/a-data.core.js: the war lore of the Far Lands as game data, generated by gen.mjs from
// canon/lore (${hash}). Do not edit by hand: run node features/991-far-war/gen.mjs.
A.FW_DATA = ${JSON.stringify(data)};
`;
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (cur !== text) { console.error('a-data.core.js is not what the lore makes: run node features/991-far-war/gen.mjs'); process.exit(1); }
  console.log('a-data.core.js is up to date'); process.exit(0);
}
fs.writeFileSync(OUT, text);
console.log(`wrote ${path.relative(ROOT, OUT)}: ${Object.keys(armies).length} armies, ${Object.keys(templates).length} templates, ${styles.length} styles, ${orders.length} orders, ${legends.length} legends, ${masters.length} masters, ${groups.length} groups, ${(text.length / 1024).toFixed(0)} KB`);
