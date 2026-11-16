// Unit labels on the battle field no longer print over each other. Each label was drawn centred on its block with no
// regard for its neighbours, so a centre of four or five units read "Heavy infSpeaCrossbowmen" (seen on a playtest pass
// of a 3,000-a-side battle), and a later unit's blocks were drawn over an earlier unit's label. Each frame now keeps the boxes of the labels already drawn (on the canvas context, never
// in the game state); a label that would overlap one moves 12 or 24 px away from the line (up on the enemy side, down
// on yours), and if there is still no room it shows only its count ("1.1k"). The full names stay in the side panel.
// Drawing only: no game state, no random numbers.
(function () {
  const H = 12;
  UI.bfLabel = function (ctx, lab, cx, ly, bottom) {
    const boxes = ctx.__lb || (ctx.__lb = []);
    const box = (t, y) => { const w = ctx.measureText(t).width; return { x0: cx - w / 2 - 2, x1: cx + w / 2 + 2, y0: y - H + 2, y1: y + 2 }; };
    const free = b => !boxes.some(o => o.x0 < b.x1 && b.x0 < o.x1 && o.y0 < b.y1 && b.y0 < o.y1);
    const dir = bottom ? 1 : -1, short = String(lab).replace(/^.* (?=[\d.]+k?$)/, '');
    let pick = null;
    for (const [t, dy] of [[lab, 0], [lab, dir * H], [lab, dir * 2 * H], [short, 0], [short, dir * H], [short, dir * 2 * H]]) {
      const b = box(t, ly + dy); if (free(b)) { pick = { t, y: ly + dy, b }; break; }
    }
    if (!pick) pick = { t: short, y: ly, b: box(short, ly) };
    boxes.push(pick.b); (ctx.__lbText || (ctx.__lbText = [])).push(pick.t);
    // drawn after every block (UI.bfLabelFlush), so a later unit's blocks cannot cover an earlier unit's label
    (ctx.__lbq || (ctx.__lbq = [])).push({ t: pick.t, x: cx, y: pick.y, font: ctx.font });
  };
  UI.bfLabelFlush = function (ctx) {
    const q = ctx.__lbq || []; ctx.__lbq = [];
    ctx.save(); ctx.textAlign = 'center'; ctx.globalAlpha = 1; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,248,230,.85)'; ctx.fillStyle = '#1a140c';
    for (const l of q) { ctx.font = l.font; ctx.strokeText(l.t, l.x, l.y); ctx.fillText(l.t, l.x, l.y); }
    ctx.restore();
  };
})();
