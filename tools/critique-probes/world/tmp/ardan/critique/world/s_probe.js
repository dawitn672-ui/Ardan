const g = Object.keys(window).filter(k => /^[A-Z][A-Z0-9_]*$/.test(k));
return { globals: g, loreKeys: Object.keys(LORE), gdKeys: Object.keys(GD).slice(0, 200), aKeys: Object.keys(A).length };
