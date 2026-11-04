// The v2 relation in the realm and person views: one status (A.V2DIP.status, the same one the AI acts on) and the
// reasons behind it as "Drawing together" and "Pulling apart", in words. No percentages, nothing behind a click.
// Rendering only reads: no A.rand, no writes to A.S.
(function () {
  const DV = A.V2DIP, V = A.V2;
  if (!DV) return;
  const esc = s => UI.esc(s == null ? '' : String(s));
  const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : s);
  const short = id => (A.realmShort ? A.realmShort(id) : (A.realm(id) || {}).short || id);

  // the status, then the two lists; `who` names the other side ("you", or the realm)
  UI.v2RelBlock = function (a, b, title) {
    const x = DV.relation(a, b);
    if (!x) return '';
    const li = L => L.map(r => `<li${r.strong ? ' class="strong"' : ''}>${esc(cap(r.text))}</li>`).join('');
    return `<div class="v2-rel" style="margin:6px 0"><div class="small">${title ? `${esc(title)}: ` : ''}<b class="v2-status">${esc(x.status)}</b></div>` +
      `<div class="v2-why small" style="display:flex;flex-wrap:wrap;gap:4px 16px">` +
      `<div class="v2-toward" style="flex:1 1 160px"><div class="tiny muted">Drawing together</div>${x.toward.length ? `<ul style="margin:2px 0 0 16px;padding:0">${li(x.toward)}</ul>` : '<div class="tiny muted">Nothing much.</div>'}</div>` +
      `<div class="v2-apart" style="flex:1 1 160px"><div class="tiny muted">Pulling apart</div>${x.apart.length ? `<ul style="margin:2px 0 0 16px;padding:0">${li(x.apart)}</ul>` : '<div class="tiny muted">Nothing much.</div>'}</div>` +
      `</div></div>`;
  };

  // a chance the old views gave as "NN%", in v2's odds words
  DV.chanceWords = function (pct) {
    const p = Math.min(0.995, Math.max(0.005, (+pct || 0) / 100)), e = Math.log(p / (1 - p));
    const W = (V.odds && V.odds.ODDS_WORDS) || [];
    for (const [t, w] of W) if (e >= t) return w;
    return p >= 0.5 ? 'likely' : 'unlikely';
  };
  const scale = e => (e >= 0.8 ? '⚖︎↗' : e <= -0.8 ? '⚖︎↘' : '⚖︎');

  // the diplomacy card (Realm > Diplomacy): the status and reasons replace the hidden "Why they feel this way",
  // and the treaty odds are words
  if (typeof UI.diplCard === 'function') {
    const dc = UI.diplCard;
    UI.diplCard = function (r, o) {
      let h = dc.apply(this, arguments);
      try {
        if (!r || !o) return h;
        const blk = UI.v2RelBlock(o.id, r.id, `${o.short || o.name} and you`);
        const s = h.indexOf('<details class="dipl-why">'), e = s >= 0 ? h.indexOf('</details>', s) : -1;
        h = s >= 0 && e > s ? h.slice(0, s) + blk + h.slice(e + 10) : h.replace(/<\/div>\s*$/, blk + '</div>');
        h = h.replace(/<span class="pct ([a-z]+)">(\d+)%<\/span>/g, (m, c, n) => {
          const p = Math.min(0.995, Math.max(0.005, n / 100)), ed = Math.log(p / (1 - p));
          return `<span class="pct ${c}" title="">${esc(scale(ed))} ${esc(DV.chanceWords(n))}</span>`;
        });
        // any other share ("+10% income for both") is said as more or less
        h = h.replace(/>([^<]*)</g, (m, t) => '>' + t.replace(/([+−-])?\d+(\.\d+)?%\s*/g, (q, sg) => (sg && sg !== '+' ? 'less ' : 'more ')) + '<'); // text only, never a style
      } catch (x) { console.error('v2 diplomacy card', x); }
      return h;
    };
  }

  // each realm in the diplomacy list carries its status word
  if (typeof UI.relStatus === 'function') {
    const rs = UI.relStatus;
    UI.relStatus = function (r, o) {
      const h = rs.apply(this, arguments);
      try { const s = r && o ? DV.status(o.id, r.id) : null; return s ? `<span class="tiny v2-status">${esc(s)}</span> ${h}` : h; } catch (x) { return h; }
    };
  }

  // the realm card (the map's realm view): this realm and the player's
  if (typeof UI.realmCard === 'function') {
    const rc = UI.realmCard;
    UI.realmCard = function (rid) {
      const h = rc.apply(this, arguments);
      try {
        const pc = A.pc(), mine = pc && pc.realm, r = A.realm(rid);
        if (!r || !mine || mine === rid || !A.realm(mine) || !A.realm(mine).alive) return h;
        return h.replace(/<\/div>\s*$/, UI.v2RelBlock(rid, mine, `${r.short || r.name} and ${short(mine)}`) + '</div>');
      } catch (x) { return h; }
    };
  }

  // the person view: someone of another realm shows how their realm and yours stand
  if (typeof UI.personModal === 'function') {
    const pm = UI.personModal;
    UI.personModal = function (t) {
      const h = pm.apply(this, arguments);
      try {
        const pc = A.pc(), p = t && typeof t === 'object' ? t : A.P(t);
        if (!pc || !p || p.id === pc.id || p.realm == null || pc.realm == null || p.realm === pc.realm) return h;
        const ra = A.realm(p.realm), rb = A.realm(pc.realm);
        if (!ra || !rb || !ra.alive || !rb.alive) return h;
        const blk = `<div class="group-h">Their realm and yours</div>` + UI.v2RelBlock(ra.id, rb.id, `${ra.short || ra.name} and ${rb.short || rb.name}`);
        const end = h.lastIndexOf('</div>');
        return end > 0 ? h.slice(0, end) + blk + h.slice(end) : h + blk;
      } catch (x) { return h; }
    };
  }
})();
