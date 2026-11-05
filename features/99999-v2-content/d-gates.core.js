// 99999-v2-content, part 4: scenes that need a shop, a trade or the years for it (playtest 1, #11).
//
// The audience classes (A.EV_RX on an event's words, A.CX_RX on its condition, read by A.evFit) had no class for a
// scene that takes a shop of your own: "Your apprentice has ruined a week's work", "your customers", "your
// workshop". A 13-year-old peasant drew them. The new text class `shop` keeps such a scene to a life that has a
// shop (C.ownShop) or is a master of a trade (rank 2 or more), unless its condition already gives the shop.
// Pure reading of the event and the player; nothing is drawn.
//
// What the class does not read (CI run 88: the gate hid scenes from the lives they were written for):
// - a clerk. Clerks serve a captain, a marshal, a crown and an office as well as a counting-house ("Your clerk waits
//   with the pen" for a general, "your clerks found in an old charter" for a ruler, "Your clerk shows you where the
//   numbers could be smoothed" for a reeve).
// - words the scene shows only under its own test: `${hasAsset(p,"workshop")?" of your own workshop":""}` is the
//   writer's gate, already kept.
// - a shop still to come: "Then you may open your own shop" is the scene of becoming a master.
// - a scene whose condition reads a flag (C.flag): it follows a scene the life lived, and that scene put the life
//   where the words stand. The dwarf who poured the partnership's bar has a workshop to leave (mpe_dw_partner_clause);
//   the smith who learnt the fold has an apprentice to teach it to (mpf_dwarf_apprentice); the bowyer who made the
//   royal bow has a workshop the king's man can come to (mat_royal_bow_order).
// A.evAudience reports `shop` by the same reading, so a lint that lists the classes an event's text trips sees what
// the gate does.
(function () {
  A.EV_RX.shop = /(?<!\bopen )\byour (own )?(shop|workshop|apprentices?|journeymen|journeyman|customers?|stall|caravans?|warehouse|counting-?house|shopfront)\b/i;
  A.CX_RX.shop = /C\.ownShop\(|C\.jobRank\(|\.job\.own\b|minR/;
  const FOLLOWS = /C\.flag\(/;
  const C2 = A.V2C = A.V2C || {};
  C2.hasShop = pc => !!(pc && pc.job && (pc.job.own || (typeof pc.job.r === 'number' && pc.job.r >= 2)));
  // the words a scene always says: a template's conditional parts (`${test ? "..." : "..."}`) are left out
  C2.shopWords = function (e) {
    let t = '';
    try { t = (typeof e.text === 'function' ? e.text.toString() : String(e.text || '')) + ' ' + (typeof e.title === 'string' ? e.title : ''); } catch (err) { t = ''; }
    return t.replace(/\$\{[^{}]*\?[^{}]*\}/g, ' ');
  };
  // read once an event (A.evAudience may have cached an audience before this class existed)
  const shopCache = new Map();
  C2.shopScene = function (e) {
    if (!e || !e.id) return false;
    if (shopCache.has(e.id)) return shopCache.get(e.id);
    let cs = '';
    try { cs = e.cond ? e.cond.toString() : ''; } catch (err) { cs = ''; }
    const b = A.EV_RX.shop.test(C2.shopWords(e)) && !A.CX_RX.shop.test(cs) && !FOLLOWS.test(cs) && !(e.minR >= 2);
    shopCache.set(e.id, b);
    return b;
  };
  const aud0 = A.evAudience;
  A.evAudience = function (e) {
    const a = aud0.apply(this, arguments);
    try { if (a && a.txt && e && e.id) a.txt.shop = C2.shopScene(e); } catch (err) {}
    return a;
  };
  const fit0 = A.evFit;
  A.evFit = function (e, pc) {
    const w = fit0.apply(this, arguments);
    try { if (w > 0 && pc && C2.shopScene(e) && !C2.hasShop(pc)) return 0; } catch (err) {}
    return w;
  };
})();
