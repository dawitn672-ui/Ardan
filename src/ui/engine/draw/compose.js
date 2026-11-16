// Composing a portrait (characters.md §2, §5, §12): a look (numbers) and the part library in, a display list out.
//   point = base + Σ slider × strength(age) × (master − base) + age + sex + wound
// A master is a warp: a few handles, each moving the drawing near it (geom.warpPt). The head's warp also carries
// everything tied to the head (hair, beard, scars, age lines), and the bust's carries the dress, so worn things follow.
// Features (eyes, brows, nose, mouth, ear) are drawn in their own frame and hung on the head's anchors.
// The list is plain numbers and colours: the same look gives the same list in every browser (a test hashes it).
import { parse, mapPath, mapFlat, toBez, sample, frame, band, warpPt, round, h01, bbox, ellipse } from './geom.js';
import { lock, braid, hairs, strokePath } from './hair.js';
import { PATTERNS } from './dress.js';

export const Z = ['back', 'body', 'neck', 'dress', 'dress2', 'dress3', 'head', 'ear', 'face', 'feature', 'scar', 'beard', 'brow', 'hair', 'front', 'top'];
export const TIERS = { S: { lod: 0, crop: 'head' }, M: { lod: 1, crop: 'shoulders' }, L: { lod: 2, crop: 'bust' } };
const INK = '#1b1730';
const sm = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);

// age, sex and the strength of a face's signatures (§5)
export function rig(look) {
  const a = look.age ?? 30, grow = look.sex === 'F' ? sm((a - 11) / 6) : sm((a - 11) / 8);
  return { age: a, child: sm((18 - a) / 12), female: 0.5 + (look.sex === 'F' ? 0.5 : -0.5) * grow, elder: sm((a - 45) / 40), strength: 0.25 + 0.75 * Math.min(1, a / 18) };
}

function weightOf(name, look, R) {
  if (name === 'female' || name === 'child' || name === 'elder') return R[name];
  if (name.startsWith('wound:')) return (look.wounds || []).some(w => w.k === name.slice(6)) ? 1 : 0;
  if (name.startsWith('x:')) return (look.expr && look.expr[name.slice(2)]) || 0;
  const m = /^(\w+)([+-])$/.exec(name);
  if (m) { const v = (look.g && look.g[m[1]]) || 0; return Math.max(0, m[2] === '+' ? v : -v) * R.strength; }
  return 0;
}
// a part's active handles, each move scaled by its master's weight
function handles(part, look, R) {
  const H = [];
  for (const [name, m] of Object.entries(part.masters || {})) {
    const w = weightOf(name, look, R); if (!w) continue;
    for (const h of m.warp || []) H.push([h[0], h[1], h[2] * w, h[3] * w, h[4]]);
  }
  return H;
}

function mix(a, b, t) {
  const p = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)), A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

// the palette a look draws in: ramps by name; garments bind their own (cloth, trim, metal, leather, fur ...)
function palette(look, lib) {
  const P = lib.palettes, pal = {};
  const skin = P.skin[look.skin] || Object.values(P.skin)[0];
  pal.skin = skin; pal.lip = skin.lip; pal.eye = P.eye; pal.iris = P.iris[look.eyes] || Object.values(P.iris)[0];
  pal.hair = P.hair[(look.hair && look.hair.color)] || Object.values(P.hair)[0]; pal.grey = P.hair.grey;
  pal.brow = look.browColor ? P.hair[look.browColor] : pal.hair;
  pal.scar = skin.scar;
  for (const [k, v] of Object.entries(P.mats || {})) pal[k] = v;
  return pal;
}

export function compose(look, opts, lib) {
  const tier = opts.tier || 'L', lod = opts.lod ?? TIERS[tier].lod, finish = opts.finish || 'tone';
  const R = rig(look), pal = palette(look, lib), items = [], clips = [], named = {};
  const lineK = finish === 'line' ? 1.45 : 0.72;
  let seq = 0;

  // where the person stands in the frame: the eye line by height (§5), the head and body scaled by age
  const h = Math.max(150, Math.min(195, look.height ?? 172)), dy = Math.round(360 + (195 - h) / 45 * 168 - 446);
  const hs = 1 - 0.07 * R.child, bs = 1 - 0.3 * R.child;
  const head = lib.parts.head, Hh = handles(head, look, R);
  const bust = lib.parts[look.bust || 'bust'], Hb = bust ? handles(bust, look, R) : [];
  const Th = (x, y) => [500 + (x - 500) * hs, 700 + (y - 700) * hs + dy], Tb = (x, y) => [500 + (x - 500) * bs, 860 + (y - 860) * bs + dy - 24 - 90 * R.child];
  const warpHead = (x, y) => { const p = warpPt(Hh, x, y); return Th(p[0], p[1]); };
  const warpBody = (x, y) => { const p = warpPt(Hb, x, y); return Tb(p[0], p[1]); };
  const A = {}; for (const [k, p] of Object.entries(head.anchors || {})) A[k] = warpPt(Hh, p[0], p[1]);
  const scale = (opts.px || 480) / (opts.cropW || 1000);   // device px a unit, for the line floor

  const colour = (role, alpha) => {
    if (role[0] === '#') return role;
    let [ramp, v] = role.split('.');
    if (finish === 'line' && v) {
      const keep = /^(metal|gold|eye|iris|gem|steel|brass)/.test(ramp);
      if (v === 'half') v = keep ? 'half' : 'light'; else if (v === 'deep') v = 'shadow'; else if (v === 'hl' && !keep && ramp !== 'hair' && ramp !== 'grey') v = 'light';
    }
    if (ramp === 'ink') return INK;
    const r = pal[ramp]; let c = r ? (v ? r[v] : r) : null;
    if (typeof c !== 'string') c = '#ff00ff';
    if (v === 'line' && finish === 'line') c = mix(c, INK, 0.5);
    return c;
  };
  const clipOf = id => {
    if (!id) return undefined;
    const ids = Array.isArray(id) ? id : [id], out = [];
    for (const k of ids) { const n = named[k]; if (n === undefined) return -1; out.push(n); }
    const key = out.join(',');
    let i = clips.findIndex(c => c.key === key);
    if (i < 0) { i = clips.length; clips.push({ key, ids: out }); }
    return i;
  };
  // put one shape on the list
  const put = (z, role, d, o = {}) => {
    if (!d || !d.length) return;
    if ((o.lod ?? 0) > lod) return;
    if (o.finish && o.finish !== finish) return;
    const c = clipOf(o.clip); if (c === -1) return;
    const it = { z: Z.indexOf(z), q: seq++, d: round(d) };
    if (o.grad) {
      const g = o.grad; it.f = { g: 'r', x: Math.round(g.x * 10) / 10, y: Math.round(g.y * 10) / 10, r: g.r, s: g.stops.map(s => [s[0], colour(s[1]), finish === 'line' ? s[2] * 0.6 : s[2]]) };
    } else it.f = colour(role);
    if (o.alpha != null && o.alpha < 1) it.a = o.alpha;
    if (o.stroke) it.s = Math.max(o.stroke * (o.line ? lineK : 1), o.line === 'contour' ? 1.1 / scale : 0.7 / scale);
    if (o.rule) it.r = o.rule;
    if (c !== undefined) it.c = c;
    if (o.name) { named[o.name] = it.q; it.n = o.name; }
    items.push(it);
  };

  const ageF = (L, key) => {
    if (!L.age) return 1;
    const off = (h01(look.id + key) - 0.5) * 10, a0 = L.age[0] + off, a1 = L.age[1] + off;
    return Math.max(0, Math.min(1, (R.age - a0) / (a1 - a0)));
  };
  const when = (L) => {
    const w = L.when; if (!w) return true;
    if (w.sex && w.sex !== look.sex) return false;
    if (w.minAge != null && R.age < w.minAge) return false;
    if (w.maxAge != null && R.age > w.maxAge) return false;
    if (w.wound && !(look.wounds || []).some(x => x.k === w.wound)) return false;
    if (w.noWound && (look.wounds || []).some(x => x.k === w.noWound)) return false;
    if (w.finish && w.finish !== finish) return false;
    if (w.flag && !(look.flags || []).includes(w.flag)) return false;
    if (w.noFlag && (look.flags || []).includes(w.noFlag)) return false;
    return true;
  };

  // draw the layers of one part with a point mapping
  function drawPart(part, pid, map, zDef) {
    for (const L of part.layers || []) {
      if (!when(L)) continue;
      const f = ageF(L, pid + (L.id || '')); if (f <= 0) continue;
      const z = L.z || zDef, nm = L.id ? `${pid}.${L.id}` : undefined, clip = L.clip ? (L.clip.includes('.') ? L.clip : `${pid}.${L.clip}`) : undefined;
      const base = { lod: L.lod ?? 0, clip, name: nm, finish: L.finish, rule: L.rule, alpha: L.alpha };
      const ctx = { warp: map, lod, kSteps: lod >= 2 ? 10 : 6, lineK, cast: L.cast, emit: (role, d, o = {}) => put(o.z || z, role, d, { ...base, ...o, name: o.name === null ? undefined : (o.name ?? nm), clip: o.clip ? (o.clip.includes('.') ? o.clip : `${pid}.${o.clip}`) : clip, lod: Math.max(base.lod, o.lod ?? 0) }) };
      if (L.d || L.e) {
        let grad;
        if (L.grad) { const c = map(L.grad[0], L.grad[1]); grad = { x: c[0], y: c[1], r: L.grad[2] * (L.gradS || 1), stops: L.stops || [[0, L.role, L.ga ?? 0.5], [1, L.role, 0]] }; }
        const shape = L.e ? mapFlat(ellipse(L.e[0], L.e[1], L.e[2], L.e[3], (L.e[4] || 0) * Math.PI / 180), map) : toBez(mapPath(parse(L.d), map));
        put(z, L.role, shape, { ...base, alpha: (L.alpha ?? 1) * (L.age ? f : 1), grad, stroke: L.stroke, line: L.stroke ? (L.k || 'form') : undefined });
      } else if (L.line) {
        const P = sample(toBez(mapPath(parse(L.line), map)), lod >= 2 ? 10 : 6), k = L.k || 'form';
        if (k === 'detail' && lod < 2) continue;
        const wk = (k === 'tone' ? 1 : k === 'contour' ? lineK : 0.5 + lineK / 2) * (0.4 + 0.6 * f), Fr = frame(P, L.w || [2], wk);
        const floor = k === 'tone' ? 0 : (k === 'contour' ? 1.1 : 0.75) / scale;
        for (const q of Fr) if (q.w > 0.3 && q.w < floor) q.w = floor;
        const span = 0.5 * (0.35 + 0.65 * f);
        put(z, L.role, band(Fr, -1, 1, L.age ? 0.5 - span : 0, L.age ? 0.5 + span : 1, L.tip ?? 0.12), { ...base, alpha: L.alpha });
      } else if (L.locks) {
        L.locks.forEach((lk, i) => {
          const key = look.id + pid + (L.id || '') + i;
          const grey = look.grey ? h01(key + 'grey') < look.grey : false;
          lock({ ...lk, ramp: lk.ramp || (grey ? 'grey' : L.ramp || 'hair') }, ctx, key);
        });
      } else if (L.braid) braid(L.braid, ctx, look.id + pid + L.id);
      else if (L.hairs) {
        const S = hairs(L.hairs, ctx, look.id + pid + (L.id || ''), cuts);
        if (L.hairs.grey != null || look.grey) {
          const g = L.hairs.grey ?? look.grey, a = [], b = [];
          S.forEach(s => (h01(look.id + 'bg' + s.i) < g ? b : a).push(s));
          put(z, L.role, strokePath(a, (L.hairs.wid || 1.6) * (finish === 'line' ? 1.15 : 1)), { ...base, alpha: L.alpha });
          put(z, L.roleGrey || 'grey.light', strokePath(b, (L.hairs.wid || 1.6)), { ...base, alpha: L.alpha, name: undefined });
        } else put(z, L.role, strokePath(S, (L.hairs.wid || 1.6) * (finish === 'line' ? 1.15 : 1)), { ...base, alpha: L.alpha });
      } else if (L.pat) {
        const fn = PATTERNS[L.pat.type]; if (fn) fn({ ...L.pat, clip: L.pat.clip ? (L.pat.clip.includes('.') ? L.pat.clip : `${pid}.${L.pat.clip}`) : undefined }, ctx, look.id + pid + (L.id || ''));
      }
    }
  }

  // a feature hung on an anchor: its own masters, then the slider moves that need no drawing (size, spacing, tilt)
  const featMap = (part, anchor, o = {}) => {
    const H = handles(part, look, R), [ax, ay] = A[anchor] || [500, 500], s = o.s ?? 1, sx = (o.sx ?? 1) * s, sy = (o.sy ?? 1) * s, rot = o.rot || 0;
    const c = Math.cos(rot), sn = Math.sin(rot), ox = o.dx || 0, oy = o.dy || 0;
    return (x, y) => { const p = warpPt(H, x, y), lx = p[0] * sx, ly = p[1] * sy; return Th(ax + ox + lx * c - ly * sn, ay + oy + lx * sn + ly * c); };
  };

  // scars: their guides are known first, so brows and beards can give way along them (§7)
  const cuts = [];
  const wound = lib.parts.wounds;
  const scarLayers = [];
  for (const [i, w] of (look.wounds || []).entries()) {
    const def = wound && wound.cuts && wound.cuts[w.at];
    if (w.k !== 'cut' || !def) continue;
    const prof = wound.profiles[w.p ?? Math.floor(h01(look.id + 'wp' + i) * wound.profiles.length)];
    const len = w.len ?? def.len, ang = (w.ang ?? def.ang) * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang), side = w.flip ? -1 : 1;
    const pts = prof.map(([u, v]) => { const x = def.at[0] + (u - 0.5) * len * ca - v * len * side * sa, y = def.at[1] + (u - 0.5) * len * sa + v * len * side * ca; return warpHead(x, y); });
    cuts.push({ pts: sample(toBez([{ op: 'M', p: pts[0] }, { op: 'S', p: pts.slice(1).flat() }]), 6), r: (w.wid ?? def.wid ?? 6) * 1.6 });
    scarLayers.push({ w, pts, def, i });
  }

  // 1. the head and neck; 2. the bust and dress; 3. the features; 4. hair, beard, scars
  drawPart(head, 'head', warpHead, 'head');
  if (bust) drawPart(bust, 'bust', warpBody, 'body');
  for (const piece of look.dress || []) {
    const part = lib.parts[piece.id]; if (!part) continue;
    const save = {}; for (const [slot, mat] of Object.entries(piece.mats || part.mats || {})) { save[slot] = pal[slot]; pal[slot] = lib.palettes.mats[mat] || pal[slot]; }
    drawPart(part, piece.id, part.follow === 'head' ? warpHead : warpBody, part.z || 'dress');
    for (const k of Object.keys(save)) pal[k] = save[k];
  }
  const g = look.g || {};
  const eS = 1 + 0.08 * (g.eyeSize || 0), gap = 7 * (g.eyeGap || 0) * R.strength, tilt = 0.06 * (g.eyeTilt || 0);
  const feats = [
    ['ear', 'ear', { s: 1 + 0.12 * (g.earSize || 0) * R.strength + 0.08 * R.elder - 0.1 * R.child }],
    ['eye_f', 'eye_f', { s: eS * (1 + 0.1 * R.child), dx: -gap * 0.8, rot: -tilt }],
    ['eye_n', 'eye_n', { s: eS * (1 + 0.1 * R.child), dx: gap, rot: tilt }],
    ['brow_f', 'brow_f', { dx: -gap * 0.8 }], ['brow_n', 'brow_n', { dx: gap }],
    ['nose', 'nose', {}],
    ['mouth', 'mouth', { sx: 1 + 0.1 * (g.mouthW || 0) * R.strength, dy: 5 * (g.upperLip || 0) * R.strength }],
  ];
  for (const [pid, anchor, o] of feats) { const part = lib.parts[look.parts?.[pid] || pid]; if (part) drawPart(part, pid, featMap(part, anchor, o), part.z || 'feature'); }

  for (const s of scarLayers) {
    const { w, pts } = s, yrs = w.y ?? 10, fresh = yrs < 0.15, red = yrs < 1 ? 1 : yrs < 3 ? (3 - yrs) / 2 : 0;
    const P = sample(toBez([{ op: 'M', p: pts[0] }, { op: 'S', p: pts.slice(1).flat() }]), 10), wid = w.wid ?? s.def.wid ?? 6;
    const F = frame(P, [wid * 0.3, wid, wid * 0.85, wid * 0.25]);
    const z = 'scar', o = { lod: 0 };
    if (red > 0) pal.scarNow = { light: mix(pal.scar.light, pal.scar.red, red), shadow: mix(pal.scar.shadow, pal.scar.redDeep, red) }; else pal.scarNow = pal.scar;
    put(z, 'scarNow.shadow', band(F, -1.25, 1.25, 0, 1, 0.2), { lod: 0, alpha: 0.55 });
    put(z, 'scarNow.light', band(F, -0.8, 0.8, 0, 1, 0.2), o);
    put(z, 'skin.line', band(F, 0.45, 1.05, 0.04, 0.96, 0.25), { lod: 1, alpha: 0.85 });
    put(z, 'scar.hl', band(F, -1.0, -0.55, 0.1, 0.9, 0.3), { lod: 1 });
    if (lod >= 2) {   // the pull of the healed edges: short puckers across the cut
      const tick = [];
      for (let k = 1; k < 8; k++) { const f = F[Math.round(k / 8 * (F.length - 1))], L = wid * (fresh ? 1.6 : 1.1); tick.push(...band(frame([[f.x - f.nx * L, f.y - f.ny * L, 0], [f.x, f.y, 0.5], [f.x + f.nx * L, f.y + f.ny * L, 1]], [fresh ? 1.6 : 1.1]), -1, 1, 0, 1, 0.4)); }
      put(z, fresh ? 'ink' : 'scar.shadow', tick, { lod: 2, alpha: fresh ? 0.9 : 0.45 });
    }
  }

  const hair = look.hair && lib.parts[look.hair.style];
  if (hair) drawPart(hair, 'hair', warpHead, 'hair');
  const beard = look.beard && lib.parts[look.beard];
  if (beard) drawPart(beard, 'beard', warpHead, 'beard');
  for (const extra of look.extras || []) { const p = lib.parts[extra]; if (p) drawPart(p, extra, p.follow === 'body' ? warpBody : warpHead, p.z || 'top'); }

  items.sort((a, b) => a.z - b.z || a.q - b.q);
  // the clip table names items by sequence; resolve to their paths
  const byQ = new Map(items.map(it => [it.q, it]));
  const clipList = clips.map(c => c.ids.map(q => ({ d: byQ.get(q).d, r: byQ.get(q).r })));
  const out = items.map(({ z, q, n, ...rest }) => rest);
  // the crops (§12): head and collar; head and shoulders; the bust
  const eye = Th((A.eye_n[0] + A.eye_f[0]) / 2, (A.eye_n[1] + A.eye_f[1]) / 2);
  const crops = { face: [Math.round(eye[0] - 262), Math.round(eye[1] - 150), 440, 300], head: [Math.round(eye[0] - 262), Math.round(eye[1] - 250), 560, 560], shoulders: [Math.round(eye[0] - 340), Math.round(eye[1] - 300), 700, 700], bust: [0, 0, 1000, 1200] };
  return { items: out, clips: clipList, crop: crops[TIERS[tier].crop], crops, shapes: out.length };
}

// a stable hash of a display list (for looksSame)
export function listHash(L) {
  const s = JSON.stringify([L.items, L.clips]);
  let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, '0') + ':' + s.length;
}
export { bbox };
