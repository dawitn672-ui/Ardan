// W1-2 (R1, rule 18, D-062, D-069): count the decisions in AI code that still come down to bare dice.
//
//   node tools/lint-reasons.mjs            check (tools/check.mjs runs it); exit 1 when the count rises above the baseline
//   node tools/lint-reasons.mjs --write    lower tests/reasons-baseline.json to today's count (never raises it)
//   node tools/lint-reasons.mjs --list     also print every bare-dice decision: file:line, function, what it decides
//   node tools/lint-reasons.mjs --json=x   write the list as JSON (docs/design/r1-audit.md is built from it)
//
// A heuristic. It reads the code the build joins (src/core/release/core/*.js, every feature's *.core.js, the v2 engine's
// src/<system>/engine/*.js; not the ui system, tests or work in progress) and finds each roll of the dice: a call to
// `.chance(...)` (A.chance, rng.chance, rngFor(...).chance) and a comparison with `A.rand()` or `rng.next()`. A roll is a
// bare-dice decision when it decides something structural, read from
//   1. the names of the functions around it (A.factionsYear, P.fillGenerals, DV.tryWar, ...), or
//   2. what it guards: the text of the if or ?: it is the test of, or the && chain it ends,
// matching DECIDES below (a war or peace, a faction, a revolt or coup, an appointment, a betrayal, an alliance, a claim,
// a succession, a summons). A roll inside A.WHY's own draw is not one (it is the dice among reasons). A roll marked
// `lint-reasons: ok (<why>)` on its line or the line above is a reviewed exception (dice within reasons, a name, a look).
// The count may only fall: route the decision through A.WHY.decide (docs/design/r1-audit.md lists what reasons each needs).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const root = path.resolve(arg('root') || here);
const req = createRequire(path.join(here, 'node_modules', 'x.js'));
let acorn; try { acorn = req('acorn'); } catch { acorn = createRequire('/opt/node-tools/node_modules/x.js')('acorn'); }
const BASEFILE = path.join(here, 'tests/reasons-baseline.json');

// what a structural decision is about (in a function's name or in what a roll guards)
// W1-6 (D-102): and a council's counsel or a proposal to the crown (A.councilPropose's acceptance roll was a bare die the
// heuristic missed: it sat in a variable's initialiser, in a function whose name matched nothing)
const DECIDES = /declareWar|startWar|aiWarCheck|tryWar|warOn|\bwar\b|'war'|"war"|\bpeace|settleWar|faction|revolt|\brebel|rising|\bcoup|usurp|betray|appoint|fillGeneral|fillOffice|\bcouncil\b|\bseat\b|takeSeat|\bally\b|allian|cancelTr|\bsign\(|aiSign|\bclaim|succession|\bheirs?\b|summon|muster|defect|tribut|vassal|\bplot|depose|abdicat|independ|counsel|councilPropose|\bfeud|private war|\bstaff\b/i;
// names that look like a decision word but are not one (the war machinery's own battle dice, a war's name, morale)
const NOT_DECIDES = /^(warName|warPreview|wsDay|wsBattle|fight|battle|siege|duel|casualt|loot|skirmish)/i;

const SYSTEMS = ['core', 'map', 'world', 'people', 'family', 'nobility', 'diplomacy', 'war', 'economy', 'events'];
const files = [];
const relDir = path.join(root, 'src/core/release/core');
for (const f of fs.readdirSync(relDir).filter(f => f.endsWith('.js')).sort()) files.push({ file: path.join(relDir, f), wrap: false });
for (const sys of SYSTEMS) {
  const base = path.join(root, 'src', sys);
  if (!fs.existsSync(base)) continue;
  for (const dir of fs.readdirSync(base).sort()) {
    const d = path.join(base, dir);
    if (!fs.statSync(d).isDirectory()) continue;
    if (dir === 'engine') { for (const f of fs.readdirSync(d).filter(f => f.endsWith('.js') && !f.endsWith('.data.js')).sort()) files.push({ file: path.join(d, f), module: true }); continue; }
    if (!/^\d+-/.test(dir) || fs.existsSync(path.join(d, '.wip')) || dir === '99990-v2-engine') continue;
    for (const f of fs.readdirSync(d).filter(f => f.endsWith('.core.js')).sort()) files.push({ file: path.join(d, f), wrap: true });
  }
}

const rel = f => path.relative(root, f);
function walk(n, f, parents) {
  if (!n || typeof n.type !== 'string') return;
  f(n, parents);
  parents.push(n);
  for (const k in n) { if (k === 'loc') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(x => walk(x, f, parents)); else if (v && typeof v.type === 'string') walk(v, f, parents); }
  parents.pop();
}
const memberName = n => {
  if (!n) return '';
  if (n.type === 'Identifier') return n.name;
  if (n.type === 'MemberExpression') return memberName(n.object) + '.' + (n.computed ? '[]' : n.property.name || n.property.value);
  if (n.type === 'Literal') return String(n.value);
  return '';
};
// the names of the functions around a node: A.factionsYear, want, P.fillGenerals ...
const fnNames = parents => {
  const out = [];
  for (let i = parents.length - 1; i >= 0; i--) {
    const p = parents[i];
    if (!/Function/.test(p.type)) continue;
    if (p.id && p.id.name) { out.push(p.id.name); continue; }
    const up = parents[i - 1];
    if (!up) continue;
    if (up.type === 'AssignmentExpression') out.push(memberName(up.left));
    else if (up.type === 'VariableDeclarator') out.push(up.id.name);
    else if (up.type === 'Property' || up.type === 'MethodDefinition') out.push(memberName(up.key));
  }
  return out.filter(Boolean);
};
const isDice = n => {
  if (n.type === 'CallExpression' && n.callee.type === 'MemberExpression' && !n.callee.computed && n.callee.property.name === 'chance') return true;
  if (n.type === 'BinaryExpression' && ['<', '<=', '>', '>='].includes(n.operator)) {
    const r = x => x && x.type === 'CallExpression' && /^(A\.rand|rng\.next|R\.next|this\.rand)$/.test(memberName(x.callee));
    return r(n.left) || r(n.right);
  }
  return false;
};

const found = [];
const faults = [];
for (const F of files) {
  const src = fs.readFileSync(F.file, 'utf8');
  let ast;
  const pre = F.wrap ? '(function(){\n' : '';
  try { ast = acorn.parse(pre + src + (F.wrap ? '\n})();' : ''), { ecmaVersion: 'latest', sourceType: F.module ? 'module' : 'script', locations: true }); }
  catch (e) { faults.push(`${rel(F.file)}: does not parse (${e.message})`); continue; }
  const off = pre.length, lines = src.split('\n'), lineOff = F.wrap ? 1 : 0;
  const text = n => src.slice(Math.max(0, n.start - off), Math.max(0, n.end - off));
  walk(ast, (n, parents) => {
    if (!isDice(n)) return;
    const line = n.loc.start.line - lineOff;
    if (/lint-reasons: ok/.test(lines[line - 1] || '') || /lint-reasons: ok/.test(lines[line - 2] || '')) return;
    const names = fnNames(parents);
    if (names.some(x => /WHY|why\.decide|^decide$/.test(x))) return;   // A.WHY's own draw: the dice among reasons
    // what the roll guards: the if or ?: it tests, else the && / || chain it sits in
    let guard = '';
    for (let i = parents.length - 1; i >= Math.max(0, parents.length - 6); i--) {
      const p = parents[i];
      if (p.type === 'IfStatement' || p.type === 'ConditionalExpression') { guard = text(p.consequent).slice(0, 500); break; }
      if (p.type === 'LogicalExpression' || p.type === 'SequenceExpression') guard = text(p).slice(0, 500);
    }
    const byName = names.find(x => DECIDES.test(x) && !NOT_DECIDES.test(x.replace(/^.*\./, '')));
    const m = !byName && guard ? guard.match(DECIDES) : null;
    if (!byName && !m) return;
    found.push({ file: rel(F.file), line, fn: names[0] || '(top)', why: byName ? `in ${byName}` : `guards "${m[0]}"`, code: (lines[line - 1] || '').trim().slice(0, 140) });
  }, []);
}

if (faults.length) { console.error(faults.join('\n')); process.exitCode = 1; }
const count = found.length;
const byFile = {};
for (const x of found) byFile[x.file] = (byFile[x.file] || 0) + 1;
if (process.argv.includes('--list')) for (const x of found) console.log(`${x.file}:${x.line}  ${x.fn}  (${x.why})  ${x.code}`);
if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify({ count, byFile, found }, null, 1));
const base = fs.existsSync(BASEFILE) ? JSON.parse(fs.readFileSync(BASEFILE, 'utf8')) : null;
if (process.argv.includes('--write')) {
  if (base && count > base.bareDice) { console.error(`lint-reasons: ${count} bare-dice decisions, more than the baseline's ${base.bareDice}: the baseline is never raised (route the new ones through A.WHY.decide)`); process.exit(1); }
  const out = { about: (base && base.about) || '', bareDice: count, byFile };
  fs.writeFileSync(BASEFILE, JSON.stringify(out, null, 2) + '\n');
  console.log(`lint-reasons: baseline written, ${count}`);
} else if (base && count > base.bareDice) {
  console.error(`lint-reasons: ${count} bare-dice decisions in AI code, more than the baseline's ${base.bareDice} (tests/reasons-baseline.json). New ones:`);
  for (const f of Object.keys(byFile)) if (byFile[f] > ((base.byFile || {})[f] || 0)) for (const x of found.filter(y => y.file === f)) console.error(`  ${x.file}:${x.line}  ${x.fn}  (${x.why})  ${x.code}`);
  console.error('Route the decision through A.WHY.decide with named reasons (docs/design/r1-audit.md), or mark a reviewed exception "lint-reasons: ok (why)".');
  process.exitCode = 1;
} else console.log(`lint-reasons: ${count} bare-dice decisions in AI code (baseline ${base ? base.bareDice : 'none'}; it may only fall)`);
