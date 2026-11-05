// 99999-v2-content, part 4: scenes that need a shop, a trade or the years for it (playtest 1, #11).
//
// The audience classes (A.EV_RX on an event's words, A.CX_RX on its condition, read by A.evFit) had no class for a
// scene that takes a shop of your own: "Your apprentice has ruined a week's work", "your customers", "your
// workshop". A 13-year-old peasant drew them. The new text class `shop` keeps such a scene to a life that has a
// shop (C.ownShop) or is a master of a trade (rank 2 or more), unless its condition already asks for a job or a shop.
// Pure reading of the event and the player; nothing is drawn.
(function () {
  A.EV_RX.shop = /\byour (own )?(shop|workshop|apprentices?|journeymen|journeyman|customers?|stall|caravans?|warehouse|counting-?house|clerks?|shopfront)\b/i;
  A.CX_RX.shop = /C\.ownShop\(|C\.jobRank\(|\.job\.own\b|minR/;
  const C2 = A.V2C = A.V2C || {};
  C2.hasShop = pc => !!(pc && pc.job && (pc.job.own || (typeof pc.job.r === 'number' && pc.job.r >= 2)));
  // read once an event (A.evAudience may have cached an audience before this class existed)
  const shopCache = new Map();
  C2.shopScene = function (e) {
    if (!e || !e.id) return false;
    if (shopCache.has(e.id)) return shopCache.get(e.id);
    let t = '', cs = '';
    try { t = (typeof e.text === 'function' ? e.text.toString() : String(e.text || '')) + ' ' + (typeof e.title === 'string' ? e.title : ''); } catch (err) { t = ''; }
    try { cs = e.cond ? e.cond.toString() : ''; } catch (err) { cs = ''; }
    const b = A.EV_RX.shop.test(t) && !A.CX_RX.shop.test(cs) && !(e.minR >= 2);
    shopCache.set(e.id, b);
    return b;
  };
  const fit0 = A.evFit;
  A.evFit = function (e, pc) {
    const w = fit0.apply(this, arguments);
    try { if (w > 0 && pc && C2.shopScene(e) && !C2.hasShop(pc)) return 0; } catch (err) {}
    return w;
  };
})();
