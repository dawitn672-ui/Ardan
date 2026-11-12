import { generateContinent, components, riverPaths } from '../../src/map/engine/continent.js';
import { renderMap, drawRivers } from '../../src/map/engine/render.js';
import { writePng } from './png-encoder.js';
const seed = process.argv[2] || 'ardan';
const t0 = Date.now();
const map = generateContinent({ seed });
const t1 = Date.now();
const land = map.elev.reduce((a, v) => a + (v > 0), 0);
const comps = components(map.elev, map.W, map.H);
const main = comps.list.find((c) => c.id === comps.largest).size;
console.log(JSON.stringify({ seed, genMs: t1 - t0, landShare: +(land / map.elev.length).toFixed(3), mainShareOfLand: +(main / land).toFixed(3), landmasses: comps.list.length, ...map.stats, provinces: map.provinces.list.length }));
const rp = riverPaths(map);
writePng(`out/map-${seed}.png`, drawRivers(renderMap(map, { scale: 1.5 }), rp, 1.5));
if (process.argv[3] === 'zoom') {
  // LOD crop test: render a 4x zoomed patch
  const sub = drawRivers(renderMap(map, { scale: 4 }), rp, 4);
  const cw = 640, ch = 440, ox = Math.floor(sub.width * 0.4), oy = Math.floor(sub.height * 0.35);
  const crop = new Uint8ClampedArray(cw * ch * 4);
  for (let y = 0; y < ch; y++) crop.set(sub.data.subarray(((oy + y) * sub.width + ox) * 4, ((oy + y) * sub.width + ox + cw) * 4), y * cw * 4);
  writePng(`out/map-${seed}-zoom.png`, { width: cw, height: ch, data: crop });
}
console.log('render ms', Date.now() - t1);
