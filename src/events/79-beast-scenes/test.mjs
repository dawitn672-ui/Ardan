// Beast scenes take their beast from what lives near home, and step aside where nothing does.
const RUN = (seed, realm) => {
  T.enter({ seed, race: 'human', realm, status: 'peasant', sex: 'M', startAge: 25 });
  const pc = A.pc(), home = A.prov(pc.home), near = A.beastsNear(pc);
  // ask each scene's setup directly, many times, as the engine does when it fires the scene
  const lair = A.EV.explore_lair, out = { realm, home: home && home.name, near: near.length, lair: { skip: 0, off: 0, n: 0, textMatch: 0 }, spear: { skip: 0, off: 0, n: 0 } };
  for (let i = 0; i < 40; i++) {
    const ctx = {}; lair.setup(pc, ctx); out.lair.n++;
    if (ctx.skip) out.lair.skip++; else {
      if (!near.includes(ctx.beast)) out.lair.off++;
      const c = LORE.creatures.find(x => x.id === ctx.beast), t = lair.text(pc, ctx);
      if (c && t.includes(c.name)) out.lair.textMatch++;
    }
    const sp = A.EV.pf_spear_boar; if (sp) { const c2 = {}; sp.setup(pc, c2); out.spear.n++; if (c2.skip) out.spear.skip++; else if (!A.BH.suits(c2.beast, home)) out.spear.off++; }
  }
  return out;
};

export default {
  async bsSceneBeasts(pg) {
    await pg.evaluate(`window.BS_RUN = ${RUN.toString()}`);
    const r = await pg.evaluate(() => [BS_RUN(5101, 'POL-01'), BS_RUN(5102, 'POL-30'), BS_RUN(5103, 'POL-08')]);
    const bad = [];
    for (const x of r) {
      if (x.lair.off || x.spear.off) bad.push(`${x.realm}: a beast from outside its range`);
      if (!x.near && (x.lair.skip !== x.lair.n)) bad.push(`${x.realm}: lair offered with no beast near`);
      if (x.near && x.lair.textMatch !== x.lair.n - x.lair.skip) bad.push(`${x.realm}: lair text names another beast`);
    }
    return { ok: !bad.length, detail: r.map(x => `${x.realm} ${x.home} (${x.near} beasts near): lair ${x.lair.n - x.lair.skip} of ${x.lair.n} offered, text names its beast ${x.lair.textMatch}; spear hunt ${x.spear.n - x.spear.skip} of ${x.spear.n} offered, off-range ${x.spear.off}`).join('; ') + (bad.length ? ' — ' + bad.join('; ') : '') };
  },
};
