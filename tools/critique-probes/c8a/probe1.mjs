// C8a grounding probe 1: population facts about p.app, wounds, classes, sizes, and timing of the current renderer.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pw = require('/opt/node-tools/node_modules/playwright');
const [file, out, seedArg] = process.argv.slice(2);
const seed = +(seedArg || 42);
const b = await pw.chromium.launch();
const pg = await b.newPage({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 1 });
const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 300)));
await pg.goto('file://' + file);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 });
const info = await pg.evaluate((seed) => {
  A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
  const S = A.S, P = Object.values(S.people || {});
  const alive = P.filter(p => p && p.alive);
  const cnt = (arr, f) => { const o = {}; for (const x of arr) { const k = f(x); o[k] = (o[k] || 0) + 1; } return o; };
  const appSizes = alive.map(p => JSON.stringify(p.app || {}).length);
  const avg = a => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
  const stateBytes = JSON.stringify(S).length;
  const peopleBytes = JSON.stringify(S.people).length;
  // distinct stored looks
  const faceKey = p => [p.app.face, p.app.brow, p.app.mouth, p.app.nose, p.app.eyeShape].join('');
  const adults = alive.filter(p => A.age(p) >= 18);
  const kinds = {};
  for (const p of alive) { let k = '?'; try { k = PORTRAIT.outfit(p).kind; } catch (e) {} kinds[k] = (kinds[k] || 0) + 1; }
  // hats in drawn look
  let hooded = 0, hatted = 0, looked = 0; const hats = {};
  for (const p of alive) { try { const L = UI.ANIME.look(p, true); looked++; if (L.covered) hooded++; if (L.hat) { hatted++; hats[L.hat] = (hats[L.hat] || 0) + 1; } } catch (e) {} }
  // timing and size of busts, uncached
  UI.ANIME.clearCache();
  const sample = alive.slice(0, 200);
  const t0 = performance.now(); let bytes = 0, maxB = 0;
  for (const p of sample) { const s = UI.ANIME.svg(p, 88, { bust: true }); bytes += s.length; if (s.length > maxB) maxB = s.length; }
  const t1 = performance.now();
  const t2 = performance.now(); let fbytes = 0;
  for (const p of sample.slice(0, 80)) { const s = UI.ANIME.svg(p, 200, {}); fbytes += s.length; }
  const t3 = performance.now();
  // node count of one bust
  const tmp = document.createElement('div'); tmp.innerHTML = UI.ANIME.svg(sample[3], 88, { bust: true });
  const nodes88 = tmp.querySelectorAll('*').length;
  let nodeSum = 0; for (const p of sample.slice(0, 40)) { tmp.innerHTML = UI.ANIME.svg(p, 46, { bust: true }); nodeSum += tmp.querySelectorAll('*').length; }
  return {
    seed, year: S.year, total: P.length, alive: alive.length,
    status: cnt(alive, p => p.status), race: cnt(alive, p => p.race), sex: cnt(alive, p => p.sex),
    outfitKinds: kinds,
    withWounds: alive.filter(p => (p.wounds || []).length).length,
    mil: alive.filter(p => p.mil).length, clergy: alive.filter(p => p.job && p.job.c === 'clergy').length,
    appKeys: cnt(alive, p => Object.keys(p.app || {}).sort().join(',')),
    appBytesAvg: avg(appSizes), appBytesMax: Math.max(...appSizes),
    stateBytes, peopleBytes, perPerson: peopleBytes / P.length,
    distinctFaceKeys: new Set(adults.map(faceKey)).size, adults: adults.length,
    faceDist: cnt(alive, p => p.app.face), noseDist: cnt(alive, p => p.app.nose), eyeShapeDist: cnt(alive, p => p.app.eyeShape),
    hstyle: cnt(alive, p => p.sex + ':' + p.app.hstyle), beard: cnt(alive.filter(p => p.sex === 'M'), p => p.app.beard), build: cnt(alive, p => p.app.build),
    hair: cnt(alive, p => p.app.hair), eye: cnt(alive, p => p.app.eye), skin: cnt(alive, p => p.race + ':' + p.app.skin),
    heightM: (() => { const h = alive.filter(p => p.race === 'human' && p.sex === 'M').map(p => p.app.height).sort((a, b) => a - b); return [h[0], h[Math.floor(h.length * .1)], h[Math.floor(h.length / 2)], h[Math.floor(h.length * .9)], h[h.length - 1]]; })(),
    heightF: (() => { const h = alive.filter(p => p.race === 'human' && p.sex === 'F').map(p => p.app.height).sort((a, b) => a - b); return [h[0], h[Math.floor(h.length * .1)], h[Math.floor(h.length / 2)], h[Math.floor(h.length * .9)], h[h.length - 1]]; })(),
    looked, hooded, hatted, hats,
    bustMs: (t1 - t0) / sample.length, bustKB: bytes / sample.length / 1024, bustMaxKB: maxB / 1024,
    fullMs: (t3 - t2) / 80, fullKB: fbytes / 80 / 1024, nodes88, nodes46avg: nodeSum / 40,
    cult: cnt(alive, p => p.cult), quirks: cnt(alive.flatMap(p => p.quirks || []), q => q),
    traitsSample: alive.slice(0, 6).map(p => (p.traits || []).join('/')),
    onePerson: alive[5],
  };
}, seed);
console.log(JSON.stringify({ info, errs: errs.slice(0, 5) }, null, 1));
await b.close();
