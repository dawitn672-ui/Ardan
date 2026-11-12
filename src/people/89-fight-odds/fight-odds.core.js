// A choice that starts a fight shows the fight's chance, as a choice with a check shows its own.
// The release put the odds on every check ("39% · risky") and none on a choice whose effect is a fight, so "Take the
// bounty and hunt it" looked like the safe answer beside "Track it first". The chance is 48-fight-ladder's own measure
// (FL.resolve, the curve the duel screen opens with). It is a separate field (c.fight), not c.odds: no check is rolled,
// and nothing that counts checks should count it.
// Two ways an effect starts a fight: fx.beast (A.applyFx's beast fight), or a function effect that calls
// A.startDuel / A.startDuelFront itself (the release's "The hunt": "Attack it head-on" was such a function and showed
// nothing; a merchant of 18 died to a crocodile from it in her first half-year). Both are read here.
const FO = A.FO = {};
FO.RX = /\bbeast\s*:\s*\{/;
FO.ID_RX = /\bbeast\s*:\s*\{[^}]*\bid\s*:\s*["'](CRE-\d+)["']/;
// a function effect that starts a duel: startDuel(p, {beastId: ...}, opts) or startDuel(p, someone, opts)
FO.DUEL_RX = /\bstartDuel(?:Front)?\(\s*\w+\s*,/;
FO.BEAST_DUEL_RX = /\bstartDuel(?:Front)?\(\s*\w+\s*,\s*\{\s*beastId\s*:\s*(?:["'](CRE-\d+)["']|ctx\.(\w+))([^}]*)\}\s*(?:,\s*\{([^)]*)\})?/;
FO.MOD_RX = /\bmod\s*:\s*([\d.]+)/;
FO.KIND_RX = /\bkind\s*:\s*["'](\w+)["']/;
const scanned = new WeakMap();
// what a function effect fights, read once from its source: { beast: id|'', key, mod, party } or { person: key|null, tier, rule }
FO.readFn = function (fx) {
  let s = scanned.get(fx);
  if (s !== undefined) return s;
  const src = String(fx);
  s = null;
  if (FO.RX.test(src)) s = { beast: (FO.ID_RX.exec(src) || [])[1] || '', key: 'beast', mod: 1 };
  else if (FO.DUEL_RX.test(src)) {
    const m = FO.BEAST_DUEL_RX.exec(src);
    if (m) {
      const mm = FO.MOD_RX.exec(m[3] || '');
      s = { beast: m[1] || '', key: m[2] || 'beast', mod: mm ? +mm[1] : 1, party: /\bparty\s*:/.test(m[4] || '') };
    } else {
      // a person: the one named in the scene (const t=A.P(ctx.pid) ... startDuel(p,t,...)), else a stranger of a tier
      const call = /\bstartDuel(?:Front)?\(\s*\w+\s*,\s*(\w+)/.exec(src), v = call && call[1];
      const bind = v && new RegExp('\\b' + v + '\\s*=\\s*A\\.P\\(\\s*ctx\\.(\\w+)\\s*\\)').exec(src);
      const tier = /\bmakeFoe\(\s*\{[^}]*\btier\s*:\s*(\d)/.exec(src);
      const after = src.slice(src.search(FO.DUEL_RX));
      const kind = (FO.KIND_RX.exec(after) || [])[1] || 'duel', lethal = !/\blethal\s*:\s*(?:!1|false)/.test(after);
      const rule = kind === 'spar' ? 'spar' : kind === 'tourney' ? 'tourney' : kind === 'brawl' || !lethal ? 'brawl' : /toYield\s*:\s*(?:!0|true)/.test(after) ? 'yield' : 'lethal';
      s = { person: bind ? bind[1] : null, tier: tier ? +tier[1] : null, rule };
    }
  }
  scanned.set(fx, s);
  return s;
};
// the beast a choice's effect fights, or null: fx.beast's id, else the event's own beast (ctx.beast), as A.applyFx picks it
FO.fightOf = function (fx, ctx) {
  if (!fx) return null;
  let f = null;
  if (typeof fx === 'object') { if (!fx.beast) return null; f = { beast: fx.beast.id || '', key: 'beast', mod: 1 }; }
  else if (typeof fx === 'function') f = FO.readFn(fx);
  if (!f) return null;
  if (f.person !== undefined) return f;
  let id = f.beast || null;
  if (!id && ctx && typeof ctx[f.key] === 'string' && /^CRE-\d+$/.test(ctx[f.key])) id = ctx[f.key];
  return id && (GD.BEAST_DUEL && GD.BEAST_DUEL[id] || A.BEASTS && A.BEASTS[id]) ? Object.assign({}, f, { beast: id }) : null;
};
FO.beastOf = function (ch, ctx) { const f = ch && FO.fightOf(ch.fx, ctx); return f && f.beast ? f.beast : null; };
FO.word = pct => pct >= 75 ? 'likely' : pct >= 50 ? 'even odds' : pct >= 30 ? 'risky' : 'long odds';
FO.cls = w => w === 'long odds' ? 'long' : w === 'risky' ? 'risky' : w === 'likely' ? 'likely' : '';
FO.what = rule => rule === 'brawl' ? 'a brawl' : rule === 'spar' || rule === 'tourney' ? 'a bout' : 'a fight';

// a beast weakened or angered by the scene (startDuel's mod: a trap's 0.6, arrows' 0.5) is a different fight: the
// beast's worth (48's FL.fWorth of A.fighterBeast at that mod) against its worth unharmed moves the curve's midpoint
const logistic = z => 1 / (1 + Math.exp(-z));
FO.modRatio = function (id, mod) {
  if (!(mod > 0) || mod === 1 || !A.fighterBeast || !A.FL || !A.FL.fWorth) return 1;
  try { const w1 = A.FL.fWorth(A.fighterBeast(id, 1)), wm = A.FL.fWorth(A.fighterBeast(id, mod)); return w1 > 0 ? wm / w1 : 1; } catch (e) { return 1; }
};
FO.beastPct = function (pc, id, mod, party) {
  const FL = A.FL, R = FL.resolve(pc, { scale: 'beast', beast: id, allies: party ? 6 : 0 }, {});
  if (mod === 1 || R.w50 == null || (GD.BEAST_FLYER && GD.BEAST_FLYER[id] && !party && !A.canReachFlyer(pc))) return R.pct;
  const row = FL.duelRow(id), s = party ? row[3] : row[1], hf = A.clamp((pc.health != null ? pc.health : 100) / 100, 0.3, 1);
  const p = logistic((R.wMe + R.edge - R.w50 * FO.modRatio(id, mod)) / s + FL.BEAST_HEALTH * (hf - 1));
  return Math.round(A.clamp(p, FL.CLAMP[0], FL.CLAMP[1]) * 100);
};
// the chance of the fight an effect starts, for this person in this scene: { pct, beast?, w, what } or null
FO.measure = function (pc, fx, ctx) {
  const f = FO.fightOf(fx, ctx);
  if (!f) return null;
  if (f.beast) { const pct = FO.beastPct(pc, f.beast, f.mod || 1, !!f.party); return { pct, beast: f.beast, w: FO.word(pct), what: 'a fight' }; }
  const foe = f.person && ctx && ctx[f.person] ? A.P(ctx[f.person]) : null;
  if (foe && foe.alive && foe.st) { const pct = A.FL.resolve(pc, { scale: 'one', pid: true, rule: f.rule }, { pid: foe.id }).pct; return { pct, w: FO.word(pct), what: FO.what(f.rule) }; }
  if (f.tier != null) { const pct = A.FL.resolve(pc, { scale: 'one', tier: f.tier, rule: f.rule }, {}).pct; return { pct, w: FO.word(pct), what: FO.what(f.rule) }; }
  // a foe the effect makes up as it goes (a grading bout's opponent): it is a fight, with no number to give
  return { pct: null, w: '', what: FO.what(f.rule) };
};

// engine side: the event view is built once, when the event comes up (A.headReady), and kept in q.view
const view = A.eventView;
A.eventView = function (q) {
  const v = view.apply(this, arguments);
  try {
    const FL = A.FL, e = q && q.type === 'event' && !q.result && A.EV[q.ev], pc = A.pc();
    if (FL && FL.resolve && e && v && !v.skip && v.choices && pc && pc.alive) {
      for (const c of v.choices) {
        if (c.fight !== undefined || !(c.i >= 0)) continue;
        const ch = e.choices[c.i];
        if (!ch) continue;
        if (c.odds == null) {
          const m = FO.measure(pc, ch.fx, q.ctx || {});
          if (m) c.fight = m;
        } else if (ch.check && !ch.check.fight) {
          // a check whose outcome is a fight (a trap that works, arrows that miss): the fight after it, on success
          const mw = ch.win && FO.measure(pc, ch.win.fx, q.ctx || {}), ml = ch.lose && FO.measure(pc, ch.lose.fx, q.ctx || {});
          const m = mw || ml;
          if (m) c.fight = Object.assign({}, m, { then: true, onWin: !!mw, lose: mw && ml ? ml.pct : null });
        }
      }
    }
  } catch (err) { console.error('fight odds', err); }
  return v;
};
// the duel screen's opening measure reads the beast's mod too, so the number on the button and the number the duel
// opens with agree (A.fighterBeast scales the beast's strength and blood by it; 48's measure read the unharmed beast).
// The mod is taken from the call itself (foe.mod), never inferred from the beast's blood: a hunting party changes the
// duel's fighters too, and reading the mod back from them broke 48's flBeastOdds calibration.
FO.curMod = null;
const sd = A.startDuel;
A.startDuel = function (pc, foe) {
  const was = FO.curMod;
  FO.curMod = foe && foe.beastId && +foe.mod > 0 ? +foe.mod : null;
  try { return sd.apply(this, arguments); } finally { FO.curMod = was; }
};
if (A.FL && typeof A.FL.duelMeasure === 'function') {
  const dm = A.FL.duelMeasure;
  A.FL.duelMeasure = function (D) {
    const m = dm.apply(this, arguments);
    try {
      const b = D && D.b, mod = FO.curMod;
      if (b && b.beast && mod && Math.abs(mod - 1) > 0.001 && m.w50 != null) {
        const row = A.FL.duelRow(b.beast), s = D.party ? row[3] : row[1], a = D.a, hf = a.maxHp ? A.clamp(a.hp / a.maxHp, 0.3, 1) : 1;
        const p = logistic((m.wA - m.w50 * FO.modRatio(b.beast, mod)) / s + A.FL.BEAST_HEALTH * (hf - 1));
        m.p = A.clamp(p, A.FL.CLAMP[0], A.FL.CLAMP[1]); m.pct = Math.round(m.p * 100); m.mod = mod;
      }
    } catch (e) { console.error('fight odds measure', e); }
    return m;
  };
}

// the badge, beside the choice's label (UI.eventModal, patch FO-BADGE)
UI.fightBadge = function (c) {
  const f = c && c.fight;
  if (!f) return '';
  const nums = (A.DIFF ? A.DIFF.showOdds() : UI.set.odds) && f.pct != null;
  const title = f.then ? ` title="${UI.esc(f.onWin ? 'If it works, ' + f.what + ' follows' + (f.lose != null ? (nums ? `; if it fails, ${f.what} at ${+f.lose}%` : '; if it fails, a worse one') : '') : 'If it fails, ' + f.what + ' follows')}"` : '';
  return `<span class="fo-fight risk ${FO.cls(f.w)}"${title}>${f.then ? (f.onWin ? 'then ' : 'or ') : ''}${nums ? `${+f.pct}% · ` : ''}${UI.esc(f.what || 'a fight')}</span>`;
};
