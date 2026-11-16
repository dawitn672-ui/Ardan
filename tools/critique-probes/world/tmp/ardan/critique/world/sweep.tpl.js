// In-page consistency sweep. CFG is injected: { lives: [{seed, race, realm, status, sex, startAge}], years, every }
const CFG = __CFG__;
const P = id => A.S.people[id];
const age = p => A.S.year - p.born;
const adultOf = p => (GD.RACES[p.race] || GD.RACES.human).adult;
const nm = p => p ? `${p.id} ${A.fullName ? A.fullName(p) : p.given + ' ' + (p.sur || '')}${p.alive ? '' : ' [dead ' + (p.died || '?') + ']'} (${p.sex}, ${age(p)}y, ${p.race}${p.status ? ', ' + p.status : ''})` : 'missing';
const MALE_T = /^(?:the )?(?:King|Emperor|Sultan|Emir|Raja|Abbot|Prince|Duke|Count|Baron|Marquis|Viscount|Lord|Sir)\b(?!'s)/;
const FEM_T = /^(?:the )?(?:Queen|Empress|Sultana|Abbess|Princess|Duchess|Countess|Baroness|Marchioness|Viscountess|Lady|Dame|Forge-Queen|War-Mother)\b(?!'s)/;
const RULER_FEM = /Queen|War-Mother|Empress|Abbess|Sultana|Princess/, RULER_MALE = /King|Emperor|Sultan\b|Emir|Raja|Abbot|Prince\b/;
const SEATW = { marshal: /\bMarshal\b/, chancellor: /\bChancellor\b/, treasurer: /\bTreasurer\b/, spymaster: /\bSpymaster\b/, chaplain: /\bChaplain\b/ };
const ORDER_MARSHAL = /Marshal of the (Wolves|Sun|[A-Z][a-z]+s)\b/;
const results = [];
function sweepState(L, tag) {
  const V = L.V;
  const add = (cat, key, ex) => { const m = V[cat] || (V[cat] = { n: 0, keys: {}, ex: [] }); if (m.keys[key]) return; m.keys[key] = 1; m.n++; if (m.ex.length < 8) m.ex.push(`[${tag} y${A.S.year}] ${ex}`); };
  const S = A.S, pc = A.pc();
  const people = Object.values(S.people);
  const live = people.filter(p => p.alive);
  L.peopleCount.push([S.year, people.length, live.length]);
  // ---- rulers
  const rulerOf = {};
  for (const r of Object.values(S.realms)) {
    if (r.alive === false) continue;
    const ru = P(r.ruler);
    if (!ru) { add('ruler_missing', r.id, `${r.id} ${r.name}: ruler ${r.ruler} not found`); continue; }
    if (!ru.alive) add('ruler_dead', r.id + ru.id, `${r.name} ruled by dead ${nm(ru)}`);
    (rulerOf[ru.id] = rulerOf[ru.id] || []).push(r.id);
    if (ru.realm !== r.id) add('ruler_foreign', r.id + ru.id, `${r.name} ruled by ${nm(ru)} whose realm is ${ru.realm}`);
    if (age(ru) < adultOf(ru)) add('ruler_child', r.id + ru.id, `${r.name} ruled by child ${nm(ru)}`);
    const t = r.title || '';
    if ((ru.sex === 'M' && RULER_FEM.test(t) && !/\//.test(t)) || (ru.sex === 'F' && RULER_MALE.test(t) && !/\//.test(t))) add('ruler_title_sex', r.id + ru.id, `${r.name} title "${t}" held by ${nm(ru)}`);
    if (ru.race !== r.race && !(r.race === 'human' && /half/.test(ru.race))) add('ruler_race', r.id + ru.id, `${r.name} (${r.race}) ruled by ${nm(ru)}`);
    if (r.heir) { const h = P(r.heir); if (!h) add('heir_missing', r.id, `${r.name} heir ${r.heir} missing`); else if (!h.alive) add('heir_dead', r.id + h.id, `${r.name} heir is dead ${nm(h)}`); else if (h.id === ru.id) add('heir_is_ruler', r.id, `${r.name} heir is the ruler ${nm(h)}`); }
  }
  for (const [pid, rs] of Object.entries(rulerOf)) if (rs.length > 1) add('ruler_multi', pid + rs.join(), `${nm(P(pid))} rules ${rs.join(', ')}`);
  for (const p of live) {
    if (p.ruler && typeof p.ruler === 'string' && S.realms[p.ruler] && S.realms[p.ruler].ruler !== p.id) add('ruler_stale_flag', p.id + p.ruler, `${nm(p)} has p.ruler=${p.ruler} but ${S.realms[p.ruler].name} is ruled by ${nm(P(S.realms[p.ruler].ruler))}`);
  }
  // ---- council
  const seatsOf = {};
  for (const r of Object.values(S.realms)) {
    if (r.alive === false || !r.council) continue;
    for (const [seat, pid] of Object.entries(r.council)) {
      if (!pid) continue;
      const p = P(pid);
      if (!p) { add('council_missing', r.id + seat, `${r.name} ${seat}: ${pid} missing`); continue; }
      if (!p.alive) add('council_dead', r.id + seat + pid, `${r.name} ${seat} held by dead ${nm(p)}`);
      if (p.realm !== r.id) add('council_foreign', r.id + seat + pid, `${r.name} ${seat} held by ${nm(p)} of ${p.realm}`);
      if (age(p) < adultOf(p)) add('council_child', r.id + seat + pid, `${r.name} ${seat} held by child ${nm(p)}`);
      (seatsOf[pid] = seatsOf[pid] || []).push(r.id + ':' + seat);
      // other living people styled with this seat's word in the same realm
      if (SEATW[seat]) for (const q of live) if (q.id !== pid && q.realm === r.id && SEATW[seat].test(q.title || '') && !ORDER_MARSHAL.test(q.title || '')) add('title_office_clash', r.id + seat + q.id, `${r.name}: ${nm(q)} styled "${q.title}" while the council ${seat} is ${nm(p)}`);
    }
  }
  for (const [pid, ss] of Object.entries(seatsOf)) if (ss.length > 1) add('council_multi', pid + ss.join(), `${nm(P(pid))} holds ${ss.join(', ')}`);
  // the player's rank vs seat
  if (pc && pc.alive) {
    const r = S.realms[pc.realm];
    if (pc.mil && !pc.mil.merc && pc.mil.rank >= 9) { const rr = S.realms[pc.mil.realm]; if (!rr || !rr.council || rr.council.marshal !== pc.id) add('pc_marshal_no_seat', 'pc' + S.year, `player is Marshal but ${rr && rr.council ? 'the seat is ' + nm(P(rr.council.marshal)) : 'no council'}`); }
    for (const rr of Object.values(S.realms)) if (rr.council && rr.council.marshal === pc.id && !(pc.mil && pc.mil.rank >= 9) && pc.office !== 'marshal') add('pc_seat_no_rank', 'pc' + rr.id, `player holds ${rr.name}'s marshal seat with mil=${pc.mil ? GD.MIL[pc.mil.rank].title : 'none'} office=${pc.office || '-'}`);
    if (pc.office && !Object.values(S.realms).some(rr => rr.council && rr.council[pc.office] === pc.id)) add('pc_office_stale', 'pc' + pc.office, `player has office=${pc.office} but holds no such seat`);
    if (pc.mil && pc.mil.rank >= 3 && pc.mil.rank <= 6) { L.capt = L.capt || {}; const k = GD.MIL[pc.mil.rank].title; if (!L.capt[k]) { L.capt[k] = 1; L.captSnap.push({ year: S.year, rank: k, unit: pc.mil.unit, squad: (pc.mil.squad || []).length, company: pc.company ? pc.company.name : null, div: pc.mil.div, army: pc.mil.army }); } }
  }
  // ---- free-text titles
  const titleBy = {};
  for (const p of live) {
    const t = (p.title || '').trim(); if (!t) continue;
    if (age(p) < adultOf(p) && /(Captain|Master|Marshal|Sergeant|Warden|Reeve|Castellan|Commander|General|Chancellor|Treasurer|Steward|Abbot|Prior|Bishop|Judge|Magistrate)/.test(t)) add('child_title', p.id, `${nm(p)} styled "${t}"`);
    if (p.sex === 'F' && MALE_T.test(t)) add('title_sex', p.id + t, `${nm(p)} styled "${t}"`);
    if (p.sex === 'M' && FEM_T.test(t)) add('title_sex', p.id + t, `${nm(p)} styled "${t}"`);
    if (/ of |^Heir$|^Emperor$|^King$|^Queen$|Marshal|Chancellor|Captain-General/.test(t)) { const k = p.realm + '|' + t; (titleBy[k] = titleBy[k] || []).push(p); }
    const r = S.realms[p.realm];
    if (r && r.ruler !== p.id && r.title && t === r.title) add('title_ruler_stale', p.id, `${nm(p)} styled "${t}" but ${r.name} is ruled by ${nm(P(r.ruler))}`);
    if (/^Heir/.test(t) && r && r.heir !== p.id) add('title_heir_stale', p.id, `${nm(p)} styled "${t}" but ${r.name}'s heir is ${nm(P(r.heir))}`);
  }
  for (const [k, ps] of Object.entries(titleBy)) if (ps.length > 1) add('title_dup', k + ps.map(p => p.id).join(), `${ps.length} living people styled "${k.split('|')[1]}" in ${k.split('|')[0]}: ${ps.slice(0, 3).map(nm).join('; ')}`);
  // ---- court titles
  const holder = {};
  if (S.court && S.court.realms) for (const [rid, cr] of Object.entries(S.court.realms)) {
    for (const t of cr.titles || []) {
      if (!t.pid) continue;
      const p = P(t.pid);
      if (!p) { add('court_missing', t.k, `${t.name}: ${t.pid} missing`); continue; }
      if (!p.alive && !t.vacant) add('court_dead', t.k + p.id, `${t.name} (${t.rank}) held by dead ${nm(p)}`);
      if (p.alive && p.realm !== rid) add('court_foreign', t.k + p.id, `${t.name} of ${rid} held by ${nm(p)} of ${p.realm}`);
      if (p.alive && age(p) < adultOf(p)) add('court_child', t.k + p.id, `${t.name} (${t.rank}) held by child ${nm(p)}`);
      if (p.alive) (holder[p.id] = holder[p.id] || []).push(rid + ':' + t.name);
      if (p.alive && p.title && / of /.test(p.title) && /(March|Duchy|County)/.test(t.name)) { const place = t.name.replace(/^(March|Duchy|County) of /, ''); if (!p.title.includes(place)) add('court_title_text', t.k + p.id, `${nm(p)} holds "${t.name}" but is styled "${p.title}"`); }
    }
  }
  for (const [pid, ts] of Object.entries(holder)) { const realms = new Set(ts.map(x => x.split(':')[0])); if (realms.size > 1) add('court_two_realms', pid, `${nm(P(pid))} holds ${ts.join('; ')}`); }
  for (const p of live) if (p.noble && p.noble.court && S.court && S.court.realms) {
    const rid = String(p.noble.court).split(':')[0]; const cr = S.court.realms[rid]; const t = cr && (cr.titles || []).find(x => x.k === p.noble.court);
    if (t && t.pid && t.pid !== p.id) add('court_claim_stale', p.id + t.k, `${nm(p)} has p.noble.court=${t.name} but it is held by ${nm(P(t.pid))}`);
  }
  // ---- houses
  const headOf = {};
  for (const h of Object.values(S.houses || {})) {
    if (h.extinct) continue;
    const hid = h.headPid || (S.castMap && h.head ? S.castMap[h.head] : null);
    if (!hid) continue;
    const p = P(hid); if (!p) continue;
    if (!p.alive) add('house_head_dead', h.id + p.id, `${h.name} headed by dead ${nm(p)}`);
    else (headOf[p.id] = headOf[p.id] || []).push(h.name);
  }
  for (const [pid, hs] of Object.entries(headOf)) if (hs.length > 1) add('house_head_multi', pid, `${nm(P(pid))} heads ${hs.join(', ')}`);
  // ---- polity offices
  for (const r of Object.values(S.realms)) {
    const off = (r.pol && r.pol.off) || []; const seen = {};
    for (const o of off) {
      if (!o.pid) continue; const p = P(o.pid); if (!p) continue;
      if (!p.alive) add('pol_dead', r.id + (o.id || o.k) + p.id, `${r.name} ${o.id || o.k} held by dead ${nm(p)} (since ${o.since})`);
      if (p.alive && age(p) < adultOf(p)) add('pol_child', r.id + o.k + p.id, `${r.name} ${o.k} held by child ${nm(p)}`);
      if (p.alive && p.realm !== r.id) add('pol_foreign', r.id + o.k + p.id, `${r.name} ${o.k} held by ${nm(p)} of ${p.realm}`);
      const k = o.id || (o.k + '@' + o.at);
      if (seen[k] && seen[k] !== o.pid) add('pol_dup', r.id + k, `${r.name} ${k} held by both ${nm(P(seen[k]))} and ${nm(p)}`); seen[k] = o.pid;
    }
  }
  // ---- armies
  const genOf = {};
  for (const a of S.armies || []) {
    if (!a.gen) continue; const p = P(a.gen); if (!p) continue;
    if (!p.alive) add('army_gen_dead', a.id + p.id, `${a.name} led by dead ${nm(p)}`);
    else (genOf[p.id] = genOf[p.id] || []).push(a.name);
    const ar = a.realm || a.rid || a.owner;
    if (p.alive && ar && p.realm !== ar && !(p.mil && p.mil.realm === ar)) add('army_gen_foreign', a.id + p.id, `${a.name} (${ar}) led by ${nm(p)} of ${p.realm}`);
    if (p.alive && age(p) < adultOf(p)) add('army_gen_child', a.id + p.id, `${a.name} led by child ${nm(p)}`);
  }
  for (const [pid, as] of Object.entries(genOf)) if (as.length > 1) add('army_gen_multi', pid, `${nm(P(pid))} leads ${as.join(', ')}`);
  // ---- family graph, ages, marriages, children with adult roles
  for (const p of people) {
    for (const id of p.parents || []) {
      const q = P(id); if (!q) continue;
      const gap = p.born - q.born, ad = adultOf(q);
      if (gap < Math.max(11, ad - 3)) add('parent_too_young', p.id + q.id, `${nm(q)} is a parent of ${nm(p)} at ${gap}`);
      if (q.sex === 'F' && gap > ({ human: 50, orc: 45, halforc: 50, elf: 300, halfelf: 140, dwarf: 150, giant: 80 }[q.race] || 50)) add('mother_too_old', p.id + q.id, `${nm(q)} bore ${nm(p)} at ${gap}`);
      if (!q.alive && q.died != null && p.born > q.died + 1) add('born_after_parent_death', p.id + q.id, `${nm(p)} born ${p.born}, parent ${nm(q)} died ${q.died}`);
      if (!(q.children || []).includes(p.id)) add('parent_child_backlink', p.id + q.id, `${nm(p)} lists parent ${nm(q)}, who does not list the child`);
    }
    const ps = (p.parents || []).map(P).filter(Boolean);
    if (ps.length === 2 && ps[0].race === ps[1].race && p.race !== ps[0].race) add('race_mismatch', p.id, `${nm(p)} born to two ${ps[0].race}s`);
    if (ps.length === 2 && ps[0].sex === ps[1].sex) add('parents_same_sex', p.id, `${nm(p)} parents ${nm(ps[0])} and ${nm(ps[1])}`);
    if (!p.alive) continue;
    const a = age(p), ad = adultOf(p);
    if (a < ad) {
      if (p.job && (p.job.c || p.job.k)) add('child_job', p.id, `${nm(p)} works as ${p.job.c || p.job.k} rank ${p.job.r}`);
      if (p.mil) add('child_mil', p.id, `${nm(p)} serves as ${GD.MIL[p.mil.rank] ? GD.MIL[p.mil.rank].title : p.mil.rank}`);
      if (p.spouse) add('child_married', p.id, `${nm(p)} married to ${nm(P(p.spouse))}`);
      if (p.office) add('child_office', p.id, `${nm(p)} office ${p.office}`);
      if (p.famOffice) add('child_famoffice', p.id, `${nm(p)} family office ${JSON.stringify(p.famOffice).slice(0, 80)}`);
    }
    if ((p.children || []).length && a < ad - 1) add('child_parent', p.id, `${nm(p)} has ${p.children.length} children`);
    if (p.spouse) {
      const q = P(p.spouse);
      if (!q) add('spouse_missing', p.id, `${nm(p)} spouse ${p.spouse} missing`);
      else {
        if (q.alive && q.spouse !== p.id) add('spouse_nonrecip', p.id + q.id, `${nm(p)} married to ${nm(q)}, whose spouse is ${q.spouse ? nm(P(q.spouse)) : 'nobody'}`);
        if (!q.alive) add('spouse_dead_still_set', p.id + q.id, `${nm(p)} still married to dead ${nm(q)}`);
        const pp = new Set(p.parents || []);
        if ((q.parents || []).some(x => pp.has(x))) add('spouse_sibling', p.id + q.id, `${nm(p)} married to sibling ${nm(q)}`);
        if ((p.parents || []).includes(q.id) || (q.parents || []).includes(p.id)) add('spouse_parent', p.id + q.id, `${nm(p)} married to parent/child ${nm(q)}`);
        if (q.sex === p.sex) add('spouse_same_sex', p.id + q.id, `${nm(p)} and ${nm(q)}`);
        if (Math.abs(p.born - q.born) > 30 && q.alive) add('spouse_age_gap', p.id + q.id, `${nm(p)} married to ${nm(q)}`);
      }
    }
    // living siblings sharing a given name
    if ((p.parents || []).length) {
      const fa = P(p.parents[0]);
      if (fa) for (const cid of fa.children || []) { const c = P(cid); if (c && c.id !== p.id && c.alive && c.given === p.given && (c.parents || []).some(x => (p.parents || []).includes(x)) && p.id < c.id) add('sibling_same_name', p.id + c.id, `${nm(p)} and ${nm(c)}`); }
    }
  }
  // ---- names vs sex and culture
  const C = LORE.cultures;
  for (const p of live) {
    const c = C[p.cult]; if (!c) continue;
    if (p.sex === 'F' && c.m.includes(p.given) && !c.f.includes(p.given)) add('name_sex', p.id, `${nm(p)}: "${p.given}" is a ${c.name} man's name`);
    if (p.sex === 'M' && c.f.includes(p.given) && !c.m.includes(p.given)) add('name_sex', p.id, `${nm(p)}: "${p.given}" is a ${c.name} woman's name`);
  }
  // ---- the player's relations
  if (pc) {
    const F = A.V2F; const pairs = L.relPairs;
    for (const [id, rel] of Object.entries(pc.rel || {})) {
      const q = P(id); if (!q) { add('rel_missing', id, `pc.rel ${id} (${rel.type}) has no person`); continue; }
      let kin = null, label = null;
      try { const kk = F && F.kinOf ? F.kinOf(pc, q) : null; kin = kk ? (kk.term || String(kk)) : null; } catch (e) { kin = 'ERR'; }
      try { label = A.relLabel(q, rel); } catch (e) { label = 'ERR'; }
      const k = `${rel.type} -> ${kin || '-'} -> ${label}`;
      pairs[rel.type + ' => ' + (kin || 'not kin') ] = (pairs[rel.type + ' => ' + (kin || 'not kin')] || 0) + 1;
      if (['father', 'mother', 'sibling', 'grandparent', 'uncle', 'cousin', 'child', 'nephew', 'grandchild'].includes(rel.type) && !kin) add('rel_kin_unplaced', id + rel.type, `${nm(q)} stored as ${rel.type} but the tree says not kin (label "${label}")`);
      if (rel.type === 'uncle' && kin && !/uncle|aunt/.test(kin)) add('rel_type_vs_tree', id + rel.type + kin, `${nm(q)} stored "uncle", tree "${kin}", label "${label}"`);
      if (rel.type === 'cousin' && kin && !/cousin/.test(kin)) add('rel_type_vs_tree', id + rel.type + kin, `${nm(q)} stored "cousin", tree "${kin}", label "${label}"`);
      if (rel.type === 'grandparent' && kin && !/grand/.test(kin)) add('rel_type_vs_tree', id + rel.type + kin, `${nm(q)} stored "grandparent", tree "${kin}", label "${label}"`);
      if (rel.type === 'sibling' && kin && !/brother|sister|sibling/.test(kin)) add('rel_type_vs_tree', id + rel.type + kin, `${nm(q)} stored "sibling", tree "${kin}", label "${label}"`);
      if (['friend', 'bestfriend', 'rival', 'enemy', 'lover', 'mentor', 'student', 'comrade', 'master', 'superior', 'subordinate', 'servant'].includes(rel.type) && kin) add('bond_on_kin', id + rel.type, `${nm(q)} is your ${kin} and also stored as ${rel.type} (label "${label}")`);
      if (rel.type === 'lover' && kin && /brother|sister|father|mother|son|daughter/.test(kin)) add('lover_close_kin', id, `${nm(q)} lover and ${kin}`);
      if (rel.type === 'spouse' && kin && !/husband|wife|spouse/.test(kin)) add('spouse_label', id, `${nm(q)} spouse but tree "${kin}"`);
      if (label && /undefined|null|NaN/.test(label)) add('rel_label_broken', id, `${nm(q)} label "${label}"`);
    }
    const kinSet = new Set(Object.keys(pc.rel || {}).filter(id => { try { return A.V2F && A.V2F.kinOf(pc, P(id)); } catch (e) { return false; } }));
    const kt = id => { try { const k = A.V2F.kinOf(pc, P(id)); return k ? k.term : '?'; } catch (e) { return '?'; } };
    if (pc.job && pc.job.boss && kinSet.has(pc.job.boss)) add('boss_is_kin', pc.job.boss, `your superior ${nm(P(pc.job.boss))} is your ${kt(pc.job.boss)}`);
    if (pc.job && pc.job.boss && P(pc.job.boss) && !P(pc.job.boss).alive) add('boss_dead', pc.job.boss, `your superior ${nm(P(pc.job.boss))} is dead`);
    for (const m of (pc.mil && pc.mil.squad) || []) { const q = P(typeof m === 'string' ? m : m && m.id); if (q && !q.alive) add('squad_dead', q.id, `messmate ${nm(q)} is dead but still in your squad`); }
    for (const m of (pc.job && pc.job.mates) || []) { const q = P(m); if (q && !q.alive) add('mates_dead', q.id, `workmate ${nm(q)} is dead but still a mate`); }
    L.relCount.push([S.year, Object.keys(pc.rel || {}).length, Object.keys(pc.rel || {}).filter(k => P(k) && P(k).alive).length]);
  }
}
function textChecks(L, view, h) {
  const pc = A.pc(); if (!pc || !view) return;
  const V = L.V; const tag = 'card';
  const add = (cat, key, ex) => { const m = V[cat] || (V[cat] = { n: 0, keys: {}, ex: [] }); m.n++; if (m.keys[key]) return; m.keys[key] = 1; if (m.ex.length < 10) m.ex.push(`[y${A.S.year} age ${age(pc)} ${pc.status}${pc.mil ? ' ' + GD.MIL[pc.mil.rank].title : ''}${pc.job ? ' job:' + (pc.job.c || '') : ''}] ${ex}`); };
  const strip = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const text = strip(view.text), title = strip(view.title);
  const ch = (view.choices || []).map(c => strip(c.t || c.label || c.text || '')).join(' | ');
  const all = title + ' :: ' + text + ' :: ' + ch;
  L.cards++;
  const id = h && (h.ev || h.id) || view.id || '?';
  if (/\{[A-Za-z0-9_.]+\}|undefined|NaN|\bnull\b|\[object/.test(all)) add('ev_raw', id + all.slice(0, 40), `${id}: ${all.slice(0, 220)}`);
  const ctx = (h && h.ctx) || {};
  const them = ctx.pid ? P(ctx.pid) : null;
  if (them && !them.alive && !/grave|buried|funeral|dead|death|died|mourn|memory|remember|ghost|tomb|will\b|estate|inherit/i.test(all)) add('ev_dead_them', id + them.id, `${id} "${title}" is about ${nm(them)}: ${text.slice(0, 160)}`);
  if (them && them.given && text.includes(them.given)) {
    const sents = text.split(/(?<=[.!?])\s+/).filter(s => s.includes(them.given));
    for (const s of sents) {
      const after = s.slice(s.indexOf(them.given));
      const m = /\b(he|him|his|himself)\b/i.test(after), f = /\b(she|her|hers|herself)\b/i.test(after);
      if (them.sex === 'F' && m && !f) add('ev_pronoun', id + them.id, `${id}: "${them.given}" is ${nm(them)}: ${s.slice(0, 200)}`);
      if (them.sex === 'M' && f && !m) add('ev_pronoun', id + them.id, `${id}: "${them.given}" is ${nm(them)}: ${s.slice(0, 200)}`);
    }
  }
  const a = age(pc), ad = adultOf(pc);
  const commoner = ['peasant', 'serf', 'slave', 'artisan', 'merchant', 'gentry'].includes(pc.status) && !pc.noble && !pc.ruler;
  if (commoner && /\byour (vassals|estates|knights|household guard|banner ?men|courtiers|tenants|seneschal|retinue|steward|demesne|fiefs?)\b/i.test(all)) add('ev_class_commoner', id, `${id} "${title}": ${all.match(/\byour (vassals|estates|knights|household guard|banner ?men|courtiers|tenants|seneschal|retinue|steward|demesne|fiefs?)\b/i)[0]} — ${text.slice(0, 160)}`);
  if ((pc.status === 'noble' || pc.status === 'royal') && /\b(your master|the overseer|your landlord|your rent|the lord's fields|you owe the lord)\b/i.test(all)) add('ev_class_noble', id, `${id} "${title}": ${all.match(/\b(your master|the overseer|your landlord|your rent|the lord's fields|you owe the lord)\b/i)[0]} — ${text.slice(0, 160)}`);
  if (a < 13 && /\b(your wife|your husband|your sweetheart|tavern|your men|your squad|your company|your troops|your soldiers|ale-house|brothel|bed with)\b/i.test(all)) add('ev_class_child', id, `${id} "${title}" at ${a}: ${all.match(/\b(your wife|your husband|your sweetheart|tavern|your men|your squad|your company|your troops|your soldiers|ale-house|brothel|bed with)\b/i)[0]} — ${text.slice(0, 160)}`);
  if (!pc.mil && !pc.company && a >= ad && /\b(your (squad|company|regiment|sergeant|captain|men-at-arms|troops)|the muster roll)\b/i.test(all)) add('ev_class_civilian_mil', id, `${id} "${title}": ${all.match(/\b(your (squad|company|regiment|sergeant|captain|men-at-arms|troops)|the muster roll)\b/i)[0]} — ${text.slice(0, 160)}`);
  if (!pc.spouse && /\byour (wife|husband)\b/i.test(all) && !/widow/i.test(all)) add('ev_spouse_none', id, `${id} "${title}": ${text.slice(0, 160)}`);
  { const rr = A.S.realms[pc.realm], ru = rr && P(rr.ruler); if (ru && rr.title) { const t0 = rr.title.split(' / ')[0]; if (((ru.sex === 'M' && RULER_FEM.test(t0)) || (ru.sex === 'F' && RULER_MALE.test(t0))) && all.includes(t0 + ' ' + ru.given)) add('ev_ruler_title_sex', id, `${id}: "${t0} ${ru.given}" for ${nm(ru)}: ${text.slice(0, 160)}`); } }
  const fa = (pc.parents || []).map(P).find(q => q && q.sex === 'M'), mo = (pc.parents || []).map(P).find(q => q && q.sex === 'F');
  if (fa && !fa.alive && fa.given && new RegExp('\\b' + fa.given + '\\b').test(text) && /your father/i.test(text) && !/grave|buried|dead|died|late|memory|remember|was\b/i.test(text)) add('ev_dead_father_alive', id, `${id} "${title}": ${text.slice(0, 180)}`);
  if (mo && !mo.alive && mo.given && new RegExp('\\b' + mo.given + '\\b').test(text) && /your mother/i.test(text) && !/grave|buried|dead|died|late|memory|remember|was\b/i.test(text)) add('ev_dead_mother_alive', id, `${id} "${title}": ${text.slice(0, 180)}`);
  if (L.cardLog.length < 4000) L.cardLog.push({ y: A.S.year, a, st: pc.status, id, title: title.slice(0, 80), text: text.slice(0, 600), ch: ch.slice(0, 300), them: them ? { id: them.id, sex: them.sex, alive: them.alive, given: them.given } : null });
}
async function runLife(cfg) {
  const L = { cfg, V: {}, cards: 0, relPairs: {}, relCount: [], peopleCount: [], cardLog: [], captSnap: [], ms: [], deaths: null };
  const t0 = performance.now();
  A.newGame({ seed: cfg.seed, race: cfg.race, realm: cfg.realm, status: cfg.status, sex: cfg.sex, startAge: cfg.startAge });
  UI.screen = 'game'; UI.tab = 'life'; UI.render();
  const pc0 = A.pc();
  L.who = `${A.fullName(pc0)} (${cfg.status} ${cfg.race} ${cfg.sex} of ${cfg.realm}, born ${pc0.born})`;
  L.relAtStart = Object.keys(pc0.rel || {}).length;
  if (cfg.enlist && A.age(pc0) >= 15) { try { L.enlist = A.enlist(pc0); } catch (e) { L.enlist = 'ERR ' + e.message; } }
  sweepState(L, 'start');
  const end = A.S.year + CFG.years;
  let nextCheck = A.S.year + CFG.every, yStart = A.S.year, tY = performance.now();
  for (let guard = 0; guard < 20000 && A.S.year < end; guard++) {
    const r = A.advance(400);
    let h, g = 0;
    while ((h = A.headReady()) && g++ < 500) {
      if (h.type === 'event') { let v = null; try { v = A.eventView(h); } catch (e) {} textChecks(L, v, h); A.eventAuto(); }
      else A.skipPrompt();
    }
    if (cfg.enlist && A.pc() && A.pc().alive && !A.pc().mil && !A.pc().ruler && A.age(A.pc()) >= 16 && !L.enlistedLater) { try { const e = A.enlist(A.pc()); if (A.pc().mil) L.enlistedLater = A.S.year; } catch (e) {} }
    if (A.S.year >= nextCheck) { sweepState(L, 'y+' + (A.S.year - yStart)); nextCheck += CFG.every; L.ms.push([A.S.year, Math.round(performance.now() - tY)]); tY = performance.now(); }
    if (r.why === 'dead' || !A.pc() || !A.pc().alive) { L.deaths = { year: A.S.year, age: A.pc() ? A.age(A.pc()) : null, cause: A.pc() && A.pc().cause }; break; }
  }
  sweepState(L, 'end');
  const pc = A.pc();
  L.endYear = A.S.year; L.secs = Math.round((performance.now() - t0) / 1000);
  L.end = pc ? { alive: pc.alive, age: A.age(pc), status: pc.status, title: pc.title, mil: pc.mil ? GD.MIL[pc.mil.rank].title : null, job: pc.job ? pc.job.c + ' r' + pc.job.r : null, office: pc.office, spouse: pc.spouse ? nm(P(pc.spouse)) : null, rel: Object.keys(pc.rel || {}).length } : null;
  // per realm culture mix of the living
  const mix = {};
  for (const p of Object.values(A.S.people)) if (p.alive) { const k = p.realm; mix[k] = mix[k] || {}; const c = (LORE.cultures[p.cult] || {}).name || p.cult; mix[k][c] = (mix[k][c] || 0) + 1; }
  L.mix = mix;
  // names: full-name collisions among the living
  const full = {}; for (const p of Object.values(A.S.people)) if (p.alive) { const k = A.fullName(p); full[k] = (full[k] || 0) + 1; }
  L.fullDup = Object.entries(full).filter(([k, n]) => n > 1).sort((a, b) => b[1] - a[1]).slice(0, 15);
  L.nLiving = Object.values(A.S.people).filter(p => p.alive).length;
  for (const v of Object.values(L.V)) delete v.keys;
  return L;
}
const out = [];
for (const cfg of CFG.lives) { try { out.push(await runLife(cfg)); } catch (e) { out.push({ cfg, error: String(e.stack || e).slice(0, 600) }); } }
return out;
