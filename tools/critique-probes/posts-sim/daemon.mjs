// Loads the game once, then runs every q/<name>.js (defining `async function main(arg)`) placed in the queue dir,
// writing q/<name>.out.json. Usage: node daemon.mjs <queueDir>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
const pw = require('/opt/node-tools/node_modules/playwright');
const { HELPERS } = await import('/home/user/Ardan/tests/helpers.mjs');
const file = process.env.HTML || '/home/user/Ardan/index.html';
const Q = path.resolve(process.argv[2]);
fs.mkdirSync(Q, { recursive: true });
const browser = await pw.chromium.launch();
const ctx = await browser.newContext();
const pg = await ctx.newPage();
let errs = [];
pg.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 400)));
pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 400)); });
const t0 = Date.now();
await pg.goto(pathToFileURL(file).href);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 300000 });
await pg.evaluate(HELPERS);
pg.setDefaultTimeout(0);
fs.writeFileSync(path.join(Q, 'READY'), String((Date.now() - t0) / 1000));
for (;;) {
  const jobs = fs.readdirSync(Q).filter(f => f.endsWith('.js')).sort();
  if (fs.existsSync(path.join(Q, 'STOP'))) break;
  if (!jobs.length) { await new Promise(r => setTimeout(r, 500)); continue; }
  const f = jobs[0], name = f.slice(0, -3);
  const script = fs.readFileSync(path.join(Q, f), 'utf8');
  fs.renameSync(path.join(Q, f), path.join(Q, name + '.running'));
  const argF = path.join(Q, name + '.arg.json');
  const arg = fs.existsSync(argF) ? JSON.parse(fs.readFileSync(argF, 'utf8')) : null;
  errs = [];
  const t1 = Date.now();
  let res;
  try { res = await pg.evaluate(new Function('arg', script + '\nreturn main(arg);'), arg); }
  catch (e) { res = { error: String(e.message || e).slice(0, 3000) }; }
  const out = { secs: (Date.now() - t1) / 1000, errs: [...new Set(errs)].slice(0, 20), res };
  fs.writeFileSync(path.join(Q, name + '.out.json'), JSON.stringify(out, null, 1));
  fs.unlinkSync(path.join(Q, name + '.running'));
}
await browser.close();
