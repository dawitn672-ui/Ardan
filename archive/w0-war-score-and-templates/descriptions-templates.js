// From src/ui/59-descriptions (retired by W0, D-052: the player no longer designs division templates or picks a
// doctrine, so their click-open notes and wiring went with the Templates tab).

// src/ui/59-descriptions/descriptions.more-war.core.js
  G.doctrine = function (k) {
    const Dc = GD.RDOC[k], r = A.realm(myR()); if (!Dc) return '';
    const W = { planMax: 'most planning', dig: 'digging in', horseAtk: 'horse attack', brk: 'breakthrough', bowSoft: 'archers\' killing power', soft: 'killing power', mp: 'manpower pool', levyOrg: 'levies\' organization', org: 'organization', orgReg: 'rallying', def: 'defense' };
    return H(esc(Dc.name), null, r && r.forces && r.forces.doc === k ? 'adopted' : `${Dc.cost} army experience`) + D(esc(Dc.desc || '')) +
      Object.entries(Dc.fx || {}).map(([x, v]) => R(esc(W[x] || x), x === 'dig' ? '+' + v : '+' + pct(v), 'tt-sub')).join('') + F('One doctrine at a time; changing it costs army experience.');
  };



// src/ui/59-descriptions/descriptions.wire2.core.js
  W.wrTemplates = function (h) {
    const r = A.realm(UI.wrMyR(A.pc())); if (!r || !r.forces) return h;
    h = h.replace(/<span class="right chip gold" title="([^"]*)">/, (m, t) => `<span class="right chip gold" title="${t}"${UI.ttAttrs('host', r.id)}>`)
      .replace(/<button class="small ?(?:on)?" data-a="wrDoc" data-v="(\w+)"/g, (m, k) => m + A_('doctrine', k));
    const tpls = Object.values(r.forces.tpl), parts = h.split('<div class="card wr-tpl">');
    for (let i = 1; i < parts.length && i - 1 < tpls.length; i++) {
      const t = tpls[i - 1], arg = k => r.id + '|' + t.id + '|' + k;
      parts[i] = parts[i].replace(/<span class="tiny muted">(\d+ divisions?)<\/span>/, (m, x) => `<span class="tiny muted"${A_('host', r.id)}>${x}</span>`)
        .replace(/<div title="(\w+)"><span>/g, (m, k) => `<div title="${k}"${UI.ttAttrs('tplStat', arg(k))}><span>`)
        .replace(/<div class="tiny muted">(Equipment: [^<]*)<\/div>/, (m, x) => `<div class="tiny muted"${A_('tplStat', arg('w'))}>${x}</div>`);
    }
    return parts.join('<div class="card wr-tpl">');
  };

