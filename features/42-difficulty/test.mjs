// Difficulty changes information and recovery: the same life on each setting heals at a different pace, keeps a wound
// a different time, serves a different sentence, and is shown its odds differently.
export default {
  async difficultyRecovery(pg) {
    const r = await pg.evaluate(() => {
      const out = {};
      for (const diff of ['story', 'hard', 'realism']) {
        A.newGame({ seed: 301, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: 30, diff });
        const pc = A.pc();
        // a year's healing from 20 health
        pc.health = 20; A.bodyYear(pc); const healed = Math.round(pc.health - 20);
        // a wound, and how long it lasts
        pc.wounds = []; A.addWound(pc, 'lungs'); const w = pc.wounds[pc.wounds.length - 1];
        const lasts = w && w.until ? w.until - A.S.year : null;
        // a sentence of four years
        A.imprison(pc, 4, 'theft'); const term = pc.prison ? pc.prison.until - A.S.year : null;
        out[diff] = { healed, lasts, term };
      }
      return out;
    });
    const s = r.story, h = r.hard, x = r.realism;
    const ok = s.healed > h.healed && h.healed > x.healed && s.term < h.term && h.term < x.term && s.lasts < h.lasts && h.lasts < x.lasts;
    return { ok, detail: Object.entries(r).map(([k, v]) => `${k}: heals ${v.healed} in a year, damaged lungs last ${v.lasts == null ? 'no set time' : v.lasts + ' years'}, four years' sentence runs ${v.term}`).join('; ') };
  },

  async difficultyInformation(pg) {
    const r = await pg.evaluate(() => {
      const out = {};
      const ev = Object.values(A.EV).find(e => !e.trigger && (e.choices || []).some(c => c.check) && typeof e.text === 'string' && !/\{/.test(e.text + e.title) && !e.setup);
      for (const diff of ['story', 'hard', 'realism']) for (const odds of [false, true]) {
        A.newGame({ seed: 302, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: 30, diff });
        UI.set.odds = odds;
        A.S.queue = [{ type: 'event', ev: ev.id, forced: true, ctx: {} }];
        const h = String(UI.eventModal(A.S.queue[0]) || '');
        out[diff + (odds ? '+' : '-')] = /\d+% · /.test(h);
      }
      UI.set.odds = false;
      return { ev: ev.id, out };
    });
    const o = r.out;
    const ok = o['story-'] && o['story+'] && !o['realism-'] && !o['realism+'] && !o['hard-'] && o['hard+'];
    return { ok, detail: `numbers on the choices of ${r.ev} (player's odds setting off / on): story ${o['story-']}/${o['story+']}, hard ${o['hard-']}/${o['hard+']}, realism ${o['realism-']}/${o['realism+']}` };
  },
};
