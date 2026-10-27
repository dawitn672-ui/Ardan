// 998-people-want: the People tab shows what each person wants; the tier stays for soldiers and foes; drawing is pure.
export default {
  async peopleShowWants(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 33, race: 'human', realm: 'POL-01', status: 'artisan', startAge: 22 });
      T.play(2);
      const pc = A.pc(), PW = UI.PEOPLE_WANT;
      // someone known, someone not, a cast member, a rival
      const ppl = Object.values(A.S.people).filter(p => p.alive && p.id !== pc.id && A.isAdult(p) && !p.mil);
      const cast = Object.values(A.S.people).find(p => p.alive && p.castId && LORE.cast[p.castId] && LORE.cast[p.castId].wants);
      if (cast && !pc.rel[cast.id]) A.link(pc, cast, 'acquaint', 10, 'acquaint');
      const stranger = ppl.find(p => !pc.rel[p.id] && p !== cast);
      const rival = ppl.find(p => p !== stranger && p !== cast && !pc.rel[p.id]);
      A.link(pc, rival, 'rival', -40, 'rival');
      const h0 = T.hash(A.S), r0 = A.rngState;
      UI.tab = 'people'; UI.render();
      const body = document.getElementById('tabbody');
      const chips = [...body.querySelectorAll('.pw-want')].map(e => e.className.replace(/.*pw-(\w+)$/, '$1'));
      const out = {
        pure: T.hash(A.S) === h0 && A.rngState === r0,
        stranger: PW.of(pc, stranger), cast: cast ? PW.of(pc, cast) : null, rivalTier: PW.keepTier(pc, rival),
        kinds: [...new Set(chips)], n: chips.length,
        untrainedLeft: [...body.querySelectorAll('.roster .chip.tier')].filter(c => { const row = c.closest('.ro-row'), id = row && (row.querySelector('[data-v^="person:"]') || {}).dataset; const p = id && A.P(id.v.slice(7)); return p && !PW.keepTier(pc, p); }).length,
        raw: /\{[a-z]/.test(body.innerHTML),
      };
      // a want is escaped
      const t = ppl.find(p => pc.rel[p.id] && !p.castId);
      if (t) { const g = PW.natureOf; PW.natureOf = () => '<img data-pwn=1>'; t.traits = []; const html = PW.chip(pc, t); PW.natureOf = g; out.esc = !/<img/.test(html) || PW.of(pc, t).src !== 'nature'; }
      return out;
    });
    const ok = r.pure && r.stranger && r.stranger.src === 'unknown' && (!r.cast || r.cast.src === 'cast') && r.rivalTier && r.n > 0 && !r.untrainedLeft && !r.raw && r.esc !== false;
    return { ok, detail: `${r.n} wants drawn (${r.kinds.join(', ')}); a stranger: "${r.stranger && r.stranger.text}"; a cast member: "${r.cast && r.cast.full}"; a rival keeps the tier ${r.rivalTier}; tier chips left on non-fighters ${r.untrainedLeft}; render pure ${r.pure}; escaped ${r.esc}` };
  },
};
