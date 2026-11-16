// Retired with the chapters (P3, order 54, D-062): these tests lived in src/core/99992-v2-time/test.mjs and use its DRIVE helpers.
export default {
  // playtest 2 old 16: the chapter stays only as an optional Life panel. On a phone it starts folded to its title line
  // (its third aim waits inside), on a desktop it stands open and can be folded; a chapter closed with every aim met is
  // no longer a deed, so no one tells it back as a tale ("you closed Chapter One: The Cold Hearth")
  async v2tChapterPanel(pg) {
    const out = {};
    for (const w of [420, 1366]) {
      await pg.setViewportSize({ width: w, height: w < 500 ? 900 : 768 });
      out[w] = await pg.evaluate(() => {
        try { localStorage.removeItem('ardan_fold_v1'); } catch (e) {} if (UI.FOLD) { UI.FOLD.state = {}; UI.FOLD.allOpen = false; }
        T.enter({ seed: 9208, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 13 });
        const pc = A.pc(); T.play(3);
        UI.tab = 'life'; UI.render();
        const c = document.querySelector('#tabbody .chp-card');
        const o = { card: !!c, folded: !!(c && c.classList.contains('folded')), foldable: !!(c && c.querySelector(':scope > .fold-x')), head: c ? c.firstElementChild && (c.querySelector('.chp-t') || {}).textContent : null };
        // folded only for want of room (91-visual-style's LOOK.fitLife, round 2): one click opens it, and it stays open
        o.fit = !!(c && c.dataset.lkFit);
        if (o.folded && o.fit && innerWidth > 760) {
          c.querySelector(':scope > .fold-x').click(); UI.render();
          const c2 = document.querySelector('#tabbody .chp-card');
          o.reopened = !!(c2 && !c2.classList.contains('folded'));
        }
        return o;
      });
    }
    const deed = await pg.evaluate(() => {
      const pc = A.pc(), CH = A.CH, c = pc.chap && pc.chap.cur;
      if (!c) return null;
      for (const a of c.aims) a.d = A.S.year;
      const n0 = (pc.deeds || []).length; CH.close(pc);
      return { full: pc.chap.past[pc.chap.past.length - 1].full, added: (pc.deeds || []).length - n0 };
    });
    // Changed in round 2 (wf-round2): at 1366 x 768 the Life panel cannot hold every card above Activities (91-visual-style's
    // fitsOneScreen: 723 px of a 615 px panel with Coming up, What now, the chapter, the ambition and the arcs open), so
    // 91-visual-style folds the cards the player has not touched, the ambition first and then the chapter, until it fits. The
    // chapter on a desktop is open, or folded for want of room only, and then one click opens it for good (the owner's
    // complaint 7 wants no scripted chapters: this panel is the optional part that may give way)
    const desk = out[1366], deskOk = desk.card && desk.foldable && (!desk.folded || (desk.fit && desk.reopened));
    const ok = out[420].card && out[420].folded && out[420].foldable && deskOk && deed && deed.full && deed.added === 0;
    return { ok, detail: `420 px: chapter ${out[420].card ? (out[420].folded ? 'folded' : 'OPEN') : 'missing'}; 1366 px: ${desk.card ? (desk.folded ? (desk.fit ? `folded for want of room, a click opens it for good ${desk.reopened}` : 'FOLDED') : 'open') : 'missing'}, foldable ${desk.foldable}; a full chapter closed adds ${deed ? deed.added : '?'} deeds` };
  },

  // no chapter card: a chapter opens on the Life tab, its third aim chosen there; faith aims only for the devout
  async v2tChapters(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 9208, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 13 });
      const pc = A.pc(); pc.piety = 30;
      T.play(3);
      const card = A.S.evShown && A.S.evShown.chp_card != null ? 1 : 0;
      const c = pc.chap && pc.chap.cur;
      UI.tab = 'life'; UI.render();
      const pick = document.querySelectorAll('[data-a="chpPick"]').length;
      const third = c && c.alt ? c.alt.l : null;
      if (pick) document.querySelector('[data-a="chpPick"][data-v="1"]').click();
      const after = pc.chap.cur.aims.map(a => a.l), still = document.querySelectorAll('[data-a="chpPick"]').length;
      const D = A.CH.aim('pious'), plain = D.fit(pc);
      pc.job = { c: 'clergy', r: 0 }; const clergy = D.fit(pc); pc.job = null;
      const amb = A.LF && A.LF.AMB && A.LF.AMB.faith ? A.LF.AMB.faith.fit(Object.assign({}, pc, { piety: 45 })) : 0;
      return { open: !!c, card, pick, took: third == null || after.includes(third), still, plain, clergy, amb, logged: A.S.log.some(e => e.lines.some(l => /^Chapter .* begins/.test(l[0]) || / Chapter .* begins/.test(l[0]))) };
    });
    const ok = r.open && r.card === 0 && r.took && r.still === 0 && r.plain === 0 && r.clergy > 0 && r.amb === 0 && r.logged && (r.pick === 2 || r.pick === 0);
    return { ok, detail: `chapter open ${r.open}, chapter cards ${r.card}, pick buttons ${r.pick} -> ${r.still}, story line ${r.logged}; shrine aim fit: plain ${r.plain}, clergy ${r.clergy}; faith ambition at piety 45: ${r.amb}` };
  },
};
