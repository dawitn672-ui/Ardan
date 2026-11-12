// Drawing a display list on a 2D canvas (characters.md §12): one Path2D a shape, the crop as one transform. Reads the
// list, writes pixels; nothing is read back into the world.
function trace(p, d) {
  for (let i = 0; i < d.length;) {
    const op = d[i];
    if (op === 0) { p.moveTo(d[i + 1], d[i + 2]); i += 3; }
    else if (op === 1) { p.lineTo(d[i + 1], d[i + 2]); i += 3; }
    else if (op === 2) { p.bezierCurveTo(d[i + 1], d[i + 2], d[i + 3], d[i + 4], d[i + 5], d[i + 6]); i += 7; }
    else { p.closePath(); i++; }
  }
}
const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

// list: compose()'s result; g: a CanvasRenderingContext2D; px: device pixels across the crop
export function draw(list, g, px, crop = list.crop, P2D = globalThis.Path2D) {
  const k = px / crop[2];
  g.save();
  g.setTransform(k, 0, 0, k, -crop[0] * k, -crop[1] * k);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const clipPaths = list.clips.map(c => c.map(e => { const p = new P2D(); trace(p, e.d); return { p, r: e.r }; }));
  let cur;
  for (const it of list.items) {
    if (it.c !== cur) {
      if (cur !== undefined) g.restore();
      cur = it.c;
      if (cur !== undefined) { g.save(); for (const e of clipPaths[cur]) g.clip(e.p, e.r || 'nonzero'); }
    }
    const p = new P2D(); trace(p, it.d);
    g.globalAlpha = it.a ?? 1;
    let style = it.f;
    if (typeof style === 'object') {
      const gr = g.createRadialGradient(style.x, style.y, 0, style.x, style.y, style.r);
      for (const [o, c, a] of style.s) gr.addColorStop(o, hexA(c, a));
      style = gr;
    }
    if (it.s) { g.strokeStyle = style; g.lineWidth = it.s; g.stroke(p); }
    else { g.fillStyle = style; g.fill(p, it.r || 'nonzero'); }
  }
  if (cur !== undefined) g.restore();
  g.restore();
}
