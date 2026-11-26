// Titles, part 2: what the player reads (docs/design/skills-v2.md §11.6, D-183). Pure on render: reads A.TT and the person,
// draws nothing, writes nothing but on a press (the title borne). No condition is ever printed: a title's card says its
// name, its rarity, when and why it was earned in the world's words, what it gives in words (slight, fair, strong,
// great) and its honour; nothing at all about titles not yet held (order 92: no hints), and on another person's card not
// the deed either, only the name, the rarity, the gifts and the honour, so his title teaches nothing of how to earn it.
// Descriptions open on a press
// (data-tt / UI.note), never on hover; no percentages; 44-point controls; it fits 375 x 667.
//   The profile's card (999996-profile-tab's PF.card -> PF.cardTitles): the title borne ("Aldric the Undefeated") and a
//   strip of chips, each a rarity gem and a name, opening the title's card on a press.
//   Records: the section "Titles" (held, with "Bear it"; and lost).
//   Other people's profiles (UI.personModal): the same chips (UI.TTV.chips).
(function () {
  const TT = A.TT;
  if (!TT || typeof UI === 'undefined') return;
  const esc = s => UI.esc(String(s == null ? '' : s));
  const PF = UI.PF;
  const note = (text, inner, cls) => `<span class="tt ${cls || ''}" data-tt="note" data-v="${esc(text)}" tabindex="0" role="button" aria-haspopup="dialog" aria-expanded="false">${inner}</span>`;
  const RAR = { uncommon: 'uncommon', rare: 'rare', legendary: 'legendary' };

  // ---------------------------------------------------------------- what a title gives, in words
  const STAT = s => ((UI.PF && UI.PF.V2LABEL && UI.PF.V2LABEL[s]) || (GD.STAT_NAMES && GD.STAT_NAMES[s]) || s).toLowerCase();
  const SKILL = k => { try { if (A.SK2 && A.SK2.DATA) { const f = (A.SK2.DATA.families.families || A.SK2.DATA.families || []).find(x => x.id === k); if (f && f.name) return f.name.toLowerCase(); } } catch (e) {} return String((GD.SKILLS && GD.SKILLS[k]) || k).toLowerCase(); };
  const GROUP = { soldiers: 'soldiers', clergy: 'the clergy', peasants: 'common folk', nobles: 'the nobility', merchants: 'merchants', faith: 'those of your faith', all: 'everyone' };
  const RES = { fear: 'a steadier nerve', wounds: 'a body that shrugs off wounds', illness: 'a body that throws off sickness', poison: 'a stomach for poison', mind: 'a mind hard to bend' };
  TT.phrase = function (e) {
    switch (e && e.type) {
      case 'stat': return (e.v > 0 ? 'more ' : 'less ') + STAT(e.stat);
      case 'edge': return e.tag === 'beast' ? 'an eye for beasts' : 'an edge in ' + SKILL(e.tag);
      case 'fight': return (e.part === 'def' ? 'a harder guard' : e.part === 'adapt' ? 'a quicker answer in a fight' : 'a heavier blow') + (e.tag && e.tag !== 'all' ? ' with ' + SKILL(e.tag) : '');
      case 'resist': return RES[e.of] || 'a harder body';
      case 'social': return 'the regard of ' + (GROUP[e.group] || e.group);
      case 'aura': return 'men under you hold together';
      case 'growth': return 'quicker learning in ' + SKILL(e.tag);
      case 'blunder': return 'fewer blunders';
      case 'surge': return 'more moments of greatness';
      default: return '';
    }
  };
  TT.givesWords = function (t) {
    const l = [...new Set((t.effects || []).map(TT.phrase).filter(Boolean))];
    return l.length ? l.join('; ') : '';
  };
  TT.honourWord = h => (h >= 10 ? 'great honour' : h >= 5 ? 'honour' : h > 0 ? 'a little honour' : h < 0 ? 'shame' : 'no honour');
  TT.rarityWord = t => (t.unique ? 'one of a kind' : RAR[t.rarity] || 'rare');
  // the line an earned card ends on
  TT.cardLine = function (p, id) {
    const t = TT.BY.get(id); if (!t) return '';
    const g = TT.givesWords(t);
    return g ? `It brings ${TT.strength(t)} gifts: ${g}.` : '';
  };
  // the full card of a held title, as one description (it opens on a press). The deed behind it (the sentence written when
  // it was earned, and the title's own line, which names the deed) only on the player's own card: on another's it would
  // tell the player how the title is earned before he has it (order 92)
  TT.cardText = function (p, id) {
    const t = TT.BY.get(id), h = p && p.tt && p.tt.h && p.tt.h[id]; if (!t) return '';
    const n = TT.nameOf(p, id), g = TT.givesWords(t), pc = A.pc ? A.pc() : null, own = !!(pc && p && pc.id === p.id);
    let s = `${n}: ${TT.rarityWord(t)}.`;
    if (h) s += ` Earned in ${h.y} AR.` + (own && h.w ? ` ${h.w}` : '');
    if (own && t.text) s += ` ${t.text}`;
    if (g) s += ` It gives ${TT.strength(t)} gifts: ${g}.`;
    s += ` It brought ${TT.honourWord(t.honour || 0)}.`;
    if (t.class) s += ` It is also a class: ${t.class}.`;
    return s.replace(/\s+/g, ' ').trim();
  };

  // ---------------------------------------------------------------- the chips
  const chip = (p, id) => {
    const t = TT.BY.get(id); if (!t) return '';
    return note(TT.cardText(p, id), `<i class="tt-gem g-${t.unique ? 'unique' : esc(t.rarity)}" aria-hidden="true"></i>${esc(TT.nameOf(p, id))}`, 'tt-chip');
  };
  const V = UI.TTV = {};
  V.chips = function (p) {
    const ids = TT.held(p); if (!ids.length) return '';
    return `<div class="tt-chips" aria-label="Titles">${ids.map(id => chip(p, id)).join('')}</div>`;
  };
  if (PF) PF.cardTitles = function (p) {
    const ids = TT.held(p); if (!ids.length) return '';
    const st = TT.styled(p);
    return (st ? `<div class="tt-borne">${esc(st)}</div>` : '') + V.chips(p);
  };

  // ---------------------------------------------------------------- Records: the titles held and lost
  const li = (kind, inner) => `<li class="pf-li"><span class="pf-k">${esc(kind)}</span><span class="pf-c">${inner}</span></li>`;
  if (PF && PF.addSection) PF.addSection({
    k: 'titles', title: 'Titles',
    sum: p => { const n = TT.held(p).length; return n ? (n === 1 ? TT.nameOf(p, TT.held(p)[0]) : `${TT.nameOf(p, TT.held(p)[0])} and more`) : 'None yet'; },
    body: p => {
      const ids = TT.held(p), tt = p.tt || {}, lost = Object.keys(tt.x || {}).sort();
      let s = '';
      if (ids.length) {
        s += '<ul class="pf-list tt-list">' + ids.map(id => {
          const borne = tt.b === id, t = TT.BY.get(id) || {};
          const btn = t.style ? `<button type="button" class="tt-bearbtn" data-a="ttBear" data-v="${esc(borne ? '' : id)}" aria-pressed="${borne}">${borne ? 'Borne' : 'Bear it'}</button>` : '';
          return li(TT.rarityWord(t), chip(p, id) + btn);
        }).join('') + '</ul>';
      } else s += '<p class="pf-empty">No title is yours. They come from what you do, and from nothing else.</p>';
      if (lost.length) s += '<h4 class="pf-h2">Lost</h4><ul class="pf-list">' + lost.map(id => { const t = TT.BY.get(id) || {}, y = tt.x[id] || []; return li('Once', note(`Held from ${y[0]} to ${y[1]} AR. ${t.lost ? t.lost.replace('{title}', t.name) : 'A name you once had.'}`, esc(t.name || id), 'pf-w')); }).join('') + '</ul>';
      return s;
    },
  }, 'renown');

  Object.assign(UI.A, {
    ttBear(id) { const p = A.pc(); if (!p) return; TT.bear(p, id || null); UI.refresh(); },
  });

  const CSS = `
.tt-borne{font-style:italic;color:var(--ink-2,#666);margin:0 0 4px}
.tt-chips{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 6px}
.tt-chip{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 10px;border:1px solid var(--line,#bbb);border-radius:22px;background:var(--surface-2,transparent);max-width:100%;overflow-wrap:anywhere}
.tt-gem{width:10px;height:10px;transform:rotate(45deg);display:inline-block;flex:none;background:var(--ink-3,#999)}
.tt-gem.g-rare{background:var(--accent,#a77)}.tt-gem.g-legendary{background:var(--gold,#c9a227)}.tt-gem.g-unique{background:var(--gold,#c9a227);box-shadow:0 0 0 2px var(--accent,#a77)}
.tt-list .pf-c{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.tt-bearbtn{min-height:44px;min-width:44px;padding:0 12px}
`;
  const put = () => { if (typeof document === 'undefined' || document.getElementById('tt-style')) return; const st = document.createElement('style'); st.id = 'tt-style'; st.textContent = CSS; (document.head || document.documentElement).appendChild(st); };
  if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }
})();
