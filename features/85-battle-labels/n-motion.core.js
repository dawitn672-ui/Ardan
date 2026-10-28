// The battle field in motion (cycle 2, lane G; brief §5.10 and §6, lane R's backtests §3 "Battle motion"). Over the
// woodblock field (m-field.core.js) each draw lays an SVG in the canvas's own coordinates:
//   - intent arrows: for each wing of each side, where it means to go next (advance, charge, hold, withdraw), from the
//     unit's own order when the engine gives one (u.next, lane WD) and else from what the field already shows (a unit
//     with a tactic advances, a routing one runs, the rest hold); drawn in with the ink stroke on a new pulse;
//   - clash flashes where two wings meet, sized by the men who fell there since the last pulse;
//   - smoke and dust from the clash and behind horse;
//   - a standard at the rear of each wing that sways while the pulse plays out (three beats, then still: no loop while
//     you read);
//   - a camera that frames the decisive wing (where most men fell, or a side broke): the canvas is redrawn from its
//     own picture, eased in to 1.16x on that wing, held, and eased back to the whole field.
// Drawing only. It reads the battle (units, wings, men, morale, status, the pulse) and never writes it; what it
// compares with (the men of each unit at the last pulse) lives in a WeakMap keyed by the battle, never in A.S; no
// random number is drawn (the puffs hash the battle and the pulse). Under reduced motion the arrows and flashes stand
// still and the camera stays on the whole field; under Motion off nothing animates.
(function () {
  if (typeof document === 'undefined' || typeof UI.drawBattle !== 'function') return;
  const BM = UI.BMOTION = {};
  const hash = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const f1 = n => String(Math.round(n * 10) / 10);
  const esc = s => UI.esc(String(s == null ? '' : s));
  const mode = () => (UI.MOTION && UI.MOTION.mode ? UI.MOTION.mode() : 'full');
  const MIRROR = { L: 'R', R: 'L', C: 'C', X: 'X' };
  const COLS = ['L', 'C', 'R'];

  // ---- reading the field --------------------------------------------------------------------------------------------
  BM.mem = new WeakMap();
  // the intent of a unit: the engine's own order when it has one, else what the field shows
  BM.intent = function (u) {
    const n = u && typeof u.next === 'string' ? u.next : null;
    if (n && ['advance', 'charge', 'hold', 'withdraw'].includes(n)) return n;
    if (u.status === 'rout') return 'withdraw';
    let adv = !!u.tac;
    try { if (adv && A.tfx && A.tfx(u, 'noAdvance', false)) adv = false; } catch (e) {}
    if (!adv) return 'hold';
    const cat = A.catOf ? A.catOf(u.code) : (GD.TROOPS[u.code] || {}).mount ? 'horse' : 'foot';
    return cat === 'horse' ? 'charge' : 'advance';
  };
  // each column of the field (our wing and the enemy wing facing it): men, men lost since the last pulse, routs, intent
  BM.read = function (B) {
    const side = B.pcSide || 'A', foe = side === 'A' ? 'B' : 'A';
    const prev = BM.mem.get(B), men = {};
    const out = {};
    for (const c of COLS) out[c] = { c, us: { men: 0, lost: 0, rout: 0, n: 0, intent: {} }, them: { men: 0, lost: 0, rout: 0, n: 0, intent: {} } };
    for (const [k, who] of [[side, 'us'], [foe, 'them']]) {
      const s = B.sides && B.sides[k]; if (!s) continue;
      (s.units || []).forEach((u, i) => {
        const id = k + ':' + i, m = +u.men || 0;
        men[id] = m;
        if (u.status === 'gone' || u.wing === 'X') return;
        const col = who === 'us' ? u.wing : MIRROR[u.wing];
        const o = out[col] && out[col][who]; if (!o) return;
        o.men += m; o.n++;
        if (prev && prev.men[id] != null && prev.pulse !== (B.pulse || 0)) o.lost += Math.max(0, prev.men[id] - m);
        if (u.status === 'rout') o.rout++;
        const it = BM.intent(u); o.intent[it] = (o.intent[it] || 0) + m;
      });
    }
    // a pulse is fresh when it is new, and stays fresh while its beat plays (the modal may be drawn twice in a row)
    const pulse = B.pulse || 0, now = typeof performance !== 'undefined' ? performance.now() : 0;
    let fresh = !!prev && B.phase !== 'deploy' && (prev.pulse !== pulse || now < (prev.until || 0));
    if (!prev || prev.pulse !== pulse) BM.mem.set(B, { pulse, men, until: prev ? now + 400 : 0, lostBy: null });
    const memo = BM.mem.get(B);
    // the decisive wing: where most fell, or where a side broke
    if (memo) { if (fresh && !memo.lostBy) memo.lostBy = Object.fromEntries(COLS.map(c => [c, [out[c].us.lost, out[c].them.lost]])); else if (memo.lostBy && fresh) for (const c of COLS) { out[c].us.lost = memo.lostBy[c][0]; out[c].them.lost = memo.lostBy[c][1]; } }
    let best = null, bv = 0;
    for (const c of COLS) { const o = out[c], v = o.us.lost + o.them.lost + (o.us.rout + o.them.rout) * 400; if (v > bv) { bv = v; best = c; } }
    return { cols: out, fresh, decisive: bv > 0 ? best : null, side, foe };
  };

  // ---- the overlay ----------------------------------------------------------------------------------------------------
  const INK = '#1b1730', OURS = '#2a6ab0', THEIRS = '#c23c27';
  const top = o => Object.entries(o.intent).sort((a, b) => b[1] - a[1])[0];
  BM.arrow = function (x, y, dir, len, col, kind, key) {
    // dir: -1 up the field (toward the top), +1 down; a withdraw points the other way
    const w = kind === 'charge' ? 6 : 4.5, l = kind === 'charge' ? len * 1.3 : len, y1 = y + dir * l, bend = (hash(key) % 2 ? 1 : -1) * 10;
    const d = `M${f1(x)} ${f1(y)}Q${f1(x + bend)} ${f1((y + y1) / 2)} ${f1(x)} ${f1(y1)}`;
    const hw = w * 1.9, hd = `M${f1(x - hw)} ${f1(y1 - dir * hw * .9)}L${f1(x)} ${f1(y1 + dir * hw * .9)}L${f1(x + hw)} ${f1(y1 - dir * hw * .9)}Z`;
    return `<g class="bm-arrow bm-${kind}"><path class="bm-ink" d="${d}" stroke="${INK}" stroke-width="${w + 3}"/><path class="bm-stroke" d="${d}" stroke="${col}" stroke-width="${w}"/><path class="bm-head" d="${hd}" fill="${col}" stroke="${INK}" stroke-width="1.6"/></g>`;
  };
  BM.shield = (x, y, col) => `<g class="bm-arrow bm-hold"><path d="M${f1(x - 8)} ${f1(y - 9)}H${f1(x + 8)}V${f1(y - 1)}Q${f1(x + 8)} ${f1(y + 7)} ${f1(x)} ${f1(y + 11)}Q${f1(x - 8)} ${f1(y + 7)} ${f1(x - 8)} ${f1(y - 1)}Z" fill="${col}" stroke="${INK}" stroke-width="1.8"/></g>`;
  BM.burst = function (x, y, size, seed) {
    const r = rng(hash(seed)), n = 11;
    let d = '';
    for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2 + r() * .15, rr = (i % 2 ? .38 : 1) * size * (.75 + r() * .4); d += `${i ? 'L' : 'M'}${f1(x + Math.cos(a) * rr * 1.5)} ${f1(y + Math.sin(a) * rr)}`; }
    return `<g class="bm-clash"><path d="${d}Z" fill="#fff3c4" stroke="#ffcf7a" stroke-width="2"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(size * .32)}" fill="#fff"/></g>`;
  };
  BM.puffs = function (x, y, n, seed, cls) {
    const r = rng(hash(seed));
    let s = '';
    for (let i = 0; i < n; i++) {
      const px = x + (r() - .5) * 80, py = y + (r() - .5) * 30, rr = 5 + r() * 9;
      s += `<circle class="${cls}" cx="${f1(px)}" cy="${f1(py)}" r="${f1(rr)}" style="--bm-i:${i};--bm-dx:${f1((r() - .5) * 30)}px"/>`;
    }
    return s;
  };
  BM.standard = function (x, y, col, bottom, k) {
    const dir = bottom ? -1 : 1, h = 34, fw = 22;
    return `<g class="bm-std" style="transform-origin:${f1(x)}px ${f1(y - h)}px;--bm-i:${k}"><path d="M${f1(x)} ${f1(y)}V${f1(y - h)}" stroke="${INK}" stroke-width="2.4"/>` +
      `<path class="bm-flag" d="M${f1(x)} ${f1(y - h)}q${f1(dir * fw * .5)} -3 ${f1(dir * fw)} 1l${-dir * 4} 7l${dir * 4} 7q${f1(-dir * fw * .5)} -4 ${f1(-dir * fw)} -1Z" fill="${col}" stroke="${INK}" stroke-width="1.6"/></g>`;
  };
  BM.svg = function (B, W, H, R) {
    const mid = H / 2, X = { L: W * .2, C: W * .5, R: W * .8 }, fresh = R.fresh, live = B.phase !== 'end';
    const cU = (B.sides[R.side] && /^#[0-9a-f]{6}$/i.test(B.sides[R.side].color || '') ? B.sides[R.side].color : '#e8b04a');
    const cT = (B.sides[R.foe] && /^#[0-9a-f]{6}$/i.test(B.sides[R.foe].color || '') ? B.sides[R.foe].color : '#8a8f9e');
    let s = '';
    for (const c of COLS) {
      const o = R.cols[c], x = X[c], key = (B.id || B.title || '') + '|' + (B.pulse || 0) + '|' + c;
      // the standards at the rear of each wing
      if (o.them.n) s += BM.standard(x + 46, mid - 88, cT, false, 0);
      if (o.us.n) s += BM.standard(x - 46, mid + 104, cU, true, 1);
      // the clash: both sides in the wing and blood shed this pulse (or the lines touching once the battle is under way)
      const contact = o.us.n && o.them.n && B.phase !== 'deploy';
      if (contact) {
        const lost = o.us.lost + o.them.lost, size = Math.max(10, Math.min(34, 8 + Math.sqrt(lost) * .9));
        if (lost > 0 || (B.pulse || 0) >= 1) s += BM.burst(x, mid, fresh ? size : size * .6, key);
        if (fresh && lost > 0) s += BM.puffs(x, mid - 6, 6, key + 'smoke', 'bm-smoke');
      }
      // dust behind horse on the move
      if (fresh) for (const [who, y] of [['us', mid + 60], ['them', mid - 60]]) { const t = top(o[who]); if (t && t[0] === 'charge') s += BM.puffs(x, y, 4, key + who, 'bm-dust'); }
      // intent: what each side's wing means to do next
      if (live) {
        for (const [who, y0, dir, col] of [['them', mid - 40, 1, THEIRS], ['us', mid + 40, -1, OURS]]) {
          const t = top(o[who]); if (!t) continue;
          const it = t[0], ax = x + (who === 'us' ? 26 : -26);
          if (it === 'hold') s += BM.shield(ax, y0 + dir * -6, col);
          else s += BM.arrow(ax, y0 - dir * 4, it === 'withdraw' ? -dir : dir, 26, col, it, key + who);
        }
      }
    }
    const lbl = R.decisive ? `The ${R.decisive === 'C' ? 'centre' : R.decisive === 'L' ? 'left wing' : 'right wing'} decides it` : '';
    return `<svg class="bm-svg${fresh ? ' bm-fresh' : ''}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false"><g class="bm-cam">${s}</g></svg>` +
      (lbl && fresh ? `<span class="bm-cap">${esc(lbl)}</span>` : '');
  };

  // ---- the camera -------------------------------------------------------------------------------------------------------
  BM.cams = new WeakMap();
  BM.camera = function (cv, B, R, ov) {
    const old = BM.cams.get(cv); if (old) { old.stop = true; BM.cams.delete(cv); }
    if (!R.fresh || !R.decisive || mode() !== 'full' || typeof requestAnimationFrame !== 'function') return;
    const W = cv.width, H = cv.height, off = document.createElement('canvas'); off.width = W; off.height = H;
    off.getContext('2d').drawImage(cv, 0, 0);
    const ctx = cv.getContext('2d'), cx1 = { L: W * .2, C: W * .5, R: W * .8 }[R.decisive], Z = 1.16;
    const st = { stop: false }; BM.cams.set(cv, st);
    const ease = UI.MOTION && UI.MOTION.ease ? UI.MOTION.ease.std : (t => t);
    const g = ov && ov.querySelector('.bm-cam');
    const T0 = 320, T1 = 1500, T2 = 420;
    let t0 = null;
    const frame = now => {
      if (st.stop || !cv.isConnected) return;
      if (t0 == null) t0 = now;
      const t = now - t0, k = t < T0 ? ease(t / T0) : t < T0 + T1 ? 1 : t < T0 + T1 + T2 ? 1 - ease((t - T0 - T1) / T2) : 0;
      const z = 1 + (Z - 1) * k, sw = W / z, sh = H / z;
      const sx = Math.max(0, Math.min(W - sw, (W / 2 + (cx1 - W / 2) * k) - sw / 2)), sy = Math.max(0, Math.min(H - sh, H / 2 - sh / 2));
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(off, sx, sy, sw, sh, 0, 0, W, H); ctx.restore();
      if (g) g.setAttribute('transform', k ? `scale(${z.toFixed(4)}) translate(${(-sx).toFixed(1)} ${(-sy).toFixed(1)})` : '');
      if (t < T0 + T1 + T2) requestAnimationFrame(frame); else { BM.cams.delete(cv); if (g) g.removeAttribute('transform'); }
    };
    requestAnimationFrame(frame);
  };

  // ---- after each draw of the field --------------------------------------------------------------------------------------
  BM.after = function (cv, B) {
    if (!cv || !B || !B.sides || !cv.parentElement) return;
    const R = BM.read(B);
    // on a phone 71-phone moves the canvas into a frame that pans once the draw is done: the overlay follows it there
    const phone = !!document.querySelector('#game.phone') || (window.matchMedia && window.matchMedia('(max-width: 760px)').matches);
    if (phone && typeof requestAnimationFrame === 'function') { requestAnimationFrame(() => { if (cv.isConnected) BM.place(cv, B, R); }); return; }
    BM.place(cv, B, R);
  };
  BM.place = function (cv, B, R) {
    const par = cv.parentElement;
    try { if (getComputedStyle(par).position === 'static') par.style.position = 'relative'; } catch (e) {}
    let ov = par.querySelector(':scope > .bm-ov');
    if (!ov) { ov = document.createElement('div'); ov.className = 'bm-ov'; ov.setAttribute('aria-hidden', 'true'); cv.after(ov); }
    ov.style.left = cv.offsetLeft + 'px'; ov.style.top = cv.offsetTop + 'px'; ov.style.width = cv.offsetWidth + 'px'; ov.style.height = cv.offsetHeight + 'px';
    ov.innerHTML = BM.svg(B, cv.width, cv.height, R);
    BM.last = { fresh: R.fresh, decisive: R.decisive, cols: R.cols };
    BM.camera(cv, B, R, ov);
  };
  const draw = UI.drawBattle;
  UI.drawBattle = function (cv, B) {
    const r = draw.apply(this, arguments);
    try { BM.after(cv, B); } catch (e) { console.error('battle motion', e); }
    return r;
  };

  // ---- the look ---------------------------------------------------------------------------------------------------------
  const ON = [':root:not([data-motion])', ':root[data-motion=full]'];
  const full = css => `@media (prefers-reduced-motion:no-preference){${css.replace(/@@/g, ON[0])}}\n${css.replace(/@@/g, ON[1])}`;
  BM.CSS = `
.bm-ov{position:absolute;pointer-events:none;overflow:hidden;z-index:1}
.bm-ov .bm-svg{position:absolute;inset:0;width:100%;height:100%;display:block;overflow:visible}
.bm-ov .bm-arrow .bm-ink, .bm-ov .bm-arrow .bm-stroke{fill:none;stroke-linecap:round}
.bm-ov .bm-arrow{opacity:.88}
.bm-ov .bm-clash{mix-blend-mode:screen;opacity:.85}
.bm-ov .bm-smoke{fill:#e9e2d4;opacity:0;filter:blur(3px)}
.bm-ov .bm-dust{fill:#c9b48a;opacity:0;filter:blur(2px)}
.bm-ov .bm-cap{position:absolute;left:50%;top:22px;transform:translateX(-50%) skewX(-8deg);padding:2px 12px;background:#1b1730;color:#ffe7b0;font:700 calc(13px * var(--tx,1))/1.6 var(--f-ui,sans-serif);letter-spacing:.06em;text-transform:uppercase;border-bottom:2px solid #e8b04a;opacity:0}
@keyframes bmDraw{from{stroke-dashoffset:120}to{stroke-dashoffset:0}}
@keyframes bmHead{0%,55%{opacity:0;transform:scale(.4)}100%{opacity:1;transform:none}}
@keyframes bmClash{0%{opacity:0;transform:scale(.2)}18%{opacity:1;transform:scale(1.25)}100%{opacity:.75;transform:scale(1)}}
@keyframes bmSmoke{0%{opacity:0;transform:none}20%{opacity:.55}100%{opacity:0;transform:translate(var(--bm-dx,0),-34px) scale(2.2)}}
@keyframes bmSway{0%,100%{transform:skewY(0)}25%{transform:skewY(-6deg)}75%{transform:skewY(5deg)}}
@keyframes bmCap{0%{opacity:0;transform:translateX(-50%) skewX(-8deg) translateY(-8px)}15%,80%{opacity:1;transform:translateX(-50%) skewX(-8deg)}100%{opacity:0}}
.bm-ov .bm-cap{animation:bmCap 2200ms ease-out both}
${full(`
@@ .bm-ov .bm-fresh .bm-arrow .bm-stroke, @@ .bm-ov .bm-fresh .bm-arrow .bm-ink{stroke-dasharray:120;animation:bmDraw 700ms ease-out both!important}
@@ .bm-ov .bm-fresh .bm-arrow .bm-head{transform-box:fill-box;transform-origin:50% 50%;animation:bmHead 700ms ease-out both!important}
@@ .bm-ov .bm-fresh .bm-clash{transform-box:fill-box;transform-origin:50% 50%;animation:bmClash 520ms cubic-bezier(.2,.8,.2,1) both!important}
@@ .bm-ov .bm-fresh .bm-smoke, @@ .bm-ov .bm-fresh .bm-dust{transform-box:fill-box;transform-origin:50% 50%;animation:bmSmoke 1600ms ease-out calc(var(--bm-i,0) * 70ms + 120ms) both!important}
@@ .bm-ov .bm-fresh .bm-flag{transform-box:fill-box;transform-origin:0 50%;animation:bmSway 800ms ease-in-out 3 both!important}
`)}
:root[data-motion=off] .bm-ov *{animation:none!important}
:root[data-motion=off] .bm-ov .bm-cap{display:none}
@media (prefers-reduced-motion:reduce){:root:not([data-motion]) .bm-ov .bm-cap{display:none}}
:root[data-motion=reduced] .bm-ov .bm-cap{display:none}
`;
  const put = () => { if (document.getElementById('bm-style')) return; const st = document.createElement('style'); st.id = 'bm-style'; st.textContent = BM.CSS; document.head.appendChild(st); };
  if (document.head) put(); else document.addEventListener('DOMContentLoaded', put);
})();
