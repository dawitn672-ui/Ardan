// The release's core, lore tables: The lazy lore tables (cast, families, house lore, styles, academies), read from the ardan-lore payload on first use.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-028). Edit it here.
// Defines: .

(function (L) {
  let raw = null;
  const text = () => {
    if (!raw) {
      raw = {};
      for (const part of window.ARDAN_LORE().split("")) {
        const i = part.indexOf("");
        raw[part.slice(0, i)] = part.slice(i + 1);
      }
    }
    return raw;
  };
  for (const k of ["cast", "families", "houseDeep", "styles", "academies"]) {
    let v;
    Object.defineProperty(L, k, {
      configurable: true,
      enumerable: true,
      get() {
        if (v === void 0) v = JSON.parse(text()[k]);
        return v;
      },
      set(x) {
        v = x;
      },
    });
  }
})(LORE);
