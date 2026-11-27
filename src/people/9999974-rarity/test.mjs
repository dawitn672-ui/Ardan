// Tests for src/people/9999974-rarity (orders 97 and 98, D-200): one rarity ladder for skills, titles, classes and items.
// Pure reads of the built game's data and screens: no world's luck is read, so a count here is exact.
const GATE = () => typeof A !== 'undefined' && !!A.RARITY && !!A.TT && !!A.LV && !!A.LV.CL && !!A.SK2;
const NO = { ok: false, detail: 'A.RARITY not in this build' };

export default {
  // the one ladder: basic, rare, epic, legendary, mythical; every skill, title, class and great being's item of the build
  // speaks it and no other word (no common, uncommon, unique or mythic); older words read as the ladder's (common and
  // uncommon are basic); an item's make is a craft grade apart from it; the screens that print a rarity print the ladder's
  // word: a title's card, a class's note, a great being's profile, the achievements' tiers, the gear's chips
  async rarityOneLadder(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const R = A.RARITY, L = R.LADDER, bad = [], n = { skills: 0, titles: 0, classes: 0, items: 0 };
      const want = (what, w) => { if (!L.includes(w)) bad.push(`${what}: ${w}`); };
      for (const s of (A.SK2.DATA && A.SK2.DATA.skills) || []) { n.skills++; want('skill ' + s.id, s.rarity); }
      for (const t of A.TT.LIST) { n.titles++; want('title ' + t.id, t.rarity); }
      for (const c of A.LV.CL.LIST) { n.classes++; want('class ' + c.id, c.rarity); if ('unique' in c) bad.push('class ' + c.id + ' says unique'); }
      const sheets = [].concat((A.DATA.legends || {}).legends || [], (A.DATA.power || {}).masters || []);
      for (const k of Object.keys(A.DATA)) if (/^figures\//.test(k) && A.DATA[k] && Array.isArray(A.DATA[k].figures)) sheets.push(...A.DATA[k].figures);
      for (const f of sheets) for (const i of f.items || []) {
        n.items++; want('item ' + i.n, i.rarity);
        if ('quality' in i) bad.push('item ' + i.n + ' says quality');
        if (i.make != null && !R.D.makes.includes(i.make)) bad.push('item ' + i.n + ' make ' + i.make);
      }
      // the older words, read as the ladder's
      const old = { common: R.of('common'), uncommon: R.of('Uncommon'), mythic: R.of('mythic'), unique: R.of('unique'), x: R.of('<b>') };
      // the screens: a title's card for every title held by the player, a class's note, an item's words
      T.enter({ seed: 9741, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
      const pc = A.pc(), words = [];
      pc.tt = { h: {} }; for (const t of A.TT.PERSON) pc.tt.h[t.id] = { y: A.S.year, w: '' };
      for (const t of A.TT.PERSON) words.push(A.TT.cardText(pc, t.id));
      if (A.SK2.capsReset) A.SK2.capsReset(); if (A.cacheResetAll) A.cacheResetAll();
      UI.tab = 'profile'; UI.ov = null; UI.render();
      words.push(document.body.innerText);
      for (const c of A.LV.CL.LIST.slice(0, 40)) { pc.lv = pc.lv || {}; pc.lv.cr = [[c.id, A.S.year, 0]]; words.push(A.LV.CL.note(pc)); }
      delete pc.tt; pc.lv.cr = [];
      for (const f of sheets) for (const i of f.items || []) words.push(R.itemWords(i));
      if (UI.qualChip) words.push(UI.qualChip('master'), UI.qualChip('fine'), UI.qualChip('crude'));
      const text = words.join(' \n ');
      const stray = (text.match(/\b(uncommon|unique|mythic)\b|\ba common class\b|\b[Cc]ommon\b(?= class| title)/g) || []).slice(0, 5);
      return { n, bad: bad.slice(0, 8), nb: bad.length, old, stray, ladder: L.join(', '),
        legendary: R.oneHolder('legendary') && R.oneHolder('mythical') && !R.oneHolder('epic'), rarest: R.rarest(['rare', 'mythical', 'basic']) };
    });
    const o = r.old;
    const ok = r.ladder === 'basic, rare, epic, legendary, mythical' && !r.nb && r.n.skills > 100 && r.n.titles > 40 && r.n.classes > 100 && r.n.items > 40 &&
      o.common === 'basic' && o.uncommon === 'basic' && o.mythic === 'mythical' && o.unique === null && o.x === null && !r.stray.length && r.legendary && r.rarest === 'mythical';
    return { ok, detail: `ladder ${r.ladder}; ${r.n.skills} skills, ${r.n.titles} titles, ${r.n.classes} classes, ${r.n.items} items read, ${r.nb} off the ladder${r.nb ? ': ' + r.bad.join('; ') : ''}; ` +
      `older words ${JSON.stringify(o)}; stray words on the screens ${JSON.stringify(r.stray)}; one holder legendary and mythical only ${r.legendary}; rarest ${r.rarest}` };
  },
};
