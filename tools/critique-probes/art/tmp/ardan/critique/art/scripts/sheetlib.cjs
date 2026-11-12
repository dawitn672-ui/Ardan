// in-page helpers for contact sheets
const SHEET_INIT = () => {
  window.SH = {
    cultName(c) { try { return (LORE.cultures[c] || {}).name || c; } catch (e) { return c; } },
    lab(p, extra) {
      const a = A.age(p);
      const st = p.ruler ? 'RULER' : (p.status || '?');
      const job = p.job && p.job.c ? '/' + p.job.c : '';
      const mil = p.mil ? '/mil' + (p.mil.rank ?? '') : '';
      return `${(p.given || '?')} · ${p.race[0].toUpperCase()}${p.race.slice(1, 3)} ${p.sex} ${a}<br>${st}${job}${mil}<br>${SH.cultName(p.cult)}${extra ? '<br>' + extra : ''}`;
    },
    render(list, size, cols, opts, theme, title) {
      document.getElementById('sheet')?.remove();
      const box = document.createElement('div'); box.id = 'sheet';
      const bg = theme === 'light' ? '#f2ede2' : '#0d1120', fg = theme === 'light' ? '#1d2033' : '#eee8da';
      box.style.cssText = `position:absolute;left:0;top:0;z-index:99999;background:${bg};padding:10px;font:10px/1.25 Arial,sans-serif;color:${fg};width:max-content`;
      let html = title ? `<div style="font:bold 14px Arial;margin:0 0 8px">${title}</div>` : '';
      html += `<div style="display:grid;grid-template-columns:repeat(${cols},${Math.max(size, 84)}px);gap:8px 6px">`;
      for (const it of list) {
        let s = '';
        try { UI.ANIME && UI.ANIME.clearCache && UI.ANIME.clearCache(); s = it.svg || PORTRAIT.svg(it.p, size, Object.assign({}, opts || {}, it.opts || {})); } catch (e) { s = '<div style="color:red">ERR ' + String(e).slice(0, 80) + '</div>'; }
        html += `<div style="text-align:center">${s}<div style="margin-top:2px">${it.label || ''}</div></div>`;
      }
      html += '</div>';
      box.innerHTML = html; document.body.appendChild(box);
      return list.length;
    },
    clone(p) { return JSON.parse(JSON.stringify(p)); },
  };
};
module.exports = { SHEET_INIT };
