// 999998-goal-stack (B5 part 2, D-055, CRITIQUE U20; P3, order 54, D-062): one ordered stack of what the player has taken
// on, and the one card the Life page reads it from.
//
// P3 (order 54): "everything comes down to free will. Any of these things should be available to you but not a single
// thing should be handed to you without you seeking it out." The stack used to read What now's suggestions (A.whatNow:
// see a physician, find work, look for love, choose what to train ...), the ambition (97) and the chapter's aims (9993),
// and the realm's customs and feast days. Those were goals handed to the player; the ambitions and chapters are retired
// to archive/, and the stack now holds only what the player took on himself:
//
//   'debt'     what you owe: the moneylenders (pc.debt), and the crown's debt when the crown is yours
//   'favour'   a favour you owe someone (pc.owes: a debt of honour you accepted)
//   'promise'  a thing promised in the open and scheduled (Coming up's labelled returns: a loan due to you, a venture
//              to come to account, a wedding agreed, the end of an apprenticeship you took)
//
//   UI.GOALS.stack(pc)  -> [{ kind, score, t, why, when, cls, act, go }], highest first, at most UI.GOALS.MAX
//   UI.GOALS.card(pc)   -> the card ("What you have taken on"); nothing when there is nothing
//
// A feature may still register a source (UI.GOALS.source(name, pc => rows)) for something the player chose; never a
// suggestion. The order is the scores (UI.GOALS.SCORE). Pure: reads state, draws no dice, writes nothing.
(function () {
  if (typeof UI === 'undefined' || typeof A === 'undefined') return;
  const G = UI.GOALS = UI.GOALS || {};
  G.on = true;
  G.MAX = 5;
  const esc = s => UI.esc(String(s == null ? '' : s));
  const coin = n => (A.coin ? A.coin(Math.round(n)) : Math.round(n) + ' suns');
  const nameOf = id => { const t = id != null && A.P ? A.P(id) : null; return t && t.alive ? (A.fullName ? A.fullName(t, false) : t.given) : null; };

  G.SCORE = {
    debt: 90,                     // money owed: the lenders do not wait
    crown: 89,                    // the crown's debt, when the crown is yours
    promise: [72, 88],            // a promise made in the open: [later, within the month]
    favour: 66,                   // a favour you owe
  };

  const sources = {};
  G.source = (name, fn) => { sources[name] = fn; };

  G.source('debt', pc => {
    const out = [], d = Math.round(+pc.debt || 0);
    if (d > 0) out.push({ kind: 'debt', score: G.SCORE.debt, t: `You owe ${coin(d)} to the moneylenders`, why: 'A debt you ran up', cls: 'bad', go: 'life', act: null });
    const r = pc.ruler && A.realm ? A.realm(pc.ruler) : null;
    if (r && (+r.debt || 0) > 0) out.push({ kind: 'debt', score: G.SCORE.crown, t: `The crown owes ${coin(r.debt)}`, why: 'Your realm\'s debt', cls: 'bad', go: 'realm', act: null });
    return out;
  });

  G.source('favour', pc => {
    const out = [];
    for (const id of Object.keys(pc.owes || {})) {
      const n = +pc.owes[id] || 0, who = n > 0 ? nameOf(id) : null;
      if (who) out.push({ kind: 'favour', score: G.SCORE.favour, t: `You owe ${who} ${n === 1 ? 'a favour' : n + ' favours'}`, why: 'A debt of honour', cls: '', go: 'people', act: null });
    }
    return out.slice(0, 2);
  });

  // what was promised in the open and is scheduled: Coming up's labelled returns (996), never its customs or feast days
  G.source('promise', pc => {
    const CU = UI.COMING;
    if (!CU || !CU.items) return [];
    const now = A.absDay(), rows = [];
    for (const x of CU.items(pc)) {
      if (x.kind !== 'promise' || !isFinite(x.at)) continue;
      rows.push({ kind: 'promise', score: G.SCORE.promise[x.at - now <= 31 ? 1 : 0], t: x.text, why: '', when: x.when, cls: '', go: 'life', act: null });
    }
    return rows.slice(0, 3);
  });

  G.stack = function (pc) {
    pc = pc || A.pc();
    if (!pc || !pc.alive) return [];
    let all = [];
    for (const name of Object.keys(sources)) {
      try { all = all.concat(sources[name](pc) || []); } catch (e) { console.error('goal source ' + name, e); }
    }
    // the same thing said twice is said once
    const seen = new Set();
    all = all.filter(x => x && x.t && !seen.has(x.t) && seen.add(x.t));
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
    return `<section class="card whatnow goal-stack" aria-labelledby="wn-h"><h3 id="wn-h" class="wn-h">${UI.icon('target', 's')} What you have taken on</h3><ol class="wn-list">${L.map(row).join('')}</ol></section>`;
  };
  UI.whatNowCard = G.card;

  // a stack row that is not a button (a debt, a favour, a thing dated) is told, not offered
  const CSS = `:root .wn-item.wn-static{display:flex;align-items:center;cursor:default;color:var(--ink)}.wn-item.wn-static:hover{background:none}`;
  const put = () => { if (typeof document === 'undefined' || document.getElementById('gl-style')) return; const s = document.createElement('style'); s.id = 'gl-style'; s.textContent = CSS; document.head.appendChild(s); };
  if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }
})();
