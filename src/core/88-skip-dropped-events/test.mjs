// An event that bows out is never drawn: not after an action that spends days, not if one is put on the queue by
// hand; an ordinary event still is; and the random stream runs as before.
export default {
  async qhSkipNotDrawn(pg) {
    const out = await pg.evaluate(() => {
      T.enter({ seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      const txt = () => { const m = document.getElementById('modal'); return m ? (m.innerText || '').replace(/\s+/g, ' ') : ''; };
      const res = {};
      // put by hand: nb_slander_spread with nobody holding a slander, so its setup gives up
      A.S.queue = [{ type: 'event', ev: 'nb_slander_spread', ctx: {} }]; UI.ov = null; UI.render(); if (UI.renderModal) UI.renderModal();
      res.byHand = { raw: /\{[a-z]+\}/.test(txt()), modal: !!document.getElementById('modal') };
      // after an action that spends a day, the skipped head is gone from the queue
      A.advance(1); UI.render();
      res.afterAdvance = { left: A.S.queue.filter(q => q.ev === 'nb_slander_spread').length, raw: /\{[a-z]+\}/.test(txt()) };
      // an ordinary event is still drawn
      const ok = Object.keys(A.EV).filter(id => !A.EV[id].trigger && (A.EV[id].choices || []).length >= 2).find(id => { const v = A.eventView({ type: 'event', ev: id, ctx: {} }); return v && !v.skip; });
      A.S.queue = [{ type: 'event', ev: ok, ctx: {}, forced: true }]; UI.render(); if (UI.renderModal) UI.renderModal();
      res.ordinary = { ev: ok, drawn: !!document.querySelector('#modal [data-a="evChoose"]') };
      return res;
    });
    const ok = !out.byHand.raw && !out.afterAdvance.left && !out.afterAdvance.raw && out.ordinary.drawn;
    return { ok, detail: `a skipping event put on the queue by hand: raw tokens on screen ${out.byHand.raw}; after a day passes it is still queued ${out.afterAdvance.left}x; an ordinary event (${out.ordinary.ev}) is drawn ${out.ordinary.drawn}` };
  },
};
