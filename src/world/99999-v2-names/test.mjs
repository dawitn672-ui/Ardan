// 99999-v2-names: the eight realms read by their new names everywhere the player looks; the ordinary words and the
// other places that share a word stay; old saves load renamed; the world plays the same from a seed.
import { fileURLToPath, pathToFileURL } from 'node:url';

const VENDOR = fileURLToPath(new URL('../../../vendor/ardan-b593143.html', import.meta.url));
const IDS = ['POL-32', 'POL-21', 'POL-33', 'POL-19', 'POL-12', 'POL-34', 'POL-13', 'POL-11'];

// in the page: the old names as the player would read them (the realm's names, short names and their adjectives),
// and a sweep of everything readable: every tab, the Codex's pages, the realm views, the modal, titles, the canvas
const SETUP = () => {
  window.NMT = {
    OLD: /Amber Isles|Spice Coast|Blackreef|Sand Clans?\b|Nine Winds|Tusk Clans?\b|Highland League|\bHighland\b(?![ -](?:Spears?|March|Javelins|farmers|riding|custom holds)\b)|\b[Tt]he Horde\b(?! of Gorath)(?! Wars?\b)|\bAmber (?:fleet|ships?|marines?|merchants?|captains?|harbou?rs?)\b|\bTusk riders\b|\b[Tt]he Khanate\b(?! of)/,
    hits: [],
    look(where, s) {
      if (typeof s !== 'string' || !s) return;
      const m = s.match(NMT.OLD);
      if (m && NMT.hits.length < 12) NMT.hits.push(`${where}: …${s.slice(Math.max(0, m.index - 50), m.index + m[0].length + 30).replace(/\s+/g, ' ')}…`);
    },
    page(where) {
      NMT.look(where, document.body.innerText || '');
      for (const el of document.querySelectorAll('[title],[aria-label],[alt],[placeholder]'))
        for (const a of ['title', 'aria-label', 'alt', 'placeholder']) NMT.look(where + ' @' + a, el.getAttribute(a));
    },
    canvas() {
      const NM = A.V2NAMES, seen = [], host = NM && NM.raw && NM.raw.fillText ? NM.raw : CanvasRenderingContext2D.prototype;
      const o = host.fillText;
      host.fillText = function (t) { seen.push(String(t)); return o.apply(this, arguments); };
      return () => { host.fillText = o; return seen; };
    },
    sweep(tag) {
      const stop = NMT.canvas();
      let pages = 0;
      for (const t of T.tabs()) {
        UI.tab = t; UI.ov = null; UI.render(); NMT.page(tag + ' ' + t); pages++;
        // the Codex's own pages
        if (t === 'codex') {
          const ks = [...new Set([...document.querySelectorAll('[data-a="codex"]')].map(b => b.dataset.v))];
          for (const k of ks) { UI.codex = k; UI.render(); NMT.page(tag + ' codex/' + k); pages++; }
          UI.codex = null;
        }
        // any view this tab opens for a realm, opened for each of the eight
        const acts = [...new Set([...document.querySelectorAll('[data-a][data-v^="POL-"]')].map(b => b.dataset.a))].filter(a => UI.A[a]);
        for (const a of acts.slice(0, 6)) for (const id of ['POL-32', 'POL-21', 'POL-33', 'POL-19', 'POL-12', 'POL-34', 'POL-13', 'POL-11']) {
          try { UI.A[a](id); UI.render(); NMT.page(`${tag} ${t}/${a}(${id})`); pages++; } catch (e) {}
          UI.ov = null;
        }
      }
      UI.tab = 'life'; UI.ov = null; UI.render();
      for (const s of stop()) NMT.look(tag + ' canvas', s);
      return pages;
    },
    // what the player takes away: the Book's text file, read from the Blob the export hands the browser (a kept place
    // key, "Blackreef", once leaked here, past every display layer)
    async exported(tag) {
      NMT.look(tag + ' chronicleText', typeof A.chronicleText === 'function' ? A.chronicleText() : '');
      if (!UI.A.chronicleExport) return 0;
      const blobs = [], cou = URL.createObjectURL, rev = URL.revokeObjectURL, click = HTMLAnchorElement.prototype.click;
      URL.createObjectURL = b => { blobs.push(b); return 'blob:nm-test'; };
      URL.revokeObjectURL = () => {};
      HTMLAnchorElement.prototype.click = function () {};
      try { UI.A.chronicleExport(); } finally { URL.createObjectURL = cou; HTMLAnchorElement.prototype.click = click; setTimeout(() => { URL.revokeObjectURL = rev; }, 600); }
      let n = 0;
      for (const b of blobs) { const t = await b.text(); n += t.length; NMT.look(tag + ' export', t); }
      return n;
    },
    state(tag) {
      for (const e of A.S.log || []) for (const l of e.lines || []) NMT.look(tag + ' log', l[0]);
      for (const n of A.S.news || []) NMT.look(tag + ' news', n.t);
      for (const id of Object.keys(A.S.realms)) { const r = A.S.realms[id]; NMT.look(tag + ' realm', r.name); NMT.look(tag + ' realm', r.short); }
      const pc = A.pc(); if (pc) NMT.look(tag + ' title', pc.title);
    },
  };
};

const OLD_NAMES = {
  'POL-32': ['Sultanate of the Amber Isles', 'Amber Isles'], 'POL-21': ['League of the Spice Coast', 'Kesh'],
  'POL-33': ['Brotherhood of Blackreef', 'Blackreef'], 'POL-19': ['Confederacy of the Sand Clans', 'Sand Clans'],
  'POL-12': ['Khanate of the Nine Winds', 'Nine Winds'], 'POL-34': ['League of the Tusk Clans', 'Tusk Clans'],
  'POL-13': ['Highland League', 'Highland'], 'POL-11': ['Horde of Gorath', 'the Horde'],
};

export default {
  // the rules on the lines that matter: realm references change, other places and plain words stay
  async nmRules(pg) {
    const r = await pg.evaluate(() => {
      const NM = A.V2NAMES, bad = [];
      const CHANGE = [
        ['Confederacy of the Sand Clans', 'Sahrim Confederacy'],
        ['the price, and the Sand Clans are threatening to close the Salt Road', 'the price, and Sahrim is threatening to close the Salt Road'],
        ["Among the Sand Clans a traveler who accepts water", 'In Sahrim a traveler who accepts water'],
        ["The Sand Clans' unicorns", "Sahrim's unicorns"],
        ['A Nine Winds rider recognizes you', 'An Ulun rider recognizes you'],
        ['The Nine Winds envoy speaks', 'The Ulun envoy speaks'],
        // was 'Children of Ulun rides': the verb is the children's, not the realm's (the event "From the saddle")
        ['Children of the Nine Winds ride before they walk', 'Children of Ulun ride before they walk'],
        // after a preposition, or as one of two subjects, the name does not own the verb that follows
        ['Steppe horses from the Nine Winds come ashore', 'Steppe horses from Ulun come ashore'],
        ['the new ships promised to the Amber Isles are nearly done', 'the new ships promised to Ambrel are nearly done'],
        ['The Maruang of the Amber Isles have a storm-sense', 'The Maruang of Ambrel have a storm-sense'],
        ['Aldmark and the Sand Clans are at war', 'Aldmark and Sahrim are at war'],
        ['Blackreef hires 800 crossbowmen and the Nine Winds sell her oil', 'Corvasse hires 800 crossbowmen and Ulun sells her oil'],
        // the Horde was never plural: its verbs stay as they are
        ['where smugglers who arm the Horde are hanged', 'where smugglers who arm Gorath are hanged'],
        ['The other children in the Horde are watching.', 'The other children in Gorath are watching.'],
        ['the proudest clans of the Horde lose their ancestor', 'the proudest clans of Gorath lose their ancestor'],
        // an adverb between the name and its verb; an adverb after the name is not a noun
        ['and the Nine Winds now breed them', 'and Ulun now breeds them'],
        ['Wants a war with the Amber Isles badly enough', 'Wants a war with Ambrel badly enough'],
        ["the southern Sand Clans' debts", "the southern Sahrim clans' debts"],
        // a new name alone takes no article, as "of the {realm}" makes it in Kesh
        ['You are the first lance of the Kesh.', 'You are the first lance of Kesh.'],
        ['The Gorath is at war', 'Gorath is at war'],
        ['a Ulun rider', 'an Ulun rider'],
        ['the Tusk Clans take one part', 'Ughrak takes one part'],
        ['a Tusk drummer', 'an Ughrak drummer'],
        ['War-Chief of the Horde', 'War-Chief of Gorath'],
        ["The Horde's relays last ten minutes", "Gorath's relays last ten minutes"],
        ['Gorath founded the Horde at Urgol', 'Gorath founded the Horde of Gorath at Urgol'],
        ['the Horde-held Skardush Pass', 'the Gorath-held Skardush Pass'],
        ['first Speaker of the Highland League', 'first Speaker of the Kingdom of Brannoch'],
        ['Highland law throws traitors from the rock', 'Brannoch law throws traitors from the rock'],
        ['as Highlanders do on feast days', 'as Brannoch folk do on feast days'],
        ['Sultan of the Amber Isles, Guardian of the Wells', 'Sultan of Ambrel, Guardian of the Wells'],
        ['An Amber factor pays well', 'An Ambrel factor pays well'],
        ['the League of the Spice Coast', 'Kesh'], ['In the Khanate, people still look at the horse', 'In Ulun, people still look at the horse'],
        ['A merchant from the Spice Coast sells', 'A merchant from Kesh sells'],
        ['Brotherhood of Blackreef', 'Principality of Corvasse'],
        ["Blackreef's dragon", "Corvasse's dragon"],
        ['League of the Tusk Clans', 'Ughrak Dominion'],
        ['Khanate of the Nine Winds', 'Kingdom of Ulun'],
        // was '<b>Sahrim</b> win': the closing tag no longer hides the verb from the rule
        ['the <b>Sand Clans</b> win', '<b>Sahrim</b> wins'],
        ['<span title="the Sand Clans ride" data-v="Sand Clans">x</span>', '<span title="Sahrim rides" data-v="Sand Clans">x</span>'],
        ['the Sand Clans&#39; oases', 'Sahrim&#39;s oases'],
      ];
      const KEEP = ['the Kingsmere Amber Guild', 'raw amber off the Cold Bay shore', 'the Coldhaven Amber and Fish Guild',
        'the Amber Capes', 'a house on Amber Row', 'the Amber Road', 'Torvald the Amber King', 'a tapper of Great Amber',
        'the Highland March', 'the Highland Spears', 'Warden of the Highlands', 'the Western Highlands', 'highland silver',
        'nosebleeds in the highlands', 'Highland farmers and cattle-keepers', 'the Old Horde', 'Horde of Gorath',
        'the Second Horde War', 'in both Horde Wars', 'a horde of rats', 'mare (Horde)', 'Horde clans', 'Horde riders',
        'the Tusk Hills', 'the Tusk War', 'the Tusk Great Ride', 'The Copper-Tusk Finish', 'Grete Tuskcutter',
        'the Corsair Isles', 'the Monastery Isles', 'Sandfolk', 'the nine winds of the steppe', 'Amber eyes', 'Amber on the shore',
        // the new names as an adjective, in a compound, or with their people's word keep their article
        'the Kesh fleet', 'the Ulun envoy', 'The Sahrim–Aldmark War ends: Sahrim wins', 'the Gorath-held Skardush Pass',
        'the Sahrim Confederacy', 'In the Ughrak Dominion', 'The Brannoch and orc herders share the high meadows',
        'the Corvasse slips', 'an Ulun rider', 'rode to the new Ulun and swore'];
      for (const [a, b] of CHANGE) { const f = NM.fix(a); if (f !== b) bad.push(`${a} -> ${f} (want ${b})`); }
      for (const a of KEEP) { const f = NM.fix(a); if (f !== a) bad.push(`kept? ${a} -> ${f}`); }
      // the lore keeps them too, and the place keys
      const L = JSON.stringify([LORE.realms, LORE.families, LORE.houseDeep, LORE.cast]);
      for (const w of ['the Kingsmere Amber Guild', 'Highland March', 'Highland Spears', 'Old Horde', 'Amber Capes']) if (!JSON.stringify(LORE).includes(w) && !L.includes(w)) bad.push('lore lost ' + w);
      const p33 = (LORE.map.provinces || []).find(p => p.name === 'Blackreef');
      if (!p33) bad.push('the province key Blackreef is gone');
      const names = Object.fromEntries(['POL-32', 'POL-21', 'POL-33', 'POL-19', 'POL-12', 'POL-34', 'POL-13', 'POL-11'].map(id => [id, LORE.realms[id].name + ' / ' + LORE.realms[id].short]));
      return { bad, names, n: CHANGE.length + KEEP.length };
    });
    const want = { 'POL-32': 'Sultanate of Ambrel / Ambrel', 'POL-21': 'Kesh / Kesh', 'POL-33': 'Principality of Corvasse / Corvasse',
      'POL-19': 'Sahrim Confederacy / Sahrim', 'POL-12': 'Kingdom of Ulun / Ulun', 'POL-34': 'Ughrak Dominion / Ughrak',
      'POL-13': 'Kingdom of Brannoch / Brannoch', 'POL-11': 'Horde of Gorath / Gorath' };
    const wrong = Object.keys(want).filter(id => r.names[id] !== want[id]).map(id => `${id}: ${r.names[id]}`);
    const ok = !r.bad.length && !wrong.length;
    return { ok, detail: ok ? `${r.n} lines read right; the eight lore realms renamed` : [...r.bad, ...wrong].slice(0, 8).join(' | ') };
  },

  // a 20-year life in each of the eight realms: no old name in any event, log, news line, tab, Codex page, realm view,
  // title or map label; the life of a seed plays the same twice
  async nmLives(pg) {
    await pg.evaluate(SETUP);
    const out = [];
    for (const [i, id] of IDS.entries()) if (!process.env.NM_ONLY || process.env.NM_ONLY === id) {
      const race = id === 'POL-11' || id === 'POL-34' ? 'orc' : 'human';
      const r = await pg.evaluate(async ([id, race, seed]) => {
        NMT.hits = [];
        T.enter({ seed, race, realm: id, status: 'peasant', sex: seed % 2 ? 'M' : 'F', startAge: 16 });
        const at0 = A.S.realms[id].name + ' / ' + A.S.realms[id].short;
        let events = 0, pages = 0;
        const look = v => { if (!v) return; events++; NMT.look('event', v.title); NMT.look('event', v.text); for (const c of v.choices || []) NMT.look('choice', c.t); };
        for (let y = 0; y < 2; y++) {
          const how = T.play(10, { onEvent: look });
          pages += NMT.sweep(`${id} y${A.S.year}`);
          if (how === 'dead') break;
        }
        NMT.state(id);
        const exported = await NMT.exported(id);
        return { id, at0, events, pages, exported, year: A.S.year, hits: NMT.hits.slice() };
      }, [id, race, 300 + i]);
      out.push(r);
    }
    const det = await pg.evaluate(() => {
      const run = () => { T.enter({ seed: 909, race: 'human', realm: 'POL-19', status: 'peasant', sex: 'F', startAge: 18 }); T.play(4); return T.hash(A.S.people) + ':' + T.hash(A.S.realms) + ':' + A.rngState; };
      return [run(), run()];
    });
    const hits = out.flatMap(r => r.hits.map(h => r.id + ' ' + h));
    const ok = !hits.length && det[0] === det[1];
    return { ok, detail: `${out.map(r => `${r.at0} (${r.events} events, ${r.pages} pages, ${r.exported} chars exported, to ${r.year})`).join('; ')}; same seed twice ${det[0] === det[1]}` + (hits.length ? ` | OLD: ${hits.slice(0, 5).join(' | ')}` : '') };
  },

  // saves: a release save (Sand Clans, 1 year) and a v2 save holding the old names both load renamed and read right
  async nmOldSaves(pg, errs, { browser }) {
    const ctx = await browser.newContext(), vp = await ctx.newPage();
    let b64;
    try {
      await vp.goto(pathToFileURL(VENDOR).href);
      await vp.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
      b64 = await vp.evaluate(async () => {
        A.newGame({ seed: 61, race: 'human', realm: 'POL-19', status: 'peasant', sex: 'M', startAge: 20 }); UI.screen = 'game'; UI.render();
        const end = A.S.year + 1;
        for (let g = 0; g < 2000 && A.S.year < end; g++) { A.advance(400); let h, k = 0; while ((h = A.headReady()) && k++ < 500) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); } }
        const B = (await SAVES.encode(A.S, A.J)).bytes;
        let s = ''; for (let i = 0; i < B.length; i += 8192) s += String.fromCharCode.apply(null, B.subarray(i, i + 8192));
        return btoa(s);
      });
    } finally { await ctx.close(); }
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(async ([b64, OLD]) => {
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0)), out = {};
      const names = () => Object.fromEntries(Object.keys(OLD).map(id => [id, A.S.realms[id] && A.S.realms[id].short]));
      // 1. the release's save
      const d = await SAVES.decode(bytes);
      out.oldIn = d.S.realms['POL-19'].name;
      out.loaded = UI.enterSaveSafe(d);
      out.steps = A.V2SAVE && A.V2SAVE.last ? A.V2SAVE.last.steps : null;
      out.release = names();
      NMT.hits = []; UI.screen = 'game'; out.pages = NMT.sweep('release save'); NMT.state('release save');
      out.exported = await NMT.exported('release save');
      out.relHits = NMT.hits.slice();
      // 2. a v2 save made before the names: the old names written back into a fresh state, saved and loaded
      T.enter({ seed: 62, race: 'human', realm: 'POL-13', status: 'peasant', sex: 'F', startAge: 20 }); T.play(1);
      for (const id in OLD) { A.S.realms[id].name = OLD[id][0]; A.S.realms[id].short = OLD[id][1]; }
      const e = await SAVES.encode(A.S, A.J), d2 = await SAVES.decode(e.bytes);
      out.v2loaded = UI.enterSaveSafe(d2);
      out.v2 = names();
      out.v2full = A.S.realms['POL-13'].name;
      NMT.hits = []; UI.screen = 'game'; NMT.sweep('v2 save'); out.v2Hits = NMT.hits.slice();
      // 3. its own save comes back exactly
      const e3 = await SAVES.encode(A.S, A.J), d3 = await SAVES.decode(e3.bytes);
      out.exact = JSON.stringify(d3.S) === JSON.stringify(A.S);
      return out;
    }, [b64, OLD_NAMES]);
    const want = { 'POL-32': 'Ambrel', 'POL-21': 'Kesh', 'POL-33': 'Corvasse', 'POL-19': 'Sahrim', 'POL-12': 'Ulun', 'POL-34': 'Ughrak', 'POL-13': 'Brannoch', 'POL-11': 'Gorath' };
    const same = o => Object.keys(want).every(id => o[id] === want[id]);
    const ok = r.oldIn === 'Confederacy of the Sand Clans' && r.loaded && same(r.release) && !r.relHits.length && (!r.steps || r.steps.includes('names')) &&
      r.v2loaded && same(r.v2) && r.v2full === 'Kingdom of Brannoch' && !r.v2Hits.length && r.exact;
    return { ok, detail: `release save (${r.oldIn}) loaded ${r.loaded}, steps ${r.steps && r.steps.join(',')}, renamed ${same(r.release)}, ${r.pages} pages and ${r.exported} chars exported clean ${!r.relHits.length}; ` +
      `v2 save with old names renamed ${same(r.v2)} (${r.v2full}), clean ${!r.v2Hits.length}; own save exact ${r.exact}` +
      (r.relHits.length || r.v2Hits.length ? ' | OLD: ' + [...r.relHits, ...r.v2Hits].slice(0, 4).join(' | ') : '') };
  },

  // the renamed sea realms keep their shore (by id now), and the orc schools still know the Ughrak Dominion
  async nmPlaces(pg) {
    const r = await pg.evaluate(() => {
      const out = { coast: {}, seaId: !!(A.V2MAP && A.V2MAP.SEA_ID) };
      for (const seed of [11, 12]) {
        T.enter({ seed, race: 'human', realm: 'POL-21', status: 'peasant', sex: 'M', startAge: 20 });
        for (const id of ['POL-32', 'POL-21', 'POL-33']) {
          const P = A.S.prov.filter(p => p.owner === id), cap = A.S.prov[A.S.realms[id].capitalProv] || P[0];
          (out.coast[id] = out.coast[id] || []).push(`${P.filter(p => p.coast).length}/${P.length}${cap && cap.coast ? ' seat on the shore' : ''}`);
        }
      }
      const pc = A.pc(), sc = A.schoolOptions ? A.schoolOptions(pc) : [];
      const why = n => (sc.find((s, i) => LORE.schools[i] && LORE.schools[i].realmName === n) || {}).why;
      out.ughrak = why('Ughrak Dominion'); out.horde = why('Horde of Gorath');
      out.schoolNames = LORE.schools.filter(s => /Ughrak|Gorath|Tusk/.test(s.realmName)).map(s => s.realmName);
      return out;
    });
    const shore = Object.values(r.coast).every(a => a.every(s => +s.split('/')[0] > 0));
    const orc = r.schoolNames.includes('Ughrak Dominion') ? r.ughrak !== undefined && r.ughrak === r.horde : true;
    return { ok: r.seaId && shore && orc, detail: `shore: ${JSON.stringify(r.coast)}; Ughrak school ${JSON.stringify(r.ughrak)} = Horde school ${JSON.stringify(r.horde)}` };
  },
};
