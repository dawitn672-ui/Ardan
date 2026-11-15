// 01-stages (X2, docs/CRITIQUE.md P3, P14; docs/DECISIONS.md D-056): named stages for the hot functions.
//
// Before, a feature changed a function by wrapping it in place (`const f0 = A.applyFx; A.applyFx = function () {...}`),
// and what A.applyFx did was whatever the folder names added up to: 32 definitions of it, 22 of A.newGame, 21 of
// UI.render. Now the seven functions below have one definition each, the release's, and features add to them as named
// stages, in the order the manifest (manifest.core.js, A.FN_STAGE_ORDER) gives:
//
//   A.addStage('A.applyFx', 'moods', next => function (pc, fx, ctx) { ...; return next.apply(this, arguments); });
//   A.addStage('A.newGame', 'markets', { after(r, o) { ... } });      // runs after the inner stages, return value kept
//   A.addStage('UI.render', 'a11y', { before() { ... } });           // runs before them
//   A.addStage(['UI.render', 'UI.refresh'], 'fold', next => ...);    // the same stage on several functions
//
// A stage written as `next => function` is an around stage: `next` is the function as the inner stages left it (the
// release's at the bottom), so the stage may change the arguments, call `next` conditionally or return early, exactly
// as a wrapper did. The innermost stage is the manifest's first; the last is outermost. A stage on a function that is
// not one of the seven wraps it at once, in load order, as a wrapper always did (it is counted as a definition by
// tools/lint-stages.mjs).
//
// The composed function is assigned back to the owner (A.applyFx stays a plain function: no extra call per use), so
// reading A.applyFx at any moment gives the stages registered so far, as reading it gave the wrappers so far. While
// stages register in manifest order (the default build), each new stage wraps the one before; a stage that comes out of
// order (a feature that loads earlier than its place) recomposes the whole function from the release's.
//
// Faults are console.error (the tests' net fails on them): a name missing from the manifest, a name used twice, and a
// staged function reassigned outside A.addStage. tools/lint-stages.mjs holds the same rules statically (tools/check.mjs).
(function () {
  const ORDER = A.FN_STAGE_ORDER || {};
  const ROOTS = { A, UI, MAP: typeof MAP !== 'undefined' ? MAP : null, SAVES: typeof SAVES !== 'undefined' ? SAVES : null, GD };
  const owner = key => {
    const parts = String(key).split('.'), k = parts.pop();
    let o = ROOTS[parts.shift()];
    for (const p of parts) o = o && o[p];
    return o ? [o, k] : [null, k];
  };
  // a stage spec -> a function from the inner function to the outer
  const toWrap = spec => {
    if (typeof spec === 'function') return { kind: 'around', wrap: spec };
    if (spec && typeof spec.around === 'function') return { kind: 'around', wrap: spec.around };
    if (spec && typeof spec.before === 'function') {
      const fn = spec.before;
      return { kind: 'before', wrap: next => function () { fn.apply(this, arguments); return next.apply(this, arguments); } };
    }
    if (spec && typeof spec.after === 'function') {
      const fn = spec.after;
      return { kind: 'after', wrap: next => function () { const r = next.apply(this, arguments); fn.apply(this, [r].concat(Array.prototype.slice.call(arguments))); return r; } };
    }
    throw new Error('A.addStage: a stage is next => function, or { before }, { after } or { around }');
  };

  // key -> { key, base, fn, list: [{ name, feature, kind, rank, seq, wrap }] }: the staged functions (the manifest's keys)
  const STAGES = A.FN_STAGES = {};
  // stages on functions that are not staged: [{ key, name, feature, kind }], in load order (each one wrapped in place)
  const LOOSE = A.FN_STAGES_LOOSE = [];
  let seq = 0;
  // put a function the manifest lists under stages: from here on its definition is the base, and only stages add to it
  A.stageFn = key => {
    const [o, k] = owner(key);
    if (!ORDER[key] || !o || typeof o[k] !== 'function') { console.error('A.addStage: no function ' + key + ' to stage'); return false; }
    if (!STAGES[key]) STAGES[key] = { key, base: o[k], fn: o[k], list: [] };
    return true;
  };
  for (const key of Object.keys(ORDER)) A.stageFn(key);
  const compose = st => { let f = st.base; for (const s of st.list) f = s.wrap(f); return f; };

  A.addStage = function (keys, name, spec) {
    const { kind, wrap } = toWrap(spec);
    const feature = String(name).split('.')[0];
    for (const key of [].concat(keys)) {
      const [o, k] = owner(key), st = STAGES[key];
      if (!st) {
        // not a staged function: wrap it now, in load order, as a wrapper did
        if (!o || typeof o[k] !== 'function') continue;
        o[k] = wrap(o[k]);
        LOOSE.push({ key, name, feature, kind });
        continue;
      }
      // (a reassigned function is reported, and the stages are composed again from the base: what was assigned is lost)
      if (o[k] !== st.fn) console.error('A.addStage: ' + key + ' was reassigned outside its stages (before "' + name + '"): use A.addStage');
      if (st.list.some(s => s.name === name)) console.error('A.addStage: ' + key + ' already has a stage named "' + name + '"');
      const at = ORDER[key].indexOf(name);
      if (at < 0) console.error('A.addStage: "' + name + '" on ' + key + ' is not in the manifest (src/core/01-stages/manifest.core.js)');
      const s = { name, feature, kind, rank: at < 0 ? Infinity : at, seq: seq++, wrap };
      const inOrder = o[k] === st.fn && st.list.every(x => x.rank <= s.rank);
      st.list.push(s);
      if (inOrder) st.fn = wrap(st.fn); // the new stage wraps what is there (the default build: each made once, in load order)
      else { st.list.sort((a, b) => a.rank - b.rank || a.seq - b.seq); st.fn = compose(st); }
      o[k] = st.fn;
    }
  };
  // the stage names of a staged function, innermost first (for tests and tools)
  A.stageList = key => (STAGES[key] ? STAGES[key].list.map(s => s.name) : []);
})();
