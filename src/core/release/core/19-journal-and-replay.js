// The release's core, journal and replay: The journal: recording, resuming and replaying a life, and its fingerprint.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-027). Edit it here.
// Defines: jLastArgs, A.jEnc, A.jDec, A.jRecord, A.jWrap, A.journalStart, A.journalResume, A.replay, A.fingerprint.

let jLastArgs = null;

A.jEnc = function (x) {
  if (x === void 0)
    return {
      $u: 1,
    };
  if (x === null || typeof x == "string" || typeof x == "boolean") return x;
  if (typeof x == "number")
    return Number.isFinite(x)
      ? x
      : {
          $n: String(x),
        };
  if (typeof x == "function") throw new Error("the journal cannot record a function argument");
  const S = A.S;
  if (Array.isArray(x)) return x.map(A.jEnc);
  if (S) {
    if (x.id != null && S.people && S.people[x.id] === x)
      return {
        $p: x.id,
      };
    if (x.id != null && S.realms && S.realms[x.id] === x)
      return {
        $r: x.id,
      };
    if (typeof x.id == "number" && S.prov && S.prov[x.id] === x)
      return {
        $v: x.id,
      };
    if (S.queue)
      for (let i = 0; i < S.queue.length; i++) {
        const q = S.queue[i];
        if (q === x)
          return {
            $q: [i],
          };
        for (const k in q)
          if (q[k] === x && q[k] && typeof q[k] == "object")
            return {
              $q: [i, k],
            };
      }
    if (S.armies && x.id != null && S.armies.indexOf(x) >= 0)
      return {
        $a: x.id,
      };
    if (S.wars) {
      const i = S.wars.indexOf(x);
      if (i >= 0)
        return {
          $w: i,
        };
    }
    if (x.id != null && A.divById && A.divById(x.id) === x)
      return {
        $d: x.id,
      };
  }
  const o = {};
  for (const k in x) o[k] = A.jEnc(x[k]);
  return {
    $o: o,
  };
};

A.jDec = function (x) {
  if (x === null || typeof x != "object") return x;
  if (Array.isArray(x)) return x.map(A.jDec);
  const S = A.S;
  if (!x.$u) {
    if (x.$n != null) return Number(x.$n);
    if (x.$p != null) return S.people[x.$p];
    if (x.$r != null) return S.realms[x.$r];
    if (x.$v != null) return S.prov[x.$v];
    if (x.$q) {
      const q = S.queue[x.$q[0]];
      return x.$q.length > 1 ? q && q[x.$q[1]] : q;
    }
    if (x.$a != null) return A.army(x.$a);
    if (x.$w != null) return S.wars[x.$w];
    if (x.$d != null) return A.divById(x.$d);
    if (x.$o) {
      const o = {};
      for (const k in x.$o) o[k] = A.jDec(x.$o[k]);
      return o;
    }
    return x;
  }
};

A.jRecord = function (k, args) {
  if (k === "newGame") {
    const o = args[0] || {};
    if (!o.seed) o.seed = Date.now() % 2147483647 || 7;
    A.J = {
      v: 1,
      o: JSON.parse(JSON.stringify(o)),
      base: null,
      e: [],
    };
    A.jBase = null;
    jLastArgs = null;
    return;
  }
  const J = A.J;
  let n = args.length;
  for (; n > 0 && args[n - 1] === void 0; ) n--;
  const a = [];
  for (let i = 0; i < n; i++) a.push(A.jEnc(args[i]));
  const sa = JSON.stringify(a),
    last = J.e[J.e.length - 1];
  if (last && last[0] === k && sa === jLastArgs) {
    last[3] = (last[3] || 1) + 1;
    return;
  }
  J.e.push([k, a, A.rngState | 0, 1]);
  jLastArgs = sa;
};

A.jWrap = function (k, f) {
  const w = function () {
    if (A.jDepth > 0 || A.jPaused || (!A.J && k !== "newGame")) return f.apply(this, arguments);
    A.jRecord(k, arguments);
    A.jDepth++;
    try {
      return f.apply(this, arguments);
    } finally {
      A.jDepth--;
    }
  };
  w.command = k;
  return w;
};

A.journalStart = function () {
  if (!A.jInstalled) {
    A.jInstalled = true;
    A.jMissing = [];
    for (const k of A.COMMANDS)
      if (typeof A[k] == "function") A[k] = A.jWrap(k, A[k]);
      else A.jMissing.push(k);
  }
  if (!A.J) {
    A.jBase = A.S ? A.serialize() : null;
    A.J = {
      v: 1,
      o: null,
      base: A.jBase ? A.fingerprint(A.jBase) : null,
      e: [],
    };
  }
  jLastArgs = null;
  return A.J;
};

A.journalResume = function (J) {
  A.jBase = A.serialize();
  // [X1 baked patch core/01-replay SAVE-JOURNAL-BASE] A journal with no recorded game start (restarted, imported or
  // legacy) kept its old base fingerprint across a save and reload, while the report sent the just-loaded state as
  // the base, so such reports could never replay ("the save to start from is not the one this journal began at").
  // Such a journal now restarts from the loaded state; its old entries could not be replayed anyway.
  A.J =
    J && J.v === 1 && Array.isArray(J.e) && (J.o || J.base === A.fingerprint(A.jBase))
      ? J
      : {
          v: 1,
          o: null,
          base: A.fingerprint(A.jBase),
          e: [],
        };
  jLastArgs = null;
  return A.J;
};

A.replay = function (J, opt) {
  opt = opt || {};
  const keep = A.J,
    errors = [];
  A.jPaused = true;
  let i = 0;
  try {
    if (J.o) A.newGame(JSON.parse(JSON.stringify(J.o)));
    else if (J.base && opt.checkBase !== false && A.fingerprint() !== J.base)
      return {
        ok: false,
        at: -1,
        why: "the save to start from is not the one this journal began at",
      };
    const end = opt.until != null ? Math.min(opt.until, J.e.length) : J.e.length;
    for (; i < end; i++) {
      const [k, a, rng, n] = J.e[i];
      if (rng != null && (A.rngState | 0) !== rng)
        return {
          ok: false,
          at: i,
          k,
          why: "the random stream differs before this command",
          errors,
        };
      const f = A[k];
      if (typeof f != "function")
        return {
          ok: false,
          at: i,
          k,
          why: "unknown command " + k,
          errors,
        };
      for (let j = 0; j < (n || 1); j++)
        try {
          f.apply(A, A.jDec(a));
        } catch (e) {
          errors.push({
            at: i,
            k,
            msg: e.message,
          });
        }
    }
    return {
      ok: true,
      steps: i,
      errors,
    };
  } finally {
    A.jPaused = false;
    A.J = opt.keepJournal ? keep : JSON.parse(JSON.stringify(J));
    jLastArgs = null;
  }
};

A.fingerprint = function (text) {
  const s = text || A.serialize();
  let h1 = 2166136261,
    h2 = 1523705862;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619);
    h2 = Math.imul(h2 ^ c, 2246822519);
  }
  return (h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0");
};
