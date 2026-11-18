# One audio context (I1-2)

Order 62's build rule: one `AudioContext`, unlocked on the first tap, paused in the background. `UI.AUDIO` owns the page's
only context. The effects (`61-illuminated-chronicle`) and the score (`73-music-score`) both take it from `UI.AUDIO.ctx()`;
turning the music off cuts the score's graph from the output but leaves the context open, and turning it on again makes none.

- Made on first use after the player turns sound or music on, with `latencyHint: 'playback'`; a first `pointerdown` makes and
  resumes it inside the gesture when either is on (iOS only starts audio in a gesture). A press with both off makes nothing.
- Suspended 220 ms after `visibilitychange` to hidden (the score's own fade runs first) and resumed when shown.
  `UI.AUDIO.suspend()` / `resume()` are the hooks a Capacitor `App` pause/resume listener calls (I1-4).
- `navigator.audioSession.type = 'playback'` when the context is made, where the API exists (guarded).
- `UI.AUDIO.reset()` closes and forgets it: tests only.
