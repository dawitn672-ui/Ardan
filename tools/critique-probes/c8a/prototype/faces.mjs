import { render, rngOf } from './relief.mjs';
import { buildHead } from './head2.mjs';
import { writePNG, sheet } from './png.mjs';
const [out, seed = '5'] = process.argv.slice(2);
const rng = rngOf(+seed), gauss = () => { let u = 0, v = 0; while (!u) u = rng(); v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const KEYS = ['jawW', 'jawSq', 'chin', 'cheek', 'brow', 'noseLen', 'noseBridge', 'noseTip', 'noseW', 'eyeSize', 'eyeGap', 'eyeTilt', 'lips', 'mouthW', 'faceLen', 'lid', 'browW', 'browArch'];
// the caricature rule of the first version: a bell of spread 0.40, then three to five signature genes pushed out to 0.7 or more
const person = () => { const g = {}; for (const k of KEYS) g[k] = clamp(gauss() * 0.4, -1, 1); const n = 3 + Math.floor(rng() * 3), ks = KEYS.slice().sort(() => rng() - 0.5).slice(0, n); for (const k of ks) g[k] = (rng() < 0.5 ? -1 : 1) * (0.7 + rng() * 0.3); return g; };
const GK = +(process.argv[4] || 1.6), CROP = +(process.argv[5] || 1.28);
const P = []; for (let i = 0; i < 20; i++) { const g = person(); for (const k in g) g[k] *= GK; P.push({ sex: 'M', age: 32, hair: 'crop', dress: 'tunic', id: 'f' + i, g, fat: clamp(gauss() * 0.3, -0.7, 0.7) }); }
const draw = (o, S, ss, finish) => { const hd = buildHead(Object.assign({ pxmm: 1 }, o)), sc = S / (hd.meta.headH * CROP), m = buildHead(Object.assign({ pxmm: sc * ss }, o)); return render(m, S, S, { ss, scale: sc, finish, oy: S * 0.05 }).rgba; };
for (const [name, S, fin, cols] of [['150', 150, 'paint', 10], ['46', 46, 'paint', 20], ['46flat', 46, 'cel', 20], ['92', 92, 'paint', 10]]) { const sh = sheet(P.map(o => draw(o, S, S >= 150 ? 2 : 3, fin)), cols, S, S, 4); writePNG(`${out}-${name}.png`, sh.rgba, sh.W, sh.H); }
