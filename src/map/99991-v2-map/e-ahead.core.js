// Step X7 (phone speed, owner order 34): a new life's continent, built ahead in a Web Worker.
//
// Making a world spends most of its time in A.V2MAP.build (the continent, its erosion and its realms' borders): about
// a second on a desktop and four or more on a phone, all on the page's one thread, after Begin is pressed. The build is
// pure (its own seeded stream, no A.S, no A.rand), so the same code can run anywhere: a Web Worker evaluates
// A.V2MAP.define (a-world.core.js) and the v2 engine (A.V2_MAKE) from their own source and builds the continent of
// the life the player is about to begin while the title and the creation screen are shown. The finished world joins
// A.V2MAP.cache under the key A.V2MAP.world looks for, so A.initWorld finds it ready. The page still builds any world
// it does not find (a typed seed changed late, a browser without workers, a worker that failed): the game is the same
// either way, only sooner. Nothing here reads or writes A.S or draws from A.rand.
//
//   A.V2MAP.ahead(mapSeed[, v])   start building that world in the worker (no-op if cached, waiting or unavailable)
//   A.V2MAP.AHEAD                 { worker, failed, wait: Map(key -> ms), built, adopted, ms: [], sent, at } for tests and benches
//   A.V2MAP.AHEAD_OFF = true      never use a worker
// The worker is made from a Blob of the game's own code (no network, no eval on the page); the page's policy allows it
// under 'strict-dynamic' in Chromium. Where a browser refuses, onerror switches the worker off and nothing else changes.
//   UI.aheadLife()                build ahead for the life the creation screen would begin now (UI.lifeSeed)
(function () {
  const VM = A.V2MAP;
  if (!VM || typeof VM.define !== 'function' || typeof VM.world !== 'function') return;
  const H = VM.AHEAD = { worker: null, failed: false, wait: new Map(), built: 0, adopted: 0, ms: [], err: null };
  VM.AHEAD_OFF = false;
  // the settings the map is built with, as they stand on the page (a feature may have changed one since a-world ran)
  const KEYS = ['VERSION', 'GW', 'GH', 'OPTS', 'ELEV_M', 'RIVER_T', 'TERR_SHARE', 'ISLE_RX', 'COAST_RX', 'SEA_ID'];
  const source = () => 'var A = { V2: (' + String(A.V2_MAKE) + ')(), V2MAP: {} };\n(' + String(VM.define) + ')(A);\n' +
    'onmessage = function (e) {\n  var d = e.data, VM = A.V2MAP, w = null, err = null, t0 = performance.now();\n' +
    '  for (var k in d.k) VM[k] = d.k[k];\n' +
    '  try { w = VM.build(d.seed, d.base, d.v); } catch (x) { err = String((x && x.stack) || x); }\n' +
    '  postMessage({ key: d.key, w: w, err: err, ms: performance.now() - t0 });\n};\n';
  const usable = () => !VM.AHEAD_OFF && !H.failed && typeof Worker === 'function' && typeof Blob === 'function' && typeof URL !== 'undefined' &&
    typeof URL.createObjectURL === 'function' && typeof A.V2_MAKE === 'function';
  const stop = why => { H.failed = true; H.err = why; H.wait.clear(); H.next = null; try { if (H.worker) H.worker.terminate(); } catch (e) {} H.worker = null; };

  // a world the worker made: into the cache as VM.world would have put it, unless the page made it meanwhile
  VM.adopt = function (key, w) {
    if (!w || VM.cache.has(key)) return false;
    w.key = key;
    VM.cache.set(key, w);
    while (VM.cache.size > VM.CACHE) VM.cache.delete(VM.cache.keys().next().value);
    H.adopted++;
    return true;
  };

  // one world at a time; while the worker builds, only the latest wish waits (a seed typed letter by letter is one build)
  H.next = null;
  VM.ahead = function (seed, v = VM.VERSION) {
    const key = seed + '#' + v;
    if (VM.cache.has(key) || H.wait.has(key) || !usable()) return false;
    if (H.wait.size) { H.next = { seed, v }; return true; }
    try {
      if (!VM.on()) return false;
      if (!H.worker) {
        const url = URL.createObjectURL(new Blob([source()], { type: 'text/javascript' }));
        const wk = new Worker(url);
        H.worker = wk;
        wk.onmessage = e => {
          const d = e.data || {};
          H.wait.delete(d.key);
          if (d.err || !d.w) H.err = d.err || 'no world';
          else { H.built++; H.ms.push(Math.round(d.ms)); if (H.ms.length > 20) H.ms.shift(); H.at = typeof performance !== 'undefined' ? Math.round(performance.now()) : 0; VM.adopt(d.key, d.w); }
          const n = H.next; H.next = null;
          if (n) VM.ahead(n.seed, n.v);
          // idle: let it go (a phone's memory is short; the next wish starts a fresh one)
          if (!H.wait.size && H.worker === wk) { try { wk.terminate(); } catch (x) {} H.worker = null; }
        };
        // a worker the browser will not start (a stricter policy, an old engine): the page builds as before
        wk.onerror = e => { try { e.preventDefault(); } catch (x) {} stop('worker: ' + ((e && e.message) || 'error')); };
        wk.onmessageerror = () => stop('worker: a world that could not be copied');
        setTimeout(() => { try { URL.revokeObjectURL(url); } catch (x) {} }, 60000);
      }
      const k = {}; for (const x of KEYS) if (x in VM) k[x] = VM[x];
      H.sent = typeof performance !== 'undefined' ? Math.round(performance.now()) : 0;
      H.wait.set(key, H.sent);
      H.worker.postMessage({ key, seed, v, base: VM.release(), k });
      return true;
    } catch (e) { stop(String(e && e.message || e)); return false; }
  };

  if (typeof UI === 'undefined' || typeof UI.lifeSeed !== 'function') return;
  // the life Begin (or Random life) would start now: its seed is drawn ahead and kept until a life takes it
  UI.aheadLife = function () {
    try { if (typeof LORE !== 'undefined' && LORE.map) VM.ahead(VM.seedOf(UI.lifeSeed(UI.cr, false))); } catch (e) {}
  };
  // on the title, once it is painted: the worker starts while the event packs load (a hidden page, with no frames, after
  // 100 ms)
  if (typeof window !== 'undefined' && typeof setTimeout === 'function') {
    let started = false;
    const go = () => { if (started) return; started = true; setTimeout(() => { if (UI.screen === 'title') UI.aheadLife(); }, 0); };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(go);
    setTimeout(go, 100);
  }
  // a typed seed: build that world instead (the last one typed wins the race; the page builds any it does not find)
  const crSeed = UI.C && UI.C.crSeed;
  if (typeof crSeed === 'function') UI.C.crSeed = function () { const r = crSeed.apply(this, arguments); UI.aheadLife(); return r; };
  // a new life begun later in the session (after a death, from the menu): the creation screen starts the next one
  const newLife = UI.A && UI.A.newLife;
  if (typeof newLife === 'function') UI.A.newLife = function () { const r = newLife.apply(this, arguments); UI.aheadLife(); return r; };
})();
