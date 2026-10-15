// Named men who get better: the comrades who come back from missions learn, earn a standing, and carry the odds.
export default {
  async squadGrows(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 371, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const pc = A.pc(), enemy = A.neighbors('POL-01')[0];
      const w = A.startWar('POL-01', enemy, null, 'conquest'); A.enlist(pc);
      const served = new Set(); let ran = 0, gain = 0, logged = false, deaths = 0;
      for (let i = 0; i < 12 && pc.alive; i++) {
        const m = A.newMission(pc, enemy, w); A.S.queue = [{ type: 'mission', m }];
        const before = new Map(A.squad(pc).map(p => [p.id, Object.values(p.skills).reduce((a, x) => a + x, 0)]));
        A.missionAuto(m); if (A.S.queue[0] && A.S.queue[0].type === 'mission') A.missionClose(); ran++;
        for (const id of m.sqMen || []) { served.add(id); const p = A.P(id); if (p && p.alive && before.has(id)) gain += Object.values(p.skills).reduce((a, x) => a + x, 0) - before.get(id); else if (p && !p.alive) deaths++; }
        pc.health = A.maxHealth ? A.maxHealth(pc) : 100;
      }
      for (const e of A.S.log) for (const l of e.lines || []) if (/missions with you now/.test(l[0])) logged = true;
      const men = [...served].map(A.P).filter(Boolean);
      return { ran, served: men.length, deaths, maxN: Math.max(0, ...men.map(p => (p.sq || {}).n || 0)), gain: Math.round(gain), standings: men.map(p => A.SQUAD.standing(p)).filter(Boolean), logged };
    });
    const ok = r.ran >= 8 && r.maxN >= 3 && r.gain > 0 && r.standings.length >= 1 && r.logged;
    return { ok, detail: `${r.ran} missions; ${r.served} men went out, ${r.deaths} died on them; survivors learned ${r.gain} skill points; most missions by one man ${r.maxN}; standings earned: ${r.standings.join(', ') || 'none'}; announced ${r.logged}` };
  },

  async squadCarriesOdds(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 372, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 20 });
      const pc = A.pc(), enemy = A.neighbors('POL-01')[0];
      const w = A.startWar('POL-01', enemy, null, 'conquest'); A.enlist(pc);
      const m = A.newMission(pc, enemy, w); A.S.queue = [{ type: 'mission', m }]; A.missionView(m);
      const ch = m.cur.choices[0], green = A.missionOdds(pc, m, ch);
      for (const p of A.squad(pc)) p.sq = { n: 10 };
      const old = A.missionOdds(pc, m, ch);
      UI.ov = { type: 'person', id: A.squad(pc)[0].id }; UI.renderModal(); const html = (document.querySelector('#modal') || {}).textContent || '';
      UI.ov = null;
      return { green, old, shown: /Missions with you: 10 · an old hand/.test(html) };
    });
    return { ok: r.old - r.green >= 5 && r.shown, detail: `the same choice: ${r.green}% with green men, ${r.old}% with old hands; shown in the person view ${r.shown}` };
  },
};
