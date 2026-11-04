// The choice checker (Road to Ten, Events 7): flags events where one choice is obviously best, so the choice is not a
// choice. It reads every event's choices in the built page and scores each on the things a player wants (coin, health,
// happiness, fame, honour, piety, each skill, standing) and does not want (wounds, prison, infamy, death). A choice with
// a check is scored at a typical character's odds for its difficulty. One choice is "obviously best" when it is at least as good as every other on every
// count, better on one, and no riskier (it has no check, or every choice has one). Choices that differ in what they
// change beyond numbers (a trait, a follow-up event, a relation, a job) are not compared: that is where the story
// lives. Memory flags are not such a difference: the player does not see them, and a choice that pays better on every
// count is the obvious one whatever it records.
//   node tools/lint-choices.mjs --html=index.html                 every event; prints the share and the worst offenders
//   node tools/lint-choices.mjs --html=x.html --feature=starts    one feature's events; fails if any is flagged
//   node tools/lint-choices.mjs --all-features                   every event the features add (tools/check.mjs runs this)
//   node tools/lint-choices.mjs --html=x.html --json=out.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { analyzeChoices } from './choice-analyzer.mjs';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = k => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const html = path.resolve(arg('html') || path.join(root, 'index.html'));
const feature = arg('feature');

// the ids a feature defines, read from its event files
let only = null;
const idsOf = dir => { const out = [];
  for (const f of fs.readdirSync(path.join(root, 'features', dir)).filter(f => f.endsWith('.events.js')))
    for (const m of fs.readFileSync(path.join(root, 'features', dir, f), 'utf8').matchAll(/\bid:\s*['"]([a-z0-9_]+)['"]/g)) out.push(m[1]);
  return out; };
if (process.argv.includes('--all-features')) {
  // every event a non-wip feature adds: the checklist new events must pass
  only = fs.readdirSync(path.join(root, 'features')).filter(d => /^\d+-/.test(d) && !fs.existsSync(path.join(root, 'features', d, '.wip'))).flatMap(idsOf);
} else if (feature) {
  const dir = fs.readdirSync(path.join(root, 'features')).find(d => d.replace(/^\d+-/, '') === feature);
  if (!dir) { console.error('no such feature: ' + feature); process.exit(2); }
  only = idsOf(dir);
}

const browser = await pw.chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });
const page = await browser.newPage();
await page.goto('file://' + html);
await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
const res = await page.evaluate(analyzeChoices, only);
await browser.close();

const pct = res.compared ? Math.round(1000 * res.flagged.length / res.compared) / 10 : 0;
const summary = { html: path.relative(root, html), feature: feature || null, events: res.events, comparedByNumbers: res.compared, unreadable: res.unreadable, obviouslyBest: res.flagged.length, obviouslyBestPct: pct };
console.log(JSON.stringify(summary, null, 1));
for (const f of res.flagged.slice(0, feature ? 100 : 25)) console.log(`  ${f.id}: "${f.best}" — ${f.why}`);
if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(Object.assign(summary, { flagged: res.flagged }), null, 1));
if ((feature || process.argv.includes('--all-features')) && res.flagged.length) process.exitCode = 1;
