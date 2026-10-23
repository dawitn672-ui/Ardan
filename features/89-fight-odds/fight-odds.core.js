// A choice that starts a beast fight shows the fight's chance, as a choice with a check shows its own.
// The release put the odds on every check ("39% · risky") and none on a choice whose effect is a beast fight
// (fx.beast), so "Take the bounty and hunt it" looked like the safe answer beside "Track it first". The chance is
// 48-fight-ladder's own measure of a fight with that beast alone (FL.resolve, the curve the duel screen opens with).
// It is a separate field (c.fight), not c.odds: no check is rolled, and nothing that counts checks should count it.
const FO = A.FO = {};
FO.RX = /\bbeast\s*:\s*\{/;
FO.ID_RX = /\bbeast\s*:\s*\{[^}]*\bid\s*:\s*["'](CRE-\d+)["']/;
const scanned = new WeakMap();
// the beast a choice's effect fights, or null: fx.beast's id, else the event's own beast (ctx.beast), as A.applyFx picks it
FO.beastOf = function (ch, ctx) {
  const fx = ch && (ch.fx || null);
  if (!fx) return null;
  let id = null;
  if (typeof fx === 'object') { if (!fx.beast) return null; id = fx.beast.id || null; }
  else if (typeof fx === 'function') {
    let s = scanned.get(fx);
    if (s === undefined) { const src = String(fx); s = FO.RX.test(src) ? ((FO.ID_RX.exec(src) || [])[1] || '') : null; scanned.set(fx, s); }
    if (s === null) return null;
    id = s || null;
  } else return null;
  if (!id && ctx && typeof ctx.beast === 'string' && /^CRE-\d+$/.test(ctx.beast)) id = ctx.beast;
  return id && (GD.BEAST_DUEL && GD.BEAST_DUEL[id] || A.BEASTS && A.BEASTS[id]) ? id : null;
};
FO.word = pct => pct >= 75 ? 'likely' : pct >= 50 ? 'even odds' : pct >= 30 ? 'risky' : 'long odds';
FO.cls = w => w === 'long odds' ? 'long' : w === 'risky' ? 'risky' : w === 'likely' ? 'likely' : '';

// engine side: the event view is built once, when the event comes up (A.headReady), and kept in q.view
const view = A.eventView;
A.eventView = function (q) {
  const v = view.apply(this, arguments);
  try {
    const FL = A.FL, e = q && q.type === 'event' && !q.result && A.EV[q.ev], pc = A.pc();
    if (FL && FL.resolve && e && v && !v.skip && v.choices && pc && pc.alive) {
      for (const c of v.choices) {
        if (c.fight !== undefined || c.odds != null || !(c.i >= 0)) continue;
        const id = FO.beastOf(e.choices[c.i], q.ctx);
        if (!id) continue;
        const R = FL.resolve(pc, { scale: 'beast', beast: id }, q.ctx || {});
        c.fight = { pct: R.pct, beast: id, w: FO.word(R.pct) };
      }
    }
  } catch (err) { console.error('fight odds', err); }
  return v;
};

// the badge, beside the choice's label (UI.eventModal, patch FO-BADGE)
UI.fightBadge = function (c) {
  const f = c && c.fight;
  if (!f) return '';
  const nums = A.DIFF ? A.DIFF.showOdds() : UI.set.odds;
  return `<span class="fo-fight risk ${FO.cls(f.w)}">${nums ? `${+f.pct}% · ` : ''}a fight</span>`;
};
