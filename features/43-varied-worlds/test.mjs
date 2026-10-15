// A different world each run: the world as written stays as written; a varied world differs in fortunes, borders,
// feuds and alliances from seed to seed, says so at birth, and plays.
const fingerprint = () => {
  const S = A.S, rs = Object.values(S.realms).filter(r => r.alive);
  return {
    moved: S.prov.filter(P => P.owner !== P.orig).length,
    wars: S.wars.map(w => w.att.concat(w.def).sort().join('+')).sort().join('|'),
    allies: rs.reduce((a, r) => a + (r.allies || []).length, 0),
    gold: rs.slice(0, 8).map(r => Math.round(r.treasury || 0)).join(','),
    stab: rs.slice(0, 8).map(r => Math.round(r.stability || 0)).join(','),
    owners: S.prov.map(P => P.owner).join(','),
  };
};

export default {
  async worldAsWritten(pg) {
    const r = await pg.evaluate(`(() => { const fingerprint = ${fingerprint.toString()};
      const out = [];
      for (const seed of [401, 402, 403]) { A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 }); out.push(fingerprint()); }
      return { same: out.every(f => f.owners === out[0].owners && f.gold === out[0].gold && f.wars === out[0].wars), moved: out.map(f => f.moved), notes: !!A.S.worldNotes };
    })()`);
    // the written world already has one province held by someone else (the Tessarian rebels), the same every run
    return { ok: r.same && r.moved.every(n => n === r.moved[0]) && !r.notes, detail: `three seeds, the world as written: identical ${r.same}, provinces away from their old owner ${r.moved.join(', ')} (the Tessarian war)` };
  },

  async worldsDiffer(pg) {
    const r = await pg.evaluate(`(() => { const fingerprint = ${fingerprint.toString()};
      const fs = [];
      for (let s = 0; s < 10; s++) {
        A.newGame({ seed: 410 + s, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20, world: 'varied' });
        fs.push(Object.assign(fingerprint(), { notes: (A.S.worldNotes || []).length }));
      }
      A.newGame({ seed: 499, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const canon = fingerprint();
      const distinct = k => new Set(fs.map(f => f[k])).size;
      return { moved: fs.map(f => f.moved), wars: distinct('wars'), owners: distinct('owners'), gold: distinct('gold'), allies: fs.map(f => canon.allies - f.allies), notes: fs.map(f => f.notes), canonAllies: canon.allies };
    })()`);
    const ok = r.owners === 10 && r.gold === 10 && r.wars >= 3 && r.moved.every(n => n >= 2) && r.notes.every(n => n >= 2);
    return { ok, detail: `ten varied worlds: ${r.owners} different maps (provinces moved ${r.moved.join(', ')}), ${r.gold} different treasuries, ${r.wars} different sets of wars, alliances broken ${r.allies.join(', ')} of ${r.canonAllies}` };
  },

  async variedWorldPlays(pg) {
    const r = await pg.evaluate(() => {
      const out = [];
      for (const seed of [421, 422, 423]) {
        A.newGame({ seed, race: 'human', realm: 'POL-02', status: 'artisan', sex: 'F', startAge: 18, world: 'varied' });
        const pc = A.pc(), homeOk = A.prov(pc.home) && A.prov(pc.home).owner === pc.realm;
        const end = A.S.year + 5;
        for (let m = 0; m < 400 && pc.alive && A.S.year < end; m++) {
          A.advance(60);
          let h, n = 0;
          while ((h = A.headReady()) && n++ < 300) {
            if (h.type === 'event') A.eventAuto(); else if (h.type === 'choice') A.choiceChoose(0); else if (h.type === 'battle') A.battleClose();
            else if (h.type === 'duel') { A.duelAuto(h.d); A.duelClose(); } else A.S.queue.shift();
          }
        }
        const told = A.S.log.flatMap(e => (e.lines || []).map(l => l[0])).find(l => /The world you are born into/.test(l));
        out.push({ homeOk, years: A.S.year - 1105, told });
      }
      return out;
    });
    const ok = r.every(x => x.homeOk && x.years >= 4 && x.told);
    return { ok, detail: `${r.map(x => `${x.years} years, home in own realm ${x.homeOk}`).join('; ')}. "${(r[0].told || '').slice(0, 220)}"` };
  },

  async menuStartsVaried(pg) {
    const r = await pg.evaluate(() => {
      const def = UI.crDefaults().world;
      UI.screen = 'create'; UI.cr = UI.crDefaults(); UI.step = 0;
      let screen = ''; for (let s = 0; s < 8; s++) { UI.step = s; try { screen += UI.renderCreate ? UI.renderCreate() : ''; } catch (e) {} }
      UI.cr = UI.crDefaults(); UI.cr.seed = 'menu-test';
      UI._newLifeOk = true; try { UI.startLife(); } finally { UI._newLifeOk = false; }
      const varied = Array.isArray(A.S.worldNotes);
      A.newGame({ seed: 7, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const base = A.S.prov.map(P => P.owner).join();
      UI.cr = UI.crDefaults(); UI.cr.seed = 'menu-test'; UI.cr.world = 'canon';
      UI._newLifeOk = true; try { UI.startLife(); } finally { UI._newLifeOk = false; }
      const canon = !A.S.worldNotes && A.S.prov.map(P => P.owner).join() === base;
      return { def, choice: /As written/.test(screen), varied, canon };
    });
    return { ok: r.def === 'varied' && r.varied && r.canon, detail: `menu default ${r.def}; a menu life gets a varied world ${r.varied}, "As written" keeps the map ${r.canon}; choice on the creation screen ${r.choice}` };
  },
};
