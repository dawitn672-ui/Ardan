// replicate the renderer's skin line colour and measure WCAG contrast of face line vs skin for each human skin tone
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const mix0 = (a, b, t) => { const A = hex(a), B = hex(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
const hsl = c => { let [r, g, b] = hex(c).map(v => v / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2; if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; } return [h, s, l]; };
const fromHsl = (h, s, l) => { const f = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; }; let r, g, b; if (!s) r = g = b = l; else { const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; r = f(p, q, h + 1 / 3); g = f(p, q, h); b = f(p, q, h - 1 / 3); } return toHex([r, g, b].map(v => v * 255)); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const tune = (c, ds, dl, sMin = 0, sMax = 1, lMin = 0, lMax = 1) => { const [h, s, l] = hsl(c); return fromHsl(h, clamp(s * ds, sMin, sMax), clamp(l + dl, lMin, lMax)); };
const lum = c => { const [r, g, b] = hex(c).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; };
const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
const LINE = '#1b1730';
const skins = ["#f3d6c1","#e8c0a0","#d9a77f","#c08a5e","#a06c45","#7e5132","#5c3a23","#3f2817"];
console.log('skin     line     line/skin  LINE/skin  eyewhite/skin');
for (const s of skins) { const line = tune(mix0(s, LINE, .55), 1.3, 0, 0, .7); console.log(s, line, cr(line, s).toFixed(2).padStart(9), cr(LINE, s).toFixed(2).padStart(9), cr('#f6f1ea', s).toFixed(2).padStart(9)); }
console.log('eyes (stored -> drawn)');
for (const e of ["#4b3621","#6b4a2b","#7a8a3a","#3f6e8c","#6d8fa6","#5d6a6f","#8b6d2e","#2f2f2f"]) { const [h, s, l] = hsl(e); const d = fromHsl(h, clamp(s * 1.5 + .12, 0, .78), clamp(l * 1.1 + .06, .3, .6)); console.log(e, '->', d, 'sat', s.toFixed(2), '->', hsl(d)[1].toFixed(2)); }
