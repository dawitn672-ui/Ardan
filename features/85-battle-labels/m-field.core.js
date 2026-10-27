// The battle field as a woodblock battle print (cycle 1 visual I3; brief §7.2's layers, Kuniyoshi's warrior prints):
// a sky band in the battle's hour and weather, a far and a mid ridge in its terrain, the near ground lit along its top
// edge; each unit is a mass of pikes, horses or bows under a banner pole in its realm's colour, not a box with a cross;
// the labels on the field are counts only, and the unit's full name shows on hover or focus (the canvas's title, and
// the side panel as before); one caption per wing at the field's edge; the end is a small cartouche, and the VICTORY
// or DEFEAT cut-in (96-moments) carries the moment.
// Drawing only: the colours come from 94-woodblock-skies' palette, every seeded mark hashes the battle's id, and
// nothing reads A.rand or writes A.S. With the colour prints off (UI.set.skies false) the release's field is drawn.
(function () {
  const hash = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const hex = h => { const m = /^#?([0-9a-f]{6})$/i.exec(String(h || '')); const n = m ? parseInt(m[1], 16) : 0x888888; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const mix = (a, b, t) => { const x = hex(a), y = hex(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const INK = '#1b1730';
  UI.BFIELD = UI.BFIELD || {};
  const BF = UI.BFIELD;
  BF.on = () => UI.set.skies !== false && !!UI.SKIES && typeof UI.SKIES.palette === 'function';
  UI.bfGroundOn = false;
  // the hour of a battle: storm in rain, dawn in fog, otherwise golden hour or day by the battle's id (brief §7.2)
  BF.hour = B => B.weather === 'rain' || B.weather === 'storm' ? 'storm' : B.weather === 'fog' ? 'dawn' : hash(B.id || B.title || '') % 3 ? 'golden' : 'day';
  BF.terr = B => { const T = UI.SKIES && UI.SKIES.TERRAIN; return T && T[B.terr] ? B.terr : 'hills'; };
  const ridge = (r, W, y, amp, n) => { const pts = []; let v = 0; for (let i = 0; i <= n; i++) { v = v * 0.55 + (r() - 0.5) * amp; pts.push([i / n * W, y + v]); } return pts; };
  const fillRidge = (ctx, pts, W, H, col) => { ctx.beginPath(); ctx.moveTo(0, H); for (const [x, y] of pts) ctx.lineTo(x, y); ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); };
  UI.bfGround = function (ctx, W, H, B) {
    UI.bfGroundOn = false;
    if (!BF.on() || !B) return false;
    let c;
    try { c = UI.SKIES.palette(BF.hour(B), BF.terr(B), 1, false); } catch (e) { return false; }
    UI.bfGroundOn = true;
    BF.pal = c;
    const r = rng(hash('bf|' + (B.id || B.title || '')));
    const sky = Math.round(H * 0.15);
    // 1. the sky band with the ichimonji stripe
    const g = ctx.createLinearGradient(0, 0, 0, sky);
    g.addColorStop(0, c.st); g.addColorStop(0.7, c.sm || c.sb); g.addColorStop(1, c.sb);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, sky + 2);
    ctx.fillStyle = mix(c.st, INK, 0.35); ctx.globalAlpha = 0.55; ctx.fillRect(0, 0, W, Math.max(6, sky * 0.12)); ctx.globalAlpha = 1;
    // 2. the far and the mid ridge
    fillRidge(ctx, ridge(r, W, sky - 4, 26, 18), W, H, c.f1);
    fillRidge(ctx, ridge(r, W, sky + 8, 18, 26), W, H, c.f2);
    // 3. the near ground: the field itself, a flat print colour light enough for the units to read on
    const ground = mix(mix(c.near, c.light, 0.5), '#efe6d2', 0.18), ground2 = mix(c.near, c.light, 0.36);
    const gy = sky + 16;
    const gg = ctx.createLinearGradient(0, gy, 0, H);
    gg.addColorStop(0, ground2); gg.addColorStop(0.35, ground); gg.addColorStop(1, ground2);
    ctx.fillStyle = gg; ctx.fillRect(0, gy, W, H - gy);
    ctx.strokeStyle = c.light; ctx.globalAlpha = 0.7; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); ctx.globalAlpha = 1;
    // seeded tufts and stones in the land's darker tone, sparse
    ctx.strokeStyle = mix(ground, INK, 0.35); ctx.lineWidth = 1; ctx.globalAlpha = 0.45;
    for (let i = 0; i < 70; i++) { const x = r() * W, y = gy + 12 + r() * (H - gy - 24); ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x - 1, y - 4); ctx.moveTo(x, y); ctx.lineTo(x + 1, y - 5); ctx.moveTo(x + 3, y); ctx.lineTo(x + 3.5, y - 3.5); ctx.stroke(); }
    ctx.globalAlpha = 1;
    // weather: rain as hairlines at 20%, fog as a pale band
    if (B.weather === 'rain' || B.weather === 'storm') { ctx.strokeStyle = 'rgba(220,230,255,.2)'; ctx.lineWidth = 1; for (let i = 0; i < 90; i++) { const x = (i * 53) % W, y = (i * 97) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 14); ctx.stroke(); } }
    if (B.weather === 'fog') { ctx.fillStyle = 'rgba(240,236,226,.22)'; ctx.fillRect(0, sky - 10, W, H * 0.3); }
    // the line where the armies meet: a faint ink rule
    ctx.strokeStyle = mix(ground, INK, 0.3); ctx.globalAlpha = 0.35; ctx.setLineDash([2, 6]); ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
    // the hover list for this frame
    if (ctx.canvas) { ctx.canvas.__bfHov = []; BF.hover(ctx.canvas); }
    return true;
  };
  // one caption for each wing, small, at the field's edge under the sky band
  UI.bfWings = function (ctx, W, H, wingX) {
    ctx.save(); ctx.font = '600 10px Cinzel, Georgia, serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(27,23,48,.55)';
    const y = Math.round(H * 0.15) + 30;
    for (const [k, t] of [['L', 'LEFT WING'], ['C', 'CENTRE'], ['R', 'RIGHT WING']]) ctx.fillText(t, wingX[k], y);
    ctx.restore();
  };
  // a unit block as a mass: a dark body in the realm's colour, a row of pikes (foot), heads (horse) or bows (missile)
  // above it, and a banner pole at one end whose flag carries the side's edge colour
  UI.bfBlock = function (ctx, x, y, w, h, col, edge, cat, per, bottom) {
    const body = mix(col, INK, 0.38), lit = mix(col, '#fff4dc', 0.25);
    ctx.save();
    ctx.fillStyle = body; ctx.strokeStyle = INK; ctx.lineWidth = per ? 0.8 : 1.4;
    const r = Math.min(3, h / 3);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = lit; ctx.fillRect(x + 1, y + 1, Math.max(1, w - 2), Math.max(1, Math.min(3, h * 0.25)));
    if (!per || w >= 7) {
      const step = per ? 3 : 4, n = Math.max(1, Math.floor((w - 2) / step));
      ctx.strokeStyle = INK; ctx.lineWidth = per ? 0.7 : 1;
      if (cat === 'horse') {
        ctx.fillStyle = body;
        for (let i = 0; i < n; i += 2) { const hx = x + 2 + i * step; ctx.beginPath(); ctx.ellipse(hx + 1.5, y - 1, 1.8, 2.4, -0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      } else if (cat === 'missile') {
        for (let i = 0; i < n; i += 2) { const bx = x + 2 + i * step; ctx.beginPath(); ctx.arc(bx + 1, y - 2, 2.2, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); }
      } else {
        const tall = per ? h * 0.9 : Math.max(8, h * 0.75);
        ctx.beginPath(); for (let i = 0; i < n; i++) { const px = x + 2 + i * step; ctx.moveTo(px, y); ctx.lineTo(px + (bottom ? 0.6 : -0.6), y - tall); } ctx.stroke();
      }
    }
    // the banner: a pole at the outer end and a flag in the realm's colour, edged in the side's colour
    if (!per || w >= 9) {
      const px = bottom ? x + w - 2 : x + 2, top = y - (per ? 10 : 18), fw = per ? 6 : 10, fh = per ? 4 : 7;
      ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, top); ctx.stroke();
      ctx.fillStyle = col; ctx.strokeStyle = edge; ctx.lineWidth = 1.2;
      const dir = bottom ? -1 : 1;
      ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px + dir * fw, top + 1); ctx.lineTo(px + dir * (fw - 2), top + fh / 2); ctx.lineTo(px + dir * fw, top + fh); ctx.lineTo(px, top + fh); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
    return true;
  };
  // the end: a small cartouche at the top of the field
  UI.bfEnd = function (ctx, W, H, B, side) {
    const t = B.winner === side ? 'VICTORY' : B.winner === 'draw' ? 'DRAWN FIELD' : 'DEFEAT';
    ctx.save(); ctx.font = '700 15px Cinzel, Georgia, serif'; ctx.textAlign = 'center';
    const w = ctx.measureText(t).width + 28, x = W / 2 - w / 2, y = 24;
    ctx.fillStyle = 'rgba(250,246,236,.9)'; ctx.fillRect(x, y, w, 26); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 25);
    ctx.fillStyle = B.winner === side ? '#7f5100' : B.winner === 'draw' ? INK : '#9e2b1b'; ctx.fillText(t, W / 2, y + 18);
    ctx.restore();
  };
  // labels on hover: the field keeps the count, the canvas title names the unit under the pointer
  BF.hover = function (cv) {
    if (cv.__bfHovOn) return;
    cv.__bfHovOn = true;
    const near = e => {
      const r = cv.getBoundingClientRect(), sx = cv.width / (r.width || 1), sy = cv.height / (r.height || 1);
      const x = (e.clientX - r.left) * sx, y = (e.clientY - r.top) * sy;
      let best = null, bd = 30 * 30;
      for (const h of cv.__bfHov || []) { const d = (h.x - x) ** 2 + (h.y - y) ** 2; if (d < bd) { bd = d; best = h; } }
      return best;
    };
    cv.addEventListener('mousemove', e => { const h = near(e); const t = h ? h.t : ''; if (cv.title !== t) cv.title = t; });
  };
  const lab = UI.bfLabel;
  if (typeof lab === 'function') {
    UI.bfLabel = function (ctx, t, cx, ly, bottom) {
      if (!UI.bfGroundOn) return lab.apply(this, arguments);
      if (ctx.canvas) (ctx.canvas.__bfHov || (ctx.canvas.__bfHov = [])).push({ t: String(t), x: cx, y: ly });
      const short = String(t).replace(/^.* (?=[\d.]+k?$)/, '');
      return lab.call(this, ctx, short, cx, ly, bottom);
    };
  }
})();
