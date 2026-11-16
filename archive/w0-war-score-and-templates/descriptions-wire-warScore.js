// From src/ui/59-descriptions/descriptions.wire2.core.js: W.wrWars wiring the war score (retired by W0, D-052) and,
// in W.warTab, the wiring of the War score bars:
  W.wrWars = function (h) {
    const myR = UI.wrMyR(A.pc());
    for (const w of A.atWar(myR)) {
      const at = h.indexOf(`<b>${UI.esc(w.name)}</b>`); if (at < 0) continue;
      h = h.slice(0, at) + h.slice(at).replace(/War score <b class="([^"]*)">([^<]*)<\/b> · ([^<]*)<\/div>/, (m, c, sc, rest) => `${UI.tt('warScore', w.id, 'War score')} <b class="${c}"${A_('warScore', w.id)}>${sc}</b> · <span${A_('warScore', w.id)}>${rest}</span></div>`)
        .replace(/(<div class="tiny">)(<span class="(?:good|bad)-t">(?:Won|Lost)<\/span> · [^<]*)(<\/div>)/g, (m, x, t, y) => `<div class="tiny"${A_('warScore', w.id)}>${t}${y}`);
    }
    const w0 = A.atWar(myR)[0];
    if (w0) h = TT.within(h, '<div class="group-h">Dispatches</div>', null, seg => seg.replace(/<div class="tiny">/g, `<div class="tiny"${A_('warScore', w0.id)}>`));
    return h;
  };

    // the wars of your realm: each war score bar, in the order they are drawn
    const mine = A.S.wars.filter(w => w.att.includes(myR) || w.def.includes(myR));
    let k = 0;
    h = TT.within(h, '<div class="group-h">Wars of your realm</div>', null, seg => TT.wireBars(seg, lbl => lbl === 'War score' ? (mine[k] ? ['warScore', mine[k++].id] : null) : null));
