// 999981-names-and-cultures (C7, D-058): the page holds none of the old realm names; four realm names fit their governments;
// a census of the realms' towns finds trade partners in ports and market towns and the neighbour in border provinces; in
// twelve worlds over thirty years no full name is shared in a town and no given name among brothers, sisters and first
// cousins; no fief is named in another people's language; the same seed names the same world; a save from before C7 loads
// with the new realm names.
// (--lives=N sets the number of worlds of nmTwins: 12 is the bar; the default is 6, as for every long test.)

// the old names as the player read them (the Nov 5 names the page used to rewrite as it drew)
const OLD_NAMES = /Amber Isles|Spice Coast|Blackreef|Sand Clans?\b|Nine Winds|Tusk Clans?\b|Highland League|\bHighland\b(?![ -](?:Spears?|March|Javelins|farmers|riding|custom holds)\b)|\b[Tt]he Horde\b(?! of Gorath)(?! Wars?\b)|\bAmber (?:fleet|ships?|marines?|merchants?|captains?|harbou?rs?)\b|\bTusk riders\b|\b[Tt]he [Kk]hanate\b(?! of)/;

export default {
  // the built page: every script the page unpacked (the core, the event packs) and the lazy lore, the realms' names in a new
  // game, every event title and text the engine can show
  async nmOldNames(page) {
    const r = await page.evaluate((src) => {
      const OLD = new RegExp(src);
      const hits = [];
      const look = (where, s) => { if (typeof s === 'string' && s) { const m = s.match(OLD); if (m && hits.length < 10) hits.push(`${where}: ...${s.slice(Math.max(0, m.index - 60), m.index + m[0].length + 40).replace(/\s+/g, ' ')}...`); } };
      let bytes = 0;
      for (const sc of document.scripts) { bytes += sc.textContent.length; look('script', sc.textContent); }
      const lore = window.ARDAN_LORE ? window.ARDAN_LORE() : ''; bytes += lore.length; look('lore', lore);
      look('LORE', JSON.stringify(LORE.realms));
      T.enter({ seed: 5, realm: 'POL-19', status: 'peasant', sex: 'M', startAge: 16 });
      for (const r of Object.values(A.S.realms)) { look('realm', r.name); look('realm', r.short); look('realm', r.capital); }
      for (const p of A.S.prov) look('province', p.name);
      for (const id of Object.keys(A.EV)) { const e = A.EV[id]; look('event ' + id, typeof e.title === 'string' ? e.title : ''); look('event ' + id, typeof e.text === 'string' ? e.text : String(e.text)); }
      T.play(3);
      look('log', JSON.stringify(A.S.log)); look('page', document.body.innerText);
      return { hits, bytes };
    }, OLD_NAMES.source);
    return { ok: r.hits.length === 0 && r.bytes > 3e6, detail: r.hits.length ? r.hits.join(' | ') : `${(r.bytes / 1e6).toFixed(1)} MB of the page, the lore, every event and a new game hold none of the old names` };
  },

  // the four realms whose old names contradicted their governments, and the other four the hack renamed
  async nmRealms(page) {
    const r = await page.evaluate(() => {
      T.enter({ seed: 3, realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 });
      // (order 99, D-206: the five forms; the orcs' two realms are another builder's)
      const want = { 'POL-12': ['Kingdom of Ulun', 'Ulun', 'King'], 'POL-13': ['Merchant Republic of Brannoch', 'Brannoch', 'First Speaker'], 'POL-33': ['Free City of Corvasse', 'Corvasse', 'Captain-General'],
        'POL-34': ['Ughrak Clans', 'Ughrak', 'War-Mother'], 'POL-32': ['Kingdom of Ambrel', 'Ambrel', 'King'], 'POL-21': ['Merchant Republic of Kesh', 'Kesh', 'Prince'], 'POL-19': ['Kingdom of Sahrim', 'Sahrim', 'King'], 'POL-11': ['Horde of Gorath', 'Gorath', 'War-Chief'] };
      const bad = [];
      for (const [id, [name, short, title]] of Object.entries(want)) {
        const R = A.S.realms[id];
        if (!R || R.name !== name || R.short !== short || R.title !== title) bad.push(`${id}: ${R && R.name}/${R && R.short}/${R && R.title}`);
      }
      // a name fits its people's way of rule, kept under the new form
      const fit = (id, rx, gov) => { const R = A.S.realms[id]; if (!rx.test(R.name) || !gov.test(`${R.type} ${R.gov}`)) bad.push(`${id} ${R.name} does not fit ${R.type}/${R.gov}`); };
      fit('POL-12', /^Kingdom of /, /nomad/i);
      fit('POL-13', /^Merchant Republic of /, /mountain|valleys/i);
      fit('POL-33', /^Free City of /, /pirate/i);
      fit('POL-34', /Clans$/, /clans|league/i);
      // the capital that shared the old name is the realm's name now, in the realm and on the map
      if (A.S.prov.filter((p) => p.name === 'Corvasse').length !== 1 || A.S.realms['POL-33'].capital !== 'Corvasse') bad.push('the capital of POL-33 is not Corvasse');
      return bad;
    });
    return { ok: r.length === 0, detail: r.length ? r.join('; ') : 'Kingdom of Ulun, Merchant Republic of Brannoch, Free City of Corvasse, Kingdom of Ambrel, Merchant Republic of Kesh, Kingdom of Sahrim (order 99); Ughrak Clans, Gorath unchanged' };
  },

  // CRITIQUE N1: where the people of a province come from. 35 realms (the continent's 34 and Prince Andros's Tessaria).
  async nmCensus(page) {
    const r = await page.evaluate(() => {
      T.enter({ seed: 7, realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 });
      const S = A.S, N = A.NAMES, DRAWS = 1000;
      const realms = Object.values(S.realms).filter((x) => x.alive !== false);
      const out = { realms: realms.length, trade: [], border: [], tradeBorder: [], noPartner: [], native: 0, n: 0 };
      for (const q of S.prov) {
        const home = S.realms[q.owner];
        if (!home || home.alive === false) continue;
        const nb = N.neighbours(q), border = Object.keys(nb).length > 0, trade = N.isTrade(q);
        if (!border && !trade) { out.native++; continue; }
        const partners = new Set(N.partners(q.owner));
        let foreign = 0, fromNb = 0, fromPartner = 0;
        for (let i = 0; i < DRAWS; i++) {
          const o = N.originOf(home.race, q.id);
          if (!o.home) { foreign++; if (nb[o.realm]) fromNb++; if (partners.has(o.realm)) fromPartner++; }
        }
        if (!foreign) { out.noPartner.push(`${q.name} (${q.owner})`); }
        const row = { name: q.name, realm: q.owner, foreign: foreign / DRAWS, nb: fromNb / DRAWS, partner: fromPartner / DRAWS };
        if (trade) out.trade.push(row);
        if (border) out.border.push(row);
        if (trade && border) out.tradeBorder.push(row);
      }
      return out;
    });
    const sum = (rows, k) => { const v = rows.map((x) => x[k]); return { n: v.length, min: Math.min(...v), mean: v.reduce((a, b) => a + b, 0) / v.length, max: Math.max(...v) }; };
    const T_ = sum(r.trade, 'partner'), B_ = sum(r.border, 'nb');
    const pc = (x) => `${(x.min * 100).toFixed(0)}-${(x.max * 100).toFixed(0)}% (mean ${(x.mean * 100).toFixed(0)}%)`;
    const slack = 0.045; // a province's own share drawn a thousand times strays by up to this much
    const fails = [];
    if (r.realms < 35) fails.push(`only ${r.realms} realms`);
    if (T_.mean < 0.15 || T_.mean > 0.35 || T_.min < 0.15 - slack || T_.max > 0.35 + slack) fails.push(`trade partners in ports and market towns ${pc(T_)}`);
    if (B_.mean < 0.2 || B_.mean > 0.4 || B_.min < 0.2 - slack || B_.max > 0.4 + slack) fails.push(`neighbours in border provinces ${pc(B_)}`);
    if (r.noPartner.length > 12) fails.push(`${r.noPartner.length} provinces draw nobody from abroad: ${r.noPartner.slice(0, 5).join(', ')}`);
    return { ok: !fails.length, detail: fails.length ? fails.join('; ') : `${r.realms} realms: ${T_.n} ports and market towns draw ${pc(T_)} from trade partners; ${B_.n} border provinces draw ${pc(B_)} from the neighbour; ${r.noPartner.length} provinces with no one abroad to draw`, data: { trade: T_, border: B_, noPartner: r.noPartner } };
  },

  // CRITIQUE N4: no twins. Twelve worlds, thirty years; the living of each town and the whole tree of kin.
  async nmTwins(page, errs, { lives }) {
    const WORLDS = Math.max(1, Math.min(12, +lives || 6));
    const starts = [
      { realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 }, { realm: 'POL-03', status: 'peasant', sex: 'F', startAge: 0 }, { realm: 'POL-17', status: 'merchant', sex: 'M', startAge: 20 },
      { realm: 'POL-20', status: 'noble', sex: 'F', startAge: 18 }, { realm: 'POL-25', status: 'royal', sex: 'M', startAge: 14 }, { realm: 'POL-11', status: 'peasant', sex: 'M', startAge: 17, race: 'orc' },
      { realm: 'POL-08', status: 'artisan', sex: 'F', startAge: 22 }, { realm: 'POL-14', status: 'noble', sex: 'M', startAge: 19 }, { realm: 'POL-24', status: 'peasant', sex: 'M', startAge: 15 },
      { realm: 'POL-02', status: 'noble', sex: 'F', startAge: 25 }, { realm: 'POL-22', status: 'merchant', sex: 'F', startAge: 21 }, { realm: 'POL-28', status: 'artisan', sex: 'M', startAge: 30, race: 'dwarf' },
    ];
    const res = [];
    for (let i = 0; i < WORLDS; i++) {
      const o = Object.assign({ seed: 9100 + i * 17 }, starts[i % starts.length]);
      res.push(await page.evaluate((o) => {
        T.enter(o);
        T.play(30);
        const S = A.S, people = Object.values(S.people);
        const full = (p) => A.fullName(p, false);
        const bad = { town: [], kin: [] };
        // a town: the living who are placed in a province of their own realm (a lore person left at the default 0 is not placed)
        const placed = (p) => { const q = S.prov[p.home]; return p.alive && q && (p.home !== 0 || q.owner === p.realm || q.orig === p.realm); };
        const towns = {};
        for (const p of people) if (placed(p)) (towns[p.home] = towns[p.home] || []).push(p);
        for (const [h, ps] of Object.entries(towns)) {
          const seen = {};
          for (const p of ps) { const k = full(p); if (seen[k]) bad.town.push(`${k} twice in ${S.prov[h].name} (${seen[k]} and ${p.id})`); else seen[k] = p.id; }
        }
        // kin: brothers and sisters, first cousins (the dead of the tree too)
        const kids = (id) => ((A.P(id) || {}).children || []).map(A.P).filter(Boolean);
        const groups = [];
        for (const p of people) {
          const ps = (p.parents || []).map(A.P).filter(Boolean);
          if (ps.length) groups.push({ who: 'sibling', list: [...new Set(ps.flatMap((q) => kids(q.id)))] });
          const gps = [...new Set(ps.flatMap((q) => (q.parents || []).map(A.P).filter(Boolean)))];
          if (gps.length) groups.push({ who: 'cousin', list: [...new Set(gps.flatMap((g) => kids(g.id)).flatMap((u) => kids(u.id)))] });
        }
        const done = new Set();
        for (const g of groups) {
          const seen = {};
          // two of one person's cousins are not each other's kin when they come from his two sides (D-108's marriages join
          // houses: a child of the Natarajans and a child of the Balans are both cousins of their cousin, not of each other):
          // the rule (D-058) is the namer's own, no brother, sister or first cousin of a person shares his name
          const close = (a, b) => (A.NAMES && A.NAMES.closeKin ? A.NAMES.closeKin(a).has(b.id) || A.NAMES.closeKin(b).has(a.id) : true);
          for (const p of g.list) {
            const q = (seen[p.given] || []).find((x) => close(x, p));
            if (q) { const key = [g.who, p.given, q.id, p.id].join('|'); if (!done.has(key)) { done.add(key); bad.kin.push(`${g.who}s ${q.id} and ${p.id} are both ${p.given} (${full(q)} / ${full(p)}${p.castId || p.famRole || q.castId || q.famRole ? ', lore' : ''})`); } }
            (seen[p.given] = seen[p.given] || []).push(p);
          }
        }
        return { seed: o.seed, realm: o.realm, people: people.length, alive: people.filter((p) => p.alive).length, year: S.year, bad };
      }, o));
    }
    const towns = res.flatMap((x) => x.bad.town.map((s) => `${x.seed}: ${s}`)), kin = res.flatMap((x) => x.bad.kin.map((s) => `${x.seed}: ${s}`));
    const loreKin = kin.filter((s) => /, lore\)/.test(s));
    const people = res.reduce((a, x) => a + x.people, 0);
    const ok = !towns.length && kin.length === loreKin.length;
    return { ok, detail: ok ? `${res.length} worlds x 30 years, ${people} people: no full name shared in a town, no given name among brothers, sisters and first cousins${loreKin.length ? ` (${loreKin.length} pairs of authored lore people kept their names)` : ''}` : `${towns.length} twins in a town: ${towns.slice(0, 4).join(' | ')}; ${kin.length - loreKin.length} kin sharing a name: ${kin.filter((s) => !/, lore\)/.test(s)).slice(0, 4).join(' | ')}` };
  },

  // CRITIQUE N3: a fief of a realm is named in its own people's language: from the realm's culture's pool of places
  async nmFiefs(page) {
    const r = await page.evaluate(() => {
      T.enter({ seed: 11, realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 });
      const S = A.S, N = A.V2N, D = A.DATA.names, bad = [], seen = new Set();
      if (!N || !N.lower) return { skip: 'no court' };
      let n = 0;
      for (const r of Object.values(S.realms)) {
        if (r.alive === false) continue;
        const cult = A.cultureFor(r.race || 'human', r.id), c = D.cultures[cult] || D.cultures['CUL-02'], pool = c.uses === 'common' ? D.common : D.pools[c.uses];
        const provs = S.prov.filter((q) => q.owner === r.id).slice(0, 6);
        for (const q of provs) for (const [rank, k] of [['viscount', 3], ['baron', 4], ['lord', 3]]) for (let i = 0; i < k; i++) {
          const g = N.lower(r.id, q.id, rank, i);
          n++;
          if (!g.place || !g.given || !g.house) bad.push(`${r.short} ${rank} ${i}: empty name (${g.given}/${g.house}/${g.place})`);
          else if (!pool.places.includes(g.place)) bad.push(`${r.short} (${cult}): ${g.title} is not a place of its people`);
          if (g.given && !g.hid && !(pool[g.sex === 'F' ? 'female' : 'male'].includes(g.given) || (c.accent && c.accent[g.sex === 'F' ? 'female' : 'male'].includes(g.given)) || (D.lean[r.id] && D.lean[r.id][g.sex === 'F' ? 'female' : 'male'].includes(g.given)))) bad.push(`${r.short}: holder ${g.given} is not a given name of its people`);
          seen.add(`${cult}`);
        }
      }
      return { bad: bad.slice(0, 8), n, nbad: bad.length, cultures: seen.size };
    });
    if (r.skip) return { ok: true, skip: r.skip };
    return { ok: r.nbad === 0 && r.n > 300, detail: r.nbad ? `${r.nbad} of ${r.n} fiefs: ${r.bad.join(' | ')}` : `${r.n} fiefs of ${r.cultures} peoples are all named from their own people's places and names, none empty` };
  },

  // the same seed and choices give the same names; a new game's people draw from the pools
  async nmDeterministic(page) {
    const run = () => page.evaluate(() => {
      T.enter({ seed: 321, realm: 'POL-14', status: 'noble', sex: 'F', startAge: 17 });
      T.play(6);
      return Object.values(A.S.people).map((p) => A.fullName(p) + '/' + p.cult + '/' + (p.org || '')).join(';');
    });
    const a = await run(), b = await run();
    return { ok: a === b && a.length > 5000, detail: a === b ? `the same world twice: ${a.split(';').length} people named alike` : 'the same seed named two worlds differently' };
  },

  // an older save: realm names by id; people keep what they were called
  async nmOldSaves(page) {
    const r = await page.evaluate(() => {
      T.enter({ seed: 4, realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 });
      const S = A.S, N = A.NAMES, J = (...p) => p.join(''), fin = {};
      for (const id of Object.keys(N.OLD)) fin[id] = [S.realms[id].name, S.realms[id].short];
      // as a save of the first v2 build held them, and of the hack's build
      S.realms['POL-19'].name = J('Confederacy of the ', 'Sand', ' Clans'); S.realms['POL-19'].short = J('Sand', ' Clans');
      S.realms['POL-12'].name = J('Khanate of the ', 'Nine', ' Winds');
      S.realms['POL-11'].short = J('the ', 'Horde');
      S.realms['POL-01'].name = 'Empire of Aldmark';
      const given = Object.values(S.people).slice(0, 30).map((p) => p.given).join();
      const n = N.renameState(S);
      const bad = [];
      for (const id of ['POL-19', 'POL-12', 'POL-11']) if (S.realms[id].name !== fin[id][0] || S.realms[id].short !== fin[id][1]) bad.push(`${id} is ${S.realms[id].name}/${S.realms[id].short}`);
      if (n !== 4) bad.push(`${n} changes`);
      if (given !== Object.values(S.people).slice(0, 30).map((p) => p.given).join()) bad.push('people were renamed');
      // a realm the player's life renamed is left alone
      S.realms['POL-19'].name = 'Empire of Sahrim';
      if (N.renameState(S) !== 0 || S.realms['POL-19'].name !== 'Empire of Sahrim') bad.push('a renamed realm was changed');
      return bad;
    });
    return { ok: r.length === 0, detail: r.length ? r.join('; ') : 'an older save\'s realms are renamed by id, a realm renamed in play and every person left alone' };
  },
};
