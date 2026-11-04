// Build the retire list from the event audit.
//
//   node bench/event-audit.mjs /tmp/ardan/event-cut/full.html --mode=rank --lives=24 --json=/tmp/ardan/event-cut/audit.json
//   node features/58-event-cut/select.mjs /tmp/ardan/event-cut/audit.json [--share=0.33]
//
// Writes list.core.js (the ids, each with its reason code) and RETIRED.md (the same list with titles, for review).
// Only the release's own events are candidates, and only those the audit left unprotected: not written by a feature,
// not a trigger, not in a special pool, not referenced by id anywhere else, not a memory event, no flag anyone reads.
// The weakest go first: nudges, then number-only events, then opinion-only events; within a kind the lowest score
// (no tradeoff, short, no setup, an obviously best choice), and among equals the one the bots met most often.
// Every pool keeps a floor: each probe character (class, age band, job, realm) keeps at least 60% of the events it
// could draw and at least 30, and each realm keeps at least 5 of its local events (or all it had, if fewer).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = k => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const audit = JSON.parse(fs.readFileSync(args.find(a => !a.startsWith('--')) || '/tmp/ardan/event-cut/audit.json', 'utf8'));
const SHARE = +(opt('share') || 0.33);
// --with-thin also retires the "thin mark" tier (one lasting mark: fame of 3 or more, or a wound, and nothing else),
// which the brief counts as lasting; without it that tier is only proposed in RETIRED.md for a human to decide
const THIN = args.includes('--with-thin');
const KEEP_PCT = 0.6, KEEP_MIN = 30, LOCAL_MIN = 5;

const rel = audit.rows.filter(r => r.release);
// an event another feature has patched (02-content-fixes mended its tokens, 33-choices rebalanced its choices) is work
// someone chose to keep: it stays in the roll
const featRoot = path.join(here, '..');
const patched = new Set();
for (const d of fs.readdirSync(featRoot).filter(d => /^\d+-/.test(d) && !/event-cut$/.test(d))) {
  const f = path.join(featRoot, d, 'patches.mjs');
  if (fs.existsSync(f)) for (const m of fs.readFileSync(f, 'utf8').matchAll(/[a-z][a-z0-9]*_[a-z0-9_]+/g)) patched.add(m[0]);
}
for (const r of rel) if (!r.protect && patched.has(r.id)) r.protect = 'patched';
// events a person or a feature put back on purpose (KEEP.json: { id: reason }), e.g. the old-age scenes 74-old-age
// un-retired because they hold a real choice; a re-run must not retire them again
const KEEP = fs.existsSync(path.join(here, 'KEEP.json')) ? JSON.parse(fs.readFileSync(path.join(here, 'KEEP.json'), 'utf8')) : {};
for (const r of rel) if (!r.protect && KEEP[r.id]) r.protect = 'kept';
const target = Math.round(SHARE * rel.length);
const ORDER = { nudge: 0, numbers: 1, opinion: 2, thin: 3 };
const CODE = { nudge: 'N', numbers: 'B', opinion: 'O', thin: 'T' };
for (const r of rel) if (!r.protect && r.kind === 'lasting' && r.lasting.length === 1 && ['fame3', 'wound'].includes(r.lasting[0])) r.kind = 'thin';
const cand = rel.filter(r => !r.protect && r.kind in ORDER)
  .sort((a, b) => ORDER[a.kind] - ORDER[b.kind] || a.score - b.score || b.fires - a.fires || (a.id < b.id ? -1 : 1));

// the pools: per probe, how many it could draw and the floor it must keep
const pools = audit.pools.map(P => ({ name: P.name, ids: new Set(P.ids), local: new Set(P.local), n: P.ids.length, nl: P.local.length,
  floor: Math.max(KEEP_MIN, Math.ceil(KEEP_PCT * P.ids.length)), lfloor: Math.min(P.local.length, Math.max(LOCAL_MIN, Math.ceil(KEEP_PCT * P.local.length))) }));
for (const P of pools) { P.left = P.n; P.lleft = P.nl; }
const picked = [], heldBy = {}, proposed = [];
for (const r of cand) {
  if (picked.length + proposed.length >= target) break;
  const hit = pools.filter(P => P.ids.has(r.id));
  const block = hit.find(P => P.left - 1 < P.floor) || hit.find(P => P.local.has(r.id) && P.lleft - 1 < P.lfloor);
  if (block) { heldBy[r.id] = block.name; continue; }
  for (const P of hit) { P.left--; if (P.local.has(r.id)) P.lleft--; }
  (r.kind === 'thin' && !THIN ? proposed : picked).push(r);
}

// list.core.js
const byCode = {};
for (const r of picked) (byCode[CODE[r.kind]] = byCode[CODE[r.kind]] || []).push(r);
let js = '// The retired events (Road to Ten, Events 1): written by select.mjs from bench/event-audit.mjs. Do not edit by hand;\n' +
  '// veto an event in RETIRED.md, then drop its line here (or re-run select.mjs). Reason codes: EC.REASONS in cut.core.js.\n' +
  `// ${picked.length} of the release's ${rel.length} events.\nA.EC.retire({\n`;
for (const c of Object.keys(byCode).sort()) {
  js += `  // ${c}: ${byCode[c].length}\n`;
  for (const r of [...byCode[c]].sort((a, b) => (a.id < b.id ? -1 : 1))) js += `  ${r.id}: '${c}',\n`;
}
js += '});\n';
fs.writeFileSync(path.join(here, 'list.core.js'), js);

// RETIRED.md
const NAME = { N: 'Nudges', B: 'Numbers only', O: 'Opinion only', T: 'Thin mark' };
const WHY = {
  N: 'Every choice only moves stats or skills by 1 or 2, happiness or health by a few points, or coin. Nothing reads its flags, no event or code queues it, and it queues nothing.',
  B: 'Every choice only moves numbers, some by more than a nudge (a skill by 3, health by 10), with nothing lasting: no trait, wound, bond, job, flag anyone reads, or follow-up. Nothing queues it.',
  O: 'Every choice moves numbers and someone\'s opinion of you, and nothing else: no new bond, no memory anyone reads, no follow-up. Nothing queues it.',
  T: 'Its one lasting mark is fame of 3 or more, or a wound; nothing else lasts, nothing reads it, nothing queues it.',
};
const esc = s => String(s).replace(/\|/g, '\\|');
let md = `# Retired events: for review\n\n` +
  `${picked.length} of the release's ${rel.length} events (${Math.round(1000 * picked.length / rel.length) / 10}%) are retired from the yearly roll by \`features/58-event-cut\`. ` +
  `A human should approve or veto this list: to keep an event, delete its line from \`list.core.js\`. ` +
  `A retired event is not deleted: anything that queues it by id still shows it, and the menu setting "Classic event pool (keep every event)" brings them all back.\n\n` +
  `How they were chosen (\`bench/event-audit.mjs\`, then \`select.mjs\`): only the release's own events were candidates, and never one that a feature wrote, ` +
  `that is only ever queued (a chain's later step), that belongs to a job, duty, path, council or drill pool, that another feature patched, whose id appears anywhere else in the game ` +
  `(a chain's \`event:\`, \`A.schedule\`, \`flags.ev\`), that reads an earlier memory, or that sets a flag anything reads. The weakest went first, ` +
  `and every pool kept a floor (see the README). Columns: fired = times the bots met it in ${audit.lives} lives (${audit.years} years); words = its text; ` +
  `check = it has a skill check (tradeoff = a check whose failure costs, beside a safe choice); best = the choice linter finds an obviously best choice.\n\n`;
for (const c of Object.keys(byCode).sort((a, b) => 'NBOT'.indexOf(a) - 'NBOT'.indexOf(b))) {
  md += `## ${NAME[c]} (${c}): ${byCode[c].length}\n\n${WHY[c]}\n\n| id | title | fired | words | notes |\n| --- | --- | --- | --- | --- |\n`;
  md += rowsMd(byCode[c]) + '\n';
}
function rowsMd(list) {
  let md = '';
  for (const r of [...list].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    const notes = [r.tradeoff ? 'tradeoff' : r.checks ? 'check' : '', r.obviousBest ? 'best' : '', r.local ? 'local' : '', r.once ? 'once' : '',
      r.opinion && r.opinion.length ? 'opinion' : '', r.big && r.big.length ? 'moves ' + r.big.join(' ') : ''].filter(Boolean).join(', ');
    md += `| \`${r.id}\` | ${esc(r.title)} | ${r.fires} | ${r.words == null ? 'varies' : r.words} | ${esc(notes)} |\n`;
  }
  return md;
}
if (proposed.length) md += `## Proposed, not retired: thin mark (T): ${proposed.length}\n\n${WHY.T} The brief counts a wound and fame of 3 or more as lasting, ` +
  `so these stay in the roll. They are the next weakest; retiring them too (\`select.mjs --with-thin\`) would bring the cut to ` +
  `${picked.length + proposed.length} of ${rel.length} (${Math.round(1000 * (picked.length + proposed.length) / rel.length) / 10}%). A human decides.\n\n` +
  `| id | title | fired | words | notes |\n| --- | --- | --- | --- | --- |\n` + rowsMd(proposed) + '\n';
const held = Object.entries(heldBy);
md += `## Weak but kept by a pool floor: ${held.length}\n\nThese ranked among the weakest, but retiring them would have taken a pool below its floor, so they stay.\n\n`;
const byPool = {}; for (const [id, p] of held) (byPool[p] = byPool[p] || []).push(id);
for (const [p, ids] of Object.entries(byPool).sort()) md += `- ${p}: ${ids.sort().map(i => '`' + i + '`').join(', ')}\n`;
fs.writeFileSync(path.join(here, 'RETIRED.md'), md);

const tight = pools.filter(P => P.left <= P.floor || (P.nl && P.lleft <= P.lfloor)).map(P => `${P.name} ${P.left}/${P.n} (local ${P.lleft}/${P.nl})`);
console.log(JSON.stringify({ release: rel.length, target, candidates: cand.length, picked: picked.length,
  byCode: Object.fromEntries(Object.entries(byCode).map(([c, l]) => [c, l.length])), proposed: proposed.length, heldByFloor: held.length, poolsAtFloor: tight }, null, 1));
