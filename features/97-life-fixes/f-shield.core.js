// 97-life-fixes, part 6: the first life is not lost before the player has made a choice.
//
// On Hard, the default, one newborn in twenty died before five: the year's death roll (A.deathChance times 0.18 for
// a child on Hard) and the fevers that run health to nothing (A.mortalCheck). No choice comes before it. So the first
// life begun in this browser is spared the deaths of early childhood, unless the player chose Realism:
// - The creation screen passes o.firstLife (patch LF-FIRST-LIFE) when no life has been begun here before
//   (UI.set.lfLives, a browser setting, not the save). It goes into the journal's options, so a replay does the same.
// - A.newGame keeps it as A.S.lf.shield = { pid, until }: the starting person, to the age of LF.SHIELD_AGE (5).
// - While it holds, that person's yearly death chance is 0, a health of nothing ends in recovery instead of death
//   (A.mortalCheck), and a killing blow from the world (A.kill, an epidemic) passes them by. Brothers and sisters,
//   NPCs, later lives and the heir keep canon's child mortality. Choices that kill (fx.die) still kill.
// - The creation screen says so in one line, under the difficulty (patch LF-FIRST-LIFE-SAYS).
(function () {
  const LF = A.LF = A.LF || {};
  LF.SHIELD_AGE = 5;
  LF.shielded = function (p) {
    const S = A.S, sh = S && S.lf && S.lf.shield;
    if (LF.OFF || !sh || !p || p.id !== sh.pid || p.id !== S.pc || !p.alive) return false;
    return A.age(p) < (sh.until || LF.SHIELD_AGE);
  };
  const newGame = A.newGame;
  A.newGame = function (o) {
    const r = newGame.apply(this, arguments);
    try {
      const S = A.S, diff = (o && o.diff) || (S.settings && S.settings.diff) || 'hard';
      if (o && o.firstLife && diff !== 'realism' && S.pc) {
        if (!S.lf || typeof S.lf !== 'object') S.lf = {};
        S.lf.shield = { pid: S.pc, until: LF.SHIELD_AGE };
      }
    } catch (e) { console.error('first life', e); }
    return r;
  };
  const deathChance = A.deathChance;
  if (typeof deathChance === 'function') A.deathChance = function (p) { return LF.shielded(p) ? 0 : deathChance.apply(this, arguments); };
  const mortal = A.mortalCheck;
  A.mortalCheck = function (pc) {
    if (pc && pc.alive && pc.health <= 0 && LF.shielded(pc)) {
      pc.health = A.ri(6, 14);
      A.log('The fever breaks in the night. In the morning you are thin and cross, and alive.', 'good');
      return false;
    }
    return mortal.apply(this, arguments);
  };
  const kill = A.kill;
  A.kill = function (p, cause) {
    if (p && LF.shielded(p) && !LF.dying) {
      p.health = Math.max(p.health || 0, A.ri(6, 14));
      return;
    }
    return kill.apply(this, arguments);
  };
  // a choice that kills (fx.die goes through A.pcDeath, which calls A.kill) is never stopped
  const pcDeath = A.pcDeath;
  A.pcDeath = function () {
    const pc = A.pc();
    if (pc && LF.shielded(pc) && !LF.dyingFx) {
      // the year's turn found the starting child dead of the world's doing: undo nothing, but do not end the life
      if (pc.alive) { pc.health = Math.max(pc.health || 0, 6); return; }
    }
    LF.dying = true;
    try { return pcDeath.apply(this, arguments); } finally { LF.dying = false; }
  };
  const applyFx = A.applyFx;
  A.applyFx = function (pc, fx) {
    const die = fx && typeof fx === 'object' && fx.die;
    if (!die) return applyFx.apply(this, arguments);
    LF.dyingFx = true;
    try { return applyFx.apply(this, arguments); } finally { LF.dyingFx = false; }
  };

  // ---- the creation screen -------------------------------------------------------------------------------------
  UI.lfFirst = () => !(UI.set && +UI.set.lfLives > 0);
  UI.lfStartOpts = function (o) {
    try {
      if (UI.lfFirst()) o.firstLife = true;
      UI.set.lfLives = (+UI.set.lfLives || 0) + 1;
      if (UI.saveSettings) UI.saveSettings();
    } catch (e) { console.error('first life', e); }
  };
  UI.lfFirstLine = function (c) {
    if (!UI.lfFirst()) return '';
    const on = c && c.diff !== 'realism';
    return `<div class="small muted lf-first" style="margin-top:6px">${on
      ? 'Your first life is spared the deaths of early childhood. Later lives, and Realism, keep the old odds.'
      : 'On Realism even a first life can end in the cradle.'}</div>`;
  };
})();
