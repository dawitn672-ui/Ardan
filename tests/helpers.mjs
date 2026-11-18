// In-page helpers installed as window.T before every test.
export const HELPERS = () => {
  window.T = {
    play(years, opts = {}) {
      const end = A.S.year + years;
      for (let guard = 0; guard < 5000 && A.S.year < end; guard++) {
        const r = A.advance(400);
        let h, g = 0;
        while ((h = A.headReady()) && g++ < 500) {
          if (h.type === 'event') { opts.onEvent && opts.onEvent(A.eventView(h)); A.eventAuto(); }
          // through the journal (A.skipPrompt is the same shift, recorded), so a replay of this life meets the same queue
          else A.skipPrompt();
        }
        opts.each && opts.each();
        if (r.why === 'dead' || !A.pc() || !A.pc().alive) return 'dead';
      }
      return 'ok';
    },
    canon(v) { return v && typeof v === 'object' ? (Array.isArray(v) ? v.map(T.canon) : Object.keys(v).sort().reduce((o, k) => (o[k] = T.canon(v[k]), o), {})) : v; },
    hash(s) { s = typeof s === 'string' ? s : JSON.stringify(T.canon(s)); let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; },
    tabs() { return UI.GROUPS.flatMap(g => g.subs.map(s => s[0])); },
    enter(o) { A.newGame(o); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); },
    renderAll() {
      for (const t of T.tabs()) { UI.tab = t; UI.render(); }
      const ppl = Object.values(A.S.people).filter(p => p.alive && p.id !== A.S.pc).slice(0, 12);
      for (const p of ppl) { try { UI.A.ov && UI.A.ov(p.id); } catch (e) {} }
      UI.ov = null; UI.tab = 'life'; UI.render();
    },
    raw: /\{[A-Za-z0-9_.]+\}/,
    // World-robust tests (H-082; CLAUDE.md, "The net"). A test that needs a situation one world may lack (a war, a
    // living priest, a council seat to empty) tries worlds in turn: fn(seed) returns a falsy value when that world does
    // not have it, else its result. Returns { seed, res, tried }; seed and res are null when no world of the list had
    // it, and the test then fails or skips saying so, naming the worlds tried.
    trySeeds(seeds, fn) {
      const tried = [];
      for (const s of seeds) { tried.push(s); const res = fn(s); if (res) return { seed: s, res, tried }; }
      return { seed: null, res: null, tried };
    },
    // n seeds from `from` on: T.seedRun(9711, 6) is 9711 to 9716
    seedRun(from, n) { return Array.from({ length: n }, (_, i) => from + i); },
  };
};
