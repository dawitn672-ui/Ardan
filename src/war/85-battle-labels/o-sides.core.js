// 85-battle-labels, cycle 2 (visual B5, B6): one colour code for the two sides, your own company marked on the field,
// side bands the camera does not cut, and the battle's action row always in view.
//   - UI.bfSides(): { us, them } read once a draw from the theme (--info for ours, --danger for theirs), with the
//     release's blue and red when the theme has neither. Units' caps (patch BF-SIDE-EDGE), the intents and the
//     standards' edges (n-motion), the side bands and the legend squares all use it; a realm's colour stays only as
//     the cloth of its standards and banner masses.
//   - UI.bfMine(): the unit whose u.coMine is 'me' (9997-companies: the player's own company) gets a 2 px accent
//     outline, a chevron above it and a YOU tag in 11 px capitals.
//   - UI.bfBands(): the two side bands, drawn by the field and painted again, unzoomed, over the camera's crop.
//   - The battle's Next pulse / Fight it out row sticks to the bottom of the side column.
// Drawing only: nothing here reads the random stream or writes the game.
(function () {
  if (typeof document === 'undefined') return;
  const hex = /^#[0-9a-f]{3,8}$|^rgb/i;
  const css = (k, d) => { try { const v = getComputedStyle(document.documentElement).getPropertyValue(k).trim(); return hex.test(v) ? v : d; } catch (e) { return d; } };
  UI.bfSides = () => ({ us: css('--info', '#2a6ab0'), them: css('--danger', '#c23c27'), accent: css('--accent', '#e8b04a') });
  UI.bfMine = function (ctx, u, x, y, w, h, bottom) {
    if (!u || u.coMine !== 'me' || u.status === 'gone') return;
    const S = UI.bfSides();
    ctx.save();
    ctx.globalAlpha = 1; ctx.lineWidth = 2; ctx.strokeStyle = S.accent; ctx.setLineDash([]);
    ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
    // the chevron, above the unit on our side of the field
    const cx = x + w / 2, cy = y - 10;
    ctx.fillStyle = S.accent; ctx.beginPath(); ctx.moveTo(cx - 7, cy - 6); ctx.lineTo(cx, cy); ctx.lineTo(cx + 7, cy - 6); ctx.lineTo(cx + 7, cy - 2); ctx.lineTo(cx, cy + 4); ctx.lineTo(cx - 7, cy - 2); ctx.closePath(); ctx.fill();
    ctx.font = 'bold 11px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(20,14,8,.85)';
    ctx.strokeText('YOU', x + w + 8, y + Math.min(h, 14) - 1); ctx.fillText('YOU', x + w + 8, y + Math.min(h, 14) - 1);
    ctx.restore();
  };
  UI.bfBands = function (ctx, W, H, B) {
    const side = B.pcSide || 'A', foe = side === 'A' ? 'B' : 'A', S = UI.bfSides();
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 0, W, 18); ctx.fillRect(0, H - 18, W, 18);
    ctx.fillStyle = S.them; ctx.fillRect(8, 5, 9, 9);
    ctx.fillStyle = S.us; ctx.fillRect(8, H - 14, 9, 9);
    ctx.fillStyle = '#f1d58e'; ctx.font = 'bold 12px Georgia'; ctx.textAlign = 'left';
    ctx.fillText(B.sides[foe].name, 22, 13); ctx.fillText(B.sides[side].name + ' (you)', 22, H - 5);
    ctx.restore();
  };
  // the legend under the field: the side's square, not the realm's colour (two pale greens could not be told apart)
  const modal = UI.battleModalBasic;
  if (typeof modal === 'function') UI.battleModalBasic = function (B) {
    let h = modal.apply(this, arguments);
    try {
      let n = 0;
      h = h.replace(/<span style="color:[^"]*">■<\/span>/g, m => (n++ === 0 ? '<span class="bf-key bf-us" aria-hidden="true">■</span>' : n === 2 ? '<span class="bf-key bf-them" aria-hidden="true">■</span>' : m));
      h = h.replace('<div class="row" style="margin-top:6px"><button class="primary grow" data-a="bStep">', '<div class="row bf-act" style="margin-top:6px"><button class="primary grow" data-a="bStep">');
    } catch (e) {}
    return h;
  };
  const CSS = `.bf-key.bf-us{color:var(--info,#2a6ab0)}.bf-key.bf-them{color:var(--danger,#c23c27)}
.battle .side .bf-act{position:sticky;bottom:0;z-index:2;background:var(--surface,var(--bg,#1b2133));padding:6px 0 4px;margin-bottom:0;box-shadow:0 -6px 8px -6px rgba(0,0,0,.35)}`;
  const put = () => { if (document.getElementById('bf-side-style')) return; const st = document.createElement('style'); st.id = 'bf-side-style'; st.textContent = CSS; document.head.appendChild(st); };
  if (document.head) put(); else document.addEventListener('DOMContentLoaded', put);
})();
