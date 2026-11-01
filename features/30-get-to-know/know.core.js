// "Get to know" as a scene (Road to Ten, Relationships 7). The release settled a first meeting with one hidden dice
// roll. Now it is a short scene with four approaches: ask about them, tell a story of your own, offer help with their
// trouble, or keep it short and proper. Each person's traits make some approaches easier and some harder, the odds are
// shown, and a sharp eye (insight) reads which way to go before you choose.
//
// Engine: A.getToKnow keeps its checks and its cost, then queues the scene instead of rolling (the command is in the
// journal, so a replay queues the same scene). A check's difficulty can lean on the scene: check.dctx names a ctx key
// whose number is added to d (A.checkOdds reads the head of the queue). Rendering only reads.
(function () {
  const hash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const pick = (arr, key) => arr[hash(key) % arr.length];
  const K = A.KNOW = {};
  // which traits like (+) and dislike (-) each approach
  K.FIT = {
    ask: { like: ['gregarious', 'proud', 'ambitious', 'vain', 'zealous'], dislike: ['paranoid', 'shy', 'deceitful'] },
    story: { like: ['gregarious', 'witty', 'curious', 'romantic', 'impetuous'], dislike: ['proud', 'cynical', 'stoic'] },
    help: { like: ['greedy', 'trusting', 'kind', 'generous', 'humble'], dislike: ['proud', 'stubborn', 'paranoid'] },
    proper: { like: ['proud', 'honorable', 'just', 'shy', 'paranoid', 'patient'], dislike: ['gregarious', 'impetuous', 'reckless'] },
  };
  K.fit = (t, k) => { const f = K.FIT[k], tr = (t && t.traits) || []; return tr.filter(x => f.like.includes(x)).length - tr.filter(x => f.dislike.includes(x)).length; };
  const SAYS = {
    ask: ['likes to talk about {his} own affairs', 'wants to be asked'],
    story: ['warms to a good story', 'is bored and would like not to be'],
    help: ['has a trouble {he} would take help with', 'is worried about something, and it shows'],
    proper: ['sets great store by manners', 'does not like to be rushed'],
  };
  const NOT = { ask: 'does not care to be questioned', story: 'has no patience for tales', help: 'would be insulted by an offer of help', proper: 'finds stiff manners cold' };
  const TROUBLE = {
    low: ['a debt that has come due', 'a roof that will not last the winter', 'a dispute with a neighbour over a wall', 'a horse gone lame before the market', 'a son who will not settle to any trade'],
    mid: ['a debt that has come due', 'a guild matter going badly', 'a lawsuit over a boundary', 'a partner who has stopped paying', 'a daughter to marry and no dowry'],
    high: ['a lawsuit that has dragged on two years', 'a marriage to arrange that no one wants', 'a rival at court who is winning', 'a steward suspected of stealing'],
  };
  const DOING = {
    low: ['mending a net', 'arguing with a carter', 'eating bread on a doorstep', 'counting eggs into a basket', 'resting in the shade of a wall'],
    mid: ['going over an account book', 'haggling over a bolt of cloth', 'waiting outside the guildhall', 'buying wine', 'reading a letter twice'],
    high: ['walking in a garden with a secretary', 'watching the hawks fly', 'hearing a petition with half an ear', 'dictating a letter'],
  };
  const tier = t => { const c = A.classOf ? A.classOf(t) : 3; return c >= 6 ? 'high' : c >= 4 ? 'mid' : 'low'; };
  const sub = (s, t) => s.replace(/\{he\}/g, A.he(t)).replace(/\{his\}/g, A.his ? A.his(t) : 'their');

  // the scene's setup: everything is decided from the person, and the dice for the trouble only
  K.setup = function (p, ctx) {
    const t = A.P(ctx.pid);
    if (!t || !t.alive || (p.rel && p.rel[t.id])) { ctx.skip = true; return; }
    ctx.khe = A.he(t); ctx.khim = A.him(t); ctx.khis = A.his(t);   // the pronoun tokens
    const tr = tier(t), key = t.id + '|' + A.S.year;
    ctx.doing = pick(DOING[tr], key + 'd');
    ctx.trouble = pick(TROUBLE[tr], key + 't');
    ctx.where = (A.prov(t.home) || A.prov(p.home) || { name: 'the town' }).name;
    // each approach's difficulty: 12 points easier per liked trait, 12 harder per disliked one
    for (const k of Object.keys(K.FIT)) ctx['gk_' + k] = -12 * K.fit(t, k);
    // a class gap makes everything harder, but the proper approach least
    const gap = Math.max(0, (A.classOf ? A.classOf(t) - A.classOf(p) : 0));
    for (const k of Object.keys(K.FIT)) ctx['gk_' + k] += gap * (k === 'proper' ? 3 : 6);
    // a sharp eye reads which way to go: insight 50+ sees the best approach, 70+ the worst as well
    const ins = A.stat(p, 'ins'), ranks = Object.keys(K.FIT).sort((a, b) => ctx['gk_' + a] - ctx['gk_' + b]);
    const name = t.given;
    ctx.read = '';
    if (ins >= 50) {
      const best = ranks[0];
      ctx.read = ` You read ${name} quickly: ${A.he(t)} ${sub(pick(SAYS[best], key + 'r'), t)}`;
      if (ins >= 70 && ctx['gk_' + ranks[3]] > ctx['gk_' + best]) ctx.read += `, and ${sub(NOT[ranks[3]], t)}`;
      ctx.read += '.';
    }
  };
  // the meeting's outcome: link the two, with the opinion this approach earned
  K.meet = function (p, ctx, op, note) {
    const t = A.P(ctx.pid); if (!t) return '';
    const ro = A.roster ? A.roster(p).find(x => x.p.id === t.id) : null;
    const type = ro && ro.grp === 'Under you' ? 'comrade' : ro && ro.grp === 'Above you' ? (ro.role === 'your superior' ? 'superior' : 'acquaint') : ro && ro.grp === 'Your staff' ? 'subordinate' : 'acquaint';
    const back = { comrade: 'comrade', superior: 'subordinate', subordinate: 'superior', acquaint: 'acquaint' }[type];
    A.link(p, t, type, op + (A.has && A.has(t, 'friendly') ? 10 : 0), back);
    if (A.bondNote) A.bondNote(p, t, note);
    return '';
  };

  // a check's difficulty may lean on the scene in progress
  const odds = A.checkOdds;
  A.checkOdds = function (pc, check) {
    if (check && check.dctx) {
      const q = A.S.queue[0], add = q && q.ctx ? +q.ctx[check.dctx] || 0 : 0;
      return odds.call(this, pc, Object.assign({}, check, { d: (check.d || 45) + add }));
    }
    return odds.apply(this, arguments);
  };

  // the action: same checks and cost as before, then the scene
  const base = A.getToKnow;
  A.getToKnow = function (pid) {
    const pc = A.pc(), t = A.P(pid);
    if (!t || !t.alive) return { ok: false, msg: 'They are gone.' };
    if (pc.rel[pid]) return { ok: false, msg: 'You already know them.' };
    if (A.S.time < A.knowCost) return { ok: false, msg: 'Not enough initiative (⧗) yet.' };
    if (!A.EV.gk_meet) return base.apply(this, arguments);
    A.S.time -= A.knowCost;
    A.queue({ type: 'event', ev: 'gk_meet', ctx: { pid } });
    return { ok: true, msg: `You go to find ${t.given}.` };
  };
})();
