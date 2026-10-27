// 997-wilds: exploring reads the land, the places are the province's own, and finding one is remembered.
export default {
  async wildsReadLand(pg) {
    const r = await pg.evaluate(() => {
      const W = A.WILDS, out = {};
      for (const lands of ['known', 'great']) {
        const game = seed => { A.newGame({ seed, lands, race: 'human', realm: lands === 'great' ? 'POL-101' : 'POL-08', status: 'peasant', startAge: 20 }); return A.S.prov.map(P => W.sites(P).map(s => s.key + '=' + s.place).join(',')).join('|'); };
        const a = game(12), b = game(13);
        const kinds = new Set(); let none = 0;
        for (const P of A.S.prov) { const s = W.sites(P); if (!s.length) none++; s.forEach(x => kinds.add(x.kind)); }
        // the activity: a place of the land, its scene, and once chosen, remembered
        const pc = A.pc(), want = W.next(pc), h0 = T.hash(A.S), rng0 = A.rngState;
        W.sites(A.prov(pc.home), pc); W.next(pc); UI.tab = 'life'; UI.render();
        const pure = T.hash(A.S) === h0 && A.rngState === rng0;
        A.S.time = 9; A.doActivity('explore');
        const q = A.headReady(), v = q && A.eventView(q);
        const ev = q && q.ev, txt = v ? v.text : '';
        if (q) A.eventChoose(v.choices.length - 1);
        out[lands] = { same: a === b, kinds: [...kinds], none, provs: A.S.prov.length, want: want && want.place, ev, txt, raw: T.raw.test(txt), pure,
          found: !!(want && pc.sites && pc.sites[want.key] === A.S.year), logged: JSON.stringify(A.S.log.slice(-6)).includes('on the map you keep in your head') };
      }
      // an old save: a person with no pc.sites has found nothing
      const p = A.pc(); delete p.sites;
      out.old = W.next(p) != null && W.count(p) === 0;
      return out;
    });
    const k = r.known, g = r.great;
    const ok = k.same && g.same && k.kinds.length >= 6 && g.kinds.length >= 9 && g.kinds.some(x => ['river', 'pass', 'lake'].includes(x)) &&
      /^wl_/.test(k.ev || '') && /^wl_/.test(g.ev || '') && !k.raw && !g.raw && k.found && g.found && k.logged && k.pure && g.pure && r.old && k.none < k.provs / 3 && g.none < g.provs / 3;
    return { ok, detail: `Known World: ${k.kinds.length} kinds (${k.kinds.join(' ')}), ${k.none}/${k.provs} provinces without; Great Continent: ${g.kinds.length} kinds, ${g.none}/${g.provs} without; ` +
      `same places in another world seed ${k.same}/${g.same}; explore found "${g.want}" as ${g.ev}, recorded ${g.found}, logged ${k.logged}; render pure ${k.pure && g.pure}; old save ${r.old}; "${g.txt.slice(0, 120)}"` };
  },

  async wildsLairTeaches(pg) {
    const r = await pg.evaluate(() => {
      const W = A.WILDS;
      // a home with a lair: the first Great Continent province (in id order) whose sites include one
      A.newGame({ seed: 12, lands: 'great', race: 'human', realm: 'POL-101', status: 'peasant', startAge: 20 });
      const pc = A.pc();
      const home = A.S.prov.find(P => { pc.home = P.id; return W.sites(P, pc).some(s => s.kind === 'lair'); });
      if (!home) return { none: true };
      pc.sites = {}; for (const s of W.sites(home, pc)) if (s.kind !== 'lair') pc.sites[s.key] = 1105;
      for (const P of (home.adj || []).map(A.prov)) for (const s of W.sites(P, pc)) pc.sites[s.key] = 1105;
      const s = W.next(pc);
      A.S.time = 9; A.doActivity('explore');
      const q = A.headReady(), v = q && A.eventView(q);
      const before = A.BT.level(pc, s.beast);
      A.eventChoose(0);
      return { kind: s.kind, ev: q && q.ev, text: v && v.text, before, after: A.BT.level(pc, s.beast) };
    });
    if (r.none) return { ok: false, detail: 'no province with a lair' };
    return { ok: r.ev === 'wl_lair' && r.after >= 2 && r.after > r.before - 1 && !/\{/.test(r.text), detail: `${r.ev}: "${(r.text || '').slice(0, 140)}"; the beast known at level ${r.before} before, ${r.after} after watching it` };
  },
};
