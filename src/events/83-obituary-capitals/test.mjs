// The obituary's first letters sit in their words; an event's text keeps its illuminated initial.
export default {
  async obCaps(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 8123, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 40 });
      const pc = A.pc(); pc.health = -5; A.pcDeath('old wounds'); UI.render();
      const b = document.querySelector('[data-a="showDeath"]'); if (b) b.click();
      const ob = [...document.querySelectorAll('.mbox.obit .mtext')].map(e => getComputedStyle(e, '::first-letter').cssFloat);
      // an event's text, for comparison
      UI.ov = null; T.enter({ seed: 8124, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 20 });
      for (let g = 0; g < 60 && !(A.S.queue[0] && A.S.queue[0].type === 'event'); g++) { A.advance(30); while (A.S.queue[0] && A.S.queue[0].type !== 'event') A.S.queue.shift(); }
      UI.render(); if (UI.renderModal) UI.renderModal();
      const ev = [...document.querySelectorAll('.mbox:not(.obit) .mtext')].map(e => getComputedStyle(e, '::first-letter').cssFloat);
      return { ob, ev };
    });
    const ok = r.ob.length >= 1 && r.ob.every(f => f === 'none') && r.ev.length >= 1 && r.ev[0] === 'left';
    return { ok, detail: `obituary lines ${r.ob.length}, first letter float: ${r.ob.join(', ')}; an event's text: ${r.ev.slice(0, 1).join('') || 'none found'}` };
  },
};
