// Round 2 B4 (D-007, CRITIQUE U9): an activity explains itself before it commits, and its answer is never cut.
//
// The release did the activity on the first tap and answered with a toast cut at 140 characters; the tile's
// description sat in a title="..." that only a mouse resting on it ever showed. Now a tap (or Enter) on a tile opens a
// sheet: what the activity is, what it costs, how it may go in words, why it cannot be done now if so, and "Do it".
// Do it runs the activity (A.doActivity, as before) and the sheet becomes a result card holding the whole answer.
//
//   UI.A.act(k)      opens the sheet (UI.ov = { type: 'actSheet', id: k })
//   UI.A.actDo(k)    commits: runs the activity, shows the answer on the card, or lets a queued event take the screen
//   UI.A.practice()  the "Practice a proficiency" button: the same, for the proficiency picked in the list
//
// Drawing the sheet only reads the game. The sheet's words are the same for every life (by category and age), never a
// number, never a percentage.
(function () {
  const esc = s => UI.esc(String(s == null ? '' : s));
  const ACT = UI.ACTSHEET = UI.ACTSHEET || {};

  // how an activity may go, by the kind of thing it is: words, never odds as numbers
  ACT.RISK = {
    'Body & mind': 'Safe but tiring. The gains are slow and steady; a rested body and a clear head learn more.',
    'Faith': 'Safe. Piety and peace of mind grow; a long rite costs time and a little coin.',
    'Social': 'Little danger. Whether it turns to friendship, love or trouble depends on who you meet and how you carry yourself.',
    'Wilds': 'Dangerous. Beasts, weather and bad roads can wound you. Your fighting worth and your skill with the wilds decide how it goes.',
    'Crime': 'Risky. A guard, a victim or plain ill luck can end it in a fine, a beating or the gaol. Skill, a quiet name and a bold nerve help.',
    'Money': 'Your coin is at stake. A good head for figures and a fair season help; a bad one costs you some or all of it.',
    'Glory': 'Costly if it goes wrong: wounds, debts, a lost name. Skill and good gear improve your chances.',
    'World': 'Slow and uncertain. Roads, tolls and strangers all have their say.',
    'Health': 'Safe. It mends what ails you; a good physician mends it faster.',
    'War': 'Dangerous. Steel and orders decide it, and men are lost. Your rank, your gear and your skill decide how it goes.',
    'Intrigue': 'Hidden, and risky. If the scheme is found out you pay for it in standing, coin or worse. Cunning and good friends help.',
    'Only now': 'This belongs to this time of your life and will not come again in the same way.',
  };
  const WORTH = [[1, 'full worth'], [0.7, 'most of its worth'], [0.45, 'about half its worth'], [0.3, 'a little of its worth'], [0, 'hardly anything']];
  ACT.worthWords = key => {
    const d = A.DIM ? A.DIM(key) : 1;
    for (const [v, w] of WORTH) if (d >= v - 1e-9) return w;
    return WORTH[WORTH.length - 1][1];
  };
  ACT.def = key => (GD.ACTIVITIES && GD.ACTIVITIES[key]) || null;
  const SPECIAL = { practice: 'Pick the proficiency in the list on this page first; the same work again in a year teaches less each time.' };

  ACT.sheet = function (ov) {
    const k = ov.id, D = ACT.def(k), pc = A.pc();
    if (!D || !pc) return `<div class="panel mbox act-sheet"><button class="close" data-a="closeOv" aria-label="Close">${UI.icon('x', 'm')}</button><h2>Nothing to do</h2><div class="mtext">That is not something you can do.</div></div>`;
    const close = `<button class="close" data-a="closeOv" aria-label="Close">${UI.icon('x', 'm')}</button>`;
    if (ov.res) {
      const r = ov.res;
      return `<div class="panel mbox act-sheet act-sheet-res">${close}<h2>${esc(D.name)}</h2>` +
        `<div class="small muted">${r.ok === false ? 'Not done' : 'Done'}</div>` +
        `<div class="mtext act-res-text" role="status">${esc(r.text)}</div>` +
        `<div class="choices"><button class="primary" data-a="closeOv">Go on</button></div></div>`;
    }
    const [ok, why] = A.canAct(k);
    const used = (A.S.yearActs && A.S.yearActs[k]) || 0;
    const have = Math.round((A.S.time || 0) * 10) / 10;
    const cost = `${D.cost} initiative (⧗); you have ${have}.`;
    const times = used ? ` You have done this ${used === 1 ? 'once' : used + ' times'} this year, and it teaches ${ACT.worthWords(k)} now.` : '';
    const row = (h, t, cls) => `<div class="act-row${cls ? ' ' + cls : ''}"><b>${esc(h)}</b><span>${esc(t)}</span></div>`;
    return `<div class="panel mbox act-sheet" data-act="${esc(k)}">${close}<h2>${esc(D.name)}</h2>` +
      `<div class="small muted">${esc(D.cat || '')}</div>` +
      `<div class="act-rows">` +
        row('What it is', D.desc + (SPECIAL[k] ? ' ' + SPECIAL[k] : '')) +
        row('What it costs', cost + times) +
        row('How it may go', ACT.RISK[D.cat] || 'It depends on your skill and on luck.') +
        (ok ? '' : row('Not now', why || 'You cannot do this yet.', 'act-no')) +
      `</div>` +
      `<div class="choices"><button class="primary" data-a="actDo" data-v="${esc(k)}"${ok ? '' : ' disabled'}>Do it</button><button data-a="closeOv">Not now</button></div></div>`;
  };

  const ovModal = UI.ovModal;
  UI.ovModal = function (ov) { return ov && ov.type === 'actSheet' ? ACT.sheet(ov) : ovModal.apply(this, arguments); };

  // the lines the activity wrote to the story, whole
  const logCount = () => { let n = 0; for (const e of (A.S && A.S.log) || []) if (e && e.lines) n += e.lines.length; return n; };
  const newLines = n0 => {
    const out = []; let n = 0;
    for (const e of (A.S && A.S.log) || []) for (const l of (e && e.lines) || []) { if (n++ >= n0 && Array.isArray(l) && l[1] !== 'lore') out.push(String(l[0] || '').replace(/<[^>]*>/g, '').trim()); }
    return out.filter(Boolean);
  };
  // run it: the answer is the activity's own message, or what it wrote to the story, whole. A toast the release would have
  // shown is held back and joined, so there is one answer, on the card
  ACT.run = function (key, arg) {
    const n0 = logCount(), t0 = UI.toast, said = [];
    UI.toast = function (m) { said.push(String(m)); };
    let r;
    try { r = A.doActivity(key, arg); } finally { UI.toast = t0; }
    const lines = newLines(n0);
    const text = ((r && r.msg) || lines.join(' ') || said.join(' ') || 'Done.').trim();
    return { r, text, ok: !(r && r.ok === false), lines };
  };
  ACT.after = function (key, res) {
    const D = ACT.def(key) || { name: key };
    UI.actLast = { k: key, name: D.name, text: res.text, ok: res.ok, day: A.absDay() };
    // an event that the activity began takes the screen; otherwise the answer is a card
    if (A.S.queue.length) { UI.ov = null; UI.renderModal(); UI.refresh(); return; }
    UI.ov = { type: 'actSheet', id: key, res: { ok: res.ok, text: res.text } };
    UI.renderModal(); UI.refresh();
  };

  Object.assign(UI.A, {
    act(k) {
      if (!ACT.def(k)) return;
      UI.ov = { type: 'actSheet', id: k };
      UI.renderModal();
    },
    actDo(k) {
      if (!ACT.def(k)) return;
      const [ok, why] = A.canAct(k);
      if (!ok) { UI.ov = { type: 'actSheet', id: k, res: { ok: false, text: why || 'Not now.' } }; UI.renderModal(); return; }
      ACT.after(k, ACT.run(k));
    },
    practice() {
      const el = UI.$('#practiceSel'), k = el ? el.value : null;
      UI.practiceK = k;
      const [ok, why] = A.canAct('practice');
      if (!ok) { UI.ov = { type: 'actSheet', id: 'practice', res: { ok: false, text: why || 'Not now.' } }; UI.renderModal(); return; }
      ACT.after('practice', ACT.run('practice', k));
    },
  });

  const css = `
  .act-sheet .act-rows{margin:10px 0 4px}
  .act-sheet .act-row{display:grid;grid-template-columns:8.5em 1fr;gap:10px;margin:7px 0;line-height:1.45}
  .act-sheet .act-row b{font-family:var(--fh);font-weight:600;letter-spacing:.03em;color:var(--ink-2)}
  .act-sheet .act-no span{color:var(--bad,#d4604a)}
  .act-sheet .act-res-text{margin:12px 0}
  #game.phone .act-sheet .act-row,.phone .act-sheet .act-row{grid-template-columns:1fr;gap:1px}
  `;
  if (typeof document !== 'undefined' && !document.getElementById('act-sheet-style')) { const s = document.createElement('style'); s.id = 'act-sheet-style'; s.textContent = css; (document.head || document.documentElement).appendChild(s); }
})();
