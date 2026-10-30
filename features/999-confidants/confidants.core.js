// 999-confidants: bonds that grow in ranks, 1 to 5, over 55-bonds' ledger (design review cycle 1, #10).
//
// A friend, a lover or spouse, or a mentor (by the bond's type) whose shared history weighs enough (55's BD.mem, the
// faded sum of what passed between you) and who thinks well enough of you offers the next rank as a scene. The scene
// is an NPC move: it spends a point of 21-npc-initiative's budget, so the year's count of NPC-started scenes stays
// what 21 set. At most one rank a year with each person; one rank scene waits in the queue at a time.
// Each rank gives one concrete thing, kept on the bond (pc.rel[id].cf = rank, cfY = the year it was reached):
//   1  their opinion of you does not fade below 10 x rank
//   2  a yearly gift in the bond's month, growing with the rank: a friend's coin, a mentor's lesson in their best
//      skill, a lover's company (happiness and the company need of 35-moods)
//   3  a favour they owe you (A.addFavor), once
//   4  the gift doubles
//   5  a deed in your chronicle, and renown
// The People list and the person view show the rank as five pips. Engine: the month hook and a wrap of
// A.eventChoose (the rank is reached when you answer the scene). No A.rand anywhere. Old saves: a bond without cf is
// rank 0. Rendering only reads.
(function () {
  const CF = A.CONFIDANTS = A.CONFIDANTS || {};
  CF.MEM = [8, 16, 26, 38, 50];      // 55's ledger weight needed for each rank
  CF.OP = [20, 30, 40, 50, 60];      // and their opinion of you
  CF.ROLE = { friend: 'friend', bestfriend: 'friend', comrade: 'friend', student: 'friend', lover: 'love', betrothed: 'love', spouse: 'love',
    mentor: 'mentor', master: 'mentor', patron: 'mentor', superior: 'mentor' };
  CF.NAME = { friend: 'Friend', love: 'Beloved', mentor: 'Mentor' };
  const hash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const esc = s => UI.esc(String(s == null ? '' : s));
  const alive = id => { const t = A.P(id); return t && t.alive ? t : null; };
  CF.role = r => (r ? CF.ROLE[r.type] || null : null);
  CF.rank = (pc, id) => { const r = pc && pc.rel && pc.rel[id]; return r && r.cf > 0 ? Math.min(5, Math.floor(r.cf)) : 0; };
  const mem = (pc, t) => (A.BONDS && A.BONDS.mem ? A.BONDS.mem(pc, t) : 0);
  const theirOp = (pc, t) => (t.rel && t.rel[pc.id] ? t.rel[pc.id].op : pc.rel[t.id] ? pc.rel[t.id].op : 0);
  CF.ready = function (pc, t, r) {
    const role = CF.role(r), next = (r.cf || 0) + 1;
    if (!role || next > 5 || !t || !t.alive || t.prison || !A.isAdult(t)) return false;
    if (r.cfY != null && A.S.year - r.cfY < 1) return false;
    return mem(pc, t) >= CF.MEM[next - 1] && theirOp(pc, t) >= CF.OP[next - 1];
  };

  // ---- the month ----------------------------------------------------------------------------------------------------
  CF.month = function (pc) {
    if (CF.OFF || !pc || !pc.alive || pc.id !== A.S.pc || !pc.rel || !A.isAdult(pc)) return;
    const S = A.S, m = A.monthOf(A.today()).m;
    // what each rank gives, every month or once a year
    for (const id in pc.rel) {
      const r = pc.rel[id], k = r && r.cf > 0 ? Math.min(5, r.cf) : 0; if (!k) continue;
      const t = alive(id); if (!t) continue;
      if (t.rel && t.rel[pc.id] && t.rel[pc.id].op < 10 * k) t.rel[pc.id].op = 10 * k;
      if (k >= 2 && m === hash('cf|' + id) % 12 && r.cfG !== S.year) { r.cfG = S.year; CF.gift(pc, t, r, k); }
    }
    // the next rank, as a scene: one waiting at a time, paid from 21's budget
    if (S.queue.some(q => q && q.type === 'event' && /^cf_/.test(q.ev || ''))) return;
    const NI = A.NPCI, st = NI && NI.state ? NI.state(pc) : null;
    if (st && (st.b < 1 || (NI.room && !NI.room(pc, S.year)))) return;
    let best = null, bw = -1;
    for (const id in pc.rel) {
      const r = pc.rel[id], t = alive(id);
      if (!t || !CF.ready(pc, t, r)) continue;
      const w = mem(pc, t) + theirOp(pc, t) / 10;
      if (w > bw || (w === bw && id < best.t.id)) { bw = w; best = { t, r }; }
    }
    if (!best) return;
    const role = CF.role(best.r), next = (best.r.cf || 0) + 1, ev = `cf_${role}_${next}`;
    if (!A.EV[ev]) return;
    if (st) { st.b -= 1; st.hy[S.year] = (st.hy[S.year] || 0) + 1; st.tot = (st.tot || 0) + 1; }
    A.queue({ type: 'event', ev, ctx: { pid: best.t.id, npcMove: true, cfRank: next, cfRole: role } });
  };
  A.onMonth.push(pc => { try { CF.month(pc); } catch (e) { console.error('confidants', e); } });

  CF.bestSkill = t => {
    let best = null, bv = 0;
    for (const k of GD.SKILL_LIST || Object.keys(GD.SKILLS || {})) { const v = A.skill(t, k); if (v > bv) { bv = v; best = k; } }
    return best;
  };
  CF.gift = function (pc, t, r, k) {
    const role = CF.role(r), n = A.fullName ? A.fullName(t, false) : t.given, mult = k >= 4 ? 2 : 1;
    if (role === 'friend') { const c = 4 * k * mult; pc.coin = (pc.coin || 0) + c; A.log(`${n} turns up with ${A.coin(c)} and will not hear of it being paid back.`, 'good'); }
    else if (role === 'mentor') {
      const s = CF.bestSkill(t);
      if (s && A.trainSkill) { A.trainSkill(pc, s, 1.5 * k * mult); A.log(`${n} gives you an afternoon of ${GD.SKILLS[s] ? (GD.SKILLS[s].name || s).toLowerCase() : s}, and does not let you off lightly.`, 'good'); }
    } else if (role === 'love') {
      pc.happy = Math.min(100, (pc.happy || 0) + 2 * k * mult);
      if (A.MOODS && pc.needs && typeof pc.needs === 'object' && typeof pc.needs.company === 'number') pc.needs.company = Math.min(100, pc.needs.company + 6 * k * mult);
      A.log(`A season with ${n} that is only yours. You come back to the world slowly.`, 'good');
    }
  };

  // ---- the choice: the rank is reached ----------------------------------------------------------------------------------
  const choose = A.eventChoose;
  A.eventChoose = function (idx) {
    const q = A.S.queue[0], pc = A.pc();
    const c = q && q.type === 'event' && !q.result && /^cf_/.test(q.ev || '') && q.ctx && q.ctx.cfRank ? q.ctx : null;
    const res = choose.apply(this, arguments);
    try {
      if (c && pc && pc.alive && q.result && pc.rel[c.pid]) {
        const r = pc.rel[c.pid], t = A.P(c.pid), k = Math.max(r.cf || 0, c.cfRank);
        if (k > (r.cf || 0)) {
          r.cf = k; r.cfY = A.S.year;
          const n = t ? (A.fullName ? A.fullName(t, false) : t.given) : 'They';
          if (k === 3 && A.addFavor) A.addFavor(pc, c.pid, 1);
          if (k === 5) { (pc.deeds = pc.deeds || []).push({ y: A.S.year, t: `Was ${n}'s ${CF.role(r) === 'love' ? 'beloved' : CF.role(r) === 'mentor' ? 'pupil and heir in the craft' : 'friend'} to the end` }); if (A.fame) A.fame(pc, 3); else pc.fame = (pc.fame || 0) + 3; }
          A.log(`${n}: ${CF.NAME[CF.role(r)] || 'Confidant'}, rank ${k} of 5. ${CF.GIFT[k - 1]}`, 'good');
          if (A.bondNote) A.bondNote(pc, t, `A bond of rank ${k}`);
        }
      }
    } catch (e) { console.error('confidants choose', e); }
    return res;
  };
  if (choose.variety) A.eventChoose.variety = true;
  CF.GIFT = ['Their regard for you will not fade below a floor.', 'A gift from them each year.', 'They owe you a favour.', 'Their yearly gift doubles.', 'It goes into your chronicle.'];

  // ---- the look: five pips ------------------------------------------------------------------------------------------------
  CF.pips = function (pc, t) {
    const r = pc && pc.rel && pc.rel[t.id], k = CF.rank(pc, t.id), role = CF.role(r);
    if (!role || !k) return '';
    let next = '';
    if (k < 5) next = ` Next rank: shared history ${CF.MEM[k]} (now ${Math.round(mem(pc, t))}), their opinion ${CF.OP[k]}.`;
    const tip = `${CF.NAME[role]}, rank ${k} of 5: ${CF.GIFT.slice(0, k).join(' ')}${next}`;
    return `<span class="cf-pips" title="${esc(tip)}" role="img" aria-label="${esc(CF.NAME[role] + ', rank ' + k + ' of 5')}">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= k ? 'on' : ''}"></i>`).join('')}</span>`;
  };
  const bonds = UI.peopleBonds;
  if (typeof bonds === 'function') UI.peopleBonds = function (pc) {
    const h = bonds.apply(this, arguments);
    if (typeof h !== 'string') return h;
    try {
      return h.replace(/(data-v="person:([^"]+)"><div class="pp">[\s\S]*?<div class="bondline">)/g, (m, pre, id) => { const t = A.P(id); return t && t.alive ? pre + CF.pips(pc, t) : m; });
    } catch (e) { return h; }
  };
  const modal = UI.personModal;
  if (typeof modal === 'function') UI.personModal = function (t) {
    const h = modal.apply(this, arguments);
    try {
      const pc = A.pc(); if (!t || !pc || typeof h !== 'string') return h;
      const p = CF.pips(pc, t); if (!p) return h;
      const k = CF.rank(pc, t.id), role = CF.role(pc.rel[t.id]);
      const line = `<div class="cf-line small">${p} <b>${esc(CF.NAME[role])}, rank ${k} of 5.</b> <span class="muted">${esc(CF.GIFT.slice(0, k).join(' '))}</span></div>`;
      const at = h.indexOf('<div class="sep">');
      return at > 0 ? h.slice(0, at) + line + h.slice(at) : h + line;
    } catch (e) { return h; }
  };
  const CSS = `.cf-pips{display:inline-flex;gap:2px;vertical-align:middle;margin-right:4px}
.cf-pips i{width:7px;height:7px;border-radius:50%;border:1px solid var(--accent-rule,var(--line-strong));background:transparent}
.cf-pips i.on{background:var(--accent);border-color:var(--accent)}
.cf-line{margin:6px 0}`;
  const put = () => { if (typeof document === 'undefined' || document.getElementById('cf-style')) return; const s = document.createElement('style'); s.id = 'cf-style'; s.textContent = CSS; document.head.appendChild(s); };
  if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }
})();
