// D11-2: the company on the War tab (docs/design/war.md §14.2). Its make-up, its best drills in words, what it is like
// and why, this season's syllabus (a captain picks one or two; anyone else sees what his captain chose and why), its
// duty in peace. Pure: worked out when the page opens. Every description opens on a tap (data-note, 44 points); grades
// are words, never numbers.
(function () {
  const U = A.UNITS;
  const esc = s => (UI.esc ? UI.esc(String(s == null ? '' : s)) : String(s));
  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  UI.unitCard = function (pc) {
    if (!pc || !pc.alive || !pc.mil || pc.mil.merc) return '';
    const M = U.mine(pc);
    if (!M) return '';
    const mk = U.makeup(M.d, M.b), ab = U.abilities(M.d, M.b), td = U.tend(M.d, M.b), S = U.syllabus(M.d, M.b, { pc });
    const name = A.CO.coName ? A.CO.coName(M.d, M.b, M.i) : '';
    let h = `<div class="card un-card"><div class="row">${UI.icon ? UI.icon('users', 's') : ''}<span class="tag">Your company</span><b class="grow">${esc(name)}</b></div>`;
    const sg = mk.sergeants.length ? ` Its sergeants: ${mk.sergeants.join(' and ')}.` : '';
    h += `<div class="row small"><span class="grow">${esc(cap(U.vetWord(mk.vet)))}${mk.conscripts ? ', conscripts among them' : ''}; a ${esc(mk.temper)} captain</span><button class="small un-why" data-note="${esc(`${A.fmt(mk.men)} men in ${mk.comps} ${mk.comps === 1 ? 'company' : 'companies'}.${sg}`)}">make-up</button></div>`;
    const best = ab.slice(0, 3).map(([id, g]) => `${U.D(id).name.replace(/^The /, 'the ')}: ${U.GRADE_W(g)}`);
    if (best.length) h += `<div class="row small"><span class="grow">Best at ${esc(best.join('; '))}</span><button class="small un-why" data-note="${esc(ab.map(([id, g]) => `${U.D(id).name}: ${U.GRADE_W(g)}`).join('. ') + '.')}">all its drills</button></div>`;
    if (td.length) h += `<div class="row small"><span class="grow">${esc(cap(td[0].label))}${td.length > 1 ? '; and more' : ''}</span><button class="small un-why" data-note="${esc(td.map(t => cap(t.label) + (t.from === 'ledger' ? ` (${t.y})` : t.from === 'captain' ? ' (its captain)' : ' (its men)')).join('. ') + '.')}">what it is like</button></div>`;
    if (S && S.offers.length) {
      const own = (pc.mil.rank | 0) >= 3, chosen = pc.mil.syl || [];
      const last = M.rec.sy && U.D(M.rec.sy[0]);
      h += `<div class="small muted">${own ? 'This season\'s syllabus: pick one or two drills.' : `This season's syllabus${last ? `; last drilled: ${esc(last.name.replace(/^The /, 'the '))}` : ''}.`}</div><div class="un-syl">`;
      for (const o of S.offers) {
        const on = chosen.includes(o.id);
        const note = `${U.D(o.id).desc} Why: ${o.why.join('; ') || 'it is on its list'}. Taught by ${o.teacher}. Now ${U.GRADE_W(o.grade)}.`;
        h += `<div class="row small"><span class="grow">${on ? '<b>' : ''}${esc(o.name)}${on ? '</b>' : ''} <span class="muted">${esc(o.why[0] || '')}</span></span><button class="small un-why" data-note="${esc(note)}">why</button>${own ? `<button class="small un-pick${on ? ' primary' : ''}" data-a="unSyl" data-v="${esc(o.id)}" aria-pressed="${on}">${on ? 'chosen' : 'choose'}</button>` : ''}</div>`;
      }
      h += '</div>';
      if (S.cut.length) h += `<div class="row small"><span class="grow muted">Not this season: ${esc(S.cut.slice(0, 2).map(c => U.D(c[0]).name.replace(/^The /, 'the ')).join(', '))}${S.cut.length > 2 ? ', and more' : ''}</span><button class="small un-why" data-note="${esc(S.cut.map(c => `${U.D(c[0]).name}: ${c[1]}`).join('. ') + '.')}">why not</button></div>`;
    }
    const D = pc.mil.duty && U.duties().find(x => x.id === pc.mil.duty.k);
    if (D) h += `<div class="row small"><span class="grow">Its work this season: ${esc(D.name)}</span><button class="small un-why" data-note="${esc(cap((pc.mil.duty.why || []).join('; ') || D.why) + '.')}">why</button></div>`;
    return h + '</div>';
  };
  // a captain picks one or two drills for the season (a third replaces the oldest)
  Object.assign(UI.A, {
    unSyl(v) {
      const pc = A.pc();
      if (!pc || !pc.mil || (pc.mil.rank | 0) < 3 || !U.D(v)) return;
      const L = pc.mil.syl = Array.isArray(pc.mil.syl) ? pc.mil.syl : [];
      const i = L.indexOf(v);
      if (i >= 0) L.splice(i, 1); else { L.push(v); if (L.length > 2) L.shift(); }
      UI.render();
    },
  });
  {
    try {
      const st = document.createElement('style');
      st.textContent = '.un-card .un-why,.un-card .un-pick{min-height:44px;min-width:44px;padding:0 10px}.un-card .row{align-items:center;gap:6px;flex-wrap:wrap}';
      document.head.appendChild(st);
    } catch (e) {}
  }
})();
