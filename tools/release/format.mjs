// X1 (D-027): turn the baked release (tools/release/bake.mjs) into the readable source tree src/core/release/.
// One-time conversion, kept so it can be re-run and audited. Needs prettier and astring, which the repo does not
// carry (nothing else uses them):
//
//   mkdir -p /tmp/fmt && (cd /tmp/fmt && npm i astring@1.9.0 prettier@3.6.2 acorn@8.15.0)
//   FORMAT_DEPS=/tmp/fmt/node_modules node tools/release/format.mjs --patches=archive/x1-patch-layer [--out=src/core/release]
//
// core     the engine and interface: tools/release/transform.mjs's rewrites, printed by astring, then prettier;
//          one file per section (a section is a run of the release's own top-level statements, split further when long);
//          every baked patch is a comment on the statement it changed. The LORE table is core/00-lore.json.
// content  the release's 30 event packs, one file each, laid out one statement, property and element per line, with
//          every function kept character for character: the game reads event functions as text (A.evAudience,
//          A.CX_RX, A.EV_RX), so their text must not change. Baked patches are comments on the line they changed.
// lore     the five lazy lore tables, one JSON file each (records one per line).
// page     the page: style, bootloader and the three empty payload slots the build fills.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { bake, emptyPage } from './bake.mjs';
import { rewrite } from './transform.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const arg = k => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const req = createRequire(path.join(process.env.FORMAT_DEPS || path.join(root, 'node_modules'), 'x.js'));
const acorn = req('acorn'), astring = req('astring'), prettier = req('prettier');
const OUT = path.resolve(root, arg('out') || 'src/core/release');
const SEP = '\u0001ARDAN-PACK\u0001';
const PRETTIER = { parser: 'acorn', printWidth: 120, quoteProps: 'preserve', arrowParens: 'avoid', trailingComma: 'all' };
const parse = s => acorn.parse(s, { ecmaVersion: 'latest', sourceType: 'script' });

// the release core's top-level statements, by index, grouped into sections
const SECTIONS = [
  [1, '01-lore-tables', 'The lazy lore tables (cast, families, house lore, styles, academies), read from the ardan-lore payload on first use.'],
  [2, '02-game-data', 'GD: the fixed game data (stats, races, skills, perks, gear, looks).'],
  [8, '03-engine-base', 'A: the random numbers, the state, people, realms and the small helpers everything uses; starting and ending wars.'],
  [10, '04-realms-and-war-years', 'Provinces changing hands, realms falling, the war year, losses and fronts; talking to people (A.interact).'],
  [13, '05-marriage-jobs-and-law', 'Charm, marriage, jobs, the law and punishment.'],
  [15, '06-prison-travel-school-ai', 'Prison, exile, travel, schools, the AI people act by, and starting a duel.'],
  [17, '07-duels', 'Duels: reads, hits, the end of a fight; enlisting.'],
  [19, '08-soldiering', 'The squad, comrades, resigning, deserting, the soldier\'s year.'],
  [21, '09-missions-and-line-battles', 'Missions and their stages, line battles.'],
  [27, '10-companies-and-war-staff', 'Free companies, seizing land, battle ends, armies and the war staff\'s raising and mobilising.'],
  [29, '11-armies-divisions-and-council', 'Demobilising, divisions, the army day, the order of battle, the council and the noble\'s year.'],
  [33, '12-nobility-and-politics', 'Noble actions, authority, reasons for war, the politics year and calls to arms.'],
  [37, '13-factions-and-decisions', 'Houses, factions, net worth, the decisions (A.DEC) and the progress year.'],
  [41, '14-bonds-and-favours', 'Relationship labels, bonds, favours owed, superiors and obligations.'],
  [42, '15-specialisms-and-promotion', 'Specialisms, mastery, arms, doctrines, growth and the promotion board.'],
  [47, '16-classes-roles-and-paths', 'Training, classes, roles, the plan and the career paths.'],
  [49, '17-careers-and-event-engine', 'Careers, doors, the job board, A.defEvents, the condition helpers (A.C) and rolling events.'],
  [50, '18-event-view', 'Showing an event, its tokens, checks and choices; the queue and the journal\'s helpers.'],
  [52, '19-journal-and-replay', 'The journal: recording, resuming and replaying a life, and its fingerprint.'],
  [54, '20-portraits', 'PORTRAIT: the drawn portraits.'],
  [56, '21-map', 'MAP: the map view.'],
  [58, '22-saves', 'SAVES: saving and loading.'],
  [60, '23-ui', 'UI: the interface.'],
];
const PART_CHARS = 90000; // a section longer than this (as astring prints it) is split into parts

const wrapText = (s, w = 112) => { const out = []; let line = ''; for (const word of s.split(/\s+/)) { if (line && (line + ' ' + word).length > w) { out.push(line); line = word; } else line = line ? line + ' ' + word : word; } if (line) out.push(line); return out; };
const patchNote = s => `[X1 baked patch ${s.feature.replace(/^src\//, '')} ${s.id}] ${s.why || ''}`;
const marker = s => `[X1 baked patch ${s.feature.replace(/^src\//, '')} ${s.id}]`;

// --- core -----------------------------------------------------------------------------------------------------------
async function formatCore(text, sites) {
  const ast = parse(text);
  const first = ast.body[0];
  const lore = first.declarations[0].init.arguments[0].quasis[0].value.cooked;
  if (JSON.stringify(JSON.parse(lore)) !== lore) throw new Error('LORE does not round-trip');
  const files = [{ name: '00-lore.json', text: prettyJson(JSON.parse(lore), 3) }];
  // the statements of each section, rewritten
  const groups = SECTIONS.map(([from, name, title], i) => ({ name, title, stmts: ast.body.slice(from, i + 1 < SECTIONS.length ? SECTIONS[i + 1][0] : ast.body.length) }));
  const prog = { type: 'Program', body: groups.flatMap(g => g.stmts), sourceType: 'script' };
  // remember which section each top-level statement came from, then rewrite
  const owner = new Map(); groups.forEach((g, gi) => g.stmts.forEach(s => owner.set(s, gi)));
  const tagged = prog.body.map(s => ({ s, gi: owner.get(s) }));
  const out = [];
  for (const { s, gi } of tagged) { const p = rewrite({ type: 'Program', body: [s] }); for (const x of p.body) out.push({ s: x, gi }); }
  // each baked patch becomes a comment on the deepest statement (in a statement list) that holds its first character
  const lists = [];
  const walk = (n, depth) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) return n.forEach(x => walk(x, depth));
    for (const k of Object.keys(n)) {
      const v = n[k];
      if (Array.isArray(v) && (k === 'body' || k === 'consequent') && ['Program', 'BlockStatement', 'StaticBlock', 'SwitchCase'].includes(n.type)) v.forEach(st => lists.push({ st, depth }));
      if (v && typeof v === 'object' && k !== 'start' && k !== 'end') walk(v, depth + 1);
    }
  };
  walk({ type: 'Program', body: out.map(o => o.s) }, 0);
  const placed = new Set();
  for (const site of sites) {
    let best = null;
    for (const l of lists) if (l.st.start <= site.start && site.start < Math.max(l.st.end, l.st.start + 1) && (!best || l.depth > best.depth || (l.depth === best.depth && l.st.end - l.st.start < best.st.end - best.st.start))) best = l;
    // a site that starts on the comma between two statements belongs to the next one
    if (!best) for (const l of lists) if (l.st.start > site.start && l.st.start <= Math.max(site.end, site.start + 2) && (!best || l.st.start < best.st.start || (l.st.start === best.st.start && l.depth < best.depth))) best = l;
    if (!best) throw new Error(`no statement for site ${site.id}`);
    const key = best.st.start + ':' + best.st.end + ':' + site.feature + site.id;
    if (placed.has(key)) continue;
    placed.add(key);
    (best.st.comments = best.st.comments || []).push(...wrapText(patchNote(site)).map(l => ({ type: 'Line', value: ' ' + l })));
  }
  // print each section, split into parts at statement boundaries when long
  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi], stmts = out.filter(o => o.gi === gi).map(o => o.s);
    const printed = stmts.map(s => astring.generate({ type: 'Program', body: [s], sourceType: 'script' }, { comments: true }));
    const parts = []; let cur = [], size = 0;
    printed.forEach((p, i) => { if (cur.length && size + p.length > PART_CHARS) { parts.push(cur); cur = []; size = 0; } cur.push(i); size += p.length; });
    if (cur.length) parts.push(cur);
    for (let pi = 0; pi < parts.length; pi++) {
      const idx = parts[pi], names = idx.map(i => definedBy(stmts[i])).filter(Boolean);
      const fname = parts.length > 1 ? `${g.name}-${String.fromCharCode(97 + pi)}.js` : `${g.name}.js`;
      const head = [`// The release's core, ${g.name.replace(/^\d+-/, '').replace(/-/g, ' ')}${parts.length > 1 ? ` (part ${pi + 1} of ${parts.length})` : ''}: ${g.title}`,
        '// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-027). Edit it here.',
        ...wrapText('Defines: ' + summarize(names), 114).map(l => '// ' + l), ''].join('\n');
      const code = await prettier.format(idx.map(i => printed[i]).join('\n'), PRETTIER);
      files.push({ name: fname, text: head + '\n' + code });
    }
  }
  return files;
}
// what a top-level statement defines, for the file's header
function definedBy(s) {
  const src = n => n.type === 'Identifier' ? n.name : n.type === 'MemberExpression' && !n.computed ? (src(n.object) && src(n.object) + '.' + n.property.name) : null;
  if (s.type === 'VariableDeclaration') return s.declarations.map(d => d.id.name).filter(Boolean).join(', ');
  if (s.type === 'ExpressionStatement' && s.expression.type === 'AssignmentExpression') return src(s.expression.left);
  if (s.type === 'ExpressionStatement' && s.expression.type === 'CallExpression' && s.expression.callee.type !== 'FunctionExpression') {
    const c = src(s.expression.callee), a0 = s.expression.arguments[0];
    if (c === 'Object.assign' && a0) return src(a0) ? src(a0) + ' (+)' : null;
    if (c === 'DEC' && a0 && a0.type === 'Literal') return `DEC ${a0.value}`;
    return null;
  }
  return null;
}
function summarize(names) {
  const seen = []; for (const n of names) for (const x of n.split(', ')) if (!seen.includes(x)) seen.push(x);
  const decs = seen.filter(x => x.startsWith('DEC ')), rest = seen.filter(x => !x.startsWith('DEC '));
  const list = rest.slice(0, 60).join(', ') + (rest.length > 60 ? `, and ${rest.length - 60} more` : '');
  return list + (decs.length ? `${list ? '; ' : ''}${decs.length} decisions (DEC)` : '') + '.';
}

// JSON with objects and arrays opened up to `depth` levels, compact below
function prettyJson(v, depth, ind = '') {
  if (depth <= 0 || v === null || typeof v !== 'object') return JSON.stringify(v);
  const inner = ind + ' ';
  if (Array.isArray(v)) return v.length ? '[\n' + v.map(x => inner + prettyJson(x, depth - 1, inner)).join(',\n') + '\n' + ind + ']' : '[]';
  const ks = Object.keys(v);
  return ks.length ? '{\n' + ks.map(k => inner + JSON.stringify(k) + ': ' + prettyJson(v[k], depth - 1, inner)).join(',\n') + '\n' + ind + '}' : '{}';
}

// --- content: structure on lines, every function verbatim ------------------------------------------------------------
function formatPack(src, sites) {
  const ast = parse(src);
  const S = n => src.slice(n.start, n.end);
  const notes = new Map(); // structural item -> comment lines
  const items = [];        // every structural item printed, with its depth, to place the patch comments
  const isFn = n => n.type === 'ArrowFunctionExpression' || n.type === 'FunctionExpression';
  const iife = n => n.type === 'CallExpression' && n.callee.type === 'FunctionExpression' && n.arguments.length === 0 && !n.optional;
  const needsParens = n => n.type === 'SequenceExpression';
  const verb = n => (needsParens(n) ? '(' + S(n) + ')' : S(n));
  const stmtStart = /^(\{|function\b|class\b|let\s*\[|async\s+function\b)/;
  const synth = new Map();  // the statements a comma list is split into, made once so the notes find them again
  const item = (n, depth) => { items.push({ n, depth }); return n; };
  const lead = (n, ind) => (notes.get(n) || []).map(l => ind + '// ' + l + '\n').join('');
  const short = (n, max = 100) => { const t = S(n); return t.length <= max && !t.includes('\n'); };

  const expr = (n, ind, depth) => {
    if (isFn(n)) return S(n);
    if (n.type === 'ObjectExpression' && !short(n)) {
      if (!n.properties.length) return '{}';
      const inner = ind + '  ';
      return '{\n' + n.properties.map(p => {
        item(p, depth + 1);
        const body = p.type === 'Property' && p.kind === 'init' && !p.method && !p.shorthand && !p.computed
          ? S(p.key) + ': ' + expr(p.value, inner, depth + 1)
          : S(p);
        return () => lead(p, inner) + inner + body + ',\n';
      }).map(f => f()).join('') + ind + '}';
    }
    if (n.type === 'ArrayExpression' && !short(n) && n.elements.every(Boolean) && !n.elements.some(e => e.type === 'SpreadElement' && false)) {
      if (!n.elements.length) return '[]';
      const inner = ind + '  ';
      return '[\n' + n.elements.map(e => { item(e, depth + 1); return () => lead(e, inner) + inner + expr(e, inner, depth + 1) + ',\n'; }).map(f => f()).join('') + ind + ']';
    }
    if (n.type === 'CallExpression' && !iife(n) && (n.callee.type === 'Identifier' || n.callee.type === 'MemberExpression') && !short(n, 120) && n.arguments.some(a => a.type === 'ObjectExpression' || a.type === 'ArrayExpression')) {
      return S(n.callee) + (n.optional ? '?.' : '') + '(' + n.arguments.map(a => expr(a, ind, depth)).join(', ') + ')';
    }
    if (iife(n)) {
      const fn = n.callee, head = src.slice(n.start, fn.body.start + 1), tail = src.slice(fn.end, n.end);
      return head + '\n' + stmts(fn.body.body, ind + '  ', depth + 1) + ind + '}' + tail;
    }
    return verb(n);
  };
  const stmt = (s, ind, depth) => {
    if (s.type === 'ExpressionStatement' && !s.directive) {
      const e = s.expression;
      if (e.type === 'SequenceExpression') return e.expressions.map(x => { if (!synth.has(x)) synth.set(x, { type: 'ExpressionStatement', expression: x, start: x.start, end: x.end }); const st = synth.get(x); item(st, depth); return [st, x]; })
        .map(([st, x]) => { const t = expr(x, ind, depth); return lead(st, ind) + ind + (stmtStart.test(t) ? '(' + t + ')' : t) + ';\n'; }).join('');
      if (iife(e) || (e.type === 'CallExpression' && !short(e, 120))) { const t = expr(e, ind, depth); return ind + (stmtStart.test(t) ? '(' + t + ')' : t) + ';\n'; }
    }
    if (s.type === 'VariableDeclaration' && !short(s, 120)) {
      const inner = ind + '  ';
      return ind + s.kind + ' ' + s.declarations.map((d, i) => { item(d, depth + 1); return (i ? lead(d, inner) + inner : '') + S(d.id) + (d.init ? ' = ' + expr(d.init, inner, depth + 1) : ''); }).join(',\n') + ';\n';
    }
    let t = S(s); if (!/[;}]$/.test(t)) t += ';';
    return ind + t + '\n';
  };
  const stmts = (list, ind, depth) => list.map(s => { item(s, depth); return () => lead(s, ind) + stmt(s, ind, depth); }).map(f => f()).join('');
  // first pass: find the items; second pass: print with the notes placed
  const run = () => { items.length = 0; return stmts(ast.body, '', 0); };
  run();
  for (const site of sites) {
    let best = null;
    for (const it of items) if (it.n.start <= site.start && site.start < Math.max(it.n.end, it.n.start + 1) && (!best || it.depth > best.depth || (it.depth === best.depth && it.n.end - it.n.start < best.n.end - best.n.start))) best = it;
    if (!best) for (const it of items) if (it.n.start > site.start && it.n.start <= Math.max(site.end, site.start + 2) && (!best || it.n.start < best.n.start || (it.n.start === best.n.start && it.depth < best.depth))) best = it;
    if (!best) throw new Error(`no line for content site ${site.id}`);
    const key = best.n; const lines = notes.get(key) || [];
    const note = wrapText(patchNote(site));
    if (!lines.some(l => l.startsWith(marker(site)))) notes.set(key, [...lines, ...note]);
  }
  return run();
}

async function main() {
  const r = await bake({ patchesDir: arg('patches') || 'src' });
  for (const d of ['core', 'content', 'lore']) fs.rmSync(path.join(OUT, d), { recursive: true, force: true }); // README.md stays
  for (const d of ['core', 'content', 'lore']) fs.mkdirSync(path.join(OUT, d), { recursive: true });
  // core
  for (const f of await formatCore(r.core, r.sites.core)) fs.writeFileSync(path.join(OUT, 'core', f.name), f.text);
  // content: one file per pack; the sites shift by each pack's offset
  const packs = r.content.split(SEP); let off = 0;
  packs.forEach((p, i) => {
    const sites = r.sites.content.filter(s => s.start >= off && s.start < off + p.length).map(s => ({ ...s, start: s.start - off, end: s.end - off }));
    off += p.length + SEP.length;
    const ids = [...p.matchAll(/\bid:"([a-z0-9]+)_/g)].map(m => m[1]), tally = {}; for (const x of ids) tally[x] = (tally[x] || 0) + 1;
    const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
    const name = `${String(i + 1).padStart(2, '0')}-${top ? top[0] : 'pack'}.js`;
    const head = `// The release's event pack ${i + 1} of ${packs.length} (${ids.length} events, mostly ${top ? top[0] + '_' : '?'}). Readable source of\n` +
      `// vendor/ardan-b593143.html with the patch layer baked in (X1, D-027). Every function is kept exactly as the release\n` +
      `// wrote it: the game reads event functions as text (A.evAudience), so reformat a function only with that in mind.\n`;
    fs.writeFileSync(path.join(OUT, 'content', name), head + formatPack(p, sites));
  });
  // lore
  r.lore.split('\u0001').forEach((part, i) => {
    const k = part.indexOf('\u0002'), key = part.slice(0, k), body = part.slice(k + 1);
    if (JSON.stringify(JSON.parse(body)) !== body) throw new Error('lore does not round-trip: ' + key);
    fs.writeFileSync(path.join(OUT, 'lore', `${String(i + 1).padStart(2, '0')}-${key}.json`), prettyJson(JSON.parse(body), 2) + '\n');
  });
  fs.writeFileSync(path.join(OUT, 'page.html'), emptyPage(r.html));
  // feature files a later feature's patch edited: written only with --write-features (X1 wrote them once, then
  // commented the change by hand; re-running must not undo that)
  if (process.argv.includes('--write-features')) for (const [f, t] of Object.entries(r.featureFiles)) fs.writeFileSync(path.join(root, f), t);
  fs.writeFileSync(path.join(OUT, 'PATCHES.md'), ledger(r));
  console.log('wrote', path.relative(root, OUT));
}

// PATCHES.md: every baked patch, its why, and where its comment now sits
function ledger(r) {
  const where = {};
  const scan = d => { for (const f of fs.readdirSync(path.join(OUT, d)).filter(f => f.endsWith('.js')).sort()) fs.readFileSync(path.join(OUT, d, f), 'utf8').split('\n').forEach((l, i) => {
    const m = l.match(/\[X1 baked patch (\S+) (\S+)\]/); if (m) (where[m[1] + ' ' + m[2]] = where[m[1] + ' ' + m[2]] || []).push(`${d}/${f}:${i + 1}`); }); };
  scan('core'); scan('content');
  const all = [...r.sites.core, ...r.sites.content, ...r.sites.lore, ...r.sites.html, ...Object.entries(r.sites.files).flatMap(([f, xs]) => xs.map(x => ({ ...x, file: f })))];
  const byPatch = new Map();
  for (const x of all) { const k = x.feature.replace(/^src\//, '') + ' ' + x.id; if (!byPatch.has(k)) byPatch.set(k, { ...x, blobs: new Set(), files: new Set() }); const e = byPatch.get(k); e.blobs.add(x.blob); if (x.file) e.files.add(x.file); }
  const order = [...byPatch.values()].sort((a, b) => (a.feature.split('/').pop() < b.feature.split('/').pop() ? -1 : a.feature.split('/').pop() > b.feature.split('/').pop() ? 1 : 0));
  const rows = order.map(e => {
    const k = e.feature.replace(/^src\//, '') + ' ' + e.id;
    const at = [...(where[k] || []), ...[...e.files].map(f => f), ...(e.blobs.has('html') ? ['page.html'] : [])];
    return `| ${e.feature.replace(/^src\//, '')} | ${e.id} | ${at.length ? at.slice(0, 6).join(', ') + (at.length > 6 ? `, +${at.length - 6}` : '') : '(no comment: see the why)'} | ${(e.why || '').replace(/\|/g, '\\|').replace(/\n/g, ' ')} |`;
  });
  return `# The baked patch layer (X1, docs/DECISIONS.md D-027)\n\n` +
    `Before X1 the build applied ${byPatch.size} exact find-and-replace patches (${all.length} replacements) to the release's minified blobs. ` +
    `X1 wrote every one of them into this source tree. Each is a comment \`[X1 baked patch <feature> <id>] <why>\` on the statement ` +
    `(core) or line (content) it changed; the patch files themselves are kept in \`archive/x1-patch-layer/\`. Generated by ` +
    `\`tools/release/format.mjs\`; a later change to the source does not update this table.\n\n` +
    `The four \`html\` patches live in \`page.html\` (no comment there: the fonts, the style and the bootloader). Two patches of ` +
    `\`map/9991-atlas-of-known-places\` edited another feature's file, \`src/map/62-inked-map/inkmap.core.js\`, and are baked (and commented) there.\n\n` +
    `| Feature | Patch | Where now | Why |\n| --- | --- | --- | --- |\n` + rows.join('\n') + '\n';
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(e => { console.error(e); process.exit(1); });
