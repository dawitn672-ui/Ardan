// One AudioContext for the whole page (I1-2, order 62 build rule "Audio", docs/IOS_ROADMAP.md §7.9).
// The sound effects (61-illuminated-chronicle) and the score (73-music-score) both take their context from here, so the page
// never holds two; turning the music off no longer closes it (the effects share it), and turning it on again makes no new one.
//   UI.AUDIO.ctx()      the context, made on first use (null where there is no Web Audio); resumed if it was suspended
//   UI.AUDIO.peek()     the context if it exists, never making one
//   UI.AUDIO.unlock()   on a first press (pointerdown): when sound or music is on, make and resume it inside the gesture
//   UI.AUDIO.suspend() / resume()   the page hidden or shown; a Capacitor app calls these from its pause and resume events (I1-4)
//   UI.AUDIO.reset()    close and forget it (tests)
// Nothing is made before the player turns sound or music on: no context until asked.
(function () {
  const AU = UI.AUDIO = UI.AUDIO || {};
  let c = null;
  const wanted = () => !!(UI.set && (UI.set.sound || UI.set.music));
  // iOS WKWebView: 'playback' keeps the sound going with the silent switch on and lets it share the session politely.
  // Guarded: absent in older WebKit and in every other engine. (The native shell sets the real session in I1-4.)
  const session = () => { try { if (typeof navigator !== 'undefined' && navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {} };
  AU.ctx = function () {
    try {
      if (c && c.state === 'closed') c = null;
      if (!c) {
        const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
        c = new C({ latencyHint: 'playback' }); session();
      }
      if (c.state === 'suspended' && !(typeof document !== 'undefined' && document.hidden)) c.resume().catch(() => {});
      return c;
    } catch (e) { return null; }
  };
  AU.peek = () => c;
  AU.unlock = function () { if (wanted()) AU.ctx(); };
  AU.suspend = function () { const x = c; if (x && x.state === 'running') x.suspend().catch(() => {}); };
  AU.resume = function () { const x = c; if (x && x.state === 'suspended' && wanted()) x.resume().catch(() => {}); };
  AU.reset = function () { const x = c; c = null; try { if (x && x.state !== 'closed') x.close(); } catch (e) {} };
  if (typeof document !== 'undefined') {
    document.addEventListener('pointerdown', AU.unlock, true);
    // the score fades before it suspends (its own handler, 150 ms); this one follows at 220 ms for the effects-only case
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') setTimeout(() => { if (document.hidden) AU.suspend(); }, 220);
      else AU.resume();
    });
  }
})();
