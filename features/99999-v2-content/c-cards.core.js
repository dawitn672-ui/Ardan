// 99999-v2-content, part 3: what a card says about its people and its choices (playtest 1, #18 and #19).
//
// - Who the scene is about stood behind "Read more" on 30 cards a life ("Why Edith: thinks well of you (66); your aunt
//   by marriage"). The owner's rule is no hidden descriptions: the line is on the card now, in words.
// - A choice's chips said "• their regard" or "• changes standing" without saying whose or which way. Now they name the
//   person the scene is about ("Edith's regard"), name the standing (in the ranks, at work, your master's), and read
//   the way a written-as-code effect goes when its code says so (a regard of -8 is "▼ Edith's regard").
// - Some choices showed nothing at all: the drill scenes' code effects (the unit's order, seasoning and edge) were not
//   read, and an effect of nothing showed no line. Every choice now has a visible effect or consequence: what it does,
//   "Nothing changes", or "It will be remembered" for one whose effect stays hidden (a flag, a later scene).
// - A scene left with one live choice ("An old scholar": "You cannot afford it", with the only real choice out of
//   reach) is not shown: the engine drops it as it drops a scene whose tokens cannot be filled.
// The view and chip readings are pure; the drop happens where the engine builds a scene's view (A.headReady).
(function () {
  const ST = A.STAKES, C2 = A.V2C = A.V2C || {};
  const esc = s => UI.esc(String(s == null ? '' : s));

  // ---- who: the "Why ..." line on the card ------------------------------------------------------------------------------
  // 21-npc-initiative's line: "Why Edith: thinks well of you (66); your aunt by marriage; trusting."
  C2.whoLine = s => String(s || '').replace(/\s*\((?:-|−)?\d+\)/g, '').replace(/\s+/g, ' ').trim();
  // any other "Read more" on a scene (rl_cast_*: the person's look and manner) keeps its first sentence on the card,
  // the line that says who they are; the rest stays as lore
  C2.cardWho = function (h) {
    return String(h).replace(/<details class="more"><summary>Read more<\/summary><div class="mtext">([^<]*)<\/div><\/details>/g, (all, line) => {
      if (/^Why /.test(line)) return `<div class="ev-who small">${C2.whoLine(line)}</div>`;
      const m = /^(.+?[.!?])\s+(\S[\s\S]*)$/.exec(line);
      if (!m) return `<div class="ev-who small">${line}</div>`;
      return `<div class="ev-who small">${m[1]}</div><details class="more"><summary>Read more</summary><div class="mtext">${m[2]}</div></details>`;
    });
  };
  const qm = UI.queueModal;
  UI.queueModal = function (q) {
    const h = qm.apply(this, arguments);
    try { return typeof h === 'string' && q && q.type === 'event' && h.indexOf('<summary>Read more</summary>') >= 0 ? C2.cardWho(h) : h; } catch (e) { return h; }
  };

  // ---- the words of the chips -------------------------------------------------------------------------------------------
  if (ST && ST.KEY) {
    const K = ST.KEY;
    if (K.merit) K.merit.w = 'standing in the ranks';
    if (K.perf) K.perf.w = 'standing at work';
    if (K.bossOp) K.bossOp.w = 'your master\'s regard';
  }
  // the way a code effect goes, when its code says so: { family word: +1 | -1 }
  // (playtest 2, old 18: "• changes coin", "• changes willpower" gave no direction. The content's own helpers are read
  // too: pay(p, n) and spend take coin, gain and earn give it; hurt(p, n) takes health; hp(p, v) is spirits; willGrow(p,
  // v) is willpower; bump(p, t, v) and addOp(p, T(ctx), v) are regard; p.honor = cl(p.honor - 3) is honour down.)
  // A captured word is a direction of its own: pay/spend/hurt down, gain/earn up; a pattern with no capture is up
  // (coin: ctx.bribe, coin: cost(p, 25): a sum the scene pays you).
  const OP = /\bop\s*:\s*(-?[\d.]+)/g, ADDOP = /\baddOp\(\s*[\w.]+\s*,\s*(?:\((?:[^()]|\([^()]*\))*\)[\w.]*|[\w.]+\((?:[^()]|\([^()]*\))*\)|[\w.]+)\s*,\s*(-?[\d.]+)/g,
    BUMP = /\bbump\(\s*\w+\s*,\s*(?:[\w.]+\([^()]*\)|[\w.]+)\s*,\s*(-?[\d.]+)/g, OPSET = /\.op\s*([-+])=\s*[\d.]+/g, OPN = /\bop[23]\(\s*(-?[\d.]+)/g;
  const as = k => new RegExp('\\.' + k + '\\s*=\\s*[\\w.]*\\(?\\s*\\w+\\.' + k + '\\s*([-+])', 'g');
  const SIGNED = [
    ['their regard', [OP, ADDOP, BUMP, OPSET, OPN]],
    ['regard', [OP, ADDOP, BUMP, OPSET, OPN]],
    ['health', [/\bhealth\s*:\s*(-?[\d.]+)/g, /\bhealth\s*:\s*(-)\s*[A-Za-z_(]/g, /\.health\s*([-+])=/g, as('health'), /\b(hurt)\(\s*\w+\s*,\s*[\d.]/g]],
    ['honour', [/\bhonor\s*:\s*(-?[\d.]+)/g, /\bhonor\s*:\s*(-)\s*[A-Za-z_(]/g, /\.honor\s*([-+])=/g, as('honor'), /\bhon\(\s*p\s*,\s*(-?[\d.]+)/g]],
    ['renown', [/\bfame\s*:\s*(-?[\d.]+)/g, /\bfame\s*:\s*(-)\s*[A-Za-z_(]/g, /\.fame\s*([-+])=/g, as('fame'), /\bA\.fame\(\s*p\s*,\s*(-?[\d.]+)/g]],
    ['piety', [/\bpiety\s*:\s*(-?[\d.]+)/g, /\.piety\s*([-+])=/g, as('piety'), /\bpie\(\s*p\s*,\s*(-?[\d.]+)/g]],
    ['spirits', [/\bhappy\s*:\s*(-?[\d.]+)/g, /\bhappy\s*:\s*(-)\s*[A-Za-z_(]/g, /\.happy\s*([-+])=/g, as('happy'), /\bhp\(\s*p\s*,\s*(-?[\d.]+)/g]],
    ['stability', [/\bstability\s*:\s*(-?[\d.]+)/g, /\.stability\s*([-+])=/g, as('stability')]],
    ['the treasury', [/\btreasury\s*:\s*(-?[\d.]+)/g, /\.treasury\s*([-+])=/g]],
    ['standing in the ranks', [/\bmerit\s*:\s*(-?[\d.]+)/g, /\.merit\s*([-+])=/g]],
    ['coin', [/\bcoin\s*:\s*(-?[\d.]+)/g, /\bcoin\s*:\s*(-)\s*[A-Za-z_(]/g, /\.coin\s*([-+])=/g, as('coin'), /\.coin\s*=\s*Math\.max\(\s*0\s*,\s*\w+\.coin\s*([-+])/g, /\b(pay|spend|gain|earn)\(\s*p\b/g, /\bcoin\s*:\s*(?=ctx\.|cost\(|A\.ri\(|Math\.(?:round|floor|ceil)\()/g]],
    ['willpower', [/\bwil\s*:\s*(-?[\d.]+)/g, /\bwillGrow\(\s*\w+\s*,\s*(-?[\d.]+)/g]],
    ['relations', [/\baddRel\([^,()]+,[^,()]+(?:\([^()]*\))?[^,()]*,\s*(-?[\d.]+)/g, /\brealmRel\s*:\s*(-?[\d.]+)/g]],
    ['the army', [/\.army\s*([-+])=/g, /\barmyXp\s*:\s*(-?[\d.]+)/g]],
  ];
  const WORD_SIGN = { pay: -1, spend: -1, hurt: -1, gain: 1, earn: 1 };
  C2.SIGNED_WORDS = SIGNED.map(x => x[0]);
  const SIGN_RX = new RegExp('• (' + C2.SIGNED_WORDS.join('|') + ')\\b', 'g');
  const signCache = new WeakMap();
  // a function effect's code, with the code of the parts it was built from (f-risk: both(obj, fn) keeps fn on v2parts)
  C2.srcAll = function (fx, d) {
    if (typeof fx !== 'function') return '';
    let s = ''; try { s = String(fx); } catch (e) { s = ''; }
    if (Array.isArray(fx.v2parts) && (d || 0) < 3) for (const f of fx.v2parts) if (typeof f === 'function') s += '\n' + C2.srcAll(f, (d || 0) + 1);
    return s;
  };
  C2.signs = function (fx) {
    if (typeof fx !== 'function') return {};
    if (signCache.has(fx)) return signCache.get(fx);
    const s = C2.srcAll(fx), out = {};
    for (const [w, rxs] of SIGNED) {
      let up = 0, down = 0, zero = 0;
      for (const rx of rxs) for (const m of s.matchAll(rx)) { const v = m[1] === undefined ? 1 : m[1] === '+' ? 1 : m[1] === '-' ? -1 : WORD_SIGN[m[1]] || +m[1]; if (v > 0) up++; else if (v < 0) down++; else zero++; }
      // (only zeros: the word names nothing that changes, as merit: 0 in a new post's record)
      if (up && !down) out[w] = 1; else if (down && !up) out[w] = -1; else if (zero && !up && !down) out[w] = 0;
    }
    signCache.set(fx, out);
    return out;
  };
  // the drill scenes' helpers (the unit's order, seasoning, and its edge in a kind of drill)
  const EDGE = { march: 'marching', formation: 'formation', weapons: 'weapon drill', siege: 'siege drill', missile: 'shooting', mounted: 'riding drill', any: 'drill' };
  C2.unitChips = function (fx) {
    if (typeof fx !== 'function') return [];
    const s = C2.srcAll(fx), out = [];
    const sum = rx => { let n = 0, seen = false; for (const m of s.matchAll(rx)) { seen = true; n += +m[1]; } return seen ? n : null; };
    const org = sum(/\borg\(\s*p\s*,\s*(-?[\d.]+)/g), exp = sum(/\bexp\(\s*p\s*,\s*(-?[\d.]+)/g);
    if (org) out.push({ k: org > 0 ? 'gain' : 'cost', t: `${org > 0 ? '▲' : '▼'} the unit's order` });
    if (exp) out.push({ k: exp > 0 ? 'gain' : 'cost', t: `${exp > 0 ? '▲' : '▼'} the unit's seasoning` });
    for (const m of s.matchAll(/\bedge\(\s*p\s*,\s*["'](\w+)["']\s*,\s*(-?[\d.]+)/g)) {
      const v = +m[2], w = EDGE[m[1]] || m[1];
      if (v && !out.some(x => x.t.endsWith(w))) out.push({ k: v > 0 ? 'gain' : 'cost', t: `${v > 0 ? '▲' : '▼'} the unit's ${w}` });
    }
    return out;
  };
  // hidden effects: a flag, a later scene, a secret, a deed. Their consequence is real, so the choice says it has one.
  const HIDDEN = /\b(flag|unflag|event|secret|deed|ach|why|arc|mission|cause|schedule|queue|letter|owed|oweThem|favor|cfMark|mark)\b/;
  const hasHidden = fx => !!fx && (typeof fx === 'function' ? HIDDEN.test(String(fx)) || /A\.(schedule|queue)\(/.test(String(fx)) : Object.keys(fx).some(k => HIDDEN.test(k)));
  const isEmpty = fx => !fx || (typeof fx === 'object' && !Object.keys(fx).length) || (typeof fx === 'function' && /^\s*(\([^)]*\)|\w+)\s*=>\s*(""|''|\(\s*""\s*\)|void 0|null|undefined)\s*$/.test(String(fx)));
  const nameOf = t => (A.knownName ? A.knownName(t) : t.given);
  const whose = (t, w) => `${nameOf(t)}'s ${w}`;
  // whose regard a choice moves (playtest 2, old 18: "• changes regard" named nobody). Read from the scene's context and
  // the effect's code, as written: a second messmate (99's op2 reads ctx.m2); a person the code looks up in the context
  // (A.P(ctx.parId), ctx.sgtId); kin (rel: { who: "father" }, A.relsOf(p, ["mother", "father", ...]), p.parents,
  // p.spouse); the crown (the ruler's addOp); someone new the choice brings in (newRel, a castaway it names); the person
  // the scene is about (them: ctx.pid); the squad; your superior.
  // Returns the words ("Edith's regard", "your father's regard", "your family's regard", "the crown's regard"), '' when
  // the code reaches nobody here (no such kin, no one in the context: the regard changes for no one, so the chip goes),
  // or null when it cannot tell. Pure: the scene's context, the player's kin and the code.
  const FAMILY = ['father', 'mother', 'parent', 'sibling', 'spouse', 'child', 'son', 'daughter'];
  const kinWord = (type, t) => {
    const F = t && t.sex === 'F';
    if (type === 'spouse') return F ? 'your wife' : 'your husband';
    if (type === 'sibling') return F ? 'your sister' : 'your brother';
    if (type === 'child' || type === 'son' || type === 'daughter') return F ? 'your daughter' : 'your son';
    if (type === 'parent') return F ? 'your mother' : 'your father';
    if (type === 'mentor') return 'your teacher';
    return 'your ' + type;
  };
  const kinWho = (pc, roles, first) => {
    if (!pc || !roles.length) return null;
    let list = [];
    try { list = A.relsOf(pc, roles).filter(x => x && x.p && x.p.id !== pc.id); } catch (e) { list = []; }
    if (first) list = list.slice(0, 1);
    if (!list.length) return '';
    if (list.length === 1) return kinWord(list[0].r.type, list[0].p) + '\'s regard';
    const types = [...new Set(list.map(x => x.r.type))];
    if (types.length === 1) return types[0] === 'sibling' ? 'your brothers\' and sisters\' regard' : types[0] === 'child' ? 'your children\'s regard' : `your ${types[0]}s' regard`;
    if (types.every(t => t === 'father' || t === 'mother')) return 'your parents\' regard';
    if (types.every(t => FAMILY.includes(t))) return 'your family\'s regard';
    return 'your people\'s regard';
  };
  const MAKES = /\bctx\.pid\s*=[^=]/;
  C2.regardWho = function (fx, q, pc) {
    // an effect built from parts (both(obj, op2(d))): "their regard" is obj's them, the scene's person; op2's own regard
    // is f-risk's "{m2}'s regard", named there. So the parts read here are the ones that are not op2's.
    if (typeof fx === 'function' && Array.isArray(fx.v2parts)) {
      const o = fx.v2parts.find(x => x && typeof x === 'object' && x.them), f = fx.v2parts.find(x => typeof x === 'function' && !x.v2meta);
      return o ? C2.regardWho(o, q, pc) : f ? C2.regardWho(f, q, pc) : null;
    }
    const ctx = (q && q.ctx) || {}, me = pc && pc.id, s = C2.srcAll(fx), obj = fx && typeof fx === 'object' ? fx : null;
    const P = id => { const x = id != null && id !== '' ? A.P(id) : null; return x && x.id !== me ? x : null; };
    let none = false, w;
    const got = x => { if (x === '') none = true; return x || null; };
    if (/\bop2\(|ctx\.m2\b/.test(s) && P(ctx.m2)) return whose(P(ctx.m2), 'regard');
    if (/\bop3\(|ctx\.m3\b/.test(s) && P(ctx.m3)) return whose(P(ctx.m3), 'regard');
    // a person the code looks up in the context, other than ctx.pid (A.P(ctx.parId), ctx.sgtId)
    for (const m of s.matchAll(/\bA\.P\(\s*ctx\.(\w+)\s*\)|\bctx\.(\w+Id)\b/g)) {
      const k = m[1] || m[2];
      if (k === 'pid' || k === 'm2' || k === 'm3') continue;
      const t = P(ctx[k]);
      if (t) return whose(t, 'regard');
      none = true;
    }
    // kin: rel: { who } in code (the first of that kin), a loop over kin, a parent, the spouse. (An effect written as
    // data has its regard chip from them: { op }, the scene's person; its rel: { who } is a chip of its own, C2.relPart.)
    const relM = /\brel\s*:\s*\{\s*who\s*:\s*(?:["'](\w+)["']|ctx\.(\w+))/.exec(s);
    const rw = relM ? (relM[1] || ctx[relM[2]]) : null;
    if (rw && (w = got(kinWho(pc, [String(rw)], true)))) return w;
    for (const m of s.matchAll(/\b(?:relsOf|live)\(\s*\w+\s*,\s*\[([^\]]*)\]/g)) {
      const roles = [...m[1].matchAll(/["'](\w+)["']/g)].map(x => x[1]);
      if ((w = got(kinWho(pc, roles, false)))) return w;
    }
    for (const m of s.matchAll(/\bp\.parents\[(\d)\]/g)) {
      const t = pc && P((pc.parents || [])[+m[1]]);
      if (t) return kinWord('parent', t) + '\'s regard';
      none = true;
    }
    if (/\bA\.P\(\s*p\.spouse\s*\)/.test(s)) { const t = pc && P(pc.spouse); if (t) return kinWord('spouse', t) + '\'s regard'; none = true; }
    // the crown: the ruler's regard of you (addOp(ru, p, n) after r.ruler)
    if (/\.ruler\b/.test(s) && /\baddOp\(\s*ru\b|\baddOp\(\s*\w+\s*,\s*ru\b/.test(s)) return 'the crown\'s regard';
    // the person the scene is about, or someone new the choice brings in
    const them = !!(obj && obj.them && typeof obj.them === 'object') || /\bthem\s*:\s*\{/.test(s);
    // (awWho, or code that puts someone new in ctx.pid, makes them the scene's person; a newRel's bond is a person of its
    // own, so its regard is "your new friend's" only where no them: { op } names the scene's person)
    const made = !!(obj && obj.awWho) || /\bawWho\s*:/.test(s) || MAKES.test(s), fresh = made || (!them && (!!(obj && obj.newRel) || /\bnewRel\s*:/.test(s)));
    if (them && P(ctx.pid) && !made) return whose(P(ctx.pid), 'regard');
    if (fresh) {
      const occ = /\bocc\s*:\s*"([^"]+)"/.exec(s), ty = (obj && obj.newRel && obj.newRel.type) || (/\bnewRel\s*:\s*\{\s*type\s*:\s*["'](\w+)["']/.exec(s) || [])[1];
      if (occ && MAKES.test(s)) return 'the regard of ' + occ[1];
      return `your new ${ty === 'mentor' ? 'teacher' : ty || 'friend'}'s regard`;
    }
    // (no one in a context the scene filled: the regard reaches nobody. A context left empty, as when the chips are read
    // with no scene set up (9998's own readings), keeps "their regard": there is no scene to name anyone from)
    if (them && Object.keys(ctx).length) none = true;
    if (/\bA\.squad\(/.test(s)) return 'your messmates\' regard';
    if (/\bA\.superior\(/.test(s)) return 'your superior\'s regard';
    if (P(ctx.pid)) return whose(P(ctx.pid), 'regard');
    return none ? '' : null;
  };
  // whose regard a choice moves, person by person, read from the target each addOp and bump is given (playtest 2, old
  // 18; the third round: naming the first person the code mentions named the wrong one). fm_love_rival's "Fight him"
  // links the rival but lowers the lover's regard (addOp(p, T(ctx), -4)); lf_lover_faith's first choice raises the
  // lover's (bump(p, t, 25), t = T(ctx)) and lowers your mother's (addOp(p, A.P(p.parents[1]), -10)); a both(obj, op2(d))
  // moves the scene's person by obj's them: { op } and the second messmate by d. A target is T(ctx) (the scene's
  // person), A.P(ctx.k) (a person of the scene), a parent, the spouse, the crown (addOp(ru, p, n), ru the ruler), your
  // superior, a messmate or the mess (A.squad), kin in a loop (for (const x of live(p, [...])) addOp(p, x.p, n)), or a
  // name the code gives one of these (const t = T(ctx), const f = A.P(ctx.fid), const h = ctx.hid ? A.P(ctx.hid) : null).
  // 40's figures: eff(p, ctx, { them }) moves the scene's person, castFx(p, "CHR-0255", { them }) a named figure.
  // Returns [{ key, name, up, down, big }] in the order the code moves them (name null: that person is not here, so the
  // regard reaches no one), or null when a target or a number cannot be read (the caller then names by C2.regardWho).
  // Pure: the scene's context, the player's kin and the code; it never makes the figure it names.
  const castName = cid => {
    const id = A.S && A.S.castMap && A.S.castMap[cid], t = id && A.P(id);
    if (t) return nameOf(t);
    try { const c = typeof LORE !== 'undefined' && LORE.cast && LORE.cast[cid]; const n = c && A.parseCastName ? A.parseCastName(c.name) : null; return (n && n.given) || null; } catch (e) { return null; }
  };
  const ARG = String.raw`[\w.]+(?:\((?:[^()]|\([^()]*\))*\))?(?:\[\d+\])?(?:\s*\|\|\s*null)?`;
  const CALL = new RegExp(String.raw`\b(?:A\.)?(addOp|bump)\(\s*(${ARG})\s*,\s*(${ARG})\s*,\s*((?:A\.chance\((?:[^()]|\([^()]*\))*\)\s*\?\s*)?-?[\d.]+(?:\s*:\s*-?[\d.]+)?(?=\s*[,)])|[^,()]*(?:\([^()]*\))?[^,()]*)`, 'g');
  const CALLS = /\b(?:A\.)?(?:addOp|bump)\(/g, DEFS = /\b(?:A\.)?(?:addOp|bump)\s*=\s*(?:function\s*)?\(/g;
  C2.regardTargets = function (fx, q, pc, d) {
    const ctx = (q && q.ctx) || {}, me = pc && pc.id, depth = d || 0;
    if (depth > 3 || !fx) return null;
    const seen = new Map(), add = (key, name, v) => { const e = seen.get(key) || { key, name, up: 0, down: 0, big: false }; if (v > 0) e.up++; else if (v < 0) e.down++; if (Math.abs(v) >= 20) e.big = true; seen.set(key, e); };
    const merge = list => { for (const e of list) { const x = seen.get(e.key) || { key: e.key, name: e.name, up: 0, down: 0, big: false }; x.up += e.up; x.down += e.down; x.big = x.big || e.big; seen.set(e.key, x); } };
    const P = id => { const x = id != null && id !== '' ? A.P(id) : null; return x && x.id !== me ? x : null; };
    // (a context left empty, as when the chips are read with no scene set up, names no one of the scene: null)
    const empty = !Object.keys(ctx).length;
    const person = k => { const t = P(ctx[k]); return t ? whose(t, 'regard') : null; };
    // an effect written as data: its them: { op } is the scene's person (one that brings someone new in is read by
    // C2.regardWho); its rel: { who } is shown by C2.relPart
    if (typeof fx === 'object') {
      if (fx.awWho || fx.newRel) return null;
      const n = fx.them && typeof fx.them === 'object' && typeof fx.them.op === 'number' ? fx.them.op : 0;
      if (n) { if (empty) return null; add('ctx:pid', person('pid'), n); }
      return [...seen.values()];
    }
    if (typeof fx !== 'function') return null;
    // an effect built from parts (both(obj, fn), op2(d)): each part as written, op2's messmate from its record
    if (Array.isArray(fx.v2parts) || fx.v2meta) {
      for (const part of fx.v2parts || []) { const r = C2.regardTargets(part, q, pc, depth + 1); if (!r) return null; merge(r); }
      const m = fx.v2meta;
      if (m && typeof m.op === 'number' && m.op) { if (!m.who || empty) return null; add('ctx:' + m.who, person(m.who), m.op); }
      return [...seen.values()];
    }
    let s = ''; try { s = String(fx); } catch (e) { return null; }
    if (MAKES.test(s) || /\bawWho\s*:/.test(s)) return null;   // a choice that puts someone new in the scene
    s = s.replace(DEFS, ' ');
    // a figure from 40's cast, moved by its own castFx
    s = s.replace(/\bcastFx\(\s*p\s*,\s*"([\w-]+)"\s*,\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\s*\)/g, (all, cid, body) => {
      const m = /\bthem\s*:\s*\{[^}]*?\bop\s*:\s*(-?[\d.]+)/.exec(body);
      if (m) add('cast:' + cid, castName(cid) && castName(cid) + '\'s regard', +m[1]);
      return ' ';
    });
    // the names the code gives the people it looks up, and the people a loop walks
    const vars = {}, loops = {};
    for (const m of s.matchAll(/\b(?:const|let|var)\s+([^;]*)/g)) for (const dm of m[1].matchAll(/(?:^|,)\s*(\w+)\s*=\s*((?:\w+\s*&&\s*)?(?:ctx\.\w+\s*\?\s*)?(?:T\(\s*ctx\s*\)|A\.P\(\s*(?:ctx\.\w+|p\.parents\[\d\]|p\.spouse|\w+\.ruler)\s*\)|spouseOf\(\s*p\s*\)|A\.squad\(\s*p\s*\)\[0\]|A\.superior\(\s*p\s*\)))/g)) {
      const k = dm[1], v = dm[2].replace(/^\w+\s*&&\s*/, '').replace(/^ctx\.\w+\s*\?\s*/, '');
      vars[k] = vars[k] && vars[k] !== v ? '?' : v;
    }
    for (const m of s.matchAll(/\bfor\s*\(\s*(?:const|let|var)\s+(\w+)\s+of\s+(?:(?:A\.)?(?:live|relsOf)\(\s*p\s*,\s*\[([^\]]*)\]|A\.squad\(\s*p\s*\))/g)) loops[m[1]] = m[2] != null ? 'kin:' + [...m[2].matchAll(/["'](\w+)["']/g)].map(x => x[1]).join(',') : 'squad';
    const target = (e, dd) => {
      e = e.replace(/\s*\|\|\s*null$/, '').replace(/\s+/g, '');
      let m;
      if (/^T\(ctx\)$/.test(e)) return empty ? undefined : { key: 'ctx:pid', name: person('pid') };
      if ((m = /^A\.P\(ctx\.(\w+)\)$/.exec(e))) return empty ? undefined : { key: 'ctx:' + m[1], name: person(m[1]) };
      if ((m = /^A\.P\(p\.parents\[(\d)\]\)$/.exec(e))) { const t = pc && P((pc.parents || [])[+m[1]]); return { key: 'parent:' + m[1], name: t ? kinWord('parent', t) + '\'s regard' : null }; }
      if (/^A\.P\(p\.spouse\)$|^spouseOf\(p\)$/.test(e)) { const t = pc && P(pc.spouse); return { key: 'spouse', name: t ? kinWord('spouse', t) + '\'s regard' : null }; }
      if (/^A\.P\(\w+\.ruler\)$/.test(e)) return { key: 'crown', name: 'the crown\'s regard' };
      if (/^A\.superior\(p\)$/.test(e)) return { key: 'superior', name: 'your superior\'s regard' };
      if (/^A\.squad\(p\)\[0\]$/.test(e)) { let t = null; try { t = pc && A.squad(pc)[0]; } catch (err) { t = null; } return { key: 'mate0', name: t ? whose(t, 'regard') : null }; }
      if ((m = /^(\w+)\.p$/.exec(e)) && loops[m[1]] && loops[m[1]].startsWith('kin:')) { const roles = loops[m[1]].slice(4).split(',').filter(Boolean); return { key: loops[m[1]], name: kinWho(pc, roles, false) || null }; }
      if (/^\w+$/.test(e) && loops[e] === 'squad') return { key: 'squad', name: pc && pc.mil ? 'your messmates\' regard' : null };
      if (/^\w+$/.test(e) && vars[e] && vars[e] !== '?' && (dd || 0) < 3) return target(vars[e], (dd || 0) + 1);
      return undefined;
    };
    const val = v => (/^-?[\d.]+$/.test(v.trim()) ? [+v] : (/\?\s*(-?[\d.]+)\s*:\s*(-?[\d.]+)\s*$/.exec(v) || []).slice(1).map(Number));
    let calls = 0;
    for (const m of s.matchAll(CALL)) {
      calls++;
      const a = m[2].replace(/\s+/g, ''), b = m[3].replace(/\s+/g, '');
      // addOp(p, t, n): t's regard of you; addOp(ru, p, n): the ruler's
      const t = a === 'p' ? target(b) : b === 'p' && m[1] === 'addOp' ? target(a) : undefined;
      if (!t) return null;
      const vs = val(m[4]);
      if (!vs.length) return null;
      for (const v of vs) add(t.key, t.name, v);
    }
    // every call read, or none of this is to be trusted
    if (calls !== (s.match(CALLS) || []).length) return null;
    // the scene's person, moved by them: { op } (fx, eff, apply, more, A.applyFx ... with the scene's ctx)
    for (const m of s.matchAll(/\bthem\s*:\s*\{[^}]*?\bop\s*:\s*(-?[\d.]+)/g)) { if (empty) return null; add('ctx:pid', person('pid'), +m[1]); }
    for (const m of s.matchAll(/\brel\s*:\s*\{\s*who\s*:\s*["'](\w+)["']\s*,\s*op\s*:\s*(-?[\d.]+)/g)) add('kin:' + m[1], kinWho(pc, [m[1]], true) || null, +m[2]);
    for (const m of s.matchAll(/\bnewRel\s*:\s*\{\s*type\s*:\s*["'](\w+)["']\s*,\s*op\s*:\s*(-?[\d.]+)/g)) add('new:' + m[1], `your new ${m[1] === 'mentor' ? 'teacher' : m[1]}'s regard`, +m[2]);
    return [...seen.values()];
  };
  // the same, as chip parts ("▲ Corbin's regard", "▼▼ Brand's regard", "▲ or ▼ Isobel's regard"): [] when the code
  // moves no one's regard here, null when it cannot tell
  const partOf = e => `${e.up && e.down ? '▲ or ▼' : e.up ? (e.big ? '▲▲' : '▲') : (e.big ? '▼▼' : '▼')} ${e.name}`;
  C2.regardParts = function (fx, q, pc) {
    const r = C2.regardTargets(fx, q, pc);
    return r ? r.filter(e => e.name && (e.up || e.down)).map(partOf) : null;
  };
  // an effect's rel: { who, op } as a chip part ("▼ your father's regard"), or null when it reaches no one here
  C2.relPart = function (fx, pc) {
    const rl = fx && typeof fx === 'object' && fx.rel && typeof fx.rel === 'object' ? fx.rel : null;
    if (!rl || !rl.who || typeof rl.op !== 'number' || !rl.op) return null;
    const w = kinWho(pc, [String(rl.who)], !rl.all);
    if (!w) return null;
    const big = Math.abs(rl.op) >= 20;
    return { op: rl.op, t: `${rl.op > 0 ? (big ? '▲▲' : '▲') : (big ? '▼▼' : '▼')} ${w}` };
  };
  // a chip's regard part, in any of its forms ("▲ their regard", "• regard", "▼▼ regard")
  const RG_PART = /^(?:[▲▼]+ |• )?(?:their )?regard$/;
  // the same, with a second messmate's from op2 (f-risk's "{m2}'s regard"): a regard no one has been named for yet
  const RG_ANY = /^(?:[▲▼]+ (?:or ▼ )?|• )?(?:their |\{m[23]\}'s )?regard$/, PREFIX = /^(If it (?:works|fails): |Fails: )([\s\S]*)$/;
  // a chip without the regard parts that reach nobody; null when nothing is left
  C2.dropRegard = function (t) {
    const m = /^(If it (?:works|fails): |Fails: )([\s\S]*)$/.exec(t);
    if (!m) return RG_PART.test(t) ? null : t;
    const parts = m[2].split(', ').filter(x => !RG_PART.test(x));
    return parts.length ? m[1] + parts.join(', ') : null;
  };

  if (ST && typeof ST.choiceChips === 'function') {
    const chips0 = ST.choiceChips;
    ST.choiceChips = function (c, e, q, pc, vc) {
      const chips = chips0.apply(this, arguments);
      try {
        if (!c || typeof c !== 'object') return chips;
        const t = q && q.ctx && q.ctx.pid && A.P(q.ctx.pid);
        const fxOf = ch => (ch.k === 'win' ? c.win && c.win.fx : ch.k === 'risk' ? c.lose && c.lose.fx : c.fx);
        // (a sure effect shows its regard once: the chips 9998 made for it, "▼ their regard" and "▲ {m2}'s regard", are
        // one list of the people it moves)
        const named = new Set();
        for (const ch of chips) {
          if (typeof ch.t !== 'string') continue;
          // whose regard, person by person (playtest 2, old 18: "• changes regard" named nobody; the third round: the
          // name is the target the code moves, and the way is that target's own): "▲ Gerda's regard, ▼ your mother's
          // regard". A regard that reaches nobody goes. What a failed check costs lists only what goes down.
          let done = false;
          if (/\bregard\b/.test(ch.t)) {
            const fx = fxOf(ch), m = PREFIX.exec(ch.t), pre = m ? m[1] : '', parts = (m ? m[2] : ch.t).split(', ');
            const at = parts.findIndex(x => RG_ANY.test(x)), T = at >= 0 ? C2.regardTargets(fx, q, pc) : null;
            if (T) {
              done = true;
              const sure = ch.k !== 'win' && ch.k !== 'risk';
              let repl = sure && named.has(fx) ? [] : T.filter(x => x.name && (x.up || x.down)).map(partOf);
              if (sure) named.add(fx);
              if (ch.k === 'risk') repl = repl.filter(x => !/^▲+ (?!or)/.test(x));
              const rest = parts.filter(x => !RG_ANY.test(x));
              rest.splice(Math.min(at, rest.length), 0, ...repl);
              if (!rest.length) {
                if (ch.k === 'risk') { ch.k = 'safe'; ch.t = 'Nothing lost if it fails'; delete ch.fail; } else ch.gone = true;
                continue;
              }
              ch.t = pre + rest.join(', ');
              if (!pre && sure && ['touch', 'gain', 'cost'].includes(ch.k) && rest.every(x => /regard$/.test(x))) ch.k = rest.every(x => /^▲+ (?!or)/.test(x)) ? 'gain' : rest.every(x => /^▼/.test(x)) ? 'cost' : 'touch';
            }
          }
          // (a target the code does not say plainly: the person the scene's code names, as C2.regardWho reads it)
          const who = !done && /\bregard\b/.test(ch.t) ? C2.regardWho(fxOf(ch), q, pc) : null;
          if (who === '') { const t2 = C2.dropRegard(ch.t); if (t2 === null) { ch.gone = true; continue; } ch.t = t2; }
          // which way a code effect goes
          const sg = C2.signs(fxOf(ch));
          ch.t = ch.t.replace(SIGN_RX, (all, w) => (sg[w] ? `${sg[w] > 0 ? '▲' : '▼'} ${w}` : all));
          // a word whose every number is nought changes nothing: it goes (du_cm_clerk_wanted's "Take the post" read
          // "• standing in the ranks" from the new post's own record, merit: 0; the post itself is shown below)
          if (Object.values(sg).some(x => x === 0)) {
            const m = /^(If it (?:works|fails): |Fails: )([\s\S]*)$/.exec(ch.t);
            const rest = (m ? m[2] : ch.t).split(', ').filter(x => { const k = /^• (.+)$/.exec(x); return !(k && sg[k[1]] === 0); });
            if (!rest.length) { ch.gone = true; continue; }
            ch.t = (m ? m[1] : '') + rest.join(', ');
          }
          if (ch.k === 'touch' && /^[▲▼]/.test(ch.t)) ch.k = /^▲/.test(ch.t) ? 'gain' : 'cost';
          // what a failed check costs is a loss: the regard it names goes down ("If it fails: hurt, ▼ Edith's regard")
          // (a failure that still raises something, "Fails: ▲ regard" in red, reads as a contradiction: it is no loss,
          // so it is not listed among the losses)
          if (ch.k === 'risk' && /^If it fails: /.test(ch.t)) {   // (a sure choice's "Starts a fight" is no failure)
            const parts = ch.t.replace(/^If it fails: /, '').split(', ').filter(x => !/^▲/.test(x));
            if (!parts.length) { ch.k = 'safe'; ch.t = 'Nothing lost if it fails'; delete ch.fail; }
            else ch.t = 'If it fails: ' + parts.join(', ').replace(/(^|, )(their regard)\b/g, '$1▼ $2');
          }
          if (who) ch.t = ch.t.replace(/\btheir regard\b/g, who).replace(/• regard\b/g, '• ' + who).replace(/([▲▼]+) regard\b/g, `$1 ${who}`);
          // a regard with no way: read person by person (two people moved opposite ways, or a chance either way)
          if (!done && /(^|, |: )• [^,]*regard\b/.test(ch.t)) {
            const parts = C2.regardParts(fxOf(ch), q, pc);
            if (parts && parts.length) {
              ch.t = ch.t.replace(/• [^,]*regard\b/, parts.join(', '));
              const up = parts.every(x => /^▲/.test(x) && !/ or ▼/.test(x)), down = parts.every(x => /^▼/.test(x));
              if (ch.k === 'touch' && (up || down)) ch.k = up ? 'gain' : 'cost';
            } else if (parts) {
              const m = /^(If it (?:works|fails): |Fails: )([\s\S]*)$/.exec(ch.t);
              const rest = (m ? m[2] : ch.t).split(', ').filter(x => !/^• [^,]*regard$/.test(x));
              if (!rest.length) ch.gone = true; else ch.t = (m ? m[1] : '') + rest.join(', ');
            }
          }
        }
        // (a chip whose regard reached no one goes; two families read as the same person's regard show once)
        for (let i = chips.length - 1; i >= 0; i--) if (chips[i] && (chips[i].gone || chips.findIndex(x => x.t === chips[i].t) < i)) chips.splice(i, 1);
        // kin's regard written as data (rel: { who: "father", op: -4 }): 255 choices moved it and showed nothing of it
        // ("If it fails: hurt" for a dare that also costs your father's regard). Shown by name and way, where that kin is.
        for (const side of ['fx', 'win', 'risk']) {
          const fx = side === 'fx' ? (!c.check && !c.group ? c.fx : null) : side === 'win' ? c.win && c.win.fx : c.lose && c.lose.fx;
          const r = C2.relPart(fx, pc);
          if (!r || (side === 'risk' && r.op > 0)) continue;
          const name = r.t.replace(/^[▲▼]+ /, '');
          if (side === 'fx') { if (!chips.some(x => x.t.includes(name) && !/^If it/.test(x.t))) chips.push({ k: r.op > 0 ? 'gain' : 'cost', t: r.t }); continue; }
          const k = side === 'win' ? 'win' : 'risk', ch = chips.find(x => x.k === k);
          if (ch) { if (!ch.t.includes(name)) ch.t += ', ' + r.t; continue; }
          const safe = side === 'risk' ? chips.findIndex(x => x.k === 'safe') : -1;
          if (safe >= 0) chips[safe] = { k: 'risk', t: 'If it fails: ' + r.t };
          else if (side === 'win') chips.unshift({ k: 'win', t: 'If it works: ' + r.t });
          else chips.push({ k: 'risk', t: 'If it fails: ' + r.t });
        }
        // a new post set in code (p.job = { c: "scribe", ... }), as 9998 shows job: written as data
        if (!c.check && !c.group && typeof c.fx === 'function' && /\bp\.job\s*=\s*\{/.test(C2.srcAll(c.fx)) && !chips.some(x => /a new post/.test(x.t))) chips.push({ k: 'gain', t: '▲ ' + ((ST.KEY && ST.KEY.job && ST.KEY.job.w) || 'a new post') });
        // the drill scenes' code effects
        if (!c.check && !c.group) for (const x of C2.unitChips(c.fx)) if (chips.length < 4) chips.push(x);
        if ((c.check || c.group)) {
          const w = C2.unitChips(c.win && c.win.fx);
          if (w.length && !chips.some(x => x.k === 'win')) chips.unshift({ k: 'win', t: 'If it works: ' + w.map(x => x.t).join(', ') });
        }
        // every choice shows something
        if (!chips.length) {
          if (c.check || c.group) chips.push({ k: 'safe', t: 'Nothing lost if it fails' });
          else if (hasHidden(c.fx)) chips.push({ k: 'note', t: 'It will be remembered' });
          else if (isEmpty(c.fx)) chips.push({ k: 'note', t: 'Nothing changes' });
          else chips.push({ k: 'note', t: 'It will be remembered' });
        }
      } catch (err) { console.error('v2 content chips', err); }
      return chips;
    };
  }

  // ---- a scene with one live choice is not shown ------------------------------------------------------------------------
  // (the view is built by A.headReady, an engine step; a dropped scene is shifted off the queue there)
  // A scene is dropped only when the one choice left is a way out that changes nothing (the old scholar's "You cannot
  // afford it"). One real choice beside choices out of reach (an arc's opening: "Go yourself for a season", the paid
  // ways shown with their price) or a finale whose other endings belong to other paths ("Take charge of the new fire
  // watch") is the scene working as written, and dropping it starved 46's and 52's arcs (lint, CI run 88).
  C2.isWayOut = c => !!c && !c.check && !c.event && !c.duel && !c.fight && (!c.fx || (typeof c.fx === 'object' && !Object.keys(c.fx).length));
  C2.oneLive = function (q, v) {
    const e = q && A.EV[q.ev];
    if (!e || !v || v.skip || !Array.isArray(e.choices) || e.choices.length < 2 || !Array.isArray(v.choices)) return false;
    const live = v.choices.filter(x => x && x.i >= 0);
    return live.length === 0 || (live.length === 1 && C2.isWayOut(e.choices[live[0].i]));
  };
  const view0 = A.eventView;
  A.eventView = function (q) {
    const fresh = !!q && q.type === 'event' && !q.view;
    const v = view0.apply(this, arguments);
    try {
      if (fresh && v && !v.skip && q.view === v && !q.result && C2.oneLive(q, v)) { v.skip = true; q.ctx = q.ctx || {}; q.ctx.skip = 1; C2.dropped = (C2.dropped || 0) + 1; }   // declined on purpose, as a setup's ctx.skip
      // one extra line a card: a memory or counsel speaks, the world's recalled line (57) gives way
      if (fresh && v && !v.skip && v.recall && ((v.adv && v.adv.length) || (q.ctx && q.ctx.mw && !q.ctx.mw.off && q.ctx.mw.ev === q.ev))) delete v.recall;
    } catch (err) { console.error('v2 content view', err); }
    return v;
  };

  try {
    const st = document.createElement('style');
    // the who line; and the creation screen's story blurbs in full (29-starts clamped them to two lines on a phone:
    // "Something took your father on the fells last winter. Nobody agree...")
    st.textContent = '.ev-who{margin-top:6px;color:var(--ink-2,inherit);font-family:var(--f-ui,inherit)}' +
      '.crq .crq-story .small{display:block!important;-webkit-line-clamp:unset!important;line-clamp:unset!important;overflow:visible!important}';
    document.head.appendChild(st);
  } catch (e) {}
})();
