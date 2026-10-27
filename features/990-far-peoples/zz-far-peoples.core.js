// The far peoples (990-far-peoples): the 118 realms, 110 cultures and 55 faiths of the Great Continent get the depth the
// Known World's 35 realms and 24 cultures have.
//   1. Realm bibles (47-realm-bible): each far realm a want, a fear, a place and three customs the engine keeps: its
//      own custom (from the lore's), one of its people's customs, and its faith's holy day. Four new kinds of custom
//      where a lore custom needed machinery 47 lacked: exam (a sitting every few years, passed or failed on your
//      learning), census (a head count of your household and the tax on it), muster (a yearly muster: come mounted and
//      armed, or pay), season (debts called at a season of the year; who cannot pay drops in the debtors' rank).
//   2. Voices (54-voices): A.VOICE_DATA for all 110 far cultures (voices.*.data.core.js); 54's reading of an event's
//      gate takes ids of any length, and a far custom's scene speaks in the realm's voice.
//   3. Faiths: the 55 far faiths' clergy words and holy days (faiths.data.core.js) work where the release's do: the
//      priest of a scene, the feast days the release names (GD.FESTIVALS), a holy day kept each year (piety).
//   4. Score (73-score): every far culture hears a family of its own (score.data.core.js).
//   5. Starts (29-starts): a far birth opens with a scene of its land, its realm's kind and its rank (fp_start).
// Everything here is gated on the far lands being in play (A.FAR.active); a Known World game is exactly as before.
(function () {
  const B = A.BIBLE, FL = A.FAR;
  if (!B || !FL) return;   // built without 47-realm-bible or 99-far-lands
  const FP = A.FARP = {
    KINDS: ['exam', 'census', 'muster', 'season'],
    TOKENS: ['n', 'due', 'hday'],
    MONTHS: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  };
  const far = () => !!FL.active;
  const farRealm = rid => !!(FL.D && FL.D.realms && FL.D.realms[rid]);
  FP.far = far; FP.farRealm = farRealm;
  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const low = s => String(s || '').replace(/^The /, 'the ');

  // ---- 1. the realm bibles, expanded from the compact data into 47's form
  // a custom in the data: [id, kind, params, name, rule, text, keepT, keep, defyT, defyR, log, fx, defyFx]
  FP.custom = function (a) {
    if (!Array.isArray(a)) return a;
    const [id, kind, params, name, rule, text, keepT, keep, defyT, defyR, log, fx, dfx] = a;
    const c = Object.assign({ id, kind }, params || {}, { name, rule, log, fx: fx || {} });
    if (kind !== 'grave') Object.assign(c, { text, keepT, keep, defy: { t: defyT, r: defyR, fx: dfx || { honor: -2 } } });
    return c;
  };
  const letters = n => String.fromCharCode(97 + Math.floor(n / 26) % 26) + String.fromCharCode(97 + n % 26);
  // the holy day of a faith as a custom of the year (the realm's third custom)
  FP.faithCustom = function (fid) {
    const F = (A.FARP_FAITH || {})[fid], days = (A.FARP_DAYS || {})[fid] || [];
    if (!F) return null;
    const d = Array.isArray(F.day) ? F.day : days[F.day || 0];
    if (!d) return null;
    const m = d[1] == null ? 0 : d[1], day = low(d[0]);
    return { id: 'fth_' + letters(+String(fid).slice(4) || 0), kind: 'year', m, who: 'adult', faith: fid,
      name: cap(day), rule: `Every household keeps ${day} in ${FP.MONTHS[m]}: it ${F.rite}.`,
      text: `${FP.MONTHS[m]}, and ${day}. ${F.scene}`, keepT: F.keepT, keep: F.keep,
      defy: { t: F.defyT, r: F.defyR, fx: F.strict ? { piety: -3, honor: -2 } : { piety: -3 } },
      log: `You keep ${day}: your household ${F.rite}.`, fx: { piety: 2, happy: 1, coin: -1 } };
  };
  FP.build = function () {
    const R = A.FARP_REALMS || {}, CC = A.FARP_CULT || {}, D = A.BIBLE_DATA = A.BIBLE_DATA || {};
    const used = {};   // culture -> how many of its realms have taken a custom of it
    const ids = Object.keys(FL.D.realms).sort((a, b) => +a.slice(4) - +b.slice(4));
    for (const rid of ids) {
      const L = FL.D.realms[rid], X = R[rid];
      if (!X) continue;
      const own = FP.custom(X.own), list = (CC[L.cult] || []).map(FP.custom), fc = FP.faithCustom(X.faith || L.faith);
      // the people's custom: the one the data names, else the next of its people's in turn, of a kind the realm's own lacks
      let cc = null;
      if (X.cc != null) cc = list[X.cc] || null;
      else if (list.length) {
        const k = used[L.cult] || 0;
        for (let i = 0; i < list.length && !cc; i++) { const c = list[(k + i) % list.length]; if (c.kind !== own.kind && (!fc || c.kind !== fc.kind)) cc = c; }
        used[L.cult] = k + 1;
      }
      D[rid] = { want: X.want, fear: X.fear, place: { name: X.place[0], text: X.place[1] }, customs: [own, cc, fc].filter(Boolean), far: true };
    }
  };

  // ---- the four new kinds
  B.KINDS.push(...FP.KINDS);
  B.TOKENS.push(...FP.TOKENS);
  B.WHEN.parent = B.WHEN.parent || (pc => (pc.children || []).length > 0);
  B.WHO.literate = pc => A.isAdult(pc) && !!pc.literate && !(pc.flags && pc.flags.unfree);
  const who = (pc, w) => (B.WHO[w || 'adult'] || B.WHO.adult)(pc);
  // a household for the census: you, a living spouse, and your living children under 16
  FP.household = pc => 1 + (pc.spouse && A.P(pc.spouse) && A.P(pc.spouse).alive ? 1 : 0) +
    (pc.children || []).map(A.P).filter(k => k && k.alive && A.age(k) < 16).length;
  // when each kind is due this month (h: what pc.rb remembers of it)
  FP.DUE = {
    exam: (pc, c, h, mo, y) => mo === (c.m || 0) && (y - (c.off || 0)) % (c.every || 3) === 0 && (!h || h.y !== y) && who(pc, c.who || 'free') && A.age(pc) <= 50,
    census: (pc, c, h, mo, y) => mo === (c.m || 0) && (y - (c.off || 0)) % (c.every || 5) === 0 && (!h || h.y !== y) && who(pc, c.who || 'adult'),
    muster: (pc, c, h, mo, y) => mo === (c.m || 0) && (!h || h.y !== y) && who(pc, c.who || 'male'),
    season: (pc, c, h, mo, y) => mo === (c.m || 0) && (!h || h.y !== y) && who(pc, c.who || 'adult'),
  };
  // the tokens each kind's words may use, worked out before the meeting
  FP.PREP = {
    census: (pc, c) => { const n = FP.household(pc); return { n: String(n), due: A.coin(n * (c.per || 1)) }; },
    season: (pc, c) => ({ due: A.coin(Math.min(c.cap || 40, Math.max(1, Math.round(pc.coin * (c.pct || 0.1))))) }),
  };
  // what each kind does when it is kept (quietly, or by the scene's keep choice): returns a line for the log
  const say = (pc, line) => { if (line) { const R = A.realm(pc.realm); A.log(`${R ? R.short + ': ' : ''}${B.fill(pc, line)}`, 'muted'); } };
  const fx = (pc, f) => { if (f) try { A.applyFx(pc, f, {}); } catch (e) { console.error('far custom fx', e); } };
  FP.RUN = {
    exam(pc, c) {
      const odds = A.checkOdds(pc, { s: c.s || 'learning', s2: c.s2 || 'int', d: c.d || 55 });
      const won = A.chance(odds / 100), out = won ? c.pass : c.fail;
      pc.flags = pc.flags || {};
      if (won) pc.flags['fp_exam_' + c.id] = A.S.year;
      if (out) { fx(pc, out[0]); say(pc, out[1]); }
      return won;
    },
    census(pc, c) {
      const n = FP.household(pc), due = Math.min(40, n * (c.per || 1));
      pc.coin = Math.max(0, pc.coin - due);
      if (c.line) say(pc, c.line.replace('{n}', n).replace('{due}', A.coin(due)));
    },
    muster(pc, c) {
      const ok = (B.WHEN[c.need || 'mounted'] || B.WHEN.any)(pc), out = ok ? c.ok : c.short;
      if (out) { fx(pc, out[0]); say(pc, out[1]); }
    },
    season(pc, c) {
      const owe = Math.min(c.cap || 40, Math.max(1, Math.round(pc.coin * (c.pct || 0.1))));
      if (pc.coin >= (c.min || 10)) { pc.coin -= owe; say(pc, c.paid && c.paid.replace('{due}', A.coin(owe))); }
      else { pc.flags = pc.flags || {}; pc.flags.fp_debtor = A.S.year; fx(pc, c.shortFx || { honor: -2 }); say(pc, c.short); }
    },
  };
  FP.month = function (pc) {
    if (!far() || !pc || !pc.alive || !farRealm(pc.realm)) return;
    const S = A.S, mo = A.monthOf(A.today()).m, y = S.year;
    pc.rb = pc.rb && typeof pc.rb === 'object' ? pc.rb : {};
    for (const c of B.mine(pc)) {
      const due = FP.DUE[c.kind];
      if (!due || !A.isAdult(pc) || !due(pc, c, pc.rb[c.id], mo, y)) continue;
      const extra = FP.PREP[c.kind] ? FP.PREP[c.kind](pc, c) : {};
      if (B.hit(pc, c, extra) === 'log') FP.RUN[c.kind](pc, c);
    }
    FP.holyDay(pc, mo, y);
  };
  A.onMonth.push(pc => { try { FP.month(pc); } catch (e) { console.error('far customs month', e); } });
  // the scene's keep choice of a new kind runs it (47's own keep applies c.fx, which these kinds leave empty)
  const applyFx = A.applyFx;
  A.applyFx = function (pc, f, ctx) {
    const r = applyFx.apply(this, arguments);
    try {
      if (f && typeof f === 'object' && f.custom === 'keep' && ctx && ctx.cid && far()) {
        const c = B.custom(ctx.cid);
        if (c && FP.RUN[c.kind]) FP.RUN[c.kind](pc, c);
      }
    } catch (e) { console.error('far custom keep', e); }
    return r;
  };

  // ---- 3. faiths: the holy days of a far faith the realm does not keep, a priest's name, the feast days' names
  FP.days = fid => { const F = (A.FARP_FAITH || {})[fid], d = (A.FARP_DAYS || {})[fid] || []; const out = d.filter(x => x[1] != null).map(x => [cap(low(x[0])), x[1]]); if (F && Array.isArray(F.day) && !out.some(x => x[0] === cap(low(F.day[0])))) out.push([cap(low(F.day[0])), F.day[1]]); return out; };
  FP.priest = p => { const F = p && (A.FARP_FAITH || {})[p.faith]; return F ? F.priest : null; };
  FP.holyDay = function (pc, mo, y) {
    const fid = pc.faith, F = (A.FARP_FAITH || {})[fid];
    if (!F || !A.isAdult(pc)) return;
    const own = B.mine(pc).some(c => c.faith === fid);   // the realm's own holy day is its custom
    if (own) return;
    for (const d of FP.days(fid)) if (d[1] === mo) {
      pc.fpd = pc.fpd && typeof pc.fpd === 'object' ? pc.fpd : {};
      const k = fid + ':' + d[0];
      if (pc.fpd[k] === y) continue;
      pc.fpd[k] = y; pc.piety = Math.min(100, (pc.piety || 0) + 1);
      A.log(`${d[0]}: you keep it as ${F.priest} taught, though few here do.`, 'muted');
    }
  };
  // the release's feast days, by name (a festival, a fair "at {festival}"): in the far lands, the player's own faith's
  // days. A.pick draws once whatever the list's length, so the random stream is the same.
  const desc = Object.getOwnPropertyDescriptor(GD, 'FESTIVALS');
  if (desc && 'value' in desc) {
    let base = desc.value; const memo = {};
    Object.defineProperty(GD, 'FESTIVALS', { configurable: true, enumerable: true,
      get() {
        if (!far()) return base;
        const pc = A.S && A.pc && A.pc(), fid = pc && pc.faith;
        if (!fid || !(A.FARP_FAITH || {})[fid] || !farRealm(pc.realm)) return base;
        if (!memo[fid]) { const d = FP.days(fid); memo[fid] = d.length ? d : base; }
        return memo[fid];
      },
      set(v) { base = v; } });
  }
  // a far orc, dwarf or giant realm keeps its own faith (the release gives every orc the Horde's, every dwarf the Deep Law)
  const faithFor = A.faithFor;
  A.faithFor = function (race, realm) {
    if (far() && farRealm(realm)) { const L = FL.D.realms[realm]; if (L.race === race && L.faith && (A.FARP_FAITH || {})[L.faith]) return L.faith; }
    return faithFor.apply(this, arguments);
  };

  // ---- 2. voices: ids of any length in an event's gate (54 read two digits, so POL-153 read as POL-15), and the far
  // customs' scenes and the far openings are local to the realm's people
  const V = A.VOICE;
  if (V) {
    const gate = V.gate;
    V.gate = function (e) {
      if (!e) return null;
      if (Object.prototype.hasOwnProperty.call(e, '_vg')) return e._vg;
      let s = '';
      try { s = e.cond ? e.cond.toString() : ''; } catch (err) { s = ''; }
      if (!/(POL|CUL)-\d{3}/.test(s)) return gate.apply(this, arguments);   // two-digit ids: 54's own reading, unchanged
      s = s.replace(/!\s*C\.(realm|cult|race)\([^)]*\)/g, '').replace(/\.(realm|cult|race)\s*!==?\s*["'][^"']*["']/g, '');
      const realms = new Set(), cults = new Set(), races = new Set();
      for (const m of s.matchAll(/C\.realm\(\s*p\s*,([^)]*)\)/g)) for (const r of m[1].matchAll(/POL-\d+/g)) realms.add(r[0]);
      for (const m of s.matchAll(/\.realm\s*===?\s*["'](POL-\d+)["']/g)) realms.add(m[1]);
      for (const m of s.matchAll(/\[([^\]]*)\]\s*\.includes\(\s*p\.realm\s*\)/g)) for (const r of m[1].matchAll(/POL-\d+/g)) realms.add(r[0]);
      for (const m of s.matchAll(/C\.cult\(\s*p\s*,([^)]*)\)/g)) for (const r of m[1].matchAll(/CUL-\d+/g)) cults.add(r[0]);
      for (const m of s.matchAll(/\.cult\s*===?\s*["'](CUL-\d+)["']/g)) cults.add(m[1]);
      for (const m of s.matchAll(/C\.race\(\s*p\s*,([^)]*)\)/g)) for (const r of m[1].matchAll(/["'](\w+)["']/g)) races.add(r[1]);
      const g = realms.size || cults.size || races.size ? { realms: [...realms], cults: [...cults], races: [...races] } : null;
      try { Object.defineProperty(e, '_vg', { value: g, enumerable: false, configurable: true, writable: true }); } catch (err) {}
      return g;
    };
    const ec = V.eventCult;
    V.eventCult = function (pc, e) {
      const r = ec.apply(this, arguments);
      if (r || !far() || !pc || !e || !farRealm(pc.realm)) return r;
      if (e.id === 'rb_custom' || /^fp_/.test(e.id)) { const c = V.realmCult(pc.realm); return V.data(c) ? c : null; }
      return r;
    };
  }

  // ---- 2b. the year as a far realm names it: the ruler's reign from the lore (A.FARP_REIGN, "king since 1081") until
  // the throne changes hands in play, the house's years, and the eras the faiths count by (the Ledger's Long Count from
  // 640 BR, the Lamp from Teshur's lamp of about 190, the Cold Gate's wall from the Sundering of about 2400 BR)
  if (V) {
    const reignStart = V.reignStart;
    V.reignStart = function (R) {
      const r = reignStart.apply(this, arguments);
      if (r != null || !far() || !R || !farRealm(R.id)) return r;
      const L = FL.D.realms[R.id], ru = A.P(R.ruler), G = (A.FARP_REIGN || {})[R.id];
      if (!ru || !G || G[0] == null || !L.rulerName) return null;
      // the lore's year is the lore's ruler's: a successor in play has his own in the realm's history
      const given = A.parseCastName ? A.parseCastName(L.rulerName).given : String(L.rulerName).split(' ')[0];
      return ru.given === given ? G[0] : null;
    };
    FP.ERAS = {
      lc: y => y + 640,     // the Long Count of the Ledger
      lamp: y => y - 189,   // the years of Teshur's lamp
      wall: y => y + 2400,  // the Cold Gate's count from the Sundering
    };
    const yearName = V.yearName;
    V.yearName = function (rid, cid) {
      if (!far() || !farRealm(rid)) return yearName.apply(this, arguments);
      const y = A.S.year, D = V.data(cid), R = A.realm(rid), ru = R && A.P(R.ruler), start = V.reignStart(R), G = (A.FARP_REIGN || {})[rid] || [];
      const tok = { y, ru: ru ? ru.given : null, n: start != null && start <= y ? V.ordinal(y - start + 1) : null,
        d: G[1] != null && G[1] <= y ? V.ordinal(y - G[1] + 1) : null, house: G[2] ? G[2].replace(/^The /, 'the ') : null };
      for (const k in FP.ERAS) tok[k] = k === 'lamp' ? V.ordinal(FP.ERAS[k](y)) : String(FP.ERAS[k](y));
      const tries = [].concat((A.FARP_YEAR || {})[cid] || [], D && D.year ? [D.year] : [], ['the {d} year of {house}', 'the {d} year of the dynasty']);
      for (const t of tries) {
        let bad = false;
        const out = String(t).replace(/\{(\w+)\}/g, (m, k) => (tok[k] != null ? tok[k] : (bad = true, m)));
        if (!bad) return out;
      }
      return `the year ${y}`;
    };
  }

  // ---- 5. starts: a far birth opens with a scene of its land, its realm's kind and its rank (fp_start, starts.events.js)
  const newGame = A.newGame;
  A.newGame = function (o) {
    const r = newGame.apply(this, arguments);
    try {
      const pc = A.pc();
      if (far() && pc && farRealm(pc.realm) && !(A.S.story && A.S.story.id) && !(o && o.noStart)) {
        pc.flags = pc.flags || {};
        pc.flags.fp_start = A.S.year;
        // queued when the clock first runs, not at birth: the release keeps Play disabled while anything is queued
        A.S.fpStartDue = 1;
      }
    } catch (e) { console.error('far start', e); }
    return r;
  };
  const advance = A.advance;
  A.advance = function () {
    try {
      const S = A.S;
      if (S && S.fpStartDue) { delete S.fpStartDue; const pc = A.pc(); if (pc && pc.alive) A.queue({ type: 'event', ev: 'fp_start', forced: true }); }
    } catch (e) { console.error('far start', e); }
    return advance.apply(this, arguments);
  };
  FP.land = pc => { const L = pc && FL.D.realms[pc.realm]; return L ? L.land : null; };
  FP.type = pc => { const L = pc && FL.D.realms[pc.realm]; return L ? L.type : null; };

  // ---- 6. far people in the people views (55, 41, 64 draw UI.personModal): their people, their faith's practice,
  // their manners. Pure: it reads the person and the data.
  const esc = s => (UI.esc ? UI.esc(s) : String(s));
  FP.personHtml = function (t) {
    if (!far() || !t || !t.cult || !(FL.D.cultures || {})[t.cult]) return '';
    const C = LORE.cultures[t.cult] || {}, Vd = V && V.data(t.cult), F = (A.FARP_FAITH || {})[t.faith], lines = [];
    if (Vd) lines.push(`${C.name || 'Their people'}: greets you "${V.fill(t.cult, Vd.greet) || ''}" and swears "${V.fill(t.cult, Vd.oath) || ''}"`);
    if (F) { const fn = (LORE.faiths[t.faith] || {}).name || 'the faith', fc = FP.faithCustom(t.faith), dn = fc && low(fc.name) !== low(fn) ? low(fc.name) + ' in ' + FP.MONTHS[fc.m] + ', when the household ' : 'every year the household '; lines.push(`Keeps ${low(fn)}: ${dn}${F.rite}; looks to ${F.priest}`); }
    const cc = (A.FARP_CULT || {})[t.cult];
    if (cc && cc.length) { const c = FP.custom(cc[V ? V.hash(t.id, 'fpm') % cc.length : 0]); const r = V ? V.fill(t.cult, c.rule) : c.rule; if (r) lines.push('Their manners: ' + r.replace(/\.$/, '')); }
    const food = (A.FARP_FOOD || {})[t.cult];
    if (food) lines.push(`Eats ${food}`);
    return lines.length ? `<div class="fp-person"><div class="group-h">Their people</div>${lines.map(l => `<div class="small prof-li">${esc(/[.!?"]$/.test(l) ? l : l + '.')}</div>`).join('')}</div>` : '';
  };
  if (typeof UI.personModal === 'function') {
    const pm = UI.personModal;
    UI.personModal = function (t) {
      const h = pm.apply(this, arguments);
      try {
        const block = FP.personHtml(t); if (!block || typeof h !== 'string') return h;
        const at = h.indexOf('<div class="group-h">Between you</div>');
        if (at >= 0) return h.slice(0, at) + block + h.slice(at);
        const end = h.lastIndexOf('</div>');
        return end > 0 ? h.slice(0, end) + block + h.slice(end) : h + block;
      } catch (e) { return h; }
    };
  }

  // ---- 7. the powers inside a far realm (56-realm-inside's factions, named as the realm would): a Realm tab card
  FP.powers = rid => { const P = A.FARP_POWERS || {}, L = FL.D.realms[rid]; return P[rid] || (L && P.TYPE && P.TYPE[L.type]) || null; };
  // a faction's name as its realm would say it (for a one-line hook in 56's view.core.js facName, and the release's
  // eight A.FACTIONS[f.kind].name): null outside a far realm, so every other faction keeps its name
  FP.factionName = A.FARP_POWERS_NAME = function (f) {
    if (!far() || !f || !farRealm(f.realm)) return null;
    const P = FP.powers(f.realm), p = P && P[f.kind];
    return p ? p[0].charAt(0).toUpperCase() + p[0].slice(1) : null;
  };
  FP.powersCard = function (pc) {
    const R = pc && A.realm(pc.realm);
    if (!far() || !R || !farRealm(R.id)) return '';
    const P = FP.powers(R.id); if (!P) return '';
    const live = (A.S.factions || []).filter(f => f && f.realm === R.id);
    const row = k => { const p = P[k]; if (!p) return ''; const f = live.find(x => x.kind === k), lead = f && A.S.houses && A.S.houses[f.leader];
      return `<div class="tiny"><b>${esc(p[0].charAt(0).toUpperCase() + p[0].slice(1))}</b> want ${esc(p[1])}.${f ? ` <span class="muted">(a ${esc(((A.FACTIONS || {})[k] || {}).name || k)} stands: ${esc(String((f.members || []).length))} houses${lead ? ', led by ' + esc(lead.name) : ''}, discontent ${esc(String(Math.round(f.discontent || 0)))})</span>` : ''}</div>`; };
    return `<div class="card small fp-powers" aria-label="The powers of ${esc(R.short)}"><b>The powers of ${esc(R.short)}</b>` +
      ['peace', 'liberty', 'war', 'claimant', 'independence'].map(row).join('') + `</div>`;
  };
  const realmTab = UI.TAB && UI.TAB.realm;
  if (typeof realmTab === 'function') UI.TAB.realm = function (pc) {
    const h = realmTab.apply(this, arguments);
    try { const c = pc && pc.alive ? FP.powersCard(pc) : ''; return c ? h + c : h; } catch (e) { return h; }
  };

  // ---- 8. one world: each half's voices carry what it believes of the other, and the stories told at one end of the
  // chain of hands about the other are secrets with a truth (26-belief-truth). In a Great Continent game only.
  if (V) {
    const lines = V.lines;
    V.lines = function (cid, extra) {
      const out = lines.apply(this, arguments);
      if (!far()) return out;
      const land = (FL.D.cultures[cid] || {}).land, add = (A.FARP_WEST || {})[cid] || (land && (A.FARP_EAST || {})[land]) || [];
      add.forEach((ln, i) => { const text = V.fill(cid, ln[0], extra); if (text) out.push({ key: cid + ':w' + i, text, topics: String(ln[1] || '').split(' '), kind: 'line' }); });
      return out;
    };
  }
  const install = FL.install, uninstall = FL.uninstall;
  FL.install = function () {
    const was = FL.active, r = install.apply(this, arguments);
    try { if (!was && FL.active && Array.isArray(LORE.secrets)) for (const x of A.FARP_SECRETS || []) if (!LORE.secrets.some(s => s.id === x.id)) LORE.secrets.push(x); } catch (e) {}
    return r;
  };
  FL.uninstall = function () {
    const r = uninstall.apply(this, arguments);
    try { if (!FL.active && Array.isArray(LORE.secrets)) { const ids = new Set((A.FARP_SECRETS || []).map(x => x.id)); for (let i = LORE.secrets.length - 1; i >= 0; i--) if (ids.has(LORE.secrets[i].id)) LORE.secrets.splice(i, 1); } } catch (e) {}
    return r;
  };
  // a far game already open when this file runs (never at boot, but a hot reload) gets its secrets too
  if (FL.active && Array.isArray(LORE.secrets)) for (const x of A.FARP_SECRETS || []) if (!LORE.secrets.some(s => s.id === x.id)) LORE.secrets.push(x);

  FP.build();
})();
