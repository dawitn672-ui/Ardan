// A person's level, part 2: what the player reads and does (docs/design/skills-v2.md §12.2's profile and allocation sheet).
// Pure on render: reads A.LV and the person, draws nothing, writes nothing but on a press. Every number sits in a
// description that opens on click (UI.note); no percentages; the controls are 44 points; it fits 375 x 667.
//   The profile's sheet (999996-profile-tab's PF.sheetTop): "Level 24" (its rank on the ladder in the note), ten marks
//   toward the next, and, when points wait and the player is 12 or older, a button "three points to place".
//   The allocation sheet (UI.ov = { type: 'lvSheet', pend }): six rows, each the stat's name (its note says what it does),
//   a bar with the ceiling at its end and the room of this age shaded, its word, the next point's cost in marks, and
//   - and + (pending only: placed points never move); "Keep" places them.
(function () {
  const LV = A.LV;
  if (!LV || typeof UI === 'undefined') return;
  const esc = s => UI.esc(String(s == null ? '' : s));
  const note = (text, label) => (UI.note ? UI.note(text, label) : `<span data-note="${esc(text)}">${label}</span>`);
  const WORDS = ['no', 'a', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  LV.countWords = n => (n === 1 ? 'a point' : (n <= 20 ? WORDS[n] : 'many') + ' points');
  const LABEL = s => (UI.PF && UI.PF.V2LABEL && UI.PF.V2LABEL[s]) || (GD.STAT_NAMES && GD.STAT_NAMES[s]) || s;
  const DOES = {
    str: 'Strength: the weight behind a blow, a load carried, a grip that holds.',
    spd: 'Speed: how quick the body is, to strike first or get out of the way.',
    sta: 'Endurance: how long you last in a fight, a march or a day in the fields.',
    ins: 'Reflexes: the eye for a blow coming and the body that answers before you think.',
    int: 'Wits: learning, reckoning and seeing through a lie.',
    wil: 'Will: nerve, faith and holding to a purpose when it hurts.',
  };
  const pips = (n, on, cls) => { let s = `<span class="lv-pips ${cls || ''}" aria-hidden="true">`; for (let i = 0; i < n; i++) s += `<i${i < on ? ' class="on"' : ''}></i>`; return s + '</span>'; };
  LV.canChoose = p => !!(p && A.S && p.id === A.S.pc && p.alive && p.lv && A.age(p) >= LV.D.points.playerFrom);

  // ---------------------------------------------------------------- the profile's line
  LV.profileLine = function (p) {
    if (!p || !p.st || A.age(p) < 1) return '';
    const L = LV.level(p), band = A.POWER.band(L), f = LV.progress(p);
    const text = `Level ${L} on the scale of all beings: rank ${band.r}, ${band.w}. ${band.d} A level comes from defeating people and beasts, more for a stronger foe; each one brings points for the body and mind. Toward the next: ${LV.progressWord(f)}.`;
    let h = `<div class="lv-line">${note(text, `<b>Level ${esc(L)}</b>`)}${pips(10, Math.floor(f * 10), 'lv-next')}`;
    const pts = (p.lv && p.lv.pts) || 0;
    if (pts > 0 && LV.canChoose(p)) h += `<button type="button" class="lv-place" data-a="lvSheet">${esc(LV.countWords(pts))} to place</button>`;
    return h + '</div>';
  };

  // ---------------------------------------------------------------- the allocation sheet
  // what the pending points would cost, in order, and the points left after them
  LV.pendCost = function (p, pend) {
    let left = (p.lv && p.lv.pts) || 0;
    const ok = {};
    for (const s of GD.STATS) {
      ok[s] = 0;
      for (let i = 0; i < ((pend && pend[s]) || 0); i++) { if (!LV.canPlace(p, s, i, left)) break; left -= LV.cost(p, s, i); ok[s]++; }
    }
    return { left, ok };
  };
  LV.sheet = function (ov) {
    const p = A.pc(), close = `<button class="close" data-a="closeOv" aria-label="Close">${UI.icon ? UI.icon('x', 'm') : 'x'}</button>`;
    if (!LV.canChoose(p)) return `<div class="panel mbox lv-sheet">${close}<h2>Points to place</h2><div class="mtext">You have none to place now.</div><div class="choices"><button data-a="closeOv">Close</button></div></div>`;
    const pend = ov.pend || {}, { left } = LV.pendCost(p, pend), VS = A.V2S;
    // a greyed + says why in its row's cost (a press on the marks or "full"), and a greyed - has nothing pending: both carry
    // data-why so 97-first-life-fixes adds no second info button beside them
    const rows = GD.STATS.map(s => {
      const cap = LV.cap(p, s), room = LV.room(p, s), now = LV.eff(p, s), x = pend[s] || 0;
      const w = v => Math.max(0, Math.min(100, Math.round(100 * v / Math.max(1, cap))));
      const word = VS && VS.statWord ? VS.statWord(p, s, Math.round(now + x)) : '';
      const can = LV.canPlace(p, s, x, left), c = LV.cost(p, s, x);
      const costNote = can ? `The next point here costs ${c === 1 ? 'one point' : c === 2 ? 'two points' : 'three points'}: dearer near the ceiling.` : (now + x + 1 > room ? 'No more room here: the body at your age holds no more.' : 'Not enough points left for the next one here.');
      return `<div class="lv-row" data-s="${esc(s)}">` +
        `<span class="lv-name">${note(DOES[s] || LABEL(s), esc(LABEL(s)))}</span>` +
        `<span class="lv-bar" aria-hidden="true"><i class="lv-room" style="width:${w(room)}%"></i><i class="lv-now" style="width:${w(now)}%"></i><i class="lv-add" style="left:${w(now)}%;width:${Math.max(0, w(now + x) - w(now))}%"></i></span>` +
        `<span class="lv-word">${esc(word)}${x ? ' <b>+' + note(`${x === 1 ? 'A point' : 'Points'} you would place here.`, esc(x)) + '</b>' : ''}</span>` +
        `<span class="lv-cost${can ? '' : ' lv-off'}">${note(costNote, now + x + 1 > room ? 'full' : pips(3, c, 'lv-c'))}</span>` +
        `<span class="lv-ctl"><button type="button" class="lv-btn" data-a="lvMinus" data-v="${esc(s)}" aria-label="Less ${esc(LABEL(s))}"${x ? '' : ' disabled data-why=""'}>−</button>` +
        `<button type="button" class="lv-btn" data-a="lvPlus" data-v="${esc(s)}" aria-label="More ${esc(LABEL(s))}"${can ? '' : ' disabled data-why=""'}>+</button></span></div>`;
    }).join('');
    const any = Object.values(pend).some(Boolean);
    return `<div class="panel mbox lv-sheet">${close}<h2>Points to place</h2>` +
      `<div class="small muted">${note('Each level brings points. A stat cannot pass its ceiling (the end of the bar), nor what your body holds at this age (the shaded part). Points placed never move. Old age, wounds and illness lower what a stat reads, never what is placed.', esc(left > 0 ? `${LV.countWords(left)} left` : 'none left'))}</div>` +
      `<div class="lv-rows">${rows}</div>` +
      `<div class="choices"><button class="primary" data-a="lvKeep"${any ? '' : ' disabled'}>Keep</button><button data-a="closeOv">Not now</button></div></div>`;
  };
  const ovModal = UI.ovModal;
  UI.ovModal = function (ov) { return ov && ov.type === 'lvSheet' ? LV.sheet(ov) : ovModal.apply(this, arguments); };

  Object.assign(UI.A, {
    lvSheet() { UI.ov = { type: 'lvSheet', pend: {} }; UI.renderModal(); },
    lvPlus(s) {
      const ov = UI.ov, p = A.pc(); if (!ov || ov.type !== 'lvSheet' || !p || !GD.STATS.includes(s)) return;
      const pend = ov.pend = ov.pend || {}, { left } = LV.pendCost(p, pend);
      if (LV.canPlace(p, s, pend[s] || 0, left)) pend[s] = (pend[s] || 0) + 1;
      UI.renderModal();
    },
    lvMinus(s) {
      const ov = UI.ov; if (!ov || ov.type !== 'lvSheet' || !ov.pend || !ov.pend[s]) return;
      ov.pend[s]--; UI.renderModal();
    },
    lvKeep() {
      const ov = UI.ov, p = A.pc(); if (!ov || ov.type !== 'lvSheet' || !p) return;
      let n = 0;
      for (const s of GD.STATS) for (let i = 0; i < ((ov.pend && ov.pend[s]) || 0); i++) if (LV.place(p, s)) n++;
      UI.ov = null;
      if (n && A.log) A.log(`You set ${LV.countWords(n)} into your body and mind.`, '');
      UI.refresh();
    },
  });

  // the profile's sheet reads its top line from here
  if (UI.PF) UI.PF.sheetTop = p => LV.profileLine(p);

  const CSS = `
.lv-line{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 6px}
.lv-pips{display:inline-flex;gap:2px}.lv-pips i{width:6px;height:6px;border-radius:50%;border:1px solid var(--line,#999);display:inline-block}.lv-pips i.on{background:var(--accent,#a77);border-color:var(--accent,#a77)}
.lv-place{min-height:44px;min-width:44px;padding:0 12px}
.lv-sheet{max-width:560px}
.lv-rows{display:flex;flex-direction:column;gap:4px;margin:8px 0}
.lv-row{display:grid;grid-template-columns:minmax(64px,1fr) minmax(60px,2fr) auto;grid-template-areas:"n b c" "w w k";align-items:center;gap:2px 8px;min-width:0}
.lv-name{grid-area:n;min-width:0}.lv-bar{grid-area:b;position:relative;height:10px;border-radius:5px;background:var(--surface-2,#eee);overflow:hidden}
.lv-bar i{position:absolute;top:0;bottom:0;left:0}.lv-room{background:var(--line,#ccc)}.lv-now{background:var(--accent,#a77)}.lv-add{background:var(--good,#6a6)}
.lv-word{grid-area:w;font-size:var(--t-small,13px)}.lv-cost{grid-area:c}.lv-ctl{grid-area:k;display:flex;gap:6px}
.lv-btn{min-width:44px;min-height:44px;font-size:20px;line-height:1}.lv-off{opacity:.55}
@media (min-width:480px){.lv-row{grid-template-columns:96px minmax(60px,1fr) 90px auto auto;grid-template-areas:"n b w c k"}}
`;
  const put = () => { if (typeof document === 'undefined' || document.getElementById('lv-style')) return; const st = document.createElement('style'); st.id = 'lv-style'; st.textContent = CSS; (document.head || document.documentElement).appendChild(st); };
  if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }
})();
