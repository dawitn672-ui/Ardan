// 996-coming-up: "Coming up", a strip at the top of the Life tab with the next few things the life already knows are
// ahead (design review cycle 1, #2):
//   - a scheduled return that carries a public label: an item's own `label` (any A.schedule call may add one), or a
//     promise made in the open (a loan to be repaid, a venture to come to account, a wedding agreed), named by
//     COMING.LABELS. Every other scheduled item stays hidden: a surprise stays a surprise.
//   - the customs of your realm (47-realm-bible, 990-far-peoples) due this month or next;
//   - your faith's holy day, or the next feast day (GD.FESTIVALS, which 990 turns into a far faith's days);
//   - your ambition's next step (97-life-fixes);
//   - initiative at or near full, which stops filling.
// It is a view: it reads the state and never writes it, draws no random number and calls no engine command. It uses
// 91-look's tokens.
(function () {
  const CU = UI.COMING = UI.COMING || {};
  CU.MAX = 5;
  CU.AHEAD = 2 * 365;        // scheduled returns this far ahead are shown
  const esc = s => UI.esc(String(s == null ? '' : s));
  const DAYS = 365;
  const monthName = m => (GD.MONTHS || [])[m] || '';
  const doyOf = at => ((at % DAYS) + DAYS) % DAYS;
  const nameOf = id => { const t = id && A.P ? A.P(id) : null; return t ? (A.fullName ? A.fullName(t, false) : t.given) : null; };
  const aliveName = id => { const t = id && A.P ? A.P(id) : null; return t && t.alive ? nameOf(id) : null; };

  // ---- scheduled returns that were promised in the open ------------------------------------------------------------
  // each: (item, pc) => a line, or null to keep it hidden. The line never says how it will turn out.
  const repay = (it) => { const n = aliveName(it.ctx && it.ctx.pid); return n ? `${n} is due to repay ${it.ctx.amt || 'the loan'}` : null; };
  const venture = (it) => { const n = aliveName(it.ctx && it.ctx.pid); return n ? `Your venture with ${n} comes to account` : null; };
  CU.LABELS = {
    ni_borrow_repaid: repay, ni_borrow_default: repay,
    ni_deal_profit: venture, ni_deal_loss: venture, ni_deal_gone: venture,
    ni_match_wedding: it => { const n = aliveName(it.ctx && it.ctx.pid); return n ? `The wedding agreed with ${n}` : 'A wedding in the family'; },
    ni_apprentice_end: it => { const n = aliveName(it.ctx && it.ctx.pid); return n ? `Your time learning under ${n} ends` : null; },
    ni_rematch: it => { const n = aliveName(it.ctx && it.ctx.pid); return n ? `${n} wants the rematch` : null; },
  };
  CU.schedLine = function (it, pc) {
    if (!it || typeof it !== 'object') return null;
    const own = typeof it.label === 'string' ? it.label : it.ctx && typeof it.ctx.label === 'string' ? it.ctx.label : null;
    if (own) return own;
    const f = it.type === 'event' && CU.LABELS[it.ev];
    if (!f) return null;
    try { return f(it, pc) || null; } catch (e) { return null; }
  };

  // when, in words: this month, next month, a month name, or a season and a year
  CU.when = function (at) {
    const S = A.S, now = A.absDay(), y = Math.floor(at / DAYS), m = A.monthOf(doyOf(at)).m, m0 = A.monthOf(A.today()).m;
    const dm = (y - S.year) * 12 + (m - m0);
    if (dm <= 0) return 'This month';
    if (dm === 1) return 'Next month';
    if (y === S.year) return monthName(m);
    if (at - now < 300) return `${monthName(m)} ${y}`;
    return `${['Winter', 'Winter', 'Spring', 'Spring', 'Spring', 'Summer', 'Summer', 'Summer', 'Autumn', 'Autumn', 'Autumn', 'Winter'][m]} ${y}`;
  };
  // the first day of month m on or after today, as an absolute day
  const monthAt = (m) => {
    const S = A.S, m0 = A.monthOf(A.today()).m, start = (A.MONTH_START || [])[m] || 0;
    const y = m >= m0 ? S.year : S.year + 1;
    return Math.max(A.absDay(), y * DAYS + start);
  };

  // ---- everything ahead, soonest first (pure) ------------------------------------------------------------------------------------
  CU.items = function (pc) {
    const S = A.S, out = [];
    if (!S || !pc || !pc.alive) return out;
    const now = A.absDay(), m0 = A.monthOf(A.today()).m, m1 = (m0 + 1) % 12;
    const add = (at, kind, text, icon) => { if (text) out.push({ at, kind, text: String(text), icon }); };
    // scheduled returns
    for (const s of S.sched || []) {
      if (!s || !s.item || s.at - now > CU.AHEAD) continue;
      const line = CU.schedLine(s.item, pc);
      if (line) add(s.at, 'promise', line, 'handshake');
    }
    // the realm's customs due this month or the next (47's year kind; 990's kinds through their own DUE rules)
    const B = A.BIBLE, FP = A.FARP;
    if (B && B.mine && A.isAdult(pc)) {
      for (const c of B.mine(pc)) {
        const h = pc.rb && pc.rb[c.id];
        for (const [mo, y] of [[m0, S.year], [m1, m1 < m0 ? S.year + 1 : S.year]]) {
          let due = false;
          try {
            if (c.kind === 'year') due = mo === (c.m || 0) && (!h || h.y !== y) && (!B.WHO || (B.WHO[c.who || 'adult'] || B.WHO.adult)(pc));
            else if (FP && FP.DUE && FP.DUE[c.kind] && FP.far && FP.far()) due = !!FP.DUE[c.kind](pc, c, h, mo, y);
          } catch (e) { due = false; }
          if (!due) continue;
          // today's custom may already be done this month (it runs on the month's first day)
          if (mo === m0 && h && h.y === S.year) continue;
          const R = A.realm(pc.realm), nm = B.fill ? B.fill(pc, c.name || '') : c.name;
          add(mo === m0 ? now : monthAt(mo), 'custom', `${nm}${R ? ' (' + (R.short || R.name) + ')' : ''}`, 'scroll');
          break;
        }
      }
    }
    // a far believer's own holy day, kept where the realm does not keep it
    let holy = false;
    try {
      if (FP && FP.days && FP.far && FP.far() && A.isAdult(pc) && !(B && B.mine(pc).some(c => c.faith === pc.faith))) {
        for (const d of FP.days(pc.faith)) if (d[1] === m0 || d[1] === m1) {
          const kept = pc.fpd && pc.fpd[pc.faith + ':' + d[0]] === S.year;
          if (d[1] === m0 && kept) continue;
          add(d[1] === m0 ? now : monthAt(d[1]), 'holy', `${d[0]}, a holy day of your faith`, 'sparkles'); holy = true;
        }
      }
    } catch (e) {}
    // the next feast day of the year (in a far realm, the faith's own days)
    if (!holy) {
      try {
        const fs = (GD.FESTIVALS || []).filter(f => Array.isArray(f) && typeof f[1] === 'number');
        const next = fs.filter(f => f[1] > m0).sort((a, b) => a[1] - b[1])[0] || fs.slice().sort((a, b) => a[1] - b[1])[0];
        if (next) add(monthAt(next[1]), 'feast', `${next[0]}, a feast day`, 'flame');
      } catch (e) {}
    }
    out.sort((a, b) => a.at - b.at);
    // standing things, not dated: the ambition's next step, initiative going to waste
    const LF = A.LF;
    try {
      const a = LF && LF.ambOf && LF.ambOf(pc), D = a && LF.AMB[a.k];
      if (D && !a.done && A.isAdult(pc)) out.push({ at: Infinity, kind: 'ambition', text: `${D.name}: ${D.step(pc)}`, icon: 'target', when: 'Ambition' });
    } catch (e) {}
    try {
      const cap = A.initiativeCap(pc), t = +S.time || 0;
      if (A.isAdult(pc) && cap > 0 && t >= cap - 0.5) out.push({ at: -1, kind: 'initiative', text: t >= cap ? `Initiative is full: it stops filling until you spend some` : `Initiative is nearly full (${t.toFixed(1)} of ${cap})`, icon: 'hourglass', when: 'Now' });
    } catch (e) {}
    out.sort((a, b) => a.at - b.at);
    return out.slice(0, CU.MAX).map(x => Object.assign(x, { when: x.when || CU.when(x.at) }));
  };

  CU.strip = function (pc) {
    let items;
    try { items = CU.items(pc); } catch (e) { console.error('coming up', e); return ''; }
    if (!items.length) return '';
    return `<section class="card cu-strip" aria-labelledby="cu-h"><h3 id="cu-h" class="cu-h">${UI.icon ? UI.icon('calendar', 's') : ''} Coming up</h3><ol class="cu-list">` +
      items.map(x => `<li class="cu-item cu-${esc(x.kind)}"><span class="cu-when">${esc(x.when)}</span><span class="cu-t">${UI.icon ? UI.icon(x.icon, 's') : ''}${esc(x.text)}</span></li>`).join('') +
      `</ol></section>`;
  };
  UI.comingUp = CU.strip;

  // the Life tab: the strip goes above What now (or first, if What now is not drawn)
  const life = UI.TAB && UI.TAB.life;
  if (typeof life === 'function') UI.TAB.life = function (pc) {
    const h = life.apply(this, arguments);
    try {
      if (typeof h !== 'string' || h.indexOf('cu-strip') >= 0) return h;
      const s = CU.strip(pc || A.pc());
      if (!s) return h;
      const at = h.indexOf('<section class="card whatnow"');
      return at >= 0 ? h.slice(0, at) + s + h.slice(at) : s + h;
    } catch (e) { console.error('coming up', e); return h; }
  };

  const CSS = `.cu-strip{padding:8px 10px;margin-bottom:8px;border:1px solid var(--line);background:var(--surface);border-radius:var(--r-m,8px)}
.cu-h{display:flex;align-items:center;gap:6px;margin:0 0 4px;font-size:var(--t-cap,12px);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-2)}
.cu-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}
.cu-item{display:grid;grid-template-columns:minmax(84px,auto) 1fr;gap:6px;align-items:baseline;font-size:var(--t-small,13px);line-height:var(--lh-small,1.38)}
.cu-when{color:var(--accent);font-variant-numeric:tabular-nums;white-space:nowrap}
.cu-t .ic{width:14px;height:14px;vertical-align:-2px;margin-right:6px;color:var(--ink-3)}
.cu-t{color:var(--ink);min-width:0}
.cu-initiative .cu-when{color:var(--warn)}
.cu-ambition .cu-t{color:var(--ink-2)}
/* a phone: the two soonest things, one line each, so the strip costs two lines of the Life page */
@media (max-width:760px){.cu-strip{padding:4px 8px}.cu-h{display:none}.cu-item:nth-child(n+3){display:none}
.cu-item{grid-template-columns:auto 1fr;font-size:14px}.cu-t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}`;
  const put = () => { if (typeof document === 'undefined' || document.getElementById('cu-style')) return; const s = document.createElement('style'); s.id = 'cu-style'; s.textContent = CSS; document.head.appendChild(s); };
  if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }
})();
