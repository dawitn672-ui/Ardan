// X1 (D-027): prove two builds run the same program.
//
//   node tools/release/verify.mjs <reference.html> <candidate.html>
//
// For each blob it parses both and compares their syntax trees after tools/release/transform.mjs's normalize, which
// drops only what a program cannot observe (positions, how a literal is spelled, comments). For the core, the
// reference is first put through the same de-minifying rewrite the release source was made with (transform.mjs
// `rewrite`, statement-level only), so "equal" means: the candidate is the reference, reformatted and rewritten by
// those rules and nothing else. The content blob must also keep every function's text character for character
// (the game reads event functions as text), and the lore blob must be byte-identical. The page outside the blobs
// must match once the build tag and the script hashes are set aside.
//
// Use it whenever a change is meant to be behaviour-neutral (a refactor, a formatting pass): build before and after,
// then run this. Exit code 1 on any difference.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unpack } from '../blob-pack.mjs';
import { rewrite, normalize, firstDiff } from './transform.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const req = createRequire(path.join(root, 'node_modules', 'x.js'));
let acorn; try { acorn = req('acorn'); } catch { acorn = createRequire('/opt/node-tools/node_modules/x.js')('acorn'); }
const SEP = '\u0001ARDAN-PACK\u0001';
const parse = s => acorn.parse(s, { ecmaVersion: 'latest', sourceType: 'script' });

// every function's source text, in order
function fnTexts(src) {
  const out = [];
  const walk = n => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) return n.forEach(walk);
    if (n.type === 'ArrowFunctionExpression' || n.type === 'FunctionExpression' || n.type === 'FunctionDeclaration') {
      // a pack's own wrapper (an IIFE at statement level) is laid out anew; the functions inside it are not
      out.push(n);
    }
    for (const k of Object.keys(n)) if (k !== 'start' && k !== 'end' && n[k] && typeof n[k] === 'object') walk(n[k]);
  };
  walk(parse(src));
  return out.map(n => src.slice(n.start, n.end));
}

export function verify(refHtml, candHtml) {
  const A = unpack(refHtml), B = unpack(candHtml), report = {};
  let ok = true;
  // core: rewrite(reference) == candidate
  {
    // the rewrite applies to the release's own statements only: the features' code after it is compared as written
    const ra = parse(A['ardan-core']), cut = releaseEnd(A['ardan-core']);
    ra.body = [...rewrite({ type: 'Program', body: ra.body.filter(s => s.start < cut) }).body, ...ra.body.filter(s => s.start >= cut)];
    const a = normalize(ra), b = normalize(parse(B['ardan-core']));
    const d = firstDiff(a, b);
    report.core = d ? `DIFFERENT at ${d}` : `same program (${a.body.length} top-level statements after the rewrite)`;
    if (d) ok = false;
  }
  // content: pack by pack, same tree; every function inside a pack keeps its text
  {
    const pa = A['ardan-content'].split(SEP), pb = B['ardan-content'].split(SEP);
    let diffs = [], fnSame = 0, fnDiff = [];
    if (pa.length !== pb.length) diffs.push(`pack count ${pa.length} vs ${pb.length}`);
    for (let i = 0; i < Math.min(pa.length, pb.length); i++) {
      // a pack's top-level comma lists may be split into statements, the same rule as the core
      const d = firstDiff(normalize(rewriteTop(parse(pa[i]))), normalize(rewriteTop(parse(pb[i]))));
      if (d) diffs.push(`pack ${i}: ${d}`);
      const fa = fnTexts(pa[i]).filter(t => !isWrapper(t, pa[i])), fb = fnTexts(pb[i]).filter(t => !isWrapper(t, pb[i]));
      const setB = new Map(); for (const t of fb) setB.set(t, (setB.get(t) || 0) + 1);
      for (const t of fa) { if (setB.get(t)) { setB.set(t, setB.get(t) - 1); fnSame++; } else fnDiff.push(`pack ${i}: ${t.slice(0, 100)}`); }
    }
    report.content = (diffs.length ? `DIFFERENT: ${diffs.slice(0, 3).join('; ')}` : `same program (${pa.length} packs)`) +
      `; ${fnSame} functions with identical text, ${fnDiff.length} changed` + (fnDiff.length ? ': ' + fnDiff.slice(0, 3).join(' | ') : '');
    if (diffs.length || fnDiff.length) ok = false;
  }
  report.lore = A['ardan-lore'] === B['ardan-lore'] ? `byte-identical (${A['ardan-lore'].length} chars)` : 'DIFFERENT';
  if (A['ardan-lore'] !== B['ardan-lore']) ok = false;
  // the page outside the blobs
  const shell = h => h.replace(/(<script type="text\/plain" id="ardan-[a-z]+" data-n=")\d+(">)[\s\S]*?(<\/script>)/g, '$1$2$3')
    .replace(/window\.ARDAN_BUILD = '[^']*'/, '').replace(/'sha256-[A-Za-z0-9+/=]+'/g, '');
  report.page = shell(refHtml) === shell(candHtml) ? 'same outside the blobs (build tag and script hashes aside)' : 'DIFFERENT';
  if (report.page === 'DIFFERENT') ok = false;
  return { ok, report };
}
// where the release's own core ends: the data block, or else the first feature's code, follows it
function releaseEnd(src) {
  for (const m of ['\n;(function(){ // data/', '\n;(function(){ // src/']) { const i = src.indexOf(m); if (i >= 0) return i; }
  return src.length;
}
// only the pack wrappers' statement lists are laid out anew: split comma lists there, as the formatter does
function rewriteTop(ast) {
  const visit = list => list.flatMap(s => {
    if (s.type === 'ExpressionStatement' && s.expression.type === 'SequenceExpression') return s.expression.expressions.map(x => ({ type: 'ExpressionStatement', expression: x }));
    if (s.type === 'ExpressionStatement' && s.expression.type === 'CallExpression' && s.expression.callee.type === 'FunctionExpression') s.expression.callee.body.body = visit(s.expression.callee.body.body);
    return [s];
  });
  ast.body = visit(ast.body);
  return ast;
}
const isWrapper = (t, src) => /^function\s*\(\)\s*\{/.test(t) && (src.startsWith('(' + t) || src.includes('(' + t + ')()') || /^function\(\)\{\(function/.test(t) || /^function\s*\(\)\s*\{\n/.test(t));

if (process.argv[1] && import.meta.url === new URL('file://' + path.resolve(process.argv[1])).href) {
  const [ref, cand] = process.argv.slice(2);
  if (!ref || !cand) { console.error('usage: node tools/release/verify.mjs <reference.html> <candidate.html>'); process.exit(2); }
  const { ok, report } = verify(fs.readFileSync(ref, 'utf8'), fs.readFileSync(cand, 'utf8'));
  for (const [k, v] of Object.entries(report)) console.log(`${k.padEnd(8)} ${v}`);
  console.log(ok ? 'SAME PROGRAM' : 'DIFFERENT');
  process.exit(ok ? 0 : 1);
}
