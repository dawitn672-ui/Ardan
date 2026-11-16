import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pw = require('/opt/node-tools/node_modules/playwright');
const [file, seedArg] = process.argv.slice(2);
const b = await pw.chromium.launch();
const pg = await b.newPage({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 300)));
await pg.goto('file://' + file);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 });
const info = await pg.evaluate((seed) => {
  A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
  const S = A.S, P = Object.values(S.people), alive = P.filter(p => p.alive);
  const cnt = (arr, f) => { const o = {}; for (const x of arr) { const k = f(x); o[k] = (o[k] || 0) + 1; } return o; };
  const withDesc = alive.filter(p => typeof p.desc === 'string' && p.desc);
  const words = ['scar', 'one-eyed', 'one eye', 'eye patch', 'broken nose', 'bald', 'grey', 'gray', 'white hair', 'tall', 'short', 'fat', 'stout', 'thin', 'gaunt', 'lean', 'broad', 'narrow face', 'round face', 'hooked', 'hawk', 'beard', 'freckl', 'pale', 'dark', 'red hair', 'red-haired', 'blond', 'limp', 'missing', 'burn', 'heavy', 'handsome', 'beautiful', 'plain', 'ugly', 'jaw', 'nose', 'eyes', 'brow', 'lips', 'chin', 'cheek', 'teeth', 'ears', 'wrinkl', 'young', 'old'];
  const wc = {}; for (const w of words) wc[w] = withDesc.filter(p => p.desc.toLowerCase().includes(w)).length;
  // mismatch examples: desc says bald but hstyle not bald etc.
  const ex = withDesc.filter(p => /scar|one-eyed|broken nose|bald|hooked|limp/i.test(p.desc)).slice(0, 8).map(p => ({ desc: p.desc, app: p.app, wounds: p.wounds, age: A.age(p), sex: p.sex }));
  const traits = Object.keys(GD.TRAITS || {});
  const traitCount = cnt(alive.flatMap(p => p.traits || []), t => t);
  const cult = {}; for (const [k, c] of Object.entries(LORE.cultures || {})) cult[k] = c.name;
  const realms = Object.values(S.realms).map(r => ({ id: r.id, name: r.name, color: r.color, cult: r.cult || r.culture }));
  const moods = A.MOODS ? Object.keys(A.MOODS) : null;
  const gear = {}; for (const [k, g] of Object.entries(GD.GEAR)) { const t = g.slot || g.type || g.kind || '?'; (gear[t] = gear[t] || []).push(k + (g.look ? ':' + g.look : '')); }
  const troops = GD.TROOPS ? Object.keys(GD.TROOPS) : null;
  const jobs = cnt(alive.filter(p => p.job), p => p.job.c + ':' + p.job.k);
  const occ = cnt(alive, p => p.occ || p.title || '-');
  const ages = cnt(alive, p => Math.floor(A.age(p) / 10) * 10);
  const kids = alive.filter(p => p.parents && p.parents.length === 2 && S.people[p.parents[0]] && S.people[p.parents[1]]);
  // do children share stored face fields with parents (today)?
  let same = { skin: 0, hair: 0, eye: 0, face: 0, nose: 0, eyeShape: 0 };
  for (const k of kids) { const a = S.people[k.parents[0]].app, b2 = S.people[k.parents[1]].app; for (const f of Object.keys(same)) if (k.app[f] === a[f] || k.app[f] === b2[f]) same[f]++; }
  // what the pc looks like in state
  const pc = A.pc();
  return { seed, withDesc: withDesc.length, wc, ex, traits, traitCount, cult, realms: realms.slice(0, 40), moods, gearKinds: Object.keys(gear), gear, troops, jobs, occTop: Object.entries(occ).sort((a, b) => b[1] - a[1]).slice(0, 25), ages, kids: kids.length, same,
    pcKeys: Object.keys(pc), pcV2: pc.v2 ? Object.keys(pc.v2) : null, v2height: A.V2S && A.V2S.height ? [A.V2S.height(pc), pc.app.height] : null,
    v2view: (() => { try { const v = A.V2S.view(pc); return { keys: Object.keys(v), genes: v.genes && { heightZ: v.genes.heightZ, adultHeight: v.genes.adultHeight, build: v.genes.build }, stats: v.stats && { h: v.stats.height, w: v.stats.weight } }; } catch (e) { return String(e); } })(),
    looks: (() => { const l = alive.map(p => p.looks).sort((a, b) => a - b); return [l[0], l[Math.floor(l.length * .1)], l[Math.floor(l.length / 2)], l[Math.floor(l.length * .9)], l[l.length - 1]]; })(),
    saveBytes: (() => { try { return SAVES.pack ? SAVES.pack(S).length : null; } catch (e) { return String(e).slice(0, 80); } })(),
    savesKeys: Object.keys(SAVES).slice(0, 40),
  };
}, +(seedArg || 42));
console.log(JSON.stringify({ info, errs }, null, 1));
await b.close();
