// 99997-v2-war, part 7 (D10, D-052): war screens only at your rank, when deployed, on a mission, or when the situation
// allows (owner order 5; docs/CRITIQUE.md D10, W4). Part 1 (a-gate) shuts every war that is not yours; this part
// narrows what your own war shows you to your post:
//  - the War Room by post (W.canRoom, in a-gate): the crown; in a war of yours a commander, or a captain
//    in the field; never a soldier or a sergeant;
//  - its map within your rank's reach (W.scope, in a-gate): a captain his division's front, a soldier the next province;
//  - enemy numbers as estimates below a commander: a War Room counter reads "~7k", not "7.3k";
//  - no Wars mode on the map for a life in no war (UI.mapModeHidden);
//  - Arms (the War tab in peace) from 14 or on enlisting (99992-v2-time's V2T.armsShown);
//  - the War tab lists only the elite orders you have heard of (A.orderHeard): your realm's, your own, those of the
//    realms in your wars, and the strongest (talked of everywhere).
// Every rule only reads state; nothing is drawn from A.rand.
(function () {
  const W = A.V2W;
  if (!W) return;

  // the orders you have heard of (s: A.orderSummary(id), i: its place by strength)
  A.orderHeard = function (pc, s, i) {
    if (!pc || !s || !s.o) return false;
    if (i === 0 || (pc.order && pc.order.id === s.id)) return true;
    const home = pc.mil && !pc.mil.merc ? pc.mil.realm : pc.ruler || pc.realm;
    if (s.o.realm === home) return true;
    return W.myWars(pc).some(w => w.att.includes(s.o.realm) || w.def.includes(s.o.realm));
  };

  if (typeof UI === 'undefined') return;
  // no Wars colouring offered to a life that is in no war (the colouring itself shows only your wars: a-gate)
  UI.mapModeHidden = k => k === 'wars' && !W.inWar();

  // enemy strength below a commander is an estimate: "~7k" for a counter the release labels "7.3k"
  W.counterEstimate = label => {
    const m = /^(\d+(?:\.\d)?)k$/.exec(String(label || ''));
    return m ? '~' + Math.max(1, Math.round(+m[1])) + 'k' : label;
  };
  const wc = UI.wrCounter;
  if (typeof wc === 'function') UI.wrCounter = function (ctx, x, y, K, o) {
    if (o && o.side === 'foe' && W.rank() !== 'commander') o = Object.assign({}, o, { label: W.counterEstimate(o.label) });
    return wc.call(this, ctx, x, y, K, o);
  };
})();
