// 99999-v2-content, part 3: what a card says about its people and its choices (playtest 1, #18 and #19).
//
// - Who the scene is about stood behind "Read more" on 30 cards a life ("Why Edith: thinks well of you (66); your aunt
//   by marriage"). The owner's rule is no hidden descriptions: the line is on the card now, in words.
// - A choice's chips said "• their regard" or "• changes standing" without saying whose or which way. Now they name the
//   person the scene is about ("Edith's regard"), name the standing (in the ranks, at work, your master's), and read
//   the way a written-as-code effect goes when its code says so (a regard of -8 is "▼ Edith's regard").
// - Some choices showed nothing at all: the drill scenes' code effects (the unit's order, seasoning and edge) were not
//   read, and an effect of nothing showed no line. Every choice now has a visible effect or consequence: what it does,
//   "Nothing changes", or "It will be remembered" for one whose effect stays hidden (a flag, a later scene).
// - A scene left with one live choice ("An old scholar": "You cannot afford it", with the only real choice out of
//   reach) is not shown: the engine drops it as it drops a scene whose tokens cannot be filled.
// The view and chip readings are pure; the drop happens where the engine builds a scene's view (A.headReady).
(function () {
  const ST = A.STAKES, C2 = A.V2C = A.V2C || {};
  const esc = s => UI.esc(String(s == null ? '' : s));

  // ---- who: the "Why ..." line on the card ------------------------------------------------------------------------------
  // 21-npc-initiative's line: "Why Edith: thinks well of you (66); your aunt by marriage; trusting."
  C2.whoLine = s => String(s || '').replace(/\s*\((?:-|−)?\d+\)/g, '').replace(/\s+/g, ' ').trim();
  // any other "Read more" on a scene (rl_cast_*: the person's look and manner) keeps its first sentence on the card,
  // the line that says who they are; the rest stays as lore
  C2.cardWho = function (h) {
    return String(h).replace(/<details class="more"><summary>Read more<\/summary><div class="mtext">([^<]*)<\/div><\/details>/g, (all, line) => {
      if (/^Why /.test(line)) return `<div class="ev-who small">${C2.whoLine(line)}</div>`;
      const m = /^(.+?[.!?])\s+(\S[\s\S]*)$/.exec(line);
      if (!m) return `<div class="ev-who small">${line}</div>`;
      return `<div class="ev-who small">${m[1]}</div><details class="more"><summary>Read more</summary><div class="mtext">${m[2]}</div></details>`;
    });
  };
  const qm = UI.queueModal;
  UI.queueModal = function (q) {
    const h = qm.apply(this, arguments);
    try { return typeof h === 'string' && q && q.type === 'event' && h.indexOf('<summary>Read more</summary>') >= 0 ? C2.cardWho(h) : h; } catch (e) { return h; }
  };

  // ---- the words of the chips -------------------------------------------------------------------------------------------
  if (ST && ST.KEY) {
    const K = ST.KEY;
    if (K.merit) K.merit.w = 'standing in the ranks';
    if (K.perf) K.perf.w = 'standing at work';
    if (K.bossOp) K.bossOp.w = 'your master\'s regard';
  }
  // the way a code effect goes, when its code says so: { family word: +1 | -1 }
  const SIGNED = [
    ['their regard', [/\bop\s*:\s*(-?[\d.]+)/g, /\baddOp\([^,()]+,[^,()]+,\s*(-?[\d.]+)/g, /\.op\s*([-+])=\s*[\d.]+/g]],
    ['regard', [/\bop\s*:\s*(-?[\d.]+)/g, /\baddOp\([^,()]+,[^,()]+,\s*(-?[\d.]+)/g, /\.op\s*([-+])=\s*[\d.]+/g]],
    ['health', [/\bhealth\s*:\s*(-?[\d.]+)/g, /\.health\s*([-+])=/g]],
    ['honour', [/\bhonor\s*:\s*(-?[\d.]+)/g, /\.honor\s*([-+])=/g]],
    ['renown', [/\bfame\s*:\s*(-?[\d.]+)/g, /\.fame\s*([-+])=/g]],
    ['piety', [/\bpiety\s*:\s*(-?[\d.]+)/g, /\.piety\s*([-+])=/g]],
    ['spirits', [/\bhappy\s*:\s*(-?[\d.]+)/g, /\.happy\s*([-+])=/g]],
    ['stability', [/\bstability\s*:\s*(-?[\d.]+)/g, /\.stability\s*([-+])=/g]],
    ['the treasury', [/\btreasury\s*:\s*(-?[\d.]+)/g, /\.treasury\s*([-+])=/g]],
    ['standing in the ranks', [/\bmerit\s*:\s*(-?[\d.]+)/g, /\.merit\s*([-+])=/g]],
    ['coin', [/\bcoin\s*:\s*(-?[\d.]+)/g, /\.coin\s*([-+])=/g]],
  ];
  const signCache = new WeakMap();
  C2.signs = function (fx) {
    if (typeof fx !== 'function') return {};
    if (signCache.has(fx)) return signCache.get(fx);
    const s = String(fx), out = {};
    for (const [w, rxs] of SIGNED) {
      let up = 0, down = 0;
      for (const rx of rxs) for (const m of s.matchAll(rx)) { const v = m[1] === '+' ? 1 : m[1] === '-' ? -1 : +m[1]; if (v > 0) up++; else if (v < 0) down++; }
      if (up && !down) out[w] = 1; else if (down && !up) out[w] = -1;
    }
    signCache.set(fx, out);
    return out;
  };
  // the drill scenes' helpers (the unit's order, seasoning, and its edge in a kind of drill)
  const EDGE = { march: 'marching', formation: 'formation', weapons: 'weapon drill', siege: 'siege drill', missile: 'shooting', mounted: 'riding drill', any: 'drill' };
  C2.unitChips = function (fx) {
    if (typeof fx !== 'function') return [];
    const s = String(fx), out = [];
    const sum = rx => { let n = 0, seen = false; for (const m of s.matchAll(rx)) { seen = true; n += +m[1]; } return seen ? n : null; };
    const org = sum(/\borg\(\s*p\s*,\s*(-?[\d.]+)/g), exp = sum(/\bexp\(\s*p\s*,\s*(-?[\d.]+)/g);
    if (org) out.push({ k: org > 0 ? 'gain' : 'cost', t: `${org > 0 ? '▲' : '▼'} the unit's order` });
    if (exp) out.push({ k: exp > 0 ? 'gain' : 'cost', t: `${exp > 0 ? '▲' : '▼'} the unit's seasoning` });
    for (const m of s.matchAll(/\bedge\(\s*p\s*,\s*["'](\w+)["']\s*,\s*(-?[\d.]+)/g)) {
      const v = +m[2], w = EDGE[m[1]] || m[1];
      if (v && !out.some(x => x.t.endsWith(w))) out.push({ k: v > 0 ? 'gain' : 'cost', t: `${v > 0 ? '▲' : '▼'} the unit's ${w}` });
    }
    return out;
  };
  // hidden effects: a flag, a later scene, a secret, a deed. Their consequence is real, so the choice says it has one.
  const HIDDEN = /\b(flag|unflag|event|secret|deed|ach|why|arc|mission|cause|schedule|queue|letter|owed|oweThem|favor|cfMark|mark)\b/;
  const hasHidden = fx => !!fx && (typeof fx === 'function' ? HIDDEN.test(String(fx)) || /A\.(schedule|queue)\(/.test(String(fx)) : Object.keys(fx).some(k => HIDDEN.test(k)));
  const isEmpty = fx => !fx || (typeof fx === 'object' && !Object.keys(fx).length) || (typeof fx === 'function' && /^\s*(\([^)]*\)|\w+)\s*=>\s*(""|''|\(\s*""\s*\)|void 0|null|undefined)\s*$/.test(String(fx)));
  const nameOf = t => (A.knownName ? A.knownName(t) : t.given);
  const whose = (t, w) => `${nameOf(t)}'s ${w}`;

  if (ST && typeof ST.choiceChips === 'function') {
    const chips0 = ST.choiceChips;
    ST.choiceChips = function (c, e, q, pc, vc) {
      const chips = chips0.apply(this, arguments);
      try {
        if (!c || typeof c !== 'object') return chips;
        const t = q && q.ctx && q.ctx.pid && A.P(q.ctx.pid);
        const fxOf = ch => (ch.k === 'win' ? c.win && c.win.fx : ch.k === 'risk' ? c.lose && c.lose.fx : c.fx);
        for (const ch of chips) {
          if (typeof ch.t !== 'string') continue;
          // which way a code effect goes
          const sg = C2.signs(fxOf(ch));
          ch.t = ch.t.replace(/• (their regard|regard|health|honour|renown|piety|spirits|stability|the treasury|standing in the ranks|coin)\b/g, (all, w) => (sg[w] ? `${sg[w] > 0 ? '▲' : '▼'} ${w}` : all));
          if (ch.k === 'touch' && /^[▲▼]/.test(ch.t)) ch.k = /^▲/.test(ch.t) ? 'gain' : 'cost';
          // what a failed check costs is a loss: the regard it names goes down ("If it fails: hurt, ▼ Edith's regard")
          // (a failure that still raises something, "Fails: ▲ regard" in red, reads as a contradiction: it is no loss,
          // so it is not listed among the losses)
          if (ch.k === 'risk') {
            const parts = ch.t.replace(/^If it fails: /, '').split(', ').filter(x => !/^▲/.test(x));
            if (!parts.length) { ch.k = 'safe'; ch.t = 'Nothing lost if it fails'; delete ch.fail; }
            else ch.t = 'If it fails: ' + parts.join(', ').replace(/(^|, )(their regard)\b/g, '$1▼ $2');
          }
          // whose regard
          if (t && t.id !== (pc && pc.id)) ch.t = ch.t.replace(/\btheir regard\b/g, whose(t, 'regard')).replace(/• regard\b/g, '• ' + whose(t, 'regard')).replace(/([▲▼]) regard\b/g, `$1 ${whose(t, 'regard')}`);
        }
        // the drill scenes' code effects
        if (!c.check && !c.group) for (const x of C2.unitChips(c.fx)) if (chips.length < 4) chips.push(x);
        if ((c.check || c.group)) {
          const w = C2.unitChips(c.win && c.win.fx);
          if (w.length && !chips.some(x => x.k === 'win')) chips.unshift({ k: 'win', t: 'If it works: ' + w.map(x => x.t).join(', ') });
        }
        // every choice shows something
        if (!chips.length) {
          if (c.check || c.group) chips.push({ k: 'safe', t: 'Nothing lost if it fails' });
          else if (hasHidden(c.fx)) chips.push({ k: 'note', t: 'It will be remembered' });
          else if (isEmpty(c.fx)) chips.push({ k: 'note', t: 'Nothing changes' });
          else chips.push({ k: 'note', t: 'It will be remembered' });
        }
      } catch (err) { console.error('v2 content chips', err); }
      return chips;
    };
  }

  // ---- a scene with one live choice is not shown ------------------------------------------------------------------------
  // (the view is built by A.headReady, an engine step; a dropped scene is shifted off the queue there)
  // A scene is dropped only when the one choice left is a way out that changes nothing (the old scholar's "You cannot
  // afford it"). One real choice beside choices out of reach (an arc's opening: "Go yourself for a season", the paid
  // ways shown with their price) or a finale whose other endings belong to other paths ("Take charge of the new fire
  // watch") is the scene working as written, and dropping it starved 46's and 52's arcs (lint, CI run 88).
  C2.isWayOut = c => !!c && !c.check && !c.event && !c.duel && !c.fight && (!c.fx || (typeof c.fx === 'object' && !Object.keys(c.fx).length));
  C2.oneLive = function (q, v) {
    const e = q && A.EV[q.ev];
    if (!e || !v || v.skip || !Array.isArray(e.choices) || e.choices.length < 2 || !Array.isArray(v.choices)) return false;
    const live = v.choices.filter(x => x && x.i >= 0);
    return live.length === 0 || (live.length === 1 && C2.isWayOut(e.choices[live[0].i]));
  };
  const view0 = A.eventView;
  A.eventView = function (q) {
    const fresh = !!q && q.type === 'event' && !q.view;
    const v = view0.apply(this, arguments);
    try {
      if (fresh && v && !v.skip && q.view === v && !q.result && C2.oneLive(q, v)) { v.skip = true; q.ctx = q.ctx || {}; q.ctx.skip = 1; C2.dropped = (C2.dropped || 0) + 1; }   // declined on purpose, as a setup's ctx.skip
      // one extra line a card: a memory or counsel speaks, the world's recalled line (57) gives way
      if (fresh && v && !v.skip && v.recall && ((v.adv && v.adv.length) || (q.ctx && q.ctx.mw && !q.ctx.mw.off && q.ctx.mw.ev === q.ev))) delete v.recall;
    } catch (err) { console.error('v2 content view', err); }
    return v;
  };

  try {
    const st = document.createElement('style');
    // the who line; and the creation screen's story blurbs in full (29-starts clamped them to two lines on a phone:
    // "Something took your father on the fells last winter. Nobody agree...")
    st.textContent = '.ev-who{margin-top:6px;color:var(--ink-2,inherit);font-family:var(--f-ui,inherit)}' +
      '.crq .crq-story .small{display:block!important;-webkit-line-clamp:unset!important;line-clamp:unset!important;overflow:visible!important}';
    document.head.appendChild(st);
  } catch (e) {}
})();
