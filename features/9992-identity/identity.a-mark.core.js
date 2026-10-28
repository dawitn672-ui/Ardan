// 9992-identity, part 1: your mark (design review cycle 1, #14). Arms you design (field, a second tincture, an
// ordinary, a charge and a motto), the things you love named (a dog, a horse, a blade, a ship) and remembered, and your
// epithet shown the day you earn it.
//
// State (all new fields; an old save simply has none of them):
//   pc.mark  = { f, f2, c, ch, ord, words, y }      personal arms, as tincture ids and a charge id (never markup)
//   house.ord, house.f2                              the same two extras on a house you head (colors/charge/words are the release's)
//   pc.named = { dog|horse|blade|ship: { n, y, k, deeds: [{ y, t }], b0, k0 }, past: [{ kind, n, y0, y1, how }] }
//   pc.idEp  = [{ e, y }]                            the epithets you have been called, in order
// Commands that change state from the screen (A.idSetArms, A.idName) are journaled, so a replay reaches the same world.
// Drawing only reads.
(function () {
  const ID = A.ID = A.ID || {};
  const esc = s => UI.esc(String(s == null ? '' : s));
  const hash = ID.hash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  ID.pickBy = (arr, key) => arr[hash(key) % arr.length];

  // ---- arms -------------------------------------------------------------------------------------------------------
  // the tinctures in the woodblock palette (94-woodblock-skies' pigments; 91's ink for the line)
  ID.TINCT = {
    gules: ['Red', '#b83a26'], azure: ['Blue', '#2f5aa8'], vert: ['Green', '#3f7a34'], sable: ['Black', '#2a2533'],
    purpure: ['Purple', '#5a3a7e'], tenne: ['Tawny', '#a8622a'], or: ['Gold', '#e2ad45'], argent: ['White', '#efe6d2'],
  };
  ID.INK = '#1b1730';
  const hexOf = t => (ID.TINCT[t] ? ID.TINCT[t][1] : /^#[0-9a-f]{6}$/i.test(String(t || '')) ? t : null);
  const tinctOf = hex => { for (const k in ID.TINCT) if (ID.TINCT[k][1].toLowerCase() === String(hex || '').toLowerCase()) return k; return null; };
  // ordinaries and divisions, drawn in the second tincture inside the 40 x 46 shield of PORTRAIT.coat
  ID.ORD = {
    none: ['Plain', ''],
    chief: ['A chief', '<rect x="0" y="0" width="40" height="13"/>'],
    fess: ['A fess', '<rect x="0" y="16" width="40" height="11"/>'],
    pale: ['A pale', '<rect x="14" y="0" width="12" height="46"/>'],
    bend: ['A bend', '<path d="M-4 6 L6 -4 L46 36 L36 46 Z"/>'],
    chevron: ['A chevron', '<path d="M0 34 L20 14 L40 34 L40 44 L20 24 L0 44 Z"/>'],
    cross: ['A cross', '<rect x="15" y="0" width="10" height="46"/><rect x="0" y="16" width="40" height="10"/>'],
    saltire: ['A saltire', '<path d="M-4 4 L4 -4 L44 40 L36 48 Z"/><path d="M44 4 L36 -4 L-4 40 L4 48 Z"/>'],
    perpale: ['Party per pale', '<rect x="20" y="0" width="20" height="46"/>'],
    perfess: ['Party per fess', '<rect x="0" y="21" width="40" height="25"/>'],
    quarterly: ['Quarterly', '<rect x="20" y="0" width="20" height="21"/><rect x="0" y="21" width="20" height="25"/>'],
    bordure: ['A bordure', '<path d="M3 3 L37 3 L37 20 Q37 36 20 44 Q3 36 3 20 Z M8 8 L8 20 Q8 32 20 38.5 Q32 32 32 20 L32 8 Z" fill-rule="evenodd"/>'],
  };
  ID.CHARGES = () => Object.keys((typeof PORTRAIT !== 'undefined' && PORTRAIT.charges) || {});
  ID.WORDS_MAX = 40;
  // a motto, a name: letters (any script), spaces, an apostrophe or hyphen, a comma or full stop; nothing SAVES.clean strips
  ID.cleanText = (s, max) => String(s == null ? '' : s).normalize('NFC').replace(/[^\p{L}\p{M} '’,.\-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, max || 24);

  // the house you head, if any (its arms are yours to change)
  ID.ownHouse = pc => { const h = pc && pc.house && A.S.houses ? A.S.houses[pc.house] : null; return h && h.headPid === pc.id ? h : null; };
  // the arms that stand for you: the house you head, else your own device, else your family's house
  ID.arms = function (pc) {
    if (!pc) return null;
    const own = ID.ownHouse(pc), m = pc.mark;
    if (own) return { f: own.colors && own.colors[0], c: own.colors && own.colors[1], ch: own.charge || 'chevron', ord: own.ord || 'none', f2: own.f2 || null, words: own.words || '', house: own.name, mine: true };
    if (m && typeof m === 'object') return { f: hexOf(m.f) || '#5a4a3a', c: hexOf(m.c) || '#d4a63a', ch: m.ch || 'chevron', ord: m.ord || 'none', f2: hexOf(m.f2), words: m.words || '', house: null, mine: true };
    const h = pc.house && A.S.houses ? A.S.houses[pc.house] : null;
    if (h) return { f: h.colors && h.colors[0], c: h.colors && h.colors[1], ch: h.charge || 'chevron', ord: h.ord || 'none', f2: h.f2 || null, words: h.words || '', house: h.name, mine: false };
    return null;
  };
  // the arms as the house-shaped object PORTRAIT.coat draws
  ID.coatObj = a => a ? { colors: [a.f || '#5a4a3a', a.c || '#d4a63a'], charge: a.ch, ord: a.ord, f2: a.f2 } : null;

  // PORTRAIT.coat, taught the ordinary: a house or device that carries one (only arms made here do) is drawn with the
  // division in its second tincture, clipped to the shield, under the charge, with 91's ink line round the whole.
  if (typeof PORTRAIT !== 'undefined' && typeof PORTRAIT.coat === 'function') {
    const coat0 = ID.coat0 = PORTRAIT.coat;
    PORTRAIT.coat = function (h, size = 40) {
      if (!h || !h.ord || h.ord === 'none' || !ID.ORD[h.ord]) return coat0.apply(this, arguments);
      try {
        const f = h.colors && h.colors[0] || '#5a4a3a', c = h.colors && h.colors[1] || '#d4a63a', f2 = hexOf(h.f2) || c;
        const id = 'idc' + hash([f, c, f2, h.ord, h.charge].join('|')).toString(36);
        const shield = 'M3 3 L37 3 L37 20 Q37 36 20 44 Q3 36 3 20 Z';
        return `<svg viewBox="0 0 40 46" width="${size}" height="${Math.round(size * 1.15)}" class="coat id-coat" data-ord="${esc(h.ord)}"><defs><clipPath id="${id}"><path d="${shield}"/></clipPath></defs>` +
          `<path d="${shield}" fill="${esc(f)}"/><g clip-path="url(#${id})" fill="${esc(f2)}">${ID.ORD[h.ord][1]}</g>` +
          (PORTRAIT.device ? PORTRAIT.device({ f, c, ch: h.charge || 'chevron' }, 20, 21, 1.15) : '') +
          `<path d="${shield}" fill="none" stroke="${ID.INK}" stroke-width="2" stroke-linejoin="round"/></svg>`;
      } catch (e) { return coat0.apply(this, arguments); }
    };
  }
  ID.coatSvg = (pc, size) => { const a = ID.arms(pc); return a && typeof PORTRAIT !== 'undefined' ? PORTRAIT.coat(ID.coatObj(a), size || 40) : ''; };

  // a first device, by the person's id (not drawn by dice): the starting point of the designer
  ID.seedMark = function (pc) {
    const ks = Object.keys(ID.TINCT), cols = ks.slice(0, 6), mets = ['or', 'argent'], chs = ID.CHARGES();
    const k = 'mark|' + pc.id;
    return { f: ID.pickBy(cols, k + 'f'), f2: ID.pickBy(mets, k + 'f2'), c: ID.pickBy(mets, k + 'c'), ch: chs.length ? ID.pickBy(chs, k + 'ch') : 'chevron', ord: 'none', words: '' };
  };

  // the command: set one part of your arms. part: f | f2 | c | ch | ord | words. Writes the house you head, or your device.
  A.idSetArms = function (part, val) {
    const pc = A.pc();
    if (!pc || !pc.alive || !['f', 'f2', 'c', 'ch', 'ord', 'words'].includes(part)) return false;
    if (['f', 'f2', 'c'].includes(part) && !ID.TINCT[val]) return false;
    if (part === 'ch' && !ID.CHARGES().includes(val)) return false;
    if (part === 'ord' && !ID.ORD[val]) return false;
    if (part === 'words') val = ID.cleanText(val, ID.WORDS_MAX);
    const own = ID.ownHouse(pc);
    if (own) {
      own.colors = Array.isArray(own.colors) ? own.colors.slice(0, 2) : ['#5a4a3a', '#d4a63a'];
      if (part === 'f') own.colors[0] = hexOf(val); else if (part === 'c') own.colors[1] = hexOf(val);
      else if (part === 'f2') own.f2 = hexOf(val); else if (part === 'ch') own.charge = val; else if (part === 'ord') own.ord = val; else own.words = val || own.words;
    }
    if (!pc.mark || typeof pc.mark !== 'object') pc.mark = ID.seedMark(pc);
    pc.mark[part] = val;
    pc.mark.y = A.S.year;
    return true;
  };
  A.COMMANDS.push('idSetArms', 'idName');

  // a house founded with a device in hand takes the device (the release picks colours and a charge by the dice; the
  // dice are still drawn, so the stream is the same either way)
  const DEC = A.DEC && A.DEC.found_house;
  if (DEC && typeof DEC.run === 'function') {
    const run0 = DEC.run;
    DEC.run = function (pc) {
      const r = run0.apply(this, arguments);
      try {
        const h = ID.ownHouse(pc), m = pc.mark;
        if (h && m) { h.colors = [hexOf(m.f) || h.colors[0], hexOf(m.c) || h.colors[1]]; if (m.ch) h.charge = m.ch; h.ord = m.ord || 'none'; h.f2 = hexOf(m.f2); if (m.words) h.words = m.words; }
      } catch (e) { console.error('identity house', e); }
      return r;
    };
  }

  // ---- named things -------------------------------------------------------------------------------------------------
  // what can be named, how you come to have one, and the names offered (by hash of the person and the year)
  ID.KINDS = {
    dog: { word: 'dog', has: pc => true, names: ['Brindle', 'Ash', 'Tuck', 'Fen', 'Rook', 'Bramble', 'Mud', 'Hob', 'Sorrel', 'Grip', 'Whitefoot', 'Bel', 'Moss', 'Cinder'] },
    horse: { word: 'horse', has: pc => !!(pc.gear && pc.gear.mount), key: pc => pc.gear && pc.gear.mount,
      names: ['Ashgrey', 'Burnet', 'Lark', 'Thistle', 'Morel', 'Blackthorn', 'Sable', 'Wend', 'Hazel', 'Duncan', 'Starling', 'Gale', 'Barley', 'Corbie'] },
    blade: { word: 'blade', has: pc => !!(pc.gear && pc.gear.weapon && pc.gear.weapon !== 'fists'), key: pc => pc.gear && pc.gear.weapon,
      names: ['Wasp', 'Mercy', 'Long Answer', 'Thorn', 'Widow', 'Plain Truth', 'Gallows', 'Little Sister', 'Keel', 'Sorrow', 'Hearthward', 'Last Word'] },
    ship: { word: 'ship', has: pc => (pc.assets || []).some(a => a && GD.PROPERTY && GD.PROPERTY[a.k] && /boat|barge|cog|galley/.test(a.k)),
      key: pc => { const a = (pc.assets || []).find(a => a && /fishboat|barge|cog|galley/.test(a.k)); return a ? a.k : null; },
      names: ['Patience', 'Grey Gull', 'Saint Odo', 'Good Hope', 'Dunlin', 'Fair Margery', 'Heron', 'Second Chance', 'Morrow', 'Thrift', 'Blessing', 'Cormorant'] },
  };
  ID.named = (pc, kind) => { const t = pc && pc.named && pc.named[kind]; return t && typeof t === 'object' && t.n ? t : null; };
  ID.offer = (pc, kind, i) => { const L = ID.KINDS[kind].names, h = hash(`${pc.id}|${kind}|${pc.named && pc.named.past ? pc.named.past.length : 0}`); return L[(h + i * 5) % L.length]; };
  ID.yearsWith = (pc, kind) => { const t = ID.named(pc, kind); return t ? A.S.year - t.y : 0; };
  ID.deed = function (pc, kind, text) {
    const t = ID.named(pc, kind);
    if (!t) return;
    t.deeds = Array.isArray(t.deeds) ? t.deeds : [];
    t.deeds.push({ y: A.S.year, t: String(text).slice(0, 140) });
    if (t.deeds.length > 12) t.deeds.splice(0, t.deeds.length - 12);
  };
  // the end of a named thing: kept in pc.named.past, and in your deeds when it was loved long enough
  ID.lose = function (pc, kind, how) {
    const t = ID.named(pc, kind);
    if (!t) return null;
    pc.named.past = Array.isArray(pc.named.past) ? pc.named.past : [];
    const rec = { kind, n: t.n, y0: t.y, y1: A.S.year, how: how || 'gone', deeds: (t.deeds || []).length };
    pc.named.past.push(rec);
    if (pc.named.past.length > 20) pc.named.past.shift();
    delete pc.named[kind];
    const yrs = rec.y1 - rec.y0;
    if (how === 'died' && pc.deeds) pc.deeds.push({ y: A.S.year, t: `Buried ${rec.n}, the ${ID.KINDS[kind].word} who was with you ${yrs > 1 ? yrs + ' years' : 'a year'}` });
    return rec;
  };
  // the command: name (or rename) a thing you have. Journaled.
  A.idName = function (kind, name) {
    const pc = A.pc(), K = ID.KINDS[kind];
    if (!pc || !pc.alive || !K) return false;
    const n = ID.cleanText(name, 24);
    if (!n) return false;
    if (kind !== 'dog' && !K.has(pc)) return false;
    pc.named = pc.named && typeof pc.named === 'object' ? pc.named : {};
    const t = ID.named(pc, kind);
    if (t) { t.n = n; return true; }
    pc.named[kind] = { n, y: A.S.year, k: K.key ? K.key(pc) : null, deeds: [], b0: ID.battles(pc), k0: pc.kills || 0 };
    return true;
  };
  ID.battles = pc => ((pc.mil && pc.mil.battles) || (pc.veteran && pc.veteran.battles) || 0);

  // fx keys: name: { kind, i } names a thing with the i-th offered name; named: { kind, deed } writes a deed; lose: { kind, how }
  (A.FX_EXTRA = A.FX_EXTRA || []).push('name', 'named', 'lose');
  const apply0 = A.applyFx;
  A.applyFx = function (pc, fx, ctx) {
    const r = apply0.apply(this, arguments);
    try {
      if (fx && typeof fx === 'object' && pc) {
        if (fx.name && ID.KINDS[fx.name.kind]) {
          pc.named = pc.named && typeof pc.named === 'object' ? pc.named : {};
          if (!ID.named(pc, fx.name.kind)) pc.named[fx.name.kind] = { n: ID.offer(pc, fx.name.kind, fx.name.i || 0), y: A.S.year, k: ID.KINDS[fx.name.kind].key ? ID.KINDS[fx.name.kind].key(pc) : null, deeds: [], b0: ID.battles(pc), k0: pc.kills || 0 };
        }
        if (fx.named && fx.named.kind && fx.named.deed) ID.deed(pc, fx.named.kind, A.T(fx.named.deed, A.ctxTokens(pc, ctx || {})));
        if (fx.lose && fx.lose.kind) ID.lose(pc, fx.lose.kind, fx.lose.how);
      }
    } catch (e) { console.error('identity fx', e); }
    return r;
  };

  // tokens: {dog} {horse} {blade} {ship} while you have one by name (an event that uses one is dropped otherwise),
  // {dogYears} and kin, {arms} (the charge in words), {words} (your motto), {epithet}
  const tok0 = A.ctxTokens;
  A.ctxTokens = function (pc) {
    const o = tok0.apply(this, arguments);
    try {
      if (o && pc) {
        for (const k in ID.KINDS) { const t = ID.named(pc, k); if (t && o[k] == null) { o[k] = t.n; o[k + 'Years'] = String(Math.max(1, A.S.year - t.y)); } }
        const a = ID.arms(pc);
        if (a && a.mine && o.words == null && a.words) o.words = a.words;
        if (a && o.arms == null) o.arms = ID.blazon(a);
        if (pc.epithet && o.epithet == null) o.epithet = pc.epithet;
      }
    } catch (e) {}
    return o;
  };
  ID.blazon = function (a) {
    const t = hex => { const k = tinctOf(hex); return k ? ID.TINCT[k][0].toLowerCase() : 'coloured'; };
    const ch = String(a.ch || 'chevron');
    return `a ${t(a.c)} ${ch} on ${t(a.f)}${a.ord && a.ord !== 'none' && ID.ORD[a.ord] ? ', ' + ID.ORD[a.ord][0].toLowerCase().replace(/^a |^party /, '') + ' ' + t(a.f2) : ''}`;
  };

  // each month: a named thing that left (the horse sold, the blade swapped) is set down as gone; deeds of horse and blade
  // counted from battles and kills; an epithet noticed the month it is earned, with a scene to say so
  ID.month = function (pc) {
    if (!pc || !pc.alive) return;
    if (pc.named && typeof pc.named === 'object') {
      for (const k of ['horse', 'blade', 'ship']) {
        const t = ID.named(pc, k), K = ID.KINDS[k];
        if (!t) continue;
        const now = K.key(pc);
        if (!now) ID.lose(pc, k, k === 'ship' ? 'sold or lost' : 'parted with');
        else if (t.k && now !== t.k) ID.lose(pc, k, 'set aside for another');
      }
      const h = ID.named(pc, 'horse'), b = ID.named(pc, 'blade'), nb = ID.battles(pc), nk = pc.kills || 0;
      if (h && nb > (h.b0 || 0)) { const d = nb - (h.b0 || 0); h.b0 = nb; h.battles = (h.battles || 0) + d; }
      if (b && nk > (b.k0 || 0)) { const d = nk - (b.k0 || 0); b.k0 = nk; b.kills = (b.kills || 0) + d; }
    }
    // the epithet: the first month a life is seen (a new life, an old save) what it is already called is noted quietly;
    // a name earned after that gets its scene
    const ep = pc.epithet ? String(pc.epithet).slice(0, 40) : '';
    if (!Array.isArray(pc.idEp)) { pc.idEp = ep ? [{ e: ep, y: A.S.year }] : []; return; }
    const last = pc.idEp[pc.idEp.length - 1];
    if (ep && (!last || last.e !== ep)) {
      pc.idEp.push({ e: ep, y: A.S.year });
      if (pc.idEp.length > 8) pc.idEp.shift();
      if (A.EV.ix_epithet && !A.S.queue.some(q => q && q.ev === 'ix_epithet')) A.queue({ type: 'event', ev: 'ix_epithet', ctx: { ep } });
    }
  };
  A.onMonth.push(pc => { try { ID.month(pc); } catch (e) { console.error('identity', e); } });

  // ---- on screen ----------------------------------------------------------------------------------------------------
  // the Life tab's "Your mark" card: arms and motto, the epithet and what you were called before, the things you love
  ID.thingLine = function (pc, k) {
    const t = ID.named(pc, k);
    if (!t) return '';
    const yrs = Math.max(0, A.S.year - t.y), bits = [yrs < 1 ? 'since this year' : `${yrs} year${yrs === 1 ? '' : 's'}`];
    if (t.battles) bits.push(`${t.battles} battle${t.battles > 1 ? 's' : ''}`);
    if (t.kills) bits.push(`${t.kills} foe${t.kills > 1 ? 's' : ''}`);
    const last = t.deeds && t.deeds.length ? t.deeds[t.deeds.length - 1] : null;
    return `<li class="id-thing"><span class="id-kind">${esc(ID.KINDS[k].word)}</span> <b>${esc(t.n)}</b> <span class="tiny muted">${esc(bits.join(' · '))}</span>` +
      `${last ? `<div class="tiny muted id-deed">${esc(last.t)}</div>` : ''}</li>`;
  };
  ID.panel = function (pc) {
    if (ID.OFF || !pc || !pc.alive || A.age(pc) < 6) return '';
    const a = ID.arms(pc), coat = a ? ID.coatSvg(pc, 48) : '';
    const things = Object.keys(ID.KINDS).map(k => ID.thingLine(pc, k)).filter(Boolean);
    const unnamed = Object.keys(ID.KINDS).filter(k => k !== 'dog' && !ID.named(pc, k) && ID.KINDS[k].has(pc));
    const past = pc.named && Array.isArray(pc.named.past) ? pc.named.past.slice(-3) : [];
    const eps = Array.isArray(pc.idEp) ? pc.idEp : [];
    const thoughts = ID.thoughtsLine ? ID.thoughtsLine(pc) : '';
    let h = `<section class="card id-mark" aria-labelledby="id-mark-h"><div class="row id-mark-top">` +
      `<span class="id-coat-wrap" aria-hidden="true">${coat || '<span class="id-coat-none"></span>'}</span>` +
      `<div class="grow"><h3 id="id-mark-h" class="id-h">Your mark</h3>` +
      (a ? `<div class="small">${a.words ? `<i>“${esc(a.words)}”</i>` : '<span class="muted">No motto yet</span>'}${a.house ? ` <span class="tiny muted">· ${esc(a.house)}</span>` : ''}</div>` : '<div class="small muted">No arms of your own yet.</div>') +
      (pc.epithet ? `<div class="small">Called <b>${esc(pc.epithet)}</b>${eps.length > 1 ? ` <span class="tiny muted">(before: ${esc(eps.slice(0, -1).map(x => x.e).join(', '))})</span>` : ''}</div>` : '') +
      `</div><button class="small" data-a="idArms">${a && a.mine ? 'Change your arms' : 'Design your arms'}</button></div>`;
    if (things.length) h += `<ul class="id-things">${things.join('')}</ul>`;
    if (unnamed.length) h += `<div class="tiny muted">${unnamed.map(k => `<button class="small ghost" data-a="idNameOpen" data-v="${esc(k)}">Name your ${esc(ID.KINDS[k].word)}</button>`).join(' ')}</div>`;
    if (past.length) h += `<div class="tiny muted id-past">Remembered: ${esc(past.map(r => `${r.n} (${r.kind}, ${r.y0}–${r.y1})`).join('; '))}</div>`;
    if (thoughts) h += thoughts;
    return h + '</section>';
  };

  // the arms designer: an overlay over whatever is open (an event stays where it was)
  ID.designer = function () {
    const pc = A.pc();
    if (!pc) return '';
    const own = ID.ownHouse(pc), house = !own && pc.house && A.S.houses ? A.S.houses[pc.house] : null;
    const m = pc.mark && typeof pc.mark === 'object' ? pc.mark : ID.seedMark(pc);
    const a = ID.arms(pc) || { f: hexOf(m.f), c: hexOf(m.c), ch: m.ch, ord: m.ord, f2: hexOf(m.f2), words: m.words };
    const cur = { f: tinctOf(a.f) || m.f, f2: tinctOf(a.f2) || m.f2, c: tinctOf(a.c) || m.c, ch: a.ch, ord: a.ord || 'none' };
    const preview = typeof PORTRAIT !== 'undefined' ? PORTRAIT.coat(ID.coatObj(a.f ? a : { f: hexOf(m.f), c: hexOf(m.c), ch: m.ch, ord: m.ord, f2: hexOf(m.f2) }), 120) : '';
    const sw = (part, k) => `<button class="id-sw${cur[part] === k ? ' sel' : ''}" data-a="idArm" data-v="${part}:${k}" aria-pressed="${cur[part] === k}" title="${esc(ID.TINCT[k][0])}"><i style="background:${ID.TINCT[k][1]}"></i><span>${esc(ID.TINCT[k][0])}</span></button>`;
    const row = (label, part) => `<div class="id-row"><div class="id-lab">${label}</div><div class="id-opts">${Object.keys(ID.TINCT).map(k => sw(part, k)).join('')}</div></div>`;
    const ordB = k => `<button class="id-op${cur.ord === k ? ' sel' : ''}" data-a="idArm" data-v="ord:${k}" aria-pressed="${cur.ord === k}" title="${esc(ID.ORD[k][0])}">${PORTRAIT.coat({ colors: [hexOf(cur.f), hexOf(cur.c)], charge: 'none', ord: k, f2: hexOf(cur.f2) || hexOf(cur.c) }, 26)}<span>${esc(ID.ORD[k][0])}</span></button>`;
    const chB = k => `<button class="id-op${cur.ch === k ? ' sel' : ''}" data-a="idArm" data-v="ch:${k}" aria-pressed="${cur.ch === k}" title="${esc(k)}">${PORTRAIT.coat({ colors: [hexOf(cur.f), hexOf(cur.c)], charge: k }, 26)}<span>${esc(k)}</span></button>`;
    const words = a.words || m.words || '';
    return `<div class="panel mbox wide id-designer" role="document"><button class="ghost closex" data-a="closeOv" aria-label="Close">${UI.icon ? UI.icon('x', 'm') : '×'}</button>` +
      `<div class="row id-d-head"><div class="id-d-prev" aria-hidden="true">${preview}</div><div class="grow"><h2>Your arms</h2>` +
      `<div class="small muted">${own ? `The arms of ${esc(own.name)}, which you head. Every banner of the house will carry them.` : house ? `You bear ${esc(house.name)}'s arms by birth; this is your own device, for the day you found a house or win your spurs.` : 'Your own device. Found a house and the heralds will register it as the house\'s arms.'}</div>` +
      `<div class="small id-blazon">${esc(A.cap ? A.cap(ID.blazon(a)) : ID.blazon(a))}</div></div></div>` +
      row('Field', 'f') +
      `<div class="id-row"><div class="id-lab">Division</div><div class="id-opts id-grid">${Object.keys(ID.ORD).map(ordB).join('')}</div></div>` +
      (cur.ord !== 'none' ? row('Its tincture', 'f2') : '') +
      `<div class="id-row"><div class="id-lab">Charge</div><div class="id-opts id-grid">${ID.CHARGES().map(chB).join('')}</div></div>` +
      row('Charge tincture', 'c') +
      `<div class="id-row"><label class="id-lab" for="idWords">Motto</label><div class="id-opts row"><input id="idWords" maxlength="${ID.WORDS_MAX}" value="${esc(words)}" placeholder="We Made Ourselves" style="flex:1"><button class="small" data-a="idWords">Set the motto</button></div></div>` +
      `<div class="choices"><button class="primary" data-a="closeOv">Done</button></div></div>`;
  };
  ID.namer = function (kind) {
    const pc = A.pc(), K = ID.KINDS[kind];
    if (!pc || !K) return '';
    const t = ID.named(pc, kind);
    const offers = [0, 1, 2, 3].map(i => ID.offer(pc, kind, i));
    return `<div class="panel mbox id-namer"><button class="ghost closex" data-a="closeOv" aria-label="Close">${UI.icon ? UI.icon('x', 'm') : '×'}</button>` +
      `<h2>Name your ${esc(K.word)}</h2><div class="field"><label for="idThing">A name, in letters</label><div class="row"><input id="idThing" maxlength="24" value="${esc(t ? t.n : '')}" style="flex:1"><button class="primary" data-a="idNameSet" data-v="${esc(kind)}">Name</button></div>` +
      `<div class="row" style="margin-top:6px">${offers.map(n => `<button class="small" data-a="idNamePick" data-v="${esc(kind)}|${esc(n)}">${esc(n)}</button>`).join('')}</div></div></div>`;
  };
  UI.SYS_OV = UI.SYS_OV || [];
  for (const k of ['idArms', 'idName']) if (!UI.SYS_OV.includes(k)) UI.SYS_OV.push(k);
  const ov0 = UI.ovModal;
  UI.ovModal = function (ov) {
    if (ov && ov.type === 'idArms') return ID.designer();
    if (ov && ov.type === 'idName') return ID.namer(ov.kind);
    return ov0.apply(this, arguments);
  };
  const redraw = sel => { UI.renderModal(); UI.refresh && UI.refresh(); const el = sel && document.querySelector(sel); if (el) try { el.focus({ preventScroll: true }); } catch (e) {} };
  Object.assign(UI.A, {
    idArms() { UI.ov = { type: 'idArms' }; UI.renderModal(); },
    idArm(v) { const [part, val] = String(v || '').split(':'); if (A.idSetArms(part, val)) redraw(`#modal [data-v="${part}:${val}"]`); },
    idWords() { const el = document.getElementById('idWords'); if (el && A.idSetArms('words', el.value)) { redraw('#idWords'); UI.toast && UI.toast('The motto is set.'); } },
    idNameOpen(v) { UI.ov = { type: 'idName', kind: String(v) }; UI.renderModal(); },
    idNameSet(v) { const el = document.getElementById('idThing'); if (el && A.idName(String(v), el.value)) { UI.ov = null; UI.renderModal(); UI.refresh && UI.refresh(); UI.toast && UI.toast('Named.'); } },
    idNamePick(v) { const [k, n] = String(v || '').split('|'); if (A.idName(k, n)) { UI.ov = null; UI.renderModal(); UI.refresh && UI.refresh(); } },
  });

  // the Life tab: the card after the ambition (or at the foot)
  const life = UI.TAB && UI.TAB.life;
  if (typeof life === 'function') UI.TAB.life = function (pc) {
    const h = life.apply(this, arguments);
    try {
      if (typeof h !== 'string' || h.indexOf('id-mark') >= 0) return h;
      const s = ID.panel(pc || A.pc());
      return s ? h + s : h;
    } catch (e) { console.error('identity panel', e); return h; }
  };

  const CSS = `.id-mark{padding:10px 12px;margin-top:8px}
.id-mark-top{gap:10px;align-items:center}
.id-coat-wrap svg{display:block}
.id-coat-none{display:block;width:48px;height:55px;border:1px dashed var(--line-strong);border-radius:4px 4px 50% 50%}
.id-h{margin:0;font-size:var(--t-cap,12px);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-2)}
.id-things{list-style:none;margin:6px 0 2px;padding:0;display:flex;flex-direction:column;gap:3px}
.id-kind{display:inline-block;min-width:44px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3)}
.id-deed{margin-left:48px}
.id-past{margin-top:4px}
.id-designer{max-width:680px}
.id-d-head{gap:14px;align-items:center;margin-bottom:8px}
.id-d-prev svg{display:block;filter:drop-shadow(0 4px 8px rgba(0,0,0,.35))}
.id-blazon{color:var(--accent);font-style:italic;margin-top:4px}
.id-row{display:grid;grid-template-columns:110px 1fr;gap:8px;align-items:start;margin:6px 0}
.id-lab{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-2);padding-top:8px}
.id-opts{display:flex;flex-wrap:wrap;gap:4px}
.id-sw,.id-op{display:inline-flex;align-items:center;gap:5px;min-height:44px;padding:4px 8px;border:1px solid var(--line);background:var(--raised);border-radius:8px;font-size:12px;color:var(--ink)}
.id-sw i{display:block;width:18px;height:18px;border-radius:50%;border:2px solid var(--line-ink,#1b1730)}
.id-op{flex-direction:column;gap:1px;min-width:56px;padding:4px;font-size:10px;text-transform:capitalize}
.id-op svg{display:block}
.id-sw.sel,.id-op.sel{border-color:var(--accent);box-shadow:var(--glow-accent)}
.idv-voice{margin:6px 0 8px;padding:6px 10px;border-left:3px solid var(--accent-rule,var(--accent));font-family:var(--f-prose,inherit);font-style:italic;font-size:13.5px;line-height:1.4;color:var(--ink-2)}
.idv-who{font-style:normal;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);margin-right:6px}
.idv-thought .idv-who{color:var(--info)}
@media (max-width:760px){.id-row{grid-template-columns:1fr}.id-lab{padding-top:0}.id-op{min-width:48px}.idv-voice{margin:4px 0 6px;font-size:13px}}`;
  const put = () => { if (typeof document === 'undefined' || document.getElementById('id-style')) return; const s = document.createElement('style'); s.id = 'id-style'; s.textContent = CSS; document.head.appendChild(s); };
  if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }
})();
