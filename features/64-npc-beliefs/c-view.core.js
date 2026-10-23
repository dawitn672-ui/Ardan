// NPC beliefs, part 3 of 3: beasts as other people know them, and the person view.
//
//   - What someone knows of a beast is their own: 26-belief-truth's four states (unknown, heard tell, seen, known),
//     computed from where they live and what they do (a hunter of the hills has likely seen what lives there), plus any
//     truth they were taught. It is a hash, never stored, so drawing it is pure; a truth taught is a claim (Z).
//   - The person view shows "What they believe about you", "What they say of others" and "What you have heard of them",
//     each line marked true or false only when the player knows the truth. Everything is read, nothing is written.
(function () {
  const NB = A.NPCB; if (!NB) return;
  const cap = NB.cap;
  const CRE = () => (typeof LORE !== 'undefined' && Array.isArray(LORE.creatures) ? LORE.creatures : []);
  let creMap = null;
  const creature = id => { if (!creMap) { creMap = {}; for (const c of CRE()) creMap[c.id] = c; } return creMap[id] || null; };
  const HUNT = /hunt|trap|forest|warden|shepherd|herd|ranger|drover|fowler|woodsman/i;

  // ---------------------------------------------------------------- beasts (pure)

  NB.homeTerr = t => { const P = t && A.prov ? A.prov(t.home) : null; return P ? [P.terr, P.coast ? 'coast' : null].filter(Boolean) : []; };
  NB.beastLvl = function (t, cid) {
    if (!t || !A.BT || !A.BT.terrsOf) return 0;
    const s = NB.peek();
    if (s && t.nb) for (const id in t.nb) { const e = s.c[id]; if (e && e[0] === 'Z' && e[2] === cid && t.nb[id] > 0) return 3; }
    const c = creature(cid); if (!c) return 0;
    const home = NB.homeTerr(t), match = A.BT.terrsOf(c).some(x => home.includes(x));
    const hunter = HUNT.test(t.occ || '') || !!(t.job && HUNT.test(String(t.job.c))) || !!t.mil || !!t.veteran;
    const h = NB.H(t.id, cid, 'bz');
    if (match && h < (hunter ? 0.22 : 0.03)) return 3;
    if (match && h < (hunter ? 0.5 : 0.12)) return 2;
    if (match || /dragon|giant/i.test(c.cat || '') || h < 0.2) return 1;
    return 0;
  };
  // a beast of their home ground where they and the player know different things: 'wrong' (they hold the tale, the
  // player knows the truth) or 'right' (they know it, the player only the tale); the pick is a hash of the year
  NB.beastTopic = function (pc, t, mode) {
    if (!A.BT || !pc || !t) return null;
    const home = NB.homeTerr(t);
    let best = null, bh = 2;
    for (const c of CRE()) {
      if (!A.BT.terrsOf(c).some(x => home.includes(x))) continue;
      const tl = NB.beastLvl(t, c.id), pl = A.BT.level(pc, c.id);
      const ok = mode === 'wrong' ? tl >= 1 && tl <= 2 && pl >= 3 : tl >= 3 && pl >= 1 && pl <= 2;
      if (!ok) continue;
      const h = NB.H(t.id, c.id, A.S.year);
      if (h < bh) { bh = h; best = { c, tl, pl }; }
    }
    return best;
  };
  const bcache = new Map();
  // C.nbBeast(p, mode): someone of your town you know, with whom you differ about a beast of these parts
  A.C.nbBeast = (p, mode) => {
    if (!A.BT || !p || !p.rel) return false;
    if (bcache.S !== A.S) { bcache.clear(); bcache.S = A.S; }   // a new game, or a loaded one, starts a new cache
    const key = `${p.id}|${A.absDay ? A.absDay() : A.S.year}|${mode}|${Object.keys(p.rel).length}`;
    if (bcache.has(key)) return bcache.get(key);
    if (bcache.size > 200) bcache.clear();
    const r = !!NB.beastPerson(p, mode);
    bcache.set(key, r);
    return r;
  };
  NB.beastPerson = function (p, mode) {
    for (const id of Object.keys(p.rel || {}).sort()) {
      const t = A.P(id);
      if (!t || !t.alive || !A.isAdult(t) || t.home !== p.home) continue;
      const b = NB.beastTopic(p, t, mode);
      if (b) return { t, b };
    }
    return null;
  };
  // the line for the person view: what they say of one beast both of you have heard of
  NB.beastLine = function (pc, t) {
    if (!A.BT || !A.isAdult(t)) return '';
    let best = null, bh = 2;
    for (const c of CRE()) {
      const tl = NB.beastLvl(t, c.id); if (tl < 1 || A.BT.level(pc, c.id) < 1) continue;
      const h = NB.H(t.id, c.id, 'line');
      if (h < bh) { bh = h; best = { c, tl }; }
    }
    if (!best) return '';
    const { c, tl } = best, pl = A.BT.level(pc, c.id);
    const short = s => { s = String(s || '').replace(/;\s*$/, ''); return s.length <= 140 ? s : s.slice(0, 140).replace(/[,;.][^,;.]*$/, '') + '…'; };
    const said = tl >= 3 ? short(c.truth) : short(c.belief);
    const mark = pl >= 3 ? (tl >= 3 ? '<span class="chip green">true</span>' : '<span class="chip red">not so</span>') : (tl >= 3 ? '<span class="tiny muted">(says it like one who has seen it die)</span>' : '');
    return `<div class="small prof-li">${UI.esc(`Of the ${c.name.replace(/^The /, '')}, ${A.he(t)} says: ${said}`)} ${mark}</div>`;
  };

  // ---------------------------------------------------------------- the person view (pure)

  const mark = (pc, c, st) => {
    const k = NB.pcKnows(pc, c);
    if (k) return NB.isFalse(c, st) ? ' <span class="chip red">false</span>' : ' <span class="chip green">true</span>';
    const mine = NB.pcHeld(pc, c.id);
    return mine === 1 ? ' <span class="tiny muted">(you believe it too)</span>' : mine === -1 ? ' <span class="tiny muted">(you doubt it)</span>' : '';
  };
  const line = (pc, x) => {
    const s = NB.say(x.c, pc); if (!s) return '';
    const txt = x.st > 0 ? cap(s) + '.' : 'Does not believe ' + s + '.';
    return `<div class="small prof-li">${UI.esc(txt)}${mark(pc, x.c, x.st)}</div>`;
  };
  NB.viewHtml = function (pc, t) {
    if (!pc || !t || t.id === pc.id || !t.alive) return '';
    const bel = NB.beliefs(t);
    const about = bel.filter(x => x.c.s === pc.id && x.c.k !== 'B' && x.c.k !== 'Z');
    const others = bel.filter(x => !(x.c.s === pc.id && x.c.k !== 'B') && x.c.k !== 'Z');
    const heard = [];
    if (pc.nbk) for (const id of Object.keys(pc.nbk)) { const c = NB.claim(id), e = pc.nbk[id]; if (c && Array.isArray(e) && c.s === t.id) heard.push({ c, e }); }
    const beast = NB.beastLine(pc, t);
    if (!about.length && !others.length && !heard.length && !beast) return '';
    const he = A.he(t), him = A.him(t);
    let h = '<div class="nb-view" style="margin-top:6px">';
    if (about.length) h += `<div class="tiny muted">What ${UI.esc(he)} believes about you</div>` + about.map(x => line(pc, x)).join('');
    if (others.length || beast) h += `<div class="tiny muted">What ${UI.esc(he)} says of others</div>` + others.map(x => line(pc, x)).join('') + beast;
    if (heard.length) {
      h += `<div class="tiny muted">What you have heard of ${UI.esc(him)}</div>` + heard.map(({ c, e }) => {
        const from = e[1] ? NB.name(e[1]) : '', s = NB.say(c, pc); if (!s) return '';
        const st = e[0];
        const tag = st === 2 ? ' <span class="chip green">true</span>' : st === -2 ? ' <span class="chip red">false</span>' : st === 1 ? ' <span class="tiny muted">(you believe it)</span>' : ' <span class="tiny muted">(you doubt it)</span>';
        return `<div class="small prof-li">${UI.esc(cap(s) + (from ? `, as ${from} told it in ${e[2]}` : '') + '.')}${tag}</div>`;
      }).join('');
    }
    return h + '</div>';
  };
  if (typeof UI.personModal === 'function') {
    const pm = UI.personModal;
    UI.personModal = function (t) {
      const h = pm.apply(this, arguments);
      try {
        const pc = A.pc(); if (!pc || !t) return h;
        const block = NB.viewHtml(pc, t); if (!block) return h;
        const at = h.indexOf('<div class="group-h">Between you</div>');
        if (at < 0) return h;
        const row = h.indexOf('<div class="row" style="margin-top:6px">', at);
        if (row > 0) return h.slice(0, row) + block + h.slice(row);
        const end = h.lastIndexOf('</div>');
        return end > 0 ? h.slice(0, end) + block + h.slice(end) : h + block;
      } catch (e) { return h; }
    };
  }

  // the signature: belief versus truth now reaches people and courts (26-belief-truth registered the system)
  A.SIGNATURE = Object.assign(A.SIGNATURE || {}, { beliefPeople: true });
  if (!A.SIGNATURE.beliefTruth) A.SIGNATURE.beliefTruth = true;
})();
