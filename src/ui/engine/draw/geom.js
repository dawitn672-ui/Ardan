// Geometry for the 2D portraits (characters.md §2, §12): path strings, smooth runs, the warp a master applies, and the
// swelling line (a centre line with a width at each node, filled as a shape). Plain arithmetic only (+ - * / and sqrt),
// so one look gives one display list everywhere. No randomness: anything that looks random is a hash of an id.

// A path string is whole numbers and the letters M L C S Z. "S x y x y ..." is a smooth run through the points (the
// nodes; their handles are worked out), so a drawing is mostly nodes. A run that is the whole closed shape ("M p S ... Z")
// closes smoothly; elsewhere a run starts and ends on a corner.
export function parse(str) {
  const tok = String(str).match(/[MLCSZ]|-?\d+(?:\.\d+)?/g) || [], out = [];
  let cur = null;
  for (const t of tok) {
    if (t.length === 1 && t >= 'A' && t <= 'Z') { cur = { op: t, p: [] }; out.push(cur); }
    else if (cur) cur.p.push(+t);
  }
  return out;
}

// the warp of a master: handles [x, y, dx, dy, r]; a point moves by the sum of each handle's move times (1 - d²/r²)²
export function warpPt(hs, x, y) {
  let ox = 0, oy = 0;
  for (let i = 0; i < hs.length; i++) {
    const h = hs[i], ex = x - h[0], ey = y - h[1], t = (ex * ex + ey * ey) / (h[4] * h[4]);
    if (t < 1) { const k = (1 - t) * (1 - t) * (h[5] ?? 1); ox += k * h[2]; oy += k * h[3]; }
  }
  return [x + ox, y + oy];
}
// every point of a parsed path through a function (x, y) -> [x, y]
export function mapPath(cmds, f) {
  return cmds.map(c => { const p = []; for (let i = 0; i < c.p.length; i += 2) { const q = f(c.p[i], c.p[i + 1]); p.push(q[0], q[1]); } return { op: c.op, p }; });
}

// parsed path -> flat list of ops: 0 x y (move), 1 x y (line), 2 x1 y1 x2 y2 x y (cubic), 3 (close)
export function toBez(cmds) {
  const out = []; let cx = 0, cy = 0, sx = 0, sy = 0;
  const closedRun = cmds.length === 3 && cmds[0].op === 'M' && cmds[1].op === 'S' && cmds[2].op === 'Z';
  for (let ci = 0; ci < cmds.length; ci++) {
    const c = cmds[ci], p = c.p;
    if (c.op === 'M') { cx = sx = p[0]; cy = sy = p[1]; out.push(0, cx, cy); for (let i = 2; i < p.length; i += 2) { cx = p[i]; cy = p[i + 1]; out.push(1, cx, cy); } }
    else if (c.op === 'L') for (let i = 0; i < p.length; i += 2) { cx = p[i]; cy = p[i + 1]; out.push(1, cx, cy); }
    else if (c.op === 'C') for (let i = 0; i + 5 < p.length; i += 6) { out.push(2, p[i], p[i + 1], p[i + 2], p[i + 3], p[i + 4], p[i + 5]); cx = p[i + 4]; cy = p[i + 5]; }
    else if (c.op === 'S') {
      const q = [cx, cy, ...p], n = q.length / 2;
      if (closedRun) {
        // periodic: the run closes back on its first node
        for (let i = 0; i < n; i++) {
          const a = (i - 1 + n) % n, b = (i + 1) % n, d = (i + 2) % n;
          out.push(2, q[2 * i] + (q[2 * b] - q[2 * a]) / 6, q[2 * i + 1] + (q[2 * b + 1] - q[2 * a + 1]) / 6,
            q[2 * b] - (q[2 * d] - q[2 * i]) / 6, q[2 * b + 1] - (q[2 * d + 1] - q[2 * i + 1]) / 6, q[2 * b], q[2 * b + 1]);
        }
        cx = sx; cy = sy;
      } else {
        const X = i => q[2 * Math.max(0, Math.min(n - 1, i))], Y = i => q[2 * Math.max(0, Math.min(n - 1, i)) + 1];
        for (let i = 0; i < n - 1; i++) out.push(2, X(i) + (X(i + 1) - X(i - 1)) / 6, Y(i) + (Y(i + 1) - Y(i - 1)) / 6, X(i + 1) - (X(i + 2) - X(i)) / 6, Y(i + 1) - (Y(i + 2) - Y(i)) / 6, X(i + 1), Y(i + 1));
        cx = q[q.length - 2]; cy = q[q.length - 1];
      }
    } else if (c.op === 'Z') { out.push(3); cx = sx; cy = sy; }
  }
  return out;
}

// sample an open flat path into points with the node index as the parameter (node i at u = i), k steps a curve
export function sample(bez, k = 8) {
  const P = []; let cx = 0, cy = 0, node = 0;
  for (let i = 0; i < bez.length;) {
    const op = bez[i];
    if (op === 0) { cx = bez[i + 1]; cy = bez[i + 2]; if (!P.length) P.push([cx, cy, 0]); i += 3; }
    else if (op === 1) { const x = bez[i + 1], y = bez[i + 2]; for (let s = 1; s <= 2; s++) P.push([cx + (x - cx) * s / 2, cy + (y - cy) * s / 2, node + s / 2]); cx = x; cy = y; node++; i += 3; }
    else if (op === 2) {
      const [x1, y1, x2, y2, x, y] = bez.slice(i + 1, i + 7);
      for (let s = 1; s <= k; s++) {
        const t = s / k, m = 1 - t, a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, d = t * t * t;
        P.push([a * cx + b * x1 + c * x2 + d * x, a * cy + b * y1 + c * y2 + d * y, node + t]);
      }
      cx = x; cy = y; node++; i += 7;
    } else i++;
  }
  return P;
}

// widths at the nodes -> a width at parameter u (smooth between nodes)
export function widthAt(w, u, nodes) {
  if (!w || !w.length) return 2;
  if (w.length === 1) return w[0];
  const f = nodes > 0 ? u / nodes * (w.length - 1) : 0, i = Math.max(0, Math.min(w.length - 2, Math.floor(f))), t = Math.max(0, Math.min(1, f - i)), s = t * t * (3 - 2 * t);
  return w[i] + (w[i + 1] - w[i]) * s;
}

// samples with a unit normal and a width each: the frame every band is cut from
export function frame(P, w, scale = 1) {
  const n = P.length ? P[P.length - 1][2] : 0, F = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.sqrt(tx * tx + ty * ty) || 1; tx /= l; ty /= l;
    F.push({ x: P[i][0], y: P[i][1], nx: -ty, ny: tx, w: widthAt(w, P[i][2], n) * scale, u: n ? P[i][2] / n : 0 });
  }
  return F;
}
// a band of a frame: across from lo to hi (in half-widths, -1..1), along from u0 to u1 (0..1), its ends tapered over
// `tip` of the length. Returns a closed flat path.
export function band(F, lo = -1, hi = 1, u0 = 0, u1 = 1, tip = 0) {
  const L = [], R = [];
  for (const f of F) {
    if (f.u < u0 - 1e-9 || f.u > u1 + 1e-9) continue;
    let k = 1;
    if (tip > 0) { const e = Math.min(f.u - u0, u1 - f.u) / tip; k = e >= 1 ? 1 : Math.max(0, e * (2 - e)); }
    const h = f.w / 2 * k, mid = (lo + hi) / 2, ka = mid * f.w / 2 + (lo - mid) * h, kb = mid * f.w / 2 + (hi - mid) * h;
    L.push(f.x + f.nx * ka, f.y + f.ny * ka); R.push(f.x + f.nx * kb, f.y + f.ny * kb);
  }
  if (L.length < 4) return [];
  const out = [0, L[0], L[1]];
  for (let i = 2; i < L.length; i += 2) out.push(1, L[i], L[i + 1]);
  for (let i = R.length - 2; i >= 0; i -= 2) out.push(1, R[i], R[i + 1]);
  out.push(3);
  return out;
}

// the bounding box of a flat path
export function bbox(bez) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (let i = 0; i < bez.length;) {
    const op = bez[i], n = op === 0 || op === 1 ? 2 : op === 2 ? 6 : 0;
    for (let j = 1; j <= n; j += 2) { const x = bez[i + j], y = bez[i + j + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    i += 1 + n;
  }
  return [x0, y0, x1, y1];
}
// affine on a flat path: x' = a x + c y + e, y' = b x + d y + f
export function affine(bez, a, b, c, d, e, f) {
  const out = bez.slice();
  for (let i = 0; i < out.length;) {
    const op = out[i], n = op === 0 || op === 1 ? 2 : op === 2 ? 6 : 0;
    for (let j = 1; j <= n; j += 2) { const x = out[i + j], y = out[i + j + 1]; out[i + j] = a * x + c * y + e; out[i + j + 1] = b * x + d * y + f; }
    i += 1 + n;
  }
  return out;
}
// every point of a flat path through f(x, y) -> [x, y]
export function mapFlat(bez, f) {
  const out = bez.slice();
  for (let i = 0; i < out.length;) {
    const op = out[i], n = op === 0 || op === 1 ? 2 : op === 2 ? 6 : 0;
    for (let j = 1; j <= n; j += 2) { const q = f(out[i + j], out[i + j + 1]); out[i + j] = q[0]; out[i + j + 1] = q[1]; }
    i += 1 + n;
  }
  return out;
}
// round every coordinate to a tenth of a unit (the list is plain numbers, the same everywhere)
export function round(bez) {
  const out = bez.slice();
  for (let i = 0; i < out.length;) {
    const op = out[i], n = op === 0 || op === 1 ? 2 : op === 2 ? 6 : 0;
    for (let j = 1; j <= n; j++) out[i + j] = Math.round(out[i + j] * 10) / 10;
    i += 1 + n;
  }
  return out;
}
// an ellipse as four cubics (k = 0.5523)
export function ellipse(cx, cy, rx, ry, rot = 0) {
  const k = 0.5523, c = rot ? Math.cos(rot) : 1, s = rot ? Math.sin(rot) : 0, P = (x, y) => [cx + x * c - y * s, cy + x * s + y * c];
  const pts = [[rx, 0], [rx, k * ry], [k * rx, ry], [0, ry], [-k * rx, ry], [-rx, k * ry], [-rx, 0], [-rx, -k * ry], [-k * rx, -ry], [0, -ry], [k * rx, -ry], [rx, -k * ry], [rx, 0]];
  const q = pts.map(p => P(p[0], p[1]));
  const out = [0, q[0][0], q[0][1]];
  for (let i = 1; i < 13; i += 3) out.push(2, q[i][0], q[i][1], q[i + 1][0], q[i + 1][1], q[i + 2][0], q[i + 2][1]);
  out.push(3);
  return out;
}

// a 32-bit hash of a string (FNV-1a) and a 0..1 value from it: the id's dice for things that look random
export function hash(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export const h01 = s => hash(s) / 4294967296;
// a fixed table of waves (no Math.sin at draw time on the hot path): 64 steps of one period
export const WAVE = Array.from({ length: 64 }, (_, i) => Math.round(Math.sin(i / 64 * Math.PI * 2) * 10000) / 10000);
export const wave = t => { const f = ((t % 1) + 1) % 1 * 64, i = Math.floor(f), r = f - i; return WAVE[i & 63] * (1 - r) + WAVE[(i + 1) & 63] * r; };
