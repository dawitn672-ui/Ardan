// 999998-goal-stack (B5 part 2, D-055, CRITIQUE U20): one ordered stack of goals, and the one card the Life page reads it from.
//
// A life had goals in five places that never agreed: What now (the release's three suggestions, with 97's more), an
// ambition card (97), a chapter's aims (9993), "Coming up" with the promises made and the customs due (996) and the Path's
// next step. They competed for the top of the Life page, said the same thing twice, and ordered themselves by nothing.
// Each system keeps its own data and its own rules; this reads them all and puts them in one order:
//
//   UI.GOALS.stack(pc)  -> [{ kind, score, t, why, when, cls, act, go }], highest first, at most UI.GOALS.MAX
//   UI.GOALS.card(pc)   -> the card ("What now"): the stack as rows, the chapter folded under it
//
// kinds: 'now' (A.whatNow, which carries its own scores: health 100, the crown's debt 89, a career's choice 78 ...),
// 'promise' (a thing promised in the open: a loan due, a wedding agreed), 'custom' (a custom of the realm due), 'holy' (a
// holy day), 'ambition' (the life's ambition and its next step), 'chapter' (the open chapter's next aim), 'feast'.
// New sources register with UI.GOALS.source(name, pc => [rows]). The order is the scores, nothing else, so it can be read
// and changed in one place (UI.GOALS.SCORE). Pure: reads state, draws no dice, writes nothing.
(function () {
  if (typeof UI === 'undefined' || typeof A === 'undefined') return;
  const G = UI.GOALS = UI.GOALS || {};
  G.on = true;
  G.MAX = 5;
  const esc = s => UI.esc(String(s == null ? '' : s));
  const DAY = 365;

  // how the other systems' goals rank against What now's own scores (A.whatNow: 10 to 100)
  G.SCORE = {
    ambition: 61,                 // under a job offer (70) and a career's choice (78), over finding work (55)
    chapter: 52,                  // the aim of the stage of life: over "Choose something to do" (48)
    promise: [72, 88],            // a promise made in the open: [later, within the month]
    custom: [68, 80],             // a custom of the realm: [next month, this month]
    holy: 60,
    feast: 20,                    // a feast day is company, not a goal
  };

  const sources = {};
  G.source = (name, fn) => { sources[name] = fn; };

  G.source('now', pc => (A.whatNow ? A.whatNow(pc) : []).map(x => ({ kind: 'now', score: x.score, t: x.t, why: x.why, cls: x.cls || '', go: x.go, act: x.act || null })));

  G.source('ambition', pc => {
    const LF = A.LF, a = LF && LF.ambOf && LF.ambOf(pc), D = a && LF.AMB && LF.AMB[a.k];
    if (!D || a.done || !A.isAdult(pc)) return [];
    let step = '';
    try { step = D.step(pc); } catch (e) { return []; }
    return step ? [{ kind: 'ambition', score: G.SCORE.ambition, t: `${D.name}: ${step}`, why: 'Your ambition', cls: '', go: 'life', act: null }] : [];
  });

  G.source('chapter', pc => {
    const CH = A.CH, c = pc && pc.chap && pc.chap.cur;
    if (!CH || CH.OFF || !c || !Array.isArray(c.aims)) return [];
    const nx = c.aims.find(a => a.d == null);
    if (!nx) return [];
    const done = c.aims.filter(a => a.d != null).length;
    return [{ kind: 'chapter', score: G.SCORE.chapter, t: nx.l, why: `Chapter ${(CH.ORD && CH.ORD[c.n - 1]) || c.n}, ${c.t}: ${done} of ${c.aims.length}`, cls: '', go: 'life', act: null }];
  });

  // what is dated: Coming up's items (996), the four soonest (the stack keeps the five best of everything)
  G.source('dated', pc => {
    const CU = UI.COMING;
    if (!CU || !CU.items) return [];
    const now = A.absDay(), S = G.SCORE;
    const rows = [];
    for (const x of CU.items(pc)) {
      if (x.kind === 'ambition' || !isFinite(x.at)) continue;
      const soon = x.at - now <= 31;
      const score = x.kind === 'promise' ? S.promise[soon ? 1 : 0] : x.kind === 'custom' ? S.custom[soon ? 1 : 0] : x.kind === 'holy' ? S.holy : x.kind === 'feast' ? S.feast : 30;
      rows.push({ kind: x.kind, score, t: x.text, why: '', when: x.when, cls: '', go: 'life', act: null });
    }
    return rows.slice(0, 4);
  });

  G.stack = function (pc) {
    pc = pc || A.pc();
    if (!pc || !pc.alive) return [];
    let all = [];
    for (const name of Object.keys(sources)) {
      try { all = all.concat(sources[name](pc) || []); } catch (e) { console.error('goal source ' + name, e); }
    }
    // the same thing said twice is said once; "Let time run" only when nothing else asks for the time
    const seen = new Set();
    all = all.filter(x => x && x.t && !seen.has(x.t) && seen.add(x.t));
    if (all.some(x => x.score > 10 && x.kind !== 'feast')) all = all.filter(x => !(x.kind === 'now' && x.score <= 10));
    // a stable order: score, then the order the sources gave them in
    return all.map((x, i) => [x, i]).sort((a, b) => b[0].score - a[0].score || a[1] - b[1]).map(x => x[0]).slice(0, G.MAX);
  };

  const row = (x, i) => {
    const sub = [x.when, x.why].filter(Boolean).join(' · ');
    const inner = `<span class="wn-n" aria-hidden="true">${i + 1}</span><span class="wn-t"><b>${esc(x.t)}</b><span class="wn-why">${esc(sub)}</span></span>`;
    return x.act
      ? `<li><button class="wn-item ${esc(x.cls)}" data-a="wn" data-v="${i}">${inner}${UI.icon('chevron-right', 's')}</button></li>`
      : `<li><div class="wn-item wn-static gl-${esc(x.kind)} ${esc(x.cls)}">${inner}</div></li>`;
  };

  G.card = function (pc) {
    const L = (UI.wnItems = G.stack(pc));
    if (!L.length) return '';
    let chapter = '';
    try { chapter = A.CH && A.CH.card ? A.CH.card(pc) || '' : ''; } catch (e) { console.error('goal chapter', e); }
    return `<section class="card whatnow goal-stack" aria-labelledby="wn-h"><h3 id="wn-h" class="wn-h">${UI.icon('target', 's')} What now</h3><ol class="wn-list">${L.map(row).join('')}</ol>${chapter}</section>`;
  };
  UI.whatNowCard = G.card;

  // a stack row that is not a button (a thing dated, an ambition, an aim) is told, not offered
  const CSS = `.wn-item.wn-static{cursor:default}.wn-item.wn-static:hover{background:none}.goal-stack .chp-card{margin:6px 0 0}`;
  const put = () => { if (typeof document === 'undefined' || document.getElementById('gl-style')) return; const s = document.createElement('style'); s.id = 'gl-style'; s.textContent = CSS; document.head.appendChild(s); };
  if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }
})();
