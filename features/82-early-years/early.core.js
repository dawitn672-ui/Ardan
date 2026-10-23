// The early years pass quickly. A life begins at birth, and a newborn's first event comes 400 to 1,500 days in (24
// lives on four starts; one waited more than five years). At the default speed (4 days a second) that is two to six
// minutes of real time with nothing on screen to do, the first thing a new player meets. While the player is under
// five, the clock runs ten times faster (40 days a second at the default speed), so the first event arrives in
// seconds, the way BitLife moves a year per tap and Crusader Kings III hurries a child's early years. Only the wall
// clock changes: the same days pass in the same order, so a life plays out exactly as before. The clock shows it, so
// nobody wonders why time is racing.
(function () {
  const EY = UI.EARLY = { AGE: 5, X: 10, MAX: 600 };
  EY.on = () => { const S = A.S, pc = S && A.pc ? A.pc() : null; return !!(pc && pc.alive && A.age(pc) < EY.AGE); };
  // days a second for the clock, at its chosen speed
  UI.clkRate = function () {
    const base = (UI.CLK_SPEEDS || [])[UI.clk.speed] || 0;
    return base && EY.on() ? Math.min(EY.MAX, base * EY.X) : base;
  };
  // the note beside the speed buttons; hidden on narrow screens, where the clock bar has no room (the date's tooltip
  // still says it)
  UI.earlyNote = function () {
    if (!EY.on()) return '';
    EY.style();
    return `<span class="clk-early tiny muted" title="Until you are ${EY.AGE}, time runs ${EY.X} times faster at every speed. Nothing else changes.">early years ×${EY.X}</span>`;
  };
  EY.style = () => {
    if (typeof document === 'undefined' || document.getElementById('ey-style')) return;
    const s = document.createElement('style'); s.id = 'ey-style';
    s.textContent = '.clk-early{align-self:center;white-space:nowrap;font-style:italic}@media (max-width:760px){.clk-early{display:none}}';
    document.head.appendChild(s);
  };
})();
