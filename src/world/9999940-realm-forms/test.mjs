// 9999940-realm-forms (order 99, D-206): every realm of the lore is a kingdom, an empire, a principality, a merchant republic
// or a free city, named so; nothing a player reads (the lore, the lazy lore, every event, a new game's realms, houses and
// people) holds an old form's words; an old save's realms, breakaways, houses and people are carried over on load, people's
// names left alone; the realms keep their ways of rule (kind, succession, crown authority).

// the old forms' words as the player read them (written in pieces, as the page holds none of them)
const J = (...p) => p.join('');
const OLD = new RegExp(`\\b(${J('Sul', 'tan')}\\w*|${J('Em', 'ir')}(a|as|ate|ates|s)?|${J('Kh', 'an')}(s|ate|ates)?|${J('Kh', 'atun')}|${J('Confed', 'era')}\\w*|${J('Holy', ' See')}|${J('High Lumi', 'nar')}\\w*|${J('Free', ' Port')}|${J('Abbey of', ' Skyhold')}|${J('Halls of', ' Frostholm')}|${J('League of', ' Brannoch')}|${J('Do', 'ge')}s?|${J('Do', 'garessa')}|${J('do', 'geship')})\\b`, 'i');
const FORM_NAME = { kingdom: /^Kingdom of /, empire: /^Empire of /, principality: /^Principality of /, 'merchant republic': /^Merchant Republic of /, 'free city': /^Free City of / };

export default {
  // the lore's realms and a new game's: five forms, each named by its form, rulers with plain titles
  async rfForms(page) {
    const r = await page.evaluate((fn) => {
      const FN = Object.fromEntries(Object.entries(fn).map(([k, v]) => [k, new RegExp(v)]));
      T.enter({ seed: 11, realm: 'POL-17', status: 'noble', sex: 'M', startAge: 16 });
      const bad = [], count = {};
      for (const id of Object.keys(LORE.realms)) {
        if (id === 'POL-11' || id === 'POL-34') continue; // the orcs' realms are another builder's (order 98)
        const L = LORE.realms[id], R = A.S.realms[id], f = A.realmForm(R);
        count[f] = (count[f] || 0) + 1;
        if (L.form !== f || R.form !== L.form) bad.push(`${id}: lore ${L.form}, game ${R.form}, read ${f}`);
        if (!FN[f] || !FN[f].test(R.name)) bad.push(`${id} ${R.name} is not named as a ${f}`);
        if (!/^(King|Queen|Emperor|Prince|Prince-Bishop|Prince-Abbot|First Merchant|First Speaker|First Banker|Captain-General|Forge-Queen|Raja|Queen \/ Prince \(two claimants\))$/.test(R.title)) bad.push(`${id}: ruler's title ${R.title}`);
      }
      // the ways of rule are kept: an elected king of the clans, a prince-bishop chosen by the clergy, a council's prince
      const g = id => A.S.realms[id].gov;
      if (g('POL-19') !== 'elective' || g('POL-02') !== 'theocracy' || g('POL-27') !== 'theocracy' || g('POL-21') !== 'council' || g('POL-09') !== 'elective') bad.push('a custom of succession was lost');
      if (A.S.realms['POL-17'].type !== 'well realm' || A.S.realms['POL-12'].type !== 'nomad clans') bad.push('a realm lost its kind');
      // the style the page writes for a ruler
      const sty = A.rulerStyle({ sex: 'F', given: 'Ada', sur: 'Test' }, { title: 'Prince-Bishop' });
      if (!/^Princess-Bishop /.test(sty)) bad.push(`a woman Prince-Bishop reads ${sty}`);
      return { bad, count };
    }, Object.fromEntries(Object.entries(FORM_NAME).map(([k, v]) => [k, v.source])));
    const c = Object.entries(r.count).map(([k, v]) => `${v} ${k}`).join(', ');
    return { ok: r.bad.length === 0 && Object.keys(r.count).length === 5, detail: r.bad.length ? r.bad.join('; ') : `32 realms: ${c}` };
  },

  // nothing a player reads holds an old form's words
  async rfNoOldWords(page) {
    const r = await page.evaluate((src) => {
      const OLD = new RegExp(src, 'i'), hits = [];
      let bytes = 0;
      const look = (where, s) => { if (typeof s !== 'string' || !s) return; bytes += s.length; const m = s.match(OLD); if (m && hits.length < 12) hits.push(`${where}: ...${s.slice(Math.max(0, m.index - 50), m.index + m[0].length + 30).replace(/\s+/g, ' ')}...`); };
      look('LORE', JSON.stringify(Object.assign({}, LORE, { map: null, terrainJpg: null })));
      look('lazy lore', window.ARDAN_LORE ? window.ARDAN_LORE() : '');
      for (const id of Object.keys(A.EV)) {
        const e = A.EV[id];
        look('event ' + id, String(e.title || '') + ' ' + String(e.text || ''));
        for (const c of e.choices || []) look('choice ' + id, [c.t, c.r, c.win && c.win.r, c.lose && c.lose.r].map(x => String(x || '')).join(' '));
      }
      T.enter({ seed: 5, realm: 'POL-19', status: 'peasant', sex: 'M', startAge: 16 });
      T.play(2);
      const NAMES = new Set(['given', 'sur', 'name', 'nick', 'birthSur']);
      for (const R of Object.values(A.S.realms)) { look('realm', R.name); look('realm', R.title); look('realm', R.type); look('realm', JSON.stringify(R.primer || {})); }
      for (const h of Object.values(A.S.houses)) for (const k of Object.keys(h)) if (k !== 'name' && typeof h[k] === 'string') look('house ' + h.id, h[k]);
      for (const p of Object.values(A.S.people)) for (const k of Object.keys(p)) if (!NAMES.has(k) && typeof p[k] === 'string') look('person ' + p.id + '.' + k, p[k]);
      return { hits, bytes };
    }, OLD.source);
    return { ok: r.hits.length === 0 && r.bytes > 3e6, detail: r.hits.length ? r.hits.join(' | ') : `${(r.bytes / 1e6).toFixed(1)} MB of lore, events and a new game's realms, houses and people hold no old form's words` };
  },

  // an old save: its realms, a breakaway of an old kind, a faction's league, its houses and people carried over on load
  async rfOldSave(page) {
    const r = await page.evaluate(() => {
      const J = (...p) => p.join('');
      T.enter({ seed: 4, realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 });
      const S = A.S, R = S.realms;
      // the words a save from before order 99 holds
      Object.assign(R['POL-17'], { name: J('Sul', 'tanate of Qadir'), title: J('Sul', 'tan'), type: J('sul', 'tanate'), form: undefined });
      Object.assign(R['POL-19'], { name: J('Sahrim Confed', 'eracy'), title: 'Speaker', type: J('nomad confed', 'eration'), form: undefined });
      Object.assign(R['POL-21'], { name: 'Kesh', type: J('city', ' league'), form: undefined });
      Object.assign(R['POL-27'], { name: J('Abbey of', ' Skyhold'), title: 'Abbot', type: 'theocracy', form: undefined });
      Object.assign(R['POL-04'], { name: 'Republic of Lucerna', title: J('Do', 'ge'), form: undefined });
      R['POL-24'].primer = { ruler: J('Em', 'ir Karim Sabrani, ', 'Em', 'ir since 1086') };
      // a breakaway of the old kinds and a faction's league
      const any = Object.values(R).find(x => x.alive && !x.isRebel && !LORE.realms[x.id]);
      R['NEW-901'] = { id: 'NEW-901', name: 'Duchy of Testmark', short: 'Testmark', title: 'Duke', type: 'duchy', capital: 'Testmark', alive: true, fresh: { kind: 'duchy' } };
      R['NEW-902'] = { id: 'NEW-902', name: 'Blackthorn League', short: 'Blackthorn', title: 'Lord', type: 'kingdom', alive: true };
      void any;
      const h = Object.values(S.houses).find(x => x.realm === 'POL-12');
      h.title = J('Chief Knotter of the ', 'Kh', 'atun\'s Tallies');
      const p = Object.values(S.people).find(x => x.alive && !x.ruler && x.id !== S.pc);
      p.title = J('Kh', 'an of Ulun'); p.given = J('Em', 'ir');
      // a real load
      A.deserialize(JSON.parse(JSON.stringify(S)));
      const S2 = A.S, R2 = S2.realms, bad = [];
      const want = { 'POL-17': ['Kingdom of Qadir', 'King', 'well realm', 'kingdom'], 'POL-19': ['Kingdom of Sahrim', 'King', 'nomad clans', 'kingdom'], 'POL-21': ['Merchant Republic of Kesh', 'Prince', 'merchant towns', 'merchant republic'],
        'POL-27': ['Principality of Skyhold', 'Prince-Abbot', 'temple principality', 'principality'], 'POL-04': ['Merchant Republic of Lucerna', 'First Merchant', 'merchant republic', 'merchant republic'],
        'NEW-901': ['Principality of Testmark', 'Prince', 'duchy', 'principality'], 'NEW-902': ['Principality of Blackthorn', 'Prince', 'kingdom', 'principality'] };
      for (const [id, [n, t, ty, f]] of Object.entries(want)) { const x = R2[id]; if (x.name !== n || x.title !== t || x.type !== ty || A.realmForm(x) !== f) bad.push(`${id}: ${x.name}/${x.title}/${x.type}/${A.realmForm(x)}`); }
      if (R2['POL-24'].primer.ruler !== 'Prince Karim Sabrani, Prince since 1086') bad.push(`primer: ${R2['POL-24'].primer.ruler}`);
      if (S2.houses[h.id].title !== 'Chief Knotter of the Queen\'s Tallies') bad.push(`house: ${S2.houses[h.id].title}`);
      const p2 = S2.people[p.id];
      if (p2.title !== 'King of Ulun') bad.push(`person: ${p2.title}`);
      if (p2.given !== J('Em', 'ir')) bad.push('a person was renamed');
      // a second load changes nothing
      if (A.REALM_FORMS.carry(S2) !== 0) bad.push('carrying twice changed something');
      return bad;
    });
    return { ok: r.length === 0, detail: r.length ? r.join('; ') : 'an old save\'s realms, a breakaway duchy, a faction\'s league, a house and a person carried over on load; names and a second load untouched' };
  },
};
