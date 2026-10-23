// The early years pass quickly, and childhood a little faster than adult life. A life begins at birth, and a
// newborn's first event comes 400 to 1,500 days in (24 lives on four starts; one waited more than five years). At the
// default speed (4 days a second) that is two to six minutes of real time with nothing on screen to do, the first
// thing a new player meets; and from five to nine a prompt came every 122 days, half a minute of waiting each. The
// clock runs ten times faster under five, three times to ten and half again to fifteen, the way BitLife moves a year
// per tap and Crusader Kings III hurries a child's early years. Only the wall clock changes: the same days pass in the
// same order, so a life plays out exactly as before. The clock shows it, so nobody wonders why time is racing.
(function () {
  // the hurry by age: measured gaps between prompts at the default speed were 214 days under five, 122 at five to
  // nine, 61 at ten to fourteen and 31 from fifteen (16 lives from birth, four starts). These factors bring each
  // stretch to roughly the adult rhythm, about one decision every 8 to 10 seconds of real time.
  const EY = UI.EARLY = { BANDS: [[5, 10, 'early years'], [10, 3, 'childhood'], [15, 1.5, 'youth']], MAX: 600 };
  EY.band = () => { const S = A.S, pc = S && A.pc ? A.pc() : null; if (!pc || !pc.alive) return null; const a = A.age(pc); return EY.BANDS.find(b => a < b[0]) || null; };
  EY.on = () => !!EY.band();
  EY.X = null;   // a test may force one factor for every band (1 turns the hurry off)
  // days a second for the clock, at its chosen speed
  UI.clkRate = function () {
    const base = (UI.CLK_SPEEDS || [])[UI.clk.speed] || 0, b = EY.band();
    return base && b ? Math.min(EY.MAX, base * (EY.X != null ? EY.X : b[1])) : base;
  };
  // the note beside the speed buttons; hidden on narrow screens, where the clock bar has no room (the date's tooltip
  // still says it)
  UI.earlyNote = function () {
    const b = EY.band(); if (!b) return '';
    EY.style();
    const x = EY.X != null ? EY.X : b[1];
    return `<span class="clk-early tiny muted" title="Until you are ${b[0]}, time runs ${x} times faster at every speed. Nothing else changes.">${b[2]} ×${x}</span>`;
  };
  EY.style = () => {
    if (typeof document === 'undefined' || document.getElementById('ey-style')) return;
    const s = document.createElement('style'); s.id = 'ey-style';
    s.textContent = '.clk-early{align-self:center;white-space:nowrap;font-style:italic}@media (max-width:760px){.clk-early{display:none}}';
    document.head.appendChild(s);
  };
})();
