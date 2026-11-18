// One audio context for the page: the effects and the score share it, a first press makes it only when sound or music is on,
// it is suspended when the page is hidden and resumed when shown, and the audio session is set to 'playback' where it exists.
export default {
  async oneSharedContext(pg) {
    const r = await pg.evaluate(async () => {
      const AC = window.AudioContext; let made = 0, suspends = 0, resumes = 0;
      const S = AC.prototype.suspend, R = AC.prototype.resume;
      window.AudioContext = function (o) { made++; return new AC(o); }; window.AudioContext.prototype = AC.prototype;
      AC.prototype.suspend = function () { suspends++; return S.call(this); };
      AC.prototype.resume = function () { resumes++; return R.call(this); };
      const hide = h => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => h }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => h ? 'hidden' : 'visible' }); document.dispatchEvent(new Event('visibilitychange')); };
      try {
        UI.AUDIO.reset(); UI.set.sound = false; UI.set.music = false;
        document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        const none = made === 0 && UI.AUDIO.peek() === null;                        // nothing made by a press when sound and music are off
        UI.set.sound = true; UI.set.music = true;
        document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        const first = made;                                                          // the first press unlocks: one context
        UI.ILLUM.play('quill'); UI.SCORE.start(); UI.SCORE.stop(); UI.SCORE.start(); UI.ILLUM.play('bell');
        const shared = made === 1 && UI.SCORE.peek().ctx === UI.AUDIO.peek();      // effects, score, off and on again: still one
        const session = !navigator.audioSession || navigator.audioSession.type === 'playback';
        await new Promise(r => setTimeout(r, 100));
        const s0 = suspends; hide(true); await new Promise(r => setTimeout(r, 500));
        const hidden = suspends > s0 && UI.AUDIO.peek().state === 'suspended';
        const r0 = resumes; hide(false); await new Promise(r => setTimeout(r, 300));
        const shown = resumes > r0;
        UI.SCORE.stop(); UI.set.sound = false; UI.set.music = false;
        return { none, first, shared, session, hidden, shown, made };
      } finally {
        delete document.hidden; delete document.visibilityState;
        window.AudioContext = AC; AC.prototype.suspend = S; AC.prototype.resume = R; UI.AUDIO.reset();
      }
    });
    const ok = r.none && r.first === 1 && r.shared && r.session && r.hidden && r.shown;
    return { ok, detail: `a press with sound off made nothing (${r.none}); first press with sound on made ${r.first}; effects + score + off/on: ${r.made} context, shared ${r.shared}; audioSession ${r.session}; hidden suspends ${r.hidden}; shown resumes ${r.shown}` };
  },
};
