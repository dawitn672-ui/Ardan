// Feedback: every action says what it did, where the player is looking. An activity, an interaction or a duty that
// gave no message of its own (enlisting, joining a company, a burglary) wrote its result only into the story log, in
// another column on a desktop and on another tab on a phone, so the button seemed to do nothing. After such an action,
// the story's newest lines from it are shown as a toast. Drawing only: it reads A.S.log and never writes the game.
const FB = UI.FEEDBACK = UI.FEEDBACK || {};
FB.lines = () => {
  const L = A.S && A.S.log;
  if (!Array.isArray(L) || !L.length) return [];
  const y = L[L.length - 1];
  return (y && Array.isArray(y.lines)) ? y.lines : [];
};
FB.mark = () => { const L = A.S && A.S.log; return { n: Array.isArray(L) ? L.length : 0, k: FB.lines().length }; };
FB.since = m => {
  const L = A.S && A.S.log;
  if (!Array.isArray(L)) return [];
  const out = [];
  for (let i = Math.max(0, m.n - 1); i < L.length; i++) {
    const lines = (L[i] && L[i].lines) || [];
    for (let j = i === m.n - 1 ? m.k : 0; j < lines.length; j++) out.push(lines[j]);
  }
  return out;
};
// the line worth showing: a "big", "good" or "bad" one first, else the first plain one; never lore
FB.pick = lines => {
  const ok = lines.filter(l => Array.isArray(l) && typeof l[0] === 'string' && l[0].trim() && l[1] !== 'lore');
  return ok.find(l => l[1] === 'big') || ok.find(l => l[1] === 'bad' || l[1] === 'good') || ok[0] || null;
};
FB.wrap = function (name) {
  const f = UI.A[name];
  if (typeof f !== 'function' || f._fb) return;
  const g = function () {
    const m = FB.mark(), t0 = document.getElementById('toast'), before = t0 ? t0.textContent : '', shown0 = t0 && t0.classList.contains('show');
    const r = f.apply(this, arguments);
    try {
      const t = document.getElementById('toast'), toasted = t && (t.textContent !== before || (!shown0 && t.classList.contains('show')));
      if (!toasted && !(UI.ov) && !(A.S && A.S.queue && A.S.queue.length)) {
        const l = FB.pick(FB.since(m));
        if (l) { const s = l[0].replace(/<[^>]*>/g, ''); UI.toast(s.length > 140 ? s.slice(0, 137) + '…' : s, 3200); }
      }
    } catch (e) { console.error('feedback', e); }
    return r;
  };
  g._fb = true;
  UI.A[name] = g;
};
for (const k of ['act', 'int', 'nobleAct', 'courtAct', 'duty', 'decide', 'cnAct', 'buyGear', 'buyGearQ', 'sellGear', 'buyProp', 'sellProp']) FB.wrap(k);
