// Make a sample save of a build, for tests/saves/ (every milestone keeps one; tests/suites/saves.test.mjs loads them
// all after every change, so an old save that stops loading fails CI).
//
//   node tools/make-save.mjs [built.html] --out=tests/saves/v2.1.0-noble.ardan [--status=noble] [--realm=POL-01]
//                            [--race=human] [--sex=M] [--age=20] [--years=3] [--seed=77]
//
// The life is played by code (the bot answers every card) for --years, then saved with the build's own SAVES.encode,
// exactly the bytes "Save to file" would write.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const file = path.resolve(root, args.find(a => !a.startsWith('--')) || 'index.html');
const out = opt('out');
if (!out) { console.error('usage: node tools/make-save.mjs [built.html] --out=tests/saves/<name>.ardan [--status=noble ...]'); process.exit(2); }
const o = { seed: +opt('seed', 77), race: opt('race', 'human'), realm: opt('realm', 'POL-01'), status: opt('status', 'noble'), sex: opt('sex', 'M'), startAge: +opt('age', 20) };
const years = +opt('years', 3);

const browser = await pw.chromium.launch();
try {
  const pg = await browser.newPage();
  await pg.goto(pathToFileURL(file).href);
  await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 });
  const b64 = await pg.evaluate(async ([o, years]) => {
    A.newGame(o); UI.screen = 'game'; UI.render();
    const end = A.S.year + years;
    for (let g = 0; g < 5000 && A.S.year < end; g++) {
      A.advance(400); let h, k = 0;
      while ((h = A.headReady()) && k++ < 500) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); }
      if (!A.pc() || !A.pc().alive) break;
    }
    const B = (await SAVES.encode(A.S, A.J)).bytes;
    let s = ''; for (let i = 0; i < B.length; i += 8192) s += String.fromCharCode.apply(null, B.subarray(i, i + 8192));
    return btoa(s);
  }, [o, years]);
  const dest = path.resolve(root, out);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(b64, 'base64'));
  console.log(`${path.relative(root, dest)}: ${o.status} ${o.race} in ${o.realm}, ${years} years from age ${o.startAge}, ${(fs.statSync(dest).size / 1024).toFixed(0)} KB`);
} finally { await browser.close(); }
