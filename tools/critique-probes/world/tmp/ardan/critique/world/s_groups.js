return UI.GROUPS.map(g => ({ id: g.id || g.k || g.name, label: g.label || g.name, subs: g.subs.map(s => s.slice(0, 2)) }));
