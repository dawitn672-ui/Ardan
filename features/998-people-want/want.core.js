// 998-people-want: on the People tab each face shows what that person wants, not their fighting tier (design review
// cycle 1, #8).
//   - Someone you have not got to know shows "Wants: ?" (getting to know them is how you learn it).
//   - A named cast member shows the want written for them in the lore (21-npc-initiative reads the same words).
//   - Anyone else shows the strongest of 21's fourteen moves they have in mind toward you now (a loan, a venture, a
//     match for your child, a grudge), read from NI.desire; failing that, what their nature and station want.
//   - Soldiers and your rivals and enemies keep the fighting tier chip, where it is the thing to know.
// The hooks are pure render wraps: UI.rosterCard ("Around you", where the tier chip was) draws the want in its place,
// and UI.peopleBonds (the lists below it) adds the want beside the bond chip. Nothing here writes the state or draws a
// random number; 21's desire is read inside A.asDrawing, so its readers behave as they do for any drawing.
(function () {
  const PW = UI.PEOPLE_WANT = UI.PEOPLE_WANT || {};
  const esc = s => UI.esc(String(s == null ? '' : s));
  const NI = () => A.NPCI;
  const low = s => String(s || '').charAt(0).toLowerCase() + String(s || '').slice(1);
  const clip = (s, n) => { s = String(s || '').replace(/[{}<>"]/g, '').replace(/\s+/g, ' ').trim().replace(/[.;,]$/, ''); if (s.length <= n) return s; const c = s.slice(0, n); return c.slice(0, Math.max(c.lastIndexOf(' '), n - 12)).replace(/[,;:]$/, '') + '…'; };
  const skName = k => (GD.SKILLS && GD.SKILLS[k] ? low(GD.SKILLS[k].name || GD.SKILLS[k][0] || k) : k);
  const nameOf = t => (t ? (A.fullName ? A.fullName(t, false) : t.given) : '');
  const FOES = new Set(['rival', 'enemy', 'nemesis']);

  // what 21's moves look like from the outside, as a want
  PW.MOVE = {
    borrow: () => 'needs coin', feud: (pc, t) => { const f = NI().foeOf(pc, t); return f ? `wants you on side against ${nameOf(f)}` : 'has a quarrel to settle'; },
    vouch: () => 'wants your good word', hide: () => 'is in trouble and hiding it', deal: () => 'has a venture in mind',
    apprentice: (pc, t) => { const k = NI().teachSkill(pc, t); return k ? `would teach you ${skName(k)}` : 'would take a pupil'; },
    match: () => 'has a match in mind for your child', invite: () => 'wants your company', confide: () => 'has something to tell you',
    gift: () => 'thinks well of you', slander: () => 'speaks ill of you', challenge: () => 'wants to try you with a blade',
    theft: () => 'has an eye on your purse', secret: () => 'knows something of yours',
  };
  // a nature and a station, when nothing moves them toward you
  const TRAIT_WANT = [['ambitious', 'wants to rise'], ['greedy', 'wants money'], ['gregarious', 'wants company'], ['zealous', 'wants the gods\' favour'],
    ['proud', 'wants respect'], ['content', 'wants a quiet life'], ['lustful', 'wants love'], ['wrathful', 'wants a fight'], ['diligent', 'wants work done well'],
    ['generous', 'wants to help'], ['shy', 'wants to be left alone'], ['paranoid', 'wants to know who is watching'], ['brave', 'wants a cause']];
  const STATION = { slave: 'wants freedom', serf: 'wants land of their own', peasant: 'wants a good harvest', artisan: 'wants steady work',
    merchant: 'wants a good bargain', gentry: 'wants a better match', noble: 'wants a higher seat', royal: 'wants the crown kept' };
  PW.natureOf = function (t) {
    for (const [k, w] of TRAIT_WANT) if ((t.traits || []).includes(k)) return w;
    const st = A.stage ? A.stage(t) : '';
    if (st === 'child' || st === 'infant') return 'wants to play';
    if (st === 'old') return 'wants to be listened to';
    return STATION[t.status] || 'wants a quiet life';
  };

  // { text, full, src: 'unknown' | 'cast' | 'move' | 'nature' }, or null for the dead
  PW.of = function (pc, t) {
    if (!pc || !t || !t.alive || t.id === pc.id) return null;
    const r = pc.rel && pc.rel[t.id];
    if (!r) return { text: '?', full: 'You do not know what they want. Get to know them.', src: 'unknown' };
    const ni = NI();
    const c = ni && ni.castOf ? ni.castOf(t) : null;
    if (c && c.wants) { const s = ni.castLine(t, 'wants') || String(c.wants), plain = s.replace(/^(he|she|they|it)\s+/i, ''); return { text: clip(plain, 36), full: s, src: 'cast' }; }
    if (ni && ni.desire && ni.KINDS && A.isAdult(t) && !t.prison) {
      let best = null, bw = 0;
      const look = () => { for (const k in ni.KINDS) { const K = ni.KINDS[k]; if (K.adult && !A.isAdult(pc)) continue; const d = ni.desire(pc, t, k, r); if (d && d.w > bw) { bw = d.w; best = k; } } };
      try { if (A.asDrawing) A.asDrawing(look); else look(); } catch (e) { best = null; }
      if (best && bw >= (ni.MIN_W || 0.05) && PW.MOVE[best]) { let s = ''; try { s = PW.MOVE[best](pc, t); } catch (e) {} if (s) return { text: s, full: `${nameOf(t)} ${s}.`, src: 'move', kind: best }; }
    }
    const s = PW.natureOf(t);
    return { text: s, full: `${nameOf(t)} ${s}.`, src: 'nature' };
  };
  // the tier chip stays where fighting is the point: a soldier, or a rival or enemy of yours
  const ARMED = /soldier|guard|sergeant|captain|archer|spear|knight|man-at-arms|mercenar|warden|levy/i;
  PW.keepTier = (pc, t) => !!(t && (t.mil || ARMED.test(t.occ || '') || (pc.rel && pc.rel[t.id] && FOES.has(pc.rel[t.id].type))));
  PW.chip = function (pc, t) {
    const w = PW.of(pc, t); if (!w) return '';
    return `<span class="chip pw-want pw-${esc(w.src)}" title="${esc(w.full)}" aria-label="${esc(w.src === 'unknown' ? 'What they want: not known' : 'Wants: ' + w.text)}">` +
      (w.src === 'unknown' ? '<span class="pw-k" aria-hidden="true">Wants</span> ?' : esc(w.text.charAt(0).toUpperCase() + w.text.slice(1))) + '</span>';
  };

  // "Around you": the want where the tier chip was
  const roster = UI.rosterCard;
  if (typeof roster === 'function') UI.rosterCard = function (pc) {
    const tc = UI.tierChip;
    if (typeof tc !== 'function' || PW.OFF) return roster.apply(this, arguments);
    UI.tierChip = function (p, short) { try { return PW.keepTier(pc, p) ? tc.apply(this, arguments) : (PW.chip(pc, p) || tc.apply(this, arguments)); } catch (e) { return tc.apply(this, arguments); } };
    try { return roster.apply(this, arguments); } finally { UI.tierChip = tc; }
  };
  // the lists of people you know: the want beside the bond
  const bonds = UI.peopleBonds;
  if (typeof bonds === 'function') UI.peopleBonds = function (pc) {
    const h = bonds.apply(this, arguments);
    if (PW.OFF || typeof h !== 'string') return h;
    try {
      return h.replace(/(data-v="person:([^"]+)"><div class="pp">[\s\S]*?<div class="bondline">)([\s\S]*?)(<\/div>)/g, (m, pre, id, mid, close) => {
        const t = A.P(id); if (!t || !t.alive || mid.indexOf('pw-want') >= 0) return m;
        return pre + mid + PW.chip(pc, t) + close;
      });
    } catch (e) { console.error('people want', e); return h; }
  };

  const CSS = `.chip.pw-want{max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border-color:var(--line);color:var(--ink-2);background:var(--raised)}
.chip.pw-want .pw-k{font-size:var(--t-cap,12px);color:var(--ink-3);text-transform:uppercase;letter-spacing:.06em;margin-right:2px}
.chip.pw-cast{color:var(--lore-ink,var(--ink-2));border-color:var(--lore-ink,var(--line))}
.chip.pw-move{color:var(--accent);border-color:var(--accent-rule,var(--line))}
.chip.pw-unknown{color:var(--ink-3);border-style:dashed}
@media (max-width:760px){.chip.pw-want{max-width:150px}}`;
  const put = () => { if (typeof document === 'undefined' || document.getElementById('pw-style')) return; const s = document.createElement('style'); s.id = 'pw-style'; s.textContent = CSS; document.head.appendChild(s); };
  if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }
})();
