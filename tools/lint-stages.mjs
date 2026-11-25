// X2 (D-056): hold the named stages, and count the functions that are defined more than once.
//
//   node tools/lint-stages.mjs            check (tools/check.mjs runs it); exit 1 on a fault
//   node tools/lint-stages.mjs --write    lower tests/stages-baseline.json to today's count (never raises it)
//   node tools/lint-stages.mjs --list     also print every name defined more than once, with its features
//   node tools/lint-stages.mjs --root=/x  read another checkout (to measure a commit before this lint existed)
//
// It reads the code the build joins into the core script (src/core/release/core/*.js, then every feature's *.core.js in
// folder order, work in progress included for the stage rules, left out of the count) and fails when:
//   1. a staged function (a key of A.FN_STAGE_ORDER in src/core/01-stages/manifest.core.js) is assigned anywhere but its
//      one definition in the release: `A.applyFx = ...`, `UI[k] = ...` in a loop over a list that names it, or
//      Object.assign(UI, { render() {...} }). Features add to it with A.addStage(key, name, spec);
//   2. an A.addStage call on a staged function has a name that is not a string, is not in the manifest under that
//      function, does not start with its feature's name, or is used twice; or the manifest lists a name no code registers;
//   3. more names are defined more than once than tests/stages-baseline.json allows (the count may only fall).
// A definition is the census of docs/CRITIQUE.md P3 (tools/critique-probes/.../census2.mjs): `X.name = function`,
// `X[k] = function` in a loop over a literal list, and functions in Object.assign(X, {...}), for X in A, UI, MAP, SAVES,
// GD (and their objects such as UI.A, UI.TAB); since X2 also A.addStage on a function that is not staged (it wraps in place).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const root = path.resolve(arg('root') || here);
const req = createRequire(path.join(here, 'node_modules', 'x.js'));
let acorn; try { acorn = req('acorn'); } catch { acorn = createRequire('/opt/node-tools/node_modules/x.js')('acorn'); }
const BASEFILE = path.join(here, 'tests/stages-baseline.json');
const ROOTS = new Set(['A', 'UI', 'MAP', 'SAVES', 'GD']);
const SUBOBJ = /^(UI\.A|UI\.C|A\.[A-Z0-9_]+|UI\.[A-Z0-9_]+)$/;

// ---- the sources, in build order
const SYSTEMS = ['core', 'map', 'world', 'people', 'family', 'nobility', 'diplomacy', 'war', 'economy', 'events', 'ui'];
const feats = [];
for (const sys of SYSTEMS) {
  const base = path.join(root, 'src', sys);
  if (!fs.existsSync(base)) continue;
  for (const dir of fs.readdirSync(base)) if (/^\d+-/.test(dir) && fs.statSync(path.join(base, dir)).isDirectory()) feats.push({ dir, sys, path: path.join(base, dir) });
}
feats.sort((a, b) => (a.dir < b.dir ? -1 : a.dir > b.dir ? 1 : 0));
const files = [];
const relDir = path.join(root, 'src/core/release/core');
for (const f of fs.readdirSync(relDir).filter(f => f.endsWith('.js')).sort()) files.push({ file: path.join(relDir, f), feature: 'release', wip: false });
for (const ft of feats) {
  const wip = fs.existsSync(path.join(ft.path, '.wip'));
  for (const f of fs.readdirSync(ft.path).filter(f => f.endsWith('.core.js')).sort()) files.push({ file: path.join(ft.path, f), feature: ft.dir.replace(/^\d+-/, ''), wip });
}

// ---- the manifest
const manFile = path.join(root, 'src/core/01-stages/manifest.core.js');
let ORDER = {};
if (fs.existsSync(manFile)) { const ctx = { A: {} }; vm.runInNewContext(fs.readFileSync(manFile, 'utf8'), ctx); ORDER = ctx.A.FN_STAGE_ORDER || {}; }
const STAGED = new Set(Object.keys(ORDER));

// ---- walk every file
const rel = f => path.relative(root, f);
const faults = [];
const def = {}; // name -> [{ feature, wip }]
const addDef = (name, at) => (def[name] = def[name] || []).push(at);
const regs = []; // A.addStage registrations: { key|null, name, feature, where }
const isFn = n => n && /Function|Arrow/.test(n.type);
function walk(n, f, parents) {
  if (!n || typeof n.type !== 'string') return;
  f(n, parents);
  parents.push(n);
  for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach(x => walk(x, f, parents)); else if (v && typeof v.type === 'string') walk(v, f, parents); }
  parents.pop();
}
// the literal strings a for-of loop variable takes, or null
const loopValues = (name, parents) => {
  for (let i = parents.length - 1; i >= 0; i--) {
    const p = parents[i];
    if (p.type === 'ForOfStatement' && p.left.type === 'VariableDeclaration' && p.left.declarations[0].id.name === name)
      return p.right.type === 'ArrayExpression' && p.right.elements.every(e => e && e.type === 'Literal' && typeof e.value === 'string') ? p.right.elements.map(e => e.value) : null;
  }
  return null;
};
// the keys an A.addStage first argument names: a string, a list of strings, or 'X.' + v with v a loop variable over a
// literal list; null when it cannot be known without running (a helper's parameter, A.COMMANDS)
const stageKeys = (n, parents, text) => {
  if (n.type === 'Literal' && typeof n.value === 'string') return [n.value];
  if (n.type === 'ArrayExpression' && n.elements.every(e => e && e.type === 'Literal')) return n.elements.map(e => e.value);
  if (n.type === 'BinaryExpression' && n.operator === '+' && n.left.type === 'Literal' && n.right.type === 'Identifier') {
    const vs = loopValues(n.right.name, parents);
    return vs ? vs.map(v => n.left.value + v) : null;
  }
  return null;
};

for (const F of files) {
  const src = fs.readFileSync(F.file, 'utf8');
  let ast;
  try { ast = acorn.parse(F.feature === 'release' ? src : `(function(){\n${src}\n})();`, { ecmaVersion: 'latest', sourceType: 'script' }); }
  catch (e) { faults.push(`${rel(F.file)}: does not parse (${e.message})`); continue; }
  const off = F.feature === 'release' ? 0 : '(function(){\n'.length;
  const text = n => (F.feature === 'release' ? src : `(function(){\n${src}\n})();`).slice(n.start, n.end);
  const lineOf = n => src.slice(0, Math.max(0, n.start - off)).split('\n').length;
  const where = n => `${rel(F.file)}:${lineOf(n)}`;
  const at = { feature: F.feature, wip: F.wip };
  const defined = (name, n, form) => {
    if (STAGED.has(name) && !(F.feature === 'release' && form === 'direct')) faults.push(`${where(n)}: ${name} is staged: add to it with A.addStage('${name}', '<feature>', next => function () {...}), not by assigning it`);
    addDef(name, at);
  };
  walk(ast, (n, parents) => {
    if (n.type === 'AssignmentExpression' && n.operator === '=' && n.left.type === 'MemberExpression') {
      const L = n.left;
      if (!L.computed && isFn(n.right)) {
        const obj = text(L.object);
        if (ROOTS.has(obj) || SUBOBJ.test(obj)) defined(obj + '.' + L.property.name, n, 'direct');
      }
      if (L.computed && L.property.type === 'Identifier') {
        const obj = text(L.object);
        if (ROOTS.has(obj) || obj === 'UI.A' || obj === 'UI.C') {
          const vs = loopValues(L.property.name, parents);
          if (vs && isFn(n.right)) for (const v of vs) defined(obj + '.' + v, n, 'loop');
          // a staged function assigned through a loop over a list that names it, whatever the right side
          else if (vs) for (const v of vs) if (STAGED.has(obj + '.' + v)) defined(obj + '.' + v, n, 'loop');
        }
      }
    }
    if (n.type === 'CallExpression' && n.callee.type === 'MemberExpression' && text(n.callee) === 'Object.assign' && n.arguments[0]) {
      const obj = text(n.arguments[0]);
      if (ROOTS.has(obj) || obj === 'UI.A' || obj === 'UI.C') for (const a of n.arguments.slice(1)) if (a.type === 'ObjectExpression') for (const p of a.properties) {
        if (!p.key || !isFn(p.value)) continue;
        defined(obj + '.' + (p.key.name || p.key.value), n, 'assign');
      }
    }
    if (n.type === 'CallExpression' && n.callee.type === 'MemberExpression' && text(n.callee) === 'A.addStage') {
      const [k, nm] = n.arguments;
      if (!nm || nm.type !== 'Literal' || typeof nm.value !== 'string') { faults.push(`${where(n)}: A.addStage needs a stage name written as a string`); return; }
      const keys = k ? stageKeys(k, parents, text) : null;
      if (!keys) { regs.push({ key: null, name: nm.value, feature: F.feature, where: where(n), wip: F.wip }); return; }
      for (const key of keys) {
        if (STAGED.has(key)) regs.push({ key, name: nm.value, feature: F.feature, where: where(n), wip: F.wip });
        else addDef(key, at); // a function that is not staged: the stage wraps it in place, a definition like any other
      }
    }
  }, []);
}

// ---- the stage rules
const seen = new Set();
for (const r of regs) {
  const feat = r.name.split('.')[0];
  if (r.feature !== 'release' && feat !== r.feature) faults.push(`${r.where}: stage "${r.name}" must start with its feature's name "${r.feature}"`);
  if (r.feature === 'release' && r.name !== 'journal') faults.push(`${r.where}: the release's only stage is "journal"`);
  if (!r.key) continue;
  if (!ORDER[r.key].includes(r.name)) faults.push(`${r.where}: stage "${r.name}" on ${r.key} is not in src/core/01-stages/manifest.core.js`);
  const id = r.key + ' ' + r.name;
  if (seen.has(id)) faults.push(`${r.where}: a second stage "${r.name}" on ${r.key}`);
  seen.add(id);
}
const dynamic = new Set(regs.filter(r => !r.key).map(r => r.name));
for (const [key, names] of Object.entries(ORDER)) {
  if (new Set(names).size !== names.length) faults.push(`manifest: ${key} lists a name twice`);
  for (const nm of names) if (!seen.has(key + ' ' + nm) && !dynamic.has(nm)) faults.push(`manifest: ${key} lists "${nm}", which no code registers`);
}

// ---- the count (the default build: work in progress left out)
const rows = Object.entries(def).map(([name, v]) => ({ name, n: v.filter(x => !x.wip).length, feats: [...new Set(v.filter(x => !x.wip).map(x => x.feature))] })).filter(r => r.n > 0).sort((a, b) => b.n - a.n || (a.name < b.name ? -1 : 1));
const multi = rows.filter(r => r.n > 1);
const per = Object.fromEntries([...STAGED].map(k => [k, (rows.find(r => r.name === k) || { n: 0 }).n]));
const stagesPer = Object.fromEntries([...STAGED].map(k => [k, regs.filter(r => r.key === k && !r.wip).length + regs.filter(r => !r.key && (ORDER[k] || []).includes(r.name) && !r.wip).length]));
const now = { names: rows.length, definitions: rows.reduce((a, r) => a + r.n, 0), definedMoreThanOnce: multi.length };
console.log(`stages: ${STAGED.size} staged functions, ${regs.length} A.addStage registrations; ${now.names} names, ${now.definitions} definitions, ${now.definedMoreThanOnce} defined more than once`);
for (const k of STAGED) console.log(`  ${k.padEnd(16)} ${per[k]} definition, ${ORDER[k].length} stages in the manifest`);
if (process.argv.includes('--list')) for (const r of multi) console.log(String(r.n).padStart(4), r.name.padEnd(32), r.feats.join(' '));
for (const k of STAGED) if (per[k] !== 1) faults.push(`${k}: ${per[k]} definitions (one, the release's, runs its stages)`);
const base = fs.existsSync(BASEFILE) ? JSON.parse(fs.readFileSync(BASEFILE, 'utf8')) : null;
if (base && !arg('root')) {
  if (now.definedMoreThanOnce > base.definedMoreThanOnce) faults.push(`${now.definedMoreThanOnce} names are defined more than once; tests/stages-baseline.json allows ${base.definedMoreThanOnce}. Add a stage, or reuse the definition, instead of wrapping (run with --list)`);
  else if (now.definedMoreThanOnce < base.definedMoreThanOnce) {
    if (process.argv.includes('--write')) { base.definedMoreThanOnce = now.definedMoreThanOnce; base.definitions = now.definitions; fs.writeFileSync(BASEFILE, JSON.stringify(base, null, 2) + '\n'); console.log(`lowered tests/stages-baseline.json to ${now.definedMoreThanOnce}`); }
    else console.log(`fewer names defined more than once than the baseline (${base.definedMoreThanOnce}): lower it with --write`);
  }
}
// the master prompt's 4.6 (Phase 0): the wrapper layers (A.addStage registrations of the default build) and the feature
// patch files may only fall, like the names defined more than once
{
  const nRegs = regs.filter(r => !r.wip).length;
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : e.name === 'patches.mjs' ? [path.join(d, e.name)] : []);
  const nPatch = walk(path.join(here, 'src')).filter(f => !fs.existsSync(path.join(path.dirname(f), '.wip'))).length;
  console.log(`wrappers: ${nRegs} A.addStage registrations, ${nPatch} patch files (baseline ${base && base.addStage != null ? base.addStage : '-'}, ${base && base.patches != null ? base.patches : '-'})`);
  if (base && !arg('root')) {
    if (base.addStage != null && nRegs > base.addStage) faults.push(`${nRegs} A.addStage registrations; tests/stages-baseline.json allows ${base.addStage}. No new wrapper (master prompt 2, 4.6): change the module that owns the function`);
    if (base.patches != null && nPatch > base.patches) faults.push(`${nPatch} patch files in the default build; tests/stages-baseline.json allows ${base.patches}. Change the release in its source`);
    if (process.argv.includes('--write') && ((base.addStage != null && nRegs < base.addStage) || (base.patches != null && nPatch < base.patches))) {
      base.addStage = Math.min(base.addStage, nRegs); base.patches = Math.min(base.patches, nPatch); fs.writeFileSync(BASEFILE, JSON.stringify(base, null, 2) + '\n');
    }
  }
}
if (faults.length) { console.error(`stages FAIL (${faults.length}):\n  ` + faults.join('\n  ')); process.exitCode = 1; }
else console.log('stages ok');
