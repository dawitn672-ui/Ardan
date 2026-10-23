// The clock's rate reads UI.clkRate (early.core.js), and the clock bar shows when the early years are running fast.
export default [
  {
    id: 'EARLY-RATE',
    blob: 'ardan-core',
    why: 'Pacing: a newborn waits 400-1,500 days for a first event, two to six minutes of real time at the default speed. ' +
      'The clock now takes its days-a-second from UI.clkRate, which is ten times the chosen speed under age five.',
    edits: [['UI.clk.acc+=UI.CLK_SPEEDS[UI.clk.speed]*.1', 'UI.clk.acc+=(UI.clkRate?UI.clkRate():UI.CLK_SPEEDS[UI.clk.speed])*.1']],
  },
  {
    id: 'EARLY-NOTE',
    blob: 'ardan-core',
    why: 'Pacing: say so on the clock when the early years are running fast, beside the speed buttons.',
    edits: [['`).join("")}</span>\n    <button class="small" data-a="clkSkip"', '`).join("")}</span>${UI.earlyNote?UI.earlyNote():""}\n    <button class="small" data-a="clkSkip"']],
  },
];
