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
  // (playtest 2, old 18: "• changes coin", "• changes willpower" gave no direction. The content's own helpers are read
  // too: pay(p, n) and spend take coin, gain and earn give it; hurt(p, n) takes health; hp(p, v) is spirits; willGrow(p,
  // v) is willpower; bump(p, t, v) and addOp(p, T(ctx), v) are regard; p.honor = cl(p.honor - 3) is honour down.)
  // A captured word is a direction of its own: pay/spend/hurt down, gain/earn up; a pattern with no capture is up
  // (coin: ctx.bribe, coin: cost(p, 25): a sum the scene pays you).
  const OP = /\bop\s*:\s*(-?[\d.]+)/g, ADDOP = /\baddOp\(\s*[\w.]+\s*,\s*(?:[\w.]+\([^()]*\)|[\w.]+)\s*,\s*(-?[\d.]+)/g,
    BUMP = /\bbump\(\s*\w+\s*,\s*(?:[\w.]+\([^()]*\)|[\w.]+)\s*,\s*(-?[\d.]+)/g, OPSET = /\.op\s*([-+])=\s*[\d.]+/g, OPN = /\bop[23]\(\s*(-?[\d.]+)/g;
  const as = k => new RegExp('\\.' + k + '\\s*=\\s*[\\w.]*\\(?\\s*\\w+\\.' + k + '\\s*([-+])', 'g');
  const SIGNED = [
    ['their regard', [OP, ADDOP, BUMP, OPSET, OPN]],
    ['regard', [OP, ADDOP, BUMP, OPSET, OPN]],
    ['health', [/\bhealth\s*:\s*(-?[\d.]+)/g, /\bhealth\s*:\s*(-)\s*[A-Za-z_(]/g, /\.health\s*([-+])=/g, as('health'), /\b(hurt)\(\s*\w+\s*,\s*[\d.]/g]],
    ['honour', [/\bhonor\s*:\s*(-?[\d.]+)/g, /\bhonor\s*:\s*(-)\s*[A-Za-z_(]/g, /\.honor\s*([-+])=/g, as('honor'), /\bhon\(\s*p\s*,\s*(-?[\d.]+)/g]],
    ['renown', [/\bfame\s*:\s*(-?[\d.]+)/g, /\bfame\s*:\s*(-)\s*[A-Za-z_(]/g, /\.fame\s*([-+])=/g, as('fame'), /\bA\.fame\(\s*p\s*,\s*(-?[\d.]+)/g]],
    ['piety', [/\bpiety\s*:\s*(-?[\d.]+)/g, /\.piety\s*([-+])=/g, as('piety'), /\bpie\(\s*p\s*,\s*(-?[\d.]+)/g]],
    ['spirits', [/\bhappy\s*:\s*(-?[\d.]+)/g, /\bhappy\s*:\s*(-)\s*[A-Za-z_(]/g, /\.happy\s*([-+])=/g, as('happy'), /\bhp\(\s*p\s*,\s*(-?[\d.]+)/g]],
    ['stability', [/\bstability\s*:\s*(-?[\d.]+)/g, /\.stability\s*([-+])=/g, as('stability')]],
    ['the treasury', [/\btreasury\s*:\s*(-?[\d.]+)/g, /\.treasury\s*([-+])=/g]],
    ['standing in the ranks', [/\bmerit\s*:\s*(-?[\d.]+)/g, /\.merit\s*([-+])=/g]],
    ['coin', [/\bcoin\s*:\s*(-?[\d.]+)/g, /\bcoin\s*:\s*(-)\s*[A-Za-z_(]/g, /\.coin\s*([-+])=/g, as('coin'), /\.coin\s*=\s*Math\.max\(\s*0\s*,\s*\w+\.coin\s*([-+])/g, /\b(pay|spend|gain|earn)\(\s*p\b/g, /\bcoin\s*:\s*(?=ctx\.|cost\(|A\.ri\(|Math\.(?:round|floor|ceil)\()/g]],
    ['willpower', [/\bwil\s*:\s*(-?[\d.]+)/g, /\bwillGrow\(\s*\w+\s*,\s*(-?[\d.]+)/g]],
    ['relations', [/\baddRel\([^,()]+,[^,()]+(?:\([^()]*\))?[^,()]*,\s*(-?[\d.]+)/g, /\brealmRel\s*:\s*(-?[\d.]+)/g]],
    ['the army', [/\.army\s*([-+])=/g, /\barmyXp\s*:\s*(-?[\d.]+)/g]],
  ];
  const WORD_SIGN = { pay: -1, spend: -1, hurt: -1, gain: 1, earn: 1 };
  C2.SIGNED_WORDS = SIGNED.map(x => x[0]);
  const SIGN_RX = new RegExp('• (' + C2.SIGNED_WORDS.join('|') + ')\\b', 'g');
  const signCache = new WeakMap();
  // a function effect's code, with the code of the parts it was built from (f-risk: both(obj, fn) keeps fn on v2parts)
  C2.srcAll = function (fx, d) {
    if (typeof fx !== 'function') return '';
    let s = ''; try { s = String(fx); } catch (e) { s = ''; }
    if (Array.isArray(fx.v2parts) && (d || 0) < 3) for (const f of fx.v2parts) if (typeof f === 'function') s += '\n' + C2.srcAll(f, (d || 0) + 1);
    return s;
  };
  C2.signs = function (fx) {
    if (typeof fx !== 'function') return {};
    if (signCache.has(fx)) return signCache.get(fx);
    const s = C2.srcAll(fx), out = {};
    for (const [w, rxs] of SIGNED) {
      let up = 0, down = 0;
      for (const rx of rxs) for (const m of s.matchAll(rx)) { const v = m[1] === undefined ? 1 : m[1] === '+' ? 1 : m[1] === '-' ? -1 : WORD_SIGN[m[1]] || +m[1]; if (v > 0) up++; else if (v < 0) down++; }
      if (up && !down) out[w] = 1; else if (down && !up) out[w] = -1;
    }
    signCache.set(fx, out);
    return out;
  };
  // the drill scenes' helpers (the unit's order, seasoning, and its edge in a kind of drill)
  const EDGE = { march: 'marching', formation: 'formation', weapons: 'weapon drill', siege: 'siege drill', missile: 'shooting', mounted: 'riding drill', any: 'drill' };
  C2.unitChips = function (fx) {
    if (typeof fx !== 'function') return [];
    const s = C2.srcAll(fx), out = [];
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
  // whose regard a choice moves: a second messmate (99's op2 helper reads ctx.m2), the person the scene is about
  // (ctx.pid), or, in a loop over the squad or a word to your superior, them. Pure: the scene's context and the code.
  C2.regardWho = function (fx, q, pc) {
    const ctx = (q && q.ctx) || {}, me = pc && pc.id, s = C2.srcAll(fx);
    const P = id => { const x = id != null && id !== '' ? A.P(id) : null; return x && x.id !== me ? x : null; };
    if (/\bop2\(|ctx\.m2\b/.test(s) && P(ctx.m2)) return whose(P(ctx.m2), 'regard');
    if (/\bop3\(|ctx\.m3\b/.test(s) && P(ctx.m3)) return whose(P(ctx.m3), 'regard');
    if (P(ctx.pid)) return whose(P(ctx.pid), 'regard');
    if (/\bA\.squad\(/.test(s)) return 'your messmates\' regard';
    if (/\bA\.superior\(/.test(s)) return 'your superior\'s regard';
    return null;
  };

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
          ch.t = ch.t.replace(SIGN_RX, (all, w) => (sg[w] ? `${sg[w] > 0 ? '▲' : '▼'} ${w}` : all));
          if (ch.k === 'touch' && /^[▲▼]/.test(ch.t)) ch.k = /^▲/.test(ch.t) ? 'gain' : 'cost';
          // what a failed check costs is a loss: the regard it names goes down ("If it fails: hurt, ▼ Edith's regard")
          // (a failure that still raises something, "Fails: ▲ regard" in red, reads as a contradiction: it is no loss,
          // so it is not listed among the losses)
          if (ch.k === 'risk') {
            const parts = ch.t.replace(/^If it fails: /, '').split(', ').filter(x => !/^▲/.test(x));
            if (!parts.length) { ch.k = 'safe'; ch.t = 'Nothing lost if it fails'; delete ch.fail; }
            else ch.t = 'If it fails: ' + parts.join(', ').replace(/(^|, )(their regard)\b/g, '$1▼ $2');
          }
          // whose regard (playtest 2, old 18: "• changes regard" named nobody)
          const who = C2.regardWho(fxOf(ch), q, pc);
          if (who) ch.t = ch.t.replace(/\btheir regard\b/g, who).replace(/• regard\b/g, '• ' + who).replace(/([▲▼]+) regard\b/g, `$1 ${who}`);
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
