// X3 (T4), a fatal illness is an arc that health shows.
//
// A sickness is already an arc in the engine (49-body-mind: A.bmFallIll gives pc.ill, a card for the treatment, a toll each month
// and one crisis), but the health bar kept its word for the number alone: a man of 41 with marsh fever at health 92 read "hale"
// up to the month the fever took him. While a sickness is on the player, the word of a body the number calls hale or well is the
// sickness's: "ill with marsh fever" (a body the number already calls worn, ailing or worse keeps its own word). Pure: the page
// only, nothing drawn from the dice.
(function () {
  const bar0 = UI.barRow;
  UI.barRow = function (label, v, max, cls, pot, valTxt) {
    const h = bar0.apply(this, arguments);
    try {
      const pc = A.pc();
      if (pc && pc.alive && pc.ill && pc.ill.m > 0 && typeof v === 'number' && Math.abs(v - (+pc.health || 0)) < 0.51 &&
          (/data-tt="health"/.test(label) || /^Health$/.test(label)) && /<span class="val"[^>]*>(hale|well)<\/span>/.test(h))
        return h.replace(/(<span class="val"[^>]*>)(hale|well)(<\/span>)/, (m, a, w, b) => `${a}ill with ${UI.esc(String(pc.ill.name || 'a sickness'))}${b}`);
    } catch (e) {}
    return h;
  };
})();
