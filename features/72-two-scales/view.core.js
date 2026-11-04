// Two scales at once: the scene. An open book: on the left leaf the squad (the men beside you by name, how each of
// them is, what you see and hear), on the right leaf the front, pressed as a print in the inked map's hand (62): every
// division in the fight as a standard in its realm's colour with its house's charge, yours edged in gold, the line
// between the two sides bent by each division's order, yesterday's line dotted behind it with the ground won or lost
// hatched, the men of your section as small figures under your standard with a gap where one fell, and the general's
// plan (38) as a vermilion arrow. The choices sit under the book.
//
// Drawing reads only m.cur and the engine's snapshot (m.ts.front, m.ts.prev): no random draw, no change to A.S.
// Variation (the glyphs of the ground) is a hash of the province and the day. Every value goes through UI.esc.
(function () {
  const TS = A.TS;
  if (!TS) return;
  const INK = '#2b1d10', VEL = '#ece0c4', SHADE = '#d6c39b', VERM = '#9e2b1b', GOLD = '#b98a2a', VERD = '#4d7456';
  const esc = v => UI.esc(v == null ? '' : String(v));
  const hash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const rnd = (k, i) => (hash(k + '|' + i) % 10000) / 10000;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const f1 = n => Math.round(n * 10) / 10;
  const pct = x => Math.round((x || 0) * 100) + '%';
  const hex = c => { const m = /^#?([0-9a-f]{6})$/i.exec(String(c || '')); return m ? m[1] : '999999'; };
  const lum = c => { const h = hex(c); const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255); return 0.299 * r + 0.587 * g + 0.114 * b; };
  // a standard in its house's colours (the heraldry of 63-miniatures and the release's coats), else the realm's
  const houseOf = rid => { const r = A.realm(rid); return r && A.S.houses ? A.S.houses[r.house] || null : null; };
  const colourOf = rid => { const hs = houseOf(rid); if (hs && hs.colors && hs.colors[0]) return hs.colors[0]; const r = A.realm(rid); try { return r ? (MAP.realmColor ? MAP.realmColor(r) : r.color) : '#999999'; } catch (e) { return r ? r.color : '#999999'; } };
  const chargeOf = rid => { const r = A.realm(rid), hs = r && A.S.houses ? A.S.houses[r.house] : null; return hs && hs.charge && PORTRAIT && PORTRAIT.charges && PORTRAIT.charges[hs.charge] ? { d: PORTRAIT.charges[hs.charge], tint: hs.colors && hs.colors[1] } : null; };
  // the snapshot's own colour for a realm: only hex colours go into the picture
  const safeCol = c => '#' + hex(c);

  // ---- the print -----------------------------------------------------------------------------------------------------
  const W = 640, H = 292, YT = 84, YO = 238, YL = 142, BEND = 34;   // their poles' feet, ours, the line at rest
  const glyph = {
    plains: (x, y, s) => `<path d="M${f1(x - 7 * s)} ${f1(y)}h${f1(14 * s)}M${f1(x - 5 * s)} ${f1(y + 3 * s)}h${f1(10 * s)}"/>`,
    hills: (x, y, s) => `<path d="M${f1(x - 11 * s)} ${f1(y)}q${f1(11 * s)} ${f1(-12 * s)} ${f1(22 * s)} 0M${f1(x + 2 * s)} ${f1(y - 5 * s)}l${f1(4 * s)} ${f1(4 * s)}M${f1(x + 5 * s)} ${f1(y - 3 * s)}l${f1(3 * s)} ${f1(3 * s)}"/>`,
    mountains: (x, y, s) => `<path d="M${f1(x - 12 * s)} ${f1(y)}l${f1(12 * s)} ${f1(-17 * s)}l${f1(12 * s)} ${f1(17 * s)}M${f1(x)} ${f1(y - 17 * s)}l${f1(3 * s)} ${f1(9 * s)}M${f1(x + 3 * s)} ${f1(y - 8 * s)}l${f1(4 * s)} ${f1(8 * s)}"/>`,
    forest: (x, y, s) => `<path d="M${f1(x)} ${f1(y)}v${f1(-6 * s)}"/><circle cx="${f1(x)}" cy="${f1(y - 10 * s)}" r="${f1(5 * s)}"/>`,
    taiga: (x, y, s) => `<path d="M${f1(x)} ${f1(y)}v${f1(-4 * s)}M${f1(x - 5 * s)} ${f1(y - 4 * s)}l${f1(5 * s)} ${f1(-12 * s)}l${f1(5 * s)} ${f1(12 * s)}z"/>`,
    marsh: (x, y, s) => `<path d="M${f1(x - 6 * s)} ${f1(y)}h${f1(12 * s)}M${f1(x - 2 * s)} ${f1(y)}l${f1(-2 * s)} ${f1(-8 * s)}M${f1(x + 1 * s)} ${f1(y)}v${f1(-10 * s)}M${f1(x + 3 * s)} ${f1(y)}l${f1(2 * s)} ${f1(-7 * s)}"/>`,
    desert: (x, y, s) => `<path d="M${f1(x - 12 * s)} ${f1(y)}q${f1(7 * s)} ${f1(-7 * s)} ${f1(13 * s)} ${f1(-2 * s)}q${f1(5 * s)} ${f1(2 * s)} ${f1(11 * s)} ${f1(2 * s)}"/>`,
    steppe: (x, y, s) => `<path d="M${f1(x - 3 * s)} ${f1(y)}l${f1(-2 * s)} ${f1(-5 * s)}M${f1(x)} ${f1(y)}v${f1(-6 * s)}M${f1(x + 3 * s)} ${f1(y)}l${f1(2 * s)} ${f1(-5 * s)}"/>`,
  };
  glyph.tundra = glyph.steppe; glyph.jungle = glyph.forest; glyph.coast = glyph.plains; glyph.badlands = glyph.hills; glyph.farmland = glyph.plains;
  const flagPath = (cat, x, y, w, h) => {
    if (cat === 'horse') return `M${f1(x)} ${f1(y)}h${f1(w)}l${f1(-w * 0.22)} ${f1(h / 2)}l${f1(w * 0.22)} ${f1(h / 2)}h${f1(-w)}z`;
    if (cat === 'missile') return `M${f1(x)} ${f1(y)}L${f1(x + w)} ${f1(y + h * 0.42)}L${f1(x)} ${f1(y + h)}z`;
    if (cat === 'beast') return `M${f1(x)} ${f1(y)}h${f1(w * 0.92)}q${f1(w * 0.16)} ${f1(h / 6)} 0 ${f1(h / 3)}q${f1(w * 0.16)} ${f1(h / 6)} 0 ${f1(h / 3)}q${f1(w * 0.16)} ${f1(h / 6)} 0 ${f1(h / 3)}h${f1(-w * 0.92)}z`;
    return `M${f1(x)} ${f1(y)}q${f1(w / 2)} ${f1(-2)} ${f1(w)} 1v${f1(h)}q${f1(-w / 2)} -3 ${f1(-w)} -1z`;
  };
  // one standard: the pole on its shadow, the cloth (square for foot, swallowtail for horse, a pennon for bows), the
  // house's charge, a slip with the men, a bar for the order
  function standard(d, x, foot, K) {
    const fw = 34 * K, fh = 19 * K, top = foot - 50 * K, px = x - fw / 2, col = safeCol(colourOf(d.r));
    const ink = lum(col) > 0.5 ? INK : VEL, ch = chargeOf(d.r), gone = d.gone, breaking = !gone && d.o < 0.3;
    let s = `<g class="ts-std${d.me ? ' me' : ''}${gone ? ' gone' : ''}"${gone ? ' opacity=".38"' : ''}>`;
    s += `<ellipse cx="${f1(px + 2)}" cy="${f1(foot)}" rx="${f1(7 * K)}" ry="${f1(2 * K)}" fill="${INK}" opacity=".3"/>`;
    s += `<path d="M${f1(px)} ${f1(foot)}V${f1(top - 3 * K)}" stroke="${VEL}" stroke-width="${f1(3.4 * K)}"/><path d="M${f1(px)} ${f1(foot)}V${f1(top - 3 * K)}" stroke="${INK}" stroke-width="${f1(1.7 * K)}"/>`;
    s += `<path d="M${f1(px)} ${f1(top - 8 * K)}l${f1(2.4 * K)} ${f1(4 * K)}l${f1(-2.4 * K)} ${f1(2.4 * K)}l${f1(-2.4 * K)} ${f1(-2.4 * K)}z" fill="${GOLD}" stroke="${INK}" stroke-width=".9"/>`;
    s += `<path d="${flagPath(d.cat, px + 1, top, fw, fh)}" fill="${col}" stroke="${INK}" stroke-width="1.2"/>`;
    s += `<path d="M${f1(px + fw * 0.3)} ${f1(top)}l-1.5 ${f1(fh + 1)}M${f1(px + fw * 0.62)} ${f1(top)}l-1.5 ${f1(fh + 1)}" stroke="${INK}" stroke-width=".8" opacity=".28"/>`;
    if (ch) {
      const tint = ch.tint && Math.abs(lum(ch.tint) - lum(col)) >= 0.25 ? safeCol(ch.tint) : ink;
      s += `<path d="${esc(ch.d)}" transform="translate(${f1(px + 1 + fw * (d.cat === 'missile' ? 0.3 : 0.45))} ${f1(top + fh * 0.5)}) scale(${f1(fh * 0.042 * 10) / 10})" fill="${tint}" fill-rule="evenodd" stroke="${INK}" stroke-width="1"/>`;
    }
    // the slip and the order
    const qy = top + fh + 3 * K, qw = fw, qh = 11 * K, edge = d.me ? GOLD : d.ours ? INK : VERM;
    s += `<rect x="${f1(px + 3)}" y="${f1(qy)}" width="${f1(qw)}" height="${f1(qh)}" fill="${VEL}" stroke="${edge}" stroke-width="${d.me ? 2.4 : 1.2}"/>`;
    s += `<text x="${f1(px + 3 + qw / 2)}" y="${f1(qy + qh * 0.78)}" text-anchor="middle" font-size="${f1(9.5 * K)}" font-weight="700" fill="${INK}">${esc(d.men >= 1000 ? f1(d.men / 1000) + 'k' : d.men)}</text>`;
    s += `<rect x="${f1(px + 3)}" y="${f1(qy + qh + 1)}" width="${f1(qw)}" height="${f1(3.4 * K)}" fill="${INK}" opacity=".3"/><rect x="${f1(px + 3)}" y="${f1(qy + qh + 1)}" width="${f1(qw * clamp(d.o, 0, 1))}" height="${f1(3.4 * K)}" fill="${breaking ? VERM : VERD}"/>`;
    if (breaking) s += `<path d="M${f1(px + fw + 6)} ${f1(top + 2)}l7 -5M${f1(px + fw + 7)} ${f1(top + 9)}l8 0M${f1(px + fw + 6)} ${f1(top + 16)}l7 5" stroke="${VERM}" stroke-width="2"/>`;
    if (gone) s += `<path d="M${f1(px - 4)} ${f1(top - 4)}L${f1(px + fw + 6)} ${f1(foot)}" stroke="${VERM}" stroke-width="2.2"/>`;
    if (d.me) s += `<path d="M${f1(px + fw / 2 - 6)} ${f1(top - 20 * K)}h12l-6 8z" fill="${GOLD}" stroke="${INK}" stroke-width="1.2"/>`;
    return s + `<title>${esc((d.ours ? (d.me ? 'Yours: ' : 'Yours: ') : 'Theirs: ') + d.n + ', ' + A.fmt(d.men) + ' men, order ' + pct(d.o) + (gone ? ', gone from the field' : breaking ? ', giving way' : ''))}</title></g>`;
  }
  // a smooth line through points (Catmull-Rom as cubic Béziers)
  const smooth = pts => {
    let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
    }
    return d;
  };
  const slots = (n, x0, x1) => Array.from({ length: n }, (_, i) => x0 + (x1 - x0) * (i + 0.5) / n);
  // the line: where your side's division holds more order than theirs does, it bows toward them; a division gone from
  // the field leaves a hole the line falls back into
  const lineOf = fr => {
    const ours = fr.divs.filter(d => d.ours), theirs = fr.divs.filter(d => !d.ours && !d.gone);
    const tAvg = theirs.length ? theirs.reduce((a, d) => a + d.o, 0) / theirs.length : 0;
    const xs = slots(ours.length, 70, 590);
    const pts = [[22, YL]].concat(ours.map((d, i) => [xs[i], YL - BEND * clamp((d.gone ? -0.6 : d.o) - tAvg, -1, 1)])).concat([[618, YL]]);
    return { pts, xs, ours };
  };
  TS.strip = function (m, dayWord) {
    const fr = m.ts.front; if (!fr || !fr.divs) return '';
    const pv = m.ts.prev && m.ts.prev.divs && m.ts.prev.divs.length === fr.divs.length ? m.ts.prev : null;
    const key = m.ts.key + '|' + m.ts.pid, terr = glyph[fr.terr] ? fr.terr : 'plains';
    const L = lineOf(fr), P = pv ? lineOf(pv) : null, theirs = fr.divs.filter(d => !d.ours);
    const nMax = Math.max(L.ours.length, theirs.length), K = clamp(470 / (nMax * 46), 0.55, 1);
    let s = '';
    // the ground: vellum, a frame with cut corners, the land's own marks
    s += `<rect width="${W}" height="${H}" fill="${VEL}"/>`;
    s += `<g stroke="${INK}" stroke-width="1.1" fill="none" opacity=".42">`;
    for (let i = 0; i < 46; i++) {
      const x = 18 + rnd(key, 'gx' + i) * (W - 36), y = 22 + rnd(key, 'gy' + i) * (H - 40), sc = 0.7 + rnd(key, 'gs' + i) * 0.5;
      if (Math.abs(y - YL) < 16) continue;
      s += glyph[terr](x, y, sc);
    }
    s += '</g>';
    // their side of the field, ruled like a woodcut sky; ours open
    s += `<g stroke="${INK}" stroke-width=".6" opacity=".22">`;
    for (let y = 14; y < YT - 54; y += 6) s += `<path d="M14 ${y}H${W - 14}"/>`;
    s += '</g>';
    // the ground taken or given since yesterday, hatched between the two lines
    if (P) {
      const back = P.pts.slice().reverse();
      s += `<defs><pattern id="ts-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V5" stroke="${INK}" stroke-width="1"/></pattern></defs>`;
      s += `<path d="${smooth(L.pts)}L${back.map(p => f1(p[0]) + ' ' + f1(p[1])).join('L')}z" fill="url(#ts-hatch)" opacity=".45"/>`;
      s += `<path d="${smooth(P.pts)}" fill="none" stroke="${INK}" stroke-width="1.4" stroke-dasharray="2 5" opacity=".6"/>`;
    }
    // the line, with its teeth toward the enemy
    const ld = smooth(L.pts);
    s += `<path d="${ld}" fill="none" stroke="${VEL}" stroke-width="6"/><path d="${ld}" fill="none" stroke="${INK}" stroke-width="2.6"/>`;
    for (let i = 0; i < L.pts.length - 1; i++) {
      const [x0, y0] = L.pts[i], [x1, y1] = L.pts[i + 1], n = Math.max(1, Math.round((x1 - x0) / 16));
      for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; s += `<path d="M${f1(x - 3)} ${f1(y - 1)}l3 -6l3 6z" fill="${INK}"/>`; }
    }
    // the general's plan (38-orders): an arrow from behind your line toward what he means to take or hold
    const pl = fr.plan, tgt = pl && ((pl.at || [])[0] || pl.hold);
    if (tgt) {
      const cx = clamp((L.xs.length ? L.xs[Math.floor(L.xs.length / 2)] : W / 2) + (tgt.dx >= 0 ? -58 : 58), 40, W - 40);
      let ex, ey, lab;
      if (tgt.here) { ex = cx + 40; ey = 30; lab = 'the plan: here'; }
      else { const right = tgt.dx >= 0; ex = right ? W - 26 : 26; ey = clamp(YL + tgt.dy * 0.15, 40, H - 40); lab = 'the plan: ' + tgt.n; }
      const mx = (cx + ex) / 2, my = Math.min(H - 20, Math.max(ey, YO) + 26);
      s += `<path d="M${f1(cx)} ${H - 12}Q${f1(mx)} ${f1(my)} ${f1(ex)} ${f1(ey)}" fill="none" stroke="${VERM}" stroke-width="2.4" stroke-dasharray="9 5"/>`;
      const ang = Math.atan2(ey - my, ex - mx), ax = ex, ay = ey;
      s += `<path d="M${f1(ax)} ${f1(ay)}L${f1(ax - 11 * Math.cos(ang - 0.45))} ${f1(ay - 11 * Math.sin(ang - 0.45))}L${f1(ax - 11 * Math.cos(ang + 0.45))} ${f1(ay - 11 * Math.sin(ang + 0.45))}z" fill="${VERM}"/>`;
      const tx = clamp(ex + (ex > W / 2 ? -8 : 8), 60, W - 60);
      s += `<text x="${f1(tx)}" y="${f1(ey + (tgt.here ? -6 : 22))}" text-anchor="${ex > W / 2 ? 'end' : 'start'}" font-size="15" font-style="italic" fill="${VERM}" stroke="${VEL}" stroke-width="4" paint-order="stroke">${esc(lab)}</text>`;
    }
    // the standards: theirs above the line, yours below
    const tx = slots(theirs.length, 170, 600);
    theirs.forEach((d, i) => { s += standard(d, tx[i], YT, K); });
    L.ours.forEach((d, i) => { s += standard(d, L.xs[i], YO, K); });
    // your section under your standard: you and the men beside you, with a gap where one fell
    const mi = L.ours.findIndex(d => d.me);
    if (mi >= 0) {
      const x0 = L.xs[mi] - 26, y = YO + 30, men = [{ you: 1 }].concat((m.ts.men || []).map(id => ({ id, st: m.ts.state[id] || 'ok', p: A.P(id) })));
      men.forEach((u, i) => {
        const x = x0 + i * 15;
        if (u.st === 'dead') {
          s += `<g><path d="M${f1(x - 4)} ${f1(y - 4)}l8 8M${f1(x + 4)} ${f1(y - 4)}l-8 8" stroke="${VERM}" stroke-width="2.2"/><title>${esc((u.p ? u.p.given : 'A man') + ' fell here')}</title></g>`;
          return;
        }
        const tilt = u.st === 'hurt' || u.st === 'back' ? 4 : 0, op = u.st === 'back' ? ' opacity=".4"' : '';
        s += `<g${op}><circle cx="${f1(x + tilt)}" cy="${f1(y - 9)}" r="2.6" fill="${u.you ? GOLD : INK}" stroke="${INK}"/><path d="M${f1(x + tilt)} ${f1(y - 6)}L${f1(x)} ${f1(y + 4)}M${f1(x)} ${f1(y + 4)}l-3 6M${f1(x)} ${f1(y + 4)}l3 6M${f1(x + 4)} ${f1(y + 12)}L${f1(x + 7)} ${f1(y - 18)}" stroke="${INK}" stroke-width="1.6" fill="none"/>` +
          `<title>${esc(u.you ? 'You' : (u.p ? u.p.given : '') + (u.st === 'hurt' ? ', hurt' : u.st === 'back' ? ', carried back' : ''))}</title></g>`;
      });
      const fell = (m.ts.fell || []).filter(f => (m.ts.men || []).includes(f.id));
      if (fell.length) s += `<text x="${f1(x0 + men.length * 15 + 4)}" y="${f1(y + 4)}" font-size="14" font-style="italic" fill="${VERM}" stroke="${VEL}" stroke-width="4" paint-order="stroke">${esc('the gap where ' + fell[fell.length - 1].n + ' stood')}</text>`;
    }
    // the cartouche
    const title = String(m.place || '').toUpperCase(), sub = dayWord || ('the ' + TS.dayWord(fr.day || 1) + ' day');
    s += `<g><rect x="16" y="14" width="${f1(Math.max(110, title.length * 11 + 24))}" height="40" fill="${VEL}" stroke="${INK}" stroke-width="1.6"/><rect x="19" y="17" width="${f1(Math.max(110, title.length * 11 + 24) - 6)}" height="34" fill="none" stroke="${INK}" stroke-width=".7"/>` +
      `<text x="28" y="34" font-family="Cinzel, Georgia, serif" font-size="15" font-weight="700" fill="${INK}" letter-spacing="1">${esc(title)}</text><text x="28" y="47" font-size="11.5" font-style="italic" fill="${INK}">${esc(sub)}</text></g>`;
    // the frame, with cut corners
    s += `<rect x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" fill="none" stroke="${INK}" stroke-width="3"/><rect x="7" y="7" width="${W - 14}" height="${H - 14}" fill="none" stroke="${INK}" stroke-width="1"/>`;
    for (const [x, y] of [[3, 3], [W - 9, 3], [3, H - 9], [W - 9, H - 9]]) s += `<rect x="${x}" y="${y}" width="6" height="6" fill="${INK}"/>`;
    const label = TS.frontWords(m).join(' ');
    return `<svg class="ts-strip" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc('The front at ' + m.place + '. ' + label)}" font-family="Alegreya, Georgia, serif">${s}</svg>`;
  };

  // the front in words, from the same snapshot (the strip's label and the legend under it)
  TS.frontWords = function (m) {
    const fr = m.ts.front, pv = m.ts.prev, out = [];
    if (!fr) return out;
    const ours = fr.divs.filter(d => d.ours), mi = ours.findIndex(d => d.me), me = ours[mi];
    const nb = (i, side) => { const d = ours[i]; return d ? `on your ${side} the ${d.n} (${d.gone ? 'gone from the field' : 'order ' + pct(d.o) + (d.o < 0.3 ? ', giving way' : '')})` : null; };
    out.push(`Your side holds ${pct(fr.share)} of the order on the field${pv && pv.share != null && Math.abs(pv.share - fr.share) >= 0.01 ? `, ${fr.share > pv.share ? 'up' : 'down'} from ${pct(pv.share)}` : ''}.`);
    if (me) out.push(`${m.ts.levy ? 'The levy stands with' : 'Yours is'} the ${me.n}: ${A.fmt(me.men)} men, order ${pct(me.o)}${me.gone ? ', gone from the field' : ''}.`);
    const sides = [nb(mi - 1, 'left'), nb(mi + 1, 'right')].filter(Boolean);
    if (sides.length) out.push(sides.join('; ').replace(/^o/, 'O') + '.');
    const th = fr.divs.filter(d => !d.ours && !d.gone), broke = fr.divs.filter(d => !d.ours && d.o < 0.3 && !d.gone);
    if (broke.length) out.push(`Their ${broke[0].n} is giving way.`);
    else if (th.length) out.push(`Facing you, ${th.length} of theirs, order ${pct(th.reduce((a, d) => a + d.o, 0) / th.length)} on average.`);
    if (fr.plan && fr.plan.text) out.push(`Your general${fr.plan.gen ? ', ' + fr.plan.gen : ''}${fr.plan.temper ? ' (' + fr.plan.temper.toLowerCase() + ')' : ''}, ${fr.plan.text}.`);
    out.push(`Dead so far: ${A.fmt(fr.dead[0])} of yours, ${A.fmt(fr.dead[1])} of theirs.`);
    return out;
  };

  // ---- the squad -------------------------------------------------------------------------------------------------------
  const STATE = { ok: 'beside you', hurt: 'hurt, and still in the line', back: 'carried back to the surgeons', dead: 'fell' };
  TS.squadHtml = function (m) {
    const ids = m.ts.men || [];
    if (!ids.length) return '<p class="ts-none">You stand among strangers.</p>';
    return '<ul class="ts-men">' + ids.map(id => {
      const p = A.P(id); if (!p) return '';
      const st = m.ts.state[id] || (p.alive ? 'ok' : 'dead'), f = (m.ts.fell || []).find(x => x.id === id);
      const how = st === 'dead' ? `fell on the ${TS.dayWord(f ? f.day : m.ts.day)} day${f && f.how ? ': ' + f.how : ''}` : STATE[st] || STATE.ok;
      const rec = A.SQUAD && A.SQUAD.standing ? A.SQUAD.standing(p) : null;
      let face = '';
      try { face = PORTRAIT.svg(p, 40); } catch (e) { face = ''; }
      return `<li class="ts-man ${esc(st)}"><span class="ts-face" aria-hidden="true">${face}</span><span class="ts-who"><b>${esc(p.given)}</b>${rec ? ` <i>${esc(rec)}</i>` : ''}<span class="ts-st">${esc(how)}</span>${p.quirk ? `<span class="ts-q">${esc(A.cap(A.he(p)) + ' ' + p.quirk)}</span>` : ''}</span></li>`;
    }).join('') + '</ul>';
  };

  // ---- the scene ----------------------------------------------------------------------------------------------------------
  const CSS = `
.ts .ts-book{display:flex;flex-wrap:wrap;background:${VEL};color:${INK};border:3px solid ${INK};box-shadow:inset 0 0 0 4px ${VEL},inset 0 0 0 5px ${INK};padding:6px;margin:8px 0 10px;border-radius:2px}
.ts .ts-leaf{flex:1 1 280px;min-width:0;padding:10px 14px}
.ts .ts-leaf.ts-squad{flex:1 1 260px;border-right:3px double rgba(43,29,16,.55)}
.ts .ts-leaf.ts-front{flex:1.6 1 340px}
.ts .ts-rub,.ts .ts-leaf h3.ts-rub{font-family:Cinzel,Georgia,serif;font-weight:700;color:${VERM};letter-spacing:.06em;font-size:.95rem;margin:0 0 6px}
.ts .ts-sub,.ts .ts-leaf h3.ts-sub{font-family:Cinzel,Georgia,serif;color:#6b4410;font-size:.85rem;letter-spacing:.04em;margin:10px 0 4px}
.ts .ts-see{font-family:Alegreya,Georgia,serif;font-size:1.02rem;line-height:1.45;margin:0;color:${INK}}
.ts .ts-see::first-letter{float:left;font-family:'Cinzel Decorative',Cinzel,serif;font-size:2.7em;line-height:.9;margin:.05em .1em 0 0;color:#8e2414;text-shadow:1px 1px 0 ${GOLD}}
.ts .ts-men{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.ts .ts-man{display:flex;gap:8px;align-items:flex-start}
.ts .ts-face{flex:0 0 40px;width:40px;height:40px;border:1px solid ${INK};background:${SHADE};overflow:hidden;display:block}
.ts .ts-face svg{width:40px;height:40px;display:block}
.ts .ts-who{display:flex;flex-direction:column;line-height:1.25;min-width:0}
.ts .ts-who b{font-family:Cinzel,Georgia,serif;font-size:.95rem}
.ts .ts-who i{font-size:.8rem;color:#6b4410}
.ts .ts-st{font-size:.88rem}
.ts .ts-q{font-size:.8rem;font-style:italic;color:#5b4630}
.ts .ts-man.dead b{color:${VERM}}
.ts .ts-man.dead b::before{content:"\\271D  ";}
.ts .ts-man.dead .ts-face{filter:grayscale(1);opacity:.55}
.ts .ts-man.back .ts-face{opacity:.6}
.ts .ts-yest{margin:8px 0 0;padding:6px 0 0;border-top:1px solid rgba(43,29,16,.35);font-size:.9rem}
.ts .ts-yest p{margin:0 0 3px}
.ts .ts-yest .ch{font-style:italic;color:#6b4410}
.ts .ts-strip{display:block;width:100%;height:auto;aspect-ratio:${W}/${H};background:${VEL}}
.ts .ts-legend{font-size:.9rem;line-height:1.4;margin:8px 0 0;color:${INK}}
.ts .choices .ts-hint{display:block;font-size:.82em;opacity:.85;font-weight:normal;margin-top:2px}
.ts .ts-end{font-size:.95rem;margin:8px 0 0}
@media (prefers-reduced-motion:no-preference){.ts .ts-strip{animation:tsInk .7s ease-out both}}
@keyframes tsInk{from{opacity:.25;filter:blur(1.5px)}to{opacity:1;filter:none}}
@media (max-width:760px){
  .ts .ts-book{flex-direction:column;padding:4px}
  .ts .ts-leaf{padding:8px 8px;flex:1 1 auto}
  .ts .ts-leaf.ts-front{order:-1}
  .ts .ts-leaf.ts-squad{border-right:0;border-top:3px double rgba(43,29,16,.55)}
  .ts .ts-who i,.ts .ts-q,.ts .ts-st,.ts .ts-legend,.ts .ts-yest,.ts .choices .ts-hint,.ts .ts-rub,.ts .ts-sub,.ts .ts-leaf h3.ts-rub,.ts .ts-leaf h3.ts-sub{font-size:14px}
}`;
  TS.style = function () {
    if (typeof document === 'undefined' || document.getElementById('ts-css')) return;
    const st = document.createElement('style'); st.id = 'ts-css'; st.textContent = CSS; document.head.appendChild(st);
  };
  TS.modal = function (m) {
    TS.style();
    const pc = A.pc(), fr = m.ts.front || {};
    const cur = m.over ? null : m.cur || (m.ts.parked ? null : TS.view(m));
    const e = m.ts.end || {};
    const day = m.over && !e.out ? 'after the fight' : `the ${TS.dayWord((fr.day || 1) + (m.over || m.stages[m.stage] === 'ts_break' ? 0 : 1))} day`;
    let h = `<div class="panel mbox wide ts"><h2>${esc(m.title)} <span class="muted">· ${esc(day)}</span></h2>`;
    h += `<div class="stages">${m.stages.map((s, i) => `<i class="${i < m.stage ? 'done' : i === m.stage && !m.over ? 'now' : ''}"></i>`).join('')}</div>`;
    const last = m.log.slice(-2).filter(Boolean);
    h += `<div class="ts-book" role="group" aria-label="The battle at two scales">`;
    h += `<section class="ts-leaf ts-squad" aria-label="The squad"><h3 class="ts-rub">${m.ts.levy ? 'Your neighbours in the levy' : 'Your section'}</h3>${TS.squadHtml(m)}`;
    if (cur) h += `<h3 class="ts-sub">What you see and hear</h3><p class="ts-see">${esc(cur.text)}</p>`;
    if (last.length && !m.over) h += `<div class="ts-yest">${last.map(l => `<p class="${l.startsWith('»') ? 'ch' : ''}">${esc(l)}</p>`).join('')}</div>`;
    if (m.over) h += `<div class="ts-yest">${m.log.map(l => `<p class="${l.startsWith('»') ? 'ch' : ''}">${esc(l)}</p>`).join('')}</div>`;
    h += `</section><section class="ts-leaf ts-front" aria-label="The front"><h3 class="ts-rub">The front</h3>${TS.strip(m, day)}<p class="ts-legend">${esc(TS.frontWords(m).join(' '))}</p></section></div>`;
    if (m.over || !cur) {
      h += m.over ? `<p class="ts-end">${e.out ? 'The captains\' account and the chronicler\'s will come when the fight is over.' : 'The captains\' account and the chronicler\'s follow.'}</p><button class="primary" data-a="mClose">Continue</button>`
        : `<button class="primary" data-a="mClose">Hold on through the day</button>`;
      return h + '</div>';
    }
    const odds = UI.set.odds !== false;
    h += `<div class="choices">${cur.choices.map((c, i) => {
      const sub = [c.hint, c.drillW ? `Your division: ${c.drillW} (${Math.round(c.drillV * 100)})` : '', c.measure || ''].filter(Boolean).join(' · ');
      const chk = (c.check || []).map(k => GD.STAT_SHORT[k] || GD.SKILLS[k] || k).join(' + ');
      return `<button data-a="mChoose" data-v="${i}"><span class="grow">${esc(c.t)}${sub ? `<small class="ts-hint">${esc(sub)}</small>` : ''}</span><span class="risk ${c.odds >= 70 ? 'likely' : c.odds < 35 ? 'long' : c.odds < 50 ? 'risky' : ''}">${odds ? esc(c.odds + '% · ') : ''}${esc(chk)}</span></button>`;
    }).join('')}</div><div class="row" style="margin-top:8px"><span class="right"></span><button class="small" data-a="mAuto">Let your sergeant decide (auto)</button></div>`;
    return h + '</div>';
  };
  const modal = UI.missionModal;
  UI.missionModal = function (m) {
    if (TS.on(m)) { try { return TS.modal(m); } catch (e) { console.error('two scales view', e); } }
    return modal.apply(this, arguments);
  };

  // the actions: a choice, the sergeant's choice and "go on" run the clock through the day the fight resolves
  const act = (fn) => function (v) {
    const q = A.S.queue[0], ts = q && q.type === 'mission' && TS.on(q.m);
    if (!ts) return fn.apply(this, arguments);
    if (fn === base.mChoose) A.missionChoose(+v);
    else if (fn === base.mAuto) { const m = q.m; if (m.cur && !m.over) A.missionChoose(m.cur.choices.reduce((bi, c, i, arr) => (c.odds > arr[bi].odds ? i : bi), 0)); }
    else A.missionClose();
    if (A.S.tsq) TS.run();
    UI.refresh();
  };
  const base = { mChoose: UI.A.mChoose, mAuto: UI.A.mAuto, mClose: UI.A.mClose };
  Object.assign(UI.A, { mChoose: act(base.mChoose), mAuto: act(base.mAuto), mClose: act(base.mClose) });
})();
