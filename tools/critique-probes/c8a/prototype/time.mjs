// C8a realism prototype: what a portrait costs at each size (CPU time of this one thread, best of N; the machine is shared)
import { render } from './relief.mjs';
import { buildHead } from './head2.mjs';
const cpu = f => { const a = process.cpuUsage(); const t = performance.now(); const r = f(); const b = process.cpuUsage(a); return [r, (b.user + b.system) / 1000, performance.now() - t]; };
const who = { sex: 'M', age: 44, hair: 'crop', dress: 'mail', coif: 1, id: 'e', wounds: { browCut: -1, nose: 1, eye: 1 }, g: { jawW: 0.7, jawSq: 0.6, brow: 0.7 } };
const plain = { sex: 'M', age: 32, hair: 'crop', dress: 'tunic', id: 'a' };
const rows = [];
const Q = +(process.argv[2] || 3); who.quad = Q; plain.quad = Q;
for (const [name, o] of [['veteran in mail', who], ['man in a tunic', plain]]) for (const [S, ss] of [[400, 1], [240, 2], [240, 1], [176, 1], [92, 1], [64, 1], [400, 1], [240, 1], [176, 1], [92, 1], [64, 1]]) {
  const sc0 = S / 400, hd = buildHead(Object.assign({ pxmm: sc0 * ss }, o)), sc = sc0 * (400 / (hd.meta.headH * 1.72));
  let bb = 1e9, br = 1e9, st = null, m, verts = 0, tris = 0;
  for (let i = 0; i < (S > 200 ? 8 : 40); i++) { const [mm, tb] = cpu(() => buildHead(Object.assign({ pxmm: sc * ss }, o))); m = mm; bb = Math.min(bb, tb); const [r, tr] = cpu(() => render(m, S, S, { ss, scale: sc, oy: S * 0.07 })); if (tr < br) { br = tr; st = r.ms; tris = r.tris; } verts = m.meta.verts; }
  rows.push({ who: name, px: S + (ss > 1 ? ' x' + ss : ''), pixels: S * S * ss * ss, verts, tris, buildMs: +bb.toFixed(1), renderMs: +br.toFixed(1), nsPerPx: Math.round(br * 1e6 / (S * S * ss * ss)), stages: Object.fromEntries(Object.entries(st).map(([k, v]) => [k, +v.toFixed(1)])) });
}
for (const r of rows) console.log(JSON.stringify(r));
