// 999996-profile-tab, part 2: the Profile page (work item P, owner order 33, D-035, D-038).
//
// A game-like character sheet for the player, kept clean (P2, owner order 34, D-041): the whole standing figure, the card
// on parchment (name, estate and rank, the posts held now, a line about the person, four measures in words), the body and
// mind in words on a scale of seven, and one small panel at a time (Skills, Gear, Family, Traits) chosen by tabs. The past
// and the long reads (posts held before, deeds, the record of the body, birth and faith) are on the Records view of the same
// page, one small link away, for retracing one's steps. Everything is drawn from profile.a-data.core.js's readers: pure,
// no dice, no writes. A Records section's body is drawn when it is opened.
//
// Descriptions open on click: each measure, each scale row and each number sits in a trigger of 59-descriptions
// (data-tt or UI.note). No percentages are written for the player.
(function () {
  const PF = UI.PF, VS = A.V2S || null;
  const esc = s => UI.esc(String(s == null ? '' : s)), cap = PF.cap;
  const FIG = () => (typeof PORTRAIT !== 'undefined' ? PORTRAIT : null);

  // ---- triggers: a word or a row that opens a description on a press -----------------------------------------------------
  const trig = (tip, inner, cls, tag) => {
    tag = tag || 'span';
    if (!tip) return `<${tag} class="${cls || ''}">${inner}</${tag}>`;
    return `<${tag} class="tt ${cls || ''}" data-tt="${esc(tip[0])}"${tip[1] != null && tip[1] !== '' ? ` data-v="${esc(tip[1])}"` : ''} tabindex="0" role="button" aria-haspopup="dialog" aria-expanded="false">${inner}</${tag}>`;
  };
  const note = (text, inner, cls, tag) => trig(['note', text], inner, cls, tag);
  const hasDigit = s => /\d/.test(s);

  // ---- which sections are open: the player's, kept in the browser (never in the save) --------------------------------------
  PF.open = {};
  const KEY = 'ardan_pf_v1';
  try { const raw = window.localStorage && window.localStorage.getItem(KEY); if (raw) { const o = JSON.parse(raw); if (o && typeof o === 'object') for (const k of Object.keys(o)) PF.open[k] = !!o[k]; } } catch (e) {}
  PF.saveOpen = () => { try { window.localStorage.setItem(KEY, JSON.stringify(PF.open)); } catch (e) {} };

  // ---- the hero -------------------------------------------------------------------------------------------------------------
  PF.arms = function (p, size) {
    const h = p.house ? A.house(p.house) : null, P = FIG();
    try {
      if (A.ID && A.ID.arms && A.ID.arms(p) && A.ID.coatSvg) return A.ID.coatSvg(p, size);
      if (h && P && P.coat) return P.coat(h, size);
    } catch (e) {}
    return '';
  };
  const measure = (label, word, tip) => `<div class="pf-m"><dt>${esc(label)}</dt><dd>${trig(tip, esc(word), 'pf-w')}</dd></div>`;
  PF.card = function (p) {
    const k = PF.kicker(p), h = p.house ? A.house(p.house) : null, r = p.realm ? A.realm(p.realm) : null;
    const place = [h ? h.name : '', A.provName ? A.provName(p.home) : '', r ? r.short : ''].filter(Boolean).join(' · ');
    const coat = PF.arms(p, 52), line = UI.titleLine(p);
    const age = A.age(p), old = age >= 6;
    // the posts held now, as small rows (the title line already says the first, so it is not said twice); the rest is in Records
    const held = PF.heldNow(p).filter(x => !line || !line.includes(x.label)).slice(0, 3);
    let s = `<article class="pf-card" aria-label="${esc(A.fullName(p))}, profile card">`;
    s += `<div class="pf-top"><div class="pf-kick"><i class="pf-glyph g${k.glyph}" aria-hidden="true"></i>${esc(k.word)}</div>${coat ? `<div class="pf-arms" aria-hidden="true">${coat}</div>` : ''}</div>`;
    s += `<h2 class="pf-name">${esc(A.fullName(p, false))}</h2>`;
    if (p.epithet) s += `<div class="pf-epi">${esc(p.epithet)}</div>`;
    s += `<div class="pf-estate">${esc(line)}</div>`;
    if (place) s += `<div class="pf-place">${esc(place)}</div>`;
    if (held.length) s += `<ul class="pf-held" aria-label="Posts held">` + held.map(x => `<li>${trig(x.tip, esc(x.label), 'pf-w')}</li>`).join('') + '</ul>';
    s += `<p class="pf-about">${esc(PF.about(p))}</p>`;
    s += `<dl class="pf-measures">` +
      measure('Body', PF.bodyWord(p), old ? ['worth', p.id] : ['age', p.id]) +
      measure('Purse', PF.purseWord(p), ['coin', '']) +
      measure('Name', PF.renownWord(p), ['fame', '']) +
      measure('Honour', PF.honorWord(p), ['honor', '']) + `</dl>`;
    return s + '</article>';
  };
  PF.figure = function (p, phone) {
    const P = FIG(); if (!P) return '';
    return `<div class="pf-fig">${P.svg(p, phone ? 124 : 172, { figure: true })}</div>`;
  };

  // ---- the sheet: body and mind in words, on a scale of seven ------------------------------------------------------------------
  const pips = (at, pot) => { let s = '<span class="pf-pips" aria-hidden="true">'; for (let i = 0; i < 7; i++) s += `<i${i <= at ? ' class="on"' : ''}${i === pot && pot > at ? ' data-pot="1"' : ''}></i>`; return s + '</span>'; };
  PF.statRow = function (p, row) {
    let r; try { r = row.read(p); } catch (e) { return ''; }
    if (!r) return '';
    const icon = UI.ICON_STAT && UI.ICON_STAT[row.k] && UI.iconOf ? `<span class="pf-ico">${UI.iconOf(UI.ICON_STAT[row.k], 's')}</span>` : '';
    return trig(r.tip, `<span class="pf-l">${icon}${esc(row.label)}</span>${r.young ? '<span class="pf-pips pf-none" aria-hidden="true"></span>' : pips(r.at, r.pot)}<span class="pf-v">${esc(r.word)}</span>`, `pf-row pf-stat s-${esc(row.k)}`, 'div');
  };
  PF.sheet = function (p) {
    let s = '<section class="pf-sheet" aria-label="Body and mind">';
    const groups = [];
    for (const row of PF.STATS) { let g = groups.find(x => x[0] === row.group); if (!g) groups.push(g = [row.group, []]); g[1].push(row); }
    groups.forEach(([name, rows], i) => {
      const head = i === 0 ? note('The lit marks are where you stand; the open mark is what you may grow to.', esc(name), 'pf-hn2') : esc(name);
      s += `<h3 class="pf-h">${head}</h3>` + rows.map(r => PF.statRow(p, r)).join('');
    });
    // health, mood and looks: one line of three words
    s += '<div class="pf-vits" aria-label="How you are">';
    for (const [k, label] of [['health', 'Health'], ['happy', 'Mood'], ['looks', 'Looks']]) {
      const v = PF.vital(k, p);
      s += `<span class="pf-vital v-${k}"><span class="pf-k">${label}</span> <span class="pf-v">${esc(v.word)}</span></span>`;
    }
    return s + '</div></section>';
  };

  // ---- the folded sections ---------------------------------------------------------------------------------------------------
  const li = (kind, inner, cls) => `<li class="pf-li ${cls || ''}"><span class="pf-k">${esc(kind)}</span><span class="pf-c">${inner}</span></li>`;
  const empty = text => `<p class="pf-empty">${esc(text)}</p>`;
  const yearNote = y => note('The year in the world\'s own count: Ardan\'s years run from the founding.', esc(y + ' AR'), 'pf-yr');
  PF.SECTIONS = [];
  PF.addSection = function (def, before) {
    if (!def || !def.k || PF.SECTIONS.some(s => s.k === def.k)) return false;
    const i = before ? PF.SECTIONS.findIndex(s => s.k === before) : -1;
    if (i >= 0) PF.SECTIONS.splice(i, 0, def); else PF.SECTIONS.push(def);
    return true;
  };

  PF.addSection({
    k: 'posts', title: 'Titles, posts and offices', open: true,
    sum: p => { const n = PF.heldNow(p); return n.length ? n[0].label + (n.length > 1 ? ' and more' : '') : PF.kicker(p).word + ', no post held'; },
    body: p => {
      const now = PF.heldNow(p), past = PF.pastPosts(p);
      let s = '<ul class="pf-list">';
      s += li('Estate', trig(['note', 'Where you were born and stand in the realm: slave, serf, peasant, townsman, merchant, gentry, noble or royal. It sets what doors open.'], esc((GD.STATUS[p.status] || {}).name || ''), 'pf-w'));
      for (const x of now) {
        const y = PF.sinceOf(p, x.key);
        s += li(x.kind, trig(x.tip, esc(x.label), 'pf-w') + (y != null ? ` <span class="pf-m2">since ${yearNote(y)}</span>` : ''));
      }
      s += '</ul>';
      if (!now.length) s += empty('You hold no post. A trade, a rank or an office comes with the path you take.') + '<button type="button" class="small" data-a="tab" data-v="path">The Path page</button>';
      if (past.length) {
        s += '<h4 class="pf-h2">Held before</h4><ul class="pf-list">' + past.map(x => li(x.k || 'Post', `${esc(x.t)} <span class="pf-m2">${x.y0 != null ? yearNote(x.y0) + ' to ' : 'until '}${yearNote(x.y1)}</span>`)).join('') + '</ul>';
      } else s += `<p class="pf-fine">Posts you leave are written here with the years you held them.</p>`;
      return s;
    },
  });

  PF.addSection({
    k: 'skills', title: 'Skills and fighting style',
    sum: p => { const t = PF.skills(p, false)[0]; return t ? `${t.name}, ${t.tier.toLowerCase()}` : 'Nothing practised yet'; },
    body: p => {
      const rows = PF.skills(p, true); // Records holds all of them
      let s = '';
      if (VS && VS.levyWords && A.age(p) >= 6) {
        try { const lv = VS.shownLevies(p); s += `<div class="pf-fight">${trig(['worth', p.id], '<span class="pf-k">In a fight</span> <span class="pf-w">' + esc(VS.levyRank(lv)) + '</span> <span class="pf-m2">' + esc(VS.levyWords(lv)) + '</span>', 'pf-row', 'div')}</div>`; } catch (e) {}
      }
      s += '<h4 class="pf-h2">Fighting styles</h4>';
      const st = PF.styles(p);
      s += st.length ? '<ul class="pf-list">' + st.map(x => li(x.main ? 'Main style' : 'Style', `${note('A way of fighting taught by a school or a house. Each rank unlocks techniques you can use in a duel.', esc(x.name), 'pf-w')} <span class="pf-m2">${esc(x.rankWord)}</span>`)).join('') + '</ul>' : empty('You follow no style yet. A master may teach one.');
      s += '<h4 class="pf-h2">Proficiencies</h4>';
      s += rows.length ? '<ul class="pf-skills">' + rows.map(r => `<li class="pf-sk">${trig(['skill', r.k], esc(r.name) + (r.apt === 'apt' ? ' <span class="pf-apt" aria-label="quick to learn">★</span>' : r.apt === 'slow' ? ' <span class="pf-apt" aria-label="slow to learn">▽</span>' : ''), 'pf-l')}${trig(['profTier', r.tier], esc(r.tier), 'pf-tier')}<span class="pf-prog" aria-hidden="true"><i style="width:${Math.round(r.frac * 100)}%"></i></span></li>`).join('') + '</ul>' : empty('No proficiencies yet. Practise something.');
      return s;
    },
  });

  PF.addSection({
    k: 'renown', title: 'Renown, honour and deeds', open: true,
    sum: p => PF.renownWord(p),
    body: p => {
      let s = '<ul class="pf-list">';
      s += li('Renown', trig(['fame', ''], esc(PF.renownWord(p)), 'pf-w'));
      s += li('Honour', trig(['honor', ''], esc(PF.honorWord(p)), 'pf-w'));
      if (PF.hasFaith(p)) s += li('Piety', trig(['piety', ''], esc(PF.pietyWord(p)), 'pf-w'));
      s += '</ul>';
      let best = []; try { if (A.RN && A.RN.best) best = A.RN.best(p, 6); } catch (e) {}
      const now = A.S.year, when = y => (A.RN && A.RN.whenWord ? A.RN.whenWord(y, now) : '');
      if (best.length) s += '<h4 class="pf-h2">What made the name</h4><ul class="pf-list">' + best.map(x => li(cap(when(x.year)), note('A deed your name is made of. The odds it beat and who saw it set its weight; deeds fade, and a name keeps half of its best.', esc(x.text), 'pf-w'))).join('') + '</ul>';
      const deeds = (p.deeds || []).slice(-12).reverse();
      if (deeds.length) s += '<h4 class="pf-h2">Set down</h4><ul class="pf-list">' + deeds.map(d => li(cap(when(d.y)), note('A line of your life, kept in the book of your days.', esc(d.t), 'pf-w'))).join('') + '</ul>';
      if (!best.length && !deeds.length) s += empty('No deed of yours is talked about yet.');
      return s;
    },
  });

  PF.addSection({
    k: 'house', title: 'House and household',
    sum: p => { const h = p.house ? A.house(p.house) : null; return h ? h.name : 'No house of your own'; },
    body: p => {
      const h = p.house ? A.house(p.house) : null, P = FIG(), folk = PF.household(p);
      let s = '';
      if (h) {
        const coat = PF.arms(p, 64), ar = (A.ID && A.ID.arms && A.ID.arms(p)) || null, words = (ar && ar.words) || h.words || '', blaz = h.arms || '';
        s += `<div class="pf-house"><div class="pf-coat" aria-hidden="true">${coat}</div><div class="pf-hn">${trig(['house', h.id], esc(h.name), 'pf-w')}` +
          (words ? `<div class="pf-motto">“${esc(words)}”</div>` : '') + (blaz ? `<div class="pf-m2">${esc(cap(blaz))}</div>` : '') +
          `<div class="pf-m2">${esc([h.rank, h.seat ? 'of ' + h.seat : ''].filter(Boolean).join(' '))}</div></div></div>`;
      } else s += empty('You belong to no house. Found one when you can.');
      if (folk.length) s += '<ul class="pf-folk">' + folk.map(f => `<li><button type="button" class="pf-person" data-a="ov" data-v="person:${esc(f.p.id)}"><span class="pf-pp">${P ? P.svg(f.p, 40) : ''}</span><span class="pf-pn"><b>${esc(A.fullName(f.p, false))}</b><span class="pf-m2">${esc(f.rel)}, ${esc(PF.cap(A.stage(f.p)))}${f.p.alive ? '' : ', dead'}</span></span></button></li>`).join('') + '</ul>';
      else s += empty('No close kin are living.');
      return s + '<button type="button" class="small" data-a="ov" data-v="tree">The family tree</button>';
    },
  });

  PF.addSection({
    k: 'gear', title: 'Gear and heirlooms',
    sum: p => { const g = PF.gear(p).filter(x => !x.empty); return g.length ? g.slice(0, 2).map(x => x.name).join(', ') : 'Nothing but your clothes'; },
    body: p => {
      let s = '<ul class="pf-slots">' + PF.gear(p).map(g => `<li>${trig(['gearSlot', g.slot], `<span class="pf-k">${esc(g.label)}</span><span class="pf-w${g.empty ? ' pf-no' : ''}">${esc(g.name)}</span>`, 'pf-slot', 'div')}</li>`).join('') + '</ul>';
      const named = PF.named(p), heir = PF.heirlooms(p);
      s += '<h4 class="pf-h2">Heirlooms and things you keep</h4>';
      if (named.length || heir.length) s += '<ul class="pf-list">' + named.map(x => li(cap(x.kind), note('Named by you. It remembers what you did together.', esc(x.name) + (x.years ? ` <span class="pf-m2">with you ${esc(x.years === 1 ? 'a year' : x.years + ' years')}</span>` : ''), 'pf-w'))).join('') +
        heir.map(x => li('Handed down', note('A thing that passes from one of your house to the next.', esc(x.name) + (x.from ? ` <span class="pf-m2">from ${esc(x.from)}</span>` : ''), 'pf-w'))).join('') + '</ul>';
      else s += empty('No heirloom yet, and nothing named. A blade or a horse takes its name from what you do together.');
      return s + '<button type="button" class="small" data-a="tab" data-v="holdings">Holdings and armoury</button>';
    },
  });

  PF.addSection({
    k: 'years', title: 'Years, health and marks',
    sum: p => `${PF.stageWord(p)}, ${PF.vital('health', p).word}`,
    body: p => {
      const m = PF.marks(p), age = A.age(p);
      let s = '<ul class="pf-list">';
      s += li('Age', trig(['age', p.id], `${esc(age)} years, ${esc(PF.stageWord(p))}`, 'pf-w'));
      s += li('Health', trig(['health', ''], esc(PF.vital('health', p).word), 'pf-w'));
      s += li('Born', note('Where and when you were born, in the world\'s count of years.', `${esc(p.born)} AR, ${esc(A.provName ? A.provName(p.home) : '')}`, 'pf-w'));
      s += '</ul><h4 class="pf-h2">Wounds</h4>';
      s += m.healing.length ? '<ul class="pf-chips2">' + m.healing.map(w => `<li>${trig(['wound', w.k], esc(w.name), 'pf-chip pf-bad')} <span class="pf-m2">heals ${esc(PF.healWord(w.until))}</span></li>`).join('') + '</ul>' : empty('Sound in every part.');
      s += '<h4 class="pf-h2">Scars and lasting marks</h4>';
      s += m.lasting.length ? '<ul class="pf-chips2">' + m.lasting.map(w => `<li>${trig(['wound', w.k], esc(w.name), 'pf-chip pf-bad')}</li>`).join('') + '</ul>' : empty('None. Yet.');
      return s;
    },
  });

  PF.addSection({
    k: 'measured', title: 'Measured in the world\'s units',
    sum: () => 'Height, strength, speed and mind',
    body: p => { let h = ''; try { h = VS && VS.sheetHtml ? VS.sheetHtml(p, { noLegend: true }) : ''; } catch (e) {} return h || empty('Too young to measure.'); },
  });

  PF.addSection({
    k: 'origins', title: 'Character, birth and faith',
    sum: p => { const R = GD.RACES[p.race] || {}, f = A.faith(p.faith); const tr = (p.traits || []).filter(t => GD.TRAITS[t]).slice(0, 3).map(t => GD.TRAITS[t].name.toLowerCase()); return tr.length ? cap(tr.join(', ')) : `${R.name || ''}${f ? ', ' + f.name : ''}`; },
    body: p => {
      const R = GD.RACES[p.race] || {}, c = A.culture(p.cult), f = A.faith(p.faith), app = p.app || {};
      const tr = (p.traits || []).filter(t => GD.TRAITS[t]).map(t => trig(['trait', t], esc(GD.TRAITS[t].name), 'pf-chip'))
        .concat((p.quirks || []).filter(q => GD.QUIRKS[q]).map(q => trig(['quirk', q], esc(GD.QUIRKS[q].name), 'pf-chip')));
      let s = tr.length ? `<div class="pf-chips" aria-label="Character">${tr.join('')}</div>` : '';
      s += '<ul class="pf-list">';
      s += li('People', trig(['race', p.race], esc(R.name || ''), 'pf-w') + (c ? ` <span class="pf-m2">${esc(c.name)}</span>` : ''));
      if (f) s += li('Faith', trig(['faith', f.id], esc(f.name), 'pf-w'));
      s += li('Realm', esc(A.realmName ? A.realmName(p.realm) : ''));
      s += li('Tongues', esc((p.langs || []).join(', ')) + (p.literate ? ' <span class="pf-m2">reads and writes</span>' : ' <span class="pf-m2">cannot read</span>'));
      s += li('Looks', note('The colour of your hair and eyes, and how you are built.', esc([GD.HAIR_NAMES[app.hair], GD.EYE_NAMES[app.eye]].filter(Boolean).join(', ').toLowerCase() + ', ' + (app.build || '')), 'pf-w'));
      if (p.blood) { const BL = LORE.bloodlines && LORE.bloodlines[p.blood.id]; if (BL) s += li('Blood', trig(['blood', ''], esc(BL.name), 'pf-w')); }
      return s + '</ul>';
    },
  });

  PF.sectionHtml = function (def, p) {
    const open = !!PF.forceOpen || (PF.open[def.k] !== undefined ? !!PF.open[def.k] : !!def.open); // Records: the posts and the deeds start open, the rest folded
    let sum = ''; try { sum = def.sum ? def.sum(p) : ''; } catch (e) {}
    let body = ''; if (open) { try { body = def.body(p); } catch (e) { console.error('profile section ' + def.k, e); body = empty('This part could not be drawn.'); } }
    return `<section class="pf-sec${open ? ' open' : ''}" data-k="${esc(def.k)}"><h3 class="pf-sech"><button type="button" class="pf-fold" data-a="pfFold" data-v="${esc(def.k)}" aria-expanded="${open}" aria-controls="pf-b-${esc(def.k)}"><span class="pf-chev" aria-hidden="true"></span><span class="pf-st">${esc(def.title)}</span><span class="pf-sum">${esc(sum)}</span></button></h3><div class="pf-body" id="pf-b-${esc(def.k)}"${open ? '' : ' hidden'}>${body}</div></section>`;
  };

  // ---- the small panels under the card: one at a time, chosen by tabs ---------------------------------------------------------
  PF.PANELS = [];
  PF.addPanel = function (def, before) {
    if (!def || !def.k || PF.PANELS.some(x => x.k === def.k)) return false;
    const i = before ? PF.PANELS.findIndex(x => x.k === before) : -1;
    if (i >= 0) PF.PANELS.splice(i, 0, def); else PF.PANELS.push(def);
    return true;
  };
  // on the page a skill is one control (the whole row opens its description); Records keeps the tier as its own
  const skillRow = r => trig(['skill', r.k], `<span class="pf-l">${esc(r.name)}${r.apt === 'apt' ? ' <span class="pf-apt" aria-label="quick to learn">★</span>' : r.apt === 'slow' ? ' <span class="pf-apt" aria-label="slow to learn">▽</span>' : ''}</span><span class="pf-tier">${esc(r.tier)}</span><span class="pf-prog" aria-hidden="true"><i style="width:${Math.round(r.frac * 100)}%"></i></span>`, 'pf-sk', 'li');
  PF.addPanel({ k: 'skills', label: 'Skills', body: p => {
    const arts = PF.styles(p).filter(x => x.rank > 0).slice(0, 2), rows = PF.skills(p, false).slice(0, 5);
    let s = '';
    if (arts.length) s += '<ul class="pf-list">' + arts.map(x => li(x.main ? 'Main style' : 'Style', `${note('A way of fighting taught by a school or a house. Each rank unlocks techniques you can use in a duel.', esc(x.name), 'pf-w')} <span class="pf-m2">${esc(x.rankWord)}</span>`)).join('') + '</ul>';
    s += rows.length ? '<ul class="pf-skills">' + rows.map(skillRow).join('') + '</ul>' : empty('Nothing practised yet. Practise something.');
    return s;
  } });
  PF.addPanel({ k: 'gear', label: 'Gear', body: p => {
    const g = PF.gear(p).filter(x => !x.empty);
    return g.length ? '<ul class="pf-slots">' + g.map(x => `<li>${trig(['gearSlot', x.slot], `<span class="pf-k">${esc(x.label)}</span><span class="pf-w">${esc(x.name)}</span>`, 'pf-slot', 'div')}</li>`).join('') + '</ul>' : empty('Nothing but your clothes.');
  } });
  PF.addPanel({ k: 'house', label: 'Family', body: p => {
    const h = p.house ? A.house(p.house) : null, P = FIG(), folk = PF.household(p).slice(0, 6);
    let s = '';
    if (h) {
      const ar = (A.ID && A.ID.arms && A.ID.arms(p)) || null, words = (ar && ar.words) || h.words || '';
      s += `<div class="pf-house"><div class="pf-coat" aria-hidden="true">${PF.arms(p, 44)}</div><div class="pf-hn">${trig(['house', h.id], esc(h.name), 'pf-w')}${words ? `<div class="pf-motto">“${esc(words)}”</div>` : ''}</div></div>`;
    } else s += empty('You belong to no house.');
    if (folk.length) s += '<ul class="pf-folk">' + folk.map(f => `<li><button type="button" class="pf-person" data-a="ov" data-v="person:${esc(f.p.id)}"><span class="pf-pp">${P ? P.svg(f.p, 40) : ''}</span><span class="pf-pn"><b>${esc(A.fullName(f.p, false))}</b><span class="pf-m2">${esc(f.rel)}${f.p.alive ? '' : ', dead'}</span></span></button></li>`).join('') + '</ul>';
    else s += empty('No close kin are living.');
    return s;
  } });
  PF.addPanel({ k: 'traits', label: 'Traits', body: p => {
    const tr = (p.traits || []).filter(t => GD.TRAITS[t]).map(t => trig(['trait', t], esc(GD.TRAITS[t].name), 'pf-chip'))
      .concat((p.quirks || []).filter(q => GD.QUIRKS[q]).map(q => trig(['quirk', q], esc(GD.QUIRKS[q].name), 'pf-chip')));
    return tr.length ? `<div class="pf-chips" aria-label="Character">${tr.join('')}</div>` : empty('No marked trait yet. Your deeds will show one.');
  } });
  PF.tab = 'skills';
  try { const t = window.localStorage && window.localStorage.getItem('ardan_pf_tab'); if (t) PF.tab = t; } catch (e) {}
  PF.panelOf = k => PF.PANELS.find(x => x.k === k) || PF.PANELS[0];
  PF.panelBody = (def, p) => { try { return def.body(p); } catch (e) { console.error('profile panel ' + def.k, e); return empty('This part could not be drawn.'); } };
  PF.tabs = function (p) {
    const cur = PF.panelOf(PF.tab);
    return `<div class="pf-lower"><div class="pf-tabs" role="tablist" aria-label="More about you">` +
      PF.PANELS.map(d => `<button type="button" role="tab" class="pf-tab" id="pf-t-${esc(d.k)}" data-a="pfTab" data-v="${esc(d.k)}" aria-selected="${d === cur}" aria-controls="pf-panel" tabindex="${d === cur ? 0 : -1}">${esc(d.label)}</button>`).join('') +
      `<button type="button" class="pf-reclink" data-a="pfView" data-v="records">Records <span aria-hidden="true">›</span></button></div>` +
      `<div class="pf-panel" id="pf-panel" role="tabpanel" aria-labelledby="pf-t-${esc(cur.k)}">${PF.panelBody(cur, p)}</div></div>`;
  };

  // ---- the two views of the page ------------------------------------------------------------------------------------------------
  // 'profile' (the default): the card, the sheet and one panel. 'records': the past and the long reads, reached from the link.
  PF.view = 'profile';
  PF.page = function (p) {
    const phone = !!(UI.isPhone && UI.isPhone());
    if (PF.view === 'records') return PF.records(p);
    return `<div class="pf" data-pf="1"><div class="pf-hero">${PF.figure(p, phone)}${PF.card(p)}${PF.sheet(p)}</div>${PF.tabs(p)}</div>`;
  };
  PF.records = function (p) {
    return `<div class="pf pf-rec" data-pf="1" data-view="records"><header class="pf-rech"><button type="button" class="small" data-a="pfView" data-v="profile">‹ Back to profile</button><h2 class="pf-rect">Records of ${esc(A.fullName(p, false))}</h2><p class="pf-fine">The past and the long reads: posts held before, deeds, the body, birth and faith. Nothing here is needed to play.</p></header><div class="pf-secs">${PF.SECTIONS.map(d => PF.sectionHtml(d, p)).join('')}</div></div>`;
  };

  UI.TAB = UI.TAB || {};
  UI.TAB.profile = function (p) {
    try { return PF.page(p); } catch (e) { console.error('profile page', e); return '<p class="bad">Something went wrong drawing the profile.</p>'; }
  };

  // ---- actions -----------------------------------------------------------------------------------------------------------------
  const fill = sec => {
    const k = sec.dataset.k, def = PF.SECTIONS.find(d => d.k === k), body = sec.querySelector(':scope > .pf-body');
    if (!def || !body) return;
    try { body.innerHTML = def.body(A.pc()); } catch (e) { console.error('profile section ' + k, e); body.innerHTML = empty('This part could not be drawn.'); }
    try { if (UI.TT && UI.TT.sweepTitles) UI.TT.sweepTitles(body); if (VS && VS.sweep) VS.sweep(body); } catch (e) {}
  };
  Object.assign(UI.A, {
    pfFold(v, el) {
      const sec = el && el.closest('.pf-sec'); if (!sec) return;
      const open = el.getAttribute('aria-expanded') !== 'true';
      PF.open[v] = open; PF.saveOpen();
      el.setAttribute('aria-expanded', String(open));
      sec.classList.toggle('open', open);
      const body = sec.querySelector(':scope > .pf-body');
      if (open) { fill(sec); body.hidden = false; } else { body.hidden = true; body.innerHTML = ''; }
    },
    pfTab(v, el) {
      const d = PF.panelOf(v), bar = el && el.closest('.pf-tabs'), panel = document.getElementById('pf-panel'); if (!bar || !panel) return;
      PF.tab = d.k; try { window.localStorage.setItem('ardan_pf_tab', d.k); } catch (e) {}
      for (const b of bar.querySelectorAll('.pf-tab')) { const on = b.dataset.v === d.k; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; }
      panel.setAttribute('aria-labelledby', 'pf-t-' + d.k);
      panel.innerHTML = PF.panelBody(d, A.pc());
      try { if (UI.TT && UI.TT.sweepTitles) UI.TT.sweepTitles(panel); } catch (e) {}
    },
    pfView(v) {
      PF.view = v === 'records' ? 'records' : 'profile';
      UI.render();
      const tb = document.getElementById('tabbody'); if (tb) tb.scrollTop = 0;
      try { if (UI.isPhone()) window.scrollTo(0, 0); } catch (e) {}
    },
  });

  // the rail's "Full profile" opens this page (the old overlay stays: UI.ov = { type: 'profile' } still draws it)
  const groups = A.V2T && A.V2T.groups;
  if (typeof groups === 'function') {
    A.V2T.PLACE = A.V2T.PLACE || {}; A.V2T.PLACE.profile = 'you';
    A.V2T.groups = function () {
      const G = groups.apply(this, arguments);
      try {
        const you = G.find(g => g.k === 'you');
        if (you && !you.subs.some(s => s[0] === 'profile')) you.subs.unshift(['profile', 'Profile']);
        const ph = UI.PHONE_SUBS && UI.PHONE_SUBS.you;
        if (ph && !ph.some(s => s[0] === 'profile')) { ph.unshift(['profile', 'Profile']); const y = ph.find(s => s[0] === 'you'); if (y) y[1] = 'Glance'; }
      } catch (e) { console.error('profile place', e); }
      return G;
    };
    A.V2T.groups();
  }
  UI.TAB_ALIAS = UI.TAB_ALIAS || {};
  // the Records view belongs to the page: opening the page from a tab or leaving it puts it back on the profile
  if (typeof UI.A.tab === 'function') { const tab = UI.A.tab; UI.A.tab = function (v) { if (v === 'profile') PF.view = 'profile'; return tab.apply(this, arguments); }; }
  { const setTab = UI.setTab; UI.setTab = function (v) { const r = setTab.apply(this, arguments); if (UI.tab !== 'profile') PF.view = 'profile'; return r; }; }

  // ---- the look ---------------------------------------------------------------------------------------------------------------
  const CSS = `
.pf{container:pf/inline-size;display:grid;gap:14px;padding:2px 0 12px}
.pf-hero{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;align-items:start}
.pf-fig{position:relative;border:1px solid #b79b5e;border-radius:8px;box-shadow:var(--e-2),inset 0 0 0 3px rgba(183,155,94,.3);overflow:hidden;background:var(--sunken);line-height:0;width:max-content;max-width:100%}
.pf-fig svg{display:block;max-width:100%;height:auto}
.pf-card{--pc-ink:#2b2118;--pc-ink2:#4d4030;--pc-ink3:#6f624d;--pc-red:#8c2f22;--pc-gold:#8a6a2a;min-width:0;color:var(--pc-ink);background:radial-gradient(120% 90% at 20% 0,#fbf5e4 0,#f3e9cf 60%,#ebdfc0 100%);border:1px solid #b79b5e;border-radius:8px;padding:14px 18px 14px;box-shadow:var(--e-2),inset 0 0 0 3px rgba(255,255,255,.35),inset 0 0 0 4px rgba(183,155,94,.35)}
.pf-card .pf-kick{color:var(--pc-red)}.pf-card .pf-name{color:var(--pc-ink)}.pf-card .pf-epi{color:var(--pc-gold)}.pf-card .pf-estate{color:var(--pc-ink2)}.pf-card .pf-place{color:var(--pc-ink3)}
.pf-card .pf-about{border-top-color:rgba(138,106,42,.35);color:var(--pc-ink)}
.pf-card .pf-m dt{color:var(--pc-gold)}.pf-card .pf-m dd,.pf-card .pf-w{color:var(--pc-ink)}
.pf-card .tt{text-decoration-color:rgba(43,33,24,.5)}.pf-card .tt:hover,.pf-card .tt:focus-visible{color:var(--pc-red)}
.pf-held{list-style:none;margin:6px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:2px 14px;font-size:var(--t-ui,14px)}
.pf-vits{display:flex;flex-wrap:wrap;gap:2px 16px;margin-top:10px;padding-top:8px;border-top:1px solid var(--line)}
.pf-vital{display:inline-flex;gap:6px;align-items:baseline;font-size:var(--t-ui,14px)}
.pf-hn2{text-decoration:underline dotted var(--ink-3);text-underline-offset:3px;cursor:pointer}
.pf-lower{display:grid;gap:8px}
.pf-tabs{display:flex;flex-wrap:wrap;gap:4px;align-items:center;border-bottom:1px solid var(--line)}
.pf-tab{all:unset;box-sizing:border-box;min-height:40px;padding:0 16px;display:inline-flex;align-items:center;cursor:pointer;font:600 var(--t-cap,12px)/1 var(--f-ui);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);border-bottom:2px solid transparent;margin-bottom:-1px}
.pf-tab:hover{color:var(--ink)}.pf-tab:focus-visible{outline:2px solid var(--focus);outline-offset:-2px}
.pf-tab[aria-selected="true"]{color:var(--accent);border-bottom-color:var(--accent)}
.pf-reclink{all:unset;box-sizing:border-box;margin-left:auto;min-height:40px;padding:0 4px;display:inline-flex;align-items:center;gap:4px;cursor:pointer;font-size:var(--t-small,13px);color:var(--ink-2);text-decoration:underline dotted var(--ink-3);text-underline-offset:4px}
.pf-reclink:hover,.pf-reclink:focus-visible{color:var(--accent-strong)}.pf-reclink:focus-visible{outline:2px solid var(--focus)}
.pf-panel{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:10px 14px 12px;display:grid;gap:6px;min-height:96px}
.pf-rec{max-width:880px}
.pf-rech{display:grid;gap:4px;justify-items:start}
.pf-rect{margin:2px 0 0;font:600 var(--t-h3,17px)/1.2 var(--f-name);letter-spacing:.05em;text-transform:uppercase;color:var(--ink)}
.pf-rec .pf-secs{grid-template-columns:minmax(0,1fr)}
.pf-top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.pf-kick{font:600 var(--t-cap,12px)/1.2 var(--f-ui);letter-spacing:.16em;text-transform:uppercase;color:var(--rubric-ink,var(--danger));display:flex;align-items:center;gap:7px}
.pf-glyph{display:inline-block;width:10px;height:10px;background:currentColor}
.pf-glyph.g0{clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)}
.pf-glyph.g1{clip-path:none;width:9px;height:9px}
.pf-glyph.g2{clip-path:polygon(25% 3%,75% 3%,100% 50%,75% 97%,25% 97%,0 50%)}
.pf-glyph.g3{clip-path:polygon(0 85%,0 25%,25% 55%,50% 10%,75% 55%,100% 25%,100% 85%)}
.pf-arms{flex:none;line-height:0;margin:-2px 0 -6px}
.pf-arms svg{width:44px;height:auto}
.pf-name{margin:4px 0 0;font:600 var(--t-h2,22px)/1.15 var(--f-name);letter-spacing:.04em;text-transform:uppercase;color:var(--ink);overflow-wrap:anywhere}
.pf-epi{font:italic var(--t-small,13px)/1.3 var(--f-prose);color:var(--accent)}
.pf-estate{font:italic var(--t-prose,15px)/1.3 var(--f-prose);color:var(--ink-2);margin-top:2px}
.pf-place{font-size:var(--t-small,13px);color:var(--ink-3);margin-top:1px}
.pf-about{margin:8px 0 8px;padding-top:8px;border-top:1px solid var(--line);font:var(--t-prose,15px)/1.45 var(--f-prose);color:var(--ink)}
.pf-measures{margin:0;display:grid;gap:1px}
.pf-m{display:grid;grid-template-columns:5.2em minmax(0,1fr);gap:8px;align-items:baseline;padding:2px 0}
.pf-m dt{font:600 var(--t-cap,12px)/1.3 var(--f-ui);letter-spacing:.14em;text-transform:uppercase;color:var(--accent)}
.pf-m dd{margin:0;font-size:var(--t-ui,14px);color:var(--ink)}
.pf-chips{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px}
.pf-chip{display:inline-block;border:1px solid var(--line-strong);border-radius:999px;padding:1px 9px;font-size:var(--t-small,13px);color:var(--ink-2);background:var(--surface)}
.pf-chip.pf-bad{border-color:var(--danger-line);color:var(--danger)}
.pf .tt{cursor:pointer;text-decoration:underline dotted var(--ink-3);text-underline-offset:3px}
.pf .tt.pf-row,.pf .tt.pf-slot,.pf .tt.pf-chip{text-decoration:none}
.pf .tt.pf-chip{border-bottom:1px solid var(--line-strong)}
.pf .tt:hover,.pf .tt:focus-visible{color:var(--accent-strong)}
.pf-sheet{min-width:0;background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:8px 12px 10px}
.pf-h{margin:8px 0 2px;font:600 var(--t-cap,12px)/1.3 var(--f-ui);letter-spacing:.16em;text-transform:uppercase;color:var(--accent)}
.pf-h:first-child{margin-top:2px}
#game .pf [data-tt].pf-row,#game .pf .pf-row{display:grid;border-bottom:1px solid var(--line);grid-template-columns:7.4em 74px minmax(0,1fr);gap:8px;align-items:center;min-height:30px;padding:1px 4px;margin:0 -4px;border-radius:5px;font-size:var(--t-ui,14px)}
.pf-row:last-of-type{border-bottom-color:transparent}
.pf-row:hover{background:var(--accent-tint)}
.pf-l{display:flex;align-items:center;gap:6px;color:var(--ink-2);min-width:0}
.pf-ico{display:inline-grid;color:var(--ink-3)}
.pf-ico svg{width:15px;height:15px}
.pf-v{font-weight:600;color:var(--ink)}
.pf-pips{display:flex;gap:2px;height:9px}
.pf-pips i{flex:1;min-width:0;border-radius:2px;background:var(--line);box-shadow:inset 0 0 0 1px transparent}
.pf-pips i.on{background:var(--pf-c,var(--accent))}
.pf-pips i[data-pot]{background:transparent;box-shadow:inset 0 0 0 1px var(--pf-c,var(--accent))}
.pf-stat.s-str{--pf-c:var(--st-str)}.pf-stat.s-spd{--pf-c:var(--st-spd)}.pf-stat.s-ins{--pf-c:var(--st-ins)}.pf-stat.s-sta{--pf-c:var(--st-sta)}.pf-stat.s-int{--pf-c:var(--st-int)}.pf-stat.s-wil{--pf-c:var(--st-wil)}
.pf-bar{display:block;height:6px;border-radius:3px;background:var(--line);overflow:hidden}
.pf-bar i{display:block;height:100%;background:var(--vital,var(--ink-2));border-radius:3px}
.pf-vital.v-health .pf-bar i{background:var(--vital-health)}
.pf-key{margin-top:6px;font-size:var(--t-cap,12px);color:var(--ink-3)}
.pf-secs{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr));gap:8px;align-items:start}
.pf-sec{background:var(--surface);border:1px solid var(--line);border-radius:8px;min-width:0}
.pf-sec.open{border-color:var(--accent-rule)}
.pf-sech{margin:0;font:inherit}
.pf-fold{all:unset;box-sizing:border-box;display:grid;grid-template-columns:18px minmax(0,1fr);column-gap:8px;width:100%;min-height:44px;padding:6px 12px;cursor:pointer;align-items:center;border-radius:8px}
.pf-fold:focus-visible{outline:2px solid var(--focus);outline-offset:-2px}
.pf-fold:hover{background:var(--accent-tint)}
.pf-chev{grid-row:1 / span 2;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid var(--accent);transition:transform .15s ease;justify-self:center}
.pf-fold[aria-expanded="false"] .pf-chev{transform:rotate(-90deg)}
.pf-st{font:600 var(--t-ui,14px)/1.25 var(--f-name);letter-spacing:.05em;text-transform:uppercase;color:var(--ink)}
.pf-sum{grid-column:2;font-size:var(--t-small,13px);color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pf-fold[aria-expanded="true"] .pf-sum{display:none}
.pf-body{padding:2px 12px 12px;display:grid;gap:6px}
.pf-body[hidden]{display:none}
.pf-list,.pf-slots,.pf-skills,.pf-folk,.pf-chips2{list-style:none;margin:0;padding:0;display:grid;gap:3px}
.pf-li{display:grid;grid-template-columns:6.6em minmax(0,1fr);gap:8px;align-items:baseline;font-size:var(--t-ui,14px)}
.pf-k{font:600 var(--t-cap,12px)/1.3 var(--f-ui);letter-spacing:.1em;text-transform:uppercase;color:var(--accent)}
.pf-w{color:var(--ink);font-weight:600}
.pf-m2{color:var(--ink-3);font-size:var(--t-small,13px);font-weight:400}
.pf-h2{margin:8px 0 2px;font:600 var(--t-small,13px)/1.3 var(--f-ui);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-2)}
.pf-empty,.pf-fine{margin:2px 0;color:var(--ink-3);font-size:var(--t-small,13px)}
.pf-fight .pf-row{grid-template-columns:6.6em auto minmax(0,1fr);border-bottom:0}
#game .pf .tt.pf-sk{display:grid;grid-template-columns:minmax(0,1fr) 7.4em 64px;gap:8px;align-items:center;text-decoration:none;border:0;border-bottom:1px solid var(--line);padding:0 4px;margin:0 -4px;border-radius:5px}.pf .tt.pf-sk:hover{background:var(--accent-tint)}
.pf-sk{display:grid;grid-template-columns:minmax(0,1fr) 7.4em 64px;gap:8px;align-items:center;font-size:var(--t-ui,14px);min-height:26px}
.pf-tier{font-weight:600;color:var(--ink)}
.pf-prog{display:block;height:5px;border-radius:3px;background:var(--line);overflow:hidden}
.pf-prog i{display:block;height:100%;background:var(--accent)}
.pf-apt{color:var(--accent)}
.pf-more{justify-self:start;margin-top:4px}
.pf-slots{grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px}
#game .pf [data-tt].pf-slot,#game .pf .pf-slot{display:grid;gap:1px;border:1px solid var(--line);border-radius:6px;padding:5px 8px;background:var(--raised);min-height:46px;font-size:var(--t-small,13px)}
.pf-slot .pf-w{font-size:var(--t-ui,14px)}
.pf-no{color:var(--ink-3);font-weight:400}
.pf-house{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:center}
.pf-coat{line-height:0}.pf-coat svg{width:60px;height:auto}
.pf-motto{font:italic var(--t-prose,15px)/1.3 var(--f-prose);color:var(--ink-2)}
.pf-folk{grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:6px}
.pf-person{all:unset;box-sizing:border-box;display:grid;grid-template-columns:40px minmax(0,1fr);gap:8px;align-items:center;width:100%;min-height:48px;padding:3px 6px;border:1px solid var(--line);border-radius:6px;cursor:pointer;background:var(--raised)}
.pf-person:hover{border-color:var(--accent-rule)}.pf-person:focus-visible{outline:2px solid var(--focus)}
.pf-pp{line-height:0;border-radius:4px;overflow:hidden}.pf-pn{display:grid;min-width:0;font-size:var(--t-small,13px)}.pf-pn b{font-size:var(--t-ui,14px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pf-chips2{display:flex;flex-wrap:wrap;gap:4px 10px}
.pf-body .v2-row{grid-template-columns:6em minmax(0,1fr)}
@container pf (min-width:920px){.pf-hero{grid-template-columns:auto minmax(0,1.1fr) minmax(0,.9fr)}}
@container pf (min-width:600px) and (max-width:919px){.pf-hero{grid-template-columns:auto minmax(0,1fr)}.pf-sheet{grid-column:1 / -1}}
@container pf (max-width:599px){.pf-hero{grid-template-columns:124px minmax(0,1fr);gap:10px}.pf-sheet{grid-column:1 / -1}.pf-fig{width:124px}.pf-name{font-size:var(--t-h3,17px)}
 .pf-row{grid-template-columns:6.6em 64px minmax(0,1fr);min-height:44px}.pf-li{grid-template-columns:5.6em minmax(0,1fr)}.pf-sk,#game .pf .tt.pf-sk{grid-template-columns:minmax(0,1fr) 6.6em 44px;min-height:40px}.pf-tab{flex:1 1 auto;justify-content:center;padding:0 8px}.pf-reclink{flex:1 0 100%;margin-left:0;justify-content:flex-end;min-height:44px}.pf-m{grid-template-columns:4.6em minmax(0,1fr)}}
@media (prefers-reduced-motion:reduce){.pf-chev{transition:none}}
`;
  const put = () => { if (typeof document === 'undefined' || document.getElementById('pf-style')) return; const s = document.createElement('style'); s.id = 'pf-style'; s.textContent = CSS; (document.head || document.documentElement).appendChild(s); };
  if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }
})();
