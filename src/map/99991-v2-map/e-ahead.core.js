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
// The worker's message loop, run inside the worker from its source (it reads the worker's own MAKE, DEF and A). M1 (D-142):
// the one continent is the same for every life, so a world asked with `keep` is kept in the worker's IndexedDB
// ('ardan-map', one entry, replaced, never grown) under a tag of its key and a hash of the code and settings that build it
// (the v2 engine, A.V2MAP.define, the settings posted and the map as written): the next visit reads it back instead of
// building it again, and a build whose map code changed builds afresh. A cache that is refused, missing or wiped (a private
// window, the phone short of space) only costs the build. Saves are not here: they stay SAVES's.
function workerMain() {
  var FP = null;
  function hash(s, h) { h = h || 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function db() {
    return new Promise(function (res) {
      try {
        var r = indexedDB.open('ardan-map', 1);
        r.onupgradeneeded = function () { if (!r.result.objectStoreNames.contains('w')) r.result.createObjectStore('w'); };
        r.onsuccess = function () { res(r.result); };
        r.onerror = function () { res(null); }; r.onblocked = function () { res(null); };
      } catch (e) { res(null); }
    });
  }
  function get(tag) {
    return db().then(function (d) {
      if (!d) return null;
      return new Promise(function (res) {
        try {
          var q = d.transaction('w', 'readonly').objectStore('w').get('one');
          q.onsuccess = function () { var v = q.result; try { d.close(); } catch (e) {} res(v && v.tag === tag ? v.w : null); };
          q.onerror = function () { try { d.close(); } catch (e) {} res(null); };
        } catch (e) { try { d.close(); } catch (x) {} res(null); }
      });
    });
  }
  function put(tag, w) {
    return db().then(function (d) {
      if (!d) return false;
      return new Promise(function (res) {
        try {
          var t = d.transaction('w', 'readwrite'); t.objectStore('w').put({ tag: tag, w: w }, 'one');
          t.oncomplete = function () { try { d.close(); } catch (e) {} res(true); };
          t.onerror = t.onabort = function () { try { d.close(); } catch (e) {} res(false); };
        } catch (e) { try { d.close(); } catch (x) {} res(false); }
      });
    }).catch(function () { return false; });
  }
  onmessage = function (e) {
    var d = e.data, VM = A.V2MAP, t0 = performance.now(), tag = null;
    for (var k in d.k) VM[k] = d.k[k];
    if (d.keep && typeof indexedDB !== 'undefined') {
      if (FP == null) FP = hash(String(DEF), hash(String(MAKE)));
      tag = d.key + '|' + FP + '|' + hash(JSON.stringify(d.k), hash(JSON.stringify(d.base)));
    }
    (tag ? get(tag) : Promise.resolve(null)).catch(function () { return null; }).then(function (w) {
      var err = null, from = w ? 'kept' : 'built';
      if (!w) { try { w = VM.build(d.seed, d.base, d.v); } catch (x) { err = String((x && x.stack) || x); w = null; } }
      var store = !!(tag && w && !err && from === 'built');
      postMessage({ key: d.key, w: w, err: err, ms: performance.now() - t0, from: from, done: !store });
      // the page lets the worker go once it is done, so the world is stored before the last word
      if (store) put(tag, w).then(function (ok) { postMessage({ key: d.key, done: true, stored: ok }); });
    });
  };
}

(function () {
  const VM = A.V2MAP;
  if (!VM || typeof VM.define !== 'function' || typeof VM.world !== 'function') return;
  const H = VM.AHEAD = { worker: null, failed: false, wait: new Map(), built: 0, kept: 0, adopted: 0, ms: [], err: null };
  VM.AHEAD_OFF = false;
  // the settings the map is built with, as they stand on the page (a feature may have changed one since a-world ran)
  const KEYS = ['VERSION', 'GW', 'GH', 'OPTS', 'ELEV_M', 'RIVER_T', 'STREAM_T', 'TERR_SHARE', 'TERR_CAP', 'HILL', 'SITE_R', 'ARID_REALM', 'ISLE_RX', 'COAST_RX', 'SEA_ID'];
  // the worker's own code: the v2 engine and this feature's builder, from their source, then workerMain (below)
  const source = () => 'var MAKE = ' + String(A.V2_MAKE) + ';\nvar DEF = ' + String(VM.define) + ';\nvar A = { V2: MAKE(), V2MAP: {} };\nDEF(A);\n(' + String(workerMain) + ')();\n';
  const usable = () => !VM.AHEAD_OFF && !H.failed && typeof Worker === 'function' && typeof Blob === 'function' && typeof URL !== 'undefined' &&
    typeof URL.createObjectURL === 'function' && typeof A.V2_MAKE === 'function';
  const stop = why => { H.failed = true; H.err = why; H.wait.clear(); H.next = null; try { if (H.worker) H.worker.terminate(); } catch (e) {} H.worker = null; };

  // a world the worker made: into the cache as VM.world would have put it, unless the page made it meanwhile
  VM.adopt = function (key, w) {
    if (!w || VM.cache.has(key)) return false;
    w.key = key;
    VM.cache.set(key, w);
    if (typeof VM.trim === 'function') VM.trim(); else while (VM.cache.size > VM.CACHE) VM.cache.delete(VM.cache.keys().next().value);
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
          // M1: the word after a world: it is stored for the next visit (or could not be); the worker may go if idle
          if (!('w' in d)) { if (d.stored) H.stored = (H.stored || 0) + 1; H.storing = false; if (!H.wait.size && !H.next && H.worker === wk) { try { wk.terminate(); } catch (x) {} H.worker = null; } return; }
          H.storing = !d.done;
          H.wait.delete(d.key);
          if (d.err || !d.w) H.err = d.err || 'no world';
          else { H.built++; if (d.from === 'kept') H.kept++; H.ms.push(Math.round(d.ms)); if (H.ms.length > 20) H.ms.shift(); H.at = typeof performance !== 'undefined' ? Math.round(performance.now()) : 0; VM.adopt(d.key, d.w); }
          const n = H.next; H.next = null;
          if (n) VM.ahead(n.seed, n.v);
          // idle: let it go (a phone's memory is short; the next wish starts a fresh one), once it has stored its world
          if (!H.wait.size && !H.storing && H.worker === wk) { try { wk.terminate(); } catch (x) {} H.worker = null; }
        };
        // a worker the browser will not start (a stricter policy, an old engine): the page builds as before
        wk.onerror = e => { try { e.preventDefault(); } catch (x) {} stop('worker: ' + ((e && e.message) || 'error')); };
        wk.onmessageerror = () => stop('worker: a world that could not be copied');
        setTimeout(() => { try { URL.revokeObjectURL(url); } catch (x) {} }, 60000);
      }
      const k = {}; for (const x of KEYS) if (x in VM) k[x] = VM[x];
      H.sent = typeof performance !== 'undefined' ? Math.round(performance.now()) : 0;
      H.wait.set(key, H.sent);
      // M1: the one continent is kept between visits (the worker's own IndexedDB, keyed by the code that builds it)
      H.worker.postMessage({ key, seed, v, base: VM.release(), k, keep: VM.KEEP !== false && typeof VM.pinned === 'function' && VM.pinned(key) });
      return true;
    } catch (e) { stop(String(e && e.message || e)); return false; }
  };

  // the page about to build a world the worker is still building (Begin pressed early): the worker is let go, so the two
  // do not share the phone's cores for the same result
  const world = VM.world;
  VM.world = function (seed, v = VM.VERSION) {
    const key = seed + '#' + v;
    if (H.wait.has(key) && !VM.cache.has(key) && H.worker) {
      try { H.worker.terminate(); } catch (e) {}
      H.worker = null; H.wait.clear(); H.next = null; H.cancelled = (H.cancelled || 0) + 1;
    }
    return world.apply(this, arguments);
  };

  if (typeof UI === 'undefined' || typeof UI.lifeSeed !== 'function') return;
  // the life Begin (or Random life) would start now: its seed is drawn ahead and kept until a life takes it
  UI.aheadLife = function () {
    try { if (typeof LORE !== 'undefined' && LORE.map) VM.ahead((VM.mapSeed || VM.seedOf)(UI.lifeSeed(UI.cr, false))); } catch (e) {}
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
