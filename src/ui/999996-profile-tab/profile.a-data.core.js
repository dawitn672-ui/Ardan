// 999996-profile-tab, part 1: what the Profile page reads (work item P, owner order 33, D-035, D-038).
//
// Everything here is a reader: it takes the player's person and returns plain words and lists, and writes nothing and
// draws no random number, so drawing the page twice gives the same markup. The one thing that writes is the post
// tracker at the end (a month hook): it keeps the posts the player held and has left, because the game keeps only the
// post held now. A person from an old save has no record yet and the page says only what is held now.
//
// The page grows: `PF.addStat(row)` adds a row to the body and mind sheet (G's new stats), `PF.addSection(def)` adds a
// folded section (a new system's own part of the sheet). See README.md.
const PF = UI.PF = UI.PF || {};
const VS = A.V2S || null;
const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : s);
const low = s => String(s || '').toLowerCase();
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
PF.hash = hash;
PF.cap = cap;

// ---- the standing: a kicker word and a glyph by estate --------------------------------------------------------------
// glyph: 0 the lowly (a diamond), 1 the town (a square), 2 arms and nobility (a hexagon), 3 the crown (a crown)
PF.ESTATE = { slave: ['Slave', 0], serf: ['Serf', 0], peasant: ['Peasant', 0], artisan: ['Townsman', 1], merchant: ['Merchant', 1], gentry: ['Gentry', 1], noble: ['Noble', 2], royal: ['Royal', 3] };
PF.kicker = function (p) {
  const st = PF.ESTATE[p.status] || ['Commoner', 0];
  if (p.ruler) return { word: 'Sovereign', glyph: 3 };
  if (!A.isAdult(p)) return { word: A.stage(p) === 'infant' ? 'Infant' : 'Child', glyph: st[1] };
  if (p.mil && !p.mil.merc && st[1] < 2) return { word: 'Soldier', glyph: 2 };
  if (p.mil && p.mil.merc) return { word: 'Sellsword', glyph: 2 };
  if (p.job && p.job.c === 'clergy') return { word: 'Priest', glyph: 2 };
  if (p.prison) return { word: 'Prisoner', glyph: st[1] };
  return { word: st[0], glyph: st[1] };
};

// ---- the six stats of today, in words on a scale of seven ------------------------------------------------------------
// A row: { k, label, group, read(p) -> { word, at, pot, tip: [key, arg] } }. `at` and `pot` are places on the scale, 0 to 6.
PF.SCALE = ['poor', 'middling', 'fair', 'good', 'fine', 'rare', 'legendary'];
PF.V2LABEL = { str: 'Strength', spd: 'Speed', sta: 'Endurance', ins: 'Reflexes', int: 'Wits', wil: 'Will' };
PF.place = w => Math.max(0, PF.SCALE.indexOf(w));
PF.STATS = [];
PF.addStat = function (row) {
  if (!row || !row.k || PF.STATS.some(r => r.k === row.k)) return false;
  PF.STATS.push(Object.assign({ group: 'Body' }, row));
  return true;
};
const statRead = k => p => {
  const st = A.stats(p), v = st[k], pot = p.pot ? p.pot[k] : v;
  if (!VS || typeof VS.statWord !== 'function') return { word: v < 20 ? 'poor' : v < 35 ? 'middling' : v < 50 ? 'fair' : v < 65 ? 'good' : 'fine', at: Math.min(6, Math.floor(v / 15)), pot: Math.min(6, Math.floor(pot / 15)), tip: ['stat', k] };
  const word = VS.statWord(p, k, v), young = !PF.SCALE.includes(word);
  return { word, at: young ? 0 : PF.place(word), pot: young ? 0 : PF.place(VS.statWord(p, k, pot)), tip: ['stat', k], young };
};
for (const [k, group] of [['str', 'Body'], ['spd', 'Body'], ['sta', 'Body'], ['ins', 'Mind'], ['int', 'Mind'], ['wil', 'Mind']]) {
  PF.addStat({ k, group, label: (VS && PF.V2LABEL[k]) || (GD.STAT_NAMES && GD.STAT_NAMES[k]) || k, read: statRead(k) });
}

// ---- words for the measures on the card ------------------------------------------------------------------------------
PF.purseWord = function (p) {
  const c = +p.coin || 0, d = +p.debt || 0;
  if (d > 50 && c < d) return 'in debt';
  return c < 5 ? 'empty' : c < 40 ? 'thin' : c < 150 ? 'modest' : c < 500 ? 'steady' : c < 1500 ? 'comfortable' : c < 6000 ? 'deep' : 'a fortune';
};
PF.bodyWord = function (p) {
  const age = A.age(p), R = GD.RACES[p.race] || GD.RACES.human;
  if (age < 3) return 'too young to measure';
  const build = (p.app && p.app.build) || '', grow = age < (R.grown || 20) ? ', still growing' : '';
  if (!VS || !VS.shownLevies || age < 6) return (build + grow).replace(/^, /, '') || 'growing';
  let rank = ''; try { rank = VS.levyRank(VS.shownLevies(p)); } catch (e) {}
  return [build, rank].filter(Boolean).join(', ') + (grow ? grow : '');
};
PF.renownWord = p => (VS && VS.band ? VS.band('fame', p.fame || 0) : 'unknown');
PF.honorWord = p => (VS && VS.band ? VS.band('honor', p.honor || 0) : 'decent');
PF.pietyWord = p => (VS && VS.band ? VS.band('piety', p.piety || 0) : 'observant');
PF.hasFaith = p => (VS && VS.hasFaith ? !!VS.hasFaith(p) : true);
PF.vital = function (k, p) {
  const v = { health: p.health, happy: p.happy, looks: p.looks }[k];
  return { word: VS && VS.band ? VS.band(k, v) : String(Math.round(v)), v: Math.max(0, Math.min(100, +v || 0)) };
};

// ---- the line about the person: built from what is true of them, the same words every time ---------------------------
PF.DRESS = { slave: 'in rags', serf: 'in patched wool', peasant: 'in homespun', artisan: 'in a good apron and sound boots', merchant: 'in good cloth, keys at the belt', gentry: 'in fine wool', noble: 'in silk and good wool', royal: 'in velvet and fur' };
PF.BUILDW = { slight: 'slight', lean: 'lean', sturdy: 'sturdy', heavy: 'heavy', muscular: 'broad', gaunt: 'gaunt', stout: 'stout' };
PF.about = function (p) {
  const R = GD.RACES[p.race] || GD.RACES.human, age = A.age(p), app = p.app || {}, m = p.sex === 'M';
  const out = [], tall = (p.quirks || []).includes('tall') || app.height >= (m ? 183 : 171), short = (p.quirks || []).includes('short') || app.height <= (m ? 164 : 153);
  const lead = [];
  if (age < (R.adult || 16)) {
    out.push(A.stage(p) === 'infant' ? 'An infant, new to the world.' : (age < 12 ? 'A child, ' : 'Not yet grown, ') + (short ? 'small for the years' : tall ? 'tall for the years' : 'and growing') + '.');
  } else {
    if (tall) lead.push('tall'); else if (short) lead.push('short');
    if (PF.BUILDW[app.build]) lead.push(PF.BUILDW[app.build]);
    const tr = (p.traits || []).filter(t => GD.TRAITS[t]).slice(0, 2).map(t => low(GD.TRAITS[t].name));
    const body = lead.slice(0, 2).join(' and '), temper = tr.join(' and ');
    if (body && temper) out.push(cap(body) + ', ' + temper + '.');
    else if (body || temper) out.push(cap(body || temper) + '.');
    if (age >= (R.old || 60)) out.push('Grey now, and slower than they were.');
  }
  // dress and arms: what the figure wears
  const g = p.gear || {}, armor = g.armor && g.armor !== 'none' && GD.GEAR[g.armor] ? GD.GEAR[g.armor] : null, wp = g.weapon && g.weapon !== 'fists' && GD.GEAR[g.weapon] ? GD.GEAR[g.weapon] : null;
  if (armor && A.isAdult(p)) out.push(cap(low(armor.name)) + (wp ? ', ' + low(wp.name) + ' at the hip.' : '.'));
  else out.push('Dressed ' + (PF.DRESS[p.status] || 'in plain clothes') + '.');
  // a mark that stays
  const mark = (p.wounds || []).map(w => GD.WOUNDS[w.k]).find(w => w && w.perm);
  if (mark) out.push(cap(low(mark.name)) + '.');
  return out.join(' ');
};

// ---- the posts: what is held now, as a list of { kind, label, key } -------------------------------------------------
PF.heldNow = function (p) {
  const out = [], r = p.realm ? A.realm(p.realm) : null, rs = r ? r.short : '';
  if (p.ruler && r) out.push({ kind: 'Crown', label: A.rulerStyle(p, r).replace(' ' + A.fullName(p, false), '') + ' of ' + rs, key: 'crown', tip: ['note', 'The crown of a realm: one holder, and the realm\'s law, treasury and armies answer to it.'] });
  else if (r && r.heir === p.id && r.alive) out.push({ kind: 'Succession', label: 'Heir of ' + rs, key: 'heir', tip: ['note', 'First in the line to the crown. Your place comes from the realm\'s law of succession.'] });
  if (p.noble && p.noble.rung >= 2 && !p.ruler) out.push({ kind: 'Title', label: A.nobleTitle(p), key: 'noble', tip: ['rung', String(p.noble.rung)] });
  const h = p.house ? A.house(p.house) : null;
  if (h && h.headPid === p.id && h.title) out.push({ kind: 'House', label: h.title + (h.rank ? ', ' + h.rank : ''), key: 'head', tip: ['house', h.id] });
  if (p.office && !p.ruler && A.COUNCIL && A.COUNCIL[p.office]) out.push({ kind: 'Office', label: A.COUNCIL[p.office].name + ' of ' + rs, key: 'council:' + p.office, tip: ['note', 'A seat on the ruler\'s council. One holder at a time.'] });
  try { if (A.POL && A.POL.officesOf) for (const [rr, o] of A.POL.officesOf(p)) out.push({ kind: 'Office', label: A.POL.offName(o.k, rr.id), key: 'pol:' + o.k, tip: ['note', 'An office of the realm below the council. One holder at a time.'] }); } catch (e) {}
  if (p.mil && GD.MIL[p.mil.rank]) out.push({ kind: 'Command', label: GD.MIL[p.mil.rank].title + (p.mil.merc && p.mil.company ? ', ' + p.mil.company : ''), key: 'mil:' + p.mil.rank, tip: ['milRank', ''] });
  if (p.company && p.company.name) out.push({ kind: 'Command', label: 'Captain of ' + p.company.name, key: 'company', tip: ['note', 'Your company: its men follow your orders and share your name.'] });
  if (p.job && GD.CAREERS[p.job.c] && GD.CAREERS[p.job.c].ranks[p.job.r]) out.push({ kind: 'Trade', label: GD.CAREERS[p.job.c].ranks[p.job.r][0], key: 'job:' + p.job.c + ':' + p.job.r, tip: ['career', p.job.c] });
  return out;
};
PF.state = p => (p && p.pf && typeof p.pf === 'object' ? p.pf : null);
PF.sinceOf = (p, key) => { const s = PF.state(p); const e = s && s.cur && s.cur[key]; return e && e.y != null ? e.y : null; };
PF.pastPosts = p => { const s = PF.state(p); return s && Array.isArray(s.past) ? s.past.slice(-8).reverse() : []; };

// the tracker: once a month, what is held now is compared with the last look; a post that is gone goes to the past
// list with the years it was held. It writes only p.pf (no dice; old saves start their record the first month).
PF.sync = function (p) {
  if (!p || !A.S) return;
  const y = A.S.year, now = PF.heldNow(p);
  let s = PF.state(p);
  if (!s) {
    const fresh = p.idT0 != null && A.absDay && (A.absDay() - p.idT0) < 70;
    s = p.pf = { cur: {}, past: [], fresh: fresh ? 1 : 0 };
    for (const x of now) s.cur[x.key] = { t: x.label, k: x.kind, y: fresh ? (x.key.startsWith('job:') && p.job && p.job.y ? y - Math.min(p.job.y, 30) : y) : null };
    return;
  }
  const keys = new Set(now.map(x => x.key));
  for (const key of Object.keys(s.cur)) {
    if (keys.has(key)) continue;
    const e = s.cur[key];
    s.past.push({ t: e.t, k: e.k, y0: e.y, y1: y });
    delete s.cur[key];
  }
  for (const x of now) {
    if (!s.cur[x.key]) s.cur[x.key] = { t: x.label, k: x.kind, y };
    else if (s.cur[x.key].t !== x.label) s.cur[x.key].t = x.label;
  }
  if (s.past.length > 24) s.past.splice(0, s.past.length - 24);
};
(A.onMonth = A.onMonth || []).push(pc => { try { if (pc && pc.id === A.S.pc) PF.sync(pc); } catch (e) { console.error('profile posts', e); } });

// ---- skills: named tiers, best first ----------------------------------------------------------------------------------
PF.skills = function (p, all) {
  const rows = Object.keys(GD.SKILLS || {}).map(k => [k, A.skill(p, k)]).filter(([k, v]) => v >= 1 || (p.apt && p.apt[k] && p.apt[k] !== 1)).sort((a, b) => b[1] - a[1]);
  return rows.slice(0, all ? rows.length : 8).map(([k, v]) => {
    const t = VS && VS.tierOf ? VS.tierOf(v) : { name: GD.profTier ? GD.profTier(v) : '', frac: 0, next: null };
    const apt = p.apt && p.apt[k];
    return { k, name: GD.SKILLS[k], tier: t.name, frac: t.frac || 0, next: t.next, apt: apt && apt !== 1 ? (apt > 1 ? 'apt' : 'slow') : '', n: rows.length };
  });
};
PF.skillCount = p => Object.keys(GD.SKILLS || {}).filter(k => A.skill(p, k) >= 1).length;
PF.styles = function (p) {
  const out = [];
  for (const sid of Object.keys(p.styles || {})) {
    const st = A.style(sid); if (!st) continue;
    const rk = p.styles[sid].rank || 0;
    out.push({ id: sid, name: st.name, rank: rk, rankWord: rk > 0 ? A.styleRankName(st, rk) : 'Not yet begun', main: p.styleMain === sid, kind: st.kind });
  }
  return out.sort((a, b) => (b.main - a.main) || (b.rank - a.rank) || (a.name < b.name ? -1 : 1));
};

// ---- gear: one tile a slot ---------------------------------------------------------------------------------------------
PF.SLOTS = [['weapon', 'Weapon'], ['ranged', 'Ranged'], ['armor', 'Armour'], ['shield', 'Shield'], ['helm', 'Helm'], ['mount', 'Mount'], ['cloak', 'Cloak']];
PF.gear = function (p) {
  const g = p.gear || {};
  return PF.SLOTS.map(([slot, label]) => {
    const id = g[slot], it = id && GD.GEAR[id] ? GD.GEAR[id] : null, none = !it || id === 'fists' || id === 'none';
    return { slot, label, name: none ? (slot === 'weapon' ? 'Bare hands' : slot === 'armor' ? 'Plain clothes' : 'None') : it.name, empty: none };
  });
};
PF.named = function (p) {
  const out = [], ID = A.ID;
  if (!ID || !ID.KINDS) return out;
  for (const k of Object.keys(ID.KINDS)) { const t = ID.named(p, k); if (t) out.push({ kind: ID.KINDS[k].word, name: t.n, since: t.y, years: Math.max(0, A.S.year - t.y) }); }
  return out;
};
// things handed down: a person's own list (E2 will fill it), when there is one
PF.heirlooms = p => (Array.isArray(p.heirlooms) ? p.heirlooms.filter(x => x && (x.n || x.name)).map(x => ({ name: x.n || x.name, from: x.from || '', y: x.y || null })) : []);

// ---- the household -----------------------------------------------------------------------------------------------------
PF.household = function (p) {
  const out = [], seen = new Set(), add = (id, rel) => { const q = id && A.P(id); if (q && !seen.has(q.id)) { seen.add(q.id); out.push({ p: q, rel }); } };
  for (const id of p.parents || []) { const q = A.P(id); add(id, q && q.sex === 'F' ? 'Mother' : 'Father'); }
  if (p.spouse) { const q = A.P(p.spouse); add(p.spouse, q && q.sex === 'F' ? 'Wife' : 'Husband'); }
  for (const id of p.children || []) { const q = A.P(id); add(id, q && q.sex === 'F' ? 'Daughter' : 'Son'); }
  return out;
};

// ---- the years: age, stage, health, wounds and scars -------------------------------------------------------------------
PF.marks = function (p) {
  const lasting = [], healing = [];
  for (const w of p.wounds || []) { const d = GD.WOUNDS[w.k]; if (!d) continue; (d.perm ? lasting : healing).push({ k: w.k, name: d.name, until: w.until || null }); }
  return { lasting, healing };
};
PF.healWord = until => { if (until == null) return 'in time'; const n = until - A.S.year; return n <= 0 ? 'soon' : n === 1 ? 'within the year' : 'in a few years'; };
PF.stageWord = function (p) {
  const st = A.stage(p), R = GD.RACES[p.race] || GD.RACES.human, a = A.age(p);
  return { infant: 'an infant', child: 'a child', teen: 'a youth', adult: a >= (R.primeEnd || 45) ? 'in the later years of adulthood' : 'in the prime of life', old: 'old' }[st] || st;
};
