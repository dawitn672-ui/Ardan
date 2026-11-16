// The player's window on AI personality: a temperament line on each realm's diplomacy card with what every treaty
// answer starts from (and own reasons for the offers with their own formula), the parts of an enemy's willingness to
// make peace, and "Recent decisions of rulers" (A.S.aiLog) in the Realm tab.
// Everything here only reads state: no A.rand, no writes to A.S.

const esc = s => UI.esc(s == null ? '' : String(s));
const sgn = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v);
const tname = t => (GD.TRAITS && GD.TRAITS[t] && GD.TRAITS[t].name) || t;

// what a persona amounts to, in a few words a player can act on
UI.aiTemperWords = function (P) {
  const w = [];
  if (P.war >= 1.6) w.push('warlike'); else if (P.war >= 1.15) w.push('bold'); else if (P.war <= .5) w.push('peaceable'); else if (P.war <= .8) w.push('slow to war');
  if (P.honor >= .4) w.push('keeps faith'); else if (P.honor <= -.4) w.push('breaks faith');
  if (P.pride >= .4) w.push('will not kneel'); else if (P.pride <= -.4) w.push('yields easily');
  if (P.greed >= .4) w.push('grasping'); else if (P.greed <= -.4) w.push('open-handed');
  if (P.social >= .4) w.push('seeks friends'); else if (P.social <= -.4) w.push('keeps to itself');
  if (P.wrath >= .5) w.push('holds grudges'); else if (P.wrath <= -.5) w.push('forgives');
  if (P.caution >= .4) w.push('cautious'); else if (P.caution <= -.4) w.push('reckless');
  if (P.zeal >= .5) w.push('zealous');
  return w;
};

const pts = ([l, v]) => `${esc(l)} <span class="${v >= 0 ? 'good-t' : 'bad-t'}">(${esc(sgn(Math.round(v)))})</span>`;
const top = (parts, n) => parts.filter(p => p && p[1]).slice().sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, n || 3);

// the ruler's temper, and (on the player's own card) what every treaty answer starts from
UI.aiTemper = function (o, r) {
  if (!o || !A.rulerPersona) return '';
  const P = A.rulerPersona(o.id), words = UI.aiTemperWords(P);
  let h = '';
  if (P.traits.length || words.length) h += `<div class="small ai-temper" style="margin:4px 0">Their ruler: ${P.traits.map(t => `<span class="chip">${esc(tname(t))}</span>`).join('')}` +
    `${words.length ? ` <span class="muted">${esc(words.join(', '))}</span>` : ''} <span class="tiny muted">· war ×${esc(P.war.toFixed(2))}</span></div>`;
  if (r && A.interestParts) {
    // A.diplOptions: chance = this proposal's own base + their interest in you + your chancellor / 4
    const parts = A.interestParts(o.id, r.id), iv = parts.reduce((a, x) => a + x[1], 0), chan = A.councilSkill ? Math.round(A.councilSkill(r, 'chancellor') / 4) : 0;
    h += `<div class="tiny muted ai-why" style="margin:2px 0 4px">Every treaty answer starts from their interest in you <b class="${iv >= 0 ? 'good-t' : 'bad-t'}">${esc(sgn(Math.round(iv)))}</b>` +
      ` (${top(parts, 3).map(pts).join(' · ')}) and your chancellor <span class="good-t">(${esc(sgn(chan))})</span>, then adds what each proposal asks of them.</div>`;
  }
  return h;
};

// offers whose odds follow their own formula get their own reasons (the rest share the line above)
UI.aiOfferWhy = function (x, r, o) {
  let parts = null;
  if (x.k === 'vassalize') parts = A.aiSubmitWhy(o.id, r.id);
  else if (x.k === 'claim' && A.councilSkill) parts = [['Odds of a forger', 25], [`Your spymaster (${A.councilSkill(r, 'spymaster')})`, Math.round(100 * A.councilSkill(r, 'spymaster') / 150)]];
  if (!parts) return '';
  const t = top(parts, 3);
  return t.length ? `<div class="tiny muted ai-why">Why: ${t.map(pts).join(' · ')}</div>` : '';
};

UI.aiWillWhy = function (T) {
  if (!T || !A.aiWillParts) return '';
  const parts = A.aiWillParts(T).filter(p => p[1]);
  return parts.length ? `<div class="tiny muted ai-why">${parts.map(pts).join(' · ')}</div>` : '';
};

// a log entry's reasons: what pushed toward the decision, and what it was made despite
UI.aiWhyLine = function (why) {
  const pro = (why || []).filter(x => x[1] > 0).map(x => esc(x[0])), con = (why || []).filter(x => x[1] < 0).map(x => esc(x[0]));
  return (pro.length ? `Because: ${pro.join(' · ')}` : '') + (pro.length && con.length ? '. ' : '') + (con.length ? `Despite: ${con.join(' · ')}` : '');
};

const KIND_ICON = { war: 'War', betray: 'Betrayal', join: 'War', call: 'Honor', refuse: 'Broken word', unally: 'Broken word', peace: 'Peace', yield: 'Peace',
  defy: 'Tribute', punish: 'War', release: 'Tribute', exact: 'Tribute', trib: 'Tribute', ally: 'Alliance', def: 'Pact', nap: 'Pact', trade: 'Trade', guar: 'Guarantee',
  sub: 'Subsidy', emb: 'Embargo', rival: 'Rivalry', mend: 'Rivalry', justify: 'Claim', offer: 'Envoy', accept: 'Answer', decline: 'Answer', coalition: 'War',
  claim: 'Civil war', kneel: 'Succession', revolt: 'Civil war', backdown: 'Faction', yieldfac: 'Faction', defyfac: 'Faction' };

UI.aiDecisionsView = function (rid, compact) {
  const L = A.S && Array.isArray(A.S.aiLog) ? A.S.aiLog : [];
  const mode = UI.aiLogMode === 'us' && rid ? 'us' : 'all', n = UI.aiLogN || (compact ? 6 : 12);
  const pool = mode === 'us' ? L.filter(e => e && (e.r === rid || e.o === rid)) : L.filter(Boolean);
  const rows = pool.slice(0, n);
  let h = `<div class="group-h">Recent decisions of rulers</div>`;
  if (rid) h += `<div class="row small" style="margin-bottom:4px"><button class="small ${mode === 'all' ? 'primary' : ''}" data-a="aiLogMode" data-v="all">All realms</button>` +
    `<button class="small ${mode === 'us' ? 'primary' : ''}" data-a="aiLogMode" data-v="us">Touching ${esc(A.realmShort(rid))}</button></div>`;
  if (!rows.length) return h + '<p class="small muted">No ruler has made a choice worth recording yet. Wars, pacts, betrayals and peace terms will appear here with the reasons behind them.</p>';
  h += '<div class="ai-log">';
  for (const e of rows) {
    const r = A.realm(e.r);
    h += `<div class="ai-dec" style="padding:5px 0;border-bottom:1px solid var(--border-1)"><div class="small"><span class="muted">${esc(e.y)}</span> ` +
      `<span class="tag" style="display:inline">${esc(KIND_ICON[e.k] || 'Decision')}</span> ` +
      `${r ? `<span class="swatch" style="background:${esc(r.color)}"></span>` : ''}<b>${esc(A.realmShort(e.r))}</b>${e.who ? ` <span class="muted">(${esc(e.who)})</span>` : ''} ${esc(e.t)}` +
      `${e.lean <= -.3 ? ' <span class="tiny warn-t">against their nature</span>' : e.lean >= .6 ? ' <span class="tiny muted">true to form</span>' : ''}</div>` +
      `<div class="tiny muted">${UI.aiWhyLine(e.why)}</div></div>`;
  }
  h += '</div>';
  if (pool.length > rows.length) h += `<button class="small ghost" data-a="aiLogMore" style="margin-top:4px">Show more (${pool.length - rows.length})</button>`;
  return h;
};

Object.assign(UI.A, {
  aiLogMode(v) { UI.aiLogMode = v === 'us' ? 'us' : 'all'; UI.aiLogN = 0; UI.refreshTab ? UI.refreshTab() : UI.refresh(); },
  aiLogMore() { UI.aiLogN = (UI.aiLogN || 12) + 12; UI.refreshTab ? UI.refreshTab() : UI.refresh(); },
  aiLogOpen() { UI.aiLogOpen = !UI.aiLogOpen; UI.refreshTab ? UI.refreshTab() : UI.refresh(); },
});

// the Realm tab: rulers see the log under their diplomacy view; everyone else gets a fold-out under the court view
const baseRealmTab = UI.TAB.realm;
UI.TAB.realm = function (pc) {
  let h = baseRealmTab.apply(this, arguments);
  const r = A.myRealm();
  if (r) {
    if ((UI.realmView || 'state') === 'dipl') h += UI.aiDecisionsView(r.id);
  } else if (pc) {
    const rid = pc.noble ? pc.noble.realm : pc.realm;
    h += `<div class="row" style="margin-top:10px"><button class="small ghost" data-a="aiLogOpen" aria-expanded="${UI.aiLogOpen ? 'true' : 'false'}">${UI.aiLogOpen ? 'Hide' : 'Show'} the recent decisions of rulers</button></div>`;
    if (UI.aiLogOpen) h += UI.aiDecisionsView(A.realm(rid) ? rid : null, true);
  }
  return h;
};
