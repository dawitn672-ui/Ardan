// 999997-scope, part 2 (B5 part 2, D-055): every scattered gate asks UI.scope. This part is the wiring: the last wrapper of
// A.canAct, A.interactOptions and A.whatNow (it applies after every feature's own), the places the bar shows, and what a
// page says when it is drawn for a life that has no use for it. Nothing here writes state or draws a random number.
//
// What stays where it was, and is read rather than copied:
//  - class and role gates of the Life page (GD.ACT_GATE, read by the release's A.canAct);
//  - the stages (49-body-mind: "Only now" activities, A.stage);
//  - war by post (99997-v2-war: A.V2W.canRoom, W.rank, W.deployed) and Arms at 14 (99992-v2-time's V2T.armsShown);
//  - posts (A.POSTS.held, 999990-posts).
// UI.scope reads each of them once, and says the verdict for every page.
(function () {
  if (typeof UI === 'undefined' || !UI.scope) return;
  const SC = UI.SCOPE;
  const scopeOf = () => { try { return A.S && A.pc && A.pc() ? UI.scope(A.pc()) : null; } catch (e) { return null; } };

  // ---- A.canAct: an activity no life like his is offered is refused with the reason the Life page already hides ----------------
  const canAct = A.canAct;
  A.canAct = function (key) {
    const s = scopeOf();
    if (s) { const v = s.act(key); if (!v.show) return [false, v.why]; }
    return canAct.apply(this, arguments);
  };

  // ---- the actions on another person's card ----------------------------------------------------------------------------------
  const opts = A.interactOptions;
  A.interactOptions = function (pc, t) {
    const o = opts.apply(this, arguments);
    try { return pc && pc.id === A.S.pc ? UI.scope(pc).social(t, o) : o; } catch (e) { console.error('scope social', e); return o; }
  };

  // ---- What now: no line for a post he does not need, nor one for the time-wasting kind of a rank that has none ----------------
  const wn = A.whatNow;
  if (typeof wn === 'function') A.whatNow = function (pc) {
    const L = wn.apply(this, arguments);
    try {
      const s = UI.scope(pc);
      return L.filter(x => {
        if (x.t === 'Find work') return s.sees('findWork');
        if (x.t === 'Open the War Room') return s.sees('warroom');
        if (x.act && x.act[0] === 'act') return s.act(x.act[1]).show;
        if (x.t === 'Make your mark') return s.sees('mark');
        return true;
      });
    } catch (e) { return L; }
  };

  // ---- the skills list: a babe has none to list (the Skills overlay and the old profile sheet draw it) -----------------
  const pb = UI.profBlock;
  if (typeof pb === 'function') UI.profBlock = function (pc) {
    try { if (pc && !UI.scope(pc).sees('skills')) return '<p class="small muted">A babe has learned nothing yet.</p>'; } catch (e) {}
    return pb.apply(this, arguments);
  };

  // ---- the places the bar shows ---------------------------------------------------------------------------------------------
  // 99992-v2-time draws five places and 999996 adds Profile; this takes out the pages a life has no use for yet. A page not
  // in the bar still draws if something opens it by hand (UI.tab), and says so in a line (below).
  const groups = A.V2T && A.V2T.groups;
  if (typeof groups === 'function') {
    A.V2T.groups = function () {
      const G = groups.apply(this, arguments);
      try {
        const s = scopeOf();
        if (s) {
          const keep = x => s.page(x[0]);
          for (const g of G) g.subs = g.subs.filter(keep);
          for (const k of Object.keys(UI.PHONE_SUBS || {})) UI.PHONE_SUBS[k] = UI.PHONE_SUBS[k].filter(keep);
          for (let i = G.length - 1; i >= 0; i--) if (!G[i].subs.length) { G.splice(i, 1); }
          UI.GROUPS.length = 0; UI.GROUPS.push(...G);
        }
      } catch (e) { console.error('scope places', e); }
      return G;
    };
    A.V2T.groups();
  }

  // ---- a page drawn for a life that has no use for it -------------------------------------------------------------------------
  SC.NOT_YET = {
    goals: 'Nothing is yours to decide yet. That comes with years, land and a name.',
    path: 'Your road opens as you grow. For now it is your family’s.',
    holdings: 'You own nothing yet. The purse is your family’s.',
    realm: 'The court is something the grown-ups talk about over your head.',
    war: 'That is a soldier’s business, and a long way off.',
  };
  for (const k of Object.keys(SC.PAGES)) {
    const f = UI.TAB && UI.TAB[k];
    if (typeof f !== 'function') continue;
    UI.TAB[k] = function (pc) {
      try { const s = UI.scope(pc || A.pc()); if (s && s.page && !s.page(k)) return `<p class="muted not-yet">${UI.esc(SC.NOT_YET[k] || 'Not yet.')}</p>`; } catch (e) { console.error('scope page', e); }
      return f.apply(this, arguments);
    };
  }
})();
